"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Circle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WithdrawalTransaction, TransactionStorage } from "@/lib/transaction-tracker";

interface WithdrawalStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WithdrawalTransaction;
  onProve: () => void;
  onResolve: () => void;
  onResolveGame: () => void;
  onFinalize: () => void;
}

type StepStatus = 'pending' | 'active' | 'waiting' | 'confirming' | 'completed';

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
  const [finalizeCountdown, setFinalizeCountdown] = useState<number | null>(null);

  // Monitor transaction status for countdown timer
  useEffect(() => {
    console.log('🕐 Countdown effect triggered. Status:', transaction.status, 'Current countdown:', countdown);

    // Start countdown only when proof is confirmed (not when submitted)
    if (transaction.status === 'proof_confirmed' && countdown === null) {
      console.log('✅ Starting countdown from 10 seconds (proof confirmed)');
      // Start countdown from 10 seconds
      setCountdown(10);
    } else if (!['proof_confirmed', 'proof_submitted'].includes(transaction.status)) {
      // Reset countdown if we're not in proof submitted or confirmed states
      setCountdown(null);
    }
  }, [transaction.status]); // Remove countdown from deps to prevent re-runs

  // Separate effect for countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 0) {
            console.log('⏰ Countdown complete!');
            return 0;
          }
          const nextValue = prev - 1;
          console.log(`⏱️ Countdown: ${nextValue}s remaining`);
          return nextValue;
        });
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up countdown timer');
        clearInterval(timer);
      };
    }
  }, [countdown]);

  // Monitor for finalization countdown
  useEffect(() => {
    console.log('🕐 Finalization countdown effect. Status:', transaction.status, 'Current countdown:', finalizeCountdown);

    // Start countdown when game is resolved
    if (transaction.status === 'game_resolved' && finalizeCountdown === null) {
      console.log('✅ Starting finalization countdown from 10 seconds');
      setFinalizeCountdown(10);
    } else if (transaction.status !== 'game_resolved') {
      // Reset countdown if we're not in game_resolved state
      setFinalizeCountdown(null);
    }
  }, [transaction.status]); // Remove finalizeCountdown from deps

  // Separate effect for finalization timer
  useEffect(() => {
    if (finalizeCountdown !== null && finalizeCountdown > 0) {
      const timer = setInterval(() => {
        setFinalizeCountdown((prev) => {
          if (prev === null || prev <= 0) {
            console.log('⏰ Finalization countdown complete!');
            return 0;
          }
          const nextValue = prev - 1;
          console.log(`⏱️ Finalization countdown: ${nextValue}s remaining`);
          return nextValue;
        });
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up finalization countdown timer');
        clearInterval(timer);
      };
    }
  }, [finalizeCountdown]);

  // Determine step statuses based on transaction status
  const steps: Step[] = useMemo(() => {
    const txStatus = transaction.status;
    
    // Step 1: Start on L2
    const step1Status: StepStatus = 
      txStatus === 'pending' ? 'confirming' :
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
      ['game_found', 'generating_proof', 'waiting_proof_signature'].includes(txStatus) ? 'waiting' :
      // Show as confirming while transaction is being confirmed
      txStatus === 'proof_submitted' ? 'confirming' :
      // Completed after transaction is confirmed on L1
      ['proof_confirmed', 'waiting_resolve_signature', 'resolving_game',
       'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Wait for challenge period (10 seconds)
    const isChallengePeriodComplete = countdown === 0 || (countdown === null && txStatus !== 'proof_confirmed');
    const waitChallengeStatus: StepStatus =
      // Waiting during proof_confirmed but only while countdown is running
      (txStatus === 'proof_confirmed' && countdown !== null && countdown > 0) ? 'waiting' :
      // Completed when countdown is done OR we've moved to next steps
      (txStatus === 'proof_confirmed' && isChallengePeriodComplete) ||
      ['waiting_resolve_signature', 'resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 3: Resolve Claims on L1
    // Only active when challenge period is complete (countdown finished) AND proof is confirmed
    const resolveClaimsStatus: StepStatus =
      // Active only when proof is confirmed AND challenge period is complete (and not yet moved to next step)
      (txStatus === 'proof_confirmed' && isChallengePeriodComplete && countdown === 0) ? 'active' :
      // Waiting while user is signing
      txStatus === 'waiting_resolve_signature' ? 'waiting' :
      // Completed once resolve claims transaction is confirmed (moved to resolving_game)
      ['resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 4: Resolve Game on L1
    const resolveGameStatus: StepStatus =
      // If resolving_game AND transaction has been submitted, show as confirming
      (txStatus === 'resolving_game' && transaction.l1ResolveGameTxHash) ? 'confirming' :
      // If resolving_game but no transaction hash yet, button should be active (waiting for user to click)
      (txStatus === 'resolving_game' && !transaction.l1ResolveGameTxHash) ? 'active' :
      // Completed after resolve game is confirmed
      ['game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 5: Finalize withdrawal on L1
    // Only enable finalize button after the 10-second finalization period
    const isFinalizeReady = finalizeCountdown === 0 || (finalizeCountdown === null && txStatus !== 'game_resolved');
    const finalizeStatus: StepStatus =
      // Only active when game is resolved AND finalization countdown is complete
      (txStatus === 'game_resolved' && isFinalizeReady) ? 'active' :
      // Waiting during the finalization countdown or user signature
      (txStatus === 'game_resolved' && !isFinalizeReady) || txStatus === 'waiting_finalize_signature' ? 'waiting' :
      // Show as confirming while transaction is being confirmed
      txStatus === 'finalizing' ? 'confirming' :
      txStatus === 'completed' ? 'completed' : 'pending';

    return [
      {
        id: 1,
        title: `Start on Proteus`,
        description: transaction.token,
        fee: '0.00000143 IP',
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
        fee: '0.0000005 IP',
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
        fee: '0.0000005 IP',
        feeUSD: '$0.001964',
        status: resolveClaimsStatus,
        buttonText: 'Resolve',
        action: onResolve,
      },
      {
        id: 6,
        title: 'Resolve Game on Poseidon',
        description: transaction.token,
        fee: '0.0000005 IP',
        feeUSD: '$0.001964',
        status: resolveGameStatus,
        buttonText: 'Resolve Game',
        action: onResolveGame, // User must click to resolve game
      },
      {
        id: 7,
        title: finalizeCountdown !== null && finalizeCountdown > 0
          ? `Wait ${finalizeCountdown} seconds before claiming`
          : `Get ${transaction.amount} ${transaction.token} on Poseidon`,
        description: transaction.token,
        fee: '0.0000005 IP',
        feeUSD: '$0.001964',
        status: finalizeStatus,
        buttonText: finalizeCountdown !== null && finalizeCountdown > 0
          ? `Wait ${finalizeCountdown}s`
          : 'Get',
        action: onFinalize,
        isWaitStep: finalizeCountdown !== null && finalizeCountdown > 0,
        waitDuration: finalizeCountdown !== null && finalizeCountdown > 0
          ? `${finalizeCountdown}s remaining`
          : undefined,
      },
    ];
  }, [transaction, onProve, onResolve, onResolveGame, onFinalize, countdown, finalizeCountdown]);

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return (
        <div className="h-4 w-4 rounded-full bg-gray-400 flex items-center justify-center">
          <Circle className="h-2 w-2 text-gray-900 fill-gray-900" />
        </div>
      );
    }
    if (step.status === 'waiting') {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
    if (step.status === 'active' || step.status === 'confirming') {
      return (
        <div className="h-4 w-4 rounded-full bg-gray-400 flex items-center justify-center">
          <Circle className="h-2 w-2 text-gray-900 fill-gray-900" />
        </div>
      );
    }
    return <Circle className="h-4 w-4 text-gray-600" />;
  };

  const getStepIconBg = (step: Step) => {
    if (step.status === 'completed') return 'bg-gray-700/50';
    if (step.status === 'confirming') return 'bg-gray-800/50';
    if (step.status === 'active') return 'bg-gray-950';
    if (step.status === 'waiting') return 'bg-gray-950';
    return 'bg-black';
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-center p-4 pb-2 border-b border-gray-900 bg-gray-950">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">IP</span>
                </div>
                <div className="text-center">
                  <h2 className="text-base font-bold text-white leading-tight">
                    Bridge {transaction.amount} {transaction.token}
                  </h2>
                  <p className="text-xs text-gray-400">Via Native Bridge</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-2 bg-black">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'steps'
                    ? 'bg-gray-800 text-white'
                    : 'bg-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Steps
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'info'
                    ? 'bg-gray-800 text-white'
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
                <div className="space-y-1.5">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      <div
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          step.status === 'active' || step.status === 'waiting' || step.status === 'confirming'
                            ? 'bg-gray-900 border border-gray-800'
                            : step.status === 'completed'
                            ? 'bg-gray-950 border border-gray-900'
                            : 'bg-black border border-gray-900'
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
                              <p className="text-[10px] text-gray-400 font-semibold animate-pulse">
                                ⏱️ {step.waitDuration}
                              </p>
                            )}
                            {step.status === 'confirming' && !step.isWaitStep && (
                              <p className="text-[10px] text-gray-300 font-semibold">
                                Confirming transaction...
                              </p>
                            )}
                            {step.fee && !step.isWaitStep && step.status !== 'confirming' && (
                              <p className="text-[10px] text-gray-500">
                                💰 {step.fee} <span className="text-gray-600">{step.feeUSD}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {step.status === 'completed' ? (
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.status === 'confirming' ? (
                          <svg className="h-5 w-5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : step.action && step.buttonText ? (
                          <Button
                            onClick={step.action}
                            disabled={step.status !== 'active'}
                            className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${
                              step.status === 'active'
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
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
                <div className="bg-black rounded-lg p-3 space-y-2 border border-gray-900">
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
                    <span className="text-gray-300 font-medium">
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
                        className="text-[10px] text-gray-300 hover:text-white hover:underline break-all"
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
                        className="text-[10px] text-gray-300 hover:text-white hover:underline break-all"
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

