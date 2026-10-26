import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });
const config: HardhatUserConfig = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: { hardhat: { chainId: 31337, accounts: { mnemonic: process.env.DEMO_MNEMONIC || "test test test test test test test test test test test junk" } }, localhost: { url: process.env.RPC_URL || "http://127.0.0.1:8545", chainId: 31337 } },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" }
};
export default config;
