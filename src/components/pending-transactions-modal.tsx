"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePendingTransactionsContext } from "@/contexts/PendingTransactionsContext";
import { formatUnits } from "viem";
import { TOKEN_DECIMALS } from "@/lib/constants";

interface PendingTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PendingTransactionsModal({ isOpen, onClose }: PendingTransactionsModalProps) {
  const { pendingTransactions, removeTransaction, clearCompletedTransactions } = usePendingTransactionsContext();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatAmount = (amount: string) => {
    try {
      const formatted = formatUnits(BigInt(amount), TOKEN_DECIMALS);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return amount;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const completedCount = pendingTransactions.filter(tx => tx.status !== 'pending').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <Card className="bg-card border rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Pending Transactions</h2>
                  <p className="text-sm text-muted-foreground">
                    {pendingTransactions.length} total transactions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {pendingTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending transactions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTransactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium">
                              {transaction.fromToken} → {transaction.toToken}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatAmount(transaction.amount)} {transaction.fromToken}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(transaction.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            transaction.status === 'pending' ? 'text-yellow-600' :
                            transaction.status === 'completed' ? 'text-green-600' :
                            'text-red-600'
                          }`}>
                            {getStatusText(transaction.status)}
                          </span>
                          
                          {transaction.txHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(`https://poseidon.storyscan.io/tx/${transaction.txHash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeTransaction(transaction.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {completedCount > 0 && (
                <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                  <span className="text-sm text-muted-foreground">
                    {completedCount} completed transactions
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompletedTransactions}
                  >
                    Clear Completed
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
