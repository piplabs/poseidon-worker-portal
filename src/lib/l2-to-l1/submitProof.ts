import { CONTRACT_ADDRESSES, CHAIN_IDS } from "@/lib/constants";
import { MessagePassedEventData, DisputeGameData, ProofData } from "./types";
import { isUserRejectedError, logTransactionError } from "@/lib/error-utils";

// OptimismPortal ABI for proof submission
export const optimismPortalAbi = [
  {
    type: 'function',
    name: 'proveWithdrawalTransaction',
    inputs: [
      {
        name: 'withdrawal',
        type: 'tuple',
        components: [
          { name: 'nonce', type: 'uint256' },
          { name: 'sender', type: 'address' },
          { name: 'target', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gasLimit', type: 'uint256' },
          { name: 'data', type: 'bytes' }
        ]
      },
      { name: 'l2OutputIndex', type: 'uint256' },
      {
        name: 'outputRootProof',
        type: 'tuple',
        components: [
          { name: 'version', type: 'bytes32' },
          { name: 'stateRoot', type: 'bytes32' },
          { name: 'messagePasserStorageRoot', type: 'bytes32' },
          { name: 'latestBlockhash', type: 'bytes32' }
        ]
      },
      { name: 'withdrawalProof', type: 'bytes[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'provenWithdrawals',
    inputs: [
      { name: 'withdrawalHash', type: 'bytes32' },
      { name: 'prover', type: 'address' }
    ],
    outputs: [
      { name: 'outputRoot', type: 'bytes32' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'l2OutputIndex', type: 'uint256' }
    ],
    stateMutability: 'view'
  }
] as const;

export interface SubmitProofParams {
  withdrawalDetails: MessagePassedEventData;
  disputeGame: DisputeGameData;
  proofData: ProofData;
  chainId: number;
  switchChain: (params: { chainId: number }) => Promise<void>;
  writeProofContract: (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => void;
  addNotification: (type: 'info' | 'success' | 'error' | 'warning', message: string) => void;
}

export async function submitProof({
  withdrawalDetails,
  disputeGame,
  proofData,
  chainId,
  switchChain,
  writeProofContract,
  addNotification,
}: SubmitProofParams): Promise<string> {
  try {
    const wd = withdrawalDetails;
    
    // Build withdrawal tuple
    const withdrawalTuple = {
      nonce: BigInt(wd.nonce),
      sender: wd.sender as `0x${string}`,
      target: wd.target as `0x${string}`,
      value: BigInt(wd.value),
      gasLimit: BigInt(wd.gasLimit),
      data: wd.data as `0x${string}`
    };
    
    // Note: Output root proof and withdrawal proof arrays are built inline below
    
    addNotification('info', '🔄 Submitting proof to L1...');
    
    // Check if user is on the correct network (Story Poseidon Devnet L1)
    if (chainId !== CHAIN_IDS.L1) {
      addNotification('info', '🔄 Switching to L1 network for proof submission...');
      try {
        await switchChain({ chainId: CHAIN_IDS.L1 });
        addNotification('success', '✅ Switched to L1 network');
        // Wait a moment for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch {
        addNotification('error', '❌ Failed to switch to L1 network');
        throw new Error('Please switch to Story Poseidon Devnet L1 to submit the proof');
      }
    } else {
      addNotification('info', '✅ Already on L1 network');
    }

    // Validate required data
    if (!disputeGame.gameIndex && disputeGame.gameIndex !== 0) {
      throw new Error('Dispute game index is undefined');
    }
    if (!proofData.outputRootProof) {
      throw new Error('Output root proof is undefined');
    }
    if (!proofData.withdrawalProof || !Array.isArray(proofData.withdrawalProof)) {
      throw new Error('Withdrawal proof is undefined or not an array');
    }

    // Validate withdrawal details
    if (!wd.nonce) {
      throw new Error('Withdrawal nonce is undefined');
    }
    if (!wd.sender) {
      throw new Error('Withdrawal sender is undefined');
    }
    if (!wd.target) {
      throw new Error('Withdrawal target is undefined');
    }
    if (wd.value === undefined || wd.value === null) {
      throw new Error('Withdrawal value is undefined');
    }
    if (!wd.gasLimit) {
      throw new Error('Withdrawal gas limit is undefined');
    }
    if (!wd.data) {
      throw new Error('Withdrawal data is undefined');
    }

    // Validate and build output root proof tuple
    if (!proofData.outputRootProof.version) {
      throw new Error('Output root proof version is undefined');
    }
    if (!proofData.outputRootProof.stateRoot) {
      throw new Error('Output root proof state root is undefined');
    }
    if (!proofData.outputRootProof.messagePasserStorageRoot) {
      throw new Error('Output root proof message passer storage root is undefined');
    }
    if (!proofData.outputRootProof.latestBlockhash) {
      throw new Error('Output root proof latest block hash is undefined');
    }

    const validatedOutputRootProofTuple = {
      version: proofData.outputRootProof.version as `0x${string}`,
      stateRoot: proofData.outputRootProof.stateRoot as `0x${string}`,
      messagePasserStorageRoot: proofData.outputRootProof.messagePasserStorageRoot as `0x${string}`,
      latestBlockhash: proofData.outputRootProof.latestBlockhash as `0x${string}`
    };

    // Validate and build withdrawal proof array
    if (!Array.isArray(proofData.withdrawalProof)) {
      throw new Error('Withdrawal proof is not an array');
    }
    if (proofData.withdrawalProof.length === 0) {
      throw new Error('Withdrawal proof array is empty');
    }

    const validatedWithdrawalProofArray = proofData.withdrawalProof.map((p: string, index: number) => {
      if (!p) {
        throw new Error(`Withdrawal proof at index ${index} is undefined`);
      }
      return p as `0x${string}`;
    });

    addNotification('info', '🔧 Submitting proof transaction to L1...');

    // Submit the proof transaction
    writeProofContract({
      address: CONTRACT_ADDRESSES.OPTIMISM_PORTAL as `0x${string}`,
      abi: optimismPortalAbi,
      functionName: 'proveWithdrawalTransaction',
      args: [
        withdrawalTuple,
        BigInt(disputeGame.gameIndex),
        validatedOutputRootProofTuple,
        validatedWithdrawalProofArray
      ],
    });

    addNotification('success', '✅ Proof transaction submitted! Waiting for confirmation...');
    return 'proof_submitted';
  } catch (error) {
    if (!isUserRejectedError(error)) {
      logTransactionError('Failed to submit proof', error);
    }
    throw error;
  }
}

