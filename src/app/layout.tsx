import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from '@/app/providers';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Poseidon Worker Portal",
  description: "Poseidon Worker Portal",
  icons: {
    icon: "https://psdn.ai/icon.png?07720b992e581016",
    shortcut: "https://psdn.ai/icon.png?07720b992e581016",
    apple: "https://psdn.ai/icon.png?07720b992e581016",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
