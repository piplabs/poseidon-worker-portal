"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Circle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type WithdrawalTransaction, TransactionStorage } from "@/lib/transaction-tracker";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'steps' | 'info'>('steps');
  const [finalizeCountdown, setFinalizeCountdown] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const initialStatusRef = useRef<string | null>(null);
  
  // Track initial status when modal opens
  useEffect(() => {
    if (isOpen && initialStatusRef.current === null) {
      initialStatusRef.current = transaction.status;
    } else if (!isOpen) {
      initialStatusRef.current = null;
    }
  }, [isOpen, transaction.status]);

  // Challenge period removed - Resolve Claims is now immediately available after Prove is confirmed

  // Monitor for finalization countdown
  useEffect(() => {
    // Calculate countdown based on when game was resolved
    if (transaction.status === 'game_resolved' && transaction.gameResolvedAt) {
      const elapsed = Math.floor((Date.now() - transaction.gameResolvedAt) / 1000);
      const remaining = Math.max(0, 10 - elapsed);
      
      if (remaining !== finalizeCountdown) {
        setFinalizeCountdown(remaining);
      }
    } else if (transaction.status !== 'game_resolved') {
      // Reset countdown if we're not in game_resolved state
      setFinalizeCountdown(null);
    }
  }, [transaction.status, transaction.gameResolvedAt]); // Added gameResolvedAt to deps

  // Separate effect for finalization timer
  useEffect(() => {
    if (finalizeCountdown !== null && finalizeCountdown > 0) {
      const timer = setInterval(() => {
        setFinalizeCountdown((prev) => {
          if (prev === null || prev <= 0) {
            return 0;
          }
          const nextValue = prev - 1;
          return nextValue;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [finalizeCountdown]);

  // Handle completion animation - only show if transaction completed during this session
  useEffect(() => {
    if (transaction.status === 'completed' && !showCompletion && isOpen) {
      // Only show animation if transaction wasn't already completed when modal opened
      const wasAlreadyCompleted = initialStatusRef.current === 'completed';
      
      if (!wasAlreadyCompleted) {
        setShowCompletion(true);
      }
    }
  }, [transaction.status, showCompletion, isOpen]);

  // Separate effect to handle the auto-close timer
  useEffect(() => {
    if (showCompletion && isOpen) {
      // Close modal after animation (3 seconds)
      const timer = setTimeout(() => {
        onClose();
        // Reset completion state for next time
        setTimeout(() => setShowCompletion(false), 300);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [showCompletion, isOpen, onClose]);

  // Determine step statuses based on transaction status
  const steps: Step[] = useMemo(() => {
    const txStatus = transaction.status;
    
    // Step 1: Start on L2
    const step1Status: StepStatus = 
      txStatus === 'pending' ? 'confirming' :
      ['l2_confirmed', 'waiting_game', 'game_found', 'generating_proof', 'proof_generated', 
       'waiting_proof_signature', 'proof_submitted', 'proof_confirmed', 'waiting_resolve_signature',
       'resolving_claims', 'claims_resolved', 'waiting_resolve_game_signature', 'resolving_game',
       'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Wait for dispute game (1 hour)
    const waitGameStatus: StepStatus =
      ['l2_confirmed', 'waiting_game'].includes(txStatus) ? 'waiting' :
      ['game_found', 'generating_proof', 'proof_generated', 'waiting_proof_signature', 
       'proof_submitted', 'proof_confirmed', 'waiting_resolve_signature', 'resolving_claims',
       'claims_resolved', 'waiting_resolve_game_signature', 'resolving_game', 'game_resolved',
       'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
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
      ['proof_confirmed', 'waiting_resolve_signature', 'resolving_claims', 'claims_resolved',
       'waiting_resolve_game_signature', 'resolving_game', 'game_resolved',
       'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 3: Resolve Claims on L1
    // Active immediately when proof is confirmed (no challenge period)
    const resolveClaimsStatus: StepStatus =
      // Active when proof is confirmed
      txStatus === 'proof_confirmed' ? 'active' :
      // Waiting while user is signing
      txStatus === 'waiting_resolve_signature' ? 'waiting' :
      // Confirming while resolve claims transaction is being confirmed
      txStatus === 'resolving_claims' ? 'confirming' :
      // Completed once resolve claims transaction is confirmed
      ['claims_resolved', 'waiting_resolve_game_signature', 'resolving_game', 'game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 4: Resolve Game on L1
    const resolveGameStatus: StepStatus =
      // Active when claims are resolved and waiting for user to click
      txStatus === 'claims_resolved' ? 'active' :
      // Waiting while user is signing
      txStatus === 'waiting_resolve_game_signature' ? 'waiting' :
      // Confirming while resolve game transaction is being confirmed
      (txStatus === 'resolving_game' && transaction.l1ResolveGameTxHash) ? 'confirming' :
      // Completed after resolve game is confirmed
      ['game_resolved', 'waiting_finalize_signature', 'finalizing', 'completed'].includes(txStatus)
        ? 'completed' : 'pending';

    // Step 5: Finalize withdrawal on L1
    // Only enable finalize button after the 10-second finalization period
    // Calculate if finalization period is complete based on timestamp if available
    let isFinalizeReady = false;
    if (txStatus === 'game_resolved' && transaction.gameResolvedAt) {
      const elapsed = Math.floor((Date.now() - transaction.gameResolvedAt) / 1000);
      isFinalizeReady = elapsed >= 10;
    } else {
      isFinalizeReady = finalizeCountdown === 0 || (finalizeCountdown === null && txStatus !== 'game_resolved');
    }
    
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
        title: 'Resolve Claims on Poseidon',
        description: transaction.token,
        fee: '0.0000005 IP',
        feeUSD: '$0.001964',
        status: resolveClaimsStatus,
        buttonText: 'Resolve',
        action: onResolve,
      },
      {
        id: 5,
        title: 'Resolve Game on Poseidon',
        description: transaction.token,
        fee: '0.0000005 IP',
        feeUSD: '$0.001964',
        status: resolveGameStatus,
        buttonText: 'Resolve Game',
        action: onResolveGame, // User must click to resolve game
      },
      {
        id: 6,
        title: `Get ${transaction.amount} ${transaction.token} on Poseidon`,
        description: finalizeCountdown !== null && finalizeCountdown > 0
          ? `${finalizeCountdown}s remaining`
          : transaction.token,
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
  }, [transaction, onProve, onResolve, onResolveGame, onFinalize, finalizeCountdown]);

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="h-5 w-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      );
    }
    if (step.status === 'waiting') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Clock className="h-3 w-3 text-white" />
        </motion.div>
      );
    }
    if (step.status === 'confirming') {
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-5 w-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-3 w-3 border-2 border-white border-t-transparent rounded-full"
          />
        </motion.div>
      );
    }
    if (step.status === 'active') {
      return (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50"
        >
          <motion.div
            animate={{ scale: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2.5 w-2.5 rounded-full bg-white"
          />
        </motion.div>
      );
    }
    // Pending state
    return (
      <div className="h-5 w-5 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-gray-700" />
      </div>
    );
  };

  const getStepIconBg = (step: Step) => {
    if (step.status === 'completed') return 'bg-gradient-to-br from-green-950/50 to-green-900/30 border border-green-800/30';
    if (step.status === 'confirming') return 'bg-gradient-to-br from-orange-950/50 to-orange-900/30 border border-orange-800/30';
    if (step.status === 'active') return 'bg-gradient-to-br from-purple-950/50 to-pink-950/30 border border-purple-800/30';
    if (step.status === 'waiting') return 'bg-gradient-to-br from-blue-950/50 to-blue-900/30 border border-blue-800/30';
    return 'bg-gray-950/50 border border-gray-800/30';
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
            {/* Completion Animation Overlay */}
            <AnimatePresence>
              {showCompletion && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/98 via-gray-950/98 to-blue-950/98 backdrop-blur-md overflow-hidden"
                >
                  {/* Sweeping gradient effect - Purple to Blue */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 2.5,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                    className="absolute inset-0 opacity-60"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.6) 20%, rgba(147, 51, 234, 0.8) 35%, rgba(96, 165, 250, 0.8) 65%, rgba(59, 130, 246, 0.6) 80%, transparent 100%)',
                      filter: 'blur(40px)',
                      width: '100%',
                      height: '200%',
                      top: '-50%'
                    }}
                  />
                  
                  {/* Diagonal sweeping bars */}
                  <motion.div
                    initial={{ x: '-150%', y: '-150%' }}
                    animate={{ x: '150%', y: '150%' }}
                    transition={{
                      duration: 3,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 0.2
                    }}
                    className="absolute opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, transparent 0%, rgba(168, 85, 247, 0.9) 30%, rgba(59, 130, 246, 0.9) 70%, transparent 100%)',
                      width: '200%',
                      height: '4px',
                      transform: 'rotate(45deg)',
                      filter: 'blur(2px)'
                    }}
                  />
                  
                  {/* Animated background gradient circles */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)'
                    }}
                  />
                  
                  {/* Success Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 180,
                      damping: 12,
                      duration: 0.8
                    }}
                    className="mb-8 relative z-10"
                  >
                    <div className="relative">
                      {/* Multiple pulsing rings */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.6, 0, 0.6]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 blur-md"
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.4, 0, 0.4]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 blur-md"
                      />
                      
                      {/* Check circle with glow */}
                      <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/60">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 animate-pulse" />
                        <motion.svg
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                          className="w-16 h-16 text-white relative z-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                          />
                        </motion.svg>
                      </div>
                    </div>
                  </motion.div>

                  {/* Success Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-center px-6 relative z-10"
                  >
                    <motion.h3 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-white to-blue-200 bg-clip-text text-transparent mb-3"
                    >
                      Bridge Complete! ✨
                    </motion.h3>
                    <p className="text-purple-100 text-base font-medium">
                      Successfully bridged {transaction.amount} {transaction.token}
                    </p>
                    <motion.p 
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-purple-300/60 text-xs mt-3"
                    >
                      Closing in 3 seconds...
                    </motion.p>
                  </motion.div>

                  {/* Sparkle particles */}
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      animate={{ 
                        opacity: [0, 1, 0.8, 0],
                        scale: [0, 1.5, 1, 0],
                        x: Math.cos((i * 360) / 16 * Math.PI / 180) * (100 + Math.random() * 80),
                        y: Math.sin((i * 360) / 16 * Math.PI / 180) * (100 + Math.random() * 80),
                        rotate: [0, 180]
                      }}
                      transition={{
                        duration: 2,
                        delay: 0.3 + (i * 0.05),
                        ease: "easeOut"
                      }}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%'
                      }}
                    >
                      <div 
                        className="w-1 h-1 rounded-full"
                        style={{
                          background: i % 2 === 0 
                            ? 'linear-gradient(135deg, #a855f7, #3b82f6)' 
                            : 'linear-gradient(135deg, #3b82f6, #a855f7)',
                          boxShadow: i % 2 === 0
                            ? '0 0 8px rgba(168, 85, 247, 0.8)'
                            : '0 0 8px rgba(59, 130, 246, 0.8)'
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                          step.status === 'active'
                            ? 'bg-gradient-to-r from-purple-950/30 via-gray-900 to-pink-950/30 border border-purple-800/50 shadow-lg shadow-purple-900/20'
                            : step.status === 'confirming'
                            ? 'bg-gradient-to-r from-orange-950/30 via-gray-900 to-yellow-950/30 border border-orange-800/50 shadow-lg shadow-orange-900/20'
                            : step.status === 'waiting'
                            ? 'bg-gradient-to-r from-blue-950/30 via-gray-900 to-blue-950/30 border border-blue-800/50 shadow-lg shadow-blue-900/20'
                            : step.status === 'completed'
                            ? 'bg-gradient-to-r from-green-950/20 via-gray-950 to-green-950/20 border border-green-900/40'
                            : 'bg-black/50 border border-gray-900'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          <div className={`p-2 rounded-full ${getStepIconBg(step)} mr-3`}>
                            {getStepIcon(step)}
                          </div>
                          <div className="flex-1">
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
                            {/* Inline error display for this step */}
                            {transaction.errorMessage && step.status === 'active' && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-red-400">
                                <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[10px] leading-tight">
                                  {transaction.errorMessage}
                                </p>
                              </div>
                            )}
                          </div>
                          
                        </div>
                        
                        {/* Right side: Transaction link + Status/Action */}
                        <div className="flex items-center gap-2">
                          {/* Transaction link */}
                          {step.id === 1 && transaction.l2TxHash && (
                            <a
                              href={`https://devnet-proteus.psdnscan.io/tx/${transaction.l2TxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          {step.id === 3 && transaction.l1ProofTxHash && (
                            <a
                              href={`https://poseidon.storyscan.io/tx/${transaction.l1ProofTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          {step.id === 4 && transaction.l1ResolveClaimsTxHash && (
                            <a
                              href={`https://poseidon.storyscan.io/tx/${transaction.l1ResolveClaimsTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          {step.id === 5 && transaction.l1ResolveGameTxHash && (
                            <a
                              href={`https://poseidon.storyscan.io/tx/${transaction.l1ResolveGameTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          {step.id === 6 && transaction.l1FinalizeTxHash && (
                            <a
                              href={`https://poseidon.storyscan.io/tx/${transaction.l1FinalizeTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                              onClick={(e) => e.stopPropagation()}
                              title="View transaction"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          
                          {/* Status indicator / action button */}
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
                              {!address ? 'Connect Wallet' : step.buttonText}
                            </Button>
                          ) : null}
                        </div>
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

