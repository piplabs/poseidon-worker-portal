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
  useReadSubnetControlPlaneGetCurrentEpochId
} from "@/generated";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { motion } from "motion/react";
import { CHAIN_IDS, MAX_UINT256, CONTRACT_ADDRESSES } from "@/lib/constants";

export default function Home() {
  const [currentView, setCurrentView] = useState<'bridge' | 'mint' | 'stake'>('bridge');
  const [mintAmount, setMintAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");

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
    args: address ? [address, CONTRACT_ADDRESSES.SUBNET_CONTROL_PLANE] : undefined,
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
      refetchInterval: 10000,
    },
    chainId: CHAIN_IDS.L2,
  });

  // Current epoch read
  const { data: currentEpochId } = useReadSubnetControlPlaneGetCurrentEpochId({
    query: { 
      enabled: isOnL2,
      refetchInterval: 10000,
    },
    chainId: CHAIN_IDS.L2,
  });

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
      await writeApproveStake({
        args: [CONTRACT_ADDRESSES.SUBNET_CONTROL_PLANE, BigInt(MAX_UINT256)],
      });
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
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <img 
                    src="https://psdn.ai/icon.png?07720b992e581016" 
                    alt="PSDN"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold">Register Worker</h1>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      L2
                    </span>
                    <span className="text-sm text-muted-foreground">Proteus Devnet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Epoch Display */}
            {isOnL2 && (
              <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Current Epoch</p>
                    <p className="text-3xl font-bold text-white">
                      {currentEpochId ? currentEpochId.toString() : "Loading..."}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-cyan-300 font-semibold">Live</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Updates every 10 seconds</p>
              </div>
            )}

            {/* Worker Info Display */}
            {isOnL2 && address && (
              <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl p-5 space-y-4 border border-purple-500/20">
                {/* Header with Status Badges */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-white">Worker Status</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {workerInfo && workerInfo.registeredAt > BigInt(0) 
                        ? "Real-time worker information"
                        : "Not registered as a worker"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {workerInfo && workerInfo.registeredAt > BigInt(0) ? (
                      <>
                        {workerInfo.isActive ? (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                            ● Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                            ○ Inactive
                          </span>
                        )}
                        {workerInfo.isJailed && (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                            ⚠ Jailed
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        ○ Not Registered
                      </span>
                    )}
                  </div>
                </div>

                {/* Worker Address */}
                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                  <p className="text-xs text-gray-400 mb-1">Worker Address</p>
                  <p className="text-sm font-mono text-white break-all">{address}</p>
                </div>
                
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Staked Amount */}
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Staked Amount</p>
                    <p className="text-xl font-bold text-white">
                      {workerInfo && workerInfo.registeredAt > BigInt(0) 
                        ? formatUnits(workerInfo.stakedAmount, 18)
                        : "0.00"}
                    </p>
                    <p className="text-xs text-gray-500">PSDN</p>
                  </div>
                  
                  {/* Missed Heartbeats */}
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Missed Heartbeats</p>
                    <p className="text-xl font-bold text-white">
                      {workerInfo && workerInfo.registeredAt > BigInt(0) 
                        ? workerInfo.missedHeartbeats.toString()
                        : "0"}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  
                  {/* Registered At */}
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Registered At</p>
                    {workerInfo && workerInfo.registeredAt > BigInt(0) ? (
                      <>
                        <p className="text-sm font-semibold text-white">
                          {new Date(Number(workerInfo.registeredAt) * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(Number(workerInfo.registeredAt) * 1000).toLocaleTimeString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-500">Not registered</p>
                    )}
                  </div>
                  
                  {/* Last Heartbeat */}
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Last Heartbeat</p>
                    {workerInfo && workerInfo.registeredAt > BigInt(0) && workerInfo.lastHeartbeat > BigInt(0) ? (
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
                </div>

                {/* Unstake Information (if applicable) */}
                {workerInfo && workerInfo.registeredAt > BigInt(0) && workerInfo.unstakeRequestedAt > BigInt(0) && (
                  <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30 space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <p className="text-sm font-semibold text-orange-300">Unstake Request Pending</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-orange-400/70">Requested At</p>
                        <p className="text-sm font-semibold text-orange-200">
                          {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-orange-400/70">
                          {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-orange-400/70">Effective Epoch</p>
                        <p className="text-xl font-bold text-orange-200">
                          {workerInfo.unstakeEffectiveEpoch.toString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamp Info */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}

            {/* Register Worker Form */}
            <div className="space-y-4">
              <div className="bg-card text-card-foreground border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <img 
                        src="https://psdn.ai/icon.png?07720b992e581016" 
                        alt="PSDN"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-foreground font-medium">PSDN Stake</div>
                      <div className="text-muted-foreground text-sm">Proteus Devnet</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0"
                    className="text-2xl font-bold text-foreground border-none shadow-none focus:outline-none p-0 bg-transparent w-full"
                  />
                  <div className="text-muted-foreground text-sm">Stake amount (PSDN)</div>
                </div>
              </div>

              {/* Network Check, Approval, and Register Button */}
              {!isOnL2 ? (
                <Button
                  onClick={handleSwitchToL2}
                  disabled={isSwitchingChain}
                  className="w-full mt-6"
                  variant="outline"
                >
                  {isSwitchingChain ? "Switching..." : "Switch to Proteus Devnet (L2)"}
                </Button>
              ) : (
                <>
                  {/* Check if approval is needed */}
                  {stakeAmount && stakeAllowance !== undefined && stakeAllowance < parseUnits(stakeAmount, 18) ? (
                    <Button
                      onClick={handleApproveStake}
                      disabled={!address || isApproveStakePending}
                      className="w-full mt-6"
                      variant="outline"
                    >
                      {isApproveStakePending ? "Approving..." : "Approve PSDN"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegisterWorker}
                      disabled={!address || isRegisterWorkerPending || !stakeAmount}
                      className="w-full mt-6"
                      variant="outline"
                    >
                      {isRegisterWorkerPending ? "Registering..." : isRegisterWorkerSuccess ? "Registered!" : "Register Worker"}
                    </Button>
                  )}
                </>
              )}

              {/* Status Messages */}
              {approveStakeError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Approval Error: {approveStakeError.message}
                  </p>
                </div>
              )}
              
              {registerWorkerError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Error: {registerWorkerError.message}
                  </p>
                </div>
              )}
              
              {isApproveStakeSuccess && !isRegisterWorkerSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    PSDN approved! You can now register as a worker.
                  </span>
                </div>
              )}
              
              {isRegisterWorkerSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Successfully registered as worker with {stakeAmount} PSDN stake!
                  </span>
                </div>
              )}

              {/* Wallet Connection Status */}
              {!address && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                    Please connect your wallet to register as a worker
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Unstake Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="bg-card text-card-foreground border rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden mt-4"
          >
            {/* Futuristic background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 rounded-2xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Unstake & Withdraw</h2>
              <p className="text-sm text-muted-foreground">Request to unstake, then withdraw your PSDN</p>
            </div>

            {/* Unstake Buttons */}
            <div className="space-y-3">
              {!isOnL2 ? (
                <Button
                  onClick={handleSwitchToL2}
                  disabled={isSwitchingChain}
                  className="w-full"
                  variant="outline"
                >
                  {isSwitchingChain ? "Switching..." : "Switch to Proteus Devnet (L2)"}
                </Button>
              ) : (
                <>
                  {/* Step 1: Request Unstake */}
                  <Button
                    onClick={handleRequestUnstake}
                    disabled={!address || isRequestUnstakePending}
                    className="w-full"
                    variant="outline"
                  >
                    {isRequestUnstakePending ? "Requesting..." : isRequestUnstakeSuccess ? "Unstake Requested!" : "1. Request Unstake"}
                  </Button>

                  {/* Step 2: Withdraw Stake (only enabled after request is successful) */}
                  <Button
                    onClick={handleWithdrawStake}
                    disabled={!address || !isRequestUnstakeSuccess || isWithdrawStakePending}
                    className="w-full"
                    variant="outline"
                  >
                    {isWithdrawStakePending ? "Withdrawing..." : isWithdrawStakeSuccess ? "Withdrawn!" : "2. Withdraw Stake"}
                  </Button>
                </>
              )}

              {/* Unstake Status Messages */}
              {requestUnstakeError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Request Unstake Error: {requestUnstakeError.message}
                  </p>
                </div>
              )}

              {withdrawStakeError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    Withdraw Error: {withdrawStakeError.message}
                  </p>
                </div>
              )}
              
              {isRequestUnstakeSuccess && !isWithdrawStakeSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    Unstake requested! You can now withdraw your stake.
                  </span>
                </div>
              )}
              
              {isWithdrawStakeSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Successfully withdrawn your stake!
                  </span>
                </div>
              )}

              {!address && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                    Please connect your wallet to unstake
                  </span>
                </div>
              )}
            </div>
          </motion.div>
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