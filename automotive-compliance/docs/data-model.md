# Data model

- `ComponentBatch`: bytes32 batch ID, human batch code, supplier address, component name/type, quantity, manufacturing date, specifications reference, registration timestamp, decision and decision reason.
- `TestRecord`: bytes32 test ID, exact batch ID, lab address, test type, PASS/FAIL result, SHA-256 report digest, backend-controlled document reference, submission/expiry timestamps, revocation flag/reason.
- `batchTests[batchId]`: explicit index of test IDs, updated atomically with each test submission.
- Required test types are configured per component type in contract storage.
- Decision and revocation events are append-only; current status is derived from current evidence and decision state.
