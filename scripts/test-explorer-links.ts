/**
 * Test CCIP Explorer URL generation and getMessagesInTx functionality.
 * Uses real transaction hashes from previous sends.
 */
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";
import {
  getCCIPExplorerUrl,
  getCCIPExplorerLinks,
  CCIP_EXPLORER_BASE_URL,
} from "@chainlink/ccip-sdk";

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
const chain = await fromViemClient(publicClient);

console.log("=== CCIP Explorer Links & Transaction Parsing Test ===");
console.log();

// --- Test 1: Explorer URL generation ---
console.log("--- Test 1: CCIP Explorer URL Utilities ---");
console.log("CCIP_EXPLORER_BASE_URL:", CCIP_EXPLORER_BASE_URL);

const testMessageId =
  "0xd08d412924f27d9622226163a71cc73edfa9c12efae5c57a70e0e9883c23a3ae";

try {
  const url = getCCIPExplorerUrl(testMessageId);
  console.log("getCCIPExplorerUrl result:", url);
} catch (e: unknown) {
  const err = e as Error;
  console.log("getCCIPExplorerUrl error:", err.message);
}

try {
  const links = getCCIPExplorerLinks(testMessageId);
  console.log("getCCIPExplorerLinks result:", JSON.stringify(links, null, 2));
} catch (e: unknown) {
  const err = e as Error;
  console.log("getCCIPExplorerLinks error:", err.message);
}
console.log();

// --- Test 2: getMessagesInTx ---
console.log("--- Test 2: getMessagesInTx (parse messages from tx hash) ---");
const txHash =
  "0x1b5ded1af1ed52630ffb997b944a3a6bcde846145ac5cf4b691a42b3708c75a1";
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

try {
  const messages = await chain.getMessagesInTx({
    txHash,
    router: SEPOLIA_ROUTER,
  });
  console.log(`Found ${messages.length} message(s) in tx ${txHash}`);
  for (const msg of messages) {
    console.log("  Message ID:", msg.message.messageId);
    console.log("  Sender:", msg.message.sender);
    console.log("  Source chain:", msg.message.sourceChainSelector?.toString());
    console.log("  Dest chain:", msg.message.destChainSelector?.toString());
    console.log("  Nonce:", msg.message.nonce?.toString());
    console.log("  Sequence number:", msg.message.sequenceNumber?.toString());
  }
} catch (e: unknown) {
  const err = e as Error;
  console.log("getMessagesInTx error:", err.message?.substring(0, 200));
}
console.log();

// --- Test 3: getMessageById with detailed metadata ---
console.log("--- Test 3: Detailed message metadata via getMessageById ---");
try {
  const request = await chain.getMessageById(testMessageId);
  console.log("Message metadata:");
  console.log("  Status:", request.metadata.status);
  console.log("  Send timestamp:", request.metadata.sendTimestamp);
  console.log("  Receipt timestamp:", request.metadata.receiptTimestamp);
  console.log("  Delivery time:", request.metadata.deliveryTime);
  console.log("  Ready for manual execution:", request.metadata.readyForManualExecution);
  console.log("  Finality:", request.metadata.finality);
  console.log("  Fees:", JSON.stringify(request.metadata.fees));
  console.log("  CCIP version:", request.metadata.version);
  console.log("  Source network:", JSON.stringify(request.metadata.sourceNetworkInfo));
  console.log("  Dest network:", JSON.stringify(request.metadata.destNetworkInfo));
} catch (e: unknown) {
  const err = e as Error;
  console.log("getMessageById error:", err.message?.substring(0, 200));
}
console.log();

console.log("=== Explorer Links & Transaction Parsing Test Complete ===");
