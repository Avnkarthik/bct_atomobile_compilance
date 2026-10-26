# Demo script

1. `cp .env.example .env` and `npm install`.
2. `npm run chain` in one terminal.
3. `npm run contracts:compile && npm run contracts:deploy && npm run seed` in a second terminal.
4. `npm run backend:dev` and `npm run frontend:dev` in separate terminals.
5. Show the dashboard and connected local chain.
6. Supplier A registers a brake-pad batch.
7. Lab A submits hardness, dimension and durability tests.
8. Manufacturer searches the batch and sees all linked tests, then approves.
9. Lab A revokes a test it submitted; search again and show reassessment-required plus retained approval history.
10. Try approval with a missing or failed test and show the contract revert.
11. Upload a PDF report, verify it, change the file bytes and verify the integrity mismatch.
