# Server-side Web Proof Generation for Etherscan API Data

This example demonstrates how to use [vlayer Web Proof](https://book.vlayer.xyz/features/web.html) to notarize an HTTP request to:

```
https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&address=0x4B808ec5A5d53871e0b7bf53bC2A4Ee89dd1ddB1&tag=latest&apikey=
```

It generates a **zero-knowledge proof (ZK proof)** based on the API response, which can then be verified by an **on-chain EVM smart contract**.

## How to Run

You can find a step-by-step guide for running this example in the vlayer documentation:  
👉 [Getting Started – First Steps](https://book.vlayer.xyz/getting-started/first-steps.html)

## To deploy

`VLAYER_ENV=testnet bun run deploy.ts`

## To execute prover

`VLAYER_ENV=testnet bun run prove.ts`