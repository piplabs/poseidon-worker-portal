import { useState, useEffect, useCallback, useRef } from 'react';

export interface PendingTransaction {
  id: string;
  type: 'L2_TO_L1_PSDN';
  fromToken: string;
  toToken: string;
  amount: string;
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
}

const STORAGE_KEY = 'bridge_pending_transactions';

export function usePendingTransactions() {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPendingTransactions(parsed);
      }
    } catch (error) {
      console.error('Failed to load pending transactions:', error);
    }
  }, []);

  // Save to localStorage whenever pendingTransactions changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingTransactions));
    } catch (error) {
      console.error('Failed to save pending transactions:', error);
    }
  }, [pendingTransactions]);

  const addPendingTransaction = useCallback((transaction: Omit<PendingTransaction, 'id' | 'timestamp' | 'status'>) => {
    const newTransaction: PendingTransaction = {
      ...transaction,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
    };
    
    setPendingTransactions(prev => [newTransaction, ...prev]);
    
    // Force re-render
    setForceUpdate(prev => prev + 1);
    
    return newTransaction.id;
  }, [forceUpdate]);

  const updateTransactionStatus = useCallback((id: string, status: 'completed' | 'failed', txHash?: string) => {
    setPendingTransactions(prev => 
      prev.map(tx => 
        tx.id === id 
          ? { ...tx, status, txHash: txHash || tx.txHash }
          : tx
      )
    );
    setForceUpdate(prev => prev + 1);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setPendingTransactions(prev => prev.filter(tx => tx.id !== id));
    setForceUpdate(prev => prev + 1);
  }, []);

  const clearCompletedTransactions = useCallback(() => {
    setPendingTransactions(prev => prev.filter(tx => tx.status === 'pending'));
    setForceUpdate(prev => prev + 1);
  }, []);

  const pendingCount = pendingTransactions.filter(tx => tx.status === 'pending').length;

  return {
    pendingTransactions,
    pendingCount,
    addPendingTransaction,
    updateTransactionStatus,
    removeTransaction,
    clearCompletedTransactions,
    forceUpdate, // For debugging
  };
}
