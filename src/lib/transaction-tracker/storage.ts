// LocalStorage service for tracking withdrawal transactions

import { WithdrawalTransaction, TransactionUpdate, TransactionStatus } from './types';

const STORAGE_KEY = 'bridge_withdrawal_transactions';
const STORAGE_EVENT = 'bridge_storage_update';

// Custom event for cross-tab communication and real-time updates
export const createStorageEvent = () => new CustomEvent(STORAGE_EVENT);

export class TransactionStorage {
  /**
   * Get all transactions from localStorage
   */
  static getAll(): WithdrawalTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a specific transaction by ID
   */
  static getById(id: string): WithdrawalTransaction | null {
    const transactions = this.getAll();
    return transactions.find(tx => tx.id === id) || null;
  }

  /**
   * Get transactions by status
   */
  static getByStatus(status: TransactionStatus): WithdrawalTransaction[] {
    const transactions = this.getAll();
    return transactions.filter(tx => tx.status === status);
  }

  /**
   * Get active (non-completed, non-error) transactions
   */
  static getActive(): WithdrawalTransaction[] {
    const transactions = this.getAll();
    return transactions.filter(tx => 
      tx.status !== 'completed' && tx.status !== 'error'
    );
  }

  /**
   * Create a new transaction
   */
  static create(transaction: Omit<WithdrawalTransaction, 'createdAt' | 'updatedAt'>): WithdrawalTransaction {
    const now = Date.now();
    const newTransaction: WithdrawalTransaction = {
      ...transaction,
      createdAt: now,
      updatedAt: now,
    };

    const transactions = this.getAll();
    transactions.push(newTransaction);
    this.saveAll(transactions);
    this.dispatchUpdateEvent();

    return newTransaction;
  }

  /**
   * Update an existing transaction
   */
  static update(update: TransactionUpdate): WithdrawalTransaction | null {
    const transactions = this.getAll();
    const index = transactions.findIndex(tx => tx.id === update.id);

    if (index === -1) {
      return null;
    }

    const now = Date.now();
    const updatedTransaction: WithdrawalTransaction = {
      ...transactions[index],
      ...update,
      updatedAt: now,
    };

    transactions[index] = updatedTransaction;
    this.saveAll(transactions);
    this.dispatchUpdateEvent();

    return updatedTransaction;
  }

  /**
   * Mark transaction as completed
   */
  static markCompleted(id: string): WithdrawalTransaction | null {
    return this.update({
      id,
      status: 'completed',
      completedAt: Date.now(),
    });
  }

  /**
   * Mark transaction as error
   */
  static markError(id: string, errorMessage: string): WithdrawalTransaction | null {
    return this.update({
      id,
      status: 'error',
      errorMessage,
    });
  }

  /**
   * Delete a transaction
   */
  static delete(id: string): boolean {
    const transactions = this.getAll();
    const filtered = transactions.filter(tx => tx.id !== id);
    
    if (filtered.length === transactions.length) {
      return false; // Transaction not found
    }

    this.saveAll(filtered);
    this.dispatchUpdateEvent();
    return true;
  }

  /**
   * Clear all transactions
   */
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.dispatchUpdateEvent();
  }

  /**
   * Clear only active (pending) transactions, keep completed ones
   */
  static clearActive(): number {
    const transactions = this.getAll();
    const completed = transactions.filter(tx => tx.status === 'completed');
    const removedCount = transactions.length - completed.length;
    
    if (removedCount > 0) {
      this.saveAll(completed);
      this.dispatchUpdateEvent();
    }
    
    return removedCount;
  }

  /**
   * Clear completed transactions older than X days
   */
  static clearOld(daysOld: number = 7): number {
    const transactions = this.getAll();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const filtered = transactions.filter(tx => {
      // Keep if not completed or if completed recently
      if (tx.status !== 'completed') return true;
      return (tx.completedAt || tx.updatedAt) > cutoffTime;
    });

    const removedCount = transactions.length - filtered.length;
    if (removedCount > 0) {
      this.saveAll(filtered);
      this.dispatchUpdateEvent();
    }

    return removedCount;
  }

  /**
   * Save all transactions to localStorage
   */
  private static saveAll(transactions: WithdrawalTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      // Error silently ignored
    }
  }

  /**
   * Dispatch custom event to notify listeners of updates
   */
  private static dispatchUpdateEvent(): void {
    window.dispatchEvent(createStorageEvent());
  }

  /**
   * Subscribe to storage updates
   */
  static subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(STORAGE_EVENT, handler);
    
    // Also listen to storage events from other tabs
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback();
      }
    };
    window.addEventListener('storage', storageHandler);

    // Return unsubscribe function
    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  }
}

