/**
 * Send CCIP messages to different destination chains from Sepolia
 * to leave on-chain traces across multiple lanes.
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

console.log("=== Sending CCIP Messages to Multiple Destination Chains ===");
console.log("Sender:", account.address);
console.log();

const destinations = [
  {
    name: "Arbitrum Sepolia",
    chainName: "ethereum-testnet-sepolia-arbitrum-1",
    data: toHex("Cross-chain message to Arbitrum Sepolia"),
  },
  {
    name: "Base Sepolia",
    chainName: "ethereum-testnet-sepolia-base-1",
    data: toHex("Cross-chain message to Base Sepolia"),
  },
];

const results: Array<{
  dest: string;
  messageId: string;
  txHash: string;
  explorer: string;
}> = [];

for (const dest of destinations) {
  console.log(`--- Sending to ${dest.name} ---`);
  try {
    const destSelector = networkInfo(dest.chainName).chainSelector;
    console.log(`  Chain selector: ${destSelector}`);

    const request = await chain.sendMessage({
      router: SEPOLIA_ROUTER,
      destChainSelector: destSelector,
      message: {
        receiver: account.address,
        data: dest.data as `0x${string}`,
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
      dest: dest.name,
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
}

console.log("=== Summary ===");
for (const r of results) {
  console.log(`[${r.dest}] Message ID: ${r.messageId}`);
  console.log(`  TX: ${r.txHash}`);
  console.log(`  Explorer: ${r.explorer}`);
}
console.log(`\nTotal messages sent to other chains: ${results.length}`);
