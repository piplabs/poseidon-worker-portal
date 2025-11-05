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
  const hasPending = pendingCount > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className={`group relative flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl overflow-hidden ${
            hasPending
              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 hover:from-yellow-500/30 hover:to-orange-500/20 border border-yellow-500/30 hover:border-yellow-500/40'
              : 'bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50'
          }`}
        >
          {/* Subtle gradient overlay */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            hasPending
              ? 'bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0'
              : 'bg-gradient-to-r from-gray-500/0 via-gray-500/5 to-gray-500/0'
          }`} />
          
          <div className="relative flex items-center gap-3">
            {/* Spinning loader for pending, clock icon otherwise */}
            {hasPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
            ) : (
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            
            {/* Text */}
            <span className={`text-sm font-semibold ${hasPending ? 'text-yellow-100' : 'text-gray-300'}`}>
              {hasPending ? 'Pending' : 'Transactions'}
            </span>
            
            {/* Count badge - only show if pending */}
            {hasPending && (
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
            )}
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
