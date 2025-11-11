import { createPublicClient, http, parseAbi } from "viem";
import { CONTRACT_ADDRESSES, RPC_URLS } from "@/lib/constants";
import { DisputeGameData } from "./types";

const disputeGameFactoryAbi = parseAbi([
  'function gameCount() view returns (uint256)',
  'function gameAtIndex(uint256) view returns (uint8,uint64,address)',
]);

const disputeGameAbi = parseAbi([
  'function l2BlockNumber() view returns (uint256)',
  'function rootClaim() view returns (bytes32)',
]);

export async function waitForDisputeGame(l2BlockNumber: number): Promise<DisputeGameData> {
  if (!l2BlockNumber || l2BlockNumber <= 0) {
    throw new Error(`Invalid L2 block number: ${l2BlockNumber}`);
  }

  try {
    const l1Client = createPublicClient({
      transport: http(RPC_URLS.L1),
    });

    const maxWaitTime = 600000;
    const checkInterval = 10000;
    const startTime = Date.now();
    let lastGameCount = 0;

    while ((Date.now() - startTime) < maxWaitTime) {
      try {
        const gameCount = await l1Client.readContract({
          address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
          abi: disputeGameFactoryAbi,
          functionName: 'gameCount',
        });

        const gameCountNum = Number(gameCount);

        if (gameCountNum !== lastGameCount) {
          lastGameCount = gameCountNum;

          const i = gameCountNum - 1;
          
          {
            const gameData = await l1Client.readContract({
              address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
              abi: disputeGameFactoryAbi,
              functionName: 'gameAtIndex',
              args: [BigInt(i)],
            });

            const [gameType, timestamp, gameAddress] = gameData as [number, bigint, `0x${string}`];

            const gameL2Block = await l1Client.readContract({
              address: gameAddress,
              abi: disputeGameAbi,
              functionName: 'l2BlockNumber',
            });

            const rootClaim = await l1Client.readContract({
              address: gameAddress,
              abi: disputeGameAbi,
              functionName: 'rootClaim',
            });

            const gameL2BlockNum = Number(gameL2Block);

            if (gameL2BlockNum >= l2BlockNumber) {
              const gameData = {
                gameIndex: i,
                gameAddress,
                gameType,
                gameL2Block: gameL2BlockNum,
                rootClaim: rootClaim as string,
                timestamp: Number(timestamp)
              };
              
              return gameData;
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Timeout waiting for dispute game');
  } catch (error) {
    throw error;
  }
}

