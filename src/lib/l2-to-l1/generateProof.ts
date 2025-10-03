import { createPublicClient, http, keccak256, encodeAbiParameters } from "viem";
import { CONTRACT_ADDRESSES, RPC_URLS } from "@/lib/constants";
import { MessagePassedEventData, DisputeGameData, ProofData } from "./types";

export async function generateProof(
  withdrawalDetails: MessagePassedEventData,
  l2BlockNumber: number,
  disputeGame: DisputeGameData
): Promise<ProofData> {
  // Validate inputs
  if (!withdrawalDetails) {
    throw new Error('Withdrawal details are required');
  }
  if (!withdrawalDetails.withdrawalHash) {
    throw new Error('Withdrawal hash is missing from withdrawal details');
  }
  if (!l2BlockNumber || l2BlockNumber <= 0) {
    throw new Error(`Invalid L2 block number: ${l2BlockNumber}`);
  }
  if (!disputeGame || !disputeGame.gameAddress) {
    throw new Error('Valid dispute game data is required');
  }

  try {
    console.log('\n' + '═'.repeat(80));
    console.log('STEP 3: GENERATE MERKLE PROOF');
    console.log('═'.repeat(80));
    
    // Calculate storage slot
    const withdrawalHash = withdrawalDetails.withdrawalHash;
    const paddedZeros = '0x' + '0'.repeat(64);
    const storageSlot = keccak256(encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'bytes32' }],
      [withdrawalHash as `0x${string}`, paddedZeros as `0x${string}`]
    ));
    
    console.log('\n📊 Proof Parameters:');
    console.log(`   Withdrawal Hash: ${withdrawalHash}`);
    console.log(`   Storage Slot: ${storageSlot}`);
    console.log(`   L2 Block: ${l2BlockNumber}`);
    console.log(`   Dispute Game Block: ${disputeGame.gameL2Block}`);
    
    // Create L2 client for proof generation
    const l2Client = createPublicClient({
      transport: http(RPC_URLS.L2),
    });
    
    // Get proof with retry logic - IMPORTANT: proof window is very small, so always use latest
    console.log(`\n🔍 Getting withdrawal storage proof from L2...`);
    
    let proofResult;
    let actualProofBlock;
    const maxRetries = 3;
    
    // Since proof window issues are common, let's be smarter about block selection
    console.log(`🔄 Getting proof for address ${CONTRACT_ADDRESSES.L2_TO_L1_MESSAGE_PASSER}`);
    console.log(`   Note: Due to proof window limitations, will use latest block`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // ALWAYS get the absolute latest block for each attempt
        const latestBlock = await l2Client.getBlockNumber();
        console.log(`   Attempt ${attempt}/${maxRetries}: Using latest block ${latestBlock}`);
        
        proofResult = await l2Client.getProof({
          address: CONTRACT_ADDRESSES.L2_TO_L1_MESSAGE_PASSER as `0x${string}`,
          storageKeys: [storageSlot as `0x${string}`],
          blockNumber: latestBlock,
        });
        
        console.log(`   ✅ Successfully retrieved proof at block ${latestBlock}`);
        actualProofBlock = latestBlock;
        break;
        
      } catch (error) {
        console.log(`   ⚠️ Attempt ${attempt} failed: ${error}`);
        
        if (attempt < maxRetries) {
          // Wait a bit for new blocks before retry
          console.log(`   Waiting ${3} seconds for new blocks...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log(`   ❌ Failed after ${maxRetries} attempts`);
          console.log(`   Error: ${error}`);
          throw new Error('Could not get proof within window. The L2 chain might be progressing too fast.');
        }
      }
    }
    
    console.log(`   Proof generated at block: ${actualProofBlock}`);
    
    console.log('\n📋 Proof Result:');
    if (proofResult) {
      console.log(`   Account Proof Nodes: ${proofResult.accountProof.length}`);
      console.log(`   Storage Hash: ${proofResult.storageHash}`);
      console.log(`   Storage Proof Nodes: ${proofResult.storageProof[0].proof.length}`);
      console.log(`   Storage Key: ${proofResult.storageProof[0].key}`);
      console.log(`   Storage Value: ${proofResult.storageProof[0].value}`);
    }
    
    // Get L2 block data for proof
    const proofL2Block = await l2Client.getBlock({ blockNumber: actualProofBlock });
    console.log(`   Proof L2 block hash: ${proofL2Block.hash}`);
    console.log(`   Proof L2 state root: ${proofL2Block.stateRoot}`);
    
    // Also get dispute game L2 block if different
    let gameL2Block;
    if (Number(disputeGame.gameL2Block) !== Number(actualProofBlock)) {
      try {
        gameL2Block = await l2Client.getBlock({ blockNumber: BigInt(disputeGame.gameL2Block) });
        console.log(`   Game L2 block hash: ${gameL2Block.hash}`);
        console.log(`   Game L2 state root: ${gameL2Block.stateRoot}`);
      } catch {
        console.log(`   Could not get game L2 block, using proof block`);
        gameL2Block = proofL2Block;
      }
    } else {
      gameL2Block = proofL2Block;
    }
    
    // Test different combinations to find the correct output root proof
    console.log('\n🔍 Testing output root proof candidates:');
    
    // Debug block data to find why values are undefined
    console.log('\n🔍 Block data validation:');
    console.log(`   Game L2 Block Hash: ${gameL2Block?.hash} (type: ${typeof gameL2Block?.hash})`);
    console.log(`   Game L2 State Root: ${gameL2Block?.stateRoot} (type: ${typeof gameL2Block?.stateRoot})`);
    console.log(`   Proof L2 Block Hash: ${proofL2Block?.hash} (type: ${typeof proofL2Block?.hash})`);
    console.log(`   Proof L2 State Root: ${proofL2Block?.stateRoot} (type: ${typeof proofL2Block?.stateRoot})`);
    console.log(`   Storage Hash: ${proofResult?.storageHash} (type: ${typeof proofResult?.storageHash})`);
    
    // Check if any critical values are undefined
    if (!gameL2Block?.hash || !gameL2Block?.stateRoot) {
      console.error('❌ Game L2 block data is incomplete!');
      console.error(`   gameL2Block:`, gameL2Block);
      throw new Error('Game L2 block data is missing hash or stateRoot');
    }
    
    if (!proofL2Block?.hash || !proofL2Block?.stateRoot) {
      console.error('❌ Proof L2 block data is incomplete!');
      console.error(`   proofL2Block:`, proofL2Block);
      throw new Error('Proof L2 block data is missing hash or stateRoot');
    }
    
    if (!proofResult?.storageHash) {
      console.error('❌ Proof result is missing storage hash!');
      console.error(`   proofResult:`, proofResult);
      throw new Error('Proof result is missing storageHash');
    }

    const outputRootProofCandidates = [
      // Candidate 1: Use game block's actual state
      {
        version: '0x0000000000000000000000000000000000000000000000000000000000000000',
        stateRoot: gameL2Block.stateRoot,
        messagePasserStorageRoot: proofResult.storageHash,
        latestBlockhash: gameL2Block.hash,
      },
      // Candidate 2: Use proof block state with game block hash
      {
        version: '0x0000000000000000000000000000000000000000000000000000000000000000',
        stateRoot: proofL2Block.stateRoot,
        messagePasserStorageRoot: proofResult.storageHash,
        latestBlockhash: gameL2Block.hash,
      },
      // Candidate 3: All from proof block
      {
        version: '0x0000000000000000000000000000000000000000000000000000000000000000',
        stateRoot: proofL2Block.stateRoot,
        messagePasserStorageRoot: proofResult.storageHash,
        latestBlockhash: proofL2Block.hash,
      }
    ];
    
    let outputRootProof = null;
    let matchingCandidate = -1;
    
    for (let i = 0; i < outputRootProofCandidates.length; i++) {
      const candidate = outputRootProofCandidates[i];
      
      console.log(`\n   Candidate ${i + 1} values:`);
      console.log(`     Version: ${candidate.version} (type: ${typeof candidate.version})`);
      console.log(`     State Root: ${candidate.stateRoot} (type: ${typeof candidate.stateRoot})`);
      console.log(`     Storage Root: ${candidate.messagePasserStorageRoot} (type: ${typeof candidate.messagePasserStorageRoot})`);
      console.log(`     Block Hash: ${candidate.latestBlockhash} (type: ${typeof candidate.latestBlockhash})`);
      
      try {
        // Compute hash using Optimism's method - simpler approach
        const encoded = encodeAbiParameters(
          [
            { type: 'bytes32', name: 'version' },
            { type: 'bytes32', name: 'stateRoot' },
            { type: 'bytes32', name: 'messagePasserStorageRoot' },
            { type: 'bytes32', name: 'latestBlockhash' }
          ],
          [
            candidate.version as `0x${string}`,
            candidate.stateRoot as `0x${string}`,
            candidate.messagePasserStorageRoot as `0x${string}`,
            candidate.latestBlockhash as `0x${string}`
          ]
        );
        const computedRoot = keccak256(encoded);
      
        console.log(`   Candidate ${i + 1}:`);
        console.log(`     Computed: ${computedRoot}`);
        
        if (computedRoot.toLowerCase() === disputeGame.rootClaim.toLowerCase()) {
          console.log(`     ✅ MATCH! Using candidate ${i + 1}`);
          outputRootProof = candidate;
          matchingCandidate = i + 1;
          break;
        } else {
          console.log(`     ❌ No match`);
        }
      } catch (error) {
        console.log(`     ❌ Error computing hash: ${error}`);
      }
    }
    
    if (!outputRootProof) {
      console.log('\n⚠️ WARNING: No output root proof candidate matches the dispute game!');
      console.log('   Using first candidate anyway...');
      outputRootProof = outputRootProofCandidates[0];
      matchingCandidate = 1;
    }
    
    console.log(`\n📋 Final Output Root Proof (candidate ${matchingCandidate}):`);
    console.log(`   Version: ${outputRootProof.version}`);
    console.log(`   State Root: ${outputRootProof.stateRoot}`);
    console.log(`   Message Passer Storage Root: ${outputRootProof.messagePasserStorageRoot}`);
    console.log(`   Latest Block Hash: ${outputRootProof.latestBlockhash}`);
    console.log(`   Expected Root: ${disputeGame.rootClaim}`);
    
    if (!proofResult || !proofResult.storageProof || proofResult.storageProof.length === 0) {
      throw new Error('No storage proof found');
    }

    return {
      withdrawalProof: proofResult.storageProof[0].proof,
      outputRootProof,
      storageSlot
    };
  } catch (err) {
    console.error('❌ Failed to generate proof:', err);
    throw err;
  }
}

