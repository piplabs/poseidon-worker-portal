"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowLeft, Clock, Circle, CheckCircle2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WithdrawalTransaction, TransactionStorage } from "@/lib/transaction-tracker";
import { TEST_MODE } from "@/lib/constants";
import Image from "next/image";

interface WithdrawalStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WithdrawalTransaction;
  onProve: () => void;
  onResolve: () => void;
  onResolveGame: () => void;
  onFinalize: () => void;
}

type StepStatus = 'pending' | 'active' | 'waiting' | 'completed';

interface Step {
  id: number;
  title: string;
  description: string;
  fee?: string;
  feeUSD?: string;
  status: StepStatus;
  action?: () => void;
  buttonText?: string;
  isWaitStep?: boolean;
  waitDuration?: string;
}

export function WithdrawalStepsModal({
  isOpen,
  onClose,
  transaction,
  onProve,
  onResolve,
  onResolveGame,
  onFinalize,
}: WithdrawalStepsModalProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'info'>('steps');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Monitor transaction status for countdown timer
  useEffect(() => {
    console.log('🕐 Countdown effect triggered. Status:', transaction.status, 'TEST_MODE:', TEST_MODE);
    
    // Start countdown when proof is submitted OR confirmed (challenge period starts)
    if (['proof_submitted', 'proof_confirmed'].includes(transaction.status) && !TEST_MODE) {
      console.log('✅ Starting countdown from 10 seconds');
      // Start countdown from 10 seconds
      setCountdown(10);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            console.log('⏰ Countdown complete!');
            return null;
          }
          console.log(`⏱️ Countdown: ${prev - 1}s remaining`);
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        console.log('🧹 Cleaning up countdown timer');
        clearInterval(timer);
      };
    } else {
      setCountdown(null);
    }
  }, [transaction.status]);

  // Test mode handlers - manually advance through steps
  const handleTestModeAdvance = (targetStatus: string) => {
    if (!TEST_MODE) return;
    
    // Mock withdrawal details for test mode
    const mockWithdrawalDetails = {
      nonce: "1",
      sender: transaction.fromAddress,
      target: "0x0000000000000000000000000000000000000000",
      value: "1000000000000000000",
      gasLimit: "200000",
      data: "0x",
      withdrawalHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    };

    const mockDisputeGame = {
      gameIndex: 1,
      gameAddress: `0x${Math.random().toString(16).slice(2).padEnd(40, '0')}`,
      gameType: 0,
      gameL2Block: 1000000,
      rootClaim: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    };

    const mockProofData = {
      withdrawalProof: ["0x123", "0x456"],
      outputRootProof: {
        version: "0x0",
        stateRoot: "0x" + "0".repeat(64),
        messagePasserStorageRoot: "0x" + "0".repeat(64),
        latestBlockhash: "0x" + "0".repeat(64),
      },
      storageSlot: "0x" + "0".repeat(64),
    };

    switch (targetStatus) {
      case 'l2_confirmed':
        TransactionStorage.update({
          id: transaction.id,
          status: 'l2_confirmed',
          withdrawalDetails: mockWithdrawalDetails,
          l2BlockNumber: 1000000,
        });
        break;
      case 'game_found':
        TransactionStorage.update({
          id: transaction.id,
          status: 'game_found',
          disputeGame: mockDisputeGame,
        });
        break;
      case 'proof_generated':
        TransactionStorage.update({
          id: transaction.id,
          status: 'proof_generated',
          proofData: mockProofData,
        });
        break;
      case 'proof_confirmed':
        TransactionStorage.update({
          id: transaction.id,
          status: 'proof_confirmed',
          l1ProofTxHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        });
        break;
      case 'game_resolved':
        TransactionStorage.update({
          id: transaction.id,
          status: 'game_resolved',
          l1ResolveGameTxHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        });
        break;
      case 'completed':
        TransactionStorage.update({
          id: transaction.id,
          status: 'completed',
          l1FinalizeTxHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
          completedAt: Date.now(),
        });
        break;
    }
  };

  // Determine step statuses based on transaction status
  const steps: Step[] = useMemo(() => {
    const txStatus = transaction.status;
    
    // Step 1: Start on L2
    const step1Status: StepStatus = 
      txStatus === 'pending' ? 'active' :
      ['l2_confirmed', 'waiting_game', 'game_found', 'generating_proof', 'proof_generated', 
       'waiting_proof_signature', 'proof_submitted', 'proof_confirmed', 'waiting_resolve_signature',
       'resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Wait for dispute game (1 hour)
    const waitGameStatus: StepStatus =
      ['l2_confirmed', 'waiting_game'].includes(txStatus) ? 'waiting' :
      ['game_found', 'generating_proof', 'proof_generated', 'waiting_proof_signature', 
       'proof_submitted', 'proof_confirmed', 'waiting_resolve_signature', 'resolving_game',
       'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 2: Prove on L1
    const step2Status: StepStatus =
      // Only active when proof is generated and ready
      txStatus === 'proof_generated' ? 'active' :
      // Show as waiting while generating or waiting for user signature
      ['game_found', 'generating_proof', 'waiting_proof_signature', 'proof_submitted'].includes(txStatus) ? 'waiting' :
      // Completed after transaction is CONFIRMED on L1
      ['proof_confirmed', 'waiting_resolve_signature', 'resolving_game',
       'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Wait for challenge period (7 days)
    const waitChallengeStatus: StepStatus =
      ['proof_submitted', 'proof_confirmed'].includes(txStatus) ? 'waiting' :
      ['waiting_resolve_signature', 'resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 3: Resolve Claims on L1
    // Only active when challenge period is complete (countdown finished) AND proof is confirmed
    const isChallengePeriodComplete = countdown === null || countdown === 0;
    const resolveClaimsStatus: StepStatus =
      (txStatus === 'proof_confirmed' && isChallengePeriodComplete) ? 'active' :
      // Show as waiting during challenge period or while waiting for signature
      (txStatus === 'proof_confirmed' && !isChallengePeriodComplete) ? 'waiting' :
      // Show as waiting while user is signing or transaction is being processed
      ['waiting_resolve_signature'].includes(txStatus) ? 'waiting' :
      // Completed once resolve claims transaction is confirmed
      ['resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 4: Resolve Game on L1
    const resolveGameStatus: StepStatus =
      // Active when resolve claims is done and ready for resolve game
      txStatus === 'resolving_game' ? 'active' :
      // Completed after resolve game is confirmed
      ['game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 5: Finalize withdrawal on L1
    // Only enable finalize button after challenge period is complete
    const finalizeStatus: StepStatus =
      // Only active when game is fully resolved (this happens after resolve game is confirmed)
      txStatus === 'game_resolved' ? 'active' :
      // Show as waiting while user is signing or transaction is confirming
      ['waiting_finalize_signature', 'finalizing'].includes(txStatus) ? 'waiting' :
      txStatus === 'completed' ? 'completed' : 'pending';

    return [
      {
        id: 1,
        title: `Start on Proteus`,
        description: transaction.token,
        fee: '0.00000143 ETH',
        feeUSD: '$0.000562',
        status: step1Status,
        buttonText: 'Start',
        action: undefined, // Already started
      },
      {
        id: 2,
        title: 'Wait for Dispute Game',
        description: 'Waiting for dispute game',
        status: waitGameStatus,
        isWaitStep: true,
        waitDuration: '~1 minute',
      },
      {
        id: 3,
        title: 'Prove on Poseidon',
        description: transaction.token,
        fee: '0.0000005 ETH',
        feeUSD: '$0.001964',
        status: step2Status,
        buttonText: 'Prove',
        action: onProve,
      },
      {
        id: 4,
        title: countdown !== null ? `Wait ${countdown} seconds` : 'Wait 10 seconds',
        description: 'Challenge period',
        status: waitChallengeStatus,
        isWaitStep: true,
        waitDuration: countdown !== null ? `${countdown}s remaining` : '~10 seconds',
      },
      {
        id: 5,
        title: 'Resolve Claims on Poseidon',
        description: transaction.token,
        fee: '0.0000005 ETH',
        feeUSD: '$0.001964',
        status: resolveClaimsStatus,
        buttonText: 'Resolve',
        action: onResolve,
      },
      {
        id: 6,
        title: 'Resolve Game on Poseidon',
        description: transaction.token,
        fee: '0.0000005 ETH',
        feeUSD: '$0.001964',
        status: resolveGameStatus,
        buttonText: 'Resolve Game',
        action: onResolveGame, // User must click to resolve game
      },
      {
        id: 7,
        title: `Get ${transaction.amount} ${transaction.token} on Poseidon`,
        description: transaction.token,
        fee: '0.0000005 ETH',
        feeUSD: '$0.001964',
        status: finalizeStatus,
        buttonText: 'Get',
        action: onFinalize,
      },
    ];
  }, [transaction, onProve, onResolve, onResolveGame, onFinalize, countdown]);

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
    }
    if (step.status === 'waiting') {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
    if (step.status === 'active') {
      return (
        <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
          <Circle className="h-2 w-2 text-gray-900 fill-gray-900" />
        </div>
      );
    }
    return <Circle className="h-4 w-4 text-gray-600" />;
  };

  const getStepIconBg = (step: Step) => {
    if (step.status === 'completed') return 'bg-gray-800';
    if (step.status === 'active') return 'bg-gray-800';
    if (step.status === 'waiting') return 'bg-gray-800';
    return 'bg-gray-900/50';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-b from-gray-950 to-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ξ</span>
                </div>
                <div className="text-center">
                  <h2 className="text-base font-bold text-white leading-tight">
                    Bridge {transaction.amount} {transaction.token}
                  </h2>
                  <p className="text-xs text-gray-400">Via Native Bridge</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-2 bg-gray-900/50">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'steps'
                    ? 'bg-white text-gray-900'
                    : 'bg-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Steps
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'info'
                    ? 'bg-white text-gray-900'
                    : 'bg-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Bridge Info
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              {activeTab === 'steps' ? (
                <>
                  {/* Test Mode Banner */}
                  {TEST_MODE && (
                    <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1.5">
                        <FlaskConical className="h-3 w-3" />
                        <span className="font-semibold">Test Mode</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          onClick={() => handleTestModeAdvance('l2_confirmed')}
                          disabled={transaction.status !== 'pending'}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          L2✓
                        </Button>
                        <Button
                          onClick={() => handleTestModeAdvance('game_found')}
                          disabled={!['l2_confirmed', 'waiting_game'].includes(transaction.status)}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          Game✓
                        </Button>
                        <Button
                          onClick={() => handleTestModeAdvance('proof_generated')}
                          disabled={!['game_found', 'generating_proof'].includes(transaction.status)}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          Proof✓
                        </Button>
                        <Button
                          onClick={() => handleTestModeAdvance('proof_confirmed')}
                          disabled={!['proof_generated', 'waiting_proof_signature', 'proof_submitted'].includes(transaction.status)}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          ProofL1✓
                        </Button>
                        <Button
                          onClick={() => handleTestModeAdvance('game_resolved')}
                          disabled={!['proof_confirmed', 'waiting_resolve_signature', 'resolving_game'].includes(transaction.status)}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          Resolve✓
                        </Button>
                        <Button
                          onClick={() => handleTestModeAdvance('completed')}
                          disabled={!['game_resolved', 'waiting_finalize_signature', 'finalizing'].includes(transaction.status)}
                          className="text-[10px] py-0.5 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-1"
                          size="sm"
                        >
                          Done✓
                        </Button>
                      </div>
                    </div>
                  )}

                <div className="space-y-1.5">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      <div
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          step.status === 'active' || step.status === 'waiting'
                            ? 'bg-gray-800 border border-gray-700'
                            : step.status === 'completed'
                            ? 'bg-gray-800/50 border border-gray-700/50'
                            : 'bg-gray-900/30 border border-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          <div className={`p-1.5 rounded-full ${getStepIconBg(step)} mr-2`}>
                            {getStepIcon(step)}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                step.status === 'pending'
                                  ? 'text-gray-500'
                                  : 'text-white'
                              }`}
                            >
                              {step.title}
                            </p>
                            {step.isWaitStep && step.waitDuration && step.status === 'waiting' && (
                              <p className="text-[10px] text-cyan-400 font-semibold animate-pulse">
                                ⏱️ {step.waitDuration}
                              </p>
                            )}
                            {step.fee && !step.isWaitStep && (
                              <p className="text-[10px] text-gray-500">
                                💰 {step.fee} <span className="text-gray-600">{step.feeUSD}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {step.status === 'completed' ? (
                          <div className="text-green-400 text-lg font-bold">✓</div>
                        ) : step.action && step.buttonText ? (
                          <Button
                            onClick={step.action}
                            disabled={step.status !== 'active'}
                            className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${
                              step.status === 'active'
                                ? 'bg-white text-gray-900 hover:bg-gray-100'
                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {step.buttonText}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                </>
              ) : (
                // Bridge Info Tab
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">From</span>
                    <span className="text-white font-medium">Proteus Devnet</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">To</span>
                    <span className="text-white font-medium">Poseidon Devnet</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-white font-medium">
                      {transaction.amount} {transaction.token}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className="text-white font-medium capitalize">
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Countdown</span>
                    <span className="text-cyan-400 font-medium">
                      {countdown !== null ? `${countdown}s` : 'Not active'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Started</span>
                    <span className="text-white font-medium text-[10px]">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {transaction.l2TxHash && (
                    <div className="pt-1.5 border-t border-gray-700">
                      <p className="text-[10px] text-gray-400 mb-0.5">L2 Transaction</p>
                      <a
                        href={`https://devnet-proteus.psdnscan.io/tx/${transaction.l2TxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline break-all"
                      >
                        {transaction.l2TxHash}
                      </a>
                    </div>
                  )}
                  {transaction.l1ProofTxHash && (
                    <div className="pt-1.5 border-t border-gray-700">
                      <p className="text-[10px] text-gray-400 mb-0.5">Proof Transaction</p>
                      <a
                        href={`https://poseidon.storyscan.io/tx/${transaction.l1ProofTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline break-all"
                      >
                        {transaction.l1ProofTxHash}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

