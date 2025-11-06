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
  useWriteSubnetControlPlaneClaimRewardsFor,
  useReadSubnetControlPlaneGetMinimumStake,
  useReadSubnetControlPlaneGetConfig,
  useReadMintPsdnBalanceOf
} from "@/generated";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useReadContract, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseUnits, formatUnits } from "viem";
import { motion } from "motion/react";
import { CHAIN_IDS, MAX_UINT256, CONTRACT_ADDRESSES } from "@/lib/constants";
import { isUserRejectedError, formatTransactionError } from "@/lib/error-utils";
import { formatBalance } from "@/lib/utils";

export default function Home() {
  const [currentView, setCurrentView] = useState<'bridge' | 'mint' | 'stake'>('bridge');
  const [mintAmount, setMintAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [rewardEpochId, setRewardEpochId] = useState("");

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  
  const isOnL2 = chainId === CHAIN_IDS.L2;
  
  const { writeContract, isPending, isSuccess, error } = useWriteMintPsdnMint();
  
  // Read SubnetControlPlane config to get the staking token address
  const { data: subnetConfig } = useReadSubnetControlPlaneGetConfig({
    query: { 
      enabled: isOnL2,
    },
    chainId: CHAIN_IDS.L2,
  });

  // Stake tab - approval and registration hooks
  const { 
    writeContract: writeApproveStake, 
    isPending: isApproveStakePending,
    data: approveStakeTxHash,
    error: approveStakeError 
  } = useWriteContract();
  
  // ERC20 ABI for approve and allowance
  const erc20Abi = [
    {
      type: 'function',
      name: 'approve',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'allowance',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ] as const;
  
  const { data: stakeAllowance, refetch: refetchStakeAllowance } = useReadContract({
    address: subnetConfig?.poseidonToken,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && subnetConfig ? [address, CONTRACT_ADDRESSES.SUBNET_TREASURY] : undefined,
    query: { 
      enabled: !!address && !!subnetConfig,
      refetchInterval: 10000,
    },
    chainId: CHAIN_IDS.L2,
  });
  
  const { isSuccess: isApproveStakeSuccess } = useWaitForTransactionReceipt({
    hash: approveStakeTxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
  });

  // Refetch allowance when approval succeeds
  useEffect(() => {
    if (isApproveStakeSuccess) {
      refetchStakeAllowance();
    }
  }, [isApproveStakeSuccess, refetchStakeAllowance]);
  
  const { 
    writeContract: writeRegisterWorker, 
    isPending: isRegisterWorkerPending, 
    data: registerWorkerTxHash,
    error: registerWorkerError 
  } = useWriteSubnetControlPlaneRegisterWorker();

  const { isSuccess: isRegisterWorkerSuccess, isLoading: isRegisterWorkerConfirming } = useWaitForTransactionReceipt({
    hash: registerWorkerTxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
  });

  // Unstake hooks
  const { 
    writeContract: writeRequestUnstake, 
    isPending: isRequestUnstakePending,
    data: requestUnstakeTxHash,
    error: requestUnstakeError 
  } = useWriteSubnetControlPlaneRequestUnstake();

  const { isSuccess: isRequestUnstakeSuccess, isLoading: isRequestUnstakeConfirming } = useWaitForTransactionReceipt({
    hash: requestUnstakeTxHash as `0x${string}`,
    chainId: CHAIN_IDS.L2,
  });
  
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

  // Minimum stake requirement read
  const { data: minimumStake } = useReadSubnetControlPlaneGetMinimumStake({
    query: { 
      enabled: isOnL2,
    },
    chainId: CHAIN_IDS.L2,
  });

  // PSDN L2 balance for stake section
  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && isOnL2,
      refetchInterval: 5000,
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
    if (!address) {
      openConnectModal?.();
      return;
    }
    if (!mintAmount) return;
    
    try {
      const amount = parseUnits(mintAmount, 18);
      await writeContract({
        args: [address, amount],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleApproveStake = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    if (!subnetConfig) {
      return;
    }
    
    try {
      const stakingTokenAddress = subnetConfig.poseidonToken;
      await writeApproveStake({
        address: stakingTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.SUBNET_TREASURY, BigInt(MAX_UINT256)],
        chainId: CHAIN_IDS.L2,
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleMinStakeClick = () => {
    if (minimumStake) {
      setStakeAmount(formatUnits(minimumStake, 18));
    }
  };

  const handleMaxStakeClick = () => {
    if (psdnL2Balance) {
      setStakeAmount(formatUnits(psdnL2Balance, 18));
    }
  };

  const handleRegisterWorker = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    if (!stakeAmount) return;
    
    try {
      const amount = parseUnits(stakeAmount, 18);
      await writeRegisterWorker({
        args: [amount],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleRequestUnstake = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    
    try {
      await writeRequestUnstake({
        args: [],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleWithdrawStake = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    
    try {
      await writeWithdrawStake({
        args: [address],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleClaimRewards = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    if (!rewardEpochId) return;
    
    try {
      const epochId = BigInt(rewardEpochId);
      await writeClaimRewards({
        args: [address, epochId],
      });
    } catch (err) {
      if (!isUserRejectedError(err)) {
        // Error silently ignored
      }
    }
  };

  const handleSwitchToL2 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L2 });
    } catch (error) {
      if (!isUserRejectedError(error)) {
        // Error silently ignored
      }
    }
  };

  const handleSwitchToL1 = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.L1 });
    } catch (error) {
      if (!isUserRejectedError(error)) {
        // Error silently ignored
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

  // Refetch worker info and balance after registration, unstake request, or withdrawal
  useEffect(() => {
    if (isRegisterWorkerSuccess || isRequestUnstakeSuccess || isWithdrawStakeSuccess) {
      refetchWorkerInfo();
      refetchPsdnL2Balance();
    }
  }, [isRegisterWorkerSuccess, isRequestUnstakeSuccess, isWithdrawStakeSuccess, refetchWorkerInfo, refetchPsdnL2Balance]);

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
        className="min-h-screen bg-black text-white flex items-center justify-center p-2 sm:p-4 pt-20 sm:pt-24 relative overflow-hidden"
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
                    <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gray-800/30 text-gray-300 border border-gray-700/30">
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
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Staked Amount</p>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {formatUnits(workerInfo.stakedAmount, 18)}
                    </p>
                    <p className="text-xs text-gray-500">PSDN</p>
                  </div>

                  {/* Status Card */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Worker Status</p>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      {workerInfo.isActive ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-700/30 text-gray-300 border border-gray-600/30">
                          ● Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                          ○ Inactive
                        </span>
                      )}
                      {workerInfo.isJailed && (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-700/30 text-gray-300 border border-gray-600/30">
                          ⚠ Jailed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Real-time</p>
                  </div>

                  {/* Missed Heartbeats Card */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Missed Heartbeats</p>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {workerInfo.missedHeartbeats.toString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Count</p>
                  </div>

                  {/* Last Heartbeat Card */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">Last Heartbeat</p>
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
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-300">Unstake Request Pending</p>
                          <p className="text-xs text-gray-400/70 mt-0.5">
                            Requested: {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleDateString()} {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400/70">Effective Epoch</p>
                        <p className="text-2xl font-bold text-gray-200">
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
                          <div className="flex items-center gap-2">
                            {psdnL2Balance && (
                              <span className="text-xs text-muted-foreground">
                                {formatBalance(psdnL2Balance)} available
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">PSDN</span>
                          </div>
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
                        <div className="flex items-center justify-between">
                          {minimumStake && (
                            <p className="text-xs text-gray-500">
                              Minimum required: {formatUnits(minimumStake, 18)} PSDN
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {minimumStake && (
                              <button
                                onClick={handleMinStakeClick}
                                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-muted/70 border border-border/30 hover:border-border/50 rounded-lg transition-all duration-200"
                              >
                                MIN
                              </button>
                            )}
                            {psdnL2Balance && (
                              <button
                                onClick={handleMaxStakeClick}
                                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-muted/70 border border-border/30 hover:border-border/50 rounded-lg transition-all duration-200"
                              >
                                MAX
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Network Check, Approval, and Register Button */}
                      {!address ? (
                        <button
                          onClick={() => openConnectModal?.()}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect Wallet
                        </button>
                      ) : !isOnL2 ? (
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
                              disabled={isApproveStakePending || (!!approveStakeTxHash && !isApproveStakeSuccess)}
                              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(isApproveStakePending || (approveStakeTxHash && !isApproveStakeSuccess)) ? "Approving..." : "Approve Tokens"}
                            </button>
                          ) : (
                            <button
                              onClick={handleRegisterWorker}
                              disabled={isRegisterWorkerPending || isRegisterWorkerConfirming || !stakeAmount}
                              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(isRegisterWorkerPending || isRegisterWorkerConfirming) ? "Registering..." : isRegisterWorkerSuccess ? "Registered!" : "Register Worker"}
                            </button>
                          )}
                        </>
                      )}

                      {/* Status Messages */}
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
                      <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
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
                      {!address ? (
                        <button
                          onClick={() => openConnectModal?.()}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect Wallet
                        </button>
                      ) : !isOnL2 ? (
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
                          disabled={isClaimRewardsPending || !rewardEpochId || !workerInfo.isActive}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isClaimRewardsPending ? "Claiming..." : isClaimRewardsSuccess ? "Claimed!" : "Claim Rewards"}
                        </button>
                      )}

                      {/* Status Messages */}
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
                    className="bg-card border rounded-xl p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold">Unstake & Withdraw</h3>
                        <p className="text-xs text-muted-foreground">Two-step process</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Process Steps Visualization */}
                      {isOnL2 && address && (
                        <div className="space-y-4">
                          {/* Step 1 */}
                          <div className="relative">
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                  workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)
                                    ? 'bg-gray-800/60 border-gray-600 text-gray-300'
                                    : 'bg-gray-800/60 border-gray-700 text-gray-500'
                                }`}>
                                  {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-sm font-bold">1</span>
                                  )}
                                </div>
                                {workerInfo && workerInfo.unstakeRequestedAt === BigInt(0) && (
                                  <div className="w-0.5 h-8 bg-gray-700/50 mt-2"></div>
                                )}
                              </div>
                              <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-white">Request Unstake</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)
                                        ? "Request submitted"
                                        : "Initiate unstake request"}
                                    </p>
                                  </div>
                                </div>
                                {workerInfo && workerInfo.unstakeRequestedAt === BigInt(0) && (
                                  !address ? (
                                    <button
                                      onClick={() => openConnectModal?.()}
                                      className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Connect Wallet
                                    </button>
                                  ) : (
                                    <button
                                      onClick={handleRequestUnstake}
                                      disabled={isRequestUnstakePending || isRequestUnstakeConfirming}
                                      className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {(isRequestUnstakePending || isRequestUnstakeConfirming) ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Requesting...
                                        </>
                                      ) : isRequestUnstakeSuccess ? (
                                        "Requested!"
                                      ) : (
                                        "Request Unstake"
                                      )}
                                    </button>
                                  )
                                )}
                                {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) && (
                                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                    <p className="text-xs text-gray-400">
                                      Requested on {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Effective epoch: {workerInfo.unstakeEffectiveEpoch.toString()}
                                    </p>
                                  </div>
                                )}
                                {requestUnstakeError && formatTransactionError(requestUnstakeError) && (
                                  <div className="mt-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <p className="text-destructive text-xs font-medium">
                                      {formatTransactionError(requestUnstakeError)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="relative">
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                  workerInfo && workerInfo.stakedAmount === BigInt(0)
                                    ? 'bg-gray-800/60 border-gray-600 text-gray-300'
                                    : workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)
                                    ? 'bg-gray-800/60 border-gray-600 text-gray-300'
                                    : 'bg-gray-800/60 border-gray-700 text-gray-500 opacity-50'
                                }`}>
                                  {workerInfo && workerInfo.stakedAmount === BigInt(0) ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-sm font-bold">2</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-white">Withdraw Stake</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {workerInfo && workerInfo.stakedAmount === BigInt(0)
                                        ? "Stake withdrawn"
                                        : workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) && currentEpochId && currentEpochId < workerInfo.unstakeEffectiveEpoch
                                        ? `Wait until epoch ${workerInfo.unstakeEffectiveEpoch.toString()}`
                                        : workerInfo && workerInfo.unstakeRequestedAt > BigInt(0)
                                        ? "Ready to withdraw"
                                        : "Complete step 1 first"}
                                    </p>
                                  </div>
                                </div>
                                {workerInfo && workerInfo.unstakeRequestedAt > BigInt(0) && workerInfo.stakedAmount > BigInt(0) && (
                                  !address ? (
                                    <button
                                      onClick={() => openConnectModal?.()}
                                      className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Connect Wallet
                                    </button>
                                  ) : (
                                    <button
                                      onClick={handleWithdrawStake}
                                      disabled={isWithdrawStakePending || !currentEpochId || currentEpochId < workerInfo.unstakeEffectiveEpoch}
                                      className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isWithdrawStakePending ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Withdrawing...
                                        </>
                                      ) : isWithdrawStakeSuccess ? (
                                        "Withdrawn!"
                                      ) : currentEpochId && currentEpochId < workerInfo.unstakeEffectiveEpoch ? (
                                        `Withdraw (Epoch ${currentEpochId.toString()}/${workerInfo.unstakeEffectiveEpoch.toString()})`
                                      ) : (
                                        "Withdraw Stake"
                                      )}
                                    </button>
                                  )
                                )}
                                {workerInfo && workerInfo.stakedAmount === BigInt(0) && (
                                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                    <p className="text-xs text-gray-400">
                                      Your stake has been successfully withdrawn
                                    </p>
                                  </div>
                                )}
                                {!workerInfo || workerInfo.unstakeRequestedAt === BigInt(0) ? (
                                  <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20">
                                    <p className="text-xs text-gray-500">
                                      Complete step 1 to unlock withdrawal
                                    </p>
                                  </div>
                                ) : null}
                                {withdrawStakeError && formatTransactionError(withdrawStakeError) && (
                                  <div className="mt-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <p className="text-destructive text-xs font-medium">
                                      {formatTransactionError(withdrawStakeError)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Network Switch */}
                      {!address ? (
                        <button
                          onClick={() => openConnectModal?.()}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect Wallet
                        </button>
                      ) : !isOnL2 && (
                        <button
                          onClick={handleSwitchToL2}
                          disabled={isSwitchingChain}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitchingChain ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Switching...
                            </>
                          ) : (
                            "Switch to L2"
                          )}
                        </button>
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
              {!address ? (
                <button
                  onClick={() => openConnectModal?.()}
                  className="w-full flex items-center justify-center px-4 py-3 mt-6 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect Wallet
                </button>
              ) : !isOnL1 ? (
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
                  disabled={isPending || !mintAmount}
                  className="w-full flex items-center justify-center px-4 py-3 mt-6 text-sm font-semibold text-gray-400 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Minting..." : "Mint"}
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

            </div>

          </motion.div>
        </div>
      )}
        </div>
      </main>
    </>
  );
}