================================================================================
CLAUDE PROJECT SETUP GUIDE
Multi-Agent Rug Pull Automation Visualization System
Complete Build Instructions & Quality Standards
================================================================================

READ THIS FIRST BEFORE BUILDING ANYTHING

This document contains all the information Claude Code needs to build this
project successfully. It includes architecture, standards, skills required,
and quality benchmarks.

================================================================================
SECTION 1: PROJECT OVERVIEW & REQUIREMENTS
================================================================================

PROJECT NAME:
  Multi-Agent Rug Pull Automation Visualization System

PROJECT GOAL:
  Build a real-time interactive visualization where 4 pixel-art agents
  execute a 6-phase rug pull automation operation. Backend runs the actual
  automation logic, frontend displays it live with agent animations, 
  progress bars, and transaction logs. Supports both simulation (testing)
  and production (real blockchain) modes.

TARGET USERS:
  - Security researchers analyzing rug pull mechanics
  - Developers learning blockchain security vulnerabilities
  - Users wanting to understand DeFi attack vectors
  - Educational demonstrations of token economics

DEPLOYMENT MODEL:
  - Backend: Node.js server (Replit FREE or Railway $5/month)
  - Frontend: Static React build (Vercel/Netlify FREE)
  - Real-time: WebSocket via Socket.io
  - Database: None (all in-memory, can add later)

TIMELINE:
  - Sprint 1: Backend + Socket.io (2-3 days)
  - Sprint 2: Frontend + Phaser (3-4 days)
  - Sprint 3: Integration + Deploy (2-3 days)
  - Total: 7-10 days (or 4-5 days with this guide)

BUDGET:
  - Development: $0 (open-source)
  - Hosting: $0-10/month (free options available)
  - Assets: $0 (free pixel art)

================================================================================
SECTION 2: TECHNOLOGY STACK & RATIONALE
================================================================================

BACKEND:
  ✅ Node.js 18 LTS
     Why: JavaScript runtime, vast npm ecosystem, easy to host, fast
     Version: 18.0.0 or higher
     Package Manager: npm 9+

  ✅ Express.js 4.18+
     Why: Lightweight HTTP framework, minimal overhead, Socket.io friendly
     Purpose: HTTP server, static file serving, REST endpoints

  ✅ Socket.io 4.6+
     Why: Real-time WebSocket with fallback, handles reconnection, low latency
     Purpose: Backend ↔ Frontend real-time communication
     Alternative: None better for this use case

  ✅ ethers.js 5.7+
     Why: Blockchain library, contract interaction, wallet management
     Purpose: Production mode - real blockchain transactions
     Alternative: web3.js (heavier, not recommended)

  ✅ dotenv 16+
     Why: Environment variable management
     Purpose: Secure handling of private keys

FRONTEND:
  ✅ React 18.2+
     Why: Component-based, state management, widely supported
     Version: Latest stable
     Use: UI layer (progress bars, logs, controls)

  ✅ Phaser 3.55+
     Why: 2D game engine, perfect for pixel art, excellent performance
     Purpose: Sprite rendering, animations, physics, scene management
     Alternative: Pixi.js (lighter but less features)

  ✅ Socket.io-client 4.6+
     Why: Matches backend version, handles reconnection
     Purpose: Frontend ↔ Backend real-time communication

  ✅ TailwindCSS 3+
     Why: Utility-first CSS, minimal bundle size, dark theme support
     Purpose: UI styling (progress bars, logs, control panel)

  ✅ Vite (or Create React App)
     Why: Fast build, hot module replacement, optimized output
     Recommendation: Vite for production, CRA for simplicity

DEPLOYMENT:
  ✅ Replit (FREE tier)
     Why: Always-on, free, no credit card, easy setup
     Cost: $0/month
     Limits: CPU throttling after 3 hours, but acceptable for this

  ✅ Railway.app (Pay-as-you-go, ~$5/month)
     Why: Better uptime, faster, unlimited hours
     Cost: $5-10/month (optional upgrade)
     Recommendation: Start free, upgrade if needed

  ✅ Vercel (FREE tier)
     Why: Optimized for React, instant deployments, CDN
     Cost: $0/month
     Perfect for static frontend hosting

================================================================================
SECTION 3: PROJECT ARCHITECTURE
================================================================================

ARCHITECTURE DIAGRAM:

┌──────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Frontend: React + Phaser (Static Build)                  │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ Phaser Scene: 2D Pixel-Art World                     │ │  │
│  │  │ - 4 Agent sprites (Deployer, Distributor,           │ │  │
│  │  │   Swapper, Extractor)                               │ │  │
│  │  │ - 4 Work zones                                       │ │  │
│  │  │ - Animations & progress bars                        │ │  │
│  │  │ - Real-time updates via Socket.io                   │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ React UI Layer                                       │ │  │
│  │  │ - Control panel (Start/Pause/Stop)                  │ │  │
│  │  │ - Phase progress tracker                            │ │  │
│  │  │ - Transaction log (real-time)                       │ │  │
│  │  │ - Final report                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │           Socket.io Client (WebSocket)                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                      ↕ WebSocket/Fallback
┌──────────────────────────────────────────────────────────────────┐
│                      NODE.JS BACKEND SERVER                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Express + Socket.io (Port 3000)                           │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ Automation Engine (6 Phases)                         │  │  │
│  │ │ ┌────────────────────────────────────────────────┐   │  │  │
│  │ │ │ Phase 1: Setup (Deploy token, create pool)    │   │  │  │
│  │ │ │ Phase 2: Staging (Distribute tokens, burn)    │   │  │  │
│  │ │ │ Phase 3: Buyer Entry (Accept swaps)           │   │  │  │
│  │ │ │ Phase 4: Control Layer (Activate restrictions)│   │  │  │
│  │ │ │ Phase 5: Extraction (Remove liquidity)        │   │  │  │
│  │ │ │ Phase 6: Forwarding (Move funds)              │   │  │  │
│  │ │ └────────────────────────────────────────────────┘   │  │  │
│  │ └──────────────────────────────────────────────────────┘  │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ Mode System (Simulation vs Production)             │  │  │
│  │ ├─ Simulation: In-memory (testing, $0)               │  │  │
│  │ └─ Production: Real blockchain (ethers.js, costs $)  │  │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ State Classes                                        │  │  │
│  │ ├─ Wallet.js (balance tracking)                       │  │  │
│  │ ├─ Pool.js (AMM pool simulation)                      │  │  │
│  │ ├─ Token.js (token contract state)                    │  │  │
│  │ └─ RealWallet/RealPool/RealToken (production)        │  │  │
│  │ ┌──────────────────────────────────────────────────────┐  │  │
│  │ │ Event Emitter (Real-time updates)                   │  │  │
│  │ └─ Emits phase_started, progress, completed, error   │  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         ↕
┌──────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN (Production Mode Only)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Ethereum / Polygon / BSC                                  │  │
│  │ - Real token contract deployed                           │  │
│  │ - Real Uniswap/Sushi liquidity pool                      │  │
│  │ - Real wallet transactions (costs gas)                   │  │
│  │ - On-chain verification                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

DATA FLOW:

1. User clicks "START OPERATION" on frontend
   → Socket.io emits 'start_operation' event

2. Backend receives event, starts Phase 1
   → Backend runs automation logic
   → Emits 'phase_started' event

3. Frontend receives 'phase_started'
   → Agent #1 walks to zone
   → Progress bar appears

4. Backend executes Phase 1 logic
   → Emits 'phase_progress' every ~500ms

5. Frontend receives 'phase_progress'
   → Updates progress bar
   → Shows chat bubble with action

6. Backend completes Phase 1
   → Emits 'phase_completed' with data

7. Frontend receives 'phase_completed'
   → Agent celebrates
   → Transition to Phase 2

8. Process repeats for Phases 2-6

9. Backend emits 'operation_complete'
   → Final report shows profit/ROI
   → All agents celebrate

================================================================================
SECTION 4: DETAILED FILE STRUCTURE
================================================================================

PROJECT ROOT:
```
rug-pull-visualizer/
│
├── backend/
│   ├── server.js                         (Express + Socket.io entry)
│   ├── automation-wrapper.js             (Phase orchestrator)
│   ├── config.json                       (Configuration params)
│   ├── package.json                      (Dependencies)
│   ├── .env.example                      (Private key template)
│   ├── .gitignore                        (Exclude .env, node_modules)
│   │
│   ├── modes/
│   │   ├── simulation/
│   │   │   ├── Wallet.js                 (In-memory wallet)
│   │   │   ├── Pool.js                   (AMM simulation)
│   │   │   └── Token.js                  (Token state)
│   │   │
│   │   └── production/
│   │       ├── RealWallet.js             (ethers.js wallet)
│   │       ├── RealPool.js               (Real pool interaction)
│   │       ├── RealToken.js              (Real token interaction)
│   │       └── Router.js                 (DEX routing)
│   │
│   ├── phases/
│   │   ├── Phase1.js                     (Setup & deployment)
│   │   ├── Phase2.js                     (Distribution & burns)
│   │   ├── Phase3.js                     (Buyer entry & swaps)
│   │   ├── Phase4.js                     (Control layer)
│   │   ├── Phase5.js                     (Liquidity extraction)
│   │   └── Phase6.js                     (Cash forwarding)
│   │
│   ├── utils/
│   │   ├── modeFactory.js                (Mode switcher)
│   │   ├── calculations.js               (AMM math, ROI, etc)
│   │   └── logger.js                     (Transaction logging)
│   │
│   ├── contracts/
│   │   ├── abis/
│   │   │   ├── ERC20.json                (ERC20 ABI)
│   │   │   ├── UniswapV2Router.json      (Router ABI)
│   │   │   ├── UniswapV2Factory.json     (Factory ABI)
│   │   │   └── UniswapV2Pair.json        (Pair ABI)
│   │   │
│   │   └── Token.sol                     (Optional: Token contract code)
│   │
│   └── logs/                             (Transaction logs directory)
│       └── [will be created at runtime]
│
├── frontend/
│   ├── public/
│   │   └── index.html                    (HTML entry point)
│   │
│   ├── src/
│   │   ├── index.js                      (React entry)
│   │   ├── App.jsx                       (Main app component)
│   │   ├── App.css                       (Global styles)
│   │   │
│   │   ├── scenes/
│   │   │   └── PhaserScene.jsx           (Phaser game scene)
│   │   │
│   │   ├── classes/
│   │   │   ├── Agent.js                  (Agent sprite + logic)
│   │   │   ├── Zone.js                   (Work zone)
│   │   │   ├── ProgressBar.js            (UI progress bar)
│   │   │   └── ChatBubble.js             (Speech bubble)
│   │   │
│   │   ├── components/
│   │   │   ├── ControlPanel.jsx          (Start/Pause/Stop buttons)
│   │   │   ├── PhaseProgress.jsx         (Phase tracker)
│   │   │   ├── TransactionLog.jsx        (Real-time log)
│   │   │   └── FinalReport.jsx           (Profit/ROI report)
│   │   │
│   │   ├── services/
│   │   │   └── socketService.js          (Socket.io client)
│   │   │
│   │   ├── assets/
│   │   │   ├── sprites/                  (Pixel art sprites)
│   │   │   │   ├── agent_deployer.png
│   │   │   │   ├── agent_distributor.png
│   │   │   │   ├── agent_swapper.png
│   │   │   │   └── agent_extractor.png
│   │   │   │
│   │   │   └── sounds/                   (Optional audio)
│   │   │       ├── success.mp3
│   │   │       └── complete.mp3
│   │   │
│   │   └── styles/
│   │       └── tailwind.config.js        (Tailwind configuration)
│   │
│   ├── package.json                      (Dependencies)
│   ├── tailwind.config.js                (Tailwind config)
│   ├── postcss.config.js                 (PostCSS config)
│   └── .env.local                        (Backend URL for dev)
│
├── docs/
│   ├── ARCHITECTURE.md                   (Architecture explanation)
│   ├── API_EVENTS.md                     (Socket.io event reference)
│   ├── DEPLOYMENT.md                     (Deployment guide)
│   └── TROUBLESHOOTING.md                (Common issues & fixes)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                    (Optional: CI/CD)
│
├── README.md                             (Project overview)
├── SETUP.md                              (Setup instructions)
└── .gitignore                            (Git ignore rules)
```

FILE CREATION ORDER:
1. Backend: server.js (entry point)
2. Backend: config.json (configuration)
3. Backend: package.json (dependencies)
4. Simulation mode classes (Wallet, Pool, Token)
5. Production mode classes (Real versions)
6. Phase files (Phase1-6)
7. Utils (modeFactory, calculations, logger)
8. Frontend: package.json
9. Frontend: App.jsx + Socket.io client
10. Frontend: Phaser scene
11. Frontend: React components
12. Test & debug
13. Deploy

================================================================================
SECTION 5: CODE QUALITY STANDARDS
================================================================================

STANDARDS TO FOLLOW:

1. CODE STYLE
   ✅ Use ES6+ modern JavaScript
   ✅ Use async/await (no callbacks)
   ✅ Use const/let (never var)
   ✅ Use arrow functions for callbacks
   ✅ Keep functions under 50 lines
   ✅ Use descriptive variable names

   Example:
   ```javascript
   // ✅ GOOD
   async function transferTokens(fromWallet, toAddress, amount) {
     if (fromWallet.getBalance('TOKEN') < amount) {
       throw new Error('Insufficient balance');
     }
     const result = await fromWallet.transfer(toAddress, amount, 'TOKEN');
     return result;
   }

   // ❌ BAD
   function transfer(w, to, amt) {
     if (w.bal < amt) throw new Error('no balance');
     return w.trans(to, amt);
   }
   ```

2. ERROR HANDLING
   ✅ Always use try-catch in async functions
   ✅ Emit error events to frontend
   ✅ Log errors with timestamp
   ✅ Provide helpful error messages

   Example:
   ```javascript
   try {
     await phase1.run(config);
   } catch (error) {
     console.error('[Phase1] Error:', error.message);
     socket.emit('operation_error', { 
       phase: 1, 
       error: error.message,
       timestamp: new Date().toISOString()
     });
   }
   ```

3. COMMENTS & DOCUMENTATION
   ✅ Comment why, not what
   ✅ Include JSDoc for functions
   ✅ Document parameters and return values
   ✅ Include examples for complex logic

   Example:
   ```javascript
   /**
    * Calculate output amount from AMM pool
    * Uses constant product formula: x * y = k
    * 
    * @param {number} inputAmount - Token amount being swapped
    * @param {string} inputAsset - 'TOKEN' or 'STABLECOIN'
    * @returns {number} Output amount after slippage & fees
    */
   function calculateSwapOutput(inputAmount, inputAsset) {
     // Apply 0.25% fee
     const inputAfterFee = inputAmount * 0.9975;
     // Calculate output using AMM formula
     return this.reserves.TOKEN * inputAfterFee / (this.reserves.STABLECOIN + inputAfterFee);
   }
   ```

4. PERFORMANCE TARGETS
   ✅ Frontend: 60 FPS (Phaser)
   ✅ Backend: Respond <100ms per event
   ✅ Real-time: <200ms latency (acceptable)
   ✅ Bundle size: <100KB gzipped

5. TESTING
   ✅ Test each phase independently
   ✅ Test both simulation and production modes
   ✅ Test socket.io connection/reconnection
   ✅ Test error scenarios

6. GIT PRACTICES
   ✅ Commit frequently with clear messages
   ✅ Never commit .env or private keys
   ✅ Use .gitignore properly
   ✅ Write descriptive commit messages

   Example:
   ```
   ✅ GOOD: "Add Phase1 deployment logic with event emissions"
   ❌ BAD: "fix stuff" or "update"
   ```

================================================================================
SECTION 6: SOCKET.IO EVENT REFERENCE
================================================================================

BACKEND → FRONTEND (Real-time updates):

```
// PHASE CONTROL
socket.emit('phase_started', {
  phase: 1,                    // 1-6
  agent: 'Deployer'            // Agent name
})

socket.emit('phase_progress', {
  phase: 1,
  progress: 0-100              // Percentage
})

socket.emit('phase_completed', {
  phase: 1,
  data: {                       // Phase-specific results
    success: true,
    transactions: [],
    balances: {}
  }
})

// AGENT ACTIONS
socket.emit('agent_walking', {
  agent: 1,                     // 1-4
  destination: 'deployment'     // Zone name
})

socket.emit('agent_working', {
  agent: 1,
  action: 'Deploying token...',
  progress: 50                  // 0-100
})

socket.emit('agent_completed', {
  agent: 1
})

// TRANSACTION DATA
socket.emit('transaction_log', {
  from: '0x...',
  to: '0x...',
  amount: 12345.67,
  asset: 'USDT',
  type: 'transfer',             // transfer, swap, burn, LP
  timestamp: '2024-01-01T12:00:00Z',
  hash: '0x...'
})

socket.emit('wallet_updated', {
  wallet: '0x...',
  asset: 'TOKEN',
  balance: 50000000
})

// ERROR HANDLING
socket.emit('operation_error', {
  phase: 1,
  error: 'Insufficient liquidity',
  timestamp: '2024-01-01T12:00:00Z'
})

// COMPLETION
socket.emit('operation_complete', {
  success: true,
  duration: 456,                // Seconds
  totalProfit: 146345.34,       // USDT profit
  roi: 488,                     // Percent
  mode: 'simulation',           // or 'production'
  final_state: {...}
})
```

FRONTEND → BACKEND (User actions):

```
socket.emit('start_operation', {
  configOverride: {}            // Optional config overrides
})

socket.emit('pause_operation', {})

socket.emit('resume_operation', {})

socket.emit('stop_operation', {})
```

================================================================================
SECTION 7: DEPENDENCIES & VERSIONS
================================================================================

BACKEND - package.json:
```json
{
  "name": "rug-pull-visualizer-backend",
  "version": "1.0.0",
  "description": "Rug pull automation backend with real & simulation modes",
  "main": "server.js",
  "type": "module",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.0",
    "cors": "^2.8.5",
    "ethers": "^5.7.2",
    "dotenv": "^16.0.3",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.3.0"
  }
}
```

FRONTEND - package.json:
```json
{
  "name": "rug-pull-visualizer-frontend",
  "version": "1.0.0",
  "description": "Multi-agent visualization with React & Phaser",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "phaser": "^3.55.2",
    "socket.io-client": "^4.6.0",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.2.4",
    "postcss": "^8.4.21",
    "autoprefixer": "^10.4.13"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

IMPORTANT:
- Use exact versions above (not ^)
- Test with Node 18 LTS minimum
- Use npm ci (not npm install) for production
- Keep dependencies minimal

================================================================================
SECTION 8: COMMON PITFALLS & HOW TO AVOID THEM
================================================================================

PITFALL #1: Socket.io Connection Issues
Problem: Frontend can't connect to backend
Solution:
  ✅ Check CORS settings in server.js
  ✅ Verify port 3000 is exposed
  ✅ Use console.log to debug connection
  ✅ Test with http://localhost:3000 first
  ✅ Check network tab in browser dev tools

PITFALL #2: Gas Estimation Errors (Production Mode)
Problem: Transactions fail with "out of gas"
Solution:
  ✅ Set gasLimit to 500000-1000000
  ✅ Test on testnet first
  ✅ Check account has sufficient ETH for gas
  ✅ Use ethers.js gasPrice from network

PITFALL #3: Private Key Exposure
Problem: Private keys committed to GitHub
Solution:
  ✅ NEVER put .env in git
  ✅ Use .env.example (without keys)
  ✅ Add .env to .gitignore
  ✅ Rotate keys if accidentally exposed
  ✅ Use environment variables in CI/CD

PITFALL #4: Phaser Scene Not Rendering
Problem: Blank canvas
Solution:
  ✅ Check canvas element exists in HTML
  ✅ Verify Phaser config is correct
  ✅ Test with simple colored circles first
  ✅ Check browser console for errors
  ✅ Ensure scene is added to game

PITFALL #5: AMM Math Precision
Problem: Swaps calculate wrong amounts
Solution:
  ✅ Use BigNumber for all calculations
  ✅ Account for decimals (18 for TOKEN, 6 for USDT)
  ✅ Apply fee (0.25%) correctly
  ✅ Test with simple numbers first
  ✅ Compare with Uniswap contract output

PITFALL #6: Phase Execution Order
Problem: Phases run out of order
Solution:
  ✅ Use await for each phase
  ✅ Don't start phase 2 until phase 1 completes
  ✅ Check automation-wrapper.js orchestration
  ✅ Use Promise chains or async/await correctly

PITFALL #7: React Component Re-renders
Problem: Animations stutter
Solution:
  ✅ Use useMemo for expensive calculations
  ✅ Use useCallback for event handlers
  ✅ Don't update state on every socket event
  ✅ Batch updates when possible
  ✅ Profile with React DevTools

PITFALL #8: Slippage & Fees
Problem: Actual output doesn't match expected
Solution:
  ✅ Account for 0.25% DEX fee
  ✅ Set slippage tolerance (0.5%-2%)
  ✅ Add minOutputAmount check
  ✅ Show slippage in UI

================================================================================
SECTION 9: QUALITY CHECKLIST BEFORE DEPLOYMENT
================================================================================

BACKEND QUALITY:

Code Quality:
  ☐ All functions have JSDoc comments
  ☐ No console.log (use logger.js)
  ☐ Error handling on all async functions
  ☐ No hardcoded values (use config.json)
  ☐ Mode factory used for all wallets/pools
  ☐ Proper error messages to frontend

Functionality:
  ☐ Phase 1: Token deployed, pool created, LP seeded
  ☐ Phase 2: Tokens distributed, burns executed
  ☐ Phase 3: Swaps calculated correctly with fees
  ☐ Phase 4: Whitelist/restrictions activated
  ☐ Phase 5: LP removed, amounts correct
  ☐ Phase 6: Funds forwarded to multiple wallets
  ☐ All socket events emitted correctly

Testing:
  ☐ Simulation mode tested end-to-end
  ☐ Production mode tested on testnet
  ☐ All 6 phases complete without errors
  ☐ Socket.io connection/disconnection handled
  ☐ Error scenarios tested
  ☐ Gas estimation works (production)

Performance:
  ☐ Phase 1-6 run in <10 minutes total
  ☐ No memory leaks (test long operations)
  ☐ Backend responds <100ms to requests
  ☐ Socket events fire <200ms latency

Security:
  ☐ No private keys in code
  ☐ .env properly ignored
  ☐ CORS configured correctly
  ☐ Input validation on all parameters
  ☐ Error messages don't leak sensitive info

FRONTEND QUALITY:

Code Quality:
  ☐ All React components are functional
  ☐ All components have JSDoc
  ☐ No console.log (use error boundary)
  ☐ Props validated with PropTypes or TypeScript
  ☐ State managed with useState/useContext
  ☐ No direct DOM manipulation

Functionality:
  ☐ Agent sprites render correctly
  ☐ Agents walk to zones smoothly
  ☐ Progress bars animate 0-100%
  ☐ Chat bubbles appear/disappear
  ☐ Transaction log updates real-time
  ☐ Control buttons (Start/Pause/Stop) work
  ☐ Final report displays correctly

Visuals:
  ☐ Pixel-art agents visible
  ☐ Dark theme applied
  ☐ Text readable on dark background
  ☐ Layout responsive (desktop primary)
  ☐ No visual glitches or flickering
  ☐ Animations smooth (60 FPS)

Performance:
  ☐ 60 FPS on low-end devices
  ☐ Bundle size <100KB gzipped
  ☐ No memory leaks
  ☐ Fast load time (<3 seconds)

Connection:
  ☐ Socket.io connects to backend
  ☐ Reconnection works if connection drops
  ☐ Real-time updates appear <200ms
  ☐ No connection errors in console

DEPLOYMENT:

Code:
  ☐ No console.log statements
  ☐ No debug code
  ☐ .env not committed
  ☐ README.md updated
  ☐ All dependencies in package.json

Configuration:
  ☐ config.json has correct values
  ☐ .env.example created (without keys)
  ☐ BACKEND_URL set for frontend

Testing:
  ☐ Works on Replit
  ☐ Works on localhost
  ☐ Works on different browsers
  ☐ Works with slow internet (2G throttle)

Documentation:
  ☐ README explains how to run
  ☐ Setup instructions clear
  ☐ Environment variables documented
  ☐ Troubleshooting guide included

================================================================================
SECTION 10: COMMUNICATION WITH USER
================================================================================

WHEN TO ASK FOR CLARIFICATION:
  ✅ If a requirement is ambiguous
  ✅ If two approaches have trade-offs
  ✅ If you find a significant constraint
  ✅ If something contradicts existing documents

WHEN NOT TO ASK:
  ❌ For minor styling decisions (use defaults)
  ❌ For exact wording (use standard patterns)
  ❌ For things already documented (use docs)

HOW TO REPORT PROGRESS:
  ✅ After each sprint completion
  ✅ With deliverables checklist
  ✅ With URLs/links to code
  ✅ With any blockers encountered

DELIVERABLES FOR EACH SPRINT:

Sprint 1 (Backend):
  - ✅ server.js running on :3000
  - ✅ Config.json with params
  - ✅ Phase files executing sequentially
  - ✅ Socket.io events emitting correctly
  - ✅ Both simulation and production modes working
  - ✅ Test run with sample output

Sprint 2 (Frontend):
  - ✅ React app running on :3000
  - ✅ Phaser scene with 4 visible agents
  - ✅ Agents move when socket events fire
  - ✅ Progress bars animate
  - ✅ Transaction log displays
  - ✅ Control panel buttons work
  - ✅ End-to-end test with backend

Sprint 3 (Deployment):
  - ✅ Backend deployed to Replit/Railway
  - ✅ Frontend deployed to Vercel
  - ✅ Live URLs shared
  - ✅ Full operation tested end-to-end
  - ✅ Documentation complete
  - ✅ Readme with usage instructions

================================================================================
SECTION 11: PRODUCTION READINESS CHECKLIST
================================================================================

BEFORE GOING LIVE:

Security:
  ☐ No private keys in repository
  ☐ Private keys in .env (git-ignored)
  ☐ CORS whitelist set (not *)
  ☐ Rate limiting on endpoints
  ☐ Input validation everywhere
  ☐ Error messages sanitized

Performance:
  ☐ Minified & bundled
  ☐ Images optimized
  ☐ Lazy loading where applicable
  ☐ Database connections pooled (if DB added)
  ☐ Caching headers set

Monitoring:
  ☐ Error logging to file/service
  ☐ Transaction logs saved
  ☐ Uptime monitoring enabled
  ☐ Alert notifications configured

Documentation:
  ☐ README.md complete
  ☐ API documentation
  ☐ Troubleshooting guide
  ☐ Setup instructions

Testing:
  ☐ All 6 phases tested
  ☐ Both modes tested
  ☐ Error scenarios tested
  ☐ Load testing done (100+ concurrent)
  ☐ Cross-browser testing done

Deployment:
  ☐ Staging environment matches production
  ☐ Database backups automated
  ☐ Rollback plan documented
  ☐ Monitoring alerts working

================================================================================
SECTION 12: SKILLS REQUIRED FROM CLAUDE
================================================================================

MUST-HAVE SKILLS:

1. JavaScript/Node.js
   - Async/await patterns
   - Event-driven architecture
   - Module systems (ES6)
   - npm/package management

2. Web Server Architecture
   - Express.js routing
   - HTTP request/response cycle
   - Static file serving
   - CORS & security headers

3. Real-time Communication
   - Socket.io patterns
   - Event emitter pattern
   - Connection management
   - Binary & text protocols

4. Blockchain/Smart Contracts
   - ERC20 token standard
   - Uniswap V2 AMM mechanics
   - ethers.js library
   - Gas estimation

5. React & Frontend
   - Functional components
   - Hooks (useState, useEffect, useCallback)
   - Component composition
   - State management

6. Phaser Game Engine
   - Scene management
   - Sprite creation & animation
   - Tweens & physics
   - Asset loading

7. Database Design (basic)
   - JSON structure
   - State normalization
   - Transaction logging

NICE-TO-HAVE SKILLS:

8. DevOps
   - Docker basics
   - Environment variables
   - CI/CD concepts
   - Deployment strategies

9. Testing
   - Unit testing
   - Integration testing
   - Error scenario testing

10. Security
    - Private key management
    - Input validation
    - XSS/CSRF prevention

================================================================================
SECTION 13: BUILD INSTRUCTIONS FOR CLAUDE
================================================================================

YOUR ROLE:
You are building a complete, production-ready system from these specifications.

YOUR APPROACH:
1. Read this entire document FIRST
2. Re-read any section you're uncertain about
3. Reference the accompanying files:
   - CLAUDE_CODE_BUILD_PROMPT.txt (3-phase plan)
   - BACKEND_COMPLETE_IMPLEMENTATION.txt (code examples)
   - AGENT_VISUALIZATION_SUMMARY.txt (quick reference)
4. Follow the 3-sprint structure exactly
5. Complete all quality checklists before moving forward

YOUR BUILD ORDER:
  Sprint 1: Backend + Socket.io
    → server.js
    → config.json
    → Mode classes (simulation + production)
    → Phase files (1-6)
    → Utils & helpers
    → Test with curl/Socket.io client
  
  Sprint 2: Frontend + Phaser
    → React app structure
    → Phaser scene with agents
    → Socket.io client connection
    → React components (UI)
    → End-to-end connection
  
  Sprint 3: Deploy + Verify
    → Build for production
    → Deploy backend to Replit/Railway
    → Deploy frontend to Vercel
    → Full operation test

YOUR SUCCESS METRICS:
  ✅ All files created as specified
  ✅ All quality checklist items complete
  ✅ All socket events working correctly
  ✅ 6 phases execute in order
  ✅ Agents animate correctly
  ✅ Real-time sync <200ms latency
  ✅ Zero console errors
  ✅ Both simulation & production modes work
  ✅ Deployment successful
  ✅ End-to-end test passes

YOUR CONSTRAINTS:
  - No external auth (keep simple)
  - No database (in-memory is fine)
  - No complex build process
  - Minimal dependencies
  - Maximum code clarity
  - Full error handling

IF YOU GET STUCK:
  1. Re-read relevant section of this document
  2. Check the code examples in referenced files
  3. Test with simple console.log debugging
  4. Ask clarifying questions if truly blocked
  5. Document any deviations & explain rationale

================================================================================
SECTION 14: FINAL NOTES
================================================================================

PHILOSOPHY:
Build production-quality code that is:
  - Clear & maintainable
  - Well-documented
  - Thoroughly tested
  - Fully functional
  - Visually polished

SCOPE:
This project has a LOT of parts. Don't try to optimize prematurely.
Focus on:
  1. Getting it working
  2. Making it clean
  3. Making it deployable
  4. Then optimizing if needed

TIME MANAGEMENT:
  - Sprint 1: 2-3 days
  - Sprint 2: 3-4 days
  - Sprint 3: 2-3 days
  - Buffer: 1-2 days for unexpected issues
  - Total: 8-12 days

If you're building this right, you'll have something:
  ✨ Visually impressive
  ✨ Technically sound
  ✨ Fully functional
  ✨ Easy to understand
  ✨ Ready for production

GO BUILD! 🚀

================================================================================
END OF CLAUDE PROJECT SETUP GUIDE
================================================================================

Next steps:
1. Read CLAUDE_CODE_BUILD_PROMPT.txt for implementation details
2. Reference BACKEND_COMPLETE_IMPLEMENTATION.txt for code patterns
3. Start Sprint 1: Build backend
4. Complete quality checklists
5. Deploy and celebrate!
