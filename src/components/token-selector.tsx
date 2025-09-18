"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ChevronDown } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {/* Search */}
          <div className="p-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tokens"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
          </div>


          {/* Token List */}
          <div className="px-6 pb-6">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredTokens.map((token, index) => (
                <button
                  key={index}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    {token.logo.startsWith('http') ? (
                      <img 
                        src={token.logo} 
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">{token.logo}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{token.name}</span>
                      {token.layer && (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          token.layer === 'L1' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {token.layer}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{token.symbol}</div>
                  </div>
                  {token.balance && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{token.balance}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
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

interface TokenButtonProps {
  token: Token;
  onClick: () => void;
  disabled?: boolean;
}

export function TokenButton({ token, onClick, disabled }: TokenButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center space-x-3 px-4 py-3 bg-background/50 border border-input/20 rounded-lg hover:bg-background/80 hover:border-input/40 transition-all duration-200"
    >
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
        {token.logo.startsWith('http') ? (
          <img 
            src={token.logo} 
            alt={token.symbol}
            className="w-4 h-4 rounded-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-xs">{token.logo}</span>
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-foreground">{token.symbol}</div>
        <div className="text-xs text-muted-foreground">{token.name}</div>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
