# CCIP SDK Feedback Form — `@chainlink/ccip-sdk` v1.3.0

---

## Section 1: Reviewer Profile

- **Experience Level**: Intermediate Solidity / TypeScript developer
- **Primary Library**: viem v2.47.5 + Hardhat 3 Beta
- **Time Spent**: ~2 days of experimentation
- **Environment**: Node.js v22.12.0, pnpm 10.x, TypeScript 5.8.3

---

## Section 2: Integration Context

### Features Tested

- [x] Client Initialization (`fromViemClient`, `viemWallet`)
- [x] Fee Estimation (`getFee`)
- [x] Message Building (`sendMessage`)
- [x] Status Tracking (`getMessageById`)
- [x] Supported Networks (`networkInfo`, `supportedChains`, `getOnRampForRouter`, `getOffRampsForRouter`)
- [x] ExtraArgs Encoding (`encodeExtraArgs`, `decodeExtraArgs`)
- [x] Explorer Utilities (`getCCIPExplorerUrl`, `getCCIPExplorerLinks`)
- [x] Lane Validation (multi-destination onRamp/offRamp lookup)
- [x] Fee Comparison (across 9 different message configurations)
- [x] Token Transfers (`sendMessage` with `tokenAmounts` for CCIP-BnM burn & mint)

### Chain Pairs Tested

- **Source Chains**: Ethereum Sepolia, Avalanche Fuji
- **Destination Chains**: Avalanche Fuji, Arbitrum Sepolia, Base Sepolia, Ethereum Sepolia

### Transaction Details

**7 messaging-only cross-chain messages sent:**

| # | Variant | Destination | TX Hash | Message ID | Status |
|---|---|---|---|---|---|
| 1 | Empty data, gasLimit=200k | Fuji | `0x1b5ded...5db0` | `0xd08d41...3a3ae` | SUCCESS (807s) |
| 2 | Custom text data | Fuji | `0x934108...5db0` | `0xdc364b...9156` | SENT |
| 3 | High gas (500k) + out-of-order | Fuji | `0x65e075...70f2` | `0x4df949...cadc` | SENT |
| 4 | Large payload (512 bytes) | Fuji | `0x392199...c8f0` | `0x39dfd1...cbb6` | SENT |
| 5 | Minimal (SDK defaults) | Fuji | `0x2cae6e...18ae` | `0x36343b...b7c6` | SENT |
| 6 | Text data | Arbitrum Sepolia | `0xfcb598...42e9` | `0x38ab73...ac57` | SENT |
| 7 | Text data | Base Sepolia | `0xf4a30f...7bdb` | `0xbe3314...9cef` | SENT |

**5 token transfer messages (CCIP-BnM):**

| # | Direction | Amount | Fee | TX Hash | Message ID |
|---|---|---|---|---|---|
| 8 | Sepolia → Fuji | 0.5 BnM | 0.000120 ETH | `0x0ad511...d87f` | `0xcab412...377f` |
| 9 | Sepolia → Arb Sepolia | 0.5 BnM | 0.000134 ETH | `0x25fe2a...22c3` | `0x39aea5...318c` |
| 10 | Sepolia → Base Sepolia | 0.5 BnM | 0.000238 ETH | `0xd6ada8...0452` | `0x867609...1b97` |
| 11 | Fuji → Sepolia (reverse) | 0.5 BnM | 0.158682 AVAX | `0xe95c15...e6fd` | `0xac3112...ff59` |
| 12 | Sepolia → Fuji (LINK fee) | 0.25 BnM | 0.025586 LINK | `0x4ddee6...89f2` | `0x433aab...6c40` |

**Additional on-chain traces:**
- 3x `drip()` mints of CCIP-BnM on Sepolia
- 2x `drip()` mints of CCIP-BnM on Fuji
- 1x failed LINK-as-token transfer attempt (LINK is not a supported CCIP transferable token on the Sepolia→Fuji lane)

**Primary CCIP Explorer link**: https://ccip.chain.link/msg/0xd08d412924f27d9622226163a71cc73edfa9c12efae5c57a70e0e9883c23a3ae

---

## Section 3: DevX Assessment

### 3.1 Installation — Score: 3/5

**What worked:**
- `pnpm install` completed in **1.8 seconds** (330 packages, all cached). Clean lockfile resolution.
- `@chainlink/ccip-sdk` v1.3.0 installed alongside `viem@^2.47.5` and `hardhat@^3.2.0` without peer dependency conflicts.
- `node_modules` total size: **510 MB** — reasonable for a Hardhat 3 + CCIP project.

**What didn't:**
- **Ethers.js v6 is a hard runtime dependency** of `@chainlink/ccip-sdk`, even when using the Viem adapter. Running `pnpm ls --depth=5 | grep ethers` shows `ethers 6.16.0` pulled in as a direct dependency of the SDK, along with dozens of `@ethersproject/*` packages (v5.8.x). This is the single biggest friction point for Viem-only projects — you're bundling two competing Ethereum libraries.
- **Heavy multi-chain dependencies**: The SDK bundles `@aptos-labs/ts-sdk`, `@coral-xyz/anchor`, `@solana/web3.js`, `@mysten/sui`, `@ton/ton`, and others as **non-optional** dependencies. For an EVM-only project, this is pure dead weight. These should be optional peer dependencies.
- The `ws` package shows a peer dependency warning: `unmet peer utf-8-validate@^5.0.2: found 6.0.6`.
- Several transitive dependency type errors surface during strict `tsc --noEmit` (from `@aptos-labs/ts-sdk`, `@mysten/sui`, `micro-memoize`). These don't block compilation with `skipLibCheck: true` but are noisy for projects with strict type checking.

### 3.2 Type Safety — Score: 4/5

**What worked:**
- Imports from `@chainlink/ccip-sdk` and `@chainlink/ccip-sdk/viem` are well-typed. The package uses proper `exports` map with `.d.ts` type declarations.
- `fromViemClient(publicClient)` returns an `EVMChain` object — clearly typed with full method autocomplete.
- The `MessageInput` type **correctly enforces** `receiver` as required. Omitting it triggers a clear compile-time error: `Property 'receiver' is missing in type '...' but required in type '{ receiver: BytesLike; ... }'`. The error message is specific and actionable.
- `sendMessage` returns `CCIPRequest` with `request.message.messageId` (string) and `request.tx.hash` (string) — well-typed, no `any`.
- `ExtraArgs` is a discriminated union (`EVMExtraArgsV1 | EVMExtraArgsV2 | GenericExtraArgsV3 | SVMExtraArgsV1 | SuiExtraArgsV1`) with clear JSDoc comments. `gasLimit` is typed as `bigint`.
- `MessageStatus` and `ExecutionState` are typed const enums with clear values (`SENT`, `SOURCE_FINALIZED`, `COMMITTED`, `BLESSED`, `SUCCESS`, `FAILED`, etc.).

**What didn't:**
- `networkInfo()` accepts `bigint | number | string` — there's **no autocomplete** for network names. You have to know the exact string (e.g., `"avalanche-testnet-fuji"`) or it throws at runtime. A union literal type or enum for known network names would greatly improve DX.
- Passing `number` instead of `bigint` for `gasLimit` (e.g., `{ gasLimit: 200000 }`) does **not** produce a compile-time error when used inside `MessageInput` (because `extraArgs` is `Partial<ExtraArgs>` and TypeScript's structural typing allows `number` where `bigint` is expected in some union contexts). This will fail at runtime instead.
- `fromViemClient()` has a strict type constraint — passing a plain `createPublicClient()` (without explicit `account: undefined`) triggers a type error about the `account` property. The Wagmi integration docs acknowledge this and provide a workaround (`toGenericPublicClient` cast), but it's still friction.
- The `wallet` parameter in `sendMessage` is typed as `unknown` in the `Chain` base class. The actual Viem adapter `viemWallet()` return type is inferred, but the interface itself doesn't enforce the wallet type.

### 3.3 Abstraction Level — Score: 5/5

**What worked:**
- `sendMessage` is a single async call that wraps: fee estimation → approval (if needed) → `ccipSend` transaction → parsing the `CCIPSendRequested` event → returning a typed `CCIPRequest`. This is a massive improvement over raw contract calls.
- `fromViemClient` + `viemWallet` adapters are clean. Two lines to go from standard Viem clients to SDK-compatible objects.
- `networkInfo("avalanche-testnet-fuji").chainSelector` removes the need to look up chain selectors manually — intuitive API.
- Fee estimation is automatic inside `sendMessage` when not explicitly provided. You can also call `getFee` independently.
- The `generateUnsignedSendMessage` alternative gives advanced users full control without the wallet abstraction.

**No complaints here — the abstraction level is well-calibrated.**

### 3.4 Error Messages — Score: 3/5

**Test results:**

| Scenario | Error Type | Message Quality |
|---|---|---|
| Invalid router address | `Error` (generic ethers) | `"could not decode result data (value="0x", info={"method":"getFee",...}, code=BAD_DATA)"` — **Opaque**. No CCIP context. A developer unfamiliar with ABI encoding would not know this means "the address isn't a CCIP router." |
| Invalid dest chain selector (123n) | `CCIPChainNotFoundError` | `"Chain not found: 123"` — **Good**. CCIP-specific, clear, includes the invalid value. |
| Extremely low gas limit (1n) | No error | `getFee` succeeds and returns a valid fee. **No client-side validation.** A `gasLimit: 1n` message will fail on the destination chain, but the SDK doesn't warn. |
| Insufficient funds (empty wallet) | `Error` (generic ethers) | `"insufficient funds (transaction={...}, code=INSUFFICIENT_FUNDS)"` — **Adequate** but not CCIP-specific. The error comes from ethers internals, not the SDK. |

**Summary:** SDK-originated errors (like `CCIPChainNotFoundError`) are excellent — typed, specific, include context. But many error paths fall through to raw ethers.js errors that lack CCIP context. The invalid router case is the worst offender: it should throw something like `CCIPContractNotRouterError`.

---

## Section 4: Technical Workflow

### 4.1 Fee Estimation (`getFee`)

- `getFee` is easy to discover — it's on the `Chain` class and takes the same `SendMessageOpts` as `sendMessage` (minus `approveMax`).
- Returns a **single `bigint`** representing the fee in the native token's smallest unit (wei). There is **no LINK vs. native breakdown**. The fee token is controlled by `message.feeToken` (native if omitted).
- The API response (via `getMessageById`) shows the actual fee charged: `236040065245694 wei` (~0.000236 ETH). The `getFee` call returned `236040065245694 wei` — **exact match** to the actual on-chain fee.
- `getTotalFeesEstimate` exists for more detailed fee info (includes `tokenTransferFee` for token transfers), but it's not prominently documented.

**Fee comparison across configurations** (Sepolia → Fuji):

| Configuration | Fee (ETH) |
|---|---|
| gasLimit=0 | 0.000234715807930398 |
| gasLimit=200k (default) | 0.000236040065245694 |
| gasLimit=1M | 0.000241337094506882 |
| gasLimit=5M | ERROR (revert) |
| 32-byte data | 0.000236043455344422 |
| 256-byte data | 0.000236067186035512 |
| 1024-byte data | 0.000236148548404964 |
| allowOutOfOrderExecution=true | 0.000236040065245694 |
| allowOutOfOrderExecution=false | 0.000236040065245694 |

**Observations:** Gas limit has the biggest impact on fees (~2.2% increase from 200k to 1M gas). Data size has minimal impact (~0.05% for 1KB). `allowOutOfOrderExecution` has zero fee impact. Very high gas limits (5M) cause the router to revert — the SDK doesn't validate this upfront.

### 4.2 ExtraArgs Configuration

- The `extraArgs` field accepts an object like `{ gasLimit: 200_000n }` or `{ gasLimit: 200_000n, allowOutOfOrderExecution: true }`. The SDK auto-encodes it into the correct format. This is **significantly easier** than manually encoding `Client.EVMExtraArgsV2` in Solidity.
- `gasLimit` must be `bigint` — TypeScript won't always catch `number` mistakes at compile time (see Section 3.2).
- There's **no validation** of the gas limit value. Passing `1n` is accepted silently. Passing `5_000_000n` causes the CCIP router to revert.
- Default behavior when `extraArgs` is omitted: the SDK applies sensible defaults. But the defaults aren't documented clearly — you have to read the source to know what `gasLimit` is used if omitted.
- `allowOutOfOrderExecution` defaults to `true` when not specified (confirmed in the API response for our message).
- `encodeExtraArgs` / `decodeExtraArgs` round-trip works perfectly. Supports both V1 (gasLimit only) and V2 (gasLimit + allowOutOfOrderExecution). The `_tag` field in decoded output (`EVMExtraArgsV1` vs `EVMExtraArgsV2`) makes version identification easy.

### 4.3 Token Transfers

- Token transfers use the same `sendMessage` API with a `tokenAmounts` array specifying `{ token, amount }`. The SDK handles ERC-20 approval automatically (via `approveMax` option).
- Tested CCIP-BnM (Burn & Mint) token across 4 lanes: Sepolia→Fuji, Sepolia→Arbitrum Sepolia, Sepolia→Base Sepolia, and Fuji→Sepolia (reverse direction). All 5 transfers succeeded.
- Fee estimation via `getFee` was accurate for token transfers too — the returned fee matched the on-chain charge exactly.
- Fees vary significantly by destination: Sepolia→Fuji was cheapest (0.000120 ETH), Sepolia→Base Sepolia was most expensive (0.000238 ETH), and Fuji→Sepolia cost 0.158682 AVAX.
- Paying fees in LINK instead of native token works seamlessly — just set `feeToken` to the LINK address. The SDK auto-approves LINK spending on the router.
- Attempted to transfer LINK as a token (not as fee) — this failed with `"missing revert data"` during `estimateGas`. LINK is not a supported CCIP transferable token on the Sepolia→Fuji lane. The error message is opaque; ideally the SDK would check the supported token list before attempting the transfer.
- Delivery times for token transfers: Fuji→Sepolia was fastest (~177s), Sepolia→Fuji ranged from ~891s to ~1095s, Sepolia→Arbitrum Sepolia was ~1078s.

### 4.4 Status Tracking

- `getMessageById(messageId)` returns a `CCIPRequest` with a `metadata` field containing `status`, `deliveryTime`, etc. This uses the CCIP API under the hood.
- Status values are well-typed: `SENT`, `SOURCE_FINALIZED`, `COMMITTED`, `BLESSED`, `SUCCESS`, `FAILED`, `VERIFYING`, `VERIFIED`, `UNKNOWN`.
- There is **no dedicated polling/subscription method** (e.g., `waitForStatus` or `onStatusChange`). You must implement your own polling loop. The `waitFinalized` method exists but only handles source-chain finality, not cross-chain delivery.
- Our first message reached `SUCCESS` after **807 seconds** (~13.5 minutes) on Sepolia → Fuji. This is consistent with expected testnet delivery times.
- Delivery time is returned as a `bigint` in milliseconds via `metadata.deliveryTime` (e.g., `807000n`).
- `metadata.receiptTransactionHash` provides the destination chain tx hash once delivered (e.g., `0xe4e1c654b3c995691b8b2e6f8df37ef13bd5acf39ec3081aea5b7db4f9bf9151` for our Fuji delivery).

---

## Section 5: Documentation

### 5.1 Comprehensibility — Score: 4/5

- The **Viem Integration guide** (https://docs.chain.link/ccip/tools/sdk/guides/viem-integration) is excellent — copy-paste-ready examples for `fromViemClient`, `viemWallet`, unsigned transactions, browser wallets, and Wagmi integration.
- The **Quick Start** example on the main SDK page uses `EVMChain.fromUrl()` (ethers-based) rather than the Viem adapter. A developer on a Viem project has to navigate to a separate guide page.
- The **chain selectors** concept is well-explained with `networkInfo()` usage examples.
- **Error handling** section shows typed catch patterns with `CCIPMessageNotFoundInTxError` — helpful but only covers two error types.

### 5.2 Gaps

- The docs reference SDK version **1.2.1** while npm has **1.3.0**. Version mismatch could confuse developers checking for breaking changes.
- No docs for `getTotalFeesEstimate` (the detailed fee breakdown method).
- No "list all supported networks" example. The `supportedChains` export returns chain family classes, not a list of network names. A developer who wants to enumerate valid destinations must consult the CCIP directory page separately.
- The `getMessageById` method and its `metadata.status` field aren't documented in the main "Status Tracking" section of the SDK docs.
- `extraArgs` defaults are not documented. "What happens if I omit `gasLimit`?" requires reading source code.

### 5.3 Comparison with Existing Script

The `scripts/send-ccip-message.ts` in this repo follows the Viem integration guide closely. The only things the developer had to figure out independently:
1. The CCIP router address for Sepolia — not provided by the SDK or its docs. Found on the CCIP directory page.
2. The `.envrc` pattern for managing private keys — the docs suggest `hardhat-keystore` but the script uses plain env vars.
3. The `"0x" as \`0x\${string}\`` cast for the `data` field — needed because `BytesLike` from ethers doesn't match viem's hex string type.

---

## Section 6: Bug Reporting

### Bug 1: Invalid Dest Chain Selector Returns Zero Address Instead of Error

**Expected**: `getOnRampForRouter(router, 999999999n)` should throw `CCIPLaneNotFoundError` for an invalid destination selector.

**Actual**: Returns `0x0000000000000000000000000000000000000000` silently. A developer checking lane validity would get a false positive.

**Console output**:
```text
Sepolia -> 999999999 (invalid): VALID (onRamp: 0x0000000000000000000000000000000000000000)
```

**Reproducibility**: 100% — consistent across runs.

**Severity**: Low (workaround: check for zero address), but it violates the principle of least surprise.

### Note on Previously Reported Issues

**`getCCIPExplorerLinks`** and **`getMessagesInTx`** were initially reported as bugs but were actually usage errors:
- `getCCIPExplorerLinks` expects a `CCIPRequest` object, not a plain message ID string. Use `getCCIPExplorerUrl('msg', messageId)` instead for standalone lookups. The two-argument API `(type, value)` isn't obvious from the function name.
- `getMessagesInTx` works correctly when called with a tx hash string directly (e.g., `chain.getMessagesInTx('0x1b5...')`), not as an object `{ txHash, router }`. The confusion came from the API surface not being intuitive.

Neither are bugs, but both highlight that the API could be more self-documenting.

### Bug 2: `fromViemClient` Type Error with Standard `createPublicClient`

**Expected**: `fromViemClient(createPublicClient({ chain: sepolia, transport: http() }))` should compile cleanly.

**Actual**: TypeScript error: `Types of property 'account' are incompatible. Type '{ address: undefined; type: "json-rpc"; }' is not assignable to type 'undefined'.`

**Workaround**: Cast the client or add explicit generic parameters. The Wagmi docs show a `toGenericPublicClient` helper for this.

**Reproducibility**: 100% with `tsc --noEmit` (not visible at runtime).

**Severity**: Low (doesn't block execution, but confusing for new users).

---

## Section 7: Strategic Feedback

### 7.1 Friction Points

1. **Ethers.js as a hard dependency in a Viem-first world**: The biggest friction point. The SDK internally uses ethers.js for ABI encoding, provider interactions, and error types. When using the Viem adapter, errors still come wrapped in ethers types (`code=BAD_DATA`, `code=INSUFFICIENT_FUNDS`). This leaks the abstraction — a Viem user shouldn't need to understand ethers error shapes.

2. **Multi-chain dependency bloat**: Installing `@aptos-labs/ts-sdk`, `@coral-xyz/anchor`, `@solana/web3.js`, `@mysten/sui`, and `@ton/ton` for an EVM-only project adds ~200MB+ of unused code. These should be optional peer dependencies or the SDK should be split into `@chainlink/ccip-sdk-evm`, `@chainlink/ccip-sdk-solana`, etc.

3. **No network name autocomplete**: `networkInfo("avalanche-testnet-fuji")` works, but names are unpredictable — Arbitrum Sepolia is `"ethereum-testnet-sepolia-arbitrum-1"`, not `"arbitrum-testnet-sepolia"`. BSC testnet is `"binance_smart_chain-testnet"` (with underscore). Without a TypeScript union type or a `listNetworks()` method, discovering the correct name requires trial-and-error or looking up by chain ID: `networkInfo(421614).name`.

4. **Silent acceptance of invalid parameters**: `gasLimit: 1n` passes `getFee` without warning. An invalid dest chain selector returns a zero address from `getOnRampForRouter` instead of throwing. These should be caught early with validation.

### 7.2 "Aha!" Moments

1. **`fromViemClient` + `viemWallet` adapters**: Two lines of code to bridge Viem clients into the CCIP SDK. This is exactly the right level of integration — no need to replace your existing setup.

2. **`sendMessage` handling everything**: Fee estimation, approval, transaction submission, and event parsing in a single call. Going from "I want to send a message" to "here's the message ID" is remarkably smooth.

3. **`networkInfo()` for chain selectors**: Eliminates the need to look up magic numbers. `networkInfo("avalanche-testnet-fuji").chainSelector` is readable and self-documenting.

4. **`getMessageById` with API metadata**: Being able to check message status with just the message ID (no need to connect to the destination chain) is convenient. The `metadata.status` field tracks the full lifecycle.

5. **`encodeExtraArgs` / `decodeExtraArgs`**: Clean round-trip encoding for extraArgs. The discriminated `_tag` field (`EVMExtraArgsV1` vs `EVMExtraArgsV2`) makes version handling straightforward.

6. **Multi-lane support**: Sending to Fuji, Arbitrum Sepolia, and Base Sepolia all worked with the same API — just swap the `destChainSelector`. The SDK handles router differences transparently.

7. **Token transfers via `tokenAmounts`**: The same `sendMessage` API handles token transfers — just add a `tokenAmounts` array. The SDK auto-approves the token on the router, estimates fees including token transfer costs, and returns the same typed `CCIPRequest`. No separate "transfer" method needed.

8. **LINK fee payment**: Switching from native ETH fees to LINK fees is a one-line change (`feeToken: LINK_ADDRESS`). The SDK handles LINK approval on the router automatically.

### 7.3 Comparison

No prior experience with other cross-chain SDKs (Wormhole SDK, LayerZero, etc.) to compare against. Within the Chainlink ecosystem, the CCIP SDK is a significant improvement over raw `IRouterClient` contract calls — the message building, fee estimation, and status tracking abstractions save considerable development time.

---

## Section 8: Quality of Life Score

### Overall Score: 4/5

**Reasoning:**
- The core workflow (init → build message → send → track) is smooth and well-typed.
- The Viem adapter pattern is a smart design choice that doesn't force library migration.
- Fee estimation accuracy is excellent (exact match with on-chain fee).
- Token transfers work seamlessly through the same `sendMessage` API — no separate method or complex setup needed.
- Deductions for: ethers.js dependency bloat, multi-chain dependency weight, silent parameter validation failures, and error messages that leak ethers internals.

### Would I Recommend for Production?

**Yes, with caveats:**
- **For prototyping and testnet work**: Strongly recommended. The `sendMessage` abstraction and status tracking save hours of boilerplate.
- **For production**: Recommended if you accept the ethers.js dependency overhead. Monitor bundle size if targeting browser environments. The error handling gaps (invalid router, zero-address responses) should be wrapped with your own validation layer. Token transfers (burn & mint) worked reliably across multiple lanes in testing.
- **For Viem-only stacks**: Recommended with the understanding that ethers types will leak into error handling. Consider wrapping SDK calls with try/catch that normalizes error shapes.
