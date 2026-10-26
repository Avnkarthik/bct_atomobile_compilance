# Threat model (prototype)

| Threat | Prototype control | Remaining risk |
|---|---|---|
| Unauthorized batch/test/decision writes | Contract roles plus backend role check | Demo account selection is not real authentication |
| Duplicate IDs and wrong batch association | Deterministic IDs, existence check, explicit parent ID and index | Governance around corrections is minimal |
| Report altered after registration | SHA-256 digest compared on retrieval | Local storage can be deleted; upload validation is basic |
| Path traversal | Server-generated filenames and strict path checks | Production storage and authorization need hardening |
| Oversized upload | Multer file size limit | Malware scanning not implemented |
| Request flooding | Basic rate limit and body size limits | Production needs reverse-proxy/WAF monitoring |
| Admin/key compromise | Local-only development accounts | No production key custody or governance |
| False physical-world claim | Clear evidence/audit trail | Blockchain cannot establish scientific truth |
