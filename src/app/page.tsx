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
      console.error("Mint failed:", err);
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
      console.error("Approve stake failed:", err);
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
      console.error("Register worker failed:", err);
    }
  };

  const handleRequestUnstake = async () => {
    if (!address) return;
    
    try {
      await writeRequestUnstake({
        args: [],
      });
    } catch (err) {
      console.error("Request unstake failed:", err);
    }
  };

  const handleWithdrawStake = async () => {
    if (!address) return;
    
    try {
      await writeWithdrawStake({
        args: [address],
      });
    } catch (err) {
      console.error("Withdraw stake failed:", err);
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
      console.error("Claim rewards failed:", err);
    }
  };

  const handleSwitchToL2 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L2 });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const handleSwitchToL1 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L1 });
    } catch (error) {
      console.error('Failed to switch network:', error);
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
                    <p className="text-muted-foreground text-sm">Manage your worker registration and stake</p>
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

              {/* Actions Grid - Register, Claim Rewards & Unstake */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Register Worker Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-card border rounded-xl p-6 space-y-4"
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
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-3xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                      />
                    </div>

                    {/* Network Check, Approval, and Register Button */}
                    {!isOnL2 ? (
                      <Button
                        onClick={handleSwitchToL2}
                        disabled={isSwitchingChain}
                        className="w-full"
                        variant="outline"
                      >
                        {isSwitchingChain ? "Switching..." : "Switch to L2"}
                      </Button>
                    ) : (
                      <>
                        {/* Check if approval is needed */}
                        {stakeAmount && stakeAllowance !== undefined && stakeAllowance < parseUnits(stakeAmount, 18) ? (
                          <Button
                            onClick={handleApproveStake}
                            disabled={!address || isApproveStakePending}
                            className="w-full"
                            variant="outline"
                          >
                            {isApproveStakePending ? "Approving..." : "Approve PSDN"}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleRegisterWorker}
                            disabled={!address || isRegisterWorkerPending || !stakeAmount}
                            className="w-full"
                            variant="outline"
                          >
                            {isRegisterWorkerPending ? "Registering..." : isRegisterWorkerSuccess ? "Registered!" : "Register Worker"}
                          </Button>
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

                    {approveStakeError && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-xs font-medium">
                          {approveStakeError.message}
                        </p>
                      </div>
                    )}
                    
                    {registerWorkerError && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-xs font-medium">
                          {registerWorkerError.message}
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

                {/* Claim Rewards Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
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
                        value={rewardEpochId}
                        onChange={(e) => setRewardEpochId(e.target.value)}
                        placeholder={currentEpochId ? currentEpochId.toString() : "Enter epoch ID"}
                        className="text-3xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                      />
                    </div>

                    {/* Claim Button */}
                    {!isOnL2 ? (
                      <Button
                        onClick={handleSwitchToL2}
                        disabled={isSwitchingChain}
                        className="w-full"
                        variant="outline"
                      >
                        {isSwitchingChain ? "Switching..." : "Switch to L2"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleClaimRewards}
                        disabled={!address || isClaimRewardsPending || !rewardEpochId}
                        className="w-full"
                        variant="outline"
                      >
                        {isClaimRewardsPending ? "Claiming..." : isClaimRewardsSuccess ? "Claimed!" : "Claim Rewards"}
                      </Button>
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

                    {claimRewardsError && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-xs font-medium">
                          {claimRewardsError.message}
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
                  transition={{ duration: 0.5, delay: 0.6 }}
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
                      <Button
                        onClick={handleSwitchToL2}
                        disabled={isSwitchingChain}
                        className="w-full"
                        variant="outline"
                      >
                        {isSwitchingChain ? "Switching..." : "Switch to L2"}
                      </Button>
                    ) : (
                      <>
                        {/* Step 1: Request Unstake */}
                        <Button
                          onClick={handleRequestUnstake}
                          disabled={!address || isRequestUnstakePending || (workerInfo && workerInfo.unstakeRequestedAt > BigInt(0))}
                          className="w-full"
                          variant="outline"
                        >
                          {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) 
                            ? "Unstake Already Requested" 
                            : isRequestUnstakePending 
                              ? "Requesting..." 
                              : isRequestUnstakeSuccess 
                                ? "Unstake Requested!" 
                                : "1. Request Unstake"}
                        </Button>

                        {/* Step 2: Withdraw Stake */}
                        <Button
                          onClick={handleWithdrawStake}
                          disabled={
                            !address || 
                            isWithdrawStakePending || 
                            !(workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)) || 
                            (workerInfo && workerInfo.stakedAmount === BigInt(0))
                          }
                          className="w-full"
                          variant="outline"
                        >
                          {workerInfo && workerInfo.stakedAmount === BigInt(0)
                            ? "Already Withdrawn"
                            : isWithdrawStakePending 
                              ? "Withdrawing..." 
                              : isWithdrawStakeSuccess 
                                ? "Withdrawn!" 
                                : "2. Withdraw Stake"}
                        </Button>
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

                    {requestUnstakeError && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-xs font-medium">
                          {requestUnstakeError.message}
                        </p>
                      </div>
                    )}

                    {withdrawStakeError && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-xs font-medium">
                          {withdrawStakeError.message}
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
            </div>
      ) : (
        <div className="w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-card text-card-foreground border rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden"
          >
            {/* Futuristic background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <img 
                    src="https://psdn.ai/icon.png?07720b992e581016" 
                    alt="PSDN"
                    className="w-6 h-6 rounded-full object-cover"
                  />
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
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <img 
                        src="https://psdn.ai/icon.png?07720b992e581016" 
                        alt="PSDN"
                        className="w-4 h-4 rounded-full object-cover"
                      />
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
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="0"
                    className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                  />
                  <div className="text-muted-foreground text-sm">Amount to mint</div>
                </div>
              </div>

              {/* Network Check and Mint Button */}
              {!isOnL1 ? (
                <Button
                  onClick={handleSwitchToL1}
                  disabled={isSwitchingChain}
                  className="w-full mt-6"
                  variant="outline"
                >
                  {isSwitchingChain ? "Switching..." : "Switch to Poseidon Devnet (L1)"}
                </Button>
              ) : (
                <Button
                  onClick={handleMint}
                  disabled={!address || isPending || !mintAmount}
                  className="w-full mt-6"
                  variant="outline"
                >
                  {isPending ? "Minting..." : isSuccess ? "Minted!" : "Mint"}
                </Button>
              )}

              {/* Status Messages */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Error: {error.message}
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