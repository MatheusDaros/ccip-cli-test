/**
 * CCIP Reverse Token Transfer Test
 *
 * Tests cross-chain token transfer in the reverse direction:
 * Sends CCIP-BnM from Avalanche Fuji back to Sepolia.
 * Also mints CCIP-BnM on Fuji via drip() if needed.
 */

import { createPublicClient, createWalletClient, http, formatEther, formatUnits, parseUnits } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { networkInfo } from '@chainlink/ccip-sdk';
import { fromViemClient, viemWallet } from '@chainlink/ccip-sdk/viem';

const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Error: Set the SEPOLIA_PRIVATE_KEY environment variable before running this script.');
  process.exit(1);
}

const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}` as `0x${string}`);
console.log('Wallet address:', account.address);

const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

const walletClient = createWalletClient({
  account,
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

// CCIP-BnM token on Avalanche Fuji
const CCIP_BnM_FUJI = '0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4' as const;

// Fuji CCIP Router
const FUJI_ROUTER = '0xF694E193200268f9a4868e4Aa017A0118C9a8177';

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

const dripAbi = [
  { name: 'drip', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
] as const;

console.log('=== CCIP Reverse Token Transfer: Fuji -> Sepolia ===\n');

// Check AVAX balance
const avaxBalance = await publicClient.getBalance({ address: account.address });
console.log(`AVAX balance on Fuji: ${formatEther(avaxBalance)}`);

// Check CCIP-BnM balance on Fuji
let bnmBalance = await publicClient.readContract({
  address: CCIP_BnM_FUJI,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`CCIP-BnM balance on Fuji: ${formatUnits(bnmBalance, 18)}`);

// Mint if needed
if (bnmBalance < parseUnits('1', 18)) {
  console.log('\nMinting CCIP-BnM on Fuji via drip()...');
  for (let i = 0; i < 2; i++) {
    const hash = await walletClient.writeContract({
      address: CCIP_BnM_FUJI,
      abi: dripAbi,
      functionName: 'drip',
      args: [account.address],
    });
    console.log(`  drip() tx ${i + 1}: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });
  }
  bnmBalance = await publicClient.readContract({
    address: CCIP_BnM_FUJI,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`Updated CCIP-BnM balance: ${formatUnits(bnmBalance, 18)}`);
}

// Initialize CCIP chain adapter for Fuji
const chain = await fromViemClient(publicClient);
const wallet = viemWallet(walletClient);

const transferAmount = parseUnits('0.5', 18);
const destInfo = networkInfo('ethereum-testnet-sepolia');

console.log(`\nSending ${formatUnits(transferAmount, 18)} CCIP-BnM from Fuji to Sepolia...`);

const message = {
  receiver: account.address,
  data: '0x' as `0x${string}`,
  tokenAmounts: [
    {
      token: CCIP_BnM_FUJI,
      amount: transferAmount,
    },
  ],
  extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: true },
};

// Fee estimate
try {
  const fee = await chain.getFee({
    router: FUJI_ROUTER,
    destChainSelector: destInfo.chainSelector,
    message,
  });
  console.log(`  Estimated fee: ${formatEther(fee)} AVAX`);
} catch (e: any) {
  console.log(`  Fee estimation failed: ${e.message?.slice(0, 300)}`);
}

// Send
try {
  const result = await chain.sendMessage({
    router: FUJI_ROUTER,
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
  address: CCIP_BnM_FUJI,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`\nFinal CCIP-BnM balance on Fuji: ${formatUnits(finalBalance, 18)}`);
