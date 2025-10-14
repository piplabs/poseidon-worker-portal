"use client";

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";

interface NavbarProps {
  currentView?: 'bridge' | 'mint' | 'stake';
  onViewChange?: (view: 'bridge' | 'mint' | 'stake') => void;
}

export function Navbar({ currentView = 'bridge', onViewChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleViewChange = (view: 'bridge' | 'mint' | 'stake') => {
    onViewChange?.(view);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center space-x-2 group">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="text-xl font-normal text-white tracking-tight">
                Poseidon
              </span>
            </Link>
            
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => handleViewChange('bridge')}
                className={`text-sm font-normal transition-colors ${
                  currentView === 'bridge' 
                    ? 'text-white border-b-2 border-white pb-1' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Bridge
              </button>
              <button
                onClick={() => handleViewChange('stake')}
                className={`text-sm font-normal transition-colors ${
                  currentView === 'stake' 
                    ? 'text-white border-b-2 border-white pb-1' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Stake
              </button>
              <button
                onClick={() => handleViewChange('mint')}
                className={`text-sm font-normal transition-colors ${
                  currentView === 'mint' 
                    ? 'text-white border-b-2 border-white pb-1' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Faucet
              </button>
            </div>
          </div>

          {/* Right side - Connect Wallet & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-white/10">
            <button
              onClick={() => handleViewChange('bridge')}
              className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                currentView === 'bridge' 
                  ? 'text-white bg-white/10' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Bridge
            </button>
            <button
              onClick={() => handleViewChange('stake')}
              className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                currentView === 'stake' 
                  ? 'text-white bg-white/10' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => handleViewChange('mint')}
              className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                currentView === 'mint' 
                  ? 'text-white bg-white/10' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Faucet
            </button>
            <div className="sm:hidden pt-2 px-4">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

