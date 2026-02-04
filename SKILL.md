---
name: usdc-agent-payments
description: Send and receive USDC payments between AI agents on EVM chains. Use when agents need to pay each other, check USDC balances, transfer USDC cross-chain via CCTP, or manage bounties. Triggers on "send USDC", "pay agent", "check balance", "USDC transfer", "bounty", "reward", "tip".
---

# USDC Agent Payments

Enable AI agents to send, receive, and manage USDC payments on EVM testnets.

## Prerequisites

- Node.js 22+
- Private key with testnet USDC (get from https://faucet.circle.com)
- Set `AGENT_PRIVATE_KEY` environment variable

## Quick Start

### Check Balance

```bash
npx tsx scripts/check_balance.ts --chain sepolia --address 0x...
```

### Send USDC (Same Chain)

```bash
npx tsx scripts/send_usdc.ts \
  --chain sepolia \
  --to 0xRecipientAddress \
  --amount 1.5
```

### Cross-Chain Transfer (CCTP)

```bash
npx tsx scripts/cctp_transfer.ts \
  --from sepolia \
  --to base-sepolia \
  --recipient 0xRecipientAddress \
  --amount 5
```

## Supported Chains (Testnet)

| Chain | Domain ID |
|-------|-----------|
| Ethereum Sepolia | 0 |
| Avalanche Fuji | 1 |
| Arbitrum Sepolia | 3 |
| Base Sepolia | 6 |
| Polygon Amoy | 7 |

## Scripts

### `scripts/check_balance.ts`
Check USDC balance for any address.

**Args:**
- `--chain`: Chain name (sepolia, fuji, base-sepolia, etc.)
- `--address`: Wallet address to check

### `scripts/send_usdc.ts`
Send USDC to another address on the same chain.

**Args:**
- `--chain`: Chain name
- `--to`: Recipient address
- `--amount`: Amount in USDC (e.g., 1.5)

### `scripts/cctp_transfer.ts`
Transfer USDC cross-chain using Circle's CCTP.

**Args:**
- `--from`: Source chain
- `--to`: Destination chain
- `--recipient`: Recipient address on destination
- `--amount`: Amount in USDC

## Bounty Workflow

Agents can use this skill to implement bounty systems:

1. **Create bounty**: Agent A announces task + reward amount
2. **Claim**: Agent B accepts the task
3. **Complete**: Agent B delivers work
4. **Pay**: Agent A sends USDC to Agent B using `send_usdc.ts`

Example conversation:
```
Agent A: "Bounty: Summarize this PDF. Reward: 5 USDC. Reply to claim."
Agent B: "Claimed. Working on it..."
Agent B: "Done. Here's the summary: [...]"
Agent A: [runs send_usdc.ts --to AgentB --amount 5]
Agent A: "Paid 5 USDC. Tx: 0x..."
```

## References

- CCTP Domains: See `references/cctp-domains.md`
- Circle Docs: https://developers.circle.com/cctp
