// Types for tracking L2 to L1 withdrawal transactions

export type TransactionStatus = 
  | 'pending'           // Initial L2 transaction submitted
  | 'l2_confirmed'      // L2 transaction confirmed
  | 'waiting_game'      // Waiting for dispute game
  | 'game_found'        // Dispute game found
  | 'generating_proof'  // Generating merkle proof
  | 'proof_generated'   // Proof generated
  | 'submitting_proof'  // Submitting proof to L1
  | 'proof_submitted'   // Proof transaction sent
  | 'proof_confirmed'   // Proof transaction confirmed
  | 'resolving_game'    // Resolving dispute game
  | 'game_resolved'     // Game resolved
  | 'finalizing'        // Finalizing withdrawal
  | 'completed'         // Withdrawal complete
  | 'error';            // Error occurred

export interface WithdrawalTransaction {
  // Identification
  id: string;                       // Unique transaction ID (L2 tx hash)
  l2TxHash: string;                // L2 transaction hash
  l1ProofTxHash?: string;          // L1 proof transaction hash
  l1ResolveClaimsTxHash?: string;  // L1 resolve claims transaction hash
  l1ResolveGameTxHash?: string;    // L1 resolve game transaction hash
  l1FinalizeTxHash?: string;       // L1 finalization transaction hash
  
  // Status
  status: TransactionStatus;
  errorMessage?: string;
  
  // Transaction details
  token: string;                // Token symbol (ETH or PSDN)
  amount: string;               // Amount being bridged
  fromAddress: string;          // User's address
  
  // Withdrawal data (needed for proof and finalization)
  withdrawalDetails?: {
    nonce: string;
    sender: string;
    target: string;
    value: string;
    gasLimit: string;
    data: string;
    withdrawalHash: string;
  };
  
  disputeGame?: {
    gameIndex: number;
    gameAddress: string;
    gameType: number;
    gameL2Block: number;
    rootClaim: string;
    timestamp: number;
  };
  
  proofData?: {
    withdrawalProof: string[];
    outputRootProof: {
      version: string;
      stateRoot: string;
      messagePasserStorageRoot: string;
      latestBlockhash: string;
    };
    storageSlot: string;
  };
  
  // Timestamps
  createdAt: number;            // When transaction was initiated
  updatedAt: number;            // Last status update
  completedAt?: number;         // When transaction completed
  
  // Metadata
  l2BlockNumber?: number;       // L2 block number
  estimatedCompletionTime?: number; // Estimated completion timestamp
}

export interface TransactionUpdate {
  id: string;
  status?: TransactionStatus;
  errorMessage?: string;
  l1ProofTxHash?: string;
  l1ResolveClaimsTxHash?: string;
  l1ResolveGameTxHash?: string;
  l1FinalizeTxHash?: string;
  withdrawalDetails?: WithdrawalTransaction['withdrawalDetails'];
  disputeGame?: WithdrawalTransaction['disputeGame'];
  proofData?: WithdrawalTransaction['proofData'];
  l2BlockNumber?: number;
  completedAt?: number;
}

