// Shared types for L2 to L1 withdrawal process

export interface MessagePassedEventData {
  nonce: string;
  sender: string;
  target: string;
  value: string;
  gasLimit: string;
  data: string;
  withdrawalHash: string;
}

export interface DisputeGameData {
  gameIndex: number;
  gameAddress: string;
  gameType: number;
  gameL2Block: number;
  rootClaim: string;
  timestamp: number;
}

export interface ProofData {
  withdrawalProof: string[];
  outputRootProof: {
    version: string;
    stateRoot: string;
    messagePasserStorageRoot: string;
    latestBlockhash: string;
  };
  storageSlot: string;
}

