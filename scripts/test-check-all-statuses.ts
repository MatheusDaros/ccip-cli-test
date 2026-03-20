/**
 * Check the delivery status of all CCIP messages sent during this review.
 * Polls the CCIP API for each message ID.
 */
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
const chain = await fromViemClient(publicClient);

console.log("=== CCIP Message Status Check (All Sent Messages) ===");
console.log();

const messages = [
  {
    label: "Original send (Sepolia -> Fuji, empty data)",
    messageId:
      "0xd08d412924f27d9622226163a71cc73edfa9c12efae5c57a70e0e9883c23a3ae",
  },
  {
    label: "Variant 1: Custom data payload to Fuji",
    messageId:
      "0xdc364b812f64bba4b925b99bc10ac9b9dfe32ef1e79ac24e044fedf8564d9156",
  },
  {
    label: "Variant 2: High gas limit (500k) + out-of-order",
    messageId:
      "0x4df949ccc419b3877c9c3cecda601e73d76339c05957cde59da71954d8cccadc",
  },
  {
    label: "Variant 3: Large data payload (512 bytes)",
    messageId:
      "0x39dfd1df76c5e0dca32ccf22c96f897f3b94b831d31394cf64ec927d90bacbb6",
  },
  {
    label: "Variant 4: Minimal message (SDK defaults)",
    messageId:
      "0x36343b23a5fa1591881c8edc4cdb93f7281743880d68a9ed8acb41d48a4bb7c6",
  },
  {
    label: "Cross-chain: Sepolia -> Arbitrum Sepolia",
    messageId:
      "0x38ab73f1f10404c88b500f915e3b613d298bf65f701c395345c662cf9b2fac57",
  },
  {
    label: "Cross-chain: Sepolia -> Base Sepolia",
    messageId:
      "0xbe3314e38d3c36ee53a6d948ce3e3e95debe09c0253f10044a8ca4ca41e99cef",
  },
];

console.log("Message | Status | Delivery Time | Dest Chain");
console.log("--- | --- | --- | ---");

for (const msg of messages) {
  try {
    const request = await chain.getMessageById(msg.messageId);
    const status = request.metadata.status;
    const deliveryTime = request.metadata.deliveryTime
      ? `${Number(request.metadata.deliveryTime) / 1000}s`
      : "pending";
    const destChain = request.metadata.destNetworkInfo?.name ?? "unknown";
    console.log(`${msg.label} | ${status} | ${deliveryTime} | ${destChain}`);
  } catch (e: unknown) {
    const err = e as Error;
    console.log(`${msg.label} | ERROR | - | ${err.message?.substring(0, 60)}`);
  }
}

console.log();
console.log("=== Status Check Complete ===");
