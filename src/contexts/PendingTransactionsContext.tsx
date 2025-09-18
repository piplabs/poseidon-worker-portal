"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { usePendingTransactions } from '@/hooks/usePendingTransactions';

interface PendingTransactionsContextType {
  pendingTransactions: ReturnType<typeof usePendingTransactions>['pendingTransactions'];
  pendingCount: ReturnType<typeof usePendingTransactions>['pendingCount'];
  addPendingTransaction: ReturnType<typeof usePendingTransactions>['addPendingTransaction'];
  updateTransactionStatus: ReturnType<typeof usePendingTransactions>['updateTransactionStatus'];
  removeTransaction: ReturnType<typeof usePendingTransactions>['removeTransaction'];
  clearCompletedTransactions: ReturnType<typeof usePendingTransactions>['clearCompletedTransactions'];
  forceUpdate: ReturnType<typeof usePendingTransactions>['forceUpdate'];
}

const PendingTransactionsContext = createContext<PendingTransactionsContextType | undefined>(undefined);

export function PendingTransactionsProvider({ children }: { children: ReactNode }) {
  const pendingTransactionsData = usePendingTransactions();

  return (
    <PendingTransactionsContext.Provider value={pendingTransactionsData}>
      {children}
    </PendingTransactionsContext.Provider>
  );
}

export function usePendingTransactionsContext() {
  const context = useContext(PendingTransactionsContext);
  if (context === undefined) {
    throw new Error('usePendingTransactionsContext must be used within a PendingTransactionsProvider');
  }
  return context;
}
