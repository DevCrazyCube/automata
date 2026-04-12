# Deployment Guide — Automata

This guide walks through deploying the complete Automata system to production using free/low-cost services.

## Architecture Overview

```
┌─ Vercel/Netlify (Frontend) ────────────────────┐
│ Static React + Phaser build                     │
│ VITE_BACKEND_URL=https://automata-backend.xyz  │
└────────────┬─────────────────────────────────────┘
             │ WebSocket
             │
┌────────────▼─────────────────────────────────────┐
│ Replit or Railway (Backend)                     │
│ Node.js Express + Socket.io                     │
│ Runs on https://automata-backend.xyz:3000      │
└──────────────────────────────────────────────────┘
```

## Backend Deployment (Replit or Railway)

### Option A: Replit (FREE)

1. **Create a new Replit project**
   - Go to https://replit.com
   - Click "Create" → "New Replit"
   - Select "Node.js"
   - Name: `automata-backend`

2. **Upload/Clone code**
   ```bash
   # In Replit terminal
   git clone https://github.com/YOUR_ORG/automata.git
   cd automata/backend
   npm install
   ```

3. **Set environment variables**
   - Go to "Secrets" (padlock icon in left sidebar)
   - Add:
     ```
     MODE=simulation
     PORT=3000
     CORS_ORIGIN=*
     ```
   - For production mode, also add:
     ```
     DEPLOYER_PRIVATE_KEY=0x...
     ADMIN_PRIVATE_KEY=0x...
     RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
     ```

4. **Run**
   - Click "Run" button
   - Replit generates a public URL (e.g., `https://automata-backend.replit.dev`)

5. **Keep alive**
   - Replit pauses inactive projects after 1 hour
   - To keep running 24/7, use a free uptime monitor:
     - https://uptimerobot.com (FREE tier)
     - Set monitor to ping `https://automata-backend.replit.dev/health` every 5 minutes

### Option B: Railway ($5/month)

1. **Connect GitHub repository**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select your `automata` repository
   - Deploy

2. **Configure variables**
   - In Railway dashboard, go to "Variables"
   - Add the same env vars as Replit above

3. **Get public URL**
   - Railway auto-assigns a domain
   - Copy it and use in frontend `VITE_BACKEND_URL`

### Testing Backend Deployment

```bash
# Health check
curl https://automata-backend.xyz/health
# Should return: { "status": "ok", "mode": "simulation", ... }

# Mode check
curl https://automata-backend.xyz/api/mode
# Should return: { "mode": "simulation" }
```

## Frontend Deployment (Vercel or Netlify)

### Option A: Vercel (FREE)

1. **Connect GitHub**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Select your `automata` GitHub repository
   - Click "Import"

2. **Set root directory**
   - In "Root Directory", select `./frontend`
   - Click "Deploy"

3. **Configure environment variables**
   - After first deploy, go to "Settings" → "Environment Variables"
   - Add:
     ```
     VITE_BACKEND_URL=https://automata-backend.xyz
     ```
   - Re-deploy for changes to take effect

4. **Auto-deploy on push**
   - Vercel auto-deploys when you push to main/develop
   - Set up automatic deployments in GitHub integration

### Option B: Netlify (FREE)

1. **Connect GitHub**
   - Go to https://netlify.app
   - Click "New site from Git"
   - Select your GitHub repository
   - Choose "Authorize Netlify"

2. **Build settings**
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`
   - Click "Deploy site"

3. **Environment variables**
   - Go to "Site settings" → "Build & deploy" → "Environment"
   - Add:
     ```
     VITE_BACKEND_URL=https://automata-backend.xyz
     ```
   - Trigger a new deploy for changes to take effect

### Testing Frontend Deployment

1. Open your Vercel/Netlify URL in a browser
2. Should see the Automata UI with Phaser game, control panel, and logs
3. Should show "CONNECTED" status (green dot) in control panel
4. Click "▶ Start Operation" and watch the operation execute

## Full End-to-End Verification

After deploying both backend and frontend:

1. **Open frontend URL**
   ```
   https://automata.vercel.app
   ```

2. **Verify connection**
   - Control panel shows "CONNECTED" (green)
   - Mode shows "simulation" or "production"

3. **Start operation**
   - Click "▶ Start Operation"
   - Watch all 6 phases execute
   - Agents should walk to zones and perform actions
   - Transaction log should update in real-time
   - Phase progress bars should advance 0→100%
   - After ~14 seconds (simulation), final report should appear

4. **Verify final report**
   - Shows duration, revenue, profit, ROI
   - All data matches backend calculations

## Environment Variables Checklist

### Backend (.env or Replit/Railway Secrets)

```bash
# Required
MODE=simulation                    # or "production"
PORT=3000
CORS_ORIGIN=*

# For production mode only
DEPLOYER_PRIVATE_KEY=0x...
ADMIN_PRIVATE_KEY=0x...
RPC_URL=https://...
```

### Frontend (Vercel/Netlify Environment Variables)

```bash
# Required
VITE_BACKEND_URL=https://automata-backend.xyz
```

## Configuration for Different Networks

Edit `backend/config.json`:

### Ethereum Mainnet (Production - Real $$$)
```json
{
  "MODE": "production",
  "NETWORK": "ethereum",
  "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "ROUTER_ADDRESS": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "STABLECOIN_ADDRESS": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
```

### Sepolia Testnet (FREE test ETH)
```json
{
  "MODE": "production",
  "NETWORK": "sepolia",
  "RPC_URL": "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  "ROUTER_ADDRESS": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
}
```

### Simulation Mode (Recommended for initial testing)
```json
{
  "MODE": "simulation",
  "NETWORK": "ethereum"
}
```

## Troubleshooting

### Frontend can't connect to backend

**Symptom:** Control panel shows "DISCONNECTED" (red dot)

**Solutions:**
1. Check frontend `.env` has correct `VITE_BACKEND_URL`
2. Verify backend `/health` endpoint responds
3. Check browser DevTools → Network → WS (WebSocket) for connection errors
4. Ensure backend CORS_ORIGIN includes frontend domain

### Backend crashes on startup

**Symptom:** Replit/Railway shows error on deploy

**Solutions:**
1. Check Node version matches requirement (18+)
2. Run locally first: `npm install && node server.js`
3. Check `.env` file has correct syntax (no quotes around values)
4. Verify no missing dependencies: `npm install`

### Frontend won't load

**Symptom:** Blank page or 404 error

**Solutions:**
1. Verify build completed: `npm run build`
2. Check build directory: `frontend/build/` has `index.html`
3. Verify root directory is set to `./frontend` in Vercel/Netlify
4. Check for build errors: `npm run build` locally

### Operation doesn't complete

**Symptom:** Phases start but don't finish, or server logs show errors

**Solutions:**
1. Check backend logs for errors (Replit/Railway dashboard)
2. Smoke test locally: `cd backend && npm test`
3. If production mode, verify private keys are valid
4. Check RPC_URL is accessible: `curl $RPC_URL`

## Scaling Tips

### If you expect high traffic:

**Backend:**
- Railway's paid tier provides more CPU/RAM
- Or use AWS EC2, Google Cloud Run, Heroku

**Frontend:**
- Vercel/Netlify automatically scale static files
- Consider adding CDN like Cloudflare (free tier) for caching

### Database / Persistence (Optional):

Add SQLite or PostgreSQL to store operation results:
```bash
npm install better-sqlite3
# or
npm install pg
```

Then modify `server.js` to save results to DB instead of memory.

## Security Checklist (Production)

- [ ] Private keys stored in `.env` (git-ignored), never in code
- [ ] CORS_ORIGIN restricted to your frontend domain (not `*`)
- [ ] RPC_URL uses HTTPS and has rate limits/API key
- [ ] Backend runs in separate process from frontend
- [ ] Firewall rules restrict direct blockchain RPC access
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting on operation endpoint (prevent abuse)
- [ ] HTTPS enabled on both frontend and backend

## Monitoring & Alerts

### Uptime Monitoring (FREE)
- https://uptimerobot.com
- Monitor backend `/health` endpoint
- Alert if down for >5 minutes

### Error Tracking (FREE)
- https://sentry.io
- Add to backend:
  ```javascript
  import * as Sentry from "@sentry/node";
  Sentry.init({ dsn: "..." });
  ```

### Logs (FREE)
- Replit/Railway built-in logs
- Or add LogRocket to frontend for user session replay

---

**Deployment complete!** Your Automata system is now live.

For questions or issues, refer to the main [README.md](./README.md).
