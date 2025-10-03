// React hook for tracking withdrawal transactions

import { useState, useEffect, useCallback } from 'react';
import { TransactionStorage } from './storage';
import { WithdrawalTransaction, TransactionStatus } from './types';

export function useWithdrawalTransactions() {
  const [transactions, setTransactions] = useState<WithdrawalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from localStorage
  const loadTransactions = useCallback(() => {
    const allTransactions = TransactionStorage.getAll();
    setTransactions(allTransactions);
    setIsLoading(false);
  }, []);

  // Subscribe to storage updates
  useEffect(() => {
    // Initial load
    loadTransactions();

    // Subscribe to updates
    const unsubscribe = TransactionStorage.subscribe(() => {
      loadTransactions();
    });

    return unsubscribe;
  }, [loadTransactions]);

  // Get active transactions (not completed or errored)
  const activeTransactions = transactions.filter(
    tx => tx.status !== 'completed' && tx.status !== 'error'
  );

  // Get completed transactions
  const completedTransactions = transactions.filter(
    tx => tx.status === 'completed'
  );

  // Get errored transactions
  const erroredTransactions = transactions.filter(
    tx => tx.status === 'error'
  );

  // Get transactions by status
  const getByStatus = useCallback((status: TransactionStatus) => {
    return transactions.filter(tx => tx.status === status);
  }, [transactions]);

  // Get transaction by ID
  const getById = useCallback((id: string) => {
    return transactions.find(tx => tx.id === id) || null;
  }, [transactions]);

  return {
    transactions,
    activeTransactions,
    completedTransactions,
    erroredTransactions,
    isLoading,
    getByStatus,
    getById,
    refresh: loadTransactions,
  };
}

