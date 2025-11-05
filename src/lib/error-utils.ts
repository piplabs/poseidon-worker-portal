/**
 * Utility functions for error handling
 */

/**
 * Check if an error is a user rejection/cancellation from MetaMask or other wallets
 * @param error - The error to check
 * @returns true if the error is a user cancellation, false otherwise
 */
export function isUserRejectedError(error: unknown): boolean {
  if (!error) return false;

  // Type guard for error objects
  const err = error as { message?: string; code?: number | string; cause?: { message?: string }; name?: string };

  // Convert error to string for checking
  const errorMessage = err?.message?.toLowerCase() || '';
  const errorCode = err?.code;
  const errorCause = err?.cause?.message?.toLowerCase() || '';

  // Common user rejection patterns from different wallet providers
  const rejectionPatterns = [
    'user rejected',
    'user denied',
    'user cancelled',
    'user canceled',
    'rejected by user',
    'denied by user',
    'cancelled by user',
    'canceled by user',
    'user disapproved',
    'user declined',
    'transaction was rejected',
    'transaction was cancelled',
    'transaction was canceled',
    'request rejected',
    'request cancelled',
    'request canceled',
    'rejected the request',
    'cancelled the request',
    'canceled the request',
    'user rejected the request',
    'user denied transaction signature'
  ];

  // Check if the error message contains any rejection pattern
  const isRejectionMessage = rejectionPatterns.some(pattern =>
    errorMessage.includes(pattern) || errorCause.includes(pattern)
  );

  // Check for common error codes
  // 4001 is the standard EIP-1193 error code for user rejection
  // ACTION_REJECTED is used by ethers.js
  const isRejectionCode = errorCode === 4001 ||
                          errorCode === 'ACTION_REJECTED' ||
                          err?.code === 'ACTION_REJECTED';

  // Check for viem/wagmi specific error names
  const isViemRejection = err?.name === 'UserRejectedRequestError' ||
                          err?.name === 'UserRejectedError';

  return isRejectionMessage || isRejectionCode || isViemRejection;
}

/**
 * Format error message for display to user
 * Returns null for user-cancelled transactions (shouldn't display error)
 * @param error - The error to format
 * @returns Formatted error message or null
 */
export function formatTransactionError(error: unknown): string | null {
  // Don't display errors for user-cancelled transactions
  if (isUserRejectedError(error)) {
    return null;
  }

  // Type guard for error objects
  const err = error as { shortMessage?: string; message?: string };

  // Handle different error types
  if (err?.shortMessage) {
    return err.shortMessage;
  }

  if (err?.message) {
    // Clean up technical error messages
    const message = err.message;

    // Remove technical prefixes
    const cleanedMessage = message
      .replace(/^Error: /, '')
      .replace(/^TransactionExecutionError: /, '')
      .replace(/^ContractFunctionExecutionError: /, '');

    // Truncate very long messages
    if (cleanedMessage.length > 200) {
      return cleanedMessage.substring(0, 200) + '...';
    }

    return cleanedMessage;
  }

  return 'Transaction failed. Please try again.';
}

/**
 * Log error to console only if it's not a user cancellation
 * @param context - Context string for the error (e.g., "Bridge IP")
 * @param error - The error to log
 */
export function logTransactionError(context: string, error: unknown): void {
  if (!isUserRejectedError(error)) {
    console.error(`❌ ${context}:`, error);
  } else {
    console.log(`ℹ️ ${context}: User cancelled the transaction`);
  }
}