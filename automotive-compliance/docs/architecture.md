# Architecture

The React/Vite application calls the Express API. The API uses ethers.js to read/write the `AutomotiveCompliance` contract on the local Hardhat node. Core batch/test relationships and compliance decisions live on-chain. PDFs live in local storage and are referenced by SHA-256 digest and generated filename. Dashboard/event views are rebuilt from chain logs; no mutable SQL/NoSQL database is used as a competing source of truth.

See the root README for the Mermaid diagram, start commands, endpoints and threat limitations.
