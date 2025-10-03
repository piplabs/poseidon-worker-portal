"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TokenSelector } from "@/components/token-selector";
import { PendingTransactionsTab } from "@/components/pending-transactions-tab";
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
  useWriteL2BridgeBridgeErc20
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
  waitForDisputeGame as waitForDisputeGameImported,
  generateProof as generateProofImported,
  submitProof as submitProofImported,
  resolveGame as resolveGameImported,
  finalizeWithdrawal as finalizeWithdrawalImported,
  optimismPortalAbi as importedOptimismPortalAbi,
} from "@/lib/l2-to-l1";
import {
  TransactionStorage,
  useWithdrawalTransactions,
  type TransactionStatus,
} from "@/lib/transaction-tracker";


export function BridgeInterface() {
  // State
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TO_TOKEN);
  const [fromAmount, setFromAmount] = useState(ZERO_AMOUNT);
  const [toAmount, setToAmount] = useState(ZERO_AMOUNT);
  const [bridgeOption] = useState<BridgeOption>(DEFAULT_BRIDGE_OPTION);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [l2TxHash, setL2TxHash] = useState<string | null>(null);
  
  // Track which transactions are currently being processed to prevent duplicates
  const processingTxs = useRef<Set<string>>(new Set());

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Notification helper (no-op for now, can be enhanced later)
  const addNotification = useCallback((type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);
  
  // L2 to L1 withdrawal functions are now imported from /lib/l2-to-l1/
  // Use imported waitForDisputeGame function
  const waitForDisputeGame = useCallback(async (l2BlockNumber: number) => {
    return await waitForDisputeGameImported(l2BlockNumber);
  }, []);

  // Use imported generateProof function
  const generateProof = useCallback(async (withdrawalDetails: MessagePassedEventData, l2BlockNumber: number, disputeGame: DisputeGameData) => {
    return await generateProofImported(withdrawalDetails, l2BlockNumber, disputeGame);
  }, []);

  // Use imported OptimismPortal ABI
  const optimismPortalAbi = importedOptimismPortalAbi;

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
  const { writeContract: writeProofContract, data: proofTxHash, isPending: isProofPending, error: proofError } = useWriteContract();
  const { writeContract: writeResolveClaimsContract, data: resolveClaimsTxHash } = useWriteContract();
  const { writeContract: writeResolveGameContract, data: resolveGameTxHash } = useWriteContract();
  const { writeContract: writeFinalizeContract, data: finalizeTxHash } = useWriteContract();

  // Use imported submitProof function
  const submitProof = useCallback(async (withdrawalDetails: MessagePassedEventData, disputeGame: DisputeGameData, proofData: ProofData) => {
    // Wrap switchChain to return a Promise
    const switchChainAsync = async (params: { chainId: number }) => {
      return new Promise<void>((resolve, reject) => {
        switchChain(params, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
    };

    return await submitProofImported({
      withdrawalDetails,
      disputeGame,
      proofData,
      chainId,
      switchChain: switchChainAsync,
      writeProofContract,
      addNotification,
    });
  }, [chainId, switchChain, writeProofContract, addNotification]);

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

  // Handle proof submission
  const handleSubmitProof = useCallback(async () => {
    if (!proofSubmissionData) return;

    try {
      // Check if user is on the correct network (Story Poseidon Devnet L1)
      console.log(`🔍 Current chain ID: ${chainId}, Target: ${CHAIN_IDS.L1} (Story Poseidon Devnet L1)`);
      
      if (chainId !== CHAIN_IDS.L1) {
        console.log('🔄 Switching to Story Poseidon Devnet L1 for proof submission...');
        try {
          await switchChain({ chainId: CHAIN_IDS.L1 });
          console.log('✅ Switched to Story Poseidon Devnet L1');
          // Wait a moment for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError) {
          console.error('❌ Failed to switch to Story Poseidon Devnet L1:', switchError);
          alert('Please switch to Story Poseidon Devnet L1 to submit the proof');
          return;
        }
      } else {
        console.log('✅ Already on Story Poseidon Devnet L1');
      }

      const { withdrawalDetails, disputeGame, proofData } = proofSubmissionData;
      const wd = withdrawalDetails;

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

      // Build withdrawal tuple
      const withdrawalTuple = {
        nonce: BigInt(wd.nonce),
        sender: wd.sender as `0x${string}`,
        target: wd.target as `0x${string}`,
        value: BigInt(wd.value),
        gasLimit: BigInt(wd.gasLimit),
        data: wd.data as `0x${string}`
      };

      console.log('\n📋 Withdrawal Tuple:');
      console.log(`   Nonce: ${withdrawalTuple.nonce}`);
      console.log(`   Sender: ${withdrawalTuple.sender}`);
      console.log(`   Target: ${withdrawalTuple.target}`);
      console.log(`   Value: ${withdrawalTuple.value}`);
      console.log(`   Gas Limit: ${withdrawalTuple.gasLimit}`);
      console.log(`   Data: ${withdrawalTuple.data}`);

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

      const outputRootProofTuple = {
        version: proofData.outputRootProof.version as `0x${string}`,
        stateRoot: proofData.outputRootProof.stateRoot as `0x${string}`,
        messagePasserStorageRoot: proofData.outputRootProof.messagePasserStorageRoot as `0x${string}`,
        latestBlockhash: proofData.outputRootProof.latestBlockhash as `0x${string}`
      };

      console.log('\n📋 Output Root Proof Tuple:');
      console.log(`   Version: ${outputRootProofTuple.version}`);
      console.log(`   State Root: ${outputRootProofTuple.stateRoot}`);
      console.log(`   Storage Root: ${outputRootProofTuple.messagePasserStorageRoot}`);
      console.log(`   Block Hash: ${outputRootProofTuple.latestBlockhash}`);

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

      const withdrawalProofArray = proofData.withdrawalProof.map((p: string, index: number) => {
        if (!p) {
          throw new Error(`Withdrawal proof at index ${index} is undefined`);
        }
        return p as `0x${string}`;
      });

      console.log('\n📋 Withdrawal Proof Array:');
      withdrawalProofArray.forEach((proof, index) => {
        console.log(`   Proof ${index}: ${proof}`);
      });

      console.log('\n🔧 Submitting proof transaction...');
      console.log(`   OptimismPortal: ${CONTRACT_ADDRESSES.OPTIMISM_PORTAL}`);
      console.log(`   Game Index: ${disputeGame.gameIndex} (type: ${typeof disputeGame.gameIndex})`);

      // Submit the proof transaction
      writeProofContract({
        address: CONTRACT_ADDRESSES.OPTIMISM_PORTAL as `0x${string}`,
        abi: optimismPortalAbi,
        functionName: 'proveWithdrawalTransaction',
        args: [
          withdrawalTuple,
          BigInt(disputeGame.gameIndex),
          outputRootProofTuple,
          withdrawalProofArray
        ],
      });
    } catch (error) {
      console.error('❌ Failed to submit proof:', error);
    }
  }, [proofSubmissionData, writeProofContract, chainId, switchChain, optimismPortalAbi]);

  // Use imported finalizeWithdrawal function
  const finalizeWithdrawal = useCallback(async (withdrawalDetails: MessagePassedEventData) => {
    if (!address) return false;
    return await finalizeWithdrawalImported({
      withdrawalDetails,
      address,
      writeProofContract: writeFinalizeContract,
      setIsWithdrawalComplete,
      isWithdrawalComplete,
    });
  }, [address, writeFinalizeContract, setIsWithdrawalComplete, isWithdrawalComplete]);

  // Use imported resolveGame function
  const resolveGame = useCallback(async (gameAddress: string) => {
    return await resolveGameImported({
      gameAddress,
      writeResolveClaimsContract,
      writeResolveGameContract,
      isResolvingGame,
      isWithdrawalComplete,
      setIsResolvingGame,
    });
  }, [writeResolveClaimsContract, writeResolveGameContract, isResolvingGame, isWithdrawalComplete, setIsResolvingGame]);

  // Monitor resolve claims transaction status (Step 5a)
  useEffect(() => {
    if (resolveClaimsTxHash) {
      console.log(`\n✅ Resolve Claims Transaction Submitted: ${resolveClaimsTxHash}`);
      
      // Update transaction storage
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.update({ 
            id: tx.id, 
            l1ResolveClaimsTxHash: resolveClaimsTxHash as string,
          });
        }
      }
    }
    if (isResolveClaimsConfirming) {
      console.log('\n⏳ Waiting for resolve claims confirmation...');
    }
    if (isResolveClaimsConfirmed && proofSubmissionData) {
      console.log('\n✅ Resolve Claims Transaction Confirmed!');
      console.log('   All claims have been resolved. Now resolving the game...');
      
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (tx) {
        // Check if we're already processing game resolution
        if (processingTxs.current.has(`resolve_game_${txId}`)) {
          console.log(`🔄 Already resolving game for ${txId}, skipping duplicate`);
          return;
        }
        
        // Mark as processing
        processingTxs.current.add(`resolve_game_${txId}`);
        
        TransactionStorage.update({ id: tx.id, status: 'resolving_game' });
        
        // Now send the resolve game transaction
        console.log('\n🎯 Sending resolve game transaction...');
        
        // Get the dispute game address from proof submission data
        const gameAddress = proofSubmissionData.disputeGame.gameAddress;
        
        // Send the resolve game transaction
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
        
        // Clean up processing flag (will be set again if needed)
        processingTxs.current.delete(`resolve_game_${txId}`);
      }
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
      
      // Check if we're already processing finalization
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      if (processingTxs.current.has(`finalize_${txId}`)) {
        console.log(`🔄 Already finalizing ${txId}, skipping duplicate`);
        return;
      }
      
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (!tx) {
        console.error('❌ Transaction not found for finalization');
        return;
      }
      
      // Check if already finalized
      if (tx.status === 'finalizing' || tx.status === 'completed') {
        console.log(`ℹ️ Transaction ${tx.id} already at status ${tx.status}, skipping finalization`);
        return;
      }
      
      // Mark as processing
      processingTxs.current.add(`finalize_${txId}`);
      
      // Update status to game_resolved
      TransactionStorage.update({ id: tx.id, status: 'game_resolved' });
      
      console.log('\n🎯 Starting Step 6: Finalizing withdrawal...');
      TransactionStorage.update({ id: tx.id, status: 'finalizing' });
      
      finalizeWithdrawal(proofSubmissionData.withdrawalDetails)
        .then(() => {
          console.log('\n✅ Finalization transaction sent!');
          // Don't mark as completed here - wait for transaction confirmation
        })
        .catch((error) => {
          console.error('❌ Step 6 FAILED:', error);
          TransactionStorage.markError(tx.id, `Step 6 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        })
        .finally(() => {
          processingTxs.current.delete(`finalize_${txId}`);
        });
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
      
      // Update transaction storage
      if (proofSubmissionData?.withdrawalDetails.withdrawalHash) {
        const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
        const tx = TransactionStorage.getAll().find(t => 
          t.withdrawalDetails?.withdrawalHash === txId
        );
        if (tx) {
          TransactionStorage.update({ 
            id: tx.id, 
            l1FinalizeTxHash: finalizeTxHash as string,
          });
        }
      }
    }
    if (isFinalizeConfirming) {
      console.log('\n⏳ Waiting for finalize withdrawal confirmation...');
    }
    if (isFinalizeConfirmed && proofSubmissionData) {
      console.log('\n✅ Finalize Withdrawal Transaction Confirmed!');
      console.log('🎉 Withdrawal process completed successfully!');
      
      const txId = proofSubmissionData.withdrawalDetails.withdrawalHash;
      const tx = TransactionStorage.getAll().find(t => 
        t.withdrawalDetails?.withdrawalHash === txId
      );
      
      if (tx) {
        // Mark transaction as completed
        TransactionStorage.update({ 
          id: tx.id, 
          status: 'completed',
          completedAt: Date.now(),
        });
        
        // Mark withdrawal process as complete
        setIsWithdrawalComplete(true);
        
        console.log(`✅ Transaction ${tx.id} marked as completed`);
      }
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
      
      // Check if already past proof_confirmed status
      if (tx && tx.status !== 'proof_submitted' && tx.status !== 'proof_confirmed') {
        console.log(`ℹ️ Transaction ${tx.id} already past proof confirmation (status: ${tx.status}), skipping Step 5`);
        return;
      }
      
      console.log('\n✅ Step 4.5 Complete: Proof transaction confirmed!');
      
      // Mark as processing
      processingTxs.current.add(`proof_${txId}`);
      
      // Update transaction status
      if (tx) {
        TransactionStorage.update({ 
          id: tx.id, 
          status: 'proof_confirmed',
          l1ProofTxHash: proofTxHash as string,
        });
        
        TransactionStorage.update({ id: tx.id, status: 'resolving_game' });
        
        console.log('\n🎯 Starting Step 5: Resolving dispute game...');
        resolveGame(proofSubmissionData.disputeGame.gameAddress)
          .then(() => {
            console.log('\n✅ Step 5 Complete: Dispute game resolved!');
            TransactionStorage.update({ id: tx.id, status: 'game_resolved' });
          })
          .catch((error) => {
            console.error('❌ Step 5 FAILED - Cannot proceed to Step 6:', error);
            TransactionStorage.markError(tx.id, `Step 5 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          })
          .finally(() => {
            // Remove from processing set when done
            processingTxs.current.delete(`proof_${txId}`);
          });
      } else {
        console.error('❌ Cannot start Step 5: Transaction not found');
        processingTxs.current.delete(`proof_${txId}`);
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
              
          // Step 4: Submit Proof to L1 (only if Step 3 succeeded)
          TransactionStorage.update({ id: txHash, status: 'submitting_proof' });
          console.log('\n📤 Starting Step 4: Submitting proof to L1...');
          
          try {
            // Save proof submission data BEFORE submitting - needed for Step 5 when proof is confirmed
            setProofSubmissionData({
              withdrawalDetails,
              disputeGame,
              proofData,
            });
            
            const proofTxHash = await submitProof(withdrawalDetails, disputeGame, proofData);
            TransactionStorage.update({ id: txHash, status: 'proof_submitted' });
            console.log('\n✅ Step 4 Complete: Proof submitted successfully!');
            console.log(`   Proof Transaction: ${proofTxHash}`);
            console.log('\n   Steps 5 & 6 (Resolve game and Finalize) will continue automatically...');
          } catch (error) {
            console.error('❌ Step 4 FAILED - Cannot proceed to Step 5:', error);
            throw new Error(`Step 4 (Submit proof) failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
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
      // L2 to L1: Should be on Subnet 0 (L2)
      return chainId === CHAIN_IDS.L2;
    } else {
      // L1 to L2: Should be on Poseidon Devnet (L1)
      return chainId === CHAIN_IDS.L1;
    }
  }, [chainId, isL2ToL1]);
  
  const requiredNetwork = useMemo(() => {
    if (isL2ToL1) {
      return { id: CHAIN_IDS.L2, name: 'PSDN Subnet 0' };
    } else {
      return { id: CHAIN_IDS.L1, name: 'Poseidon Devnet' };
    }
  }, [isL2ToL1]);
  
  // Transaction hooks
  const { writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteMintPsdnApprove();
  const { writeContract: writeBridgeEth, isPending: isBridgeEthPending, error: bridgeEthError } = useWriteBridgeBridgeEthTo();
  const { writeContract: writeDepositErc20, isPending: isDepositErc20Pending, error: depositErc20Error } = useWriteBridgeDepositErc20To();
  const { writeContract: writeL2BridgeErc20, isPending: isL2BridgeErc20Pending, error: l2BridgeErc20Error, data: l2TxData } = useWriteL2BridgeBridgeErc20();
  
  // Wait for L2 transaction receipt
  const { data: l2TxReceipt } = useWaitForTransactionReceipt({
    hash: l2TxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
    query: {
      enabled: !!l2TxHash,
    },
  });

  // Update tokens when bridge option changes
  useEffect(() => {
    if (isL1OnTop) {
      const newFromToken = bridgeOption === 'psdn' ? PSDN_L1_TOKEN : ETH_L1_TOKEN;
      const newToToken = bridgeOption === 'psdn' ? PSDN_L2_TOKEN : ETH_L2_TOKEN;
      
      setFromToken(newFromToken);
      setToToken(newToToken);
    }
  }, [bridgeOption, isL1OnTop]);
  
  // Balance hooks
  const { data: psdnBalance, refetch: refetchPsdnBalance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
    },
    chainId: CHAIN_IDS.L1,
  });

  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
    },
    chainId: CHAIN_IDS.L2,
  });

  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  const { data: ethL2Balance, refetch: refetchEthL2Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L2,
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadMintPsdnAllowance({
    args: address ? [address, CONTRACT_ADDRESSES.BRIDGE] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: POLLING_INTERVAL,
    },
    chainId: CHAIN_IDS.L1,
  });

  // Balance update effects
  useEffect(() => {
    if (psdnBalance !== undefined) {
      const balanceStr = formatBalance(psdnBalance);
      setFromToken(prev => ({ ...prev, balance: balanceStr }));
    }
  }, [psdnBalance]);

  useEffect(() => {
    if (psdnL2Balance !== undefined) {
      const balanceStr = formatBalance(psdnL2Balance);
      setToToken(prev => ({ ...prev, balance: balanceStr }));
    }
  }, [psdnL2Balance]);

  useEffect(() => {
    if (ethBalance !== undefined) {
      const balanceStr = formatBalanceFromValue(ethBalance);
      setFromToken(prev => 
        prev.symbol === 'ETH' ? { ...prev, balance: balanceStr } : prev
      );
    }
  }, [ethBalance]);

  useEffect(() => {
    if (ethL2Balance !== undefined) {
      const balanceStr = formatBalanceFromValue(ethL2Balance);
      setToToken(prev => 
        prev.symbol === 'ETH' && prev.layer === 'L2' 
          ? { ...prev, balance: balanceStr } 
          : prev
      );
    }
  }, [ethL2Balance]);

  // Balance polling is now handled by refetchInterval in the hooks above

  // Handle L2 transaction hash when it becomes available
  useEffect(() => {
    if (l2TxData && !l2TxHash && address) {
      // Check if transaction already exists to prevent duplicates
      const existingTx = TransactionStorage.getById(l2TxData);
      
      if (!existingTx) {
        // Create transaction record in localStorage only if it doesn't exist
        TransactionStorage.create({
          id: l2TxData,
          l2TxHash: l2TxData,
          status: 'pending',
          token: fromToken.symbol,
          amount: fromAmount,
          fromAddress: address,
        });
        
        console.log(`📝 Created transaction record: ${l2TxData}`);
      } else {
        console.log(`ℹ️ Transaction ${l2TxData} already exists, skipping creation`);
      }
      
      setL2TxHash(l2TxData);
    }
  }, [l2TxData, l2TxHash, address, fromToken.symbol, fromAmount]);

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
        setL2TxHash(null);
        return;
      }
      
      // Mark as processing
      processingTxs.current.add(l2TxHash);
      
      // Log detailed receipt information and start L2→L1 withdrawal process
      logReceiptDetails(l2TxHash).finally(() => {
        // Remove from processing set when done (either success or error)
        processingTxs.current.delete(l2TxHash);
      });
      
      // Reset the state
      setL2TxHash(null);
    }
  }, [l2TxReceipt, l2TxHash, logReceiptDetails]);

  // Event handlers
  const handleSwap = useCallback(() => {
    if (isSwapping) return;
    
    setIsSwapping(true);
    setShowCalculation(true);
    
    // Swap tokens immediately
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Reset swap state after animation
    setTimeout(() => {
      setIsSwapping(false);
      setShowCalculation(false);
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


  const handleTransact = useCallback(async () => {
    if (!address || !fromAmount || !isValidAmount(fromAmount)) {
      return;
    }

    try {
      const amount = parseUnits(fromAmount, TOKEN_DECIMALS);

      if (fromToken.symbol === 'ETH') {
        // For ETH, use bridgeEthTo call
        await writeBridgeEth({
          args: [address, MIN_GAS_LIMIT, EMPTY_EXTRA_DATA],
          value: amount,
        });
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
          const needsApproval = !currentAllowance || currentAllowance < amount;
          
          if (needsApproval) {
            // Approve max amount to avoid future approvals
            await writeApprove({
              args: [CONTRACT_ADDRESSES.BRIDGE, BigInt(MAX_UINT256)],
            });
            refetchAllowance();
          }
          
          // Then call depositERC20To on the Bridge contract
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
  }, [address, fromAmount, fromToken.symbol, isL2ToL1, currentAllowance, writeBridgeEth, writeApprove, writeDepositErc20, writeL2BridgeErc20, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance, toToken.symbol]);

  // Memoized values
  const availableTokens = useMemo(() => 
    isL1OnTop 
      ? getAvailableL1Tokens(psdnBalance, ethBalance)
      : getAvailableL2Tokens(psdnL2Balance, ethL2Balance),
    [isL1OnTop, psdnBalance, ethBalance, psdnL2Balance, ethL2Balance]
  );

  const isTransactionPending = useMemo(() => 
    isApprovePending || isBridgeEthPending || isDepositErc20Pending || isL2BridgeErc20Pending,
    [isApprovePending, isBridgeEthPending, isDepositErc20Pending, isL2BridgeErc20Pending]
  );

  const hasError = useMemo(() => 
    approveError || bridgeEthError || depositErc20Error || l2BridgeErc20Error,
    [approveError, bridgeEthError, depositErc20Error, l2BridgeErc20Error]
  );

  return (
    <>
      <PendingTransactionsTab />
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
                      {fromToken.layer} {fromToken.layer === 'L1' ? '(Poseidon)' : '(Subnet 0)'}
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
                      {toToken.layer} {toToken.layer === 'L1' ? '(Poseidon)' : '(Subnet 0)'}
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
          disabled={!address || !fromAmount || parseFloat(fromAmount) <= 0 || isTransactionPending || (isL2ToL1 && fromToken.symbol === 'ETH')}
        >
          {isL2ToL1 && fromToken.symbol === 'ETH' ? "ETH L2->L1 Disabled" : isTransactionPending ? "Processing..." : "Transact"}
        </Button>
        )}
        </div>

        {/* Submit Proof Button */}
        {proofSubmissionData && (
          <div className="relative z-10 mt-4">
            <Button
              onClick={handleSubmitProof}
              disabled={isProofPending || isProofConfirming}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isProofPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Proof...
                </div>
              ) : isProofConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming...
                </div>
              ) : (
                "Submit Proof to L1"
              )}
            </Button>
          </div>
        )}

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
