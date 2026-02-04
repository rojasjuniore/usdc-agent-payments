#!/usr/bin/env npx tsx
/**
 * Check USDC balance for an address on supported testnets.
 * Usage: npx tsx check_balance.ts --chain sepolia --address 0x...
 */

import { createPublicClient, http, formatUnits } from "viem";
import { sepolia, avalancheFuji, arbitrumSepolia, baseSepolia, polygonAmoy } from "viem/chains";
import { parseArgs } from "util";

// USDC contract addresses (testnet)
const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  fuji: "0x5425890298aed601595a70AB815c96711a31Bc65",
  "arbitrum-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "polygon-amoy": "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
};

const CHAINS: Record<string, typeof sepolia> = {
  sepolia,
  fuji: avalancheFuji,
  "arbitrum-sepolia": arbitrumSepolia,
  "base-sepolia": baseSepolia,
  "polygon-amoy": polygonAmoy,
};

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      chain: { type: "string", short: "c" },
      address: { type: "string", short: "a" },
    },
  });

  const chainName = values.chain?.toLowerCase();
  const address = values.address as `0x${string}`;

  if (!chainName || !address) {
    console.error("Usage: npx tsx check_balance.ts --chain <chain> --address <0x...>");
    console.error("Chains: sepolia, fuji, arbitrum-sepolia, base-sepolia, polygon-amoy");
    process.exit(1);
  }

  const chain = CHAINS[chainName];
  const usdcAddress = USDC_ADDRESSES[chainName];

  if (!chain || !usdcAddress) {
    console.error(`Unsupported chain: ${chainName}`);
    console.error("Supported: " + Object.keys(CHAINS).join(", "));
    process.exit(1);
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const balance = await client.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    });

    const formatted = formatUnits(balance, 6); // USDC has 6 decimals
    
    console.log(`Chain: ${chainName}`);
    console.log(`Address: ${address}`);
    console.log(`USDC Balance: ${formatted} USDC`);
    console.log(`Raw: ${balance.toString()} (6 decimals)`);
  } catch (error) {
    console.error("Error fetching balance:", error);
    process.exit(1);
  }
}

main();
