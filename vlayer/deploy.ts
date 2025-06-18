/// <reference types="bun" />

import proverSpec from "../out/EtherscanProver.sol/EtherscanProver";
import verifierSpec from "../out/EtherscanVerifier.sol/EtherscanVerifier";
import {
  getConfig,
  createContext,
  deployVlayerContracts,
  writeEnvVariables,
} from "@vlayer/sdk/config";

console.log("🚀 Starting contract deployment...");

const config = getConfig();
const { account } = createContext(config);

if (!account) {
  throw new Error(
    "No account found. Make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables"
  );
}

console.log("⏳ Deploying EtherscanProver and EtherscanVerifier contracts...");

const { prover, verifier } = await deployVlayerContracts({
  proverSpec,
  verifierSpec,
  proverArgs: [],
  verifierArgs: [],
});

console.log("✅ Contracts deployed successfully!");
console.log(`📄 Prover Contract: ${prover}`);
console.log(`🔍 Verifier Contract: ${verifier}`);

// Save contract addresses to environment file
await writeEnvVariables(".env", {
  VITE_PROVER_ADDRESS: prover,
  VITE_VERIFIER_ADDRESS: verifier,
});

console.log("💾 Contract addresses saved to .env file");
console.log("🎉 Deployment complete! You can now run the prove script.");