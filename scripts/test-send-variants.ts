/**
 * Send multiple CCIP messages with different configurations to leave
 * varied on-chain traces. Each message uses a different combination of
 * extraArgs, data payloads, and destinations.
 */
import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { fromViemClient, viemWallet } from "@chainlink/ccip-sdk/viem";
import { networkInfo } from "@chainlink/ccip-sdk";

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Error: Set SEPOLIA_PRIVATE_KEY");
  process.exit(1);
}

const account = privateKeyToAccount(
  `0x${PRIVATE_KEY.replace(/^0x/, "")}` as `0x${string}`
);
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
  account,
});

const chain = await fromViemClient(publicClient);
const wallet = viemWallet(walletClient);
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

console.log("=== Sending Multiple CCIP Message Variants ===");
console.log("Sender:", account.address);
console.log();

const results: Array<{
  variant: string;
  messageId: string;
  txHash: string;
  explorer: string;
}> = [];

// --- Variant 1: Message with custom data payload ---
console.log("--- Variant 1: Message with custom data payload ---");
try {
  const fujiSelector = networkInfo("avalanche-testnet-fuji").chainSelector;
  const customData = toHex("Hello CCIP from Sepolia! Timestamp: " + Date.now());
  const request = await chain.sendMessage({
    router: SEPOLIA_ROUTER,
    destChainSelector: fujiSelector,
    message: {
      receiver: account.address,
      data: customData,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
    wallet,
  });
  console.log("  Message ID:", request.message.messageId);
  console.log("  TX hash:", request.tx.hash);
  console.log(
    "  Explorer: https://ccip.chain.link/msg/" + request.message.messageId
  );
  results.push({
    variant: "Custom data payload to Fuji",
    messageId: request.message.messageId,
    txHash: request.tx.hash,
    explorer:
      "https://ccip.chain.link/msg/" + request.message.messageId,
  });
} catch (e: unknown) {
  const err = e as Error;
  console.log("  Error:", err.message?.substring(0, 200));
}
console.log();

// --- Variant 2: Message with higher gas limit + allowOutOfOrderExecution ---
console.log(
  "--- Variant 2: Higher gas limit (500k) + allowOutOfOrderExecution ---"
);
try {
  const fujiSelector = networkInfo("avalanche-testnet-fuji").chainSelector;
  const request = await chain.sendMessage({
    router: SEPOLIA_ROUTER,
    destChainSelector: fujiSelector,
    message: {
      receiver: account.address,
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 500_000n, allowOutOfOrderExecution: true },
    },
    wallet,
  });
  console.log("  Message ID:", request.message.messageId);
  console.log("  TX hash:", request.tx.hash);
  console.log(
    "  Explorer: https://ccip.chain.link/msg/" + request.message.messageId
  );
  results.push({
    variant: "High gas limit (500k) + out-of-order",
    messageId: request.message.messageId,
    txHash: request.tx.hash,
    explorer:
      "https://ccip.chain.link/msg/" + request.message.messageId,
  });
} catch (e: unknown) {
  const err = e as Error;
  console.log("  Error:", err.message?.substring(0, 200));
}
console.log();

// --- Variant 3: Message with large data payload ---
console.log("--- Variant 3: Large data payload (512 bytes) ---");
try {
  const fujiSelector = networkInfo("avalanche-testnet-fuji").chainSelector;
  // Generate 512 bytes of data
  const largeData = ("0x" +
    "ab".repeat(512)) as `0x${string}`;
  const request = await chain.sendMessage({
    router: SEPOLIA_ROUTER,
    destChainSelector: fujiSelector,
    message: {
      receiver: account.address,
      data: largeData,
      tokenAmounts: [],
      extraArgs: { gasLimit: 300_000n },
    },
    wallet,
  });
  console.log("  Message ID:", request.message.messageId);
  console.log("  TX hash:", request.tx.hash);
  console.log(
    "  Explorer: https://ccip.chain.link/msg/" + request.message.messageId
  );
  results.push({
    variant: "Large data payload (512 bytes)",
    messageId: request.message.messageId,
    txHash: request.tx.hash,
    explorer:
      "https://ccip.chain.link/msg/" + request.message.messageId,
  });
} catch (e: unknown) {
  const err = e as Error;
  console.log("  Error:", err.message?.substring(0, 200));
}
console.log();

// --- Variant 4: Minimal message (only receiver, let SDK handle defaults) ---
console.log("--- Variant 4: Minimal message (receiver only, SDK defaults) ---");
try {
  const fujiSelector = networkInfo("avalanche-testnet-fuji").chainSelector;
  const request = await chain.sendMessage({
    router: SEPOLIA_ROUTER,
    destChainSelector: fujiSelector,
    message: {
      receiver: account.address,
    },
    wallet,
  });
  console.log("  Message ID:", request.message.messageId);
  console.log("  TX hash:", request.tx.hash);
  console.log(
    "  Explorer: https://ccip.chain.link/msg/" + request.message.messageId
  );
  results.push({
    variant: "Minimal message (SDK defaults)",
    messageId: request.message.messageId,
    txHash: request.tx.hash,
    explorer:
      "https://ccip.chain.link/msg/" + request.message.messageId,
  });
} catch (e: unknown) {
  const err = e as Error;
  console.log("  Error:", err.message?.substring(0, 200));
}
console.log();

// --- Summary ---
console.log("=== Summary of Sent Messages ===");
for (const r of results) {
  console.log(`  [${r.variant}]`);
  console.log(`    Message ID: ${r.messageId}`);
  console.log(`    TX hash: ${r.txHash}`);
  console.log(`    Explorer: ${r.explorer}`);
}
console.log();
console.log(`Total messages sent: ${results.length}`);
