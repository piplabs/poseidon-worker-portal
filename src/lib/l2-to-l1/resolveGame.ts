import { createPublicClient, http } from "viem";
import { RPC_URLS } from "@/lib/constants";

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
    name: 'claimData',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [
      { name: 'parentIndex', type: 'uint32' },
      { name: 'counteredBy', type: 'address' },
      { name: 'claimant', type: 'address' },
      { name: 'bond', type: 'uint128' },
      { name: 'claim', type: 'bytes32' },
      { name: 'position', type: 'uint128' },
      { name: 'clock', type: 'uint128' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'resolveClaim',
    inputs: [
      { name: 'claimIndex', type: 'uint256' },
      { name: 'numToResolve', type: 'uint256' }
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
  writeResolveClaimsContract: (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => void;
  writeResolveGameContract: (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => void;
  isResolvingGame: boolean;
  isWithdrawalComplete: boolean;
  setIsResolvingGame: (value: boolean) => void;
  updateTransactionStatus?: (status: string) => void; // Optional callback to update status
}

export async function resolveGame({
  gameAddress,
  writeResolveClaimsContract,
  writeResolveGameContract,
  isResolvingGame,
  isWithdrawalComplete,
  setIsResolvingGame,
  updateTransactionStatus,
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

    // Resolve all claims in one transaction using the root claim
    if (Number(claimDataLen) > 0) {
      console.log('\n🔧 Resolving all claims...');
      
      // The resolveClaim function with numToResolve parameter can resolve multiple claims recursively
      // Starting from the root claim (index 0) and specifying numToResolve will resolve all claims
      // in the correct order (children before parents)
      
      console.log(`   Resolving all ${claimDataLen} claims starting from root (index 0)...`);
      console.log(`   This will recursively resolve all child claims in the correct order`);
      
      // Update status to waiting_resolve_signature right before prompting wallet
      if (updateTransactionStatus) {
        updateTransactionStatus('waiting_resolve_signature');
        console.log('   📝 Status updated: waiting_resolve_signature');
      }
      
      // Resolve starting from the root claim (index 0) with numToResolve set to total number of claims
      // This will resolve all claims in the game in the correct dependency order
      writeResolveClaimsContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'resolveClaim',
        args: [BigInt(0), BigInt(claimDataLen)],
      });
      
      console.log('   ✅ Resolve all claims transaction sent to wallet');
      console.log('   The confirmation will be handled by the useWaitForTransactionReceipt hook');
      console.log('   The resolve game transaction will be sent automatically after claims are confirmed');
    } else {
      console.log('\n📊 No claims to resolve - proceeding directly to resolve game');
      
      // If there are no claims, we can directly resolve the game
      console.log('\n🎯 Resolving the game...');
      
      // Update status to waiting_resolve_signature right before prompting wallet
      if (updateTransactionStatus) {
        updateTransactionStatus('waiting_resolve_signature');
        console.log('   📝 Status updated: waiting_resolve_signature');
      }
      
      writeResolveGameContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'resolve',
      });

      console.log('✅ Game resolution transaction sent to wallet - waiting for confirmation via wagmi hook...');
      console.log('   Step 6 (finalization) will trigger automatically after confirmation');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to resolve game:', error);
    throw error;
  } finally {
    setIsResolvingGame(false);
  }
}

