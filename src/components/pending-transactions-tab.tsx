"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingTransactionsModal } from "@/components/pending-transactions-modal";
import { usePendingTransactionsContext } from "@/contexts/PendingTransactionsContext";

export function PendingTransactionsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pendingCount, pendingTransactions } = usePendingTransactionsContext();

  if (pendingCount === 0) {
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
          className="bg-card/80 backdrop-blur-sm border-2 border-yellow-400/50 hover:border-yellow-400/80 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="font-medium">Pending</span>
            <motion.span
              key={pendingCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
            >
              {pendingCount}
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
