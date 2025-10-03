"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWithdrawalTransactions, type TransactionStatus } from "@/lib/transaction-tracker";
import { CHAIN_IDS } from "@/lib/constants";

interface PendingTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get readable status label
function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: 'L2 Transaction Pending',
    l2_confirmed: 'L2 Transaction Confirmed',
    waiting_game: 'Waiting for Dispute Game',
    game_found: 'Dispute Game Found',
    generating_proof: 'Generating Proof',
    proof_generated: 'Proof Generated',
    submitting_proof: 'Submitting Proof to L1',
    proof_submitted: 'Proof Submitted',
    proof_confirmed: 'Proof Confirmed',
    resolving_game: 'Resolving Dispute Game',
    game_resolved: 'Game Resolved',
    finalizing: 'Finalizing Withdrawal',
    completed: 'Completed',
    error: 'Error',
  };
  return labels[status] || status;
}

// Helper function to get status icon
function getStatusIcon(status: TransactionStatus) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (status === 'error') {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
}

// Helper function to get progress percentage
function getProgress(status: TransactionStatus): number {
  const progressMap: Record<TransactionStatus, number> = {
    pending: 5,
    l2_confirmed: 10,
    waiting_game: 20,
    game_found: 30,
    generating_proof: 40,
    proof_generated: 50,
    submitting_proof: 60,
    proof_submitted: 65,
    proof_confirmed: 70,
    resolving_game: 80,
    game_resolved: 90,
    finalizing: 95,
    completed: 100,
    error: 0,
  };
  return progressMap[status] || 0;
}

export function PendingTransactionsModal({ isOpen, onClose }: PendingTransactionsModalProps) {
  const { transactions, activeTransactions, completedTransactions, erroredTransactions } = useWithdrawalTransactions();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'error'>('active');

  const displayTransactions = 
    selectedTab === 'active' ? activeTransactions :
    selectedTab === 'completed' ? completedTransactions :
    erroredTransactions;

  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    // TODO: Update with actual block explorer URLs
    if (chainId === CHAIN_IDS.L1) {
      return `https://poseidon.storyscan.io/tx/${txHash}`;
    }
    return `https://devnet-subnet0.psdnscan.io/tx/${txHash}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-card rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Withdrawal Transactions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setSelectedTab('active')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'active'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({activeTransactions.length})
              </button>
              <button
                onClick={() => setSelectedTab('completed')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'completed'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed ({completedTransactions.length})
              </button>
              <button
                onClick={() => setSelectedTab('error')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'error'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Errors ({erroredTransactions.length})
              </button>
            </div>

            {/* Transaction List */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4 space-y-3">
              {displayTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {selectedTab} transactions</p>
                </div>
              ) : (
                displayTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3 bg-background"
                  >
                    {/* Transaction Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(tx.status)}
                          <span className="font-medium text-sm">
                            {tx.amount} {tx.token}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getStatusLabel(tx.status)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(tx.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {tx.status !== 'error' && tx.status !== 'completed' && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgress(tx.status)}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-yellow-500"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                          {getProgress(tx.status)}% Complete
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {tx.errorMessage && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                        <p className="text-xs text-red-500">{tx.errorMessage}</p>
                      </div>
                    )}

                    {/* Transaction Links */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <a
                        href={getBlockExplorerUrl(tx.l2TxHash, CHAIN_IDS.L2)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        L2 Tx <ExternalLink className="h-3 w-3" />
                      </a>
                      {tx.l1ProofTxHash && (
                        <a
                          href={getBlockExplorerUrl(tx.l1ProofTxHash, CHAIN_IDS.L1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Proof [L1] <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {tx.l1ResolveClaimsTxHash && (
                        <a
                          href={getBlockExplorerUrl(tx.l1ResolveClaimsTxHash, CHAIN_IDS.L1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Claims [L1] <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {tx.l1ResolveGameTxHash && (
                        <a
                          href={getBlockExplorerUrl(tx.l1ResolveGameTxHash, CHAIN_IDS.L1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Game [L1] <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {tx.l1FinalizeTxHash && (
                        <a
                          href={getBlockExplorerUrl(tx.l1FinalizeTxHash, CHAIN_IDS.L1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Finalize [L1] <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
