# AXiM Subcoin Backend & Smart Contract Reference

This folder contains the reference code for the backend (Cloudflare Worker) and Smart Contract (Solidity) required for the AXiM Daily Word Cipher ecosystem.

Because this frontend is currently running in a sandboxed, browser-only environment, the Web3 transaction and ECDSA signature workflows are simulated in the UI.

To deploy this into production, your engineering team will use the following files to create the secure backend boundary and EVM contract.

## Contents
- `cloudflare-worker.js`: The serverless API that connects to the D1 Database, validates scores securely, and signs the payload.
- `schema.sql`: The SQLite schema for the Cloudflare D1 Database.
- `AXiMGameToken.sol`: The ERC-20 Solidity contract utilizing OpenZeppelin ECDSA recovery.
- `deploy.js`: Hardhat deployment script.