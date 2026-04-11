# AUTOMATA - Build Instructions for Claude Code

## START HERE

You are building **Automata** - a multi-agent protocol visualization system.

**What you're building:**
A real-time interactive visualization where 4 pixel-art agents execute a 6-phase automation operation. Backend runs the actual logic (both simulation for testing and production for real blockchain). Frontend displays it live with agents moving, progress bars, transaction logs, and final profit report.

**Timeline:** 7-10 days (3 sprints)  
**Cost:** $0 to build, $0-10/month to host  
**Technology:** Node.js + React + Phaser + Socket.io + ethers.js  

---

## YOUR IMMEDIATE TASKS (READ THESE FIRST)

### Step 1: Read the Rules (30 minutes)
Read **CLAUDE_PROJECT_SETUP_GUIDE.md** COMPLETELY. This contains:
- Project requirements
- Technology stack rationale
- Architecture diagrams
- Code quality standards
- Socket.io events reference
- Quality checklist
- Common pitfalls to avoid
- Production readiness

⚠️ **This is critical.** Read all sections.

### Step 2: Understand the Build Plan (15 minutes)
Read **CLAUDE_CODE_BUILD_PROMPT.md** for the exact 3-phase plan:
- Sprint 1: Backend + Socket.io (2-3 days)
- Sprint 2: Frontend + Phaser (3-4 days)
- Sprint 3: Deployment (2-3 days)

### Step 3: Reference Code Patterns (ongoing)
**BACKEND_COMPLETE_IMPLEMENTATION.md** has all the code examples you need:
- Wallet classes (simulation + real)
- Pool classes (simulation + real)
- Token classes (simulation + real)
- Phase file structure
- Server.js entry point

---

## BUILD ORDER (FOLLOW EXACTLY)

### SPRINT 1: BACKEND + SOCKET.IO (2-3 days)

**What to create:**
- `server.js` - Express + Socket.io server
- `config.json` - Configuration with parameters
- `automation-wrapper.js` - Orchestrates Phase1-6
- `package.json` - Backend dependencies

**Modes (Simulation & Production):**
- `modes/simulation/Wallet.js`
- `modes/simulation/Pool.js`
- `modes/simulation/Token.js`
- `modes/production/RealWallet.js` (ethers.js)
- `modes/production/RealPool.js` (real DEX)
- `modes/production/RealToken.js` (real token)
- `modes/production/Router.js` (DEX routing)

**Phases (6 files):**
- `phases/Phase1.js` (Setup, deploy, seed liquidity)
- `phases/Phase2.js` (Distribute, burn)
- `phases/Phase3.js` (Buyer entry, swaps)
- `phases/Phase4.js` (Control layer, restrictions)
- `phases/Phase5.js` (Liquidity extraction)
- `phases/Phase6.js` (Cash forwarding)

**Utils:**
- `utils/modeFactory.js` (Switch simulation ↔ production)
- `utils/calculations.js` (AMM math, ROI, etc)
- `utils/logger.js` (Transaction logging)

**Env:**
- `.env.example` (Template, no real keys)
- `.gitignore` (Exclude .env, node_modules)

**Test:**
- Run `npm start`
- Test with curl/Socket.io client
- Verify all 6 phases complete in order
- Verify events emit correctly

**Deliverable:** 
Working backend on :3000 with both simulation & production modes working.

---

### SPRINT 2: FRONTEND + PHASER (3-4 days)

**What to create:**
- `src/index.js` - React entry point
- `src/App.jsx` - Main React component
- `src/App.css` - Global styles
- `package.json` - Frontend dependencies

**Phaser Scene:**
- `src/scenes/PhaserScene.jsx` - 2D pixel-art world with zones

**Classes:**
- `src/classes/Agent.js` - Agent sprite, movement, animations
- `src/classes/Zone.js` - Work zones
- `src/classes/ProgressBar.js` - Progress bar UI
- `src/classes/ChatBubble.js` - Speech bubbles

**React Components:**
- `src/components/ControlPanel.jsx` - Start/Pause/Stop buttons
- `src/components/PhaseProgress.jsx` - Phase tracker
- `src/components/TransactionLog.jsx` - Real-time transaction log
- `src/components/FinalReport.jsx` - Profit/ROI display

**Services:**
- `src/services/socketService.js` - Socket.io client connection

**Assets:**
- `src/assets/sprites/` - Pixel art agents (or code-generated circles)
- `src/assets/sounds/` - Optional audio files

**Config:**
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS setup
- `.env.local` - Backend URL (e.g., http://localhost:3000)

**Test:**
- Run `npm start`
- Verify React app loads
- Verify Socket.io connects to backend
- Click "START OPERATION"
- Watch agents move through zones
- Verify progress bars animate
- Verify transaction log updates real-time
- Watch final report display

**Deliverable:**
Working frontend connected to backend with agents animating correctly.

---

### SPRINT 3: DEPLOYMENT (2-3 days)

**Backend Deployment:**
- Deploy to Replit (FREE) OR Railway ($5/month)
- Set environment variables
- Test on live URL

**Frontend Deployment:**
- `npm run build` to create production build
- Deploy to Vercel or Netlify (FREE)
- Set `REACT_APP_BACKEND_URL` environment variable
- Point to deployed backend URL

**Verification:**
- Open deployed frontend URL in browser
- Verify backend and frontend connect
- Run full 6-phase operation
- Check all phases complete
- Verify final report is correct

**Documentation:**
- Write README.md
- Write SETUP.md (how to run locally)
- Update .env.example

**Deliverable:**
Live Automata system running on deployed backend + frontend.

---

## QUALITY CHECKLIST

Before moving to next sprint, verify:

**Sprint 1 Completion:**
- ☐ `npm start` runs without errors
- ☐ Socket.io connects successfully
- ☐ All 6 phases execute in order
- ☐ Phase1 emits correct events
- ☐ Phase2 emits correct events
- ☐ Phase3 emits correct events
- ☐ Phase4 emits correct events
- ☐ Phase5 emits correct events
- ☐ Phase6 emits correct events
- ☐ Both simulation and production modes work
- ☐ No console errors
- ☐ All JSDoc comments present
- ☐ Error handling on all async functions

**Sprint 2 Completion:**
- ☐ React app runs without errors
- ☐ Phaser scene renders correctly
- ☐ 4 agents visible in world
- ☐ Progress bars animate 0-100%
- ☐ Agents walk to zones smoothly
- ☐ Chat bubbles appear/disappear
- ☐ Transaction log updates in real-time
- ☐ Control buttons work (Start/Pause/Stop)
- ☐ Final report displays correctly
- ☐ 60 FPS performance
- ☐ No memory leaks
- ☐ All JSDoc comments present

**Sprint 3 Completion:**
- ☐ Backend deployed and running
- ☐ Frontend deployed and running
- ☐ Backend URL accessible
- ☐ Frontend connects to backend
- ☐ Full operation runs end-to-end
- ☐ All phases execute correctly
- ☐ Agents animate smoothly
- ☐ Real-time sync works (<200ms)
- ☐ No console errors on deployed version
- ☐ README complete
- ☐ SETUP guide complete

---

## SOCKET.IO EVENTS REFERENCE

**Backend → Frontend (emit these):**

```javascript
// Phase control
socket.emit('phase_started', { phase: 1, agent: 'Deployer' })
socket.emit('phase_progress', { phase: 1, progress: 50 })
socket.emit('phase_completed', { phase: 1, data: {...} })

// Agent actions
socket.emit('agent_walking', { agent: 1, destination: 'deployment' })
socket.emit('agent_working', { agent: 1, action: 'Deploying...', progress: 50 })
socket.emit('agent_completed', { agent: 1 })

// Transactions
socket.emit('transaction_log', { from: '0x...', to: '0x...', amount: 123, asset: 'TOKEN', type: 'transfer' })

// Completion
socket.emit('operation_complete', { success: true, totalProfit: 146345, roi: 488, duration: 456 })

// Errors
socket.emit('operation_error', { phase: 1, error: 'message' })
```

**Frontend → Backend (listen for these):**

```javascript
socket.emit('start_operation', { configOverride: {} })
socket.emit('pause_operation', {})
socket.emit('resume_operation', {})
socket.emit('stop_operation', {})
```

---

## KEY CONSTRAINTS

✅ **Code Quality:**
- Use async/await (no callbacks)
- All functions under 50 lines
- JSDoc comments on all functions
- Descriptive variable names
- Error handling on all async code

✅ **Performance:**
- 60 FPS (Phaser)
- <100ms backend response
- <200ms WebSocket latency
- <100KB bundle (gzipped)

✅ **Security:**
- No private keys in code
- .env properly ignored
- CORS configured
- Input validation everywhere

✅ **Testing:**
- Test each phase independently
- Test socket.io connection
- Test both modes (simulation & production)
- Test error scenarios

---

## USEFUL REFERENCES

**Read when needed:**
- `BACKEND_COMPLETE_IMPLEMENTATION.md` - Code examples (reference while coding)
- `CLAUDE_PROJECT_SETUP_GUIDE.md` - Rules & standards (read completely first)
- `agent_visualization_research.md` - Deep dive (optional)

---

## SUCCESS CRITERIA

**You're done when:**
- ✅ All files created as specified
- ✅ All quality checklists complete
- ✅ 6 phases execute in order
- ✅ Agents animate correctly
- ✅ Real-time sync works (<200ms)
- ✅ Zero console errors
- ✅ Both simulation & production modes work
- ✅ Deployed and live
- ✅ End-to-end test passes

---

## LET'S BUILD 🚀

You have everything you need. Start with Sprint 1.

**First action:**
1. Read CLAUDE_PROJECT_SETUP_GUIDE.md completely
2. Create server.js (Express + Socket.io)
3. Create config.json (parameters)
4. Create backend folder structure
5. Create Phase1.js
6. Test with `npm start`

Go!
