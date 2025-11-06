import { createPublicClient, http, parseAbi } from "viem";
import { CONTRACT_ADDRESSES, RPC_URLS } from "@/lib/constants";
import { DisputeGameData } from "./types";

// DisputeGameFactory ABI
const disputeGameFactoryAbi = parseAbi([
  'function gameCount() view returns (uint256)',
  'function gameAtIndex(uint256) view returns (uint8,uint64,address)',
]);

// DisputeGame ABI
const disputeGameAbi = parseAbi([
  'function l2BlockNumber() view returns (uint256)',
  'function rootClaim() view returns (bytes32)',
]);

export async function waitForDisputeGame(l2BlockNumber: number): Promise<DisputeGameData> {
  // Validate input
  if (!l2BlockNumber || l2BlockNumber <= 0) {
    throw new Error(`Invalid L2 block number: ${l2BlockNumber}`);
  }

  try {
    // Create L1 client
    const l1Client = createPublicClient({
      transport: http(RPC_URLS.L1),
    });

    const maxWaitTime = 600000; // 10 minutes
    const checkInterval = 10000; // 10 seconds
    const startTime = Date.now();
    let lastGameCount = 0;
    let highestBlockSeen = 0;

    while ((Date.now() - startTime) < maxWaitTime) {
      try {
        // Get game count
        const gameCount = await l1Client.readContract({
          address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
          abi: disputeGameFactoryAbi,
          functionName: 'gameCount',
        });

        const gameCountNum = Number(gameCount);

        // Only process games when count changes
        if (gameCountNum !== lastGameCount) {
          lastGameCount = gameCountNum;

          // When waiting for new games, only check the most recent game
          // since we know the next game will likely cover our withdrawal block
          const startIndex = gameCountNum - 1; // Only check the newest game
          const endIndex = gameCountNum - 1;
          
          for (let i = startIndex; i <= endIndex; i++) {
            // Get game details
            const gameData = await l1Client.readContract({
              address: CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY as `0x${string}`,
              abi: disputeGameFactoryAbi,
              functionName: 'gameAtIndex',
              args: [BigInt(i)],
            });

            const [gameType, timestamp, gameAddress] = gameData as [number, bigint, `0x${string}`];

            // Get game L2 block
            const gameL2Block = await l1Client.readContract({
              address: gameAddress,
              abi: disputeGameAbi,
              functionName: 'l2BlockNumber',
            });

            // Get root claim
            const rootClaim = await l1Client.readContract({
              address: gameAddress,
              abi: disputeGameAbi,
              functionName: 'rootClaim',
            });

            const gameL2BlockNum = Number(gameL2Block);

            // Track the highest block we've seen
            if (gameL2BlockNum > highestBlockSeen) {
              highestBlockSeen = gameL2BlockNum;
            }

            // Check if this game covers our withdrawal block
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
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Timeout waiting for dispute game');
  } catch (error) {
    throw error;
  }
}

