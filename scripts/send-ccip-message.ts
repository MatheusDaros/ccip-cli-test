import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { fromViemClient, viemWallet } from "@chainlink/ccip-sdk/viem";
import { networkInfo } from "@chainlink/ccip-sdk";

// --- Configuration ---
// Replace with your own values
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error(
    "Error: Set the SEPOLIA_PRIVATE_KEY environment variable before running this script."
  );
  process.exit(1);
}

// CCIP router address on Sepolia
const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";

// Destination: Avalanche Fuji
const destChainSelector =
  networkInfo("avalanche-testnet-fuji").chainSelector;

// --- Viem clients ---
const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, "")}`);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
  account,
});

// --- CCIP SDK viem integration ---
const chain = await fromViemClient(publicClient);

console.log("Connected to chain via CCIP SDK viem adapter");
console.log("Sender:", account.address);
console.log("Destination chain selector:", destChainSelector);

// Build a simple text message (no token transfer)
const message = {
  receiver: account.address, // sending to self on the destination chain
  data: "0x" as `0x${string}`, // empty extra data
  tokenAmounts: [], // no token transfers
  extraArgs: { gasLimit: 200_000n },
};

console.log("Sending CCIP message from Sepolia to Avalanche Fuji...");

const request = await chain.sendMessage({
  router: SEPOLIA_ROUTER,
  destChainSelector,
  message,
  wallet: viemWallet(walletClient),
});

console.log("Message ID:", request.message.messageId);
console.log("Transaction hash:", request.tx.hash);
console.log(
  "Track at: https://ccip.chain.link/msg/" + request.message.messageId
);
