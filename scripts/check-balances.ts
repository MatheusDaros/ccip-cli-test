import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { sepolia, avalancheFuji, arbitrumSepolia, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Error: Set the SEPOLIA_PRIVATE_KEY environment variable before running this script.');
  process.exit(1);
}

const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}` as `0x${string}`);
console.log('Wallet address:', account.address);
console.log('---');

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

// CCIP test token addresses per chain
// Source: https://docs.chain.link/ccip/test-tokens
const tokens: Record<string, Record<string, `0x${string}`>> = {
  sepolia: {
    'CCIP-BnM': '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05',
    'CCIP-LnM': '0x466D489b6d36E7E3b824ef491C225F5830E81cC1',
    'LINK': '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  },
  avalancheFuji: {
    'CCIP-BnM': '0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4',
    'CCIP-LnM': '0x70F5c5C40b873EA597776DA2C21929A8282A3b35',
    'LINK': '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
  },
  arbitrumSepolia: {
    'CCIP-BnM': '0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D',
    'CCIP-LnM': '0x139E99f0ab4084E14e6bb7DacA289a91a2d92927',
    'LINK': '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
  },
  baseSepolia: {
    'CCIP-BnM': '0x88A2d74F59a8e2e32Cf846ad38e6d4F0a4D8012c',
    'CCIP-LnM': '0xA98FA8A008371b9408195e52734b1768c0d1Cb5c',
    'LINK': '0xE4aB69C077896252FAFBD49EFD26B5D171A32410',
  },
};

const chains = [
  { name: 'Sepolia', chain: sepolia, rpc: process.env.SEPOLIA_RPC_URL!, tokenKey: 'sepolia' },
  { name: 'Avalanche Fuji', chain: avalancheFuji, rpc: 'https://api.avax-test.network/ext/bc/C/rpc', tokenKey: 'avalancheFuji' },
  { name: 'Arbitrum Sepolia', chain: arbitrumSepolia, rpc: 'https://sepolia-rollup.arbitrum.io/rpc', tokenKey: 'arbitrumSepolia' },
  { name: 'Base Sepolia', chain: baseSepolia, rpc: 'https://sepolia.base.org', tokenKey: 'baseSepolia' },
];

for (const c of chains) {
  console.log(`\n=== ${c.name} ===`);
  const client = createPublicClient({ chain: c.chain, transport: http(c.rpc) });

  try {
    const ethBal = await client.getBalance({ address: account.address });
    console.log(`  Native: ${formatEther(ethBal)} ${c.chain.nativeCurrency.symbol}`);
  } catch (e: any) {
    console.log(`  Native: error - ${e.message?.slice(0, 80)}`);
  }

  const chainTokens = tokens[c.tokenKey];
  for (const [symbol, addr] of Object.entries(chainTokens)) {
    try {
      const bal = await client.readContract({ address: addr, abi: erc20Abi, functionName: 'balanceOf', args: [account.address] });
      const decimals = await client.readContract({ address: addr, abi: erc20Abi, functionName: 'decimals' });
      console.log(`  ${symbol}: ${formatUnits(bal, decimals)}`);
    } catch (e: any) {
      console.log(`  ${symbol}: error - ${e.message?.slice(0, 80)}`);
    }
  }
}
