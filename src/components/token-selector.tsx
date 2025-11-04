"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Token {
  symbol: string;
  name: string;
  balance: string;
  logo: string;
  color: string;
  layer?: "L1" | "L2";
}

interface TokenSelectorProps {
  selectedToken: Token;
  onTokenSelect: (token: Token) => void;
  tokens: Token[];
  isOpen: boolean;
  onClose: () => void;
  title: string;
}


export function TokenSelector({ 
  selectedToken, 
  onTokenSelect, 
  tokens, 
  isOpen, 
  onClose, 
  title 
}: TokenSelectorProps) {
  const filteredTokens = tokens;

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Token List */}
          <div className="p-6">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredTokens.map((token, index) => (
                <button
                  key={index}
                  onClick={() => handleTokenSelect(token)}
                  className="group relative w-full flex items-center space-x-3 p-3 bg-gradient-to-br from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 rounded-xl transition-all duration-200 border border-white/5 hover:border-white/15 overflow-hidden"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className={`relative w-10 h-10 rounded-full ${token.color} flex items-center justify-center shadow-md`}>
                    {token.logo === 'psdn-svg' ? (
                      <svg viewBox="0 0 37 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                        <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                        <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                        <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
                      </svg>
                    ) : token.logo.startsWith('http') ? (
                      <img 
                        src={token.logo} 
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">{token.logo}</span>
                    )}
                  </div>
                  <div className="relative flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">{token.name}</span>
                      {token.layer && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          token.layer === 'L1' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {token.layer}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{token.symbol}</div>
                  </div>
                  {token.balance && (
                    <div className="relative text-right">
                      <div className="text-sm font-semibold text-foreground tabular-nums">{token.balance}</div>
                      <div className="text-[10px] text-muted-foreground">Available</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

