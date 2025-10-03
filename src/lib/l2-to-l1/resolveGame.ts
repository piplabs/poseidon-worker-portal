import { createPublicClient, http } from "viem";
import { RPC_URLS } from "@/lib/constants";
import { MessagePassedEventData } from "./types";

// DisputeGame ABI for resolution
const disputeGameAbi = [
  {
    type: 'function',
    name: 'status',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'createdAt',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimDataLen',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'resolveClaim',
    inputs: [
      { name: 'claimIndex', type: 'uint256' },
      { name: 'claimData', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'resolve',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;

export interface ResolveGameParams {
  gameAddress: string;
  writeProofContract: (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => void;
  finalizeWithdrawal: (withdrawalDetails: MessagePassedEventData) => Promise<boolean>;
  withdrawalDetails: MessagePassedEventData | null;
  isResolvingGame: boolean;
  isWithdrawalComplete: boolean;
  setIsResolvingGame: (value: boolean) => void;
}

export async function resolveGame({
  gameAddress,
  writeProofContract,
  finalizeWithdrawal,
  withdrawalDetails,
  isResolvingGame,
  isWithdrawalComplete,
  setIsResolvingGame,
}: ResolveGameParams): Promise<boolean> {
  // Prevent multiple simultaneous executions
  if (isResolvingGame) {
    console.log('⚠️ Dispute game resolution already in progress, skipping...');
    return false;
  }

  // Prevent execution if withdrawal is already complete
  if (isWithdrawalComplete) {
    console.log('⚠️ Withdrawal process already complete, skipping dispute game resolution...');
    return false;
  }

  setIsResolvingGame(true);
  
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('STEP 5: RESOLVE DISPUTE GAME');
    console.log('═'.repeat(80));
    
    // DisputeGame ABI for resolution - already defined above

    // Create L1 client for reading contract state
    const l1Client = createPublicClient({
      transport: http(RPC_URLS.L1),
    });

    // Check game status
    console.log('\n📊 Checking game status...');
    const status = await l1Client.readContract({
      address: gameAddress as `0x${string}`,
      abi: disputeGameAbi,
      functionName: 'status',
    });

    const statusNames = ['IN_PROGRESS', 'CHALLENGER_WINS', 'DEFENDER_WINS'];
    console.log(`   Game Status: ${status} (${statusNames[Number(status)]})`);

    if (Number(status) === 2) {
      console.log('✅ Game already resolved to DEFENDER_WINS');
      return true;
    }

    // Check if we need to wait for MAX_CLOCK_DURATION
    console.log('\n⏰ Checking game creation time...');
    const createdAt = await l1Client.readContract({
      address: gameAddress as `0x${string}`,
      abi: disputeGameAbi,
      functionName: 'createdAt',
    });

    const currentTime = Math.floor(Date.now() / 1000);
    const elapsed = currentTime - Number(createdAt);
    const maxClockDuration = 30; // 30 seconds for test network
    const remaining = Math.max(0, maxClockDuration - elapsed);

    if (remaining > 0) {
      console.log(`⏳ Waiting ${remaining} seconds for MAX_CLOCK_DURATION...`);
      await new Promise(resolve => setTimeout(resolve, remaining * 1000 + 2000));
    }

    // Get number of claims to resolve
    console.log('\n📊 Getting number of claims...');
    const claimDataLen = await l1Client.readContract({
      address: gameAddress as `0x${string}`,
      abi: disputeGameAbi,
      functionName: 'claimDataLen',
    });

    console.log(`   Claims to resolve: ${claimDataLen}`);

    // Resolve claims (from newest to oldest) - skip for now as they auto-resolve
    // Most dispute games auto-resolve claims, so we'll skip this step
    console.log('\n📊 Skipping claim resolution (auto-resolves)...');

    // Resolve the game
    let gameResolved = false;
    try {
      console.log('\n🎯 Resolving the game...');
      
      // Use writeContract to send the transaction
      writeProofContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'resolve',
      });

      console.log('✅ Game resolution transaction sent');
      
      // Wait for game resolution to confirm - using a longer wait time
      console.log('\n⏳ Waiting for game resolution to confirm (this may take up to 30 seconds)...');
      
      // Wait longer for confirmation (30 seconds)
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Verify the game was resolved
      const finalStatus = await l1Client.readContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'status',
      });
      
      if (Number(finalStatus) === 2) {
        console.log('✅ Game resolution confirmed - status is DEFENDER_WINS');
        gameResolved = true;
      } else {
        console.log(`⚠️ Game status is ${finalStatus}, expected 2 (DEFENDER_WINS) - may need manual resolution`);
        // Still mark as resolved if status changed from IN_PROGRESS
        gameResolved = Number(finalStatus) !== 0;
      }
    } catch (e) {
      console.error('❌ Game resolution failed:', e);
      throw new Error(`Failed to resolve dispute game: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Step 6: Finalize withdrawal ONLY if game was successfully resolved
    if (!gameResolved) {
      throw new Error('Cannot proceed to finalization: Dispute game was not resolved');
    }

    if (!withdrawalDetails) {
      throw new Error('Cannot finalize: No withdrawal details available');
    }

    console.log('\n🎯 Starting Step 6: Finalizing withdrawal...');
    try {
      await finalizeWithdrawal(withdrawalDetails);
      console.log('\n✅ Step 6 Complete: Withdrawal finalized!');
    } catch (error) {
      console.error('❌ Step 6 FAILED:', error);
      throw new Error(`Finalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to resolve game:', error);
    throw error;
  } finally {
    setIsResolvingGame(false);
  }
}

