import { CONTRACT_ADDRESSES, CHAIN_IDS } from "@/lib/constants";
import { MessagePassedEventData, DisputeGameData, ProofData } from "./types";

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
    console.log('\n' + '═'.repeat(80));
    console.log('STEP 4: SUBMIT PROOF TO L1');
    console.log('═'.repeat(80));
    
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
    
    // Build output root proof tuple
    const initialOutputRootProofTuple = {
      version: proofData.outputRootProof.version as `0x${string}`,
      stateRoot: proofData.outputRootProof.stateRoot as `0x${string}`,
      messagePasserStorageRoot: proofData.outputRootProof.messagePasserStorageRoot as `0x${string}`,
      latestBlockhash: proofData.outputRootProof.latestBlockhash as `0x${string}`
    };
    
    // Build withdrawal proof array
    const initialWithdrawalProofArray = proofData.withdrawalProof.map((p: string) => p as `0x${string}`);
    
    console.log('\n📊 Proof Parameters:');
    console.log(`   Withdrawal Nonce: ${withdrawalTuple.nonce}`);
    console.log(`   Withdrawal Sender: ${withdrawalTuple.sender}`);
    console.log(`   Withdrawal Target: ${withdrawalTuple.target}`);
    console.log(`   Withdrawal Value: ${withdrawalTuple.value}`);
    console.log(`   Withdrawal Gas Limit: ${withdrawalTuple.gasLimit}`);
    console.log(`   Withdrawal Data Length: ${withdrawalTuple.data.length} bytes`);
    console.log(`   Game Index: ${disputeGame.gameIndex}`);
    console.log(`   Output Root Proof Version: ${initialOutputRootProofTuple.version}`);
    console.log(`   Output Root Proof State Root: ${initialOutputRootProofTuple.stateRoot}`);
    console.log(`   Output Root Proof Storage Root: ${initialOutputRootProofTuple.messagePasserStorageRoot}`);
    console.log(`   Output Root Proof Block Hash: ${initialOutputRootProofTuple.latestBlockhash}`);
    console.log(`   Withdrawal Proof Array Length: ${initialWithdrawalProofArray.length}`);
    
    console.log('\n📤 Submitting proof to L1...');
    addNotification('info', '🔄 Submitting proof to L1...');
    
    // Check if user is on the correct network (Story Poseidon Devnet L1)
    console.log(`🔍 Current chain ID: ${chainId}, Target: ${CHAIN_IDS.L1} (Story Poseidon Devnet L1)`);
    
    if (chainId !== CHAIN_IDS.L1) {
      console.log('🔄 Switching to Story Poseidon Devnet L1 for proof submission...');
      addNotification('info', '🔄 Switching to L1 network for proof submission...');
      try {
        await switchChain({ chainId: CHAIN_IDS.L1 });
        console.log('✅ Switched to Story Poseidon Devnet L1');
        addNotification('success', '✅ Switched to L1 network');
        // Wait a moment for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (switchError) {
        console.error('❌ Failed to switch to Story Poseidon Devnet L1:', switchError);
        addNotification('error', '❌ Failed to switch to L1 network');
        throw new Error('Please switch to Story Poseidon Devnet L1 to submit the proof');
      }
    } else {
      console.log('✅ Already on Story Poseidon Devnet L1');
      addNotification('info', '✅ Already on L1 network');
    }

    // Validate required data
    console.log('\n🔍 Validating proof data...');
    console.log(`   Withdrawal Details:`, wd);
    console.log(`   Dispute Game:`, disputeGame);
    console.log(`   Proof Data:`, proofData);

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

    console.log('\n✅ All validation passed, building withdrawal tuple...');

    // Validate and build output root proof tuple
    console.log('\n🔍 Validating output root proof...');
    console.log(`   Version: ${proofData.outputRootProof.version} (type: ${typeof proofData.outputRootProof.version})`);
    console.log(`   State Root: ${proofData.outputRootProof.stateRoot} (type: ${typeof proofData.outputRootProof.stateRoot})`);
    console.log(`   Storage Root: ${proofData.outputRootProof.messagePasserStorageRoot} (type: ${typeof proofData.outputRootProof.messagePasserStorageRoot})`);
    console.log(`   Block Hash: ${proofData.outputRootProof.latestBlockhash} (type: ${typeof proofData.outputRootProof.latestBlockhash})`);

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

    console.log('\n📋 Output Root Proof Tuple:');
    console.log(`   Version: ${validatedOutputRootProofTuple.version}`);
    console.log(`   State Root: ${validatedOutputRootProofTuple.stateRoot}`);
    console.log(`   Storage Root: ${validatedOutputRootProofTuple.messagePasserStorageRoot}`);
    console.log(`   Block Hash: ${validatedOutputRootProofTuple.latestBlockhash}`);

    // Validate and build withdrawal proof array
    console.log('\n🔍 Validating withdrawal proof array...');
    console.log(`   Proof Array Length: ${proofData.withdrawalProof.length}`);
    console.log(`   Proof Array:`, proofData.withdrawalProof);

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

    console.log('\n📋 Withdrawal Proof Array:');
    validatedWithdrawalProofArray.forEach((proof, index) => {
      console.log(`   Proof ${index}: ${proof}`);
    });

    console.log('\n🔧 Submitting proof transaction...');
    console.log(`   OptimismPortal: ${CONTRACT_ADDRESSES.OPTIMISM_PORTAL}`);
    console.log(`   Game Index: ${disputeGame.gameIndex} (type: ${typeof disputeGame.gameIndex})`);

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

    console.log('✅ Proof submission initiated!');
    addNotification('success', '✅ Proof transaction submitted! Waiting for confirmation...');
    return 'proof_submitted';
  } catch (error) {
    console.error('❌ Failed to submit proof:', error);
    throw error;
  }
}

