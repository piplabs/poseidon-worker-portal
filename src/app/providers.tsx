"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { psdnDevnet, psdnL2Devnet } from "@/lib/chains";

// Use a safe fallback WalletConnect projectId to avoid build-time errors if env is missing.
// Replace with a real WalletConnect Cloud projectId via NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID for production.
const walletConnectProjectId =
  (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string | undefined) ||
  "00000000000000000000000000000000";

const config = getDefaultConfig({
  appName: "Bridge v1 - Story & Poseidon",
  projectId: walletConnectProjectId,
  chains: [psdnDevnet, psdnL2Devnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
