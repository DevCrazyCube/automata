# Local Development Setup

Quick start for running Automata locally on your machine.

## Requirements

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**
- **Two terminal tabs/windows**

Verify:
```bash
node --version    # Should be v18.x.x or higher
npm --version     # Should be 9.x.x or higher
git --version     # Should be 2.x.x or higher
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/DevCrazyCube/automata.git
cd automata
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Expected output:
```
added N packages, audited M packages in X seconds
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

Expected output:
```
added N packages, audited M packages in X seconds
```

## Running Locally

### Terminal 1: Backend

```bash
cd backend
node server.js
```

You should see:
```
================================================
Automata backend listening on http://localhost:3000
Mode: SIMULATION
Network: ethereum
================================================
```

The backend is now listening on `http://localhost:3000`.

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser.

## First Run

1. **Verify connection**
   - Control panel (bottom left) should show "CONNECTED" (green dot)
   - Mode should show "SIMULATION"

2. **Start an operation**
   - Click the green **▶ Start Operation** button
   - Watch the animation:
     - Agents walk to their zones
     - Progress bars advance for each phase
     - Transaction log updates in real-time
     - After ~14 seconds, final report modal appears

3. **Review results**
   - Final report shows:
     - Duration (how long the operation took)
     - Revenue (total stablecoin extracted)
     - Profit (revenue - initial seed cost)
     - ROI (return on investment percentage)

## Testing

### Backend smoke test

```bash
cd backend
npm test
```

Expected output:
```
[2026-04-11T...] [INFO] [wrapper] starting operation in simulation mode
...
SMOKE TEST PASSED
  events emitted    : 137
  unique event types: agent_completed, agent_walking, ...
  duration (s)      : 13.56
  roi     (%)       : 15.33
```

If this passes, your backend logic is correct.

### Manual UI testing

1. Start both backend and frontend (see "Running Locally" above)
2. Open http://localhost:5173
3. Test these scenarios:

**Scenario 1: Normal operation**
- Click "▶ Start Operation"
- Verify all 6 phases complete
- ✓ Pass if final report appears with valid numbers

**Scenario 2: Pause/Resume**
- Click "▶ Start Operation"
- Wait a few seconds, click "❚❚ Pause"
- Verify operation pauses (no new log entries)
- Click "▶ Resume"
- Verify operation continues
- ✓ Pass if operation resumes and completes

**Scenario 3: Stop**
- Click "▶ Start Operation"
- Wait a few seconds, click "■ Stop"
- Verify operation stops (no final report)
- ✓ Pass if you can start a new operation afterward

## Common Issues

### Port already in use

**Problem:** `Error: EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000
# Or specify a different port
PORT=4000 node server.js
# Then in frontend .env:
# VITE_BACKEND_URL=http://localhost:4000
```

### Frontend can't connect to backend

**Problem:** Control panel shows "DISCONNECTED" (red)

**Solution:**
1. Make sure backend is running
2. Check `.env` in frontend:
   ```bash
   cat frontend/.env.local
   # Should have or default to:
   # VITE_BACKEND_URL=http://localhost:3000
   ```
3. Check browser console (F12 → Console) for errors
4. Test manually:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok","mode":"simulation",...}
   ```

### Browser shows blank/white screen

**Problem:** Phaser game doesn't render

**Solution:**
1. Check browser console for JavaScript errors (F12 → Console)
2. Refresh page (Ctrl+R or Cmd+R)
3. Try a different browser
4. Check that node_modules was installed: `ls frontend/node_modules | head`

### Dependencies won't install

**Problem:** `npm install` fails with errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and lock file
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

## Configuration

### Changing initial amounts

Edit `backend/config.json`:

```json
{
  "TOTAL_MINT_AMOUNT": 100000000,          // Total tokens to mint
  "INITIAL_TOKEN_SEED": 30000000,          // Liquidity pool seed (tokens)
  "INITIAL_STABLECOIN_SEED": 30000,        // Liquidity pool seed (stablecoin)
  "BUYER_WALLETS": [                       // Buyers and their swap amounts
    { "address": "0x...", "stablecoin_amount": 500 }
  ]
}
```

After changes, restart the backend.

### Switching to production mode

**WARNING: This costs real money on mainnet!**

1. Edit `backend/config.json`:
   ```json
   {
     "MODE": "production",
     "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
   }
   ```

2. Create `backend/.env` with real private keys:
   ```bash
   DEPLOYER_PRIVATE_KEY=0x...
   ADMIN_PRIVATE_KEY=0x...
   ```

3. Test on a testnet first (Sepolia, Goerli) with test ETH
4. Only run on mainnet when confident

## Development Workflow

### Making changes

1. **Backend changes**
   - Edit files in `backend/`
   - Backend will auto-reload (if running with `nodemon`)
   - Or manually restart: `Ctrl+C` and `node server.js` again

2. **Frontend changes**
   - Edit files in `frontend/src/`
   - Dev server auto-reloads (Vite hot module replacement)
   - Browser updates automatically

### Testing changes

1. **Backend logic**
   ```bash
   cd backend
   npm test
   # Runs smoke test on all 6 phases
   ```

2. **Frontend components**
   - Open DevTools (F12)
   - Check Console for errors
   - Use React DevTools extension to inspect components

### Committing work

```bash
git add .
git commit -m "Your clear commit message"
git push origin YOUR_BRANCH_NAME
```

## Building for production

### Backend

No build needed. Deploy `backend/` folder as-is.

```bash
# Test build before deploy
cd backend
npm install --production
node server.js
```

### Frontend

```bash
cd frontend
npm run build
# Output goes to frontend/build/

# Test build locally
npm run preview
# Opens preview server on http://localhost:4173
```

Upload `frontend/build/` to Vercel, Netlify, or any static host.

## Environment variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in values:

```bash
cd backend
cp .env.example .env
# Edit .env with real values
```

Variables:
- `MODE`: `simulation` or `production`
- `PORT`: Server port (default 3000)
- `CORS_ORIGIN`: Allowed origins (default `*`)
- `RPC_URL`: Blockchain RPC endpoint (for production mode)
- `DEPLOYER_PRIVATE_KEY`: Deployer wallet key (for production mode)
- `ADMIN_PRIVATE_KEY`: Admin wallet key (for production mode)

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local` and fill in values:

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your backend URL
```

Variables:
- `VITE_BACKEND_URL`: Backend URL (default `http://localhost:3000`)

## Next steps

- Read [README.md](./README.md) for architecture and API reference
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to production
- Explore `docs/` folder for technical deep dives

---

**Happy developing!** 🚀
