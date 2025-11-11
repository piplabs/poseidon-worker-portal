"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { psdnDevnet, proteusDevnet } from "@/lib/chains";

const walletConnectProjectId = "d2cd825c0cca1be5b8a2bddff8ee98a5";

const config = getDefaultConfig({
  appName: "PSDN Bridge",
  projectId: walletConnectProjectId,
  chains: [psdnDevnet, proteusDevnet],
  ssr: true, 
});

const queryClient = new QueryClient();

// Custom RainbowKit theme to match the site's glassmorphic style
const customTheme = darkTheme({
  accentColor: 'rgba(255, 255, 255, 0.15)',
  accentColorForeground: 'white',
  borderRadius: 'large',
  overlayBlur: 'large',
});

// Ultra-transparent glassmorphic modal to see site behind
customTheme.colors.modalBackground = 'rgba(0, 0, 0, 0.25)';
customTheme.colors.modalBackdrop = 'rgba(0, 0, 0, 0.15)'; // Very transparent to see site clearly
customTheme.colors.modalBorder = 'rgba(255, 255, 255, 0.2)';
customTheme.colors.modalText = 'white';
customTheme.colors.modalTextSecondary = 'rgba(255, 255, 255, 0.8)';
customTheme.colors.actionButtonBorder = 'rgba(255, 255, 255, 0.15)';
customTheme.colors.actionButtonBorderMobile = 'rgba(255, 255, 255, 0.15)';
customTheme.colors.actionButtonSecondaryBackground = 'rgba(255, 255, 255, 0.12)';
customTheme.colors.closeButton = 'rgba(255, 255, 255, 0.9)';
customTheme.colors.closeButtonBackground = 'rgba(255, 255, 255, 0.12)';
customTheme.colors.connectButtonBackground = 'rgba(255, 255, 255, 0.12)';
customTheme.colors.connectButtonBackgroundError = 'rgba(239, 68, 68, 0.2)';
customTheme.colors.connectButtonText = 'white';
customTheme.colors.connectButtonTextError = 'rgba(252, 165, 165, 1)';
customTheme.colors.connectionIndicator = 'rgba(34, 197, 94, 1)';
customTheme.colors.menuItemBackground = 'rgba(255, 255, 255, 0.08)';
customTheme.colors.selectedOptionBorder = 'rgba(255, 255, 255, 0.3)';
customTheme.shadows.dialog = '0 25px 50px -12px rgba(0, 0, 0, 0.6)';
customTheme.radii.modal = '1rem';
customTheme.radii.menuButton = '0.75rem';
customTheme.radii.modalMobile = '1rem';
customTheme.radii.actionButton = '0.75rem';
customTheme.radii.connectButton = '0.75rem';

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
