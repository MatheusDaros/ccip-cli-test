import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fromViemClient } from "@chainlink/ccip-sdk/viem";
import { networkInfo, supportedChains, ChainFamily } from "@chainlink/ccip-sdk";

console.log("=== CCIP Supported Networks Test ===");
console.log();

// --- Test 1: supportedChains ---
console.log("1. supportedChains keys:", Object.keys(supportedChains));
console.log("   (These are chain family keys, not individual networks)");
console.log();

// --- Test 2: networkInfo with known chains ---
console.log("2. networkInfo() lookups:");
const testChains = [
  "ethereum-testnet-sepolia",
  "avalanche-testnet-fuji",
  "ethereum-mainnet",
  "polygon-mainnet",
  "arbitrum-mainnet",
];

for (const name of testChains) {
  try {
    const info = networkInfo(name);
    console.log(`   ${name}:`);
    console.log(`     selector: ${info.chainSelector}`);
    console.log(`     chainId: ${info.chainId}`);
    console.log(`     family: ${info.family}`);
    console.log(`     type: ${info.networkType}`);
  } catch (e: unknown) {
    const err = e as Error;
    console.log(`   ${name}: ERROR - ${err.message}`);
  }
}
console.log();

// --- Test 3: Can we list all supported networks? ---
console.log("3. Is there a method to list ALL supported networks?");
console.log("   supportedChains provides chain family classes (EVM, SVM, etc.)");
console.log("   but does NOT provide a list of all network names/selectors.");
console.log("   networkInfo() requires you to already know the chain name/selector/id.");
console.log();

// --- Test 4: Can we validate a source->dest pair? ---
console.log("4. Validating source->dest pairs:");

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

const chain = await fromViemClient(publicClient);

// Try to get the onRamp for a valid destination
const fujiSelector = networkInfo("avalanche-testnet-fuji").chainSelector;
try {
  const onRamp = await chain.getOnRampForRouter(SEPOLIA_ROUTER, fujiSelector);
  console.log(`   Sepolia -> Fuji: VALID (onRamp: ${onRamp})`);
} catch (e: unknown) {
  const err = e as Error;
  console.log(`   Sepolia -> Fuji: ${err.message}`);
}

// Try an invalid destination selector
try {
  const onRamp = await chain.getOnRampForRouter(SEPOLIA_ROUTER, 999999999n);
  console.log(`   Sepolia -> 999999999: VALID (onRamp: ${onRamp})`);
} catch (e: unknown) {
  const err = e as Error;
  console.log(`   Sepolia -> 999999999 (invalid): ERROR - ${err.message}`);
}

console.log();
console.log("Summary: There is no dedicated 'listAllNetworks()' or 'isLaneSupported()' method.");
console.log("You can use getOnRampForRouter() to check if a lane exists, but it requires");
console.log("an RPC call. networkInfo() validates chain names but not lane support.");
