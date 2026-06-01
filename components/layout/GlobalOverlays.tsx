"use client";

import { useUIStore } from "@/store/useUIStore";
import TransactionForm from "@/components/transactions/TransactionForm";

export default function GlobalOverlays() {
  const { transactionModalOpen, setTransactionModalOpen } = useUIStore();

  return (
    <>
      {transactionModalOpen && (
        <TransactionForm onClose={() => setTransactionModalOpen(false)} />
      )}
    </>
  );
}
