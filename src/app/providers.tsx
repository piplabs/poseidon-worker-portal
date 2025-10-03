"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { psdnDevnet, psdnL2Devnet } from "@/lib/chains";

const walletConnectProjectId = "d2cd825c0cca1be5b8a2bddff8ee98a5";

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
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
