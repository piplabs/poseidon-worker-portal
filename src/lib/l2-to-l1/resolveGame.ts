import { createPublicClient, http } from "viem";
import { RPC_URLS } from "@/lib/constants";
import { isUserRejectedError, logTransactionError } from "@/lib/error-utils";

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
}: ResolveGameParams): Promise<boolean> {
  // Prevent multiple simultaneous executions
  if (isResolvingGame) {
    return false;
  }

  // Prevent execution if withdrawal is already complete
  if (isWithdrawalComplete) {
    return false;
  }

  setIsResolvingGame(true);
  
  try {
    // DisputeGame ABI for resolution - already defined above

    // Create L1 client for reading contract state
    const l1Client = createPublicClient({
      transport: http(RPC_URLS.L1),
    });

    // Check game status
    const status = await l1Client.readContract({
      address: gameAddress as `0x${string}`,
      abi: disputeGameAbi,
      functionName: 'status',
    });

    if (Number(status) === 2) {
      return true;
    }

    // Check if we need to wait for MAX_CLOCK_DURATION
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
      await new Promise(resolve => setTimeout(resolve, remaining * 1000 + 2000));
    }

    // Get number of claims to resolve
    const claimDataLen = await l1Client.readContract({
      address: gameAddress as `0x${string}`,
      abi: disputeGameAbi,
      functionName: 'claimDataLen',
    });

    // Resolve all claims in one transaction using the root claim
    if (Number(claimDataLen) > 0) {
      // The resolveClaim function with numToResolve parameter can resolve multiple claims recursively
      // Starting from the root claim (index 0) and specifying numToResolve will resolve all claims
      // in the correct order (children before parents)
      
      // Note: Status will be updated to 'waiting_resolve_signature' only when wallet confirms
      // to prevent UI flashing back to previous steps
      
      // Resolve starting from the root claim (index 0) with numToResolve set to total number of claims
      // This will resolve all claims in the game in the correct dependency order
      writeResolveClaimsContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'resolveClaim',
        args: [BigInt(0), BigInt(claimDataLen)],
      });
    } else {
      // If there are no claims, we can directly resolve the game
      
      // Note: Status will be updated when wallet confirms to prevent UI flashing
      
      writeResolveGameContract({
        address: gameAddress as `0x${string}`,
        abi: disputeGameAbi,
        functionName: 'resolve',
      });
    }
    
    return true;
  } catch (error) {
    if (!isUserRejectedError(error)) {
      logTransactionError('Failed to resolve game', error);
    }
    throw error;
  } finally {
    setIsResolvingGame(false);
  }
}

