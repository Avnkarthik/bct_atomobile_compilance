import { createHash } from "node:crypto";

export function sha256Hex(content: Buffer | Uint8Array): string {
  return `0x${createHash("sha256").update(content).digest("hex")}`;
}

export function verifyDocumentDigest(content: Buffer | Uint8Array, expectedHash: string) {
  const actualHash = sha256Hex(content);
  const verified = actualHash.toLowerCase() === expectedHash.toLowerCase();
  return { expectedHash, actualHash, status: verified ? "VERIFIED" as const : "INTEGRITY_MISMATCH" as const };
}
