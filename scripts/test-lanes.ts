/**
 * Test lane validation for multiple destination chains from Sepolia.
 * Uses getOnRampForRouter and getOffRampsForRouter to validate
 * which lanes are available from the Sepolia router.
 */
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";
import { networkInfo } from "@chainlink/ccip-sdk";

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
const chain = await fromViemClient(publicClient);

console.log("=== CCIP Lane Validation Test ===");
console.log("Source: Ethereum Sepolia");
console.log("Router:", SEPOLIA_ROUTER);
console.log();

// Test multiple destination chains
const destChains = [
  "avalanche-testnet-fuji",
  "ethereum-testnet-sepolia-optimism-1",
  "polygon-testnet-amoy",
  "ethereum-testnet-sepolia-base-1",
  "ethereum-testnet-sepolia-arbitrum-1",
  "binance_smart_chain-testnet",
];

console.log("--- OnRamp Lookup (outbound lanes from Sepolia) ---");
for (const destName of destChains) {
  try {
    const info = networkInfo(destName);
    const onRamp = await chain.getOnRampForRouter(
      SEPOLIA_ROUTER,
      info.chainSelector
    );
    const isValid = onRamp !== "0x0000000000000000000000000000000000000000";
    console.log(
      `  Sepolia -> ${destName}: ${isValid ? "ACTIVE" : "NO LANE"} (onRamp: ${onRamp})`
    );
  } catch (e: unknown) {
    const err = e as Error;
    console.log(`  Sepolia -> ${destName}: ERROR - ${err.message?.substring(0, 80)}`);
  }
}
console.log();

// Test offRamps (inbound lanes to Sepolia)
console.log("--- OffRamp Lookup (inbound lanes to Sepolia) ---");
try {
  const offRamps = await chain.getOffRampsForRouter(SEPOLIA_ROUTER);
  console.log(`  Found ${offRamps.length} offRamp(s)`);
  for (const offRamp of offRamps) {
    console.log(`  Source selector: ${offRamp.sourceChainSelector.toString()}`);
    console.log(`    OffRamp address: ${offRamp.offRamp}`);
    // Try to resolve the chain name
    try {
      const info = networkInfo(offRamp.sourceChainSelector);
      console.log(`    Chain name: ${info.name}`);
    } catch {
      console.log(`    Chain name: (unknown)`);
    }
  }
} catch (e: unknown) {
  const err = e as Error;
  console.log(`  getOffRampsForRouter error: ${err.message?.substring(0, 200)}`);
}
console.log();

console.log("=== Lane Validation Test Complete ===");
