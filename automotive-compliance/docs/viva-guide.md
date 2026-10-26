# AutoTrace Viva Guide

## 1. Why blockchain instead of only MySQL?
The intended trust model has several independent organizations contributing evidence. A shared ledger gives them a common append-only record of registration, test submission, decisions and revocations. A conventional database is simpler and may be best if one trusted operator owns the workflow. Blockchain is useful only if shared verification and multi-party auditability justify the added operational complexity.

## 2. How does a manufacturer search for a batch?
The human-readable code is normalized and hashed with `keccak256` to create a deterministic `bytes32` `batchId`. The backend calls `getBatch(batchId)`, then `getTestIdsForBatch(batchId)`, then `getTest(testId)` for each linked test. The relationship is stored on-chain, so a centralized database is not required to reconstruct it.

## 3. How are test records linked to batches?
Every `TestRecord` stores the exact parent `batchId`. `submitTest` verifies that the batch exists, rejects duplicate test IDs and duplicate test types for that batch, stores the test, and appends the ID to `batchTests[batchId]` in the same transaction.

## 4. What do smart contracts enforce?
They enforce role permissions, identifier uniqueness, batch existence, test indexing, required-test policies, test results, expiry, revocation and manufacturer decision rules. Backend validation improves error messages but is not the final authorization boundary.

## 5. What is stored on-chain and off-chain?
Batch/test metadata, links, required-test configuration, report hash/reference, decisions, revocations and events are on-chain. PDF bytes stay in local off-chain storage. The chain records the SHA-256 digest and document reference, not the PDF itself.

## 6. How is report integrity checked?
The backend computes SHA-256 when a PDF is uploaded. Later it recalculates the digest and compares it to the on-chain digest. A mismatch indicates the retrieved bytes differ from the recorded file. A matching hash does not prove that the report is accurate or that the physical test was performed correctly.

## 7. What happens when a test is revoked?
The lab records a new revocation transaction with a reason; previous events are not erased. If the revoked test is required, the current batch status becomes `REASSESSMENT_REQUIRED`, including if it had previously been approved. The historical approval remains visible.

## 8. Why doesn't blockchain prove physical-world truth?
The ledger can prove which authorized key submitted a claim and that the recorded claim has not been silently rewritten under the chain's trust assumptions. It cannot independently inspect a component, calibrate a machine, validate a lab procedure or prevent a dishonest authorized participant from submitting false data. Audits, identity checks, secure instruments and governance remain necessary.

## 9. Why might Hyperledger Fabric fit a real consortium?
Fabric is permissioned and supports membership services and private-data patterns suitable for known organizations. It can align with a consortium in which participants have defined legal identities and governance. The trade-off is more operational setup and governance complexity than a local EVM prototype.

## 10. Important design distinctions
- `keccak256` derives deterministic EVM identifiers; SHA-256 fingerprints document bytes.
- A passing test is not sufficient by itself: every configured required type must be present, passing, unexpired and not revoked.
- A revocation is a new event, not deletion of an earlier test or approval.
- The local role selector is a development authentication substitute, not production identity management.
