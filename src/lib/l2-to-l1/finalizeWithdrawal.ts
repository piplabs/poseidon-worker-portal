import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { MessagePassedEventData } from "./types";
import { isUserRejectedError, logTransactionError } from "@/lib/error-utils";

export interface FinalizeWithdrawalParams {
  withdrawalDetails: MessagePassedEventData;
  address: string;
  writeProofContract: (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => void;
  setIsWithdrawalComplete: (value: boolean) => void;
  isWithdrawalComplete?: boolean;
  updateTransactionStatus?: (status: string) => void; // Optional callback to update status
}

export async function finalizeWithdrawal({
  withdrawalDetails,
  writeProofContract,
  isWithdrawalComplete = false,
  updateTransactionStatus,
}: FinalizeWithdrawalParams): Promise<boolean> {
  // Prevent multiple finalization attempts
  if (isWithdrawalComplete) {
    return true;
  }

  try {
    // Note: Challenge period countdown is now handled by the UI
    // The user already waited 10 seconds before clicking the "Get" button

    // OptimismPortal ABI for finalization
    const optimismPortalAbi = [
      {
        type: 'function',
        name: 'finalizeWithdrawalTransaction',
        inputs: [
          {
            name: 'tx',
            type: 'tuple',
            components: [
              { name: 'nonce', type: 'uint256' },
              { name: 'sender', type: 'address' },
              { name: 'target', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'gasLimit', type: 'uint256' },
              { name: 'data', type: 'bytes' }
            ]
          }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
      }
    ] as const;

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

    // Update status to waiting_finalize_signature right before prompting wallet
    if (updateTransactionStatus) {
      updateTransactionStatus('waiting_finalize_signature');
    }

    // Finalize withdrawal using writeContract
    writeProofContract({
      address: CONTRACT_ADDRESSES.OPTIMISM_PORTAL as `0x${string}`,
      abi: optimismPortalAbi,
      functionName: 'finalizeWithdrawalTransaction',
      args: [withdrawalTuple],
    });
    
    // Note: We don't wait or check balances here - that will be handled by the useEffect
    // monitoring the finalize transaction confirmation in bridge-interface.tsx
    // This allows the wagmi hook to properly track the transaction status
    
    return true;
  } catch (error) {
    if (!isUserRejectedError(error)) {
      logTransactionError('Failed to finalize withdrawal', error);
    }
    throw error;
  }
}

