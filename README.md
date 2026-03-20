# Sample Hardhat 3 Beta Project (`node:test` and `viem`)

This project showcases a Hardhat 3 Beta project using the native Node.js test runner (`node:test`) and the `viem` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/).
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

### Send a CCIP message (Viem integration)

This project includes a script that uses the [CCIP SDK Viem integration](https://docs.chain.link/ccip/tools/sdk/guides/viem-integration) to send a cross-chain message from Sepolia to Avalanche Fuji.

The script uses two adapters from `@chainlink/ccip-sdk/viem`:

- `fromViemClient(publicClient)` — wraps a viem `PublicClient` as an `EVMChain` for read operations.
- `viemWallet(walletClient)` — wraps a viem `WalletClient` as a `Signer` for write operations (`sendMessage`, `execute`).

#### Getting the required environment variables

**`SEPOLIA_RPC_URL`** — An RPC endpoint for the Sepolia testnet. You can get one for free from any of these providers:

- **[Alchemy](https://www.alchemy.com/)** — Create a free account, create an app on the Sepolia network, and copy the HTTPS URL.
- **[Infura](https://www.infura.io/)** — Sign up for a free plan, create a new API key, and use `https://sepolia.infura.io/v3/YOUR_API_KEY`.
- **[Chainstack](https://chainstack.com/)** — Create a free account, deploy a Sepolia node, and copy the HTTPS endpoint.

**`SEPOLIA_PRIVATE_KEY`** — The private key of a wallet with Sepolia ETH to pay for gas. To get testnet ETH:

- **[Chainlink Faucet](https://faucets.chain.link/sepolia)** — Connect your wallet to receive Sepolia ETH.
- **[Alchemy Sepolia Faucet](https://sepoliafaucet.com/)** — Requires an Alchemy account.
- **[Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)** — No account required.

> ⚠️ **Never use a private key that holds real funds.** Create a dedicated development wallet for testnet use only.

To export your private key from MetaMask: Account Details → Show Private Key.

#### Running the script

Set the required environment variables and execute:

```shell
export SEPOLIA_RPC_URL="https://your-sepolia-rpc-url"
export SEPOLIA_PRIVATE_KEY="your-private-key"
npx tsx scripts/send-ccip-message.ts
```
