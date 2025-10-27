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

export const proteusDevnet = defineChain({
  id: 111811,
  name: "Proteus Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://devnet-proteus.psdnrpc.io"],
    },
    public: {
      http: ["https://devnet-proteus.psdnrpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Proteus Devnet Explorer",
      url: "https://devnet-proteus.psdnscan.io/",
    },
  },
  testnet: true,
});
