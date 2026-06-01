import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { mapStripePriceToPlan, setSubscriptionFromStripe } from "@/lib/services/subscription.service";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function toDate(seconds?: number | null) {
  if (!seconds) return null;
  return new Date(seconds * 1000);
}

function mapStatus(status: string) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INACTIVE";
    default:
      return "ACTIVE";
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription) {
          await setSubscriptionFromStripe({
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            status: "ACTIVE",
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        await setSubscriptionFromStripe({
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          plan: mapStripePriceToPlan(priceId),
          status: mapStatus(subscription.status),
          currentPeriodStart: toDate(subscription.current_period_start),
          currentPeriodEnd: toDate(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: toDate(subscription.trial_end),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await setSubscriptionFromStripe({
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          plan: "FREE",
          status: "CANCELED",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: true,
          trialEnd: null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: String(invoice.customer) },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: "PAST_DUE" },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: String(invoice.customer) },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: "ACTIVE" },
            });
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
