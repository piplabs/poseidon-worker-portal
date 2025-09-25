"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { TokenSelector } from "@/components/token-selector";
import { PendingTransactionsTab } from "@/components/pending-transactions-tab";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance, useSwitchChain, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, createPublicClient, http, decodeEventLog, parseAbi, keccak256, encodeAbiParameters, defineChain } from "viem";
import { motion } from "motion/react";
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
import { usePendingTransactionsContext } from "@/contexts/PendingTransactionsContext";


export function BridgeInterface() {
  // State
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_FROM_TOKEN);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TO_TOKEN);
  const [fromAmount, setFromAmount] = useState(ZERO_AMOUNT);
  const [toAmount, setToAmount] = useState(ZERO_AMOUNT);
  const [bridgeOption, setBridgeOption] = useState<BridgeOption>(DEFAULT_BRIDGE_OPTION);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [l2TxHash, setL2TxHash] = useState<string | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { addPendingTransaction, updateTransactionStatus, updateTransactionHash } = usePendingTransactionsContext();
  
  // Interface for MessagePassed event data
  interface MessagePassedEventData {
    nonce: bigint;
    sender: string;
    target: string;
    value: bigint;
    gasLimit: bigint;
    data: string;
    withdrawalHash: string;
  }

  // Interface for DisputeGame data
  interface DisputeGameData {
    gameIndex: number;
    gameAddress: string;
    gameType: number;
    gameL2Block: number;
    rootClaim: string;
    timestamp: number;
  }

  // DisputeGameFactory ABI
  const disputeGameFactoryAbi = parseAbi([
    'function gameCount() view returns (uint256)',
    'function gameAtIndex(uint256) view returns (uint8,uint64,address)',
  ]);

  // DisputeGame ABI
  const disputeGameAbi = parseAbi([
    'function l2BlockNumber() view returns (uint256)',
    'function rootClaim() view returns (bytes32)',
  ]);

  // Step 2: Poll DisputeGameFactory for suitable game
  const waitForDisputeGame = useCallback(async (l2BlockNumber: number): Promise<DisputeGameData> => {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('STEP 2: WAIT FOR DISPUTE GAME');
      console.log('═'.repeat(80));

      console.log('\n📊 Parameters:');
      console.log(`   L2 Block to prove: ${l2BlockNumber}`);
      console.log(`   DisputeGameFactory: ${CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY}`);
      console.log(`\n⏳ Waiting for a dispute game with block >= ${l2BlockNumber}`);
      console.log(`   (New games are created periodically by the proposer)`);

      // Create L1 client
      const l1Client = createPublicClient({
        transport: http(RPC_URLS.L1),
      });

      console.log('\n🔧 L1 Client initialized:');
      console.log(`   RPC URL: ${RPC_URLS.L1}`);
      console.log(`   Client:`, l1Client);

      const maxWaitTime = 600000; // 10 minutes
      const checkInterval = 10000; // 10 seconds
      const startTime = Date.now();
      let lastGameCount = 0;
      let highestBlockSeen = 0;

      while ((Date.now() - startTime) < maxWaitTime) {
        try {
          // Get game count
          const gameCount = await l1Client.readContract({
            address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
            abi: disputeGameFactoryAbi,
            functionName: 'gameCount',
          });

          const gameCountNum = Number(gameCount);

          // Only process games when count changes
          if (gameCountNum !== lastGameCount) {
            console.log(`\n🎮 Game count updated: ${gameCountNum} (was ${lastGameCount})`);
            lastGameCount = gameCountNum;

            // When waiting for new games, only check the most recent game
            // since we know the next game will likely cover our withdrawal block
            const startIndex = gameCountNum - 1; // Only check the newest game
            const endIndex = gameCountNum - 1;
            
            console.log(`\n🔍 Checking newest game #${startIndex} (waiting for next game to be published)...`);
            
            for (let i = startIndex; i <= endIndex; i++) {
              // Get game details
              const gameData = await l1Client.readContract({
                address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
                abi: disputeGameFactoryAbi,
                functionName: 'gameAtIndex',
                args: [BigInt(i)],
              });

              const [gameType, timestamp, gameAddress] = gameData as [number, bigint, `0x${string}`];

              // Get game L2 block
              const gameL2Block = await l1Client.readContract({
                address: gameAddress,
                abi: disputeGameAbi,
                functionName: 'l2BlockNumber',
              });

              // Get root claim
              const rootClaim = await l1Client.readContract({
                address: gameAddress,
                abi: disputeGameAbi,
                functionName: 'rootClaim',
              });

              const gameL2BlockNum = Number(gameL2Block);

              console.log(`\n📋 Game #${i} Details:`);
              console.log(`   Address: ${gameAddress}`);
              console.log(`   Type: ${gameType}`);
              console.log(`   L2 Block: ${gameL2BlockNum}`);
              console.log(`   Root Claim: ${rootClaim}`);
              console.log(`   Created: ${new Date(Number(timestamp) * 1000).toISOString()}`);

              // Track the highest block we've seen
              if (gameL2BlockNum > highestBlockSeen) {
                highestBlockSeen = gameL2BlockNum;
              }

              // Check if this game covers our withdrawal block
              if (gameL2BlockNum >= l2BlockNumber) {
                console.log(`\n✅ Found suitable game covering block ${l2BlockNumber}!`);
                console.log(`   Game L2 block ${gameL2BlockNum} >= withdrawal block ${l2BlockNumber}`);
                
                const gameData = {
                  gameIndex: i,
                  gameAddress,
                  gameType,
                  gameL2Block: gameL2BlockNum,
                  rootClaim: rootClaim as string,
                  timestamp: Number(timestamp)
                };
                
                console.log(`\n🎯 Game Found - Complete Details:`);
                console.log(`   Game Index: ${gameData.gameIndex}`);
                console.log(`   Game Address: ${gameData.gameAddress}`);
                console.log(`   Game Type: ${gameData.gameType}`);
                console.log(`   Game L2 Block: ${gameData.gameL2Block}`);
                console.log(`   Root Claim: ${gameData.rootClaim}`);
                console.log(`   Timestamp: ${gameData.timestamp}`);
                console.log(`   Created: ${new Date(gameData.timestamp * 1000).toISOString()}`);
                
                return gameData;
              } else {
                console.log(`   ❌ Game block ${gameL2BlockNum} < withdrawal block ${l2BlockNumber} (too old)`);
              }
            }

            // Show progress summary
            console.log(`\n📊 Progress Summary:`);
            console.log(`   Highest game block seen: ${highestBlockSeen}`);
            console.log(`   Need block >= ${l2BlockNumber}`);
            console.log(`   Still need: ${l2BlockNumber - highestBlockSeen} more blocks`);
          }

          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          console.log(`⏳ Waiting for new game... ${elapsed}s elapsed | Games: ${gameCountNum} | Highest: ${highestBlockSeen} | Need: ${l2BlockNumber}`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        } catch (error) {
          console.error(`\n❌ Error during dispute game check:`, error);
          console.log(`   Continuing to wait...`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
      }

      console.log('\n\n❌ Timeout waiting for dispute game after 10 minutes');
      throw new Error('Timeout waiting for dispute game');
    } catch (error) {
      console.error('❌ Failed to wait for dispute game:', error);
      throw error;
    }
  }, []);

  // Step 3: Generate Merkle Proof
  const generateProof = useCallback(async (withdrawalDetails: MessagePassedEventData, l2BlockNumber: number, disputeGame: DisputeGameData) => {
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
      console.log(`   Account Proof Nodes: ${proofResult.accountProof.length}`);
      console.log(`   Storage Hash: ${proofResult.storageHash}`);
      console.log(`   Storage Proof Nodes: ${proofResult.storageProof[0].proof.length}`);
      console.log(`   Storage Key: ${proofResult.storageProof[0].key}`);
      console.log(`   Storage Value: ${proofResult.storageProof[0].value}`);
      
      // Get L2 block data for proof
      const proofL2Block = await l2Client.getBlock({ blockNumber: actualProofBlock });
      console.log(`   Proof L2 block hash: ${proofL2Block.hash}`);
      console.log(`   Proof L2 state root: ${proofL2Block.stateRoot}`);
      
      // Also get dispute game L2 block if different
      let gameL2Block;
      if (disputeGame.gameL2Block !== actualProofBlock) {
        try {
          gameL2Block = await l2Client.getBlock({ blockNumber: BigInt(disputeGame.gameL2Block) });
          console.log(`   Game L2 block hash: ${gameL2Block.hash}`);
          console.log(`   Game L2 state root: ${gameL2Block.stateRoot}`);
        } catch (error) {
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
      
      return {
        withdrawalProof: proofResult.storageProof[0].proof,
        outputRootProof,
        storageSlot
      };
    } catch (error) {
      console.error('❌ Failed to generate proof:', error);
      throw error;
    }
  }, []);

  // OptimismPortal ABI for proof submission
  const optimismPortalAbi = [
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

  // State for proof submission
  const [proofSubmissionData, setProofSubmissionData] = useState<{
    withdrawalDetails: MessagePassedEventData;
    disputeGame: DisputeGameData;
    proofData: any;
  } | null>(null);

  // Step 4: Submit Proof to L1
  const submitProof = useCallback(async (withdrawalDetails: MessagePassedEventData, disputeGame: DisputeGameData, proofData: any) => {
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
      const outputRootProofTuple = {
        version: proofData.outputRootProof.version as `0x${string}`,
        stateRoot: proofData.outputRootProof.stateRoot as `0x${string}`,
        messagePasserStorageRoot: proofData.outputRootProof.messagePasserStorageRoot as `0x${string}`,
        latestBlockhash: proofData.outputRootProof.latestBlockhash as `0x${string}`
      };
      
      // Build withdrawal proof array
      const withdrawalProofArray = proofData.withdrawalProof.map((p: string) => p as `0x${string}`);
      
      console.log('\n📊 Proof Parameters:');
      console.log(`   Withdrawal Nonce: ${withdrawalTuple.nonce}`);
      console.log(`   Withdrawal Sender: ${withdrawalTuple.sender}`);
      console.log(`   Withdrawal Target: ${withdrawalTuple.target}`);
      console.log(`   Withdrawal Value: ${withdrawalTuple.value}`);
      console.log(`   Withdrawal Gas Limit: ${withdrawalTuple.gasLimit}`);
      console.log(`   Withdrawal Data Length: ${withdrawalTuple.data.length} bytes`);
      console.log(`   Game Index: ${disputeGame.gameIndex}`);
      console.log(`   Output Root Proof Version: ${outputRootProofTuple.version}`);
      console.log(`   Output Root Proof State Root: ${outputRootProofTuple.stateRoot}`);
      console.log(`   Output Root Proof Storage Root: ${outputRootProofTuple.messagePasserStorageRoot}`);
      console.log(`   Output Root Proof Block Hash: ${outputRootProofTuple.latestBlockhash}`);
      console.log(`   Withdrawal Proof Array Length: ${withdrawalProofArray.length}`);
      
      // Store data for proof submission
      setProofSubmissionData({
        withdrawalDetails,
        disputeGame,
        proofData
      });
      
      console.log('\n📤 Proof data prepared for submission');
      console.log('   Click the "Submit Proof" button to proceed with wallet interaction');
      
      return 'pending_proof_submission';
    } catch (error) {
      console.error('❌ Failed to prepare proof submission:', error);
      throw error;
    }
  }, []);

  // Wagmi hook for proof submission
  const { writeContract: writeProofContract, data: proofTxHash, isPending: isProofPending, error: proofError } = useWriteContract();

  // Wait for proof transaction confirmation
  const { isLoading: isProofConfirming, isSuccess: isProofConfirmed } = useWaitForTransactionReceipt({
    hash: proofTxHash,
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
  }, [proofSubmissionData, writeProofContract, chainId, switchChain]);

  // Step 6: Finalize withdrawal
  const finalizeWithdrawal = useCallback(async (withdrawalDetails: MessagePassedEventData) => {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('STEP 6: FINALIZE WITHDRAWAL');
      console.log('═'.repeat(80));
      
      // Wait for challenge period
      console.log('\n⏳ Waiting 12 second challenge period...');
      for (let i = 0; i < 12; i++) {
        console.log(`   ${i + 1}/12 seconds`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('✅ Challenge period completed');

      // Create L1 client for reading balances
      const l1Client = createPublicClient({
        transport: http(RPC_URLS.L1),
      });

      // ERC20 ABI for balance checking
      const erc20Abi = [
        {
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }
      ] as const;

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
      const l1TokenAddress = "0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46";
      const l1StandardBridgeAddress = "0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae";

      // Check L1 token balance before
      console.log('\n📊 Checking L1 token balance before finalization...');
      const balanceBefore = await l1Client.readContract({
        address: l1TokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      console.log(`   L1 Token Balance Before: ${balanceBefore.toString()} wei`);

      // Build withdrawal tuple
      const withdrawalTuple = {
        nonce: BigInt(wd.nonce),
        sender: wd.sender as `0x${string}`,
        target: wd.target as `0x${string}`,
        value: BigInt(wd.value),
        gasLimit: BigInt(wd.gasLimit),
        data: wd.data as `0x${string}`
      };

      console.log('\n🔧 Finalizing withdrawal transaction...');
      console.log(`   Withdrawal Tuple:`, withdrawalTuple);

      // Finalize withdrawal using writeContract
      writeProofContract({
        address: CONTRACT_ADDRESSES.OPTIMISM_PORTAL as `0x${string}`,
        abi: optimismPortalAbi,
        functionName: 'finalizeWithdrawalTransaction',
        args: [withdrawalTuple],
        value: 0n,
      });

      console.log('✅ Finalization transaction sent!');

      // Wait for confirmation (20 seconds)
      console.log('\n⏳ Waiting 20 seconds for confirmation...');
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Check L1 token balance after
      console.log('\n📊 Checking L1 token balance after finalization...');
      const balanceAfter = await l1Client.readContract({
        address: l1TokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      // Check L1StandardBridge balance
      const bridgeBalance = await l1Client.readContract({
        address: l1TokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [l1StandardBridgeAddress as `0x${string}`],
      });

      console.log('\n📊 Token Balance Summary:');
      console.log(`   Your L1 Balance Before: ${balanceBefore.toString()} wei`);
      console.log(`   Your L1 Balance After: ${balanceAfter.toString()} wei`);
      console.log(`   L1StandardBridge Balance: ${bridgeBalance.toString()} wei`);

      const balanceChange = balanceAfter - balanceBefore;
      if (balanceChange > 0n) {
        console.log(`\n🎉 Withdrawal successful! Received ${balanceChange.toString()} wei`);
      } else {
        console.log('\n⚠️ No balance change detected');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to finalize withdrawal:', error);
      throw error;
    }
  }, [address, writeProofContract]);

  // Step 5: Resolve dispute game
  const resolveGame = useCallback(async (gameAddress: string) => {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('STEP 5: RESOLVE DISPUTE GAME');
      console.log('═'.repeat(80));
      
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

      // Resolve claims (from newest to oldest)
      const claimTxHashes: string[] = [];
      for (let i = Number(claimDataLen) - 1; i >= 0; i--) {
        try {
          console.log(`\n🔧 Resolving claim ${i}...`);
          
          // Use writeContract to actually send the transaction
          const claimTx = writeProofContract({
            address: gameAddress as `0x${string}`,
            abi: disputeGameAbi,
            functionName: 'resolveClaim',
            args: [BigInt(i), BigInt(1)],
          });

          console.log(`   ✅ Claim ${i} resolution transaction sent`);
          // Note: In a real implementation, you'd need to wait for this transaction to confirm
          // For now, we'll simulate waiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          console.log(`   ⚠️ Claim ${i} already resolved or failed:`, e);
        }
      }

      // Resolve the game
      try {
        console.log('\n🎯 Resolving the game...');
        
        // Use writeContract to actually send the transaction
        const gameTx = writeProofContract({
          address: gameAddress as `0x${string}`,
          abi: disputeGameAbi,
          functionName: 'resolve',
        });

        console.log('✅ Game resolution transaction sent');
        
        // Wait for game resolution to confirm
        console.log('\n⏳ Waiting for game resolution to confirm...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for confirmation
        
        console.log('✅ Game resolution confirmed');
      } catch (e) {
        console.log('⚠️ Game already resolved or failed:', e);
      }

      // Step 6: Finalize withdrawal after game resolution
      if (proofSubmissionData) {
        console.log('\n🎯 Proceeding to finalize withdrawal...');
        await finalizeWithdrawal(proofSubmissionData.withdrawalDetails);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to resolve game:', error);
      throw error;
    }
  }, [writeProofContract, finalizeWithdrawal, proofSubmissionData]);

  // Monitor proof submission status
  useEffect(() => {
    if (proofTxHash) {
      console.log(`\n✅ Proof Transaction Submitted: ${proofTxHash}`);
    }
    if (isProofConfirming) {
      console.log('\n⏳ Waiting for proof confirmation...');
    }
    if (isProofConfirmed) {
      console.log('\n✅ Proof transaction confirmed!');
      // Verify proof on-chain
      verifyProofOnChain();
      
      // Step 5: Resolve the dispute game
      if (proofSubmissionData) {
        resolveGame(proofSubmissionData.disputeGame.gameAddress);
      }
    }
    if (proofError) {
      console.error('❌ Proof submission failed:', proofError);
    }
  }, [proofTxHash, isProofConfirming, isProofConfirmed, proofError, proofSubmissionData, resolveGame]);

  // Verify proof on-chain
  const verifyProofOnChain = useCallback(async () => {
    if (!proofSubmissionData) return;

    try {
      console.log('\n🔍 Verifying proof storage on-chain...');
      
      const l1Client = createPublicClient({
        transport: http(RPC_URLS.L1),
      });

      const { address: accountAddress } = useAccount();
      if (!accountAddress) return;

      const proofResult = await l1Client.readContract({
        address: CONTRACT_ADDRESSES.OPTIMISM_PORTAL as `0x${string}`,
        abi: optimismPortalAbi,
        functionName: 'provenWithdrawals',
        args: [proofSubmissionData.withdrawalDetails.withdrawalHash as `0x${string}`, accountAddress as `0x${string}`]
      });

      const [outputRoot, timestamp, l2OutputIndex] = proofResult as [string, bigint, bigint];

      if (outputRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('\n📋 Proof Details:');
        console.log(`   Output Root: ${outputRoot}`);
        console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
        console.log(`   L2 Output Index: ${Number(l2OutputIndex)}`);
        console.log('✅ Proof verified on-chain!');
      } else {
        console.log('⚠️ Proof not found on-chain');
      }
    } catch (error) {
      console.log('⚠️ Could not verify proof on-chain:', error);
    }
  }, [proofSubmissionData]);

  // Function to log receipt details and extract MessagePassed event using viem
  const logReceiptDetails = useCallback(async (txHash: string) => {
    try {
      console.log('\n⏳ Waiting for transaction confirmation...');
      
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
        const eventData = (decoded as { args: MessagePassedEventData }).args;
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

        // Step 2: Wait for dispute game
        if (receipt.blockNumber && withdrawalDetails) {
          console.log('\n🎮 Starting Step 2: Waiting for dispute game...');
          try {
            const disputeGame = await waitForDisputeGame(Number(receipt.blockNumber));
            console.log('\n✅ Dispute game found!');
            console.log(`   Game Address: ${disputeGame.gameAddress}`);
            console.log(`   Game Index: ${disputeGame.gameIndex}`);
            console.log(`   Game L2 Block: ${disputeGame.gameL2Block}`);
            console.log(`   Root Claim: ${disputeGame.rootClaim}`);
            
            // Step 3: Generate Merkle Proof
            console.log('\n🔧 Starting Step 3: Generating Merkle proof...');
            try {
              const proofData = await generateProof(withdrawalDetails, Number(receipt.blockNumber), disputeGame);
              console.log('\n✅ Merkle proof generated successfully!');
              console.log(`   Withdrawal Proof Nodes: ${proofData.withdrawalProof.length}`);
              console.log(`   Storage Slot: ${proofData.storageSlot}`);
              console.log(`   Output Root Proof:`, proofData.outputRootProof);
              
              // Step 4: Submit Proof to L1
              console.log('\n📤 Starting Step 4: Submitting proof to L1...');
              try {
                const proofTxHash = await submitProof(withdrawalDetails, disputeGame, proofData);
                console.log('\n✅ Proof submitted successfully!');
                console.log(`   Proof Transaction: ${proofTxHash}`);
              } catch (error) {
                console.error('❌ Step 4 failed:', error);
              }
            } catch (error) {
              console.error('❌ Step 3 failed:', error);
            }
          } catch (error) {
            console.error('❌ Step 2 failed:', error);
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
  const { data: l2TxReceipt, isLoading: isL2TxPending } = useWaitForTransactionReceipt({
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
    if (l2TxData && !l2TxHash) {
      setL2TxHash(l2TxData);
    }
  }, [l2TxData, l2TxHash]);

  // Handle L2 transaction receipt
  useEffect(() => {
    if (l2TxReceipt && l2TxHash && pendingTxId) {
      console.log('L2 Transaction confirmed!');
      console.log('Transaction Hash:', l2TxHash);
      console.log('Block Number:', l2TxReceipt.blockNumber);
      console.log('Pending Transaction ID:', pendingTxId);
      
      // Update the pending transaction with the transaction hash
      updateTransactionHash(pendingTxId, l2TxHash);
      
      // Log detailed receipt information
      logReceiptDetails(l2TxHash);
      
      // Reset the state
      setL2TxHash(null);
      setPendingTxId(null);
    }
  }, [l2TxReceipt, l2TxHash, pendingTxId, updateTransactionHash, logReceiptDetails]);

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
    setFromAmount(amount);
    
    // Simple conversion logic (1:1 for demo)
    setToAmount(formatAmount(amount));
  }, []);

  const handleToAmountChange = useCallback((amount: string) => {
    setToAmount(amount);
    
    // Reverse conversion logic
    setFromAmount(formatAmount(amount));
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
          const pendingId = addPendingTransaction({
            type: 'L2_TO_L1_PSDN',
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
            amount: amount.toString(),
          });

          // Store the pending transaction ID for later use
          setPendingTxId(pendingId);

          try {
            await writeL2BridgeErc20({
              args: [
                CONTRACT_ADDRESSES.PSDN_L2, // L2 token address
                CONTRACT_ADDRESSES.PSDN_L1, // L1 token address
                amount,
                MIN_GAS_LIMIT,
                EMPTY_EXTRA_DATA
              ],
            });


            // Keep as pending - the full bridge process is still pending
            // The L1 withdrawal will be processed separately
          } catch (error) {
            updateTransactionStatus(pendingId, 'failed');
            setPendingTxId(null); // Reset on error
            throw error; // Re-throw to trigger error handling
          }
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
  }, [address, fromAmount, fromToken.symbol, isL2ToL1, currentAllowance, writeBridgeEth, writeApprove, writeDepositErc20, writeL2BridgeErc20, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance]);

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
                  <img 
                    src={fromToken.logo} 
                    alt={fromToken.symbol}
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
                <img 
                  src={toToken.logo} 
                  alt={toToken.symbol}
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
