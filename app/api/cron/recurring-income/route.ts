import { NextRequest, NextResponse } from "next/server";
import { syncDueRecurringIncomeForAllUsers } from "@/lib/recurring";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const result = await syncDueRecurringIncomeForAllUsers();

  return NextResponse.json({
    success: true,
    startedAt,
    processedUsers: result.processedUsers,
  });
}
