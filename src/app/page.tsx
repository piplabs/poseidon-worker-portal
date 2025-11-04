"use client";

import { useState, useEffect } from "react";
import { BridgeInterface } from "@/components/bridge-interface";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { 
  useWriteMintPsdnMint, 
  useWriteSubnetControlPlaneRegisterWorker,
  useReadMintPsdnAllowance,
  useWriteMintPsdnApprove,
  useWriteSubnetControlPlaneRequestUnstake,
  useWriteSubnetControlPlaneWithdrawStake,
  useReadSubnetControlPlaneGetWorkerInfo,
  useReadSubnetControlPlaneGetCurrentEpochId,
  useReadSubnetControlPlaneGetWorkerRewards,
  useWriteSubnetControlPlaneClaimRewardsFor
} from "@/generated";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { motion } from "motion/react";
import { CHAIN_IDS, MAX_UINT256, CONTRACT_ADDRESSES } from "@/lib/constants";
import { isUserRejectedError, formatTransactionError } from "@/lib/error-utils";

export default function Home() {
  const [currentView, setCurrentView] = useState<'bridge' | 'mint' | 'stake'>('bridge');
  const [mintAmount, setMintAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [rewardEpochId, setRewardEpochId] = useState("");

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  const isOnL2 = chainId === CHAIN_IDS.L2;
  
  const { writeContract, isPending, isSuccess, error } = useWriteMintPsdnMint();
  
  // Stake tab - approval and registration hooks
  const { 
    writeContract: writeApproveStake, 
    isPending: isApproveStakePending,
    data: approveStakeTxHash,
    error: approveStakeError 
  } = useWriteMintPsdnApprove();
  
  const { data: stakeAllowance, refetch: refetchStakeAllowance } = useReadMintPsdnAllowance({
    args: address ? [address, CONTRACT_ADDRESSES.APPROVAL_TARGET] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 10000,
    },
    chainId: CHAIN_IDS.L2,
  });
  
  const { isSuccess: isApproveStakeSuccess } = useWaitForTransactionReceipt({
    hash: approveStakeTxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
  });
  
  const { 
    writeContract: writeRegisterWorker, 
    isPending: isRegisterWorkerPending, 
    isSuccess: isRegisterWorkerSuccess, 
    error: registerWorkerError 
  } = useWriteSubnetControlPlaneRegisterWorker();

  // Unstake hooks
  const { 
    writeContract: writeRequestUnstake, 
    isPending: isRequestUnstakePending,
    isSuccess: isRequestUnstakeSuccess,
    error: requestUnstakeError 
  } = useWriteSubnetControlPlaneRequestUnstake();
  
  const { 
    writeContract: writeWithdrawStake, 
    isPending: isWithdrawStakePending,
    isSuccess: isWithdrawStakeSuccess,
    error: withdrawStakeError 
  } = useWriteSubnetControlPlaneWithdrawStake();

  // Worker info read
  const { data: workerInfo, refetch: refetchWorkerInfo } = useReadSubnetControlPlaneGetWorkerInfo({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && isOnL2,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
    chainId: CHAIN_IDS.L2,
  });

  // Current epoch read
  const { data: currentEpochId } = useReadSubnetControlPlaneGetCurrentEpochId({
    query: { 
      enabled: isOnL2,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
    chainId: CHAIN_IDS.L2,
  });

  // Claim rewards hooks (must come after currentEpochId)
  const { data: workerRewards, refetch: refetchWorkerRewards } = useReadSubnetControlPlaneGetWorkerRewards({
    args: address && currentEpochId ? [address, currentEpochId] : undefined,
    query: { 
      enabled: !!address && isOnL2 && !!currentEpochId,
      refetchInterval: 5000,
    },
    chainId: CHAIN_IDS.L2,
  });

  const { 
    writeContract: writeClaimRewards, 
    isPending: isClaimRewardsPending,
    isSuccess: isClaimRewardsSuccess,
    error: claimRewardsError 
  } = useWriteSubnetControlPlaneClaimRewardsFor();

  const handleMint = async () => {
    if (!address || !mintAmount) return;
    
    try {
      const amount = parseUnits(mintAmount, 18);
      await writeContract({
        args: [address, amount],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Mint failed:", err);
      }
    }
  };

  const handleApproveStake = async () => {
    if (!address) return;
    
    try {
      console.log('🔐 Approving PSDN_L2 for staking operations...');
      console.log('   Token:', CONTRACT_ADDRESSES.PSDN_L2);
      console.log('   Spender:', CONTRACT_ADDRESSES.APPROVAL_TARGET);
      await writeApproveStake({
        args: [CONTRACT_ADDRESSES.APPROVAL_TARGET, BigInt(MAX_UINT256)],
      });
      console.log('✅ Approval transaction submitted');
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Approve stake failed:", err);
      }
    }
  };

  const handleRegisterWorker = async () => {
    if (!address || !stakeAmount) return;
    
    try {
      const amount = parseUnits(stakeAmount, 18);
      await writeRegisterWorker({
        args: [amount],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Register worker failed:", err);
      }
    }
  };

  const handleRequestUnstake = async () => {
    if (!address) return;
    
    try {
      await writeRequestUnstake({
        args: [],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Request unstake failed:", err);
      }
    }
  };

  const handleWithdrawStake = async () => {
    if (!address) return;
    
    try {
      await writeWithdrawStake({
        args: [address],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Withdraw stake failed:", err);
      }
    }
  };

  const handleClaimRewards = async () => {
    if (!address || !rewardEpochId) return;
    
    try {
      const epochId = BigInt(rewardEpochId);
      await writeClaimRewards({
        args: [address, epochId],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        console.error("Claim rewards failed:", err);
      }
    }
  };

  const handleSwitchToL2 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L2 });
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const handleSwitchToL1 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L1 });
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const isOnL1 = chainId === CHAIN_IDS.L1;

  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (isApproveStakeSuccess) {
      refetchStakeAllowance();
    }
  }, [isApproveStakeSuccess, refetchStakeAllowance]);

  // Refetch worker info after registration, unstake request, or withdrawal
  useEffect(() => {
    if (isRegisterWorkerSuccess || isRequestUnstakeSuccess || isWithdrawStakeSuccess) {
      refetchWorkerInfo();
    }
  }, [isRegisterWorkerSuccess, isRequestUnstakeSuccess, isWithdrawStakeSuccess, refetchWorkerInfo]);

  // Refetch worker rewards after claiming
  useEffect(() => {
    if (isClaimRewardsSuccess) {
      refetchWorkerRewards();
      refetchWorkerInfo();
    }
  }, [isClaimRewardsSuccess, refetchWorkerRewards, refetchWorkerInfo]);

  // Set default epoch to current epoch
  useEffect(() => {
    if (currentEpochId && !rewardEpochId) {
      setRewardEpochId(currentEpochId.toString());
    }
  }, [currentEpochId, rewardEpochId]);

  return (
    <>
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      <main 
        className="min-h-screen bg-black text-white flex items-center justify-center p-4 pt-24 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/hero-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay to slightly dim the background pattern for better content readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        
        {/* Content container with proper z-index */}
        <div className="relative z-10 w-full flex items-center justify-center">
          {/* Content based on current view */}
          {currentView === 'bridge' ? (
            <BridgeInterface />
          ) : currentView === 'stake' ? (
            <div className="w-full max-w-7xl mx-auto px-4">
              {/* Dashboard Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold">Worker Portal</h1>
                    <p className="text-muted-foreground text-sm">
                      {workerInfo && workerInfo.registeredAt > BigInt(0)
                        ? "Manage your worker registration and stake"
                        : "Register as a worker to start earning rewards"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Proteus L2
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Current Epoch Banner */}
              {isOnL2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-xl p-4 border border-cyan-500/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Current Epoch</p>
                          <p className="text-3xl font-bold text-white">
                            {currentEpochId ? currentEpochId.toString() : "Loading..."}
                          </p>
                        </div>
                        <div className="h-12 w-px bg-white/10"></div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-cyan-300 font-semibold">Network Live</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Updates every 5 seconds</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats Grid - Top */}
              {isOnL2 && address && workerInfo && workerInfo.registeredAt > BigInt(0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                >
                  {/* Staked Amount Card */}
                  <div className="bg-gradient-to-br from-purple-500/30 to-purple-500/15 rounded-xl p-4 border border-purple-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Staked Amount</p>
                      <div className="w-8 h-8 rounded-full bg-purple-500/40 flex items-center justify-center">
                        <span className="text-purple-400 text-lg">💰</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {formatUnits(workerInfo.stakedAmount, 18)}
                    </p>
                    <p className="text-xs text-gray-500">PSDN</p>
                  </div>

                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-green-500/30 to-green-500/15 rounded-xl p-4 border border-green-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Worker Status</p>
                      <div className="w-8 h-8 rounded-full bg-green-500/40 flex items-center justify-center">
                        <span className="text-green-400 text-lg">⚡</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      {workerInfo.isActive ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                          ● Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                          ○ Inactive
                        </span>
                      )}
                      {workerInfo.isJailed && (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                          ⚠ Jailed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Real-time</p>
                  </div>

                  {/* Missed Heartbeats Card */}
                  <div className="bg-gradient-to-br from-orange-500/30 to-orange-500/15 rounded-xl p-4 border border-orange-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Missed Heartbeats</p>
                      <div className="w-8 h-8 rounded-full bg-orange-500/40 flex items-center justify-center">
                        <span className="text-orange-400 text-lg">💔</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {workerInfo.missedHeartbeats.toString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Count</p>
                  </div>

                  {/* Last Heartbeat Card */}
                  <div className="bg-gradient-to-br from-blue-500/30 to-blue-500/15 rounded-xl p-4 border border-blue-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Last Heartbeat</p>
                      <div className="w-8 h-8 rounded-full bg-blue-500/40 flex items-center justify-center">
                        <span className="text-blue-400 text-lg">💓</span>
                      </div>
                    </div>
                    {workerInfo.lastHeartbeat > BigInt(0) ? (
                      <>
                        <p className="text-sm font-semibold text-white">
                          {new Date(Number(workerInfo.lastHeartbeat) * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(Number(workerInfo.lastHeartbeat) * 1000).toLocaleTimeString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-500">Never</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Unstake Alert Banner */}
              {isOnL2 && address && workerInfo && workerInfo.registeredAt > BigInt(0) && workerInfo.unstakeRequestedAt > BigInt(0) && workerInfo.stakedAmount > BigInt(0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="mb-6"
                >
                  <div className="bg-orange-500/30 rounded-xl p-4 border border-orange-500/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-sm font-semibold text-orange-300">Unstake Request Pending</p>
                          <p className="text-xs text-orange-400/70 mt-0.5">
                            Requested: {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleDateString()} {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-orange-400/70">Effective Epoch</p>
                        <p className="text-2xl font-bold text-orange-200">
                          {workerInfo.unstakeEffectiveEpoch.toString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Worker Details Card */}
              {isOnL2 && address && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="bg-card border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold">Worker Details</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {workerInfo && workerInfo.registeredAt > BigInt(0) 
                            ? "Your worker registration information"
                            : "Not registered as a worker"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">Updated: {new Date().toLocaleTimeString()}</p>
                    </div>

                    {/* Worker Address */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Worker Address</p>
                      <p className="text-sm font-mono text-foreground break-all">{address}</p>
                    </div>
                    
                    {/* Registration Info Grid */}
                    {workerInfo && workerInfo.registeredAt > BigInt(0) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Registered At</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(Number(workerInfo.registeredAt) * 1000).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(Number(workerInfo.registeredAt) * 1000).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Total Stake</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatUnits(workerInfo.stakedAmount, 18)} PSDN
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Actions Grid - Conditional rendering based on worker registration */}
              {/* Check if worker is NOT registered */}
              {(!workerInfo || workerInfo.registeredAt === BigInt(0)) ? (
                // When NOT registered: Show only Register Worker card, centered
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-card border rounded-xl p-6 space-y-4 w-full max-w-lg"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold">Register Worker</h3>
                        <p className="text-xs text-muted-foreground">Stake PSDN to register</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="text-xs text-muted-foreground">PSDN</span>
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stakeAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string, numbers, and one decimal point
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setStakeAmount(value);
                            }
                          }}
                          placeholder="0.00"
                          className="text-3xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                        />
                      </div>

                      {/* Network Check, Approval, and Register Button */}
                      {!isOnL2 ? (
                        <button
                          onClick={handleSwitchToL2}
                          disabled={isSwitchingChain}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitchingChain ? "Switching..." : "Switch to L2"}
                        </button>
                      ) : (
                        <>
                          {/* Check if approval is needed */}
                          {stakeAmount && stakeAllowance !== undefined && stakeAllowance < parseUnits(stakeAmount, 18) ? (
                            <button
                              onClick={handleApproveStake}
                              disabled={!address || isApproveStakePending}
                              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isApproveStakePending ? "Approving..." : "Approve PSDN"}
                            </button>
                          ) : (
                            <button
                              onClick={handleRegisterWorker}
                              disabled={!address || isRegisterWorkerPending || !stakeAmount}
                              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isRegisterWorkerPending ? "Registering..." : isRegisterWorkerSuccess ? "Registered!" : "Register Worker"}
                            </button>
                          )}
                        </>
                      )}

                      {/* Status Messages */}
                      {!address && (
                        <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-amber-700 dark:text-amber-300 text-xs">
                            Connect wallet to register
                          </span>
                        </div>
                      )}

                      {approveStakeError && formatTransactionError(approveStakeError) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-destructive text-xs font-medium">
                            {formatTransactionError(approveStakeError)}
                          </p>
                        </div>
                      )}

                      {registerWorkerError && formatTransactionError(registerWorkerError) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-destructive text-xs font-medium">
                            {formatTransactionError(registerWorkerError)}
                          </p>
                        </div>
                      )}

                      {isApproveStakeSuccess && !isRegisterWorkerSuccess && (
                        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700 dark:text-blue-300 text-xs">
                            PSDN approved! You can now register.
                          </span>
                        </div>
                      )}

                      {isRegisterWorkerSuccess && (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 dark:text-green-300 text-xs">
                            Successfully registered with {stakeAmount} PSDN!
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              ) : (
                // When registered: Show Claim Rewards and Unstake & Withdraw cards
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Claim Rewards Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-card border rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold">Claim Rewards</h3>
                        <p className="text-xs text-muted-foreground">For specific epoch</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Current Rewards Display */}
                      <div className="bg-gradient-to-br from-green-500/30 to-green-500/15 rounded-xl p-3 border border-green-500/40">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Available Rewards</p>
                            <p className="text-lg font-bold text-white">
                              {workerRewards ? formatUnits(workerRewards, 18) : "0.00"} <span className="text-xs text-gray-500">PSDN</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Epoch Input */}
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Epoch ID</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={rewardEpochId}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or only integers (no decimal point)
                            if (value === '' || /^\d+$/.test(value)) {
                              setRewardEpochId(value);
                            }
                          }}
                          placeholder={currentEpochId ? currentEpochId.toString() : "Enter epoch ID"}
                          className="text-3xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                        />
                      </div>

                      {/* Claim Button */}
                      {!isOnL2 ? (
                        <button
                          onClick={handleSwitchToL2}
                          disabled={isSwitchingChain}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitchingChain ? "Switching..." : "Switch to L2"}
                        </button>
                      ) : (
                        <button
                          onClick={handleClaimRewards}
                          disabled={!address || isClaimRewardsPending || !rewardEpochId}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isClaimRewardsPending ? "Claiming..." : isClaimRewardsSuccess ? "Claimed!" : "Claim Rewards"}
                        </button>
                      )}

                      {/* Status Messages */}
                      {!address && (
                        <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-amber-700 dark:text-amber-300 text-xs">
                            Connect wallet to claim
                          </span>
                        </div>
                      )}

                      {claimRewardsError && formatTransactionError(claimRewardsError) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-destructive text-xs font-medium">
                            {formatTransactionError(claimRewardsError)}
                          </p>
                        </div>
                      )}

                      {isClaimRewardsSuccess && (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 dark:text-green-300 text-xs">
                            Successfully claimed rewards for epoch {rewardEpochId}!
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Unstake & Withdraw Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-card border rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold">Unstake & Withdraw</h3>
                        <p className="text-xs text-muted-foreground">Two-step process</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Info Box */}
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                          First request unstake, then withdraw your PSDN tokens after the waiting period.
                        </p>
                      </div>

                      {/* Unstake Buttons */}
                      {!isOnL2 ? (
                        <button
                          onClick={handleSwitchToL2}
                          disabled={isSwitchingChain}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitchingChain ? "Switching..." : "Switch to L2"}
                        </button>
                      ) : (
                        <>
                          {/* Step 1: Request Unstake */}
                          <button
                            onClick={handleRequestUnstake}
                            disabled={!address || isRequestUnstakePending || (workerInfo && workerInfo.unstakeRequestedAt > BigInt(0))}
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)
                              ? "Unstake Already Requested"
                              : isRequestUnstakePending
                                ? "Requesting..."
                                : isRequestUnstakeSuccess
                                  ? "Unstake Requested!"
                                  : "1. Request Unstake"}
                          </button>

                          {/* Step 2: Withdraw Stake */}
                          <button
                            onClick={handleWithdrawStake}
                            disabled={
                              !address ||
                              isWithdrawStakePending ||
                              !(workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)) ||
                              (workerInfo && workerInfo.stakedAmount === BigInt(0))
                            }
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {workerInfo && workerInfo.stakedAmount === BigInt(0)
                              ? "Already Withdrawn"
                              : isWithdrawStakePending
                                ? "Withdrawing..."
                                : isWithdrawStakeSuccess
                                  ? "Withdrawn!"
                                  : "2. Withdraw Stake"}
                          </button>
                        </>
                      )}

                      {/* Status Messages */}
                      {!address && (
                        <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-amber-700 dark:text-amber-300 text-xs">
                            Connect wallet to unstake
                          </span>
                        </div>
                      )}

                      {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) && workerInfo.stakedAmount > BigInt(0) && (
                        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700 dark:text-blue-300 text-xs">
                            Unstake requested. Waiting for epoch {workerInfo.unstakeEffectiveEpoch.toString()} to withdraw.
                          </span>
                        </div>
                      )}

                      {requestUnstakeError && formatTransactionError(requestUnstakeError) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-destructive text-xs font-medium">
                            {formatTransactionError(requestUnstakeError)}
                          </p>
                        </div>
                      )}

                      {withdrawStakeError && formatTransactionError(withdrawStakeError) && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-destructive text-xs font-medium">
                            {formatTransactionError(withdrawStakeError)}
                          </p>
                        </div>
                      )}

                      {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) && workerInfo.stakedAmount === BigInt(0) && (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 dark:text-green-300 text-xs">
                            Successfully withdrawn your stake!
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
      ) : (
        <div className="w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-card text-card-foreground border rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                    <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                    <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                    <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold">Mint PSDN L1</h1>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      L1
                    </span>
                    <span className="text-sm text-muted-foreground">Poseidon Devnet</span>
                  </div>
                </div>
              </div>
       
            </div>

            {/* Mint Form */}
            <div className="space-y-4">
              <div className="bg-card text-card-foreground border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
                        <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                        <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                        <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-foreground font-medium">PSDN L1</div>
                      <div className="text-muted-foreground text-sm">Poseidon Devnet</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mintAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, numbers, and one decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setMintAmount(value);
                      }
                    }}
                    placeholder="0"
                    className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                  />
                  <div className="text-muted-foreground text-sm">Amount to mint</div>
                </div>
              </div>

              {/* Network Check and Mint Button */}
              {!isOnL1 ? (
                <button
                  onClick={handleSwitchToL1}
                  disabled={isSwitchingChain}
                  className="w-full flex items-center justify-center px-4 py-3 mt-6 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSwitchingChain ? "Switching..." : "Switch to Poseidon Devnet (L1)"}
                </button>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={!address || isPending || !mintAmount}
                  className="w-full flex items-center justify-center px-4 py-3 mt-6 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Minting..." : isSuccess ? "Minted!" : "Mint"}
                </button>
              )}

              {/* Status Messages - Only show non-cancelled errors */}
              {error && formatTransactionError(error) && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Error: {formatTransactionError(error)}
                  </p>
                </div>
              )}
              
              {isSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Successfully minted {mintAmount} PSDN L1 tokens!
                  </span>
                </div>
              )}

              {/* Wallet Connection Status */}
              {!address && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                    Please connect your wallet to mint tokens
                  </span>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
        </div>
      </main>
    </>
  );
}