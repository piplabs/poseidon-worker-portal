"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, CheckCircle2, Loader2, XCircle, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWithdrawalTransactions, type TransactionStatus, TransactionStorage } from "@/lib/transaction-tracker";
import { CHAIN_IDS } from "@/lib/constants";

import type { WithdrawalTransaction } from "@/lib/transaction-tracker";

interface PendingTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction?: (transaction: WithdrawalTransaction) => void;
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
    waiting_proof_signature: 'Waiting for Proof Signature',
    proof_submitted: 'Proof Submitted to L1',
    proof_confirmed: 'Proof Confirmed on L1',
    waiting_resolve_signature: 'Waiting for Resolve Claims Signature',
    resolving_claims: 'Resolving Claims',
    claims_resolved: 'Claims Resolved',
    waiting_resolve_game_signature: 'Waiting for Resolve Game Signature',
    resolving_game: 'Resolving Dispute Game',
    game_resolved: 'Game Resolved on L1',
    waiting_finalize_signature: 'Waiting for Finalize Signature',
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
  return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
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
    waiting_proof_signature: 55,
    proof_submitted: 60,
    proof_confirmed: 65,
    waiting_resolve_signature: 68,
    resolving_claims: 70,
    claims_resolved: 72,
    waiting_resolve_game_signature: 74,
    resolving_game: 76,
    game_resolved: 85,
    waiting_finalize_signature: 90,
    finalizing: 95,
    completed: 100,
    error: 0,
  };
  return progressMap[status] || 0;
}

export function PendingTransactionsModal({ isOpen, onClose, onSelectTransaction }: PendingTransactionsModalProps) {
  const { activeTransactions, completedTransactions } = useWithdrawalTransactions();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

  const displayTransactions = 
    selectedTab === 'active' ? activeTransactions : completedTransactions;

  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    // TODO: Update with actual block explorer URLs
    if (chainId === CHAIN_IDS.L1) {
      return `https://poseidon.storyscan.io/tx/${txHash}`;
    }
    return `https://devnet-proteus.psdnscan.io/tx/${txHash}`;
  };

  const handleClearActive = () => {
    // Clear only active (pending) transactions, keep completed ones
    TransactionStorage.clearActive();
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
              <h2 className="text-lg font-semibold">Transactions</h2>
              <div className="flex items-center gap-2">
                {activeTransactions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearActive}
                    className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Pending
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
            </div>

            {/* Transaction List */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4 space-y-2">
              {displayTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No {selectedTab} transactions</p>
                </div>
              ) : (
                displayTransactions.map((tx) => {
                  const isL2ToL1 = tx.type === 'L2_TO_L1';
                  // Only L2_TO_L1 transactions are clickable (to open withdrawal steps modal)
                  const isClickable = isL2ToL1;

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative border border-gray-800/50 rounded-md px-3 py-2 bg-gray-900/30 transition-all ${
                        isClickable
                          ? 'cursor-pointer hover:bg-gray-800/40 hover:border-gray-700/60'
                          : ''
                      }`}
                      onClick={() => {
                        if (isClickable && onSelectTransaction) {
                          onSelectTransaction(tx);
                          onClose();
                        }
                      }}
                    >
                      {/* Main Content */}
                      <div className="flex items-center gap-2.5">
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(tx.status)}
                        </div>
                        
                        {/* Amount + Token */}
                        <span className="font-semibold text-sm text-white flex-shrink-0">
                          {tx.amount} {tx.token}
                        </span>

                        {/* Type Badge */}
                        <div className="flex-shrink-0">
                          {tx.type === 'L1_TO_L2' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 font-medium">
                              <span className="text-blue-400">L1</span>
                              <span className="mx-0.5 text-gray-500">→</span>
                              <span className="text-purple-400">L2</span>
                            </span>
                          ) : tx.type === 'L2_TO_L1' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 font-medium">
                              <span className="text-purple-400">L2</span>
                              <span className="mx-0.5 text-gray-500">→</span>
                              <span className="text-blue-400">L1</span>
                            </span>
                          ) : tx.type === 'MINT' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 font-medium">
                              Mint
                            </span>
                          ) : tx.type === 'STAKE_REGISTER' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                              Register
                            </span>
                          ) : tx.type === 'STAKE_UNSTAKE_REQUEST' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30 font-medium">
                              Unstake
                            </span>
                          ) : tx.type === 'STAKE_WITHDRAW' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 font-medium">
                              Withdraw
                            </span>
                          ) : tx.type === 'STAKE_CLAIM_REWARDS' ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30 font-medium">
                              Claim
                            </span>
                          ) : null}
                        </div>

                        {/* Spacer */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 truncate">
                            {getStatusLabel(tx.status)}
                          </p>
                        </div>

                        {/* Time + Explorer Link */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-gray-600">
                            {new Date(tx.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* Show explorer link based on transaction type */}
                          {((tx.type === 'L1_TO_L2' || tx.type === 'MINT') && tx.l1TxHash) && (
                            <a
                              href={getBlockExplorerUrl(tx.l1TxHash, CHAIN_IDS.L1)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {(tx.type === 'L2_TO_L1' || tx.type === 'STAKE_REGISTER' || tx.type === 'STAKE_UNSTAKE_REQUEST' || tx.type === 'STAKE_WITHDRAW' || tx.type === 'STAKE_CLAIM_REWARDS') && tx.l2TxHash && (
                            <a
                              href={getBlockExplorerUrl(tx.l2TxHash, CHAIN_IDS.L2)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {tx.status !== 'error' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/50 overflow-hidden rounded-b-md">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgress(tx.status)}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-gray-600/60 to-gray-500/60"
                          />
                        </div>
                      )}

                      {/* Error Indicator */}
                      {tx.errorMessage && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/60 rounded-b-md" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
