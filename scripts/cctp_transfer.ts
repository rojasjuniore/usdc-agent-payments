#!/usr/bin/env npx tsx
/**
 * Transfer USDC cross-chain using Circle's CCTP.
 * Usage: npx tsx cctp_transfer.ts --from sepolia --to base-sepolia --recipient 0x... --amount 5
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, avalancheFuji, arbitrumSepolia, baseSepolia, polygonAmoy } from "viem/chains";
import { parseArgs } from "util";

// Chain configurations
interface ChainConfig {
  chain: typeof sepolia;
  domain: number;
  usdc: `0x${string}`;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    chain: sepolia,
    domain: 0,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  },
  fuji: {
    chain: avalancheFuji,
    domain: 1,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
    messageTransmitter: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
  },
  "arbitrum-sepolia": {
    chain: arbitrumSepolia,
    domain: 3,
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  },
  "base-sepolia": {
    chain: baseSepolia,
    domain: 6,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  },
  "polygon-amoy": {
    chain: polygonAmoy,
    domain: 7,
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  },
};

const APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const DEPOSIT_FOR_BURN_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    outputs: [],
  },
] as const;

const RECEIVE_MESSAGE_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

interface AttestationMessage {
  message: string;
  attestation: string;
  status: string;
}

interface AttestationResponse {
  messages: AttestationMessage[];
}

async function getAttestation(srcDomain: number, txHash: string): Promise<AttestationMessage> {
  console.log("Waiting for attestation (this may take 1-3 minutes)...");
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${srcDomain}?transactionHash=${txHash}`;
  
  while (true) {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        const data = (await response.json()) as AttestationResponse;
        if (data?.messages?.[0]?.status === "complete") {
          console.log("Attestation received!");
          return data.messages[0];
        }
      }
      
      process.stdout.write(".");
      await new Promise(r => setTimeout(r, 5000));
    } catch {
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

function addressToBytes32(address: string): `0x${string}` {
  return `0x000000000000000000000000${address.slice(2)}` as `0x${string}`;
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      from: { type: "string", short: "f" },
      to: { type: "string", short: "t" },
      recipient: { type: "string", short: "r" },
      amount: { type: "string", short: "a" },
    },
  });

  const fromChain = values.from?.toLowerCase();
  const toChain = values.to?.toLowerCase();
  const recipient = values.recipient as `0x${string}`;
  const amountStr = values.amount;

  if (!fromChain || !toChain || !recipient || !amountStr) {
    console.error("Usage: npx tsx cctp_transfer.ts --from <chain> --to <chain> --recipient <0x...> --amount <USDC>");
    console.error("Example: npx tsx cctp_transfer.ts --from sepolia --to base-sepolia --recipient 0xABC... --amount 5");
    process.exit(1);
  }

  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: AGENT_PRIVATE_KEY environment variable not set");
    process.exit(1);
  }

  const srcConfig = CHAIN_CONFIGS[fromChain];
  const dstConfig = CHAIN_CONFIGS[toChain];

  if (!srcConfig || !dstConfig) {
    console.error(`Unsupported chain(s). Supported: ${Object.keys(CHAIN_CONFIGS).join(", ")}`);
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const amount = parseUnits(amountStr, 6);
  const maxFee = 500n; // 0.0005 USDC

  const srcWallet = createWalletClient({
    chain: srcConfig.chain,
    transport: http(),
    account,
  });

  const srcPublic = createPublicClient({
    chain: srcConfig.chain,
    transport: http(),
  });

  const dstWallet = createWalletClient({
    chain: dstConfig.chain,
    transport: http(),
    account,
  });

  const dstPublic = createPublicClient({
    chain: dstConfig.chain,
    transport: http(),
  });

  console.log(`\n=== CCTP Cross-Chain Transfer ===`);
  console.log(`From: ${fromChain} (domain ${srcConfig.domain})`);
  console.log(`To: ${toChain} (domain ${dstConfig.domain})`);
  console.log(`Amount: ${amountStr} USDC`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Sender: ${account.address}\n`);

  // Step 1: Approve
  console.log("Step 1/4: Approving USDC...");
  const approveHash = await srcWallet.sendTransaction({
    to: srcConfig.usdc,
    data: encodeFunctionData({
      abi: APPROVE_ABI,
      functionName: "approve",
      args: [srcConfig.tokenMessenger, amount * 2n],
    }),
  });
  await srcPublic.waitForTransactionReceipt({ hash: approveHash });
  console.log(`Approved: ${approveHash}`);

  // Step 2: Burn
  console.log("\nStep 2/4: Burning USDC on source chain...");
  const burnHash = await srcWallet.sendTransaction({
    to: srcConfig.tokenMessenger,
    data: encodeFunctionData({
      abi: DEPOSIT_FOR_BURN_ABI,
      functionName: "depositForBurn",
      args: [
        amount,
        dstConfig.domain,
        addressToBytes32(recipient),
        srcConfig.usdc,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        maxFee,
        1000, // Fast transfer
      ],
    }),
  });
  await srcPublic.waitForTransactionReceipt({ hash: burnHash });
  console.log(`Burned: ${burnHash}`);

  // Step 3: Get attestation
  console.log("\nStep 3/4: Getting attestation from Circle...");
  const attestation = await getAttestation(srcConfig.domain, burnHash);

  // Step 4: Mint on destination
  console.log("\nStep 4/4: Minting USDC on destination chain...");
  const mintHash = await dstWallet.sendTransaction({
    to: dstConfig.messageTransmitter,
    data: encodeFunctionData({
      abi: RECEIVE_MESSAGE_ABI,
      functionName: "receiveMessage",
      args: [
        attestation.message as `0x${string}`,
        attestation.attestation as `0x${string}`,
      ],
    }),
  });
  const mintReceipt = await dstPublic.waitForTransactionReceipt({ hash: mintHash });

  console.log(`\n=== Transfer Complete ===`);
  console.log(`Mint Tx: ${mintHash}`);
  console.log(`Block: ${mintReceipt.blockNumber}`);
  console.log(`${amountStr} USDC delivered to ${recipient} on ${toChain}`);
}

main().catch(console.error);
