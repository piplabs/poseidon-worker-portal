"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TokenSelector } from "@/components/token-selector";
import { PendingTransactionsTab } from "@/components/pending-transactions-tab";
import { WithdrawalStepsModal } from "@/components/withdrawal-steps-modal";
import { ChevronDown, ArrowUpDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance, useSwitchChain, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseUnits, createPublicClient, http, decodeEventLog } from "viem";
import { motion } from "motion/react";
import Image from "next/image";
import { 
  useReadMintPsdnBalanceOf,
  useReadMintPsdnAllowance,
  useWriteMintPsdnApprove,
  useWriteBridgeBridgeEthTo,
  useWriteBridgeDepositErc20To,
  useWriteL2BridgeBridgeErc20,
  useWriteL2BridgeBridgeEth
} from "@/generated";
import {
  CHAIN_IDS,
  CONTRACT_ADDRESSES,
  RPC_URLS,
  TOKEN_DECIMALS,
  POLLING_INTERVAL,
  MAX_UINT256,
  MIN_GAS_LIMIT,
  ZERO_AMOUNT,
  SWAP_ANIMATION_DURATION,
  EMPTY_EXTRA_DATA,
  type Token,
  PSDN_L1_TOKEN,
  PSDN_L2_TOKEN,
  IP_L1_TOKEN,
  IP_L2_TOKEN,
  DEFAULT_FROM_TOKEN,
  DEFAULT_TO_TOKEN,
} from "@/lib/constants";
import {
  formatBalance,
  formatBalanceFromValue,
  getAvailableL1Tokens,
  getAvailableL2Tokens,
  formatAmountOnBlur,
  isValidAmount,
  getTokenBalance,
} from "@/lib/utils";
import {
  type MessagePassedEventData,
  type DisputeGameData,
  type ProofData,
  waitForDisputeGame,
  generateProof,
  submitProof as submitProofImported,
  resolveGame as resolveGameImported,
  finalizeWithdrawal as finalizeWithdrawalImported,
} from "@/lib/l2-to-l1";
import {
  TransactionStorage,
  type TransactionStatus,
  type WithdrawalTransaction,
} from "@/lib/transaction-tracker";
import { isUserRejectedError, formatTransactionError, logTransactionError } from "@/lib/error-utils";


export function BridgeInterface() {
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TO_TOKEN);
  const [fromAmount, setFromAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [l2TxHash, setL2TxHash] = useState<string | null>(null);
  const [activeWithdrawalTxId, setActiveWithdrawalTxId] = useState<string | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  
  const [monitoredProofTxHash, setMonitoredProofTxHash] = useState<string | null>(null);
  const [monitoredResolveClaimsTxHash, setMonitoredResolveClaimsTxHash] = useState<string | null>(null);
  const [monitoredResolveGameTxHash, setMonitoredResolveGameTxHash] = useState<string | null>(null);
  const [monitoredFinalizeTxHash, setMonitoredFinalizeTxHash] = useState<string | null>(null);
  const [showL1ToL2Success, setShowL1ToL2Success] = useState(false);
  
  const processingTxs = useRef<Set<string>>(new Set());
  const shouldContinueAfterApproval = useRef(false);
  const lastProcessedApprovalHash = useRef<string | null>(null);
  const isRequestingApproval = useRef(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  
  const addNotification = useCallback((type: 'info' | 'success' | 'error' | 'warning', message: string) => {
  }, []);
  
  const [proofSubmissionData, setProofSubmissionData] = useState<{
    withdrawalDetails: MessagePassedEventData;
    disputeGame: DisputeGameData;
    proofData: {
      withdrawalProof: string[];
      outputRootProof: {
        version: string;
        stateRoot: string;
        messagePasserStorageRoot: string;
        latestBlockhash: string;
      };
      storageSlot: string;
    };
  } | null>(null);

  const [isResolvingGame, setIsResolvingGame] = useState(false);
  const [isWithdrawalComplete, setIsWithdrawalComplete] = useState(false);
  const { writeContract: writeProofContract, data: proofTxHash, error: proofError } = useWriteContract();
  const { writeContract: writeResolveClaimsContract, data: resolveClaimsTxHash, error: resolveClaimsErrorFromHook } = useWriteContract();
  const { writeContract: writeResolveGameContract, data: resolveGameTxHash, error: resolveGameErrorFromHook } = useWriteContract();
  const { writeContract: writeFinalizeContract, data: finalizeTxHash, error: finalizeErrorFromHook } = useWriteContract();
  const switchChainAsync = useCallback(async (params: { chainId: number }) => {
    return new Promise<void>((resolve, reject) => {
      switchChain(params, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  }, [switchChain]);

  const submitProof = useCallback(async (withdrawalDetails: MessagePassedEventData, disputeGame: DisputeGameData, proofData: ProofData) => {
    return await submitProofImported({
      withdrawalDetails,
      disputeGame,
      proofData,
      chainId,
      switchChain: switchChainAsync,
      writeProofContract,
      addNotification,
    });
  }, [chainId, switchChainAsync, writeProofContract, addNotification]);

  const { isSuccess: isProofConfirmed } = useWaitForTransactionReceipt({
    hash: (monitoredProofTxHash || proofTxHash) as `0x${string}` | undefined,
  });

  const { isSuccess: isResolveClaimsConfirmed, error: resolveClaimsTxReceiptError } = useWaitForTransactionReceipt({
    hash: (monitoredResolveClaimsTxHash || resolveClaimsTxHash) as `0x${string}` | undefined,
  });

  const { isSuccess: isResolveGameConfirmed, error: resolveGameTxReceiptError } = useWaitForTransactionReceipt({
    hash: (monitoredResolveGameTxHash || resolveGameTxHash) as `0x${string}` | undefined,
  });

  const { isSuccess: isFinalizeConfirmed, error: finalizeTxReceiptError } = useWaitForTransactionReceipt({
    hash: (monitoredFinalizeTxHash || finalizeTxHash) as `0x${string}` | undefined,
  });
  
  // Monitor errors from write contract hooks (these catch user rejections)
  const resolveClaimsError = resolveClaimsErrorFromHook || resolveClaimsTxReceiptError;
  const resolveGameError = resolveGameErrorFromHook || resolveGameTxReceiptError;
  const finalizeError = finalizeErrorFromHook || finalizeTxReceiptError;

  const finalizeWithdrawal = useCallback(async (withdrawalDetails: MessagePassedEventData, txId?: string) => {
    if (!address) return false;
    return await finalizeWithdrawalImported({
      withdrawalDetails,
      address,
      writeProofContract: writeFinalizeContract,
      setIsWithdrawalComplete,
      isWithdrawalComplete,
      updateTransactionStatus: txId ? (status: string) => {
        TransactionStorage.update({ id: txId, status: status as TransactionStatus });
      } : undefined,
    });
  }, [address, writeFinalizeContract, setIsWithdrawalComplete, isWithdrawalComplete]);

  const resolveGame = useCallback(async (gameAddress: string, txId?: string) => {
    return await resolveGameImported({
      gameAddress,
      writeResolveClaimsContract,
      writeResolveGameContract,
      isResolvingGame,
      isWithdrawalComplete,
      setIsResolvingGame,
      updateTransactionStatus: txId ? (status: string) => {
        TransactionStorage.update({ id: txId, status: status as TransactionStatus });
      } : undefined,
    });
  }, [writeResolveClaimsContract, writeResolveGameContract, isResolvingGame, isWithdrawalComplete, setIsResolvingGame]);

  useEffect(() => {
    if (resolveClaimsTxHash) {
      setMonitoredResolveClaimsTxHash(resolveClaimsTxHash);
      
      if (proofSubmissionData) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => t.withdrawalDetails?.withdrawalHash === txId);
        
        if (tx && (tx.status === 'proof_confirmed' || tx.status === 'waiting_resolve_signature')) {
          TransactionStorage.update({ 
            id: tx.id, 
            status: 'resolving_claims',
            l1ResolveClaimsTxHash: resolveClaimsTxHash 
          });
        }
      }
    }
    if (isResolveClaimsConfirmed && proofSubmissionData) {
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (!tx) {
        return;
      }
      
      if (tx.status === 'completed' || tx.status === 'error') {
        return;
      }
      
      setMonitoredResolveClaimsTxHash(null);
      TransactionStorage.update({ id: tx.id, status: 'claims_resolved' });
    }
    if (resolveClaimsError) {
      console.log('[Resolve Claims Error]', {
        error: resolveClaimsError,
        isUserRejected: isUserRejectedError(resolveClaimsError),
        hasProofSubmissionData: !!proofSubmissionData,
        withdrawalHash: proofSubmissionData?.withdrawalDetails.withdrawalHash
      });
      
      if (!isUserRejectedError(resolveClaimsError)) {
        logTransactionError('Resolve Claims Transaction Failed', resolveClaimsError);

        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          console.log('[Resolve Claims Error - Non-rejection] Found tx:', tx?.id, 'Current status:', tx?.status);
          if (tx) {
            TransactionStorage.update({ 
              id: tx.id, 
              status: 'proof_confirmed',
              errorMessage: 'Insufficient gas on L1.'
            });
            // Clear the processing flag so user can retry
            processingTxs.current.delete(`resolve_${tx.id}`);
            console.log('[Resolve Claims Error - Non-rejection] Reset status to proof_confirmed for tx:', tx.id);
          }
        }
      } else {
        // User cancelled - reset status back to proof_confirmed so they can retry
        console.log('[Resolve Claims Error - User rejected] Attempting to reset status');
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          console.log('[Resolve Claims Error - User rejected] Found tx:', tx?.id, 'Current status:', tx?.status);
          if (tx) {
            TransactionStorage.update({ id: tx.id, status: 'proof_confirmed', errorMessage: undefined });
            // Also clear the processing flag
            processingTxs.current.delete(`resolve_${tx.id}`);
            console.log('[Resolve Claims Error - User rejected] Reset status to proof_confirmed for tx:', tx.id);
          } else {
            console.log('[Resolve Claims Error - User rejected] Transaction not found!');
          }
        } else {
          console.log('[Resolve Claims Error - User rejected] No proofSubmissionData available!');
        }
      }
    }
  }, [resolveClaimsTxHash, isResolveClaimsConfirmed, resolveClaimsError, proofSubmissionData, writeResolveGameContract]);

  useEffect(() => {
    if (resolveGameTxHash) {
      setMonitoredResolveGameTxHash(resolveGameTxHash);
      
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx && (tx.status === 'claims_resolved' || tx.status === 'waiting_resolve_game_signature')) {
          TransactionStorage.update({ 
            id: tx.id, 
            status: 'resolving_game',
            l1ResolveGameTxHash: resolveGameTxHash as string,
          });
        }
      }
    }
    if (isResolveGameConfirmed && proofSubmissionData) {
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (!tx) {
        return;
      }
      
      if (tx.status === 'completed' || tx.status === 'error') {
        return;
      }
      
      if (tx.status === 'finalizing' || tx.status === 'waiting_finalize_signature') {
        return;
      }
      
      setMonitoredResolveGameTxHash(null);
      
      TransactionStorage.update({ 
        id: tx.id, 
        status: 'game_resolved',
        gameResolvedAt: Date.now(),
      });
    }
    if (resolveGameError) {
      if (!isUserRejectedError(resolveGameError)) {
        logTransactionError('Resolve Game Transaction Failed', resolveGameError);

        // Reset status back to claims_resolved so user can retry after fixing the issue
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            TransactionStorage.update({ 
              id: tx.id, 
              status: 'claims_resolved',
              errorMessage: 'Insufficient gas on L1.'
            });
            // Clear the processing flag so user can retry
            processingTxs.current.delete(`resolve_game_final_${tx.id}`);
          }
        }
      } else {
        // User cancelled - reset status back to claims_resolved so they can retry
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            TransactionStorage.update({ id: tx.id, status: 'claims_resolved', errorMessage: undefined });
            // Also clear the processing flag
            processingTxs.current.delete(`resolve_game_final_${tx.id}`);
          }
        }
      }
    }
  }, [resolveGameTxHash, isResolveGameConfirmed, resolveGameError, proofSubmissionData, finalizeWithdrawal]);

  // Monitor finalize withdrawal transaction status
  useEffect(() => {
    if (finalizeTxHash) {
      // Set monitored hash for persistence across page reloads
      setMonitoredFinalizeTxHash(finalizeTxHash);
      
      // Update status to finalizing when transaction hash is available (user confirmed in wallet)
      if (proofSubmissionData) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => t.withdrawalDetails?.withdrawalHash === txId);
        
        if (tx && tx.status === 'waiting_finalize_signature') {
          TransactionStorage.update({ 
            id: tx.id, 
            status: 'finalizing',
            l1FinalizeTxHash: finalizeTxHash 
          });
        }
      }
    }
    if (isFinalizeConfirmed && proofSubmissionData) {
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      // GUARD: Only mark as completed if currently finalizing
      if (!tx) {
        return;
      }
      
      if (tx.status === 'completed') {
        return;
      }
      
      if (tx.status === 'error') {
        return;
      }
      
      setMonitoredFinalizeTxHash(null);
      
      // Mark transaction as completed
      TransactionStorage.update({ 
        id: tx.id, 
        status: 'completed',
        completedAt: Date.now(),
      });
      
      // Mark withdrawal process as complete
      setIsWithdrawalComplete(true);
      
      // Clear proof submission data to prevent re-processing
      setProofSubmissionData(null);
    }
    if (finalizeError) {
      if (!isUserRejectedError(finalizeError)) {
        logTransactionError('Finalize Withdrawal Transaction Failed', finalizeError);

        // Reset status back to game_resolved so user can retry after fixing the issue (e.g., adding gas)
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            // Store error message for user feedback
            TransactionStorage.update({ 
              id: tx.id, 
              status: 'game_resolved',
              errorMessage: 'Insufficient gas on L1.'
            });
            // Clear the processing flag so user can retry
            processingTxs.current.delete(`finalize_${tx.id}`);
          }
        }
      } else {
        // User cancelled - reset status back to game_resolved so they can retry
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            TransactionStorage.update({ id: tx.id, status: 'game_resolved', errorMessage: undefined });
            // Also clear the processing flag
            processingTxs.current.delete(`finalize_${tx.id}`);
          }
        }
      }
    }
  }, [finalizeTxHash, isFinalizeConfirmed, finalizeError, proofSubmissionData, setIsWithdrawalComplete]);

  // Monitor proof submission status
  useEffect(() => {
    if (proofTxHash) {
      // Set monitored hash for persistence across page reloads
      setMonitoredProofTxHash(proofTxHash);

      // Update status to proof_submitted when transaction hash is available (user confirmed in wallet)
      // Try to find the transaction using either proofSubmissionData or activeWithdrawalTxId
      let tx = null;
      let foundMethod = '';

      if (proofSubmissionData) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        tx = TransactionStorage.getAll().find(t => t.withdrawalDetails?.withdrawalHash === txId);
        if (tx) foundMethod = 'proofSubmissionData';
      }

      if (!tx && activeWithdrawalTxId) {
        // Fallback to activeWithdrawalTxId if proofSubmissionData didn't find it
        tx = TransactionStorage.getById(activeWithdrawalTxId);
        if (tx) foundMethod = 'activeWithdrawalTxId';
      }

      if (tx && tx.status === 'waiting_proof_signature') {
        TransactionStorage.update({
          id: tx.id,
          status: 'proof_submitted',
          l1ProofTxHash: proofTxHash
        });
      }
    }
    if (isProofConfirmed) {
      // Try to find the transaction using either proofSubmissionData or activeWithdrawalTxId
      let tx = null;
      let txId: string | null = null;
      let foundMethod = '';

      if (proofSubmissionData) {
        txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        tx = TransactionStorage.getAll().find(t =>
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) foundMethod = 'proofSubmissionData';
      }

      if (!tx && activeWithdrawalTxId) {
        // Fallback to activeWithdrawalTxId if proofSubmissionData didn't find it
        txId = activeWithdrawalTxId;
        tx = TransactionStorage.getById(activeWithdrawalTxId);
        if (tx) foundMethod = 'activeWithdrawalTxId';
      }

      if (!txId || !tx) {
        return;
      }

      // Check if we're already processing this proof confirmation
      if (processingTxs.current.has(`proof_${txId}`)) {
        return;
      }
      
      if (!tx) {
        return;
      }
      
      if (tx.status === 'completed' || tx.status === 'error') {
        return;
      }
      
      // Check if already past proof_confirmed status
      // Allow transition from proof_generated, waiting_proof_signature, or proof_submitted
      if (!['proof_generated', 'waiting_proof_signature', 'proof_submitted', 'proof_confirmed'].includes(tx.status)) {
        return;
      }
      
      setMonitoredProofTxHash(null);
      
      // Update transaction status to proof_confirmed
      // This enables the user to immediately click "Resolve Claims"
      if (tx) {
        TransactionStorage.update({ 
          id: tx.id, 
          status: 'proof_confirmed',
          l1ProofTxHash: proofTxHash as string,
          proofConfirmedAt: Date.now(), // Store timestamp for record keeping
        });
      }
    }
    if (proofError) {
      if (!isUserRejectedError(proofError)) {
        logTransactionError('Step 4 FAILED: Proof submission transaction failed', proofError);
        
        // Reset status back to proof_generated so user can retry after fixing the issue
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            TransactionStorage.update({ 
              id: tx.id, 
              status: 'proof_generated',
              errorMessage: 'Insufficient gas on L1.'
            });
            // Clear the processing flag so user can retry
            processingTxs.current.delete(`prove_${tx.id}`);
          }
        }
      } else {
        // User cancelled - reset status back to proof_generated so they can retry
        if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
          const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
          const tx = TransactionStorage.getAll().find(t =>
            t.withdrawalDetails?.withdrawalHash === txId
          );
          if (tx) {
            TransactionStorage.update({ id: tx.id, status: 'proof_generated', errorMessage: undefined });
            // Also clear the processing flag
            processingTxs.current.delete(`prove_${tx.id}`);
          }
        }
      }
    }
  }, [proofTxHash, isProofConfirmed, proofError, proofSubmissionData, resolveGame]);


  // Function to log receipt details and extract MessagePassed event using viem
  const logReceiptDetails = useCallback(async (txHash: string) => {
    try {
      // Check if already processing to prevent duplicate processing
      const tx = TransactionStorage.getById(txHash);
      if (tx && tx.status !== 'pending' && tx.status !== 'l2_confirmed') {
        return;
      }
      
      // Update transaction status: L2 confirmed
      TransactionStorage.update({
        id: txHash,
        status: 'l2_confirmed',
      });
      
      // Create L2 client
      const l2Client = createPublicClient({
        transport: http(RPC_URLS.L2),
      });
      
      // Wait a bit for confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get receipt using viem
      const receipt = await l2Client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      
      // Extract MessagePassed event from logs
      const messagePassedTopic = '0x02a52367d10742d8032712c1bb8e0144ff1ec5ffda1ed7d70bb05a2744955054';
      const messagePassedLog = receipt.logs.find(log => 
        log.topics[0] === messagePassedTopic &&
        log.address.toLowerCase() === CONTRACT_ADDRESSES.L2_TO_L1_MESSAGE_PASSER.toLowerCase()
      );
      
      let withdrawalHash = null;
      let withdrawalDetails = null;
      
      if (messagePassedLog) {
        // Decode the MessagePassed event
        const decoded = decodeEventLog({
          abi: [{
            type: 'event',
            name: 'MessagePassed',
            inputs: [
              { type: 'uint256', name: 'nonce', indexed: true },
              { type: 'address', name: 'sender', indexed: true },
              { type: 'address', name: 'target', indexed: true },
              { type: 'uint256', name: 'value', indexed: false },
              { type: 'uint256', name: 'gasLimit', indexed: false },
              { type: 'bytes', name: 'data', indexed: false },
              { type: 'bytes32', name: 'withdrawalHash', indexed: false },
            ],
          }],
          data: messagePassedLog.data,
          topics: messagePassedLog.topics,
        });
        
        // Extract withdrawal details
        const eventData = (decoded as { args: { nonce: bigint; sender: string; target: string; value: bigint; gasLimit: bigint; data: string; withdrawalHash: string } }).args;
        withdrawalHash = eventData.withdrawalHash;
        withdrawalDetails = {
          nonce: eventData.nonce.toString(),
          sender: eventData.sender,
          target: eventData.target,
          value: eventData.value.toString(),
          gasLimit: eventData.gasLimit.toString(),
          data: eventData.data,
          withdrawalHash: withdrawalHash
        };
      }

        // Store withdrawal details and block number
        if (withdrawalDetails) {
          TransactionStorage.update({
            id: txHash,
            withdrawalDetails,
            l2BlockNumber: Number(receipt.blockNumber),
          });
        }

        // Step 2: Wait for dispute game
        if (receipt.blockNumber && withdrawalDetails) {
          TransactionStorage.update({ id: txHash, status: 'waiting_game' });
          
          let disputeGame;
          try {
            disputeGame = await waitForDisputeGame(Number(receipt.blockNumber));
            TransactionStorage.update({ id: txHash, status: 'game_found', disputeGame });
          } catch (error) {
            if (!isUserRejectedError(error)) {
              logTransactionError('Step 2 FAILED - Cannot proceed to Step 3', error);
              TransactionStorage.markError(txHash, `Step 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            throw new Error(`Step 2 (Wait for dispute game) failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
            
          // Step 3: Generate Merkle Proof (only if Step 2 succeeded)
          TransactionStorage.update({ id: txHash, status: 'generating_proof' });
          
          let proofData;
          try {
            proofData = await generateProof(withdrawalDetails, Number(receipt.blockNumber), disputeGame);
            TransactionStorage.update({ id: txHash, status: 'proof_generated', proofData });
          } catch (error) {
            if (!isUserRejectedError(error)) {
              logTransactionError('Step 3 FAILED - Cannot proceed to Step 4', error);
              TransactionStorage.markError(txHash, `Step 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            throw new Error(`Step 3 (Generate proof) failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
              
          // Step 4: Ready for user to submit proof to L1
          // Save proof submission data - needed when user clicks the Prove button
          setProofSubmissionData({
            withdrawalDetails,
            disputeGame,
            proofData,
          });
          
          // Update status to indicate proof is ready and waiting for user action
          TransactionStorage.update({ id: txHash, status: 'proof_generated' });
        }
      
    } catch (error) {
      if (!isUserRejectedError(error)) {
        logTransactionError('Failed to get receipt details', error);
      }
    }
  }, [waitForDisputeGame, generateProof, submitProof]);
  
  // Computed values
  const isL2ToL1 = fromToken.layer === 'L2';
  const isL1OnTop = fromToken.layer === 'L1';
  
  // Network validation
  const isOnCorrectNetwork = useMemo(() => {
    if (isL2ToL1) {
      // L2 to L1: Should be on Proteus Devnet (L2)
      return chainId === CHAIN_IDS.L2;
    } else {
      // L1 to L2: Should be on Poseidon Devnet (L1)
      return chainId === CHAIN_IDS.L1;
    }
  }, [chainId, isL2ToL1]);
  
  const requiredNetwork = useMemo(() => {
    if (isL2ToL1) {
      return { id: CHAIN_IDS.L2, name: 'Proteus Devnet' };
    } else {
      return { id: CHAIN_IDS.L1, name: 'Poseidon Devnet' };
    }
  }, [isL2ToL1]);
  
  // Transaction hooks
  const { writeContract: writeApprove, isPending: isApprovePending, error: approveError, data: approveTxHash } = useWriteMintPsdnApprove();
  const { writeContract: writeBridgeEth, isPending: isBridgeEthPending, error: bridgeEthError, data: bridgeEthTxData } = useWriteBridgeBridgeEthTo();
  const { writeContract: writeDepositErc20, isPending: isDepositErc20Pending, error: depositErc20Error, data: depositErc20TxData } = useWriteBridgeDepositErc20To();
  const { writeContract: writeL2BridgeErc20, isPending: isL2BridgeErc20Pending, error: l2BridgeErc20Error, data: l2TxData } = useWriteL2BridgeBridgeErc20();
  const { writeContract: writeL2BridgeEth, isPending: isL2BridgeEthPending, error: l2BridgeEthError, data: l2EthTxData } = useWriteL2BridgeBridgeEth();
  
  // Wait for L2 transaction receipt
  const { data: l2TxReceipt } = useWaitForTransactionReceipt({
    hash: l2TxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
    query: {
      enabled: !!l2TxHash,
    },
  });

  // Monitor L2 bridge errors and clean up temp transaction on rejection
  useEffect(() => {
    const l2Error = l2BridgeErc20Error || l2BridgeEthError;
    if (l2Error && isUserRejectedError(l2Error)) {
      // User rejected the L2->L1 transaction, clean up temp transaction
      if (activeWithdrawalTxId && activeWithdrawalTxId.startsWith('temp-')) {
        TransactionStorage.delete(activeWithdrawalTxId);
        setIsWithdrawalModalOpen(false);
        setActiveWithdrawalTxId(null);
      }
    }
  }, [l2BridgeErc20Error, l2BridgeEthError]);  // Removed activeWithdrawalTxId to prevent stale error from triggering cleanup on new transactions

  // Wait for approval transaction confirmation
  const { isSuccess: isApproveSuccess, isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveTxHash as `0x${string}`,
    query: {
      enabled: !!approveTxHash,
    },
  });

  const { data: psdnBalance, refetch: refetchPsdnBalance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L1,
  });

  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L2,
  });

  const { data: ipBalance, refetch: refetchIpBalance } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
    query: {
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: ipL2Balance, refetch: refetchIpL2Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L2,
    query: {
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadMintPsdnAllowance({
    args: address ? [address, CONTRACT_ADDRESSES.BRIDGE] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L1,
  });

  const { data: l2Allowance, refetch: refetchL2Allowance } = useReadMintPsdnAllowance({
    args: address ? [address, CONTRACT_ADDRESSES.L2_BRIDGE] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L2,
  });

  // Balance update effects - Update tokens with correct balances based on layer and symbol
  useEffect(() => {
    if (psdnBalance !== undefined) {
      const balanceStr = formatBalance(psdnBalance);
      setFromToken(prev => 
        prev.symbol === 'PSDN' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'PSDN' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [psdnBalance]);

  useEffect(() => {
    if (psdnL2Balance !== undefined) {
      const balanceStr = formatBalance(psdnL2Balance);
      setFromToken(prev => 
        prev.symbol === 'PSDN' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'PSDN' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [psdnL2Balance]);

  useEffect(() => {
    if (ipBalance !== undefined) {
      const balanceStr = formatBalanceFromValue(ipBalance);
      setFromToken(prev => 
        prev.symbol === 'IP' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'IP' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [ipBalance]);

  useEffect(() => {
    if (ipL2Balance !== undefined) {
      const balanceStr = formatBalanceFromValue(ipL2Balance);
      setFromToken(prev => 
        prev.symbol === 'IP' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'IP' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [ipL2Balance]);

  // Force refetch balances when wallet connects or changes
  useEffect(() => {
    if (address) {
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchIpBalance();
      refetchIpL2Balance();
      refetchAllowance();
      refetchL2Allowance();
    }
  }, [address, refetchPsdnBalance, refetchPsdnL2Balance, refetchIpBalance, refetchIpL2Balance, refetchAllowance, refetchL2Allowance]);

  // Refetch balances when user swaps (after animation completes)
  useEffect(() => {
    if (!isSwapping && address) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        refetchPsdnBalance();
        refetchPsdnL2Balance();
        refetchIpBalance();
        refetchIpL2Balance();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSwapping, address, refetchPsdnBalance, refetchPsdnL2Balance, refetchIpBalance, refetchIpL2Balance]);

  // Refetch balances when network changes
  useEffect(() => {
    if (address && chainId) {
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchIpBalance();
      refetchIpL2Balance();
      refetchAllowance();
      refetchL2Allowance();
    }
  }, [chainId, address, refetchPsdnBalance, refetchPsdnL2Balance, refetchIpBalance, refetchIpL2Balance, refetchAllowance, refetchL2Allowance]);

  // Balance polling is now handled by refetchInterval in the hooks above

  // Resume in-progress transactions on page load
  useEffect(() => {
    if (!address) return;
    
    const allTransactions = TransactionStorage.getAll();
    const inProgressWithdrawals = allTransactions.filter(tx => 
      tx.type === 'L2_TO_L1' && 
      tx.fromAddress.toLowerCase() === address.toLowerCase() &&
      tx.status !== 'completed' &&
      tx.status !== 'error'
    );
    
    if (inProgressWithdrawals.length === 0) {
      return;
    }
    
    // Process each in-progress withdrawal
    inProgressWithdrawals.forEach(tx => {
      
      // Resume background processes based on status
      switch (tx.status) {
        case 'pending':
        case 'l2_confirmed':
        case 'waiting_game':
          // These early stages will be handled by existing monitoring useEffects
          // Just check if we need to resume waiting for dispute game
          if (tx.l2TxHash && tx.l2BlockNumber && tx.withdrawalDetails) {
            // Try to find if a game is now available
            waitForDisputeGame(tx.l2BlockNumber)
              .then(disputeGame => {
                TransactionStorage.update({ 
                  id: tx.id, 
                  status: 'game_found',
                  disputeGame
                });
                
                // Start proof generation
                return generateProof(tx.withdrawalDetails!, tx.l2BlockNumber!, disputeGame);
              })
              .then(proofData => {
                const updatedTx = TransactionStorage.getById(tx.id);
                TransactionStorage.update({ 
                  id: tx.id, 
                  status: 'proof_generated',
                  proofData
                });
                
                if (updatedTx && updatedTx.disputeGame && updatedTx.withdrawalDetails) {
                  setProofSubmissionData({
                    withdrawalDetails: updatedTx.withdrawalDetails,
                    disputeGame: updatedTx.disputeGame,
                    proofData,
                  });
                }
              })
              .catch((error: Error) => {
                // Silently handle errors
              });
          }
          break;
          
        case 'game_found':
        case 'generating_proof':
          // Resume or restart proof generation
          if (tx.withdrawalDetails && tx.l2BlockNumber && tx.disputeGame) {
            generateProof(tx.withdrawalDetails, tx.l2BlockNumber, tx.disputeGame)
              .then(proofData => {
                TransactionStorage.update({ 
                  id: tx.id, 
                  status: 'proof_generated',
                  proofData
                });
                
                setProofSubmissionData({
                  withdrawalDetails: tx.withdrawalDetails!,
                  disputeGame: tx.disputeGame!,
                  proofData,
                });
              })
              .catch((error: Error) => {
                TransactionStorage.markError(tx.id, `Proof generation failed: ${error.message}`);
              });
          }
          break;
          
        case 'proof_generated':
        case 'waiting_proof_signature':
          // Restore proof data and ready for user to click "Prove"
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'proof_submitted':
          // Restore proof transaction hash for monitoring
          if (tx.l1ProofTxHash) {
            setMonitoredProofTxHash(tx.l1ProofTxHash);
          }
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'proof_confirmed':
        case 'waiting_resolve_signature':
          // Restore data, ready for resolve claims
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'resolving_claims':
          // Resume resolve claims transaction monitoring
          if (tx.l1ResolveClaimsTxHash) {
            setMonitoredResolveClaimsTxHash(tx.l1ResolveClaimsTxHash);
          }
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'claims_resolved':
        case 'waiting_resolve_game_signature':
          // Restore data, ready for resolve game
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'resolving_game':
          // Resume resolve game transaction monitoring
          if (tx.l1ResolveGameTxHash) {
            setMonitoredResolveGameTxHash(tx.l1ResolveGameTxHash);
          }
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'game_resolved':
        case 'waiting_finalize_signature':
          // Restore data, ready for finalization
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
          
        case 'finalizing':
          // Restore finalize transaction hash for monitoring
          if (tx.l1FinalizeTxHash) {
            setMonitoredFinalizeTxHash(tx.l1FinalizeTxHash);
          }
          if (tx.withdrawalDetails && tx.disputeGame && tx.proofData) {
            setProofSubmissionData({
              withdrawalDetails: tx.withdrawalDetails,
              disputeGame: tx.disputeGame,
              proofData: tx.proofData,
            });
          }
          break;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Only run when address changes (including on mount)
  // Note: We intentionally exclude generateProof, waitForDisputeGame, and setProofSubmissionData
  // from dependencies as they are stable and we only want this to run on mount/address change

  // Handle approval success - automatically continue with bridge transaction
  useEffect(() => {
    if (isApproveSuccess && shouldContinueAfterApproval.current && approveTxHash) {
      // Check if we've already processed this approval
      if (lastProcessedApprovalHash.current === approveTxHash) {
        return;
      }
      
      // Mark this approval as processed
      lastProcessedApprovalHash.current = approveTxHash;
      
      // Refetch allowances and wait for them to update with proper polling
      const refetchAndContinue = async () => {
        // Wait a bit for blockchain state to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Poll the allowance until it updates (up to 10 seconds)
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          await Promise.all([
            refetchAllowance(),
            refetchL2Allowance(),
          ]);
          
          // Wait another second for the state to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          attempts++;
          
          // Check if we've successfully updated (this will be checked in the next handleTransact call)
          // For now, just wait the full polling period to ensure the allowance is updated
          if (attempts >= 3) {
            // After 3 attempts (5 seconds total), assume it's ready
            break;
          }
        }
        
        // Reset flags
        shouldContinueAfterApproval.current = false;
        isRequestingApproval.current = false;
        
        // Additional delay to ensure state is fully updated, then re-trigger the transaction
        setTimeout(() => {
          // Call handleTransact which will be available in scope
          handleTransact();
        }, 1000);
      };
      
      refetchAndContinue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveSuccess, approveTxHash]);

  // Clear approval request flag if approval error occurs
  useEffect(() => {
    if (approveError && isRequestingApproval.current) {
      isRequestingApproval.current = false;
      shouldContinueAfterApproval.current = false;
    }
  }, [approveError]);

  // Handle L1 to L2 IP bridge transaction
  useEffect(() => {
    if (bridgeEthTxData && address) {
      const existingTx = TransactionStorage.getById(bridgeEthTxData);
      
      if (!existingTx) {
        TransactionStorage.create({
          id: bridgeEthTxData,
          l1TxHash: bridgeEthTxData,
          status: 'pending',
          type: 'L1_TO_L2',
          token: 'IP',
          amount: fromAmount,
          fromAddress: address,
        });
      }
    }
  }, [bridgeEthTxData, address, fromAmount]);

  // Handle L1 to L2 PSDN bridge transaction
  useEffect(() => {
    if (depositErc20TxData && address) {
      const existingTx = TransactionStorage.getById(depositErc20TxData);
      
      if (!existingTx) {
        TransactionStorage.create({
          id: depositErc20TxData,
          l1TxHash: depositErc20TxData,
          status: 'pending',
          type: 'L1_TO_L2',
          token: 'PSDN',
          amount: fromAmount,
          fromAddress: address,
        });
      }
    }
  }, [depositErc20TxData, address, fromAmount]);

  // Wait for L1 to L2 IP transaction confirmation
  const { isSuccess: isBridgeEthConfirmed } = useWaitForTransactionReceipt({
    hash: bridgeEthTxData as `0x${string}`,
    chainId: CHAIN_IDS.L1,
  });

  // Wait for L1 to L2 PSDN transaction confirmation
  const { isSuccess: isDepositErc20Confirmed } = useWaitForTransactionReceipt({
    hash: depositErc20TxData as `0x${string}`,
    chainId: CHAIN_IDS.L1,
  });

  // Mark L1 to L2 IP transaction as completed
  useEffect(() => {
    if (isBridgeEthConfirmed && bridgeEthTxData) {
      const tx = TransactionStorage.getById(bridgeEthTxData);
      if (tx && tx.status === 'pending') {
        TransactionStorage.update({
          id: bridgeEthTxData,
          status: 'completed',
          completedAt: Date.now(),
        });
        
        // Show success animation for L1 to L2 transaction
        setShowL1ToL2Success(true);
        setTimeout(() => {
          setShowL1ToL2Success(false);
        }, 3000);
      }
    }
  }, [isBridgeEthConfirmed, bridgeEthTxData]);

  // Mark L1 to L2 PSDN transaction as completed
  useEffect(() => {
    if (isDepositErc20Confirmed && depositErc20TxData) {
      const tx = TransactionStorage.getById(depositErc20TxData);
      if (tx && tx.status === 'pending') {
        TransactionStorage.update({
          id: depositErc20TxData,
          status: 'completed',
          completedAt: Date.now(),
        });
        
        // Show success animation for L1 to L2 transaction
        setShowL1ToL2Success(true);
        setTimeout(() => {
          setShowL1ToL2Success(false);
        }, 3000);
      }
    }
  }, [isDepositErc20Confirmed, depositErc20TxData]);

  // Handle L2 to L1 PSDN transaction hash when it becomes available
  useEffect(() => {
    if (l2TxData && address) {
      // Check if transaction already exists to prevent duplicates
      const existingTx = TransactionStorage.getById(l2TxData);
      
      if (!existingTx) {
        // Look for temporary transaction and update it
        const allTxs = TransactionStorage.getAll();
        const tempTx = allTxs.find(tx => tx.id.startsWith('temp-') && !tx.l2TxHash && tx.type === 'L2_TO_L1' && tx.token === 'PSDN');
        
        if (tempTx) {
          // Delete temporary transaction
          TransactionStorage.delete(tempTx.id);
          
          // Create new transaction with real hash
          TransactionStorage.create({
            id: l2TxData,
            l2TxHash: l2TxData,
            status: 'pending',
            type: 'L2_TO_L1',
            token: 'PSDN',
            amount: fromAmount,
            fromAddress: address,
          });
          
          // Update active withdrawal ID to the real transaction hash
          setActiveWithdrawalTxId(l2TxData);
        } else {
          // Create transaction record in localStorage only if it doesn't exist
          TransactionStorage.create({
            id: l2TxData,
            l2TxHash: l2TxData,
            status: 'pending',
            type: 'L2_TO_L1',
            token: 'PSDN',
            amount: fromAmount,
            fromAddress: address,
          });
          
          // Open withdrawal modal for this transaction
          setActiveWithdrawalTxId(l2TxData);
          setIsWithdrawalModalOpen(true);
        }
      }
      
      setL2TxHash(l2TxData);
    }
  }, [l2TxData, address, fromAmount]);

  // Handle L2 to L1 IP transaction hash when it becomes available
  useEffect(() => {
    if (l2EthTxData && address) {
      // Check if transaction already exists to prevent duplicates
      const existingTx = TransactionStorage.getById(l2EthTxData);
      
      if (!existingTx) {
        // Look for temporary transaction and update it
        const allTxs = TransactionStorage.getAll();
        const tempTx = allTxs.find(tx => tx.id.startsWith('temp-') && !tx.l2TxHash && tx.type === 'L2_TO_L1' && tx.token === 'IP');
        
        if (tempTx) {
          // Delete temporary transaction
          TransactionStorage.delete(tempTx.id);
          
          // Create new transaction with real hash
          TransactionStorage.create({
            id: l2EthTxData,
            l2TxHash: l2EthTxData,
            status: 'pending',
            type: 'L2_TO_L1',
            token: 'IP',
            amount: fromAmount,
            fromAddress: address,
          });
          
          // Update active withdrawal ID to the real transaction hash
          setActiveWithdrawalTxId(l2EthTxData);
        } else {
          // Create transaction record in localStorage only if it doesn't exist
          TransactionStorage.create({
            id: l2EthTxData,
            l2TxHash: l2EthTxData,
            status: 'pending',
            type: 'L2_TO_L1',
            token: 'IP',
            amount: fromAmount,
            fromAddress: address,
          });
          
          // Open withdrawal modal for this transaction
          setActiveWithdrawalTxId(l2EthTxData);
          setIsWithdrawalModalOpen(true);
        }
      }
      
      setL2TxHash(l2EthTxData);
    }
  }, [l2EthTxData, address, fromAmount]);

  // Handle L2 transaction receipt
  useEffect(() => {
    if (l2TxReceipt && l2TxHash) {
      // Check if we're already processing this transaction
      if (processingTxs.current.has(l2TxHash)) {
        return;
      }
      
      // Check if we've already processed this transaction to prevent infinite loop
      const tx = TransactionStorage.getById(l2TxHash);
      if (tx && tx.status !== 'pending') {
        return;
      }
      
      // Mark as processing
      processingTxs.current.add(l2TxHash);
      
      // Log detailed receipt information and start L2→L1 withdrawal process
      logReceiptDetails(l2TxHash).finally(() => {
        // Remove from processing set when done (either success or error)
        processingTxs.current.delete(l2TxHash);
      });
    }
  }, [l2TxReceipt, l2TxHash, logReceiptDetails]);

  // Event handlers
  const handleSwap = useCallback(() => {
    if (isSwapping) return;
    
    setIsSwapping(true);
    
    // Swap tokens immediately
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Reset swap state after animation
    setTimeout(() => {
      setIsSwapping(false);
    }, SWAP_ANIMATION_DURATION);
  }, [isSwapping, fromToken, toToken]);

  const handleFromAmountChange = useCallback((amount: string) => {
    const validNumberRegex = /^(\d*\.?\d*)$/;
    if (validNumberRegex.test(amount) || amount === '') {
      setFromAmount(amount);
    }
  }, []);

  const handleFromAmountBlur = useCallback(() => {
    setFromAmount(formatAmountOnBlur(fromAmount));
  }, [fromAmount]);

  const handleMaxClick = useCallback(() => {
    const maxBalance = getTokenBalance(fromToken, psdnBalance, psdnL2Balance, ipBalance, ipL2Balance);
    if (maxBalance) {
      setFromAmount(maxBalance);
    }
  }, [fromToken, psdnBalance, psdnL2Balance, ipBalance, ipL2Balance]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: requiredNetwork.id });
    } catch (error) {
      logTransactionError('Failed to switch network', error);
    }
  }, [switchChain, requiredNetwork.id]);

  const handleTokenSelect = useCallback((selectedToken: Token) => {
    // Get the correct balance based on token type and layer
    const balanceStr = getTokenBalance(
      selectedToken,
      psdnBalance,
      psdnL2Balance,
      ipBalance,
      ipL2Balance
    );
    
    const updatedFromToken = { ...selectedToken, balance: balanceStr };
    
    // Determine the corresponding toToken based on the selected fromToken
    let updatedToToken: Token;
    if (selectedToken.layer === 'L1') {
      // If L1 is selected, set corresponding L2 token
      if (selectedToken.symbol === 'PSDN') {
        updatedToToken = { ...PSDN_L2_TOKEN, balance: formatBalance(psdnL2Balance) };
      } else {
        updatedToToken = { ...IP_L2_TOKEN, balance: formatBalanceFromValue(ipL2Balance) };
      }
    } else {
      // If L2 is selected, set corresponding L1 token
      if (selectedToken.symbol === 'PSDN') {
        updatedToToken = { ...PSDN_L1_TOKEN, balance: formatBalance(psdnBalance) };
      } else {
        updatedToToken = { ...IP_L1_TOKEN, balance: formatBalanceFromValue(ipBalance) };
      }
    }
    
    // Update both tokens in a single batch to reduce re-renders
    setFromToken(updatedFromToken);
    setToToken(updatedToToken);
    setIsTokenSelectorOpen(false);
  }, [psdnBalance, psdnL2Balance, ipBalance, ipL2Balance]);


  // Handlers for withdrawal modal actions
  const handleProveWithdrawal = useCallback(() => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!activeWithdrawalTxId) return;

    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.withdrawalDetails || !tx.disputeGame || !tx.proofData) {
      return;
    }

    // Guard: Only allow if proof is ready
    if (tx.status !== 'proof_generated') {
      return;
    }

    // Guard: Check if user has sufficient L1 gas (minimum 0.001 IP for transaction)
    const minGasRequired = parseUnits('0.001', 18);
    if (ipBalance && ipBalance.value < minGasRequired) {
      TransactionStorage.update({ 
        id: tx.id, 
        errorMessage: 'Insufficient gas on L1.'
      });
      return;
    }

    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`prove_${tx.id}`)) {
      return;
    }

    processingTxs.current.add(`prove_${tx.id}`);

    // Set proof submission data so the proof confirmation effect can find the transaction
    setProofSubmissionData({
      withdrawalDetails: tx.withdrawalDetails,
      disputeGame: tx.disputeGame,
      proofData: tx.proofData
    });

    // Update status to waiting for signature and clear any previous error
    TransactionStorage.update({ id: tx.id, status: 'waiting_proof_signature', errorMessage: undefined });

    // Submit proof - this will prompt user's wallet
    submitProof(tx.withdrawalDetails, tx.disputeGame, tx.proofData)
      .catch((error) => {
        if (!isUserRejectedError(error)) {
          logTransactionError('Proof submission failed', error);
          TransactionStorage.markError(tx.id, `Proof submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } else {
          // User cancelled - reset status back to proof_generated so they can retry
          TransactionStorage.update({ id: tx.id, status: 'proof_generated', errorMessage: undefined });
        }
        // Clear proof submission data on error
        setProofSubmissionData(null);
      })
      .finally(() => {
        processingTxs.current.delete(`prove_${tx.id}`);
      });
  }, [activeWithdrawalTxId, submitProof, address, openConnectModal, ipBalance]);
  
  const handleResolveGame = useCallback(async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.disputeGame || !tx.withdrawalDetails || !tx.proofData) {
      return;
    }
    
    // Guard: Only allow if proof is confirmed (for resolve claims step)
    if (tx.status !== 'proof_confirmed') {
      return;
    }
    
    // Guard: Check if user has sufficient L1 gas (minimum 0.001 IP for transaction)
    const minGasRequired = parseUnits('0.001', 18);
    if (ipBalance && ipBalance.value < minGasRequired) {
      TransactionStorage.update({ 
        id: tx.id, 
        errorMessage: 'Insufficient gas on L1.'
      });
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`resolve_${tx.id}`)) {
      return;
    }
    
    processingTxs.current.add(`resolve_${tx.id}`);
    
    // Set proof submission data so the error handler can find the transaction
    setProofSubmissionData({
      withdrawalDetails: tx.withdrawalDetails,
      disputeGame: tx.disputeGame,
      proofData: tx.proofData
    });
    
    // Update status to waiting for signature BEFORE calling resolveGame and clear any previous error
    TransactionStorage.update({ id: tx.id, status: 'waiting_resolve_signature', errorMessage: undefined });
    
    // Call resolveGame - this will send resolve claims transaction
    resolveGame(tx.disputeGame.gameAddress, tx.id)
      .catch((error) => {
        if (!isUserRejectedError(error)) {
          logTransactionError('Resolve claims failed', error);
          TransactionStorage.markError(tx.id, `Resolve claims failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } else {
          // User cancelled - reset status back to proof_confirmed so they can retry
          TransactionStorage.update({ id: tx.id, status: 'proof_confirmed', errorMessage: undefined });
        }
        // Always clear the processing flag on error
        processingTxs.current.delete(`resolve_${tx.id}`);
      });
  }, [activeWithdrawalTxId, resolveGame, address, openConnectModal, ipBalance]);
  
  const handleResolveGameFinal = useCallback(async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !proofSubmissionData?.disputeGame) {
      return;
    }
    
    // Guard: Only allow if resolve claims is complete (status is claims_resolved)
    if (tx.status !== 'claims_resolved') {
      return;
    }
    
    // Guard: Check if user has sufficient L1 gas (minimum 0.001 IP for transaction)
    const minGasRequired = parseUnits('0.001', 18);
    if (ipBalance && ipBalance.value < minGasRequired) {
      TransactionStorage.update({ 
        id: tx.id, 
        errorMessage: 'Insufficient gas on L1.'
      });
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`resolve_game_final_${tx.id}`)) {
      return;
    }
    
    processingTxs.current.add(`resolve_game_final_${tx.id}`);
    
    // Update status to waiting for signature BEFORE calling writeResolveGameContract and clear any previous error
    TransactionStorage.update({ id: tx.id, status: 'waiting_resolve_game_signature', errorMessage: undefined });
    
    try {
      // Get the dispute game address from proof submission data
      const gameAddress = proofSubmissionData.disputeGame.gameAddress;
      
      // Send the resolve game transaction directly
      await writeResolveGameContract({
        address: gameAddress as `0x${string}`,
        abi: [{
          type: 'function',
          name: 'resolve',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable'
        }],
        functionName: 'resolve',
      });
    } catch (error) {
      if (!isUserRejectedError(error)) {
        logTransactionError('Resolve game failed', error);
        TransactionStorage.update({ 
          id: tx.id, 
          status: 'claims_resolved',
          errorMessage: 'Insufficient gas on L1.'
        });
      } else {
        // User cancelled - reset status back to claims_resolved so they can retry
        TransactionStorage.update({ id: tx.id, status: 'claims_resolved', errorMessage: undefined });
      }
      // Always clear the processing flag on error
      processingTxs.current.delete(`resolve_game_final_${tx.id}`);
    }
  }, [activeWithdrawalTxId, proofSubmissionData, writeResolveGameContract, address, openConnectModal, ipBalance]);
  
  const handleCloseWithdrawalModal = useCallback(() => {
    // Clean up temporary transaction if it exists
    if (activeWithdrawalTxId && activeWithdrawalTxId.startsWith('temp-')) {
      TransactionStorage.delete(activeWithdrawalTxId);
    }
    setIsWithdrawalModalOpen(false);
    setActiveWithdrawalTxId(null);
  }, [activeWithdrawalTxId]);

  // Handler for when a transaction is selected from the pending transactions modal
  const handleSelectTransaction = useCallback((transaction: WithdrawalTransaction) => {
    if (transaction.type === 'L2_TO_L1') {
      setActiveWithdrawalTxId(transaction.id);
      setIsWithdrawalModalOpen(true);
    }
  }, []);

  const handleFinalizeWithdrawal = useCallback(() => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.withdrawalDetails) {
      return;
    }
    
    // Guard: Only allow if game is resolved
    if (tx.status !== 'game_resolved') {
      return;
    }
    
    // Guard: Check if user has sufficient L1 gas (minimum 0.001 IP for transaction)
    const minGasRequired = parseUnits('0.001', 18);
    if (ipBalance && ipBalance.value < minGasRequired) {
      TransactionStorage.update({ 
        id: tx.id, 
        errorMessage: 'Insufficient gas on L1.'
      });
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`finalize_${tx.id}`)) {
      return;
    }
    
    processingTxs.current.add(`finalize_${tx.id}`);
    
    // Update status to waiting for signature BEFORE calling finalizeWithdrawal and clear any previous error
    TransactionStorage.update({ id: tx.id, status: 'waiting_finalize_signature', errorMessage: undefined });
    
    // Call finalizeWithdrawal - this will prompt user's wallet
    finalizeWithdrawal(tx.withdrawalDetails, tx.id)
      .catch((error) => {
        if (!isUserRejectedError(error)) {
          logTransactionError('Finalization failed', error);
          TransactionStorage.markError(tx.id, `Finalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } else {
          // User cancelled - reset status back to game_resolved so they can retry
          TransactionStorage.update({ id: tx.id, status: 'game_resolved', errorMessage: undefined });
        }
        // Always clear the processing flag on error
        processingTxs.current.delete(`finalize_${tx.id}`);
      });
  }, [activeWithdrawalTxId, finalizeWithdrawal, address, openConnectModal, ipBalance]);

  const handleTransact = useCallback(async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!fromAmount || !isValidAmount(fromAmount)) {
      return;
    }

    // Prevent triggering a new approval if one is already in progress
    if (isApprovePending || isApproveConfirming || isRequestingApproval.current) {
      return;
    }

    try {
      const amount = parseUnits(fromAmount, TOKEN_DECIMALS);

      // For L2 to L1 flows, create a temporary transaction and show modal first
      if (isL2ToL1) {
        const tempTxId = `temp-${Date.now()}`;
        TransactionStorage.create({
          id: tempTxId,
          l2TxHash: '',
          status: 'pending',
          type: 'L2_TO_L1',
          token: fromToken.symbol,
          amount: fromAmount,
          fromAddress: address,
        });
        
        // Open modal immediately
        setActiveWithdrawalTxId(tempTxId);
        setIsWithdrawalModalOpen(true);
        
        // Small delay to ensure modal is visible before transaction prompt
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (fromToken.symbol === 'IP') {
        // For IP, handle both L1->L2 and L2->L1
        if (isL2ToL1) {
          // L2 -> L1: Use L2Bridge bridgeETH
          await writeL2BridgeEth({
            args: [MIN_GAS_LIMIT, EMPTY_EXTRA_DATA],
            value: amount,
          });
        } else {
          // L1 -> L2: Use bridgeEthTo
          await writeBridgeEth({
            args: [address, MIN_GAS_LIMIT, EMPTY_EXTRA_DATA],
            value: amount,
          });
        }
      } else {
        // For PSDN, handle both L1->L2 and L2->L1
        if (isL2ToL1) {
          // L2 -> L1: Check balance first
          const currentBalance = psdnL2Balance || BigInt(0);
          
          if (currentBalance < amount) {
            const errorMsg = 'Insufficient PSDN balance on L2';
            addNotification('error', errorMsg);
            
            // Clean up temp transaction
            if (activeWithdrawalTxId && activeWithdrawalTxId.startsWith('temp-')) {
              TransactionStorage.delete(activeWithdrawalTxId);
              setIsWithdrawalModalOpen(false);
              setActiveWithdrawalTxId(null);
            }
            return;
          }
          
          // Check approval for L2Bridge contract
          const needsL2Approval = !l2Allowance || l2Allowance < amount;
          
          if (needsL2Approval) {
            // Set flags to auto-continue after approval and prevent duplicate requests
            shouldContinueAfterApproval.current = true;
            isRequestingApproval.current = true;
            // Approve max amount to avoid future approvals
            await writeApprove({
              args: [CONTRACT_ADDRESSES.L2_BRIDGE, BigInt(MAX_UINT256)],
            });
            // Note: The actual bridge will happen automatically after approval confirms
            return;
          }
          
          // If we have approval, proceed with L2 -> L1 bridge
          await writeL2BridgeErc20({
            args: [
              CONTRACT_ADDRESSES.PSDN_L2, // L2 token address
              CONTRACT_ADDRESSES.PSDN_L1, // L1 token address
              amount,
              MIN_GAS_LIMIT,
              EMPTY_EXTRA_DATA
            ],
          });
          
          // Transaction will be tracked automatically when L2 tx hash becomes available
        } else {
          // L1 -> L2: Use existing ERC20 flow
          // Check balance first
          const currentBalance = psdnBalance || BigInt(0);
          
          if (currentBalance < amount) {
            const errorMsg = 'Insufficient PSDN balance on L1';
            addNotification('error', errorMsg);
            return;
          }
          
          // Check allowance
          const needsApproval = !currentAllowance || currentAllowance < amount;
          
          if (needsApproval) {
            // Set flags to auto-continue after approval and prevent duplicate requests
            shouldContinueAfterApproval.current = true;
            isRequestingApproval.current = true;
            // Approve max amount to avoid future approvals
            await writeApprove({
              args: [CONTRACT_ADDRESSES.BRIDGE, BigInt(MAX_UINT256)],
            });
            // Note: The actual deposit will happen automatically after approval confirms
            return;
          }
          
          // If we have approval, proceed with deposit
          await writeDepositErc20({
            args: [
              CONTRACT_ADDRESSES.PSDN_L1,
              CONTRACT_ADDRESSES.PSDN_L2,
              address,
              amount,
              MIN_GAS_LIMIT,
              EMPTY_EXTRA_DATA
            ],
          });
        }
      }
      
      // Refresh all balances after successful transaction
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchIpBalance();
      refetchIpL2Balance();
      refetchAllowance();
      refetchL2Allowance();
    } catch (error) {
      // Only log error if it's not a user cancellation
      if (!isUserRejectedError(error)) {
        logTransactionError("Transaction failed", error);
      }

      // Clean up temporary transaction if user cancelled for L2 to L1
      if (isL2ToL1 && activeWithdrawalTxId && activeWithdrawalTxId.startsWith('temp-')) {
        TransactionStorage.delete(activeWithdrawalTxId);
        setIsWithdrawalModalOpen(false);
        setActiveWithdrawalTxId(null);
      }
    }
  }, [address, fromAmount, fromToken.symbol, isL2ToL1, currentAllowance, l2Allowance, writeBridgeEth, writeL2BridgeEth, writeApprove, writeDepositErc20, writeL2BridgeErc20, refetchPsdnBalance, refetchPsdnL2Balance, refetchIpBalance, refetchIpL2Balance, refetchAllowance, refetchL2Allowance, toToken.symbol, activeWithdrawalTxId, isApprovePending, isApproveConfirming, openConnectModal, psdnL2Balance, addNotification]);

  // Memoized values
  const availableTokens = useMemo(() => 
    isL1OnTop 
      ? getAvailableL1Tokens(psdnBalance, ipBalance)
      : getAvailableL2Tokens(psdnL2Balance, ipL2Balance),
    [isL1OnTop, psdnBalance, ipBalance, psdnL2Balance, ipL2Balance]
  );

  const isTransactionPending = useMemo(() =>
    isApprovePending || isBridgeEthPending || isDepositErc20Pending || isL2BridgeErc20Pending || isL2BridgeEthPending,
    [isApprovePending, isBridgeEthPending, isDepositErc20Pending, isL2BridgeErc20Pending, isL2BridgeEthPending]
  );

  // Filter out user-cancelled transactions from errors
  const hasError = useMemo(() => {
    const errors = [approveError, bridgeEthError, depositErc20Error, l2BridgeErc20Error, l2BridgeEthError];
    // Find the first non-cancelled error
    return errors.find(error => error && !isUserRejectedError(error)) || null;
  }, [approveError, bridgeEthError, depositErc20Error, l2BridgeErc20Error, l2BridgeEthError]);

  // Check if approval is needed for PSDN transactions
  const needsApproval = useMemo(() => {
    if (fromToken.symbol !== 'PSDN' || isL2ToL1 || !fromAmount || !isValidAmount(fromAmount)) {
      return false;
    }
    try {
      const amount = parseUnits(fromAmount, TOKEN_DECIMALS);
      return !currentAllowance || currentAllowance < amount;
    } catch {
      return false;
    }
  }, [fromToken.symbol, isL2ToL1, fromAmount, currentAllowance]);

  // Get active withdrawal transaction for modal
  // We need to refresh this whenever transactions change
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    // Poll for transaction updates while modal is open
    if (isWithdrawalModalOpen && activeWithdrawalTxId) {
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWithdrawalModalOpen, activeWithdrawalTxId]);

  // Auto-check gas balance every 3 seconds to clear errors when user adds gas
  useEffect(() => {
    if (isWithdrawalModalOpen && activeWithdrawalTxId && ipBalance) {
      const interval = setInterval(() => {
        const tx = TransactionStorage.getById(activeWithdrawalTxId);
        if (tx && tx.errorMessage) {
          const minGasRequired = parseUnits('0.001', 18);
          // If user now has sufficient gas, clear the error
          if (ipBalance.value >= minGasRequired) {
            TransactionStorage.update({ 
              id: tx.id, 
              errorMessage: undefined 
            });
          }
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isWithdrawalModalOpen, activeWithdrawalTxId, ipBalance]);
  
  const activeWithdrawalTx = useMemo(() => {
    if (!activeWithdrawalTxId) return null;
    return TransactionStorage.getById(activeWithdrawalTxId);
  }, [activeWithdrawalTxId, refreshKey]);

  // Note: Modal now handles its own completion animation and closing

  return (
    <>
      <PendingTransactionsTab onSelectTransaction={handleSelectTransaction} />
      {activeWithdrawalTx && (
        <WithdrawalStepsModal
          isOpen={isWithdrawalModalOpen}
          onClose={handleCloseWithdrawalModal}
          transaction={activeWithdrawalTx}
          onProve={handleProveWithdrawal}
          onResolve={handleResolveGame}
          onResolveGame={handleResolveGameFinal}
          onFinalize={handleFinalizeWithdrawal}
        />
      )}
      <div className="w-full max-w-2xl mx-auto p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-card text-card-foreground border border-border/50 rounded-3xl p-4 sm:p-8 space-y-6 relative shadow-xl"
        style={{
          transition: 'none'
        }}
      >
        {/* From and To Chain Selection - Stacks on mobile, side by side on desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          {/* From Chain */}
          <div className="flex-1 bg-muted/30 border border-border/30 rounded-2xl p-4 sm:p-5 hover:border-border/50 transition-all duration-200">
            <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">From</div>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${fromToken.color} flex items-center justify-center flex-shrink-0`}>
                {fromToken.logo === 'psdn-svg' ? (
                  <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                    <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                    <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                    <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                  </svg>
                ) : fromToken.logo.startsWith('http') ? (
                  <Image 
                    src={fromToken.logo} 
                    alt={fromToken.symbol}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{fromToken.logo}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-foreground font-bold text-xl">{fromToken.symbol}</span>
                  {fromToken.layer && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      fromToken.layer === 'L1' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {fromToken.layer} 
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs truncate">{fromToken.balance} {fromToken.symbol} available</div>
              </div>
            </div>
          </div>

          {/* Swap Button - Centered on mobile, between cards on desktop */}
          <div className="flex items-center justify-center relative z-10 md:-mx-1">
            <Button
              onClick={handleSwap}
              className="rounded-full p-2.5 h-10 w-10 bg-muted/40 border border-border/30 hover:bg-muted/60 hover:border-border/50 transition-all duration-200 shadow-sm"
              variant="outline"
            >
              <ArrowLeftRight className="h-4 w-4 md:block hidden" />
              <ArrowUpDown className="h-4 w-4 md:hidden" />
            </Button>
          </div>

          {/* To Chain */}
          <div className="flex-1 bg-muted/30 border border-border/30 rounded-2xl p-4 sm:p-5 hover:border-border/50 transition-all duration-200">
            <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">To</div>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${toToken.color} flex items-center justify-center flex-shrink-0`}>
                {toToken.logo === 'psdn-svg' ? (
                  <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                    <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                    <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                    <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                  </svg>
                ) : toToken.logo.startsWith('http') ? (
                  <Image 
                    src={toToken.logo} 
                    alt={toToken.symbol}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{toToken.logo}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-foreground font-bold text-xl">{toToken.symbol}</span>
                  {toToken.layer && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      toToken.layer === 'L1' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {toToken.layer} 
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs truncate">{toToken.balance} {toToken.symbol} available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Single Amount Input Field */}
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 sm:p-5 space-y-4 relative z-10 hover:border-border/50 transition-all duration-200">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => {
                handleFromAmountChange(e.target.value);
              }}
              onBlur={handleFromAmountBlur}
              placeholder="0"
              className="text-2xl sm:text-4xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full placeholder:text-muted-foreground/30 flex-1 min-w-0"
              disabled={false}
            />
            <div className="flex items-center flex-shrink-0">
              <Button
                onClick={() => setIsTokenSelectorOpen(true)}
                className="h-10 sm:h-12 px-3 sm:px-4 bg-background/60 border border-input/30 rounded-xl hover:bg-background/80 hover:border-input/50 transition-all duration-200 flex items-center space-x-2 shadow-sm"
              >
                <div className={`w-6 h-6 rounded-full ${fromToken.color} flex items-center justify-center`}>
                  {fromToken.logo === 'psdn-svg' ? (
                    <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white">
                      <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                      <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                      <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                    </svg>
                  ) : fromToken.logo.startsWith('http') ? (
                    <Image 
                      src={fromToken.logo} 
                      alt={fromToken.symbol}
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-xs">{fromToken.logo}</span>
                  )}
                </div>
                <span className="text-foreground font-semibold text-sm sm:text-base">{fromToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-muted-foreground text-xs sm:text-sm">{fromToken.balance} {fromToken.symbol} available</div>
            <button
              onClick={handleMaxClick}
              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-muted/70 border border-border/30 hover:border-border/50 rounded-lg transition-all duration-200"
            >
              MAX
            </button>
          </div>
        </div>


        {/* Action Button */}
        <div className="relative z-10 pt-2">
        {!address ? (
          <button
            onClick={() => openConnectModal?.()}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect Wallet
          </button>
        ) : !isOnCorrectNetwork ? (
          <button
            onClick={handleSwitchNetwork}
            disabled={isSwitchingChain}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwitchingChain ? "Switching..." : `Switch to ${requiredNetwork.name}`}
          </button>
        ) : showL1ToL2Success ? (
        <motion.button
          disabled
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg overflow-hidden relative border border-blue-300/30"
          initial={{ scale: 1 }}
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.1))',
              backgroundSize: '300% 100%',
            }}
            initial={{ backgroundPosition: '0% 0%' }}
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 0%', '200% 0%', '0% 0%']
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3), transparent)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
            }}
          />
          <motion.span 
            className="relative z-10 text-gray-200 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Confirmed
          </motion.span>
        </motion.button>
        ) : (
        <button
          onClick={handleTransact}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isTransactionPending || isApprovePending || isApproveConfirming || (bridgeEthTxData && !isBridgeEthConfirmed) || (depositErc20TxData && !isDepositErc20Confirmed)}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApprovePending ? "Approving..." : 
           isApproveConfirming ? "Confirming Approval..." : 
           (isBridgeEthPending || isDepositErc20Pending || isL2BridgeErc20Pending || isL2BridgeEthPending || 
            (bridgeEthTxData && !isBridgeEthConfirmed) || (depositErc20TxData && !isDepositErc20Confirmed)) ? "Bridging..." : (
            needsApproval ? "Approve PSDN" : "Bridge"
          )}
        </button>
        )}
        </div>

        {/* Error Display - Only show non-cancelled errors */}
        {hasError && formatTransactionError(hasError) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg relative z-10">
            <p className="text-destructive text-sm font-medium">
              Error: {formatTransactionError(hasError)}
            </p>
          </div>
        )}

        {/* Token Selector */}
        <TokenSelector
          selectedToken={fromToken}
          onTokenSelect={handleTokenSelect}
          tokens={availableTokens}
          isOpen={isTokenSelectorOpen}
          onClose={() => setIsTokenSelectorOpen(false)}
          title="Select a token"
        />
      </motion.div>
      </div>
    </>
  );
}
