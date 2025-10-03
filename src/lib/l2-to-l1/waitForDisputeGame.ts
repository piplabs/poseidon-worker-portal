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
    console.log('\n' + '═'.repeat(80));
    console.log('STEP 2: WAIT FOR DISPUTE GAME');
    console.log('═'.repeat(80));

    console.log('\n📊 Parameters:');
    console.log(`   L2 Block to prove: ${l2BlockNumber}`);
    console.log(`   DisputeGameFactory: ${CONTRACT_ADDRESSES.DISPUTE_GAME_FACTORY}`);
    console.log(`\n⏳ Waiting for a dispute game with block >= ${l2BlockNumber}`);
    console.log(`   (New games are created periodically by the proposer)`);

    // Create L1 client
    const l1Client = createPublicClient({
      transport: http(RPC_URLS.L1),
    });

    console.log('\n🔧 L1 Client initialized:');
    console.log(`   RPC URL: ${RPC_URLS.L1}`);
    console.log(`   Client:`, l1Client);

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
          console.log(`\n🎮 Game count updated: ${gameCountNum} (was ${lastGameCount})`);
          lastGameCount = gameCountNum;

          // When waiting for new games, only check the most recent game
          // since we know the next game will likely cover our withdrawal block
          const startIndex = gameCountNum - 1; // Only check the newest game
          const endIndex = gameCountNum - 1;
          
          console.log(`\n🔍 Checking newest game #${startIndex} (waiting for next game to be published)...`);
          
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

            console.log(`\n📋 Game #${i} Details:`);
            console.log(`   Address: ${gameAddress}`);
            console.log(`   Type: ${gameType}`);
            console.log(`   L2 Block: ${gameL2BlockNum}`);
            console.log(`   Root Claim: ${rootClaim}`);
            console.log(`   Created: ${new Date(Number(timestamp) * 1000).toISOString()}`);

            // Track the highest block we've seen
            if (gameL2BlockNum > highestBlockSeen) {
              highestBlockSeen = gameL2BlockNum;
            }

            // Check if this game covers our withdrawal block
            if (gameL2BlockNum >= l2BlockNumber) {
              console.log(`\n✅ Found suitable game covering block ${l2BlockNumber}!`);
              console.log(`   Game L2 block ${gameL2BlockNum} >= withdrawal block ${l2BlockNumber}`);
              
              const gameData = {
                gameIndex: i,
                gameAddress,
                gameType,
                gameL2Block: gameL2BlockNum,
                rootClaim: rootClaim as string,
                timestamp: Number(timestamp)
              };
              
              console.log(`\n🎯 Game Found - Complete Details:`);
              console.log(`   Game Index: ${gameData.gameIndex}`);
              console.log(`   Game Address: ${gameData.gameAddress}`);
              console.log(`   Game Type: ${gameData.gameType}`);
              console.log(`   Game L2 Block: ${gameData.gameL2Block}`);
              console.log(`   Root Claim: ${gameData.rootClaim}`);
              console.log(`   Timestamp: ${gameData.timestamp}`);
              console.log(`   Created: ${new Date(gameData.timestamp * 1000).toISOString()}`);
              
              return gameData;
            } else {
              console.log(`   ❌ Game block ${gameL2BlockNum} < withdrawal block ${l2BlockNumber} (too old)`);
            }
          }

          // Show progress summary
          console.log(`\n📊 Progress Summary:`);
          console.log(`   Highest game block seen: ${highestBlockSeen}`);
          console.log(`   Need block >= ${l2BlockNumber}`);
          console.log(`   Still need: ${l2BlockNumber - highestBlockSeen} more blocks`);
        }

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`⏳ Waiting for new game... ${elapsed}s elapsed | Games: ${gameCountNum} | Highest: ${highestBlockSeen} | Need: ${l2BlockNumber}`);
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.error(`\n❌ Error during dispute game check:`, error);
        console.log(`   Continuing to wait...`);
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    console.log('\n\n❌ Timeout waiting for dispute game after 10 minutes');
    throw new Error('Timeout waiting for dispute game');
  } catch (error) {
    console.error('❌ Failed to wait for dispute game:', error);
    throw error;
  }
}

