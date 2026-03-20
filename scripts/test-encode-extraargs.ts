/**
 * Test encodeExtraArgs / decodeExtraArgs round-trip.
 * Validates that the SDK correctly encodes and decodes ExtraArgs
 * for different versions and configurations.
 */
import { encodeExtraArgs, decodeExtraArgs, ChainFamily } from "@chainlink/ccip-sdk";

console.log("=== ExtraArgs Encode/Decode Round-Trip Test ===");
console.log();

// --- Test 1: EVMExtraArgsV2 (gasLimit + allowOutOfOrderExecution) ---
console.log("--- Test 1: EVMExtraArgsV2 encode/decode ---");
try {
  const args = { gasLimit: 200_000n, allowOutOfOrderExecution: true };
  console.log("Input:", JSON.stringify(args, (_, v) => typeof v === "bigint" ? v.toString() : v));
  
  const encoded = encodeExtraArgs(args);
  console.log("Encoded:", encoded);
  
  const decoded = decodeExtraArgs(encoded, ChainFamily.EVM);
  console.log("Decoded:", JSON.stringify(decoded, (_, v) => typeof v === "bigint" ? v.toString() : v));
  
  // Verify round-trip
  const gasLimitMatch = decoded.gasLimit === args.gasLimit;
  const oooMatch = decoded.allowOutOfOrderExecution === args.allowOutOfOrderExecution;
  console.log("Round-trip gasLimit match:", gasLimitMatch);
  console.log("Round-trip allowOutOfOrderExecution match:", oooMatch);
} catch (e: unknown) {
  const err = e as Error;
  console.log("Error:", err.message);
}
console.log();

// --- Test 2: EVMExtraArgsV2 with different gas limits ---
console.log("--- Test 2: Different gas limits ---");
const gasLimits = [0n, 1n, 200_000n, 1_000_000n, 5_000_000n, 30_000_000n];
for (const gasLimit of gasLimits) {
  try {
    const args = { gasLimit, allowOutOfOrderExecution: false };
    const encoded = encodeExtraArgs(args);
    const decoded = decodeExtraArgs(encoded, ChainFamily.EVM);
    const match = decoded.gasLimit === gasLimit;
    console.log(`  gasLimit=${gasLimit.toString().padStart(12)}: encoded=${encoded.substring(0, 30)}... match=${match}`);
  } catch (e: unknown) {
    const err = e as Error;
    console.log(`  gasLimit=${gasLimit}: ERROR - ${err.message?.substring(0, 80)}`);
  }
}
console.log();

// --- Test 3: EVMExtraArgsV1 (gasLimit only, no allowOutOfOrderExecution) ---
console.log("--- Test 3: EVMExtraArgsV1 (gasLimit only) ---");
try {
  const args = { gasLimit: 300_000n };
  console.log("Input:", JSON.stringify(args, (_, v) => typeof v === "bigint" ? v.toString() : v));
  
  const encoded = encodeExtraArgs(args);
  console.log("Encoded:", encoded);
  
  const decoded = decodeExtraArgs(encoded, ChainFamily.EVM);
  console.log("Decoded:", JSON.stringify(decoded, (_, v) => typeof v === "bigint" ? v.toString() : v));
} catch (e: unknown) {
  const err = e as Error;
  console.log("Error:", err.message);
}
console.log();

// --- Test 4: Decode a known encoded extraArgs from on-chain ---
console.log("--- Test 4: Decode known on-chain extraArgs ---");
// The extraArgs from our real message (gasLimit=200000, allowOutOfOrderExecution=true)
// Let's encode and verify
try {
  const knownArgs = { gasLimit: 200_000n, allowOutOfOrderExecution: true };
  const encoded = encodeExtraArgs(knownArgs);
  console.log("Known args encoded:", encoded);
  console.log("Encoded length:", encoded.length, "chars (", (encoded.length - 2) / 2, "bytes)");
} catch (e: unknown) {
  const err = e as Error;
  console.log("Error:", err.message);
}
console.log();

console.log("=== ExtraArgs Encode/Decode Test Complete ===");
