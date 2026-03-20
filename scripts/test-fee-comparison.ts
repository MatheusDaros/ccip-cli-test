/**
 * Compare CCIP fees across different message configurations.
 * Tests: varying gas limits, data sizes, and fee token options.
 */
import { createPublicClient, http, formatEther, toHex } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";
import { networkInfo } from "@chainlink/ccip-sdk";

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
const destChainSelector = networkInfo("avalanche-testnet-fuji").chainSelector;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
const chain = await fromViemClient(publicClient);

console.log("=== CCIP Fee Comparison Across Configurations ===");
console.log();

const configs = [
  {
    name: "Minimal message (no data, gasLimit=0)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 0n },
    },
  },
  {
    name: "Default gasLimit (200k)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
  },
  {
    name: "High gasLimit (1M)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 1_000_000n },
    },
  },
  {
    name: "Very high gasLimit (5M)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 5_000_000n },
    },
  },
  {
    name: "Small data payload (32 bytes)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: toHex("Hello CCIP - small payload test!"),
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
  },
  {
    name: "Medium data payload (256 bytes)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: ("0x" + "ab".repeat(256)) as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
  },
  {
    name: "Large data payload (1024 bytes)",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: ("0x" + "cd".repeat(1024)) as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n },
    },
  },
  {
    name: "With allowOutOfOrderExecution=true",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: true },
    },
  },
  {
    name: "With allowOutOfOrderExecution=false",
    message: {
      receiver: "0x0000000000000000000000000000000000000001",
      data: "0x" as `0x${string}`,
      tokenAmounts: [],
      extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: false },
    },
  },
];

console.log("Config | Fee (wei) | Fee (ETH)");
console.log("--- | --- | ---");

for (const config of configs) {
  try {
    const fee = await chain.getFee({
      router: SEPOLIA_ROUTER,
      destChainSelector,
      message: config.message,
    });
    console.log(`${config.name} | ${fee.toString()} | ${formatEther(fee)} ETH`);
  } catch (e: unknown) {
    const err = e as Error;
    console.log(`${config.name} | ERROR | ${err.message?.substring(0, 80)}`);
  }
}

console.log();
console.log("=== Fee Comparison Complete ===");
