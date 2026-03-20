/**
 * CCIP LINK Token Transfer Test
 *
 * Tests cross-chain LINK token transfers using the CCIP SDK.
 * Sends LINK from Sepolia to Avalanche Fuji paying fees in native ETH.
 */

import { createPublicClient, createWalletClient, http, formatEther, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { networkInfo } from '@chainlink/ccip-sdk';
import { fromViemClient, viemWallet } from '@chainlink/ccip-sdk/viem';

const account = privateKeyToAccount(`0x${process.env.SEPOLIA_PRIVATE_KEY}`);
console.log('Wallet address:', account.address);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

const SEPOLIA_ROUTER = '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59';
const LINK_SEPOLIA = '0x779877A7B0D9E8603169DdbD7836e478b4624789';

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

const chain = await fromViemClient(publicClient);
const wallet = viemWallet(walletClient);

console.log('=== CCIP LINK Token Transfer Test ===\n');

// Check LINK balance
const linkBalance = await publicClient.readContract({
  address: LINK_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`LINK balance on Sepolia: ${formatUnits(linkBalance, 18)}`);

if (linkBalance === 0n) {
  console.log('No LINK tokens available. Exiting.');
  process.exit(0);
}

// Transfer 1 LINK to Avalanche Fuji
const transferAmount = 1000000000000000000n; // 1 LINK
const destInfo = networkInfo('avalanche-testnet-fuji');

console.log(`\nSending 1 LINK from Sepolia to Avalanche Fuji...`);

const message = {
  receiver: account.address,
  data: '0x' as `0x${string}`,
  tokenAmounts: [
    {
      token: LINK_SEPOLIA,
      amount: transferAmount,
    },
  ],
  extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: true },
};

// Fee estimate
try {
  const fee = await chain.getFee({
    router: SEPOLIA_ROUTER,
    destChainSelector: destInfo.chainSelector,
    message,
  });
  console.log(`  Estimated fee: ${formatEther(fee)} ETH`);
} catch (e: any) {
  console.log(`  Fee estimation failed: ${e.message?.slice(0, 300)}`);
}

// Send
try {
  const result = await chain.sendMessage({
    router: SEPOLIA_ROUTER,
    destChainSelector: destInfo.chainSelector,
    message,
    wallet,
  });

  console.log(`  TX Hash: ${result.tx.hash}`);
  console.log(`  Message ID: ${result.message.messageId}`);
  console.log(`  CCIP Explorer: https://ccip.chain.link/msg/${result.message.messageId}`);
} catch (e: any) {
  console.log(`  Send error: ${e.message?.slice(0, 500)}`);
}

// Final balance
const finalBalance = await publicClient.readContract({
  address: LINK_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`\nFinal LINK balance on Sepolia: ${formatUnits(finalBalance, 18)}`);
