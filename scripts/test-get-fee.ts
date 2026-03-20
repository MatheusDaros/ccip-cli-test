import { createPublicClient, http, formatEther } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";
import { networkInfo } from "@chainlink/ccip-sdk";

// --- Configuration ---
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";

// CCIP router address on Sepolia
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

// Destination: Avalanche Fuji
const destChainSelector =
  networkInfo("avalanche-testnet-fuji").chainSelector;

// --- Viem client ---
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

const chain = await fromViemClient(publicClient);

console.log("=== CCIP Fee Estimation Test ===");
console.log("Source: Ethereum Sepolia");
console.log("Destination: Avalanche Fuji");
console.log("Router:", SEPOLIA_ROUTER);
console.log();

// Build the same message as send-ccip-message.ts
const message = {
  receiver: "0x0000000000000000000000000000000000000001",
  data: "0x" as `0x${string}`,
  tokenAmounts: [],
  extraArgs: { gasLimit: 200_000n },
};

try {
  console.log("Calling chain.getFee()...");
  const fee = await chain.getFee({
    router: SEPOLIA_ROUTER,
    destChainSelector,
    message,
  });

  console.log("Fee (wei):", fee.toString());
  console.log("Fee (ETH):", formatEther(fee), "ETH");
  console.log();
  console.log("Note: getFee returns a single bigint (fee in native token wei).");
  console.log("There is no built-in breakdown between LINK vs native fee.");
  console.log("The fee token depends on the message.feeToken field (native if omitted).");
} catch (error) {
  console.error("getFee error:", error);
}
