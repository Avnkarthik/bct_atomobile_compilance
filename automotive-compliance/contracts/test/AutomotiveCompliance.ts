import { expect } from "chai";
import { ethers } from "hardhat";

describe("AutomotiveCompliance", function () {
  async function setup() {
    const [admin,supplier,otherSupplier,lab,otherLab,manufacturer,auditor,outsider]=await ethers.getSigners();
    const Factory=await ethers.getContractFactory("AutomotiveCompliance");
    const c=await Factory.deploy(admin.address,[supplier.address,otherSupplier.address],[lab.address,otherLab.address],[manufacturer.address],[auditor.address]);
    await c.waitForDeployment();
    await c.configureRequiredTests("brake-pad",["hardness","dimension","durability"]);
    const bid=ethers.keccak256(ethers.toUtf8Bytes("BATCH-1001"));
    const register=async(id=bid)=>c.connect(supplier).registerBatch(id,"BATCH-1001","Brake Pad Set","brake-pad",1000,Math.floor(Date.now()/1000),"");
    const submit=async(type:string,result:number,code:string,expiresAt=0)=>c.connect(lab).submitTest(bid,{testId:ethers.keccak256(ethers.toUtf8Bytes(code)),testCode:code,testType:type,result,reportHash:ethers.sha256(ethers.toUtf8Bytes(`report-${code}`)),documentRef:"",expiresAt});
    await register();
    return {c,admin,supplier,otherSupplier,lab,otherLab,manufacturer,auditor,outsider,bid,register,submit};
  }
  it("registers a unique batch and rejects duplicates",async()=>{const {c,bid,register}=await setup();expect((await c.getBatch(bid)).batchCode).eq("BATCH-1001");await expect(register()).to.be.revertedWithCustomError(c,"BatchAlreadyExists");});
  it("rejects unauthorized batch registration",async()=>{const {c,outsider,bid}=await setup();await expect(c.connect(outsider).registerBatch(ethers.keccak256(ethers.toUtf8Bytes("X")),"BATCH-X","X","brake-pad",1,0,"")).to.be.reverted;});
  it("rejects a test for an unknown batch",async()=>{const {c,lab}=await setup();await expect(c.connect(lab).submitTest(ethers.ZeroHash,{testId:ethers.id("T"),testCode:"T",testType:"hardness",result:1,reportHash:ethers.sha256(ethers.toUtf8Bytes("x")),documentRef:"",expiresAt:0})).to.be.revertedWithCustomError(c,"BatchNotFound");});
  it("links test IDs to the exact batch and resolves test back to batch",async()=>{const {c,bid,submit}=await setup();await submit("hardness",1,"T-H");const tid=ethers.keccak256(ethers.toUtf8Bytes("T-H"));expect(await c.getTestIdsForBatch(bid)).deep.eq([tid]);expect((await c.getTest(tid)).batchId).eq(bid);});
  it("blocks approval with missing required tests",async()=>{const {c,bid,manufacturer}=await setup();await expect(c.connect(manufacturer).approveBatch(bid,"reviewed")).to.be.revertedWithCustomError(c,"MissingRequiredTest");});
  it("blocks approval when a required test fails",async()=>{const {c,bid,manufacturer,submit}=await setup();await submit("hardness",2,"TEST-H");await submit("dimension",1,"TEST-D");await submit("durability",1,"TEST-U");await expect(c.connect(manufacturer).approveBatch(bid,"reviewed")).to.be.revertedWithCustomError(c,"RequiredTestFailed");});
  it("approves eligible batches and preserves status history after revocation",async()=>{const {c,bid,lab,manufacturer,submit}=await setup();await submit("hardness",1,"TEST-H");await submit("dimension",1,"TEST-D");await submit("durability",1,"TEST-U");await c.connect(manufacturer).approveBatch(bid,"all evidence passed");expect(await c.getBatchStatus(bid)).eq(3);const tid=ethers.keccak256(ethers.toUtf8Bytes("TEST-H"));await c.connect(lab).revokeTest(tid,"calibration issue");expect(await c.getBatchStatus(bid)).eq(6);expect((await c.getBatch(bid)).decision).eq(1);});
  it("prevents unauthorized test submission, revocation, and approval",async()=>{const {c,bid,outsider,manufacturer,submit}=await setup();await expect(c.connect(outsider).submitTest(bid,{testId:ethers.id("X"),testCode:"X",testType:"hardness",result:1,reportHash:ethers.sha256(ethers.toUtf8Bytes("x")),documentRef:"",expiresAt:0})).to.be.reverted;await submit("hardness",1,"TEST-H");await expect(c.connect(outsider).revokeTest(ethers.keccak256(ethers.toUtf8Bytes("TEST-H")),"bad")).to.be.reverted;await expect(c.connect(outsider).approveBatch(bid,"bad")).to.be.reverted;await expect(c.connect(manufacturer).approveBatch(bid,"bad")).to.be.revertedWithCustomError(c,"MissingRequiredTest");});
  it("rejects a duplicate test ID",async()=>{const {c,bid,lab,submit}=await setup();await submit("hardness",1,"TEST-H");await expect(c.connect(lab).submitTest(bid,{testId:ethers.keccak256(ethers.toUtf8Bytes("TEST-H")),testCode:"TEST-H",testType:"dimension",result:1,reportHash:ethers.sha256(ethers.toUtf8Bytes("other")),documentRef:"",expiresAt:0})).to.be.revertedWithCustomError(c,"TestAlreadyExists");});
  it("rejects duplicate test types for a batch",async()=>{const {c,bid,lab,submit}=await setup();await submit("hardness",1,"TEST-H");await expect(c.connect(lab).submitTest(bid,{testId:ethers.id("TEST-H2"),testCode:"TEST-H2",testType:"hardness",result:1,reportHash:ethers.sha256(ethers.toUtf8Bytes("x")),documentRef:"",expiresAt:0})).to.be.revertedWithCustomError(c,"DuplicateTestType");});
  it("blocks expired evidence",async()=>{const {c,bid,lab,manufacturer,submit}=await setup();await submit("hardness",1,"TEST-H",1);await submit("dimension",1,"TEST-D");await submit("durability",1,"TEST-U");await expect(c.connect(manufacturer).approveBatch(bid,"expired")).to.be.revertedWithCustomError(c,"RequiredTestInvalid");});
});
