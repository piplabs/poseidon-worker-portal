"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { psdnDevnet, psdnL2Devnet } from "@/lib/chains";
import { PendingTransactionsProvider } from "@/contexts/PendingTransactionsContext";

const walletConnectProjectId = "00000000000000000000000000000000";

const config = getDefaultConfig({
  appName: "PSDN Bridge",
  projectId: walletConnectProjectId,
  chains: [psdnDevnet, psdnL2Devnet],
  ssr: true, 
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <PendingTransactionsProvider>
            {children}
          </PendingTransactionsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
