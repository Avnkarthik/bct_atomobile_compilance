import { describe, it, expect } from "vitest";
import { sha256Hex, verifyDocumentDigest } from "../src/utils/documentIntegrity";

describe("document integrity", () => {
  it("verifies a report whose bytes are unchanged", () => {
    const report = Buffer.from("%PDF-1.7\noriginal test report\n", "utf8");
    const digest = sha256Hex(report);
    expect(verifyDocumentDigest(report, digest)).toEqual({ expectedHash: digest, actualHash: digest, status: "VERIFIED" });
  });
  it("detects a report whose bytes have changed", () => {
    const original = Buffer.from("%PDF-1.7\noriginal test report\n", "utf8");
    const modified = Buffer.from("%PDF-1.7\nmodified test report\n", "utf8");
    expect(verifyDocumentDigest(modified, sha256Hex(original)).status).toBe("INTEGRITY_MISMATCH");
  });
});
