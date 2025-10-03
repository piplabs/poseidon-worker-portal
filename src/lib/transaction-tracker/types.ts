// Types for tracking bridge transactions (L1 to L2 and L2 to L1)

export type TransactionStatus = 
  | 'pending'                    // Initial L2 transaction submitted
  | 'l2_confirmed'               // L2 transaction confirmed
  | 'waiting_game'               // Waiting for dispute game
  | 'game_found'                 // Dispute game found
  | 'generating_proof'           // Generating merkle proof
  | 'proof_generated'            // Proof generated
  | 'waiting_proof_signature'    // Waiting for user to sign proof transaction
  | 'proof_submitted'            // Proof transaction sent to network
  | 'proof_confirmed'            // Proof transaction confirmed on-chain
  | 'waiting_resolve_signature'  // Waiting for user to sign resolve transaction
  | 'resolving_game'             // Resolve transaction sent to network
  | 'game_resolved'              // Game resolved and confirmed on-chain
  | 'waiting_finalize_signature' // Waiting for user to sign finalize transaction
  | 'finalizing'                 // Finalize transaction sent to network
  | 'completed'                  // Withdrawal complete
  | 'error';                     // Error occurred

export interface WithdrawalTransaction {
  // Identification
  id: string;                       // Unique transaction ID (tx hash)
  l1TxHash?: string;               // L1 transaction hash (for L1 to L2)
  l2TxHash?: string;               // L2 transaction hash (for L2 to L1)
  l1ProofTxHash?: string;          // L1 proof transaction hash
  l1ResolveClaimsTxHash?: string;  // L1 resolve claims transaction hash
  l1ResolveGameTxHash?: string;    // L1 resolve game transaction hash
  l1FinalizeTxHash?: string;       // L1 finalization transaction hash
  
  // Status
  status: TransactionStatus;
  errorMessage?: string;
  
  // Transaction details
  type: 'L1_TO_L2' | 'L2_TO_L1';  // Bridge direction
  token: string;                   // Token symbol (ETH or PSDN)
  amount: string;                  // Amount being bridged
  fromAddress: string;             // User's address
  
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
  l1TxHash?: string;
  l2TxHash?: string;
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

