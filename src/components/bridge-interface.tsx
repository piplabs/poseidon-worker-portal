"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { TokenSelector } from "@/components/token-selector";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { motion } from "framer-motion";
import { 
  useReadMintPsdnBalanceOf,
  useReadMintPsdnAllowance,
  useWriteMintPsdnApprove,
  useWriteBridgeBridgeEthTo,
  useWriteBridgeDepositErc20To
} from "@/generated";

// Constants
const CHAIN_IDS = {
  L1: 1518,
  L2: 11711,
} as const;

const CONTRACT_ADDRESSES = {
  PSDN_L1: "0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46",
  PSDN_L2: "0x30f627A3de293d408E89D4C3E40a41bbF638bC36",
  BRIDGE: "0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae",
} as const;

const TOKEN_DECIMALS = 18;
const POLLING_INTERVAL = 10000; // 10 seconds
const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const MIN_GAS_LIMIT = 200000;

// Types
interface Token {
  symbol: string;
  name: string;
  balance: string;
  logo: string;
  color: string;
  layer?: "L1" | "L2";
}

type BridgeOption = 'psdn' | 'eth';

// Token definitions
const PSDN_L1_TOKEN: Token = {
  symbol: "PSDN",
  name: "Poseidon L1",
  balance: "0",
  logo: "https://psdn.ai/icon.png?07720b992e581016",
  color: "bg-blue-500",
  layer: "L1",
};

const PSDN_L2_TOKEN: Token = {
  symbol: "PSDN",
  name: "Poseidon Subnet 0",
  balance: "0",
  logo: "https://psdn.ai/icon.png?07720b992e581016",
  color: "bg-purple-500",
  layer: "L2",
};

const ETH_L1_TOKEN: Token = {
  symbol: "ETH",
  name: "Ethereum L1",
  balance: "0",
  logo: "Ξ",
  color: "bg-gray-500",
  layer: "L1",
};

const ETH_L2_TOKEN: Token = {
  symbol: "ETH",
  name: "Ethereum Subnet 0",
  balance: "0",
  logo: "Ξ",
  color: "bg-gray-600",
  layer: "L2",
};

// Utility functions
const formatBalance = (balance: bigint | undefined): string => {
  if (!balance) return "0.00";
  const formatted = formatUnits(balance, TOKEN_DECIMALS);
  const parsed = parseFloat(formatted);
  return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
};

const formatBalanceFromValue = (balance: { value: bigint } | undefined): string => {
  if (!balance) return "0.00";
  return formatBalance(balance.value);
};

// Token helper functions
const getAvailableL1Tokens = (
  psdnBalance: bigint | undefined,
  ethBalance: { value: bigint } | undefined
): Token[] => [
  { ...PSDN_L1_TOKEN, balance: formatBalance(psdnBalance) },
  { ...ETH_L1_TOKEN, balance: formatBalanceFromValue(ethBalance) },
];

const getAvailableL2Tokens = (
  psdnL2Balance: bigint | undefined,
  ethL2Balance: { value: bigint } | undefined
): Token[] => [
  { ...PSDN_L2_TOKEN, balance: formatBalance(psdnL2Balance) },
  { ...ETH_L2_TOKEN, balance: formatBalanceFromValue(ethL2Balance) },
];

export function BridgeInterface() {
  // State
  const [fromToken, setFromToken] = useState<Token>(PSDN_L1_TOKEN);
  const [toToken, setToToken] = useState<Token>(PSDN_L2_TOKEN);
  const [fromAmount, setFromAmount] = useState("0");
  const [toAmount, setToAmount] = useState("0");
  const [bridgeOption, setBridgeOption] = useState<BridgeOption>('psdn');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);

  const { address } = useAccount();
  
  // Computed values
  const isL2ToL1 = fromToken.layer === 'L2';
  const isL1OnTop = fromToken.layer === 'L1';
  
  // Transaction hooks
  const { writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteMintPsdnApprove();
  const { writeContract: writeBridgeEth, isPending: isBridgeEthPending, error: bridgeEthError } = useWriteBridgeBridgeEthTo();
  const { writeContract: writeDepositErc20, isPending: isDepositErc20Pending, error: depositErc20Error } = useWriteBridgeDepositErc20To();

  // Update tokens when bridge option changes
  useEffect(() => {
    if (isL1OnTop) {
      if (bridgeOption === 'psdn') {
        setFromToken(PSDN_L1_TOKEN);
        setToToken(PSDN_L2_TOKEN);
      } else {
        setFromToken(ETH_L1_TOKEN);
        setToToken(ETH_L2_TOKEN);
      }
    }
  }, [bridgeOption, isL1OnTop]);
  
  // Balance hooks
  const { data: psdnBalance, refetch: refetchPsdnBalance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance } = useReadContract({
    address: CONTRACT_ADDRESSES.PSDN_L2,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: CHAIN_IDS.L2,
  });

  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
  });

  const { data: ethL2Balance, refetch: refetchEthL2Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L2,
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadMintPsdnAllowance({
    args: address ? [address, CONTRACT_ADDRESSES.BRIDGE] : undefined,
    query: { enabled: !!address },
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

  // Poll balances
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchEthBalance();
      refetchEthL2Balance();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance]);

  // Event handlers
  const handleSwap = useCallback(async () => {
    if (isSwapping) return;
    
    setIsSwapping(true);
    setShowCalculation(true);
    
    // Animate the swap with a delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Reset swap state
    setTimeout(() => {
      setIsSwapping(false);
      setShowCalculation(false);
    }, 600);
  }, [isSwapping, fromToken, toToken]);

  const handleFromAmountChange = useCallback((amount: string) => {
    setFromAmount(amount);
    
    // Simple conversion logic (1:1 for demo)
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount)) {
      setToAmount(numAmount.toFixed(2));
    } else {
      setToAmount("0");
    }
  }, []);

  const handleToAmountChange = useCallback((amount: string) => {
    setToAmount(amount);
    
    // Reverse conversion logic
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount)) {
      setFromAmount(numAmount.toFixed(2));
    } else {
      setFromAmount("0");
    }
  }, []);

  const handleFromAmountBlur = useCallback(() => {
    const numAmount = parseFloat(fromAmount);
    if (!isNaN(numAmount) && fromAmount !== '') {
      setFromAmount(numAmount.toFixed(2));
    }
  }, [fromAmount]);

  const handleToAmountBlur = useCallback(() => {
    const numAmount = parseFloat(toAmount);
    if (!isNaN(numAmount) && toAmount !== '') {
      setToAmount(numAmount.toFixed(2));
    }
  }, [toAmount]);

  const handleTokenSelect = useCallback((selectedToken: Token) => {
    // Get the correct balance based on token type and layer
    let balanceStr = "0.00";
    
    if (selectedToken.symbol === 'PSDN') {
      balanceStr = selectedToken.layer === 'L1' 
        ? formatBalance(psdnBalance)
        : formatBalance(psdnL2Balance);
    } else if (selectedToken.symbol === 'ETH') {
      balanceStr = selectedToken.layer === 'L1'
        ? formatBalanceFromValue(ethBalance)
        : formatBalanceFromValue(ethL2Balance);
    }
    
    const updatedFromToken = { ...selectedToken, balance: balanceStr };
    setFromToken(updatedFromToken);
    
    // Auto-update the toToken based on the selected fromToken
    if (selectedToken.layer === 'L1') {
      // If L1 is selected, set corresponding L2 token
      if (selectedToken.symbol === 'PSDN') {
        setToToken({ ...PSDN_L2_TOKEN, balance: formatBalance(psdnL2Balance) });
      } else if (selectedToken.symbol === 'ETH') {
        setToToken({ ...ETH_L2_TOKEN, balance: formatBalanceFromValue(ethL2Balance) });
      }
    } else {
      // If L2 is selected, set corresponding L1 token
      if (selectedToken.symbol === 'PSDN') {
        setToToken({ ...PSDN_L1_TOKEN, balance: formatBalance(psdnBalance) });
      } else if (selectedToken.symbol === 'ETH') {
        setToToken({ ...ETH_L1_TOKEN, balance: formatBalanceFromValue(ethBalance) });
      }
    }
    
    setIsTokenSelectorOpen(false);
  }, [psdnBalance, psdnL2Balance, ethBalance, ethL2Balance]);


  const handleTransact = useCallback(async () => {
    if (!address || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    try {
      const amount = parseUnits(fromAmount, TOKEN_DECIMALS);

      if (fromToken.symbol === 'ETH') {
        // For ETH, use bridgeEthTo call
        await writeBridgeEth({
          args: [address, MIN_GAS_LIMIT, "0x"],
          value: amount,
        });
      } else {
        // For PSDN, use the existing ERC20 flow
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
            "0x"
          ],
        });
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
  }, [address, fromAmount, fromToken.symbol, currentAllowance, writeBridgeEth, writeApprove, writeDepositErc20, refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance, refetchAllowance]);

  // Memoized values
  const availableTokens = useMemo(() => 
    isL1OnTop 
      ? getAvailableL1Tokens(psdnBalance, ethBalance)
      : getAvailableL2Tokens(psdnL2Balance, ethL2Balance),
    [isL1OnTop, psdnBalance, ethBalance, psdnL2Balance, ethL2Balance]
  );

  const isTransactionPending = useMemo(() => 
    isApprovePending || isBridgeEthPending || isDepositErc20Pending,
    [isApprovePending, isBridgeEthPending, isDepositErc20Pending]
  );

  const hasError = useMemo(() => 
    approveError || bridgeEthError || depositErc20Error,
    [approveError, bridgeEthError, depositErc20Error]
  );

  return (
    <div className="w-full max-w-md mx-auto p-2">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`bg-card text-card-foreground border rounded-2xl p-6 space-y-4 shadow-lg relative ${
          isL1OnTop 
            ? 'ring-2 ring-blue-400/80 ring-opacity-80 shadow-blue-400/30 shadow-2xl' 
            : 'ring-2 ring-purple-400/80 ring-opacity-80 shadow-purple-400/30 shadow-2xl'
        }`}
        style={{
          background: isL1OnTop 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)' 
            : 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          boxShadow: isL1OnTop 
            ? '0 0 60px rgba(59, 130, 246, 0.7), 0 0 120px rgba(147, 51, 234, 0.5), 0 0 180px rgba(59, 130, 246, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.3)' 
            : '0 0 60px rgba(147, 51, 234, 0.7), 0 0 120px rgba(59, 130, 246, 0.5), 0 0 180px rgba(147, 51, 234, 0.3), inset 0 0 40px rgba(147, 51, 234, 0.3)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Neon gradient border effect */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-0"
          style={{
            background: isL1OnTop 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)' 
              : 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
            borderRadius: '1rem',
            padding: '4px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            boxShadow: isL1OnTop 
              ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)' 
              : '0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(59, 130, 246, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        

        {/* Futuristic background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent pointer-events-none" />
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
                      {fromToken.layer}
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
            <ChevronDown className="h-5 w-5" />
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
                    {toToken.layer}
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
        <Button
          className="w-full mt-6"
          variant="outline"
          onClick={isL2ToL1 ? undefined : handleTransact}
          disabled={isL2ToL1 || !address || !fromAmount || parseFloat(fromAmount) <= 0 || isTransactionPending}
        >
          {isL2ToL1 ? "Disabled" : isTransactionPending ? "Processing..." : "Transact"}
        </Button>
        </div>


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
  );
}
