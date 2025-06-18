/// <reference types="bun" />

import { createVlayerClient } from "@vlayer/sdk";
import proverSpec from "../out/EtherscanProver.sol/EtherscanProver";
import verifierSpec from "../out/EtherscanVerifier.sol/EtherscanVerifier";
import {
  getConfig,
  createContext,
} from "@vlayer/sdk/config";
import { spawn } from "child_process";

// The URL is hardcoded in the contract, so we use the same one here
const URL_TO_PROVE = "https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=0x57d90b64a1a57749b0f932f1a3395792e12e7055&address=0xe04f27eb70e025b78871a2ad7eabe85e61212761&tag=latest&apikey=FWRCZEZCTDZ2DW9HCTQ78DAICCI53MDIEP";

// Get deployed contract addresses from environment
const PROVER_ADDRESS = process.env.VITE_PROVER_ADDRESS;
const VERIFIER_ADDRESS = process.env.VITE_VERIFIER_ADDRESS;

// Validate required parameters
if (!PROVER_ADDRESS || !VERIFIER_ADDRESS) {
  throw new Error(
    "Contract addresses not found. Please run 'bun run deploy.ts' first to deploy contracts."
  );
}

console.log("🎯 Proving ERC20 Balance...");
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
  console.log("⏳ Generating web proof for Etherscan API...");
  
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