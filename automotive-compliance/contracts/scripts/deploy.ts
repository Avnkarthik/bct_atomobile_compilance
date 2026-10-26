import { ethers } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length < 7) throw new Error("Expected at least 7 local Hardhat accounts");
  const factory = await ethers.getContractFactory("AutomotiveCompliance", signers[0]);
  const contract = await factory.deploy(
    await signers[0].getAddress(),
    [await signers[1].getAddress(), await signers[2].getAddress()],
    [await signers[3].getAddress(), await signers[4].getAddress()],
    [await signers[5].getAddress()],
    [await signers[6].getAddress()]
  );
  await contract.waitForDeployment();
  await (await contract.configureRequiredTests("brake-pad", ["hardness", "dimension", "durability"])).wait();
  await (await contract.configureRequiredTests("wheel-bearing", ["hardness", "durability"])).wait();
  const address = await contract.getAddress();
  const artifact = await import("../artifacts/contracts/AutomotiveCompliance.sol/AutomotiveCompliance.json");
  const out = { address, chainId: 31337, deployedAt: new Date().toISOString(), abi: artifact.abi, demoAccounts: await Promise.all(signers.slice(0, 7).map(async (s, i) => ({ index: i, address: await s.getAddress(), role: ["admin", "supplier", "supplier", "lab", "lab", "manufacturer", "auditor"][i] }))) };
  const output = path.resolve(__dirname, "../../backend/src/config/deployment.json");
  fs.writeFileSync(output, JSON.stringify(out, null, 2));
  console.log(`AutomotiveCompliance deployed to ${address}`);
  console.log(`Wrote ${output}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
