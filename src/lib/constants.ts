export const CHAIN_IDS = {
  L1: 1518,
  L2: 111811,
} as const;

export const RPC_URLS = {
  L1: "https://rpc.poseidon.storyrpc.io/",
  L2: "https://devnet-proteus.psdnrpc.io",
} as const;

export const CONTRACT_ADDRESSES = {
  PSDN_L1: "0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46", 
  PSDN_L2: "0x30f627A3de293d408E89D4C3E40a41bbF638bC36",
  BRIDGE: "0x09E0A37b6A03a1561813DFdf3dA203e9bCc77232", // L1 Bridge contract for L1->L2 transfers
  L2_BRIDGE: "0x4200000000000000000000000000000000000010", // L2 Bridge contract for L2->L1 transfers
  L2_TO_L1_MESSAGE_PASSER: "0x4200000000000000000000000000000000000016", // Standard Optimism-style message passer
  DISPUTE_GAME_FACTORY: "0x7e72ac9ba979b4323f4cede5484903b3b48249a0",
  OPTIMISM_PORTAL: "0xF0CF19Bd4f5D221AB87fcF9Ce2ff5d341e704062", // L1 OptimismPortal contract
  SUBNET_CONTROL_PLANE: "0x780caEECE73fF2f6D89d31f0a52aC4dAeA88fda2", // L2 SubnetControlPlane contract
  SUBNET_TREASURY: "0xf84e0ae2862e2a855f968666946748217cda634d", // L2 SubnetTreasury contract
} as const;

export const TOKEN_DECIMALS = 18;
export const DEFAULT_BALANCE = "0.00";
export const ZERO_AMOUNT = "0";

export const POLLING_INTERVAL = 10000;
export const SWAP_ANIMATION_DURATION = 0;
export const MIN_GAS_LIMIT = 200000;
export const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export const DECIMAL_PLACES = {
  BALANCE: 2,
  AMOUNT: 2,
} as const;
export type BridgeOption = 'psdn' | 'ip';
export interface Token {
  symbol: string;
  name: string;
  balance: string;
  logo: string;
  color: string;
  layer?: "L1" | "L2";
}
export const PSDN_L1_TOKEN: Token = {
  symbol: "PSDN",
  name: "PSDN L1",
  balance: ZERO_AMOUNT,
  logo: "psdn-svg",
  color: "bg-black",
  layer: "L1",
};

export const PSDN_L2_TOKEN: Token = {
  symbol: "PSDN",
  name: "PSDN Proteus",
  balance: ZERO_AMOUNT,
  logo: "psdn-svg",
  color: "bg-black",
  layer: "L2",
};

export const IP_L1_TOKEN: Token = {
  symbol: "IP",
  name: "IP L1",
  balance: ZERO_AMOUNT,
  logo: "IP",
  color: "bg-black",
  layer: "L1",
};

export const IP_L2_TOKEN: Token = {
  symbol: "IP",
  name: "IP Proteus",
  balance: ZERO_AMOUNT,
  logo: "IP",
  color: "bg-black",
  layer: "L2",
};
export const DEFAULT_FROM_TOKEN = PSDN_L1_TOKEN;
export const DEFAULT_TO_TOKEN = PSDN_L2_TOKEN;
export const DEFAULT_BRIDGE_OPTION: BridgeOption = 'psdn';

export const EMPTY_EXTRA_DATA = "0x";
