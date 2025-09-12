"use client";

import { useState } from "react";
import { BridgeInterface } from "@/components/bridge-interface";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";
import { useWriteMintPsdnMint } from "@/generated";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { motion } from "framer-motion";

export default function Home() {
  const [currentView, setCurrentView] = useState<'bridge' | 'mint'>('bridge');
  const [mintAmount, setMintAmount] = useState("100");

  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, error } = useWriteMintPsdnMint();

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

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative">
      {/* Connect Button in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ConnectButton />
      </div>

      {/* Navigation Button */}
      <div className="absolute top-4 left-4 z-10">
        {currentView === 'bridge' ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setCurrentView('mint')}
          >
            <Coins className="h-4 w-4" />
            <span>Mint PSDN</span>
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setCurrentView('bridge')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Bridge</span>
          </Button>
        )}
      </div>
      
      {/* Content based on current view */}
      {currentView === 'bridge' ? (
        <BridgeInterface />
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

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={!address || isPending || !mintAmount}
                className="w-full mt-6"
                variant="outline"
              >
                {isPending ? "Minting..." : isSuccess ? "Minted!" : "Mint"}
              </Button>

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
  );
}