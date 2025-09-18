export const CHAIN_IDS = {
  L1: 1518,
  L2: 11711,
} as const;

export const CONTRACT_ADDRESSES = {
  PSDN_L1: "0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46",
  PSDN_L2: "0x30f627A3de293d408E89D4C3E40a41bbF638bC36",
  BRIDGE: "0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae",
} as const;

export const TOKEN_DECIMALS = 18;
export const DEFAULT_BALANCE = "0.00";
export const ZERO_AMOUNT = "0";

export const POLLING_INTERVAL = 10000;
export const SWAP_ANIMATION_DELAY = 0;
export const SWAP_ANIMATION_DURATION = 0;
export const MIN_GAS_LIMIT = 200000;
export const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

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
  name: "Poseidon L1",
  balance: ZERO_AMOUNT,
  logo: "https://psdn.ai/icon.png?07720b992e581016",
  color: "bg-blue-500",
  layer: "L1",
};

export const PSDN_L2_TOKEN: Token = {
  symbol: "PSDN",
  name: "Poseidon Subnet 0",
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
  name: "Ethereum Subnet 0",
  balance: ZERO_AMOUNT,
  logo: "Ξ",
  color: "bg-gray-600",
  layer: "L2",
};
export const DEFAULT_FROM_TOKEN = PSDN_L1_TOKEN;
export const DEFAULT_TO_TOKEN = PSDN_L2_TOKEN;
export const DEFAULT_BRIDGE_OPTION: BridgeOption = 'psdn';

export const EMPTY_EXTRA_DATA = "0x";
