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
  useReadSubnetControlPlaneGetWorkerInfo
} from "@/generated";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { motion } from "motion/react";
import { CHAIN_IDS, MAX_UINT256, CONTRACT_ADDRESSES } from "@/lib/constants";

export default function Home() {
  const [currentView, setCurrentView] = useState<'bridge' | 'mint' | 'stake'>('bridge');
  const [mintAmount, setMintAmount] = useState("100");
  const [stakeAmount, setStakeAmount] = useState("100");

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
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 pt-24">
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

            {/* Worker Info Display */}
            {isOnL2 && address && workerInfo && workerInfo.registeredAt > BigInt(0) && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Worker Status</h3>
                  <div className="flex items-center space-x-2">
                    {workerInfo.isActive ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        Inactive
                      </span>
                    )}
                    {workerInfo.isJailed && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Jailed
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Staked Amount</p>
                    <p className="font-semibold text-foreground">{formatUnits(workerInfo.stakedAmount, 18)} PSDN</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Missed Heartbeats</p>
                    <p className="font-semibold text-foreground">{workerInfo.missedHeartbeats.toString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Registered At</p>
                    <p className="font-semibold text-foreground">{new Date(Number(workerInfo.registeredAt) * 1000).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Heartbeat</p>
                    <p className="font-semibold text-foreground">
                      {workerInfo.lastHeartbeat > BigInt(0) ? new Date(Number(workerInfo.lastHeartbeat) * 1000).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                </div>

                {workerInfo.unstakeRequestedAt > BigInt(0) && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-muted-foreground text-xs">Unstake Requested At</p>
                    <p className="font-semibold text-sm text-foreground">
                      {new Date(Number(workerInfo.unstakeRequestedAt) * 1000).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">Unstake Effective Epoch: {workerInfo.unstakeEffectiveEpoch.toString()}</p>
                  </div>
                )}
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
      </main>
    </>
  );
}