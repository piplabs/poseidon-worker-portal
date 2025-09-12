import { defineChain } from "viem";

export const psdnDevnet = defineChain({
  id: 1518, 
  name: "Story Poseidon Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.poseidon.storyrpc.io/"],
    },
    public: {
      http: ["https://rpc.poseidon.storyrpc.io/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Poseidon Explorer",
      url: "https://poseidon.storyscan.io/", 
    },
  },
  testnet: true, 
});

export const psdnL2Devnet = defineChain({
  id: 11711,
  name: "PSDN Subnet 0 Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://devnet-subnet0.psdnrpc.io"],
    },
    public: {
      http: ["https://devnet-subnet0.psdnrpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "PSDN Subnet 0 Explorer",
      url: "https://devnet-subnet0.psdnscan.io/",
    },
  },
  testnet: true,
});