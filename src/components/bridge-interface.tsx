"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TokenSelector } from "@/components/token-selector";
import { PendingTransactionsTab } from "@/components/pending-transactions-tab";
import { WithdrawalStepsModal } from "@/components/withdrawal-steps-modal";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance, useSwitchChain, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
  TEST_MODE,
  type BridgeOption,
  type Token,
  PSDN_L1_TOKEN,
  PSDN_L2_TOKEN,
  ETH_L1_TOKEN,
  ETH_L2_TOKEN,
  DEFAULT_FROM_TOKEN,
  DEFAULT_TO_TOKEN,
  DEFAULT_BRIDGE_OPTION,
} from "@/lib/constants";
import {
  formatBalance,
  formatBalanceFromValue,
  getAvailableL1Tokens,
  getAvailableL2Tokens,
  formatAmount,
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
} from "@/lib/transaction-tracker";


export function BridgeInterface() {
  // State
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TO_TOKEN);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [bridgeOption] = useState<BridgeOption>(DEFAULT_BRIDGE_OPTION);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [l2TxHash, setL2TxHash] = useState<string | null>(null);
  const [activeWithdrawalTxId, setActiveWithdrawalTxId] = useState<string | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  
  // Track which transactions are currently being processed to prevent duplicates
  const processingTxs = useRef<Set<string>>(new Set());

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Notification helper (no-op for now, can be enhanced later)
  const addNotification = useCallback((type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);
  
  // L2 to L1 withdrawal functions are imported from /lib/l2-to-l1/

  // State for proof submission
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

  // State to track if dispute game resolution is in progress
  const [isResolvingGame, setIsResolvingGame] = useState(false);
  
  // State to track if withdrawal process is complete
  const [isWithdrawalComplete, setIsWithdrawalComplete] = useState(false);

  // Wagmi hooks for L1 transactions
  const { writeContract: writeProofContract, data: proofTxHash, error: proofError } = useWriteContract();
  const { writeContract: writeResolveClaimsContract, data: resolveClaimsTxHash } = useWriteContract();
  const { writeContract: writeResolveGameContract, data: resolveGameTxHash } = useWriteContract();
  const { writeContract: writeFinalizeContract, data: finalizeTxHash } = useWriteContract();

  // Wrap switchChain to return a Promise for submitProof
  const switchChainAsync = useCallback(async (params: { chainId: number }) => {
    return new Promise<void>((resolve, reject) => {
      switchChain(params, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  }, [switchChain]);

  // Submit proof to L1
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

  // Wait for proof transaction confirmation
  const { isLoading: isProofConfirming, isSuccess: isProofConfirmed } = useWaitForTransactionReceipt({
    hash: proofTxHash,
  });

  // Wait for resolve claims transaction confirmation
  const { isLoading: isResolveClaimsConfirming, isSuccess: isResolveClaimsConfirmed, error: resolveClaimsError } = useWaitForTransactionReceipt({
    hash: resolveClaimsTxHash,
  });

  // Wait for resolve game transaction confirmation
  const { isLoading: isResolveGameConfirming, isSuccess: isResolveGameConfirmed, error: resolveGameError } = useWaitForTransactionReceipt({
    hash: resolveGameTxHash,
  });

  // Wait for finalize transaction confirmation
  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed, error: finalizeError } = useWaitForTransactionReceipt({
    hash: finalizeTxHash,
  });

  // Use imported finalizeWithdrawal function
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

  // Use imported resolveGame function
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

  // Monitor resolve claims transaction status (Step 5a)
  useEffect(() => {
    if (resolveClaimsTxHash) {
      console.log(`\n✅ Resolve Claims Transaction Submitted: ${resolveClaimsTxHash}`);
      
      // Update status to resolving_game when transaction hash is available (user confirmed in wallet)
      if (proofSubmissionData) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => t.withdrawalDetails?.withdrawalHash === txId);
        
        if (tx && tx.status === 'waiting_resolve_signature') {
          TransactionStorage.update({ 
            id: tx.id, 
            status: 'resolving_game',
            l1ResolveClaimsTxHash: resolveClaimsTxHash 
          });
          console.log('   Status updated: waiting_resolve_signature → resolving_game');
        }
      }
    }
    if (isResolveClaimsConfirming) {
      console.log('\n⏳ Waiting for resolve claims confirmation...');
    }
    if (isResolveClaimsConfirmed && proofSubmissionData) {
      console.log('\n✅ Resolve Claims Transaction Confirmed!');
      console.log('   All claims have been resolved. User must now click "Resolve Game" button');
      
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      // GUARD: Don't process if transaction is completed or in error state
      if (!tx) {
        console.log(`⚠️ Transaction not found for ${txId}`);
        return;
      }
      
      if (tx.status === 'completed' || tx.status === 'error') {
        console.log(`🛑 Transaction ${tx.id} is ${tx.status}, skipping status update`);
        return;
      }
      
      // Update status to resolving_game - this enables the "Resolve Game" button
      TransactionStorage.update({ id: tx.id, status: 'resolving_game' });
      console.log('🎯 Resolve Game button is now active - waiting for user to click');
    }
    if (resolveClaimsError) {
      console.error('❌ Resolve Claims Transaction Failed:', resolveClaimsError);
      
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.markError(tx.id, `Resolve claims transaction failed: ${resolveClaimsError.message}`);
        }
      }
    }
  }, [resolveClaimsTxHash, isResolveClaimsConfirming, isResolveClaimsConfirmed, resolveClaimsError, proofSubmissionData, writeResolveGameContract]);

  // Monitor resolve game transaction status (Step 5b)
  useEffect(() => {
    if (resolveGameTxHash) {
      console.log(`\n✅ Resolve Game Transaction Submitted: ${resolveGameTxHash}`);
      
      // Update transaction storage
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.update({ 
            id: tx.id, 
            l1ResolveGameTxHash: resolveGameTxHash as string,
          });
        }
      }
    }
    if (isResolveGameConfirming) {
      console.log('\n⏳ Waiting for resolve game confirmation...');
    }
    if (isResolveGameConfirmed && proofSubmissionData) {
      console.log('\n✅ Resolve Game Transaction Confirmed!');
      
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (!tx) {
        console.error('❌ Transaction not found for finalization');
        return;
      }
      
      // GUARD: Don't process if transaction is completed or in error state
      if (tx.status === 'completed' || tx.status === 'error') {
        console.log(`🛑 Transaction ${tx.id} is ${tx.status}, skipping status update`);
        return;
      }
      
      // Check if already at finalization stage
      if (tx.status === 'finalizing' || tx.status === 'waiting_finalize_signature') {
        console.log(`ℹ️ Transaction ${tx.id} already at status ${tx.status}, skipping update`);
        return;
      }
      
      // Update status to game_resolved - this enables the finalize button
      TransactionStorage.update({ id: tx.id, status: 'game_resolved' });
      
      console.log('\n🎯 Step 6 Ready: Game resolved, ready for finalization');
      console.log('   User must click the "Get" button in the withdrawal modal to finalize and receive tokens');
    }
    if (resolveGameError) {
      console.error('❌ Resolve Game Transaction Failed:', resolveGameError);
      
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.markError(tx.id, `Resolve game transaction failed: ${resolveGameError.message}`);
        }
      }
    }
  }, [resolveGameTxHash, isResolveGameConfirming, isResolveGameConfirmed, resolveGameError, proofSubmissionData, finalizeWithdrawal]);

  // Monitor finalize withdrawal transaction status
  useEffect(() => {
    if (finalizeTxHash) {
      console.log(`\n✅ Finalize Withdrawal Transaction Submitted: ${finalizeTxHash}`);
      
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
          console.log('   Status updated: waiting_finalize_signature → finalizing');
        }
      }
    }
    if (isFinalizeConfirming) {
      console.log('\n⏳ Waiting for finalize withdrawal confirmation...');
    }
    if (isFinalizeConfirmed && proofSubmissionData) {
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      // GUARD: Only mark as completed if currently finalizing
      if (!tx) {
        console.log(`⚠️ Transaction not found for ${txId}`);
        return;
      }
      
      if (tx.status === 'completed') {
        console.log(`🛑 Transaction ${tx.id} is already completed, skipping`);
        return;
      }
      
      if (tx.status === 'error') {
        console.log(`🛑 Transaction ${tx.id} is in error state, skipping completion`);
        return;
      }
      
      console.log('\n✅ Finalize Withdrawal Transaction Confirmed!');
      console.log('🎉 Withdrawal process completed successfully!');
      
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
      
      console.log(`✅ Transaction ${tx.id} marked as completed`);
    }
    if (finalizeError) {
      console.error('❌ Finalize Withdrawal Transaction Failed:', finalizeError);
      
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.markError(tx.id, `Finalize withdrawal transaction failed: ${finalizeError.message}`);
        }
      }
    }
  }, [finalizeTxHash, isFinalizeConfirming, isFinalizeConfirmed, finalizeError, proofSubmissionData, setIsWithdrawalComplete]);

  // Monitor proof submission status
  useEffect(() => {
    if (proofTxHash) {
      console.log(`\n✅ Proof Transaction Submitted: ${proofTxHash}`);
      
      // Update status to proof_submitted when transaction hash is available (user confirmed in wallet)
      if (proofSubmissionData) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => t.withdrawalDetails?.withdrawalHash === txId);
        
        if (tx && tx.status === 'waiting_proof_signature') {
          TransactionStorage.update({ 
            id: tx.id, 
            status: 'proof_submitted',
            l1ProofTxHash: proofTxHash 
          });
          console.log('   Status updated: waiting_proof_signature → proof_submitted');
        }
      }
    }
    if (isProofConfirming) {
      console.log('\n⏳ Waiting for proof confirmation...');
    }
    if (isProofConfirmed && proofSubmissionData) {
      // Get the transaction ID from withdrawal hash
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      
      // Check if we're already processing this proof confirmation
      if (processingTxs.current.has(`proof_${txId}`)) {
        console.log(`🔄 Proof for ${txId} is already being resolved, skipping duplicate`);
        return;
      }
      
      // Find the transaction
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      // GUARD: Don't process if transaction is completed or in error state
      if (!tx) {
        console.log(`⚠️ Transaction not found for ${txId}, skipping Step 5`);
        return;
      }
      
      if (tx.status === 'completed' || tx.status === 'error') {
        console.log(`🛑 Transaction ${tx.id} is ${tx.status}, skipping Step 5`);
        return;
      }
      
      // Check if already past proof_confirmed status
      if (tx.status !== 'proof_submitted' && tx.status !== 'proof_confirmed') {
        console.log(`ℹ️ Transaction ${tx.id} already past proof confirmation (status: ${tx.status}), skipping Step 5`);
        return;
      }
      
      console.log('\n✅ Step 4.5 Complete: Proof transaction confirmed!');
      
      // Update transaction status to proof_confirmed
      // This enables the challenge period countdown and prepares for user to click "Resolve"
      if (tx) {
        TransactionStorage.update({ 
          id: tx.id, 
          status: 'proof_confirmed',
          l1ProofTxHash: proofTxHash as string,
        });
        
        console.log('\n🎯 Step 5 Ready: Proof confirmed, challenge period starting');
        console.log('   User must wait for challenge period, then click "Resolve" button to continue');
      } else {
        console.error('❌ Cannot update status: Transaction not found');
      }
    }
    if (proofError) {
      console.error('❌ Step 4 FAILED: Proof submission transaction failed:', proofError);
      console.error('   Cannot proceed to Steps 5 & 6');
    }
  }, [proofTxHash, isProofConfirming, isProofConfirmed, proofError, proofSubmissionData, resolveGame]);


  // Function to log receipt details and extract MessagePassed event using viem
  const logReceiptDetails = useCallback(async (txHash: string) => {
    try {
      console.log('\n⏳ Waiting for transaction confirmation...');
      
      // Check if already processing to prevent duplicate processing
      const tx = TransactionStorage.getById(txHash);
      if (tx && tx.status !== 'pending' && tx.status !== 'l2_confirmed') {
        console.log(`⚠️ Transaction ${txHash} is already being processed (status: ${tx.status}), aborting to prevent duplicate`);
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
      
      console.log('\n📦 Receipt Details:');
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed}`);
      
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
        
        console.log('\n📋 MessagePassed Event Details:');
        console.log(`   Withdrawal Hash: ${withdrawalHash}`);
        console.log(`   Nonce: ${withdrawalDetails.nonce}`);
        console.log(`   Sender: ${withdrawalDetails.sender}`);
        console.log(`   Target: ${withdrawalDetails.target}`);
        console.log(`   Value: ${withdrawalDetails.value} wei`);
        console.log(`   Gas Limit: ${withdrawalDetails.gasLimit}`);
        console.log(`   Data Length: ${withdrawalDetails.data.length} bytes`);
      } else {
        console.log('\n⚠️ No MessagePassed event found in transaction logs');
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
          console.log('\n🎮 Starting Step 2: Waiting for dispute game...');
          
          let disputeGame;
          try {
            disputeGame = await waitForDisputeGame(Number(receipt.blockNumber));
            TransactionStorage.update({ id: txHash, status: 'game_found', disputeGame });
            console.log('\n✅ Step 2 Complete: Dispute game found!');
            console.log(`   Game Address: ${disputeGame.gameAddress}`);
            console.log(`   Game Index: ${disputeGame.gameIndex}`);
            console.log(`   Game L2 Block: ${disputeGame.gameL2Block}`);
            console.log(`   Root Claim: ${disputeGame.rootClaim}`);
          } catch (error) {
            console.error('❌ Step 2 FAILED - Cannot proceed to Step 3:', error);
            TransactionStorage.markError(txHash, `Step 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new Error(`Step 2 (Wait for dispute game) failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
            
          // Step 3: Generate Merkle Proof (only if Step 2 succeeded)
          TransactionStorage.update({ id: txHash, status: 'generating_proof' });
          console.log('\n🔧 Starting Step 3: Generating Merkle proof...');
          
          let proofData;
          try {
            proofData = await generateProof(withdrawalDetails, Number(receipt.blockNumber), disputeGame);
            TransactionStorage.update({ id: txHash, status: 'proof_generated', proofData });
            console.log('\n✅ Step 3 Complete: Merkle proof generated successfully!');
            console.log(`   Withdrawal Proof Nodes: ${proofData.withdrawalProof.length}`);
            console.log(`   Storage Slot: ${proofData.storageSlot}`);
            console.log(`   Output Root Proof:`, proofData.outputRootProof);
          } catch (error) {
            console.error('❌ Step 3 FAILED - Cannot proceed to Step 4:', error);
            TransactionStorage.markError(txHash, `Step 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          console.log('\n✅ Step 4 Ready: Proof generated, waiting for user to click "Prove" button');
          console.log('   User must manually click the "Prove" button in the withdrawal modal to continue');
        }
      
    } catch (error) {
      console.error('❌ Failed to get receipt details:', error);
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
  const { writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteMintPsdnApprove();
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

  // Update tokens when bridge option changes (only when explicitly selected by user via token selector)
  // Note: This effect is intentionally minimal - swapping should NOT trigger token changes
  useEffect(() => {
    // Only update if we're in the default L1->L2 direction AND the current token doesn't match the bridge option
    if (isL1OnTop && fromToken.symbol !== (bridgeOption === 'psdn' ? 'PSDN' : 'ETH')) {
      const newFromToken = bridgeOption === 'psdn' ? PSDN_L1_TOKEN : ETH_L1_TOKEN;
      const newToToken = bridgeOption === 'psdn' ? PSDN_L2_TOKEN : ETH_L2_TOKEN;
      
      // Only update if this is actually a change from the user selecting a different token
      // Don't update if the user has swapped to L2->L1 (this would force unwanted changes)
      if (fromToken.layer === 'L1' && toToken.layer === 'L2') {
        setFromToken(newFromToken);
        setToToken(newToToken);
      }
    }
  }, [bridgeOption]);
  
  // Balance hooks - Fetch balances from both L1 and L2 networks
  const { data: psdnBalance, refetch: refetchPsdnBalance, isLoading: isPsdnBalanceLoading } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L1,
  });

  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance, isLoading: isPsdnL2BalanceLoading } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L2,
  });

  const { data: ethBalance, refetch: refetchEthBalance, isLoading: isEthBalanceLoading } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
    query: {
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: ethL2Balance, refetch: refetchEthL2Balance, isLoading: isEthL2BalanceLoading } = useBalance({
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
    args: address ? [address, CONTRACT_ADDRESSES.APPROVAL_TARGET] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
    chainId: CHAIN_IDS.L1,
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
    if (ethBalance !== undefined) {
      const balanceStr = formatBalanceFromValue(ethBalance);
      setFromToken(prev => 
        prev.symbol === 'ETH' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'ETH' && prev.layer === 'L1' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [ethBalance]);

  useEffect(() => {
    if (ethL2Balance !== undefined) {
      const balanceStr = formatBalanceFromValue(ethL2Balance);
      setFromToken(prev => 
        prev.symbol === 'ETH' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
      setToToken(prev => 
        prev.symbol === 'ETH' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [ethL2Balance]);

  // Force refetch balances when wallet connects or changes
  useEffect(() => {
    if (address) {
      console.log('💰 Wallet connected, fetching all balances...');
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchEthBalance();
      refetchEthL2Balance();
      refetchAllowance();
    }
  }, [address, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance]);

  // Refetch balances when user swaps (after animation completes)
  useEffect(() => {
    if (!isSwapping && address) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        console.log('🔄 Swap complete, refreshing balances...');
        refetchPsdnBalance();
        refetchPsdnL2Balance();
        refetchEthBalance();
        refetchEthL2Balance();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSwapping, address, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance]);

  // Refetch balances when network changes
  useEffect(() => {
    if (address && chainId) {
      console.log(`🌐 Network changed to ${chainId}, refreshing balances...`);
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchEthBalance();
      refetchEthL2Balance();
      refetchAllowance();
    }
  }, [chainId, address, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance]);

  // Balance polling is now handled by refetchInterval in the hooks above

  // Handle L1 to L2 ETH bridge transaction
  useEffect(() => {
    if (bridgeEthTxData && address) {
      const existingTx = TransactionStorage.getById(bridgeEthTxData);
      
      if (!existingTx) {
        TransactionStorage.create({
          id: bridgeEthTxData,
          l1TxHash: bridgeEthTxData,
          status: 'pending',
          type: 'L1_TO_L2',
          token: 'ETH',
          amount: fromAmount,
          fromAddress: address,
        });
        console.log(`📝 Created L1→L2 ETH transaction record: ${bridgeEthTxData}`);
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
        console.log(`📝 Created L1→L2 PSDN transaction record: ${depositErc20TxData}`);
      }
    }
  }, [depositErc20TxData, address, fromAmount]);

  // Wait for L1 to L2 ETH transaction confirmation
  const { isSuccess: isBridgeEthConfirmed } = useWaitForTransactionReceipt({
    hash: bridgeEthTxData as `0x${string}`,
    chainId: CHAIN_IDS.L1,
  });

  // Wait for L1 to L2 PSDN transaction confirmation
  const { isSuccess: isDepositErc20Confirmed } = useWaitForTransactionReceipt({
    hash: depositErc20TxData as `0x${string}`,
    chainId: CHAIN_IDS.L1,
  });

  // Mark L1 to L2 ETH transaction as completed
  useEffect(() => {
    if (isBridgeEthConfirmed && bridgeEthTxData) {
      const tx = TransactionStorage.getById(bridgeEthTxData);
      if (tx && tx.status === 'pending') {
        TransactionStorage.update({
          id: bridgeEthTxData,
          status: 'completed',
          completedAt: Date.now(),
        });
        console.log(`✅ L1→L2 ETH transaction completed: ${bridgeEthTxData}`);
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
        console.log(`✅ L1→L2 PSDN transaction completed: ${depositErc20TxData}`);
      }
    }
  }, [isDepositErc20Confirmed, depositErc20TxData]);

  // Handle L2 to L1 PSDN transaction hash when it becomes available
  useEffect(() => {
    if (l2TxData && address) {
      // Check if transaction already exists to prevent duplicates
      const existingTx = TransactionStorage.getById(l2TxData);
      
      if (!existingTx) {
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
        
        console.log(`📝 Created L2→L1 PSDN transaction record: ${l2TxData}`);
        
        // Open withdrawal modal for this transaction
        setActiveWithdrawalTxId(l2TxData);
        setIsWithdrawalModalOpen(true);
      } else {
        console.log(`ℹ️ Transaction ${l2TxData} already exists, skipping creation`);
      }
      
      setL2TxHash(l2TxData);
    }
  }, [l2TxData, address, fromAmount]);

  // Handle L2 to L1 ETH transaction hash when it becomes available
  useEffect(() => {
    if (l2EthTxData && address) {
      // Check if transaction already exists to prevent duplicates
      const existingTx = TransactionStorage.getById(l2EthTxData);
      
      if (!existingTx) {
        // Create transaction record in localStorage only if it doesn't exist
        TransactionStorage.create({
          id: l2EthTxData,
          l2TxHash: l2EthTxData,
          status: 'pending',
          type: 'L2_TO_L1',
          token: 'ETH',
          amount: fromAmount,
          fromAddress: address,
        });
        
        console.log(`📝 Created L2→L1 ETH transaction record: ${l2EthTxData}`);
        
        // Open withdrawal modal for this transaction
        setActiveWithdrawalTxId(l2EthTxData);
        setIsWithdrawalModalOpen(true);
      } else {
        console.log(`ℹ️ Transaction ${l2EthTxData} already exists, skipping creation`);
      }
      
      setL2TxHash(l2EthTxData);
    }
  }, [l2EthTxData, address, fromAmount]);

  // Handle L2 transaction receipt
  useEffect(() => {
    if (l2TxReceipt && l2TxHash) {
      // Check if we're already processing this transaction
      if (processingTxs.current.has(l2TxHash)) {
        console.log(`🔄 Transaction ${l2TxHash} is already being processed, skipping duplicate`);
        return;
      }
      
      console.log('L2 Transaction confirmed!');
      console.log('Transaction Hash:', l2TxHash);
      console.log('Block Number:', l2TxReceipt.blockNumber);
      
      // Check if we've already processed this transaction to prevent infinite loop
      const tx = TransactionStorage.getById(l2TxHash);
      if (tx && tx.status !== 'pending') {
        console.log(`ℹ️ Transaction ${l2TxHash} already processed (status: ${tx.status}), skipping`);
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
    // Only allow numbers, single decimal point, and empty string
    const validNumberRegex = /^(\d*\.?\d*)$/;
    
    if (validNumberRegex.test(amount) || amount === '') {
      setFromAmount(amount);
      
      // Simple conversion logic (1:1 for demo)
      setToAmount(formatAmount(amount));
    }
    // If invalid input, do nothing (prevents letters from appearing)
  }, []);

  const handleToAmountChange = useCallback((amount: string) => {
    // Only allow numbers, single decimal point, and empty string
    const validNumberRegex = /^(\d*\.?\d*)$/;
    
    if (validNumberRegex.test(amount) || amount === '') {
      setToAmount(amount);
      
      // Reverse conversion logic
      setFromAmount(formatAmount(amount));
    }
    // If invalid input, do nothing (prevents letters from appearing)
  }, []);

  const handleFromAmountBlur = useCallback(() => {
    setFromAmount(formatAmountOnBlur(fromAmount));
  }, [fromAmount]);

  const handleToAmountBlur = useCallback(() => {
    setToAmount(formatAmountOnBlur(toAmount));
  }, [toAmount]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: requiredNetwork.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain, requiredNetwork.id]);

  const handleTokenSelect = useCallback((selectedToken: Token) => {
    // Get the correct balance based on token type and layer
    const balanceStr = getTokenBalance(
      selectedToken,
      psdnBalance,
      psdnL2Balance,
      ethBalance,
      ethL2Balance
    );
    
    const updatedFromToken = { ...selectedToken, balance: balanceStr };
    
    // Determine the corresponding toToken based on the selected fromToken
    let updatedToToken: Token;
    if (selectedToken.layer === 'L1') {
      // If L1 is selected, set corresponding L2 token
      if (selectedToken.symbol === 'PSDN') {
        updatedToToken = { ...PSDN_L2_TOKEN, balance: formatBalance(psdnL2Balance) };
      } else {
        updatedToToken = { ...ETH_L2_TOKEN, balance: formatBalanceFromValue(ethL2Balance) };
      }
    } else {
      // If L2 is selected, set corresponding L1 token
      if (selectedToken.symbol === 'PSDN') {
        updatedToToken = { ...PSDN_L1_TOKEN, balance: formatBalance(psdnBalance) };
      } else {
        updatedToToken = { ...ETH_L1_TOKEN, balance: formatBalanceFromValue(ethBalance) };
      }
    }
    
    // Update both tokens in a single batch to reduce re-renders
    setFromToken(updatedFromToken);
    setToToken(updatedToToken);
    setIsTokenSelectorOpen(false);
  }, [psdnBalance, psdnL2Balance, ethBalance, ethL2Balance]);


  // Handlers for withdrawal modal actions
  const handleProveWithdrawal = useCallback(() => {
    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.withdrawalDetails || !tx.disputeGame || !tx.proofData) {
      console.error('Cannot prove: missing withdrawal details');
      return;
    }
    
    // Guard: Only allow if proof is ready
    if (tx.status !== 'proof_generated') {
      console.log(`⚠️ Cannot prove: transaction status is ${tx.status}, expected 'proof_generated'`);
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`prove_${tx.id}`)) {
      console.log('⚠️ Proof submission already in progress, ignoring duplicate click');
      return;
    }
    
    processingTxs.current.add(`prove_${tx.id}`);
    
    // Update status to waiting for signature
    TransactionStorage.update({ id: tx.id, status: 'waiting_proof_signature' });
    console.log('\n📤 User clicked "Prove" - Submitting proof to L1...');
    
    // Submit proof - this will prompt user's wallet
    submitProof(tx.withdrawalDetails, tx.disputeGame, tx.proofData)
      .catch((error) => {
        console.error('❌ Proof submission failed:', error);
        TransactionStorage.markError(tx.id, `Proof submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      })
      .finally(() => {
        processingTxs.current.delete(`prove_${tx.id}`);
      });
  }, [activeWithdrawalTxId, submitProof]);
  
  const handleResolveGame = useCallback(async () => {
    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.disputeGame) {
      console.error('Cannot resolve: missing dispute game');
      return;
    }
    
    // Guard: Only allow if proof is confirmed (for resolve claims step)
    if (tx.status !== 'proof_confirmed') {
      console.log(`⚠️ Cannot resolve claims: transaction status is ${tx.status}, expected 'proof_confirmed'`);
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`resolve_${tx.id}`)) {
      console.log('⚠️ Resolve claims already in progress, ignoring duplicate click');
      return;
    }
    
    processingTxs.current.add(`resolve_${tx.id}`);
    
    // Check if challenge period has elapsed (only if not in test mode)
    if (!TEST_MODE) {
      console.log('\n⏳ User clicked "Resolve" - Challenge period verified by countdown');
    }
    
    console.log('\n🎯 User clicked "Resolve" (Step 5) - Starting resolve claims...');
    
    // Call resolveGame - this will send resolve claims transaction
    resolveGame(tx.disputeGame.gameAddress, tx.id)
      .catch((error) => {
        console.error('❌ Resolve claims failed:', error);
        TransactionStorage.markError(tx.id, `Resolve claims failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      })
      .finally(() => {
        processingTxs.current.delete(`resolve_${tx.id}`);
      });
  }, [activeWithdrawalTxId, resolveGame]);
  
  const handleResolveGameFinal = useCallback(() => {
    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !proofSubmissionData?.disputeGame) {
      console.error('Cannot resolve game: missing dispute game data');
      return;
    }
    
    // Guard: Only allow if resolve claims is complete (status is resolving_game)
    if (tx.status !== 'resolving_game') {
      console.log(`⚠️ Cannot resolve game: transaction status is ${tx.status}, expected 'resolving_game'`);
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`resolve_game_final_${tx.id}`)) {
      console.log('⚠️ Resolve game already in progress, ignoring duplicate click');
      return;
    }
    
    processingTxs.current.add(`resolve_game_final_${tx.id}`);
    
    console.log('\n🎯 User clicked "Resolve Game" (Step 6) - Sending resolve game transaction...');
    
    // Get the dispute game address from proof submission data
    const gameAddress = proofSubmissionData.disputeGame.gameAddress;
    
    // Send the resolve game transaction directly
    writeResolveGameContract({
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
    
    console.log('✅ Resolve game transaction sent - waiting for confirmation...');
    
    // Clean up processing flag after a delay
    setTimeout(() => {
      processingTxs.current.delete(`resolve_game_final_${tx.id}`);
    }, 1000);
  }, [activeWithdrawalTxId, proofSubmissionData, writeResolveGameContract]);
  
  const handleFinalizeWithdrawal = useCallback(() => {
    if (!activeWithdrawalTxId) return;
    
    const tx = TransactionStorage.getById(activeWithdrawalTxId);
    if (!tx || !tx.withdrawalDetails) {
      console.error('Cannot finalize: missing withdrawal details');
      return;
    }
    
    // Guard: Only allow if game is resolved
    if (tx.status !== 'game_resolved') {
      console.log(`⚠️ Cannot finalize: transaction status is ${tx.status}, expected 'game_resolved'`);
      return;
    }
    
    // Guard: Prevent duplicate submissions
    if (processingTxs.current.has(`finalize_${tx.id}`)) {
      console.log('⚠️ Finalization already in progress, ignoring duplicate click');
      return;
    }
    
    processingTxs.current.add(`finalize_${tx.id}`);
    
    console.log('\n🎯 User clicked "Get" - Finalizing withdrawal...');
    
    // Call finalizeWithdrawal - this will prompt user's wallet
    finalizeWithdrawal(tx.withdrawalDetails, tx.id)
      .catch((error) => {
        console.error('❌ Finalization failed:', error);
        TransactionStorage.markError(tx.id, `Finalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      })
      .finally(() => {
        processingTxs.current.delete(`finalize_${tx.id}`);
      });
  }, [activeWithdrawalTxId, finalizeWithdrawal]);

  // Test mode: Create a mock withdrawal transaction
  const handleTestModeWithdrawal = useCallback(() => {
    if (!address || !TEST_MODE) return;
    
    // Create a mock L2 transaction ID
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    
    // Create transaction record
    TransactionStorage.create({
      id: mockTxHash,
      l2TxHash: mockTxHash,
      status: 'pending',
      type: 'L2_TO_L1',
      token: fromToken.symbol,
      amount: fromAmount || '0.3',
      fromAddress: address,
    });
    
    console.log(`📝 Created test L2→L1 transaction: ${mockTxHash}`);
    
    // Open withdrawal modal
    setActiveWithdrawalTxId(mockTxHash);
    setIsWithdrawalModalOpen(true);
  }, [address, fromToken.symbol, fromAmount]);

  const handleTransact = useCallback(async () => {
    if (!address || !fromAmount || !isValidAmount(fromAmount)) {
      return;
    }

    // If in test mode and doing L2->L1, create mock transaction
    if (TEST_MODE && isL2ToL1) {
      handleTestModeWithdrawal();
      return;
    }

    try {
      const amount = parseUnits(fromAmount, TOKEN_DECIMALS);

      if (fromToken.symbol === 'ETH') {
        // For ETH, handle both L1->L2 and L2->L1
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
          // L2 -> L1: Use L2Bridge bridgeErc20
          // Add to pending transactions immediately
          // L2 -> L1: Use bridgeERC20 on the L2StandardBridge
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
          // Check allowance with debug logging
          console.log('🔍 Checking approval status...');
          console.log('   Current allowance:', currentAllowance?.toString());
          console.log('   Required amount:', amount.toString());
          console.log('   Approval target:', CONTRACT_ADDRESSES.APPROVAL_TARGET);
          
          const needsApproval = !currentAllowance || currentAllowance < amount;
          console.log('   Needs approval?', needsApproval);
          
          if (needsApproval) {
            console.log('🔐 Requesting approval for', CONTRACT_ADDRESSES.APPROVAL_TARGET);
            // Approve max amount to avoid future approvals
            await writeApprove({
              args: [CONTRACT_ADDRESSES.APPROVAL_TARGET, BigInt(MAX_UINT256)],
            });
            console.log('✅ Approval transaction submitted - waiting for confirmation...');
            // Note: The actual deposit will happen after approval is confirmed
            // User will need to click the button again after approval confirms
            return;
          }
          
          // If we have approval, proceed with deposit
          console.log('💰 Proceeding with deposit transaction...');
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
      refetchEthBalance();
      refetchEthL2Balance();
      refetchAllowance();
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  }, [address, fromAmount, fromToken.symbol, isL2ToL1, currentAllowance, writeBridgeEth, writeL2BridgeEth, writeApprove, writeDepositErc20, writeL2BridgeErc20, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance, toToken.symbol, handleTestModeWithdrawal]);

  // Memoized values
  const availableTokens = useMemo(() => 
    isL1OnTop 
      ? getAvailableL1Tokens(psdnBalance, ethBalance)
      : getAvailableL2Tokens(psdnL2Balance, ethL2Balance),
    [isL1OnTop, psdnBalance, ethBalance, psdnL2Balance, ethL2Balance]
  );

  const isTransactionPending = useMemo(() =>
    isApprovePending || isBridgeEthPending || isDepositErc20Pending || isL2BridgeErc20Pending || isL2BridgeEthPending,
    [isApprovePending, isBridgeEthPending, isDepositErc20Pending, isL2BridgeErc20Pending, isL2BridgeEthPending]
  );

  const hasError = useMemo(() => 
    approveError || bridgeEthError || depositErc20Error || l2BridgeErc20Error || l2BridgeEthError,
    [approveError, bridgeEthError, depositErc20Error, l2BridgeErc20Error, l2BridgeEthError]
  );

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
  
  const activeWithdrawalTx = useMemo(() => {
    if (!activeWithdrawalTxId) return null;
    return TransactionStorage.getById(activeWithdrawalTxId);
  }, [activeWithdrawalTxId, refreshKey]);

  // Auto-close modal when withdrawal is completed
  useEffect(() => {
    if (activeWithdrawalTx && activeWithdrawalTx.status === 'completed') {
      // Close modal after a short delay when completed
      const timer = setTimeout(() => {
        setIsWithdrawalModalOpen(false);
        setActiveWithdrawalTxId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeWithdrawalTx]);

  return (
    <>
      <PendingTransactionsTab />
      {activeWithdrawalTx && (
        <WithdrawalStepsModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          transaction={activeWithdrawalTx}
          onProve={handleProveWithdrawal}
          onResolve={handleResolveGame}
          onResolveGame={handleResolveGameFinal}
          onFinalize={handleFinalizeWithdrawal}
        />
      )}
      <div className="w-full max-w-md mx-auto p-2">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-card text-card-foreground border rounded-2xl p-6 space-y-4 relative"
        style={{
          transition: 'none'
        }}
      >
        

        {/* From Token Card */}
        <div className="bg-card text-card-foreground border rounded-xl p-4 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                {fromToken.logo.startsWith('http') ? (
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
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">{fromToken.name}</span>
                  {fromToken.layer && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      fromToken.layer === 'L1' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {fromToken.layer} 
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-sm">{fromToken.balance} {fromToken.symbol}</div>
              </div>
            </div>
            <Button
              onClick={() => setIsTokenSelectorOpen(true)}
              className="h-10 w-10 p-0 bg-background/50 border border-input/20 rounded-lg hover:bg-background/80 hover:border-input/40 transition-all duration-200"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => {
                handleFromAmountChange(e.target.value);
              }}
              onBlur={handleFromAmountBlur}
              placeholder="0"
              className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
              disabled={false}
            />
            <div className="text-muted-foreground text-sm">Amount to bridge</div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center relative z-10">
          <Button
            onClick={handleSwap}
            className="rounded-full p-2 h-10 w-10"
            variant="outline"
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        </div>

        {/* To Token Card */}
        <div className="bg-card text-card-foreground border rounded-xl p-4 space-y-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              {toToken.logo.startsWith('http') ? (
                <Image 
                  src={toToken.logo} 
                  alt={toToken.symbol}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xs">{toToken.logo}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-foreground font-medium">{toToken.name}</span>
                {toToken.layer && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    toToken.layer === 'L1' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }`}>
                      {toToken.layer} 
                  </span>
                )}
              </div>
              <div className="text-muted-foreground text-sm">{toToken.balance} {toToken.symbol}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              inputMode="decimal"
              value={toAmount}
              onChange={(e) => handleToAmountChange(e.target.value)}
              onBlur={handleToAmountBlur}
              placeholder="0"
              className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
              disabled={false}
            />
            <div className="text-muted-foreground text-sm">You will receive</div>
          </div>
        </div>


        {/* Action Button */}
        <div className="relative z-10">
        {!isOnCorrectNetwork ? (
          <Button
            className="w-full mt-6"
            variant="outline"
            onClick={handleSwitchNetwork}
            disabled={isSwitchingChain}
          >
            {isSwitchingChain ? "Switching..." : `Switch to ${requiredNetwork.name}`}
          </Button>
        ) : (
        <Button
          className="w-full mt-6"
          variant="outline"
          onClick={handleTransact}
          disabled={!address || !fromAmount || parseFloat(fromAmount) <= 0 || isTransactionPending}
        >
          {isTransactionPending ? "Processing..." : (
            TEST_MODE && isL2ToL1 ? (
              <span className="flex items-center gap-2">
                🧪 Test Withdrawal (No Gas Required)
              </span>
            ) : needsApproval ? "Approve PSDN" : "Transact"
          )}
        </Button>
        )}
        </div>

        {/* Error Display */}
        {hasError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg relative z-10">
            <p className="text-destructive text-sm font-medium">
              Error: {hasError?.message}
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
