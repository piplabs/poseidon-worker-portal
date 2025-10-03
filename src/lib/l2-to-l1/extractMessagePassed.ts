import { createPublicClient, http, decodeEventLog } from "viem";
import { CONTRACT_ADDRESSES, RPC_URLS } from "@/lib/constants";
import { MessagePassedEventData } from "./types";

export async function extractMessagePassedEvent(txHash: string): Promise<{
  withdrawalDetails: MessagePassedEventData | null;
  blockNumber: bigint;
}> {
  console.log('\n⏳ Waiting for transaction confirmation...');
  
  // Create L2 client
  const l2Client = createPublicClient({
    transport: http(RPC_URLS.L2),
  });
  
  // Wait a bit for confirmation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Get receipt using viem
  const receipt = await l2Client.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });
  
  console.log('\n📦 Receipt Details:');
  console.log(`   Block Number: ${receipt.blockNumber}`);
  console.log(`   Gas Used: ${receipt.gasUsed}`);
  
  // Extract MessagePassed event from logs
  const messagePassedTopic = '0x02a52367d10742d8032712c1bb8e0144ff1ec5ffda1ed7d70bb05a2744955054';
  const messagePassedLog = receipt.logs.find(log => 
    log.topics[0] === messagePassedTopic &&
    log.address.toLowerCase() === CONTRACT_ADDRESSES.L2_TO_L1_MESSAGE_PASSER.toLowerCase()
  );
  
  let withdrawalHash = null;
  let withdrawalDetails = null;
  
  if (messagePassedLog) {
    // Decode the MessagePassed event
    const decoded = decodeEventLog({
      abi: [{
        type: 'event',
        name: 'MessagePassed',
        inputs: [
          { type: 'uint256', name: 'nonce', indexed: true },
          { type: 'address', name: 'sender', indexed: true },
          { type: 'address', name: 'target', indexed: true },
          { type: 'uint256', name: 'value', indexed: false },
          { type: 'uint256', name: 'gasLimit', indexed: false },
          { type: 'bytes', name: 'data', indexed: false },
          { type: 'bytes32', name: 'withdrawalHash', indexed: false },
        ],
      }],
      data: messagePassedLog.data,
      topics: messagePassedLog.topics,
    });
    
    // Extract withdrawal details
    const eventData = (decoded as { args: { nonce: bigint; sender: string; target: string; value: bigint; gasLimit: bigint; data: string; withdrawalHash: string } }).args;
    withdrawalHash = eventData.withdrawalHash;
    withdrawalDetails = {
      nonce: eventData.nonce.toString(),
      sender: eventData.sender,
      target: eventData.target,
      value: eventData.value.toString(),
      gasLimit: eventData.gasLimit.toString(),
      data: eventData.data,
      withdrawalHash: withdrawalHash
    };
    
    console.log('\n📋 MessagePassed Event Details:');
    console.log(`   Withdrawal Hash: ${withdrawalHash}`);
    console.log(`   Nonce: ${withdrawalDetails.nonce}`);
    console.log(`   Sender: ${withdrawalDetails.sender}`);
    console.log(`   Target: ${withdrawalDetails.target}`);
    console.log(`   Value: ${withdrawalDetails.value} wei`);
    console.log(`   Gas Limit: ${withdrawalDetails.gasLimit}`);
    console.log(`   Data Length: ${withdrawalDetails.data.length} bytes`);
  } else {
    console.log('\n⚠️ No MessagePassed event found in transaction logs');
  }

  return {
    withdrawalDetails,
    blockNumber: receipt.blockNumber
  };
}

