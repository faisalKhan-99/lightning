# Solana Integration

Every trade in SolGrid settles on Solana's blockchain. This isn't a simulation of blockchain — it's real on-chain activity using Solana's devnet, the same infrastructure that powers billions of dollars in mainnet transactions.

## SPL Tokens

SolGrid uses **SPL tokens** — Solana's standard for custom tokens. SPL is to Solana what ERC-20 is to Ethereum. Familiar examples include USDC and other tokens on Solana.

In SolGrid, SPL tokens represent **energy credits**. One token equals one kilowatt-hour (kWh) of energy. The tokens use **6-decimal precision**, matching the standard used by real financial tokens like USDC. This means the smallest tradeable unit is 0.000001 kWh.

## Three On-Chain Operations

### Mint (Create Energy)
When the solar producer generates energy, new tokens are **minted** — created from nothing and added to the producer's wallet. This represents new energy entering the grid. Only the solar producer can mint, and only when it's actually generating (during daylight).

### Transfer (Trade Energy)
When a trade executes in the marketplace, tokens **transfer** from the seller's wallet to the buyer's wallet, and SOL transfers in the opposite direction. These are real Solana transactions with real signatures.

### Burn (Consume Energy)
When the smart home uses energy, tokens are **burned** — permanently destroyed. This represents energy being consumed. The tokens leave circulation, reflecting the physical reality that consumed energy is gone.

## Why Blockchain Matters

Using a real blockchain instead of a simple database gives SolGrid several properties:

- **Immutable audit trail**: Every mint, transfer, and burn is permanently recorded. You can't alter history.
- **True ownership**: Agents hold their own tokens in their own wallets. No central authority can freeze or confiscate them.
- **Verifiability**: Anyone can independently verify any transaction using a block explorer.
- **Composability**: Other programs could interact with SolGrid's tokens — the same way DeFi protocols compose on mainnet.

## Devnet

SolGrid runs on Solana's **devnet**, a testing environment that:

- Has the same features and performance as mainnet
- Uses free SOL (obtained from faucets) so there's no real money at stake
- Resets periodically, so data doesn't persist forever
- Is perfect for experimentation and hackathon projects

Devnet transactions are real blockchain transactions — they're just on a test network. The code, signatures, and verification all work identically to mainnet.

## Transaction Verification

Every trade in SolGrid produces a **Solana transaction signature** — a unique identifier like `5UxV3...7kPq`. You can take any signature from the trade feed and look it up on [Solana Explorer](https://explorer.solana.com/?cluster=devnet) to see:

- The exact token amounts transferred
- The sender and receiver wallets
- The timestamp
- The transaction status (success/failure)

This transparency is fundamental to SolGrid's design: the market is trustless because every action is independently verifiable.

## Technical Details

- **Token program**: SPL Token (standard Solana token program)
- **Decimal precision**: 6 decimals (1 token = 1,000,000 base units)
- **Network**: Solana Devnet
- **Confirmation**: Transactions use "confirmed" commitment level for speed
- **Wallet management**: Each agent has its own Solana keypair, managed by the engine
