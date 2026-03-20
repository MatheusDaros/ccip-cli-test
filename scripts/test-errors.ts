import { createPublicClient, createWalletClient, http } from "viem";
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
const destChainSelector =
  networkInfo("avalanche-testnet-fuji").chainSelector;

console.log("=== Error Handling Tests ===");
console.log();

// Test 1: Invalid router address
console.log("--- Test 1: Invalid router address ---");
try {
  await chain.sendMessage({
    router: "0x0000000000000000000000000000000000000001",
    destChainSelector,
    message: {
      receiver: account.address,
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
    wallet: viemWallet(walletClient),
  });
  console.log("Unexpectedly succeeded");
} catch (e: unknown) {
  const err = e as Error & { code?: string };
  console.log("Error type:", err.constructor?.name);
  console.log("Error message:", err.message?.substring(0, 300));
  if (err.code) console.log("Error code:", err.code);
}
console.log();

// Test 2: Invalid destination chain selector
console.log("--- Test 2: Invalid destination chain selector ---");
try {
  await chain.sendMessage({
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    destChainSelector: 123n,
    message: {
      receiver: account.address,
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
    wallet: viemWallet(walletClient),
  });
  console.log("Unexpectedly succeeded");
} catch (e: unknown) {
  const err = e as Error & { code?: string };
  console.log("Error type:", err.constructor?.name);
  console.log("Error message:", err.message?.substring(0, 300));
  if (err.code) console.log("Error code:", err.code);
}
console.log();

// Test 3: Extremely low gas limit
console.log("--- Test 3: Extremely low gas limit (1n) ---");
try {
  const fee = await chain.getFee({
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    destChainSelector,
    message: {
      receiver: account.address,
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 1n },
    },
  });
  console.log(
    "getFee succeeded with gasLimit=1n (no client-side validation). Fee:",
    fee.toString()
  );
} catch (e: unknown) {
  const err = e as Error & { code?: string };
  console.log("Error type:", err.constructor?.name);
  console.log("Error message:", err.message?.substring(0, 300));
  if (err.code) console.log("Error code:", err.code);
}
console.log();

// Test 4: Insufficient funds (use a fresh wallet with no ETH)
console.log("--- Test 4: Insufficient funds (fresh empty wallet) ---");
try {
  const emptyAccount = privateKeyToAccount(
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
  const emptyWalletClient = createWalletClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
    account: emptyAccount,
  });
  await chain.sendMessage({
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    destChainSelector,
    message: {
      receiver: account.address,
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
    wallet: viemWallet(emptyWalletClient),
  });
  console.log("Unexpectedly succeeded");
} catch (e: unknown) {
  const err = e as Error & { code?: string };
  console.log("Error type:", err.constructor?.name);
  console.log("Error message:", err.message?.substring(0, 300));
  if (err.code) console.log("Error code:", err.code);
}
console.log();

console.log("=== Error Handling Tests Complete ===");
