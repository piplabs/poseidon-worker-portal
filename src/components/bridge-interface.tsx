"use client";

import { useState, useEffect } from "react";
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

interface Token {
  symbol: string;
  name: string;
  balance: string;
  logo: string;
  color: string;
  layer?: string;
}

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

// This will be updated dynamically with current balances
const getAvailableL1Tokens = (
  psdnBalance: bigint | undefined,
  ethBalance: { value: bigint } | undefined
): Token[] => {
  const psdnBalanceStr = psdnBalance ? formatUnits(psdnBalance, 18) : "0.00";
  const ethBalanceStr = ethBalance ? formatUnits(ethBalance.value, 18) : "0.00";
  
  const psdnBalanceFormatted = isNaN(parseFloat(psdnBalanceStr)) ? "0.00" : parseFloat(psdnBalanceStr).toFixed(2);
  const ethBalanceFormatted = isNaN(parseFloat(ethBalanceStr)) ? "0.00" : parseFloat(ethBalanceStr).toFixed(2);
  
  return [
    { ...PSDN_L1_TOKEN, balance: psdnBalanceFormatted },
    { ...ETH_L1_TOKEN, balance: ethBalanceFormatted },
  ];
};

// Get available L2 tokens with current balances
const getAvailableL2Tokens = (
  psdnL2Balance: bigint | undefined,
  ethL2Balance: { value: bigint } | undefined
): Token[] => {
  const psdnL2BalanceStr = psdnL2Balance ? formatUnits(psdnL2Balance, 18) : "0.00";
  const ethL2BalanceStr = ethL2Balance ? formatUnits(ethL2Balance.value, 18) : "0.00";
  
  const psdnL2BalanceFormatted = isNaN(parseFloat(psdnL2BalanceStr)) ? "0.00" : parseFloat(psdnL2BalanceStr).toFixed(2);
  const ethL2BalanceFormatted = isNaN(parseFloat(ethL2BalanceStr)) ? "0.00" : parseFloat(ethL2BalanceStr).toFixed(2);
  
  return [
    { ...PSDN_L2_TOKEN, balance: psdnL2BalanceFormatted },
    { ...ETH_L2_TOKEN, balance: ethL2BalanceFormatted },
  ];
};

export function BridgeInterface() {
  const [fromToken, setFromToken] = useState<Token>(PSDN_L1_TOKEN);
  const [toToken, setToToken] = useState<Token>(PSDN_L2_TOKEN);
  const [fromAmount, setFromAmount] = useState("0");
  const [toAmount, setToAmount] = useState("0");
  const [bridgeOption, setBridgeOption] = useState<'psdn' | 'eth'>('psdn');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);

  const { address } = useAccount();
  
  // Write hooks for transactions
  const { writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteMintPsdnApprove();
  const { writeContract: writeBridgeEth, isPending: isBridgeEthPending, error: bridgeEthError } = useWriteBridgeBridgeEthTo();
  const { writeContract: writeDepositErc20, isPending: isDepositErc20Pending, error: depositErc20Error } = useWriteBridgeDepositErc20To();
  
  // Check if Subnet 0 is on top (Subnet 0 -> L1 direction)
  const isL2ToL1 = fromToken.layer === 'L2';
  const isL1OnTop = fromToken.layer === 'L1';

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
  
  // Read PSDN token balance
  const { data: psdnBalance, refetch: refetchPsdnBalance } = useReadMintPsdnBalanceOf({
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read L2 PSDN token balance (keeping raw call for L2 chain)
  const { data: psdnL2Balance, refetch: refetchPsdnL2Balance } = useReadContract({
    address: "0x30f627A3de293d408E89D4C3E40a41bbF638bC36",
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
    query: {
      enabled: !!address,
    },
    chainId: 11711, // L2 chain ID
  });

  // Read ETH balance (native token) for L1
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
    chainId: 1518, // L1 chain ID
  });

  // Read ETH balance for L2 (Subnet 0)
  const { data: ethL2Balance, refetch: refetchEthL2Balance } = useBalance({
    address: address,
    chainId: 11711, // L2 chain ID
  });

  // Read current allowance for bridge contract
  const { data: currentAllowance, refetch: refetchAllowance } = useReadMintPsdnAllowance({
    args: address ? [address, "0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae"] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Update PSDN L1 token balance when balance changes
  useEffect(() => {
    if (psdnBalance !== undefined) {
      const formattedBalance = formatUnits(psdnBalance, 18);
      const balance = parseFloat(formattedBalance);
      setFromToken(prev => ({
        ...prev,
        balance: isNaN(balance) ? "0.00" : balance.toFixed(2)
      }));
    }
  }, [psdnBalance]);

  // Update PSDN L2 token balance when balance changes
  useEffect(() => {
    if (psdnL2Balance !== undefined) {
      const formattedBalance = formatUnits(psdnL2Balance, 18);
      const balance = parseFloat(formattedBalance);
      setToToken(prev => ({
        ...prev,
        balance: isNaN(balance) ? "0.00" : balance.toFixed(2)
      }));
    }
  }, [psdnL2Balance]);

  // Update ETH token balance when balance changes
  useEffect(() => {
    if (ethBalance !== undefined) {
      const formattedBalance = formatUnits(ethBalance.value, 18);
      const balance = parseFloat(formattedBalance);
      const balanceStr = isNaN(balance) ? "0.00" : balance.toFixed(2);
      
      // Update the current fromToken if it's ETH
      setFromToken(prev => prev.symbol === 'ETH' ? {
        ...prev,
        balance: balanceStr
      } : prev);
    }
  }, [ethBalance]);

  // Update ETH L2 token balance when balance changes
  useEffect(() => {
    if (ethL2Balance !== undefined) {
      const formattedBalance = formatUnits(ethL2Balance.value, 18);
      const balance = parseFloat(formattedBalance);
      const balanceStr = isNaN(balance) ? "0.00" : balance.toFixed(2);
      
      // Update the toToken if it's ETH L2
      setToToken(prev => prev.symbol === 'ETH' && prev.layer === 'L2' ? {
        ...prev,
        balance: balanceStr
      } : prev);
    }
  }, [ethL2Balance]);

  // Poll balances every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch all balances
      refetchPsdnBalance();
      refetchPsdnL2Balance();
      refetchEthBalance();
      refetchEthL2Balance();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [refetchPsdnBalance, refetchPsdnL2Balance, refetchEthBalance, refetchEthL2Balance]);

  const handleSwap = async () => {
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
  };

  const handleFromAmountChange = (amount: string) => {
    setFromAmount(amount);
    
    // Simple conversion logic (1 PSDN = 1 UNKNOWN for demo)
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount)) {
      const convertedAmount = (numAmount * 1).toFixed(2);
      setToAmount(convertedAmount);
    } else {
      setToAmount("0");
    }
  };

  const handleToAmountChange = (amount: string) => {
    setToAmount(amount);
    
    // Reverse conversion logic
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount)) {
      const convertedAmount = (numAmount / 1).toFixed(2);
      setFromAmount(convertedAmount);
    } else {
      setFromAmount("0");
    }
  };

  const handleFromAmountBlur = () => {
    const numAmount = parseFloat(fromAmount);
    if (!isNaN(numAmount) && fromAmount !== '') {
      setFromAmount(numAmount.toFixed(2));
    }
  };

  const handleToAmountBlur = () => {
    const numAmount = parseFloat(toAmount);
    if (!isNaN(numAmount) && toAmount !== '') {
      setToAmount(numAmount.toFixed(2));
    }
  };

  const handleTokenSelect = (selectedToken: Token) => {
    // Update the fromToken with the current balance
    const updatedFromToken = { ...selectedToken };
    
    // Get the correct balance based on token type and layer
    if (selectedToken.symbol === 'PSDN') {
      if (selectedToken.layer === 'L1') {
        const balanceStr = psdnBalance ? formatUnits(psdnBalance, 18) : "0.00";
        const balance = parseFloat(balanceStr);
        updatedFromToken.balance = isNaN(balance) ? "0.00" : balance.toFixed(2);
      } else {
        const balanceStr = psdnL2Balance ? formatUnits(psdnL2Balance, 18) : "0.00";
        const balance = parseFloat(balanceStr);
        updatedFromToken.balance = isNaN(balance) ? "0.00" : balance.toFixed(2);
      }
    } else if (selectedToken.symbol === 'ETH') {
      if (selectedToken.layer === 'L1') {
        const balanceStr = ethBalance ? formatUnits(ethBalance.value, 18) : "0.00";
        const balance = parseFloat(balanceStr);
        updatedFromToken.balance = isNaN(balance) ? "0.00" : balance.toFixed(2);
      } else {
        const balanceStr = ethL2Balance ? formatUnits(ethL2Balance.value, 18) : "0.00";
        const balance = parseFloat(balanceStr);
        updatedFromToken.balance = isNaN(balance) ? "0.00" : balance.toFixed(2);
      }
    }
    
    setFromToken(updatedFromToken);
    
    // Auto-update the toToken based on the selected fromToken
    if (selectedToken.layer === 'L1') {
      // If L1 is selected, set corresponding L2 token
      if (selectedToken.symbol === 'PSDN') {
        const l2BalanceStr = psdnL2Balance ? formatUnits(psdnL2Balance, 18) : "0.00";
        const l2Balance = parseFloat(l2BalanceStr);
        setToToken({ ...PSDN_L2_TOKEN, balance: isNaN(l2Balance) ? "0.00" : l2Balance.toFixed(2) });
      } else if (selectedToken.symbol === 'ETH') {
        const l2BalanceStr = ethL2Balance ? formatUnits(ethL2Balance.value, 18) : "0.00";
        const l2Balance = parseFloat(l2BalanceStr);
        setToToken({ ...ETH_L2_TOKEN, balance: isNaN(l2Balance) ? "0.00" : l2Balance.toFixed(2) });
      }
    } else {
      // If L2 is selected, set corresponding L1 token
      if (selectedToken.symbol === 'PSDN') {
        const l1BalanceStr = psdnBalance ? formatUnits(psdnBalance, 18) : "0.00";
        const l1Balance = parseFloat(l1BalanceStr);
        setToToken({ ...PSDN_L1_TOKEN, balance: isNaN(l1Balance) ? "0.00" : l1Balance.toFixed(2) });
      } else if (selectedToken.symbol === 'ETH') {
        const l1BalanceStr = ethBalance ? formatUnits(ethBalance.value, 18) : "0.00";
        const l1Balance = parseFloat(l1BalanceStr);
        setToToken({ ...ETH_L1_TOKEN, balance: isNaN(l1Balance) ? "0.00" : l1Balance.toFixed(2) });
      }
    }
    
    setIsTokenSelectorOpen(false);
  };


  const handleTransact = async () => {
    if (!address || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    try {
      const amount = parseUnits(fromAmount, 18);

      if (fromToken.symbol === 'ETH') {
        // For ETH, use bridgeEthTo call
        await writeBridgeEth({
          args: [
            address, // recipient address
            200000, // min gas limit
            "0x" // extra data (empty)
          ],
          value: amount, // ETH amount to deposit
        });

        // Refresh ETH balance after successful transaction
        refetchPsdnBalance();
        refetchPsdnL2Balance();
        refetchEthBalance();
        refetchEthL2Balance();
      } else {
        // For PSDN, use the existing ERC20 flow
        // Check if we need to approve first
        const needsApproval = !currentAllowance || currentAllowance < amount;
        
        if (needsApproval) {
          // Approve max amount to avoid future approvals
          await writeApprove({
            args: ["0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae", BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")], // Max uint256
          });
          
          // Refresh allowance after approval
          refetchAllowance();
        }
        
        // Then call depositERC20To on the Bridge contract
        await writeDepositErc20({
          args: [
            "0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46", // L1 token (PSDN)
            "0x30f627A3de293d408E89D4C3E40a41bbF638bC36", // L2 token (PSDN Subnet 0)
            address, // recipient address
            amount, // amount to deposit
            200000, // min gas limit
            "0x" // extra data (empty)
          ],
        });
        
        // Refresh balance and allowance after successful transaction
        refetchPsdnBalance();
        refetchPsdnL2Balance();
        refetchEthBalance();
        refetchEthL2Balance();
        refetchAllowance();
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

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
          disabled={isL2ToL1 || !address || !fromAmount || parseFloat(fromAmount) <= 0 || isApprovePending || isBridgeEthPending || isDepositErc20Pending}
        >
          {isL2ToL1 ? "Disabled" : (isApprovePending || isBridgeEthPending || isDepositErc20Pending) ? "Processing..." : "Transact"}
        </Button>
        </div>


        {/* Error Display */}
        {(approveError || bridgeEthError || depositErc20Error) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg relative z-10">
            <p className="text-destructive text-sm font-medium">
              Error: {(approveError || bridgeEthError || depositErc20Error)?.message}
            </p>
          </div>
        )}

        {/* Token Selector */}
        <TokenSelector
          selectedToken={fromToken}
          onTokenSelect={handleTokenSelect}
          tokens={isL1OnTop 
            ? getAvailableL1Tokens(psdnBalance, ethBalance)
            : getAvailableL2Tokens(psdnL2Balance, ethL2Balance)
          }
          isOpen={isTokenSelectorOpen}
          onClose={() => setIsTokenSelectorOpen(false)}
          title="Select a token"
        />
      </motion.div>
    </div>
  );
}
