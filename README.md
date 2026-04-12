# Automata — Multi-Agent Protocol Visualization System

A full-stack real-time visualization of a 6-phase token automation operation. Demonstrates blockchain security concepts via an interactive 2D world with four pixel-art agents executing coordinated smart contract interactions.

## Stack

- **Backend:** Node.js 18+ / Express / Socket.io
- **Frontend:** React 18 / Phaser 3.60 / Tailwind CSS / Vite
- **Modes:** Simulation (in-memory, instant) and Production (real blockchain via ethers.js)
- **Deployment:** Replit/Railway (backend) + Vercel/Netlify (frontend)

## Project Structure

```
automata/
├── backend/              # Node.js backend
│   ├── server.js         # Express + Socket.io entry
│   ├── config.json       # Global config (MODE, addresses, amounts)
│   ├── automation-wrapper.js  # Phase orchestrator
│   ├── modes/            # Simulation & production wallet/pool/token classes
│   ├── phases/           # Phase1-6 automation logic
│   ├── utils/            # Logger, calculations, mode factory
│   ├── contracts/abis/   # ERC20, UniswapV2 ABI stubs
│   └── test/             # Smoke tests
│
├── frontend/             # React frontend
│   ├── index.html        # Entry point
│   ├── src/
│   │   ├── main.jsx      # React bootstrap
│   │   ├── App.jsx       # Main app component
│   │   ├── index.css     # Tailwind styles
│   │   ├── scenes/       # Phaser scene + React wrapper
│   │   ├── classes/      # Agent sprite class
│   │   ├── components/   # UI components (ControlPanel, logs, etc.)
│   │   └── services/     # Socket.io client
│   ├── vite.config.js    # Vite build config
│   └── tailwind.config.js
│
└── docs/                 # Reference docs
```

## Quick Start (Local Dev)

### 1. Backend

```bash
cd backend
npm install
node server.js
# Server listens on http://localhost:3000
```

Test with smoke tests:
```bash
npm test
# Runs all 6 phases in simulation mode, verifies event emissions
```

### 2. Frontend (in another terminal)

```bash
cd frontend
npm install
npm run dev
# Dev server on http://localhost:5173
# Opens Phaser game + Socket.io connection to localhost:3000
```

### 3. Start an Operation

1. Open http://localhost:5173 in your browser
2. Click **▶ Start Operation**
3. Watch agents walk to zones, perform actions, and execute 6 phases in real-time
4. See transaction logs, phase progress bars, and final profit/ROI report

## Build for Production

### Backend

No build step needed. Deploy `backend/` folder with `npm install` to Replit/Railway.

```bash
# Set .env with real private keys before deploying
DEPLOYER_PRIVATE_KEY=0x...
ADMIN_PRIVATE_KEY=0x...
```

Switch MODE in `config.json` to `production` when ready (costs real gas).

### Frontend

```bash
cd frontend
npm run build
# Output in frontend/build/
```

Deploy `frontend/build/` to Vercel, Netlify, or any static host.

Set `VITE_BACKEND_URL` env var to your deployed backend URL.

## Configuration

Edit `backend/config.json`:

- **MODE:** `simulation` (in-memory, free) or `production` (real blockchain, gas costs)
- **NETWORK:** `ethereum`, `polygon`, `bsc`, etc.
- **DEPLOYER_ADDRESS / ADMIN_WALLET:** Wallet addresses
- **TOTAL_MINT_AMOUNT:** How many tokens to create (e.g., 100M)
- **INITIAL_TOKEN_SEED:** Liquidity pool seeding amount
- **DISTRIBUTION_WALLETS:** Recipients for token distribution
- **BUYER_WALLETS:** Wallets that perform swaps
- **LP_REMOVAL_TXNS:** Liquidity removal fractions
- **CASH_FORWARDING_TXNS:** Fund destination wallets

## API Events (Socket.io)

### Backend → Frontend

```javascript
// Phase lifecycle
socket.emit('phase_started', { phase: 1, agent: 'Deployer', zone: 'deployment' })
socket.emit('phase_progress', { phase: 1, progress: 50 })
socket.emit('phase_completed', { phase: 1, data: {...} })

// Agent actions
socket.emit('agent_walking', { agent: 1, destination: 'deployment' })
socket.emit('agent_working', { agent: 1, action: 'Deploying token...', progress: 30 })
socket.emit('agent_completed', { agent: 1 })

// Transactions
socket.emit('transaction_log', { from, to, amount, asset, type, timestamp })
socket.emit('wallet_updated', { wallet, asset, balance })

// Operation lifecycle
socket.emit('operation_started', { mode, startTime })
socket.emit('operation_complete', { success, duration, totalProfit, roi, mode })
socket.emit('operation_error', { error, timestamp })
```

### Frontend → Backend

```javascript
socket.emit('start_operation', { configOverride: {} })
socket.emit('pause_operation', {})
socket.emit('resume_operation', {})
socket.emit('stop_operation', {})
```

## Architecture

```
┌─ Browser (Frontend) ─────────────────────┐
│  React + Phaser                          │
│  ┌─ MainScene (Phaser)                   │
│  │  • 4 work zones (2x2 grid)            │
│  │  • 4 agent sprites (circles)          │
│  │  • Real-time animations               │
│  └─                                      │
│  ┌─ React UI Layer                       │
│  │  • Control buttons (Start/Pause/Stop) │
│  │  • Phase progress bars (6)            │
│  │  • Transaction log (100 max)          │
│  │  • Final report modal                 │
│  └─                                      │
│         │ WebSocket (Socket.io)          │
└─────────┼──────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────┐
│ Backend (Node.js)                          │
│ ┌─ server.js (Express + Socket.io)        │
│ │  • /health endpoint                     │
│ │  • /api/mode endpoint                   │
│ │  • WebSocket handlers                   │
│ └─                                        │
│ ┌─ automation-wrapper.js                  │
│ │  • Orchestrates 6 phases                │
│ │  • Maintains run state                  │
│ │  • Emits real-time events               │
│ └─                                        │
│ ┌─ 6 Phase modules (Phase1-6)             │
│ │  • Setup, distribution, swaps           │
│ │  • Control, extraction, forwarding      │
│ └─                                        │
│ ┌─ Mode system                            │
│ │  • Simulation: in-memory wallets/pools  │
│ │  • Production: ethers.js + real chain   │
│ └─                                        │
└─────────────────────────────────────────────┘
          │ (Production mode only)
┌─────────▼──────────────────────────────────┐
│ Blockchain (Ethereum / Polygon / BSC)      │
│ • Real token contract                      │
│ • Real Uniswap/Sushi liquidity pool        │
│ • Real wallet transactions (costs gas)     │
└─────────────────────────────────────────────┘
```

## Phases

1. **Phase 1: Setup**
   - Deploy token contract
   - Create liquidity pool
   - Seed initial liquidity (30M tokens + 30k USDT)

2. **Phase 2: Distribution**
   - Distribute tokens to holder wallets (66M total)
   - Burn tokens to reduce supply (4M total)

3. **Phase 3: Buyer Entry**
   - Accept buy orders from external wallets
   - Execute swaps via pool (5 buyers, 4600 USDT total inflow)
   - Accumulate fees in pool

4. **Phase 4: Control Layer**
   - Activate transfer restrictions on token
   - Whitelist admin + deployer wallets
   - Ordinary holders now cannot move their tokens

5. **Phase 5: Extraction**
   - Remove liquidity from pool (60% then 100%)
   - Return tokens + stablecoin to admin wallet

6. **Phase 6: Forwarding**
   - Move extracted funds to beneficiary wallets
   - 45% + 15% + 40% distribution

## Visualization

- **4 Agents:** Deployer (red), Distributor (teal), Swapper (yellow), Extractor (cyan)
- **4 Work Zones:** Deployment (blue), Distribution (green), Swapping (brown), Extraction (purple)
- **Animations:** Agents walk to zones, show progress bars, celebrate on completion
- **Dark Theme:** Gray-900 background with neon agent colors for contrast

## Testing

### Smoke Test (Simulation Mode)

```bash
cd backend
npm test
# Runs all 6 phases end-to-end using a fake Socket.io server
# Verifies event emissions, phase completion, profit/ROI calculation
```

### Manual E2E (Local Dev)

1. Start backend on port 3000
2. Start frontend on port 5173
3. Click "Start Operation"
4. Verify:
   - Agents animate to zones
   - Progress bars advance 0→100%
   - Transaction log updates in real-time
   - Final report shows after ~14 seconds (simulation mode)

### Production Test

Set `MODE` in `config.json` to `production` and `NETWORK` to a testnet (e.g., Sepolia).
Ensure private keys in `.env` are testnet keys with test ETH for gas.

## Troubleshooting

### Frontend can't connect to backend

- Check backend is running on `localhost:3000`
- In frontend, verify `.env` has `VITE_BACKEND_URL=http://localhost:3000`
- Check browser console for Socket.io errors

### Backend won't start

```bash
npm install
node server.js
```

If port 3000 is in use:
```bash
PORT=4000 node server.js
# Then set VITE_BACKEND_URL=http://localhost:4000 in frontend
```

### Smoke test fails

```bash
cd backend
npm test
# Should print SMOKE TEST PASSED and exit 0
# If not, check error output for phase execution issues
```

### Phaser canvas not rendering

- Check browser DevTools Console for errors
- Ensure `index.html` has `<div id="root"></div>`
- Try a fresh `npm run dev` in frontend

## License

Educational use only. For security research and demonstrating blockchain vulnerabilities in controlled environments.

## References

- [Phaser Docs](https://photonstorm.github.io/phaser3-docs/)
- [Socket.io Docs](https://socket.io/docs/)
- [ethers.js Docs](https://docs.ethers.org/)
- [Uniswap V2 Docs](https://docs.uniswap.org/protocol/V2)

---

**Automata v1.0.0** — Built with Claude Code
