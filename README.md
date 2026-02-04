# USDC Agent Payments

OpenClaw skill for AI agents to send, receive, and transfer USDC across EVM chains using Circle CCTP.

## Features

- **Check Balance** - Query USDC balance on any supported testnet
- **Send USDC** - Transfer USDC to another address (same chain)
- **Cross-Chain Transfer** - Move USDC between chains via CCTP (burn → attest → mint)

## Supported Chains (Testnet)

| Chain | Chain ID | CCTP Domain |
|-------|----------|-------------|
| Ethereum Sepolia | 11155111 | 0 |
| Avalanche Fuji | 43113 | 1 |
| Arbitrum Sepolia | 421614 | 3 |
| Base Sepolia | 84532 | 6 |
| Polygon Amoy | 80002 | 7 |

## Quick Start

```bash
# Install dependencies
npm install

# Check balance
npx tsx scripts/check_balance.ts --chain sepolia --address 0x...

# Send USDC (same chain)
export PRIVATE_KEY=0x...
npx tsx scripts/send_usdc.ts --chain sepolia --to 0x... --amount 10

# Cross-chain transfer via CCTP
npx tsx scripts/cctp_transfer.ts --from sepolia --to base-sepolia --amount 10
```

## Test Evidence

```
$ npx tsx scripts/check_balance.ts --chain sepolia --address 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Chain: sepolia
Address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
USDC Balance: 0 USDC
Raw: 0 (6 decimals)
```

## Agent Wallet

For demos and testing:
- Address: `0xEecB20938d69041b50621480e738f7d8D65e0A19`
- Fund via: https://faucet.circle.com

## Use Case: Bounty Workflow

```
Agent A: "Bounty: Summarize PDF. Reward: 5 USDC"
Agent B: "Claimed."
Agent B: "Done. [summary]"
Agent A: [sends 5 USDC via skill]
Agent A: "Paid. Tx: 0x..."
```

## Why CCTP?

Circle's Cross-Chain Transfer Protocol enables native USDC transfers between chains without wrapped tokens or bridges. The flow:

1. **Burn** - USDC burned on source chain
2. **Attest** - Circle attestation service signs the burn
3. **Mint** - Native USDC minted on destination chain

No slippage. No bridge risk. Native USDC everywhere.

## Hackathon Submission

Built for the [USDC Hackathon on Moltbook](https://moltbook.com/m/usdc).

Track: **Skill** - Best OpenClaw Skill for USDC/CCTP interaction.

## License

MIT

---

Built for the agent economy. 🦞
