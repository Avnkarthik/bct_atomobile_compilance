import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
dotenv.config({path:path.resolve(process.cwd(), "../.env")});
const deploymentFile = path.resolve(__dirname, "deployment.json");
export function deployment() {
  if (!fs.existsSync(deploymentFile)) throw new Error("Contract not deployed. Run npm run contracts:deploy first.");
  return JSON.parse(fs.readFileSync(deploymentFile,"utf8")) as {address:string;chainId:number;abi:any[];demoAccounts:{index:number;address:string;role:string}[]};
}
export function provider() { return new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545"); }
export function roleNames() { return ["admin","supplierA","supplierB","labA","labB","manufacturer","auditor"] as const; }
export type DemoRole = ReturnType<typeof roleNames>[number];
const indexes: Record<DemoRole,number> = {admin:0,supplierA:1,supplierB:2,labA:3,labB:4,manufacturer:5,auditor:6};
export function actor(name: string) {
  if (!roleNames().includes(name as DemoRole)) throw new Error("Unknown demo account");
  const mnemonic = process.env.DEMO_MNEMONIC;
  if (!mnemonic) throw new Error("DEMO_MNEMONIC is required for local demo signing");
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${indexes[name as DemoRole]}`).connect(provider());
  return wallet;
}
export function contract(signer?: ethers.Signer) { const d=deployment(); return new ethers.Contract(d.address,d.abi,signer ?? provider()); }
