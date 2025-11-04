"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PendingTransactionsModal } from "@/components/pending-transactions-modal";
import { useWithdrawalTransactions, type WithdrawalTransaction } from "@/lib/transaction-tracker";

interface PendingTransactionsTabProps {
  onSelectTransaction?: (transaction: WithdrawalTransaction) => void;
}

export function PendingTransactionsTab({ onSelectTransaction }: PendingTransactionsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeTransactions, completedTransactions } = useWithdrawalTransactions();
  
  const pendingCount = activeTransactions.length;

  // Only show tab when there are pending transactions
  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-3 pl-3 pr-4 py-2.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 hover:from-yellow-500/30 hover:to-orange-500/20 rounded-xl transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500/40 shadow-lg hover:shadow-xl overflow-hidden"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-center gap-3">
            {/* Spinning loader */}
            <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
            
            {/* Pending text */}
            <span className="text-sm font-semibold text-yellow-100">Pending</span>
            
            {/* Count badge */}
            <motion.div
              key={pendingCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-yellow-500/30 rounded-lg border border-yellow-400/40"
            >
              <span className="text-xs font-bold text-yellow-200 tabular-nums">
                {pendingCount}
              </span>
            </motion.div>
          </div>
        </button>
      </motion.div>

      <PendingTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectTransaction={onSelectTransaction}
      />
    </>
  );
}
