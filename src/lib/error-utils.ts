/**
 * Utility functions for error handling
 */

/**
 * Check if an error is a user rejection/cancellation from MetaMask or other wallets
 * @param error - The error to check
 * @returns true if the error is a user cancellation, false otherwise
 */
export function isUserRejectedError(error: any): boolean {
  if (!error) return false;

  // Convert error to string for checking
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code;
  const errorCause = error?.cause?.message?.toLowerCase() || '';

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
                          error?.code === 'ACTION_REJECTED';

  // Check for viem/wagmi specific error names
  const isViemRejection = error?.name === 'UserRejectedRequestError' ||
                          error?.name === 'UserRejectedError';

  return isRejectionMessage || isRejectionCode || isViemRejection;
}

/**
 * Format error message for display to user
 * Returns null for user-cancelled transactions (shouldn't display error)
 * @param error - The error to format
 * @returns Formatted error message or null
 */
export function formatTransactionError(error: any): string | null {
  // Don't display errors for user-cancelled transactions
  if (isUserRejectedError(error)) {
    return null;
  }

  // Handle different error types
  if (error?.shortMessage) {
    return error.shortMessage;
  }

  if (error?.message) {
    // Clean up technical error messages
    const message = error.message;

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
 * @param context - Context string for the error (e.g., "Bridge ETH")
 * @param error - The error to log
 */
export function logTransactionError(context: string, error: any): void {
  if (!isUserRejectedError(error)) {
    console.error(`❌ ${context}:`, error);
  } else {
    console.log(`ℹ️ ${context}: User cancelled the transaction`);
  }
}