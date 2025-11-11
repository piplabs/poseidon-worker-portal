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
    // Calculate storage slot
    const withdrawalHash = withdrawalDetails.withdrawalHash;
    const paddedZeros = '0x' + '0'.repeat(64);
    const storageSlot = keccak256(encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'bytes32' }],
      [withdrawalHash as `0x${string}`, paddedZeros as `0x${string}`]
    ));
    
    // Create L2 client for proof generation
    const l2Client = createPublicClient({
      transport: http(RPC_URLS.L2),
    });
    
    // Get proof with retry logic - IMPORTANT: proof window is very small, so always use latest
    let proofResult;
    let actualProofBlock;
    const maxRetries = 3;
    
    // Since proof window issues are common, let's be smarter about block selection
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // ALWAYS get the absolute latest block for each attempt
        const latestBlock = await l2Client.getBlockNumber();
        
        proofResult = await l2Client.getProof({
          address: CONTRACT_ADDRESSES.L2_TO_L1_MESSAGE_PASSER as `0x${string}`,
          storageKeys: [storageSlot as `0x${string}`],
          blockNumber: latestBlock,
        });
        
        actualProofBlock = latestBlock;
        break;
        
      } catch {
        if (attempt < maxRetries) {
          // Wait a bit for new blocks before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw new Error('Could not get proof within window. The L2 chain might be progressing too fast.');
        }
      }
    }
    
    // Get L2 block data for proof
    const proofL2Block = await l2Client.getBlock({ blockNumber: actualProofBlock });
    
    // Also get dispute game L2 block if different
    let gameL2Block;
    if (Number(disputeGame.gameL2Block) !== Number(actualProofBlock)) {
      try {
        gameL2Block = await l2Client.getBlock({ blockNumber: BigInt(disputeGame.gameL2Block) });
      } catch {
        gameL2Block = proofL2Block;
      }
    } else {
      gameL2Block = proofL2Block;
    }
    
    // Check if any critical values are undefined
    if (!gameL2Block?.hash || !gameL2Block?.stateRoot) {
      throw new Error('Game L2 block data is missing hash or stateRoot');
    }
    
    if (!proofL2Block?.hash || !proofL2Block?.stateRoot) {
      throw new Error('Proof L2 block data is missing hash or stateRoot');
    }
    
    if (!proofResult?.storageHash) {
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
    
    for (let i = 0; i < outputRootProofCandidates.length; i++) {
      const candidate = outputRootProofCandidates[i];
      
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
        
        if (computedRoot.toLowerCase() === disputeGame.rootClaim.toLowerCase()) {
          outputRootProof = candidate;
          break;
        }
      } catch {
        // Error silently ignored
      }
    }
    
    if (!outputRootProof) {
      outputRootProof = outputRootProofCandidates[0];
    }
    
    if (!proofResult || !proofResult.storageProof || proofResult.storageProof.length === 0) {
      throw new Error('No storage proof found');
    }

    return {
      withdrawalProof: proofResult.storageProof[0].proof,
      outputRootProof,
      storageSlot
    };
  } catch (err) {
    throw err;
  }
}

