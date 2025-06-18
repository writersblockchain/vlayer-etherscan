/// <reference types="bun" />

import { createVlayerClient } from "@vlayer/sdk";
import proverSpec from "../out/EtherscanProver.sol/EtherscanProver";
import verifierSpec from "../out/EtherscanVerifier.sol/EtherscanVerifier";
import {
  getConfig,
  createContext,
} from "@vlayer/sdk/config";
import { spawn } from "child_process";

// User Configuration - Update these values
const ERC20_CONTRACT_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // USDC contract (hardcoded in contract)
const WALLET_ADDRESS = "0x4B808ec5A5d53871e0b7bf53bC2A4Ee89dd1ddB1"; // Wallet to check
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY; // Your API key

// Get deployed contract addresses from environment
const PROVER_ADDRESS = process.env.VITE_PROVER_ADDRESS;
const VERIFIER_ADDRESS = process.env.VITE_VERIFIER_ADDRESS;

if (!PROVER_ADDRESS || !VERIFIER_ADDRESS) {
  throw new Error(
    "Contract addresses not found. Please run 'bun run deploy.ts' first to deploy contracts."
  );
}

// Construct the full URL
const URL_TO_PROVE = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ERC20_CONTRACT_ADDRESS}&address=${WALLET_ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;

console.log("🎯 Proving ERC20 Balance...");
console.log(`📄 Token Contract: ${ERC20_CONTRACT_ADDRESS}`);
console.log(`👤 Wallet Address: ${WALLET_ADDRESS}`);
console.log(`📝 Prover Contract: ${PROVER_ADDRESS}`);
console.log(`🔍 Verifier Contract: ${VERIFIER_ADDRESS}`);

const config = getConfig();
const { chain, ethClient, account, proverUrl, confirmations, notaryUrl } =
  createContext(config);

if (!account) {
  throw new Error(
    "No account found. Make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables"
  );
}

const vlayer = createVlayerClient({
  url: proverUrl,
  token: config.token,
});

async function generateWebProof() {

  const { stdout } = await runProcess("vlayer", [
    "web-proof-fetch",
    "--notary",
    String(notaryUrl),
    "--url",
    URL_TO_PROVE,
  ]);
  return stdout;
}

console.log("⏳ Fetching ERC20 balance from Etherscan...");
const webProof = await generateWebProof();

console.log("⏳ Generating cryptographic proof...");
const hash = await vlayer.prove({
  address: PROVER_ADDRESS,
  functionName: "main",
  proverAbi: proverSpec.abi,
  args: [
    {
      webProofJson: String(webProof),
    },
  ], 
  chainId: chain.id,
  gasLimit: config.gasLimit,
});

const result = await vlayer.waitForProvingResult({ hash });
const [proof, balance] = result;

console.log("✅ Proof generated successfully!");
console.log(`💰 Token Balance: ${balance}`);

// Convert balance to human readable format (assuming 18 decimals for most ERC20 tokens)
// try {
//   const balanceNumber = BigInt(balance);
//   const decimals = 18; // Most ERC20 tokens use 18 decimals
//   const humanReadableBalance = Number(balanceNumber) / Math.pow(10, decimals);
//   console.log(`📊 Human Readable Balance: ${humanReadableBalance.toLocaleString()} tokens`);
// } catch (error) {
//   console.log(`⚠️  Could not convert balance to human readable format: ${error}`);
// }

console.log("⏳ Verifying proof on-chain...");

// Estimate gas for the verification transaction
const gas = await ethClient.estimateContractGas({
  address: VERIFIER_ADDRESS,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, balance],
  account,
  blockTag: "pending",
});

console.log(`⛽ Estimated gas: ${gas}`);

// Submit the verification transaction
const txHash = await ethClient.writeContract({
  address: VERIFIER_ADDRESS,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, balance],
  chain,
  account,
  gas,
});

console.log(`📝 Transaction submitted: ${txHash}`);
console.log("⏳ Waiting for transaction confirmation...");

await ethClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
});

console.log("✅ Balance verified and stored on-chain!");
console.log("");
console.log("🎉 PROOF COMPLETE! Summary:");
console.log("════════════════════════════════");
console.log(`📄 Token Contract: ${ERC20_CONTRACT_ADDRESS}`);
console.log(`👤 Wallet Address: ${WALLET_ADDRESS}`);
console.log(`💰 Verified Balance: ${balance}`);
console.log(`🔗 Verifier Contract: ${VERIFIER_ADDRESS}`);
console.log(`📝 Transaction Hash: ${txHash}`);
console.log("════════════════════════════════");

function runProcess(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => {
      stdout += data;
    });
    proc.stderr.on("data", (data) => {
      stderr += data;
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process failed: ${stderr}`));
      }
    });
    proc.on("error", (err) => {
      reject(err);
    });
  });
}