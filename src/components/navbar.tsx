"use client";

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import Image from 'next/image';
import { CHAIN_IDS } from '@/lib/constants';

interface NavbarProps {
  currentView?: 'bridge' | 'mint' | 'stake';
  onViewChange?: (view: 'bridge' | 'mint' | 'stake') => void;
}

// Component to display wallet balances - hooks must be called at component level
function WalletBalances({ address }: { address: `0x${string}` }) {
  const { data: l1Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { data: l2Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L2,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 10) return num.toFixed(3);
    return num.toFixed(2);
  };

  return (
    <>
      {/* L1 Balance */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">L1</span>
        <span className="text-sm text-white font-semibold tabular-nums">
          {l1Balance ? formatBalance(formatUnits(l1Balance.value, 18)) : '0'}
        </span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-white/20" />
      
      {/* L2 Balance */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">L2</span>
        <span className="text-sm text-white font-semibold tabular-nums">
          {l2Balance ? formatBalance(formatUnits(l2Balance.value, 18)) : '0'}
        </span>
      </div>
    </>
  );
}

// Component for mobile wallet balances
function MobileWalletBalances({ address }: { address: `0x${string}` }) {
  const { data: l1Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L1,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { data: l2Balance } = useBalance({
    address,
    chainId: CHAIN_IDS.L2,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 10) return num.toFixed(3);
    return num.toFixed(2);
  };

  return (
    <div className="relative grid grid-cols-2 gap-3">
      {/* L1 Balance */}
      <div className="flex flex-col items-center gap-1 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
        <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">L1</span>
        <span className="text-base text-white font-semibold tabular-nums">
          {l1Balance ? formatBalance(formatUnits(l1Balance.value, 18)) : '0'}
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase">IP</span>
      </div>
      
      {/* L2 Balance */}
      <div className="flex flex-col items-center gap-1 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
        <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">L2</span>
        <span className="text-base text-white font-semibold tabular-nums">
          {l2Balance ? formatBalance(formatUnits(l2Balance.value, 18)) : '0'}
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase">IP</span>
      </div>
    </div>
  );
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
            <a href="https://psdn.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 group">
              <svg viewBox="0 0 155 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-7 text-white">
                <path d="M49.5782 5.96152C51.8236 5.96152 53.5769 6.48225 54.8381 7.52372C56.0993 8.55562 56.7299 10.0605 56.7299 12.0383C56.7299 13.4046 56.4385 14.556 55.8557 15.4923C55.2729 16.4191 54.4464 17.1166 53.3762 17.5848C52.3157 18.053 51.064 18.2871 49.6212 18.2871H45.4363L45.5223 25.7398C45.5223 25.9309 45.4315 26.0264 45.25 26.0264H43.0285C42.847 26.0264 42.7562 25.9309 42.7562 25.7398L42.8708 15.7217L42.7562 6.24816C42.7562 6.05707 42.847 5.96152 43.0285 5.96152H49.5782ZM49.7789 16.2949C51.1452 16.2949 52.2058 15.9605 52.9606 15.2917C53.725 14.6133 54.1072 13.5432 54.1072 12.0813C54.1072 10.7054 53.725 9.6783 52.9606 8.99992C52.1962 8.31198 51.0974 7.96801 49.6642 7.96801H45.4936L45.4076 15.6643V16.2949H49.7789ZM64.5284 26.356C63.057 26.356 61.7957 26.0407 60.7447 25.4101C59.6937 24.7795 58.8911 23.8862 58.3369 22.73C57.7923 21.5739 57.52 20.2219 57.52 18.6741C57.52 17.1262 57.7923 15.7694 58.3369 14.6038C58.8911 13.4381 59.6937 12.5352 60.7447 11.895C61.7957 11.2548 63.057 10.9347 64.5284 10.9347C65.9998 10.9347 67.261 11.2501 68.312 11.8807C69.3631 12.5113 70.1609 13.4094 70.7055 14.5751C71.2501 15.7312 71.5224 17.0832 71.5224 18.6311C71.5224 20.1885 71.2501 21.55 70.7055 22.7157C70.1609 23.8718 69.3631 24.77 68.312 25.4101C67.261 26.0407 65.9998 26.356 64.5284 26.356ZM64.5284 24.5359C65.9616 24.5359 67.0317 24.0343 67.7388 23.031C68.4554 22.0278 68.8137 20.5754 68.8137 18.6741C68.8137 16.7822 68.4506 15.3251 67.7244 14.3028C67.0078 13.2709 65.9377 12.7549 64.5141 12.7549C63.0904 12.7645 62.0155 13.2804 61.2893 14.3028C60.5632 15.3251 60.2001 16.787 60.2001 18.6884C60.2001 20.5802 60.5632 22.0278 61.2893 23.031C62.025 24.0343 63.1047 24.5359 64.5284 24.5359ZM79.6342 26.3417C77.6468 26.3417 76.0607 25.9022 74.8759 25.0232C73.6911 24.1441 73.0653 22.859 72.9984 21.1678C72.9984 20.9863 73.0892 20.8955 73.2707 20.8955H75.2629C75.4444 20.8955 75.5352 20.9863 75.5352 21.1678C75.5925 22.3431 75.9651 23.2125 76.6531 23.7763C77.341 24.34 78.3443 24.6219 79.6628 24.6219C80.7712 24.6219 81.6502 24.3926 82.2999 23.9339C82.9592 23.4753 83.2888 22.8304 83.2888 21.9991C83.2888 21.4354 83.1025 20.9959 82.7299 20.6805C82.3572 20.3557 81.8938 20.1168 81.3397 19.9639C80.7855 19.8111 80.0211 19.6486 79.0465 19.4767C77.8235 19.2665 76.8298 19.0467 76.0655 18.8174C75.3106 18.5785 74.6657 18.1772 74.1306 17.6135C73.5956 17.0498 73.328 16.2615 73.328 15.2487C73.328 14.3314 73.5669 13.5527 74.0446 12.9126C74.5319 12.2629 75.2103 11.7756 76.0798 11.4507C76.9588 11.1163 77.986 10.9491 79.1612 10.9491C80.9384 10.9491 82.3811 11.3265 83.4895 12.0813C84.5978 12.8266 85.2045 13.9349 85.3096 15.4063V15.435C85.3096 15.521 85.2858 15.5879 85.238 15.6357C85.1902 15.6739 85.1233 15.693 85.0373 15.693H83.1312C82.9496 15.693 82.8541 15.6022 82.8445 15.4207C82.749 14.4939 82.3764 13.8012 81.7266 13.3425C81.0865 12.8744 80.2218 12.6403 79.1325 12.6403C78.1006 12.6403 77.2932 12.8457 76.7104 13.2565C76.1276 13.6674 75.8362 14.2789 75.8362 15.091C75.8362 15.607 76.0129 16.0131 76.3664 16.3093C76.72 16.5959 77.1595 16.8109 77.685 16.9542C78.2201 17.088 78.9558 17.2313 79.8921 17.3842C81.1534 17.5848 82.1709 17.8094 82.9449 18.0578C83.7283 18.2966 84.3972 18.7123 84.9513 19.3047C85.5151 19.8971 85.7969 20.7331 85.7969 21.8128C85.7969 22.7396 85.5294 23.547 84.9943 24.2349C84.4593 24.9228 83.7236 25.4483 82.7872 25.8114C81.8508 26.165 80.7998 26.3417 79.6342 26.3417ZM90.0672 18.9607C90.1532 22.6775 91.6294 24.5359 94.4958 24.5359C95.5755 24.5359 96.4402 24.2492 97.0899 23.676C97.7492 23.0931 98.1887 22.2523 98.4085 21.1535C98.4563 20.9815 98.5614 20.8955 98.7238 20.8955H100.673C100.768 20.8955 100.84 20.9194 100.888 20.9672C100.936 21.0054 100.955 21.0627 100.945 21.1392C100.792 22.1711 100.439 23.0788 99.8847 23.8623C99.3401 24.6458 98.6091 25.2573 97.6919 25.6968C96.7746 26.1363 95.6997 26.356 94.4672 26.356C92.9671 26.356 91.6867 26.036 90.6262 25.3958C89.5656 24.7556 88.763 23.8575 88.2184 22.7014C87.6833 21.5453 87.4158 20.2076 87.4158 18.6884C87.4158 17.1501 87.6881 15.7981 88.2327 14.6324C88.7869 13.4667 89.5847 12.559 90.6262 11.9093C91.6676 11.2596 92.9002 10.9347 94.3238 10.9347C95.7379 10.9347 96.9514 11.2453 97.9642 11.8663C98.9865 12.4778 99.77 13.3616 100.315 14.5178C100.869 15.6739 101.16 17.0593 101.189 18.6741C101.189 18.8652 101.098 18.9607 100.917 18.9607H90.0672ZM94.3382 12.7406C93.1247 12.7406 92.1645 13.1276 91.4574 13.9015C90.7599 14.6754 90.3252 15.7742 90.1532 17.1979H98.3655C98.3368 16.3666 98.1648 15.6166 97.8495 14.9477C97.5438 14.2693 97.0899 13.7343 96.488 13.3425C95.8956 12.9412 95.179 12.7406 94.3382 12.7406ZM103.771 26.0264C103.58 26.0264 103.484 25.9309 103.484 25.7398L103.57 18.4018L103.484 11.551C103.484 11.3599 103.58 11.2644 103.771 11.2644H105.921C106.102 11.2644 106.193 11.3599 106.193 11.551L106.107 18.4018L106.193 25.7398C106.193 25.9309 106.102 26.0264 105.921 26.0264H103.771ZM103.814 9.47288C103.623 9.47288 103.527 9.38211 103.527 9.20057V6.99343C103.527 6.90744 103.551 6.84055 103.599 6.79278C103.656 6.74501 103.728 6.72112 103.814 6.72112H105.907C105.993 6.72112 106.059 6.74501 106.107 6.79278C106.165 6.84055 106.193 6.90744 106.193 6.99343V9.20057C106.193 9.28656 106.165 9.35344 106.107 9.40122C106.059 9.44899 105.993 9.47288 105.907 9.47288H103.814ZM121.836 14.8044L121.922 25.7398C121.922 25.9309 121.832 26.0264 121.65 26.0264H119.558C119.367 26.0264 119.271 25.9309 119.271 25.7398L119.343 23.5183C118.855 24.4069 118.21 25.0948 117.408 25.5821C116.605 26.0694 115.678 26.3131 114.627 26.3131C113.338 26.3131 112.234 25.9834 111.317 25.3241C110.399 24.6553 109.702 23.7428 109.224 22.5867C108.756 21.4306 108.522 20.1264 108.522 18.6741C108.522 17.2409 108.766 15.9414 109.253 14.7757C109.75 13.6005 110.462 12.6737 111.388 11.9953C112.315 11.3074 113.409 10.9634 114.67 10.9634C115.712 10.9634 116.62 11.1879 117.394 11.637C118.177 12.0765 118.812 12.7263 119.3 13.5862L119.242 6.24816C119.242 6.05707 119.338 5.96152 119.529 5.96152H121.65C121.832 5.96152 121.922 6.05707 121.922 6.24816L121.836 14.8044ZM115.258 24.5072C116.558 24.5072 117.575 24.0151 118.311 23.031C119.047 22.0469 119.414 20.5946 119.414 18.6741C119.414 16.7918 119.051 15.3347 118.325 14.3028C117.609 13.2709 116.596 12.7549 115.287 12.7549C113.93 12.7549 112.903 13.2756 112.205 14.3171C111.517 15.3586 111.173 16.7536 111.173 18.5021C111.173 20.3366 111.517 21.7985 112.205 22.8877C112.903 23.9674 113.92 24.5072 115.258 24.5072ZM131.15 26.356C129.679 26.356 128.417 26.0407 127.366 25.4101C126.315 24.7795 125.513 23.8862 124.959 22.73C124.414 21.5739 124.142 20.2219 124.142 18.6741C124.142 17.1262 124.414 15.7694 124.959 14.6038C125.513 13.4381 126.315 12.5352 127.366 11.895C128.417 11.2548 129.679 10.9347 131.15 10.9347C132.622 10.9347 133.883 11.2501 134.934 11.8807C135.985 12.5113 136.783 13.4094 137.327 14.5751C137.872 15.7312 138.144 17.0832 138.144 18.6311C138.144 20.1885 137.872 21.55 137.327 22.7157C136.783 23.8718 135.985 24.77 134.934 25.4101C133.883 26.0407 132.622 26.356 131.15 26.356ZM131.15 24.5359C132.583 24.5359 133.653 24.0343 134.36 23.031C135.077 22.0278 135.435 20.5754 135.435 18.6741C135.435 16.7822 135.072 15.3251 134.346 14.3028C133.63 13.2709 132.559 12.7549 131.136 12.7549C129.712 12.7645 128.637 13.2804 127.911 14.3028C127.185 15.3251 126.822 16.787 126.822 18.6884C126.822 20.5802 127.185 22.0278 127.911 23.031C128.647 24.0343 129.726 24.5359 131.15 24.5359ZM152.731 19.7203L152.788 25.7398C152.788 25.9309 152.697 26.0264 152.516 26.0264H150.409C150.218 26.0264 150.122 25.9309 150.122 25.7398L150.194 19.7203V16.8969C150.194 15.5688 149.912 14.5751 149.348 13.9158C148.784 13.247 148.025 12.9126 147.069 12.9126C146.085 12.9126 145.23 13.2995 144.504 14.0735C143.787 14.8474 143.286 15.9414 142.999 17.3555V19.7203L143.042 25.7398C143.042 25.9309 142.951 26.0264 142.77 26.0264H140.634C140.443 26.0264 140.348 25.9309 140.348 25.7398L140.448 19.319L140.376 11.551C140.376 11.3599 140.472 11.2644 140.663 11.2644H142.655C142.846 11.2644 142.942 11.3599 142.942 11.551L142.87 13.8442C143.377 13.0033 144.045 12.3058 144.877 11.7517C145.717 11.1975 146.687 10.9204 147.786 10.9204C149.334 10.9204 150.543 11.422 151.412 12.4253C152.291 13.4285 152.731 14.8856 152.731 16.7966V19.7203Z" fill="currentColor"/>
                <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                <path d="M9.49163 10.3924L9.8969 14.2651C10.1629 16.8048 12.1699 18.8117 14.7095 19.0777L18.5823 19.483L14.7095 19.8882C12.1699 20.1543 10.1629 22.1612 9.8969 24.7008L9.49163 28.5736L9.08637 24.7008C8.82036 22.1612 6.81341 20.1543 4.2738 19.8882L0.400391 19.4836L4.27318 19.0783C6.81278 18.8123 8.81974 16.8054 9.08575 14.2658L9.49163 10.3924Z" fill="currentColor"/>
                <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                <path d="M18.5639 1.38114L18.9692 5.25393C19.2352 7.79353 21.2421 9.80048 23.7817 10.0665L27.6545 10.4718L23.7817 10.877C21.2421 11.143 19.2352 13.15 18.9692 15.6896L18.5639 19.5624L18.1586 15.6896C17.8926 13.15 15.8857 11.143 13.3461 10.877L9.47266 10.4724L13.3454 10.0671C15.885 9.80111 17.892 7.79415 18.158 5.25455L18.5639 1.38114Z" fill="currentColor"/>
                <path d="M27.5287 10.392L27.934 14.2648C28.2 16.8044 30.207 18.8113 32.7466 19.0773L36.6194 19.4826L32.7466 19.8879C30.207 20.1539 28.2 22.1608 27.934 24.7004L27.5287 28.5732L27.1235 24.7004C26.8575 22.1608 24.8505 20.1539 22.3109 19.8879L18.4375 19.4832L22.3103 19.078C24.8499 18.812 26.8568 16.805 27.1229 14.2654L27.5287 10.392Z" fill="currentColor"/>
              </svg>
            </a>
            
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
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="relative px-5 py-2.5 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm border border-white/10 hover:border-white/20 overflow-hidden group"
                            >
                              <span className="relative z-10">Connect Wallet</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-300 hover:text-red-200 rounded-xl font-semibold transition-all duration-200 border border-red-500/30 shadow-lg text-sm"
                            >
                              Wrong Network
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-3">
                            {/* Chain Selector - Compact */}
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 18,
                                    height: 18,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <Image
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      width={18}
                                      height={18}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="text-white text-xs font-medium">{chain.name}</span>
                            </button>

                            {/* Wallet Info - Sleek Combined Design */}
                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="group relative flex items-center gap-3 pl-4 pr-3 py-2 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl overflow-hidden"
                            >
                              {/* Subtle gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Balances */}
                              <div className="relative flex items-center gap-3">
                                {account?.address && <WalletBalances address={account.address as `0x${string}`} />}
                                
                                {/* IP Badge */}
                                <div className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-bold text-gray-300 uppercase tracking-wide">
                                  IP
                                </div>
                              </div>
                              
                              {/* Separator */}
                              <div className="relative w-px h-6 bg-white/20" />
                              
                              {/* Address Badge */}
                              <div className="relative flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-white font-mono">
                                  {account.displayName}
                                </span>
                              </div>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
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
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="relative w-full px-5 py-3 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm border border-white/10 hover:border-white/20 overflow-hidden group"
                            >
                              <span className="relative z-10">Connect Wallet</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="w-full px-5 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-300 hover:text-red-200 rounded-xl font-semibold transition-all duration-200 border border-red-500/30 shadow-lg text-sm"
                            >
                              Wrong Network
                            </button>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-3">
                            {/* Chain Selector - Mobile */}
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 shadow-lg"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <Image
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      width={20}
                                      height={20}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="text-white text-sm font-medium">{chain.name}</span>
                            </button>

                            {/* Wallet Info - Mobile */}
                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="relative flex flex-col gap-3 px-4 py-3 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 shadow-lg overflow-hidden"
                            >
                              {/* Subtle gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-50" />
                              
                              {/* Balances Grid */}
                              {account?.address && (
                                <div className="relative">
                                  <MobileWalletBalances address={account.address as `0x${string}`} />
                                </div>
                              )}
                              
                              {/* Address */}
                              <div className="relative flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-sm text-white font-mono">
                                  {account.displayName}
                                </span>
                              </div>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

