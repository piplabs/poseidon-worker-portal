"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingTransactionsModal } from "@/components/pending-transactions-modal";
import { useWithdrawalTransactions } from "@/lib/transaction-tracker";

export function PendingTransactionsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeTransactions, completedTransactions } = useWithdrawalTransactions();
  
  const pendingCount = activeTransactions.length;
  const totalCount = activeTransactions.length + completedTransactions.length;

  // Show tab if there are any active or completed transactions
  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-card/80 backdrop-blur-sm border transition-all duration-200 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <div className="flex items-center space-x-2">
            {pendingCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="font-medium">Pending</span>
            <motion.span
              key={totalCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ${
                pendingCount > 0 
                  ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' 
                  : 'bg-green-500 text-green-900'
              }`}
            >
              {totalCount}
            </motion.span>
          </div>
        </Button>
      </motion.div>

      <PendingTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
