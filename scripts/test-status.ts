import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";

// --- Configuration ---
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";

// Accept message ID as CLI argument
const messageId = process.argv[2];
if (!messageId) {
  console.error("Usage: npx tsx scripts/test-status.ts <messageId>");
  console.error("Example: npx tsx scripts/test-status.ts 0xabc123...");
  process.exit(1);
}

// --- Viem client ---
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

const chain = await fromViemClient(publicClient);

console.log("=== CCIP Message Status Tracking Test ===");
console.log("Message ID:", messageId);
console.log();

try {
  console.log("Calling chain.getMessageById()...");
  const request = await chain.getMessageById(messageId);

  console.log("Message found!");
  console.log("  Message ID:", request.message.messageId);
  console.log("  Source chain:", request.lane.sourceChainSelector.toString());
  console.log("  Dest chain:", request.lane.destChainSelector.toString());
  console.log("  TX hash:", request.tx.hash);

  if (request.metadata) {
    console.log("  Status:", request.metadata.status);
    if (request.metadata.deliveryTime) {
      console.log("  Delivery time:", request.metadata.deliveryTime, "ms");
    }
  } else {
    console.log("  Metadata: not available (on-chain data only)");
  }
} catch (error: unknown) {
  const err = error as Error;
  console.error("getMessageById error:", err.message || err);
  console.log();
  console.log("Note: The SDK provides getMessageById() for status tracking.");
  console.log("It uses the CCIP API under the hood and returns metadata with status.");
  console.log("Available status values: SENT, SOURCE_FINALIZED, COMMITTED, BLESSED, SUCCESS, FAILED, VERIFYING, VERIFIED, UNKNOWN");
}
