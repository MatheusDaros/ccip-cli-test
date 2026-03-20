/**
 * CCIP Token Transfer - Pay Fees in LINK
 *
 * Tests sending CCIP-BnM tokens from Sepolia to Avalanche Fuji,
 * but paying the CCIP fee in LINK instead of native ETH.
 */

import { createPublicClient, createWalletClient, http, formatEther, formatUnits, parseUnits } from 'viem';
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
const CCIP_BnM_SEPOLIA = '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05';
const LINK_SEPOLIA = '0x779877A7B0D9E8603169DdbD7836e478b4624789';

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

const chain = await fromViemClient(publicClient);
const wallet = viemWallet(walletClient);

console.log('=== CCIP Token Transfer - Pay Fees in LINK ===\n');

// Check balances
const linkBalance = await publicClient.readContract({
  address: LINK_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
const bnmBalance = await publicClient.readContract({
  address: CCIP_BnM_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`LINK balance: ${formatUnits(linkBalance, 18)}`);
console.log(`CCIP-BnM balance: ${formatUnits(bnmBalance, 18)}`);

if (bnmBalance === 0n) {
  console.log('No CCIP-BnM tokens. Run test-token-transfer.ts first to mint.');
  process.exit(0);
}

const transferAmount = parseUnits('0.25', 18);
const destInfo = networkInfo('avalanche-testnet-fuji');

console.log(`\nSending ${formatUnits(transferAmount, 18)} CCIP-BnM to Fuji, paying fee in LINK...`);

const message = {
  receiver: account.address,
  data: '0x' as `0x${string}`,
  tokenAmounts: [
    {
      token: CCIP_BnM_SEPOLIA,
      amount: transferAmount,
    },
  ],
  extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: true },
  feeToken: LINK_SEPOLIA,
};

// Fee estimate (should return fee in LINK)
try {
  const fee = await chain.getFee({
    router: SEPOLIA_ROUTER,
    destChainSelector: destInfo.chainSelector,
    message,
  });
  console.log(`  Estimated fee: ${formatUnits(fee, 18)} LINK`);
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

// Final balances
const finalLink = await publicClient.readContract({
  address: LINK_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
const finalBnm = await publicClient.readContract({
  address: CCIP_BnM_SEPOLIA,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
});
console.log(`\nFinal LINK balance: ${formatUnits(finalLink, 18)}`);
console.log(`Final CCIP-BnM balance: ${formatUnits(finalBnm, 18)}`);
console.log(`LINK spent on fee: ${formatUnits(linkBalance - finalLink, 18)}`);
