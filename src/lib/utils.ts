import { formatUnits } from "viem";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  TOKEN_DECIMALS,
  DEFAULT_BALANCE,
  DECIMAL_PLACES,
  ZERO_AMOUNT,
  PSDN_L1_TOKEN,
  PSDN_L2_TOKEN,
  IP_L1_TOKEN,
  IP_L2_TOKEN,
  type Token,
} from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBalance = (balance: bigint | undefined): string => {
  if (!balance) return DEFAULT_BALANCE;
  const formatted = formatUnits(balance, TOKEN_DECIMALS);
  const parsed = parseFloat(formatted);
  return isNaN(parsed) ? DEFAULT_BALANCE : parsed.toFixed(DECIMAL_PLACES.BALANCE);
};

export const formatBalanceFromValue = (balance: { value: bigint } | undefined): string => {
  if (!balance) return DEFAULT_BALANCE;
  return formatBalance(balance.value);
};

export const getAvailableL1Tokens = (
  psdnBalance: bigint | undefined,
  ipBalance: { value: bigint } | undefined
): Token[] => [
  { ...PSDN_L1_TOKEN, balance: formatBalance(psdnBalance) },
  { ...IP_L1_TOKEN, balance: formatBalanceFromValue(ipBalance) },
];

export const getAvailableL2Tokens = (
  psdnL2Balance: bigint | undefined,
  ipL2Balance: { value: bigint } | undefined
): Token[] => [
  { ...PSDN_L2_TOKEN, balance: formatBalance(psdnL2Balance) },
  { ...IP_L2_TOKEN, balance: formatBalanceFromValue(ipL2Balance) },
];

export const formatAmount = (amount: string): string => {
  const numAmount = parseFloat(amount);
  if (!isNaN(numAmount)) {
    return numAmount.toFixed(DECIMAL_PLACES.AMOUNT);
  }
  return ZERO_AMOUNT;
};

export const formatAmountOnBlur = (amount: string): string => {
  const numAmount = parseFloat(amount);
  if (!isNaN(numAmount) && amount !== '') {
    return numAmount.toFixed(DECIMAL_PLACES.AMOUNT);
  }
  return amount;
};

export const isValidAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export const getTokenBalance = (
  token: Token,
  psdnBalance: bigint | undefined,
  psdnL2Balance: bigint | undefined,
  ipBalance: { value: bigint } | undefined,
  ipL2Balance: { value: bigint } | undefined
): string => {
  if (token.symbol === 'PSDN') {
    return token.layer === 'L1' 
      ? formatBalance(psdnBalance)
      : formatBalance(psdnL2Balance);
  } else if (token.symbol === 'IP') {
    return token.layer === 'L1' 
      ? formatBalanceFromValue(ipBalance)
      : formatBalanceFromValue(ipL2Balance);
  }
  return DEFAULT_BALANCE;
};