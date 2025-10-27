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
  BRIDGE: "0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae",
  L2_TO_L1_MESSAGE_PASSER: "0x4200000000000000000000000000000000000016", // Standard Optimism-style message passer
  DISPUTE_GAME_FACTORY: "0x0d10e01efbe6e47b3d25f83a7a0d9b5e59116936",
  OPTIMISM_PORTAL: "0x8ac124c4dac740eea694d1cab914740c44f6ee8f", // L1 OptimismPortal contract
  SUBNET_CONTROL_PLANE: "0xdC805e279e3A4C1F8d244858CaD99f4b5FF9cC0A", // L2 SubnetControlPlane contract
} as const;

export const TOKEN_DECIMALS = 18;
export const DEFAULT_BALANCE = "0.00";
export const ZERO_AMOUNT = "0";

export const POLLING_INTERVAL = 10000;
export const SWAP_ANIMATION_DURATION = 0;
export const MIN_GAS_LIMIT = 200000;
export const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Test mode - set to true to manually progress through withdrawal steps without gas
export const TEST_MODE = true;

export const DECIMAL_PLACES = {
  BALANCE: 2,
  AMOUNT: 2,
} as const;
export type BridgeOption = 'psdn' | 'eth';
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
  logo: "https://psdn.ai/icon.png?07720b992e581016",
  color: "bg-blue-500",
  layer: "L1",
};

export const PSDN_L2_TOKEN: Token = {
  symbol: "PSDN",
  name: "PSDN Proteus",
  balance: ZERO_AMOUNT,
  logo: "https://psdn.ai/icon.png?07720b992e581016",
  color: "bg-purple-500",
  layer: "L2",
};

export const ETH_L1_TOKEN: Token = {
  symbol: "ETH",
  name: "Ethereum L1",
  balance: ZERO_AMOUNT,
  logo: "Ξ",
  color: "bg-gray-500",
  layer: "L1",
};

export const ETH_L2_TOKEN: Token = {
  symbol: "ETH",
  name: "Ethereum Proteus",
  balance: ZERO_AMOUNT,
  logo: "Ξ",
  color: "bg-gray-600",
  layer: "L2",
};
export const DEFAULT_FROM_TOKEN = PSDN_L1_TOKEN;
export const DEFAULT_TO_TOKEN = PSDN_L2_TOKEN;
export const DEFAULT_BRIDGE_OPTION: BridgeOption = 'psdn';

export const EMPTY_EXTRA_DATA = "0x";
