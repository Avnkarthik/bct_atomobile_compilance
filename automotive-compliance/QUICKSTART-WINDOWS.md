# Quick start (Windows PowerShell)

Open PowerShell in the extracted `automotive-compliance` folder.

```powershell
Copy-Item .env.example .env
npm install
```

Open four PowerShell terminals in the project folder:

**Terminal 1 — local blockchain**

```powershell
npm run chain
```

**Terminal 2 — deploy and seed** (run once after starting a fresh chain)

```powershell
npm run contracts:compile
npm run contracts:deploy
npm run seed
```

**Terminal 3 — backend**

```powershell
npm run backend:dev
```

**Terminal 4 — frontend**

```powershell
npm run frontend:dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:4000/api/health` (API calls from the UI include the local demo account header).

If dependencies fail to install, confirm Node.js 20+ and npm are installed, then retry `npm install` with access to the npm registry. The generated source bundle has not been verified with a full compile in the generation environment because its npm install timed out.
