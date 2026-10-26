import { ethers } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";
async function main() {
  const deploymentPath = path.resolve(__dirname, "../../backend/src/config/deployment.json");
  if (!fs.existsSync(deploymentPath)) throw new Error("Deploy contracts first: npm run contracts:deploy");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const signers = await ethers.getSigners();
  const c = new ethers.Contract(deployment.address, deployment.abi, signers[1]);
  const id = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
  const batches = [
    {id:"BATCH-1001", name:"Brake Pad Set", type:"brake-pad", q:1200, date:"2026-09-01"},
    {id:"BATCH-1002", name:"Brake Pad Set", type:"brake-pad", q:800, date:"2026-09-10"},
    {id:"BATCH-1003", name:"Wheel Bearing", type:"wheel-bearing", q:500, date:"2026-09-15"},
    {id:"BATCH-1004", name:"Brake Pad Set", type:"brake-pad", q:600, date:"2026-09-20"}
  ];
  for (const b of batches) {
    const bid = id(b.id);
    await (await c.registerBatch(bid, b.id, b.name, b.type, b.q, Math.floor(new Date(b.date).getTime()/1000), `seed://${b.id}`)).wait();
  }
  const lab = c.connect(signers[3]);
  const submit = async (batch: string, type: string, result: number, serial: string) => {
    const bid=id(batch), tid=id(`TEST-${serial}`), report=ethers.sha256(ethers.toUtf8Bytes(`demo report ${serial}`));
    await (await lab.submitTest(bid, {testId:tid,testCode:`TEST-${serial}`,testType:type,result,reportHash:report,documentRef:`seed://${serial}`,expiresAt:0})).wait();
  };
  for (const [t,r] of [["hardness",1],["dimension",1],["durability",1]] as [string, number][]) await submit("BATCH-1001", String(t), r, `1001-${t}`);
  await submit("BATCH-1002", "hardness", 1, "1002-hardness"); await submit("BATCH-1002", "dimension", 2, "1002-dimension"); await submit("BATCH-1003", "hardness", 1, "1003-hardness");
  await submit("BATCH-1004", "hardness", 1, "1004-hardness"); await submit("BATCH-1004", "dimension", 1, "1004-dimension"); await submit("BATCH-1004", "durability", 1, "1004-durability");
  await (await c.connect(signers[5]).approveBatch(id("BATCH-1001"), "Seeded demo: all required tests passed")).wait();
  await (await lab.revokeTest(id("TEST-1004-durability"), "Seeded demo: evidence withdrawn for reassessment")).wait();
  console.log("Seeded demo batches and test records. Run once on a fresh local chain.");
}
main().catch(e => { console.error(e); process.exitCode=1; });
