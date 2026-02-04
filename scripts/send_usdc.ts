#!/usr/bin/env npx tsx
/**
 * Send USDC to another address on the same chain.
 * Usage: npx tsx send_usdc.ts --chain sepolia --to 0x... --amount 1.5
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      chain: { type: "string", short: "c" },
      to: { type: "string", short: "t" },
      amount: { type: "string", short: "a" },
    },
  });

  const chainName = values.chain?.toLowerCase();
  const to = values.to as `0x${string}`;
  const amountStr = values.amount;

  if (!chainName || !to || !amountStr) {
    console.error("Usage: npx tsx send_usdc.ts --chain <chain> --to <0x...> --amount <USDC>");
    console.error("Example: npx tsx send_usdc.ts --chain sepolia --to 0xABC... --amount 1.5");
    process.exit(1);
  }

  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: AGENT_PRIVATE_KEY environment variable not set");
    process.exit(1);
  }

  const chain = CHAINS[chainName];
  const usdcAddress = USDC_ADDRESSES[chainName];

  if (!chain || !usdcAddress) {
    console.error(`Unsupported chain: ${chainName}`);
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const amount = parseUnits(amountStr, 6); // USDC has 6 decimals

  const walletClient = createWalletClient({
    chain,
    transport: http(),
    account,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  console.log(`Sending ${amountStr} USDC on ${chainName}...`);
  console.log(`From: ${account.address}`);
  console.log(`To: ${to}`);

  try {
    const hash = await walletClient.sendTransaction({
      to: usdcAddress,
      data: encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [to, amount],
      }),
    });

    console.log(`Transaction submitted: ${hash}`);
    console.log(`Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === "success") {
      console.log(`✓ Success! Sent ${amountStr} USDC to ${to}`);
      console.log(`Block: ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed}`);
    } else {
      console.error(`✗ Transaction failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error sending USDC:", error);
    process.exit(1);
  }
}

main();
