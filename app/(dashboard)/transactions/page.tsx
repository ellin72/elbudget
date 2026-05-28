import TransactionList from "@/components/transactions/TransactionList";

export const metadata = { title: "Transactions – Elbudget" };

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">Track and manage all your income and expenses</p>
      </div>
      <TransactionList />
    </div>
  );
}
