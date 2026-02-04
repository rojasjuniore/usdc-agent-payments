# CCTP Domain Reference

Circle's Cross-Chain Transfer Protocol (CCTP) uses domain IDs to identify chains.

## Testnet Domains

| Chain | Domain ID | USDC Address |
|-------|-----------|--------------|
| Ethereum Sepolia | 0 | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Avalanche Fuji | 1 | 0x5425890298aed601595a70AB815c96711a31Bc65 |
| Arbitrum Sepolia | 3 | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d |
| Base Sepolia | 6 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |
| Polygon Amoy | 7 | 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582 |

## Contract Addresses (Testnet)

### TokenMessengerV2
Used to burn USDC on source chain.

| Chain | Address |
|-------|---------|
| Ethereum Sepolia | 0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa |
| Avalanche Fuji | 0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0 |
| Others | 0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa |

### MessageTransmitterV2
Used to mint USDC on destination chain.

| Chain | Address |
|-------|---------|
| Ethereum Sepolia | 0xe737e5cebeeba77efe34d4aa090756590b1ce275 |
| Avalanche Fuji | 0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79 |
| Others | 0xe737e5cebeeba77efe34d4aa090756590b1ce275 |

## CCTP Flow

1. **Approve** - Allow TokenMessenger to spend USDC
2. **Burn** - Call `depositForBurn` on source chain
3. **Attest** - Circle observes burn, signs attestation
4. **Mint** - Call `receiveMessage` on destination chain

## Attestation API

Sandbox (testnet): `https://iris-api-sandbox.circle.com/v2/messages/{srcDomain}?transactionHash={txHash}`

Response format:
```json
{
  "messages": [{
    "message": "0x...",
    "attestation": "0x...",
    "status": "complete"
  }]
}
```

## Transfer Times

- **Fast Transfer** (minFinalityThreshold ≤ 1000): ~1-2 minutes
- **Standard Transfer** (minFinalityThreshold ≥ 2000): ~15-20 minutes

## Fees

CCTP charges a small fee deducted from the transfer amount.
- Typical: 0.0005 USDC (500 subunits)
- Set via `maxFee` parameter in `depositForBurn`

## Resources

- Circle Docs: https://developers.circle.com/cctp
- Faucet: https://faucet.circle.com
- Contract Reference: https://developers.circle.com/cctp/references/contract-addresses
