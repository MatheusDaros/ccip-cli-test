/**
 * CCIP Token Transfer Tests
 *
 * Tests cross-chain token transfers using the CCIP SDK:
 * 1. Mints CCIP-BnM test tokens via drip() on Sepolia
 * 2. Sends CCIP-BnM tokens from Sepolia to Avalanche Fuji
 * 3. Sends CCIP-BnM tokens from Sepolia to Arbitrum Sepolia
 * 4. Sends CCIP-BnM tokens from Sepolia to Base Sepolia
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

// CCIP-BnM token on Sepolia (Burn & Mint mechanism)
const CCIP_BnM_SEPOLIA = '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05' as const;

// Sepolia CCIP Router
const SEPOLIA_ROUTER = '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59';

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

const dripAbi = [
  { name: 'drip', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
] as const;

// Step 1: Check current CCIP-BnM balance and mint if needed
async function mintTokensIfNeeded(): Promise<bigint> {
  let balance = await publicClient.readContract({
    address: CCIP_BnM_SEPOLIA,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nCurrent CCIP-BnM balance: ${formatUnits(balance, 18)}`);

  if (balance < parseUnits('3', 18)) {
    console.log('Need more tokens. Calling drip() to mint CCIP-BnM...');

    // Call drip() 3 times to get enough tokens for multiple transfers
    for (let i = 0; i < 3; i++) {
      const hash = await walletClient.writeContract({
        address: CCIP_BnM_SEPOLIA,
        abi: dripAbi,
        functionName: 'drip',
        args: [account.address],
      });
      console.log(`  drip() tx ${i + 1}: ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash });
    }

    balance = await publicClient.readContract({
      address: CCIP_BnM_SEPOLIA,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });
    console.log(`Updated CCIP-BnM balance: ${formatUnits(balance, 18)}`);
  }
  return balance;
}

// Initialize CCIP chain adapter (async)
const chain = await fromViemClient(publicClient);
const wallet = viemWallet(walletClient);

// Step 2: Send CCIP-BnM tokens cross-chain
async function sendTokensCrossChain(
  destNetworkName: string,
  amount: bigint,
  label: string,
) {
  console.log(`\n--- ${label} ---`);
  console.log(`Sending ${formatUnits(amount, 18)} CCIP-BnM to ${destNetworkName}...`);

  const destInfo = networkInfo(destNetworkName);

  // Build message with token transfer
  const message = {
    receiver: account.address,
    data: '0x' as `0x${string}`,
    tokenAmounts: [
      {
        token: CCIP_BnM_SEPOLIA,
        amount: amount,
      },
    ],
    extraArgs: { gasLimit: 200_000n, allowOutOfOrderExecution: true },
  };

  // Get fee estimate first
  try {
    const fee = await chain.getFee({
      router: SEPOLIA_ROUTER,
      destChainSelector: destInfo.chainSelector,
      message,
    });
    console.log(`  Estimated fee: ${formatEther(fee)} ETH`);
  } catch (e: any) {
    console.log(`  Fee estimation failed: ${e.message?.slice(0, 200)}`);
    console.log(`  Will try sending anyway (sendMessage estimates internally)...`);
  }

  // Send the token transfer
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

    return {
      txHash: result.tx.hash,
      messageId: result.message.messageId,
      dest: destNetworkName,
      amount: formatUnits(amount, 18),
    };
  } catch (e: any) {
    console.log(`  Send error: ${e.message?.slice(0, 500)}`);
    return null;
  }
}

// Main execution
async function main() {
  console.log('=== CCIP Token Transfer Tests ===\n');

  // Step 1: Mint tokens
  const balance = await mintTokensIfNeeded();
  if (balance === 0n) {
    console.log('ERROR: Could not get CCIP-BnM tokens. Exiting.');
    return;
  }

  const transferAmount = parseUnits('0.5', 18); // 0.5 CCIP-BnM per transfer
  const results: any[] = [];

  // Step 2: Transfer to Avalanche Fuji
  const r1 = await sendTokensCrossChain(
    'avalanche-testnet-fuji',
    transferAmount,
    'Transfer 1: Sepolia -> Avalanche Fuji',
  );
  if (r1) results.push(r1);

  // Step 3: Transfer to Arbitrum Sepolia
  const r2 = await sendTokensCrossChain(
    'ethereum-testnet-sepolia-arbitrum-1',
    transferAmount,
    'Transfer 2: Sepolia -> Arbitrum Sepolia',
  );
  if (r2) results.push(r2);

  // Step 4: Transfer to Base Sepolia
  const r3 = await sendTokensCrossChain(
    'ethereum-testnet-sepolia-base-1',
    transferAmount,
    'Transfer 3: Sepolia -> Base Sepolia',
  );
  if (r3) results.push(r3);

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Successful transfers: ${results.length}/3`);
  for (const r of results) {
    console.log(`  ${r.dest}: ${r.amount} CCIP-BnM`);
    console.log(`    TX: ${r.txHash}`);
    console.log(`    Msg: ${r.messageId}`);
    console.log(`    Explorer: https://ccip.chain.link/msg/${r.messageId}`);
  }

  // Final balance check
  const finalBalance = await publicClient.readContract({
    address: CCIP_BnM_SEPOLIA,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nFinal CCIP-BnM balance on Sepolia: ${formatUnits(finalBalance, 18)}`);
}

main().catch(console.error);
