# BUILD PROMPT: Multi-Agent Rug Pull Visualization System

## INSTRUCTIONS FOR CLAUDE CODE

You are building a full-stack visualization system for a rug pull automation operation. The system consists of a Node.js backend running 6-phase automation logic and a React + Phaser frontend showing 4 pixel-art agents executing the operation in real-time.

---

## PROJECT SCOPE

### What You're Building:
1. **Backend Server** — Node.js + Express + Socket.io that runs the 6-phase rug pull automation
2. **Frontend Visualization** — React + Phaser pixel-art world with 4 agents moving around and performing actions
3. **Real-time Sync** — WebSocket communication between backend and frontend

### This is a FULL STACK PROJECT (both backend and frontend)

---

## PHASE 1: BACKEND SETUP & SOCKET.IO INTEGRATION

### Goals:
- Create Express + Socket.io server
- Wrap existing Phase1-6 automation code
- Emit real-time events for each phase
- Test with a simple Socket.io client

### Files to Create:

#### 1. `package.json` (Backend)
```json
{
  "name": "rug-pull-visualizer-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

#### 2. `server.js` (Main Backend Server)
Create an Express server with Socket.io that:
- Listens on port 3000
- Serves static files (frontend)
- Handles Socket.io connections
- Implements start_operation, pause_operation, stop_operation listeners
- Example:
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
  transports: ['websocket', 'polling']
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('start_operation', async (config) => {
    console.log('Starting operation with config:', config);
    // Call automation-wrapper here
    await runAutomation(config, io, socket);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Backend server running on http://localhost:3000');
});
```

#### 3. `automation-wrapper.js` (Wraps Phase1-6)
This file wraps your existing Phase1-6 code and emits Socket.io events:
- Import Phase1.js through Phase6.js (existing code)
- Create a `runAutomation()` function that:
  - Runs each phase sequentially
  - Emits events for:
    - Phase start: `{ phase: 1, agent: 'Deployer' }`
    - Progress updates: `{ phase: 1, progress: 50 }`
    - Phase completion: `{ phase: 1, results: {...} }`
    - Errors: `{ phase: 1, error: 'message' }`
  - Passes progress callbacks to each phase
  - Returns final results
- Example event emissions:
```javascript
const runAutomation = async (config, io, socket) => {
  // PHASE 1
  socket.emit('phase_started', { phase: 1, agent: 'Deployer' });
  
  const phase1Result = await Phase1.run(config, (progress) => {
    socket.emit('phase_progress', { phase: 1, progress });
  });
  
  socket.emit('phase_completed', { phase: 1, data: phase1Result });
  
  // PHASE 2
  socket.emit('phase_started', { phase: 2, agent: 'Distributor' });
  // ... and so on for phases 3-6
  
  // Final summary
  socket.emit('operation_complete', {
    total_profit: calculateProfit(),
    roi: calculateROI(),
    final_state: state
  });
};
```

#### 4. `config.json` (Configuration Parameters)
Create a config file with ALL parameters:
```json
{
  "DEPLOYER_ADDRESS": "0xf5743d985fedac4Af41761aA5404bDd261e9d44b",
  "ADMIN_WALLET": "0x0aFF194B89bfBb72ae3734890f315a950170af74",
  "POOL_ADDRESS": "0x816B2242333b4a872b6DA4892F9501931E25cfF6",
  "FEE_CAPTURE_WALLET": "0xca226...",
  "TOTAL_MINT_AMOUNT": 100000000,
  "INITIAL_TOKEN_SEED": 30000000,
  "INITIAL_STABLECOIN_SEED": 30000,
  "FEE_PERCENT": 0.25,
  "DISTRIBUTION_WALLETS": [
    { "address": "0xa656...", "amount": 20000000 },
    { "address": "0xf924...", "amount": 20000000 },
    { "address": "0xf89d...", "amount": 20000000 },
    { "address": "0x85C3...", "amount": 6000000 }
  ],
  "BURN_AMOUNTS": [2000000, 2000000],
  "BUYER_WALLETS": [
    { "address": "0xf774BfC...", "native_amount": 0.24 }
  ],
  "LP_REMOVAL_TXNS": [
    { "date": "2024-11-19", "stable_coin_amount": 145243.92, "token_amount": 4711631.07 },
    { "date": "2024-11-20", "stable_coin_amount": 31101.42, "token_amount": 491748.15 }
  ],
  "CASH_FORWARDING_TXNS": [
    { "from": "ADMIN_WALLET", "to": "0xe8bA8cAFB5aE6713b09E5389c93Cd2D0b1754A86", "amount": 145243.92 },
    { "from": "ADMIN_WALLET", "to": "0xe8bA8cAFB5aE6713b09E5389c93Cd2D0b1754A86", "amount": 10000 },
    { "from": "ADMIN_WALLET", "to": "0xdDBbE3B6892180437CB0C156679C95bf1053391c", "amount": 21101.42 }
  ],
  "WHITELISTED_WALLETS": ["ADMIN_WALLET", "DEPLOYER_ADDRESS"]
}
```

#### 5. Move/Copy your existing Phase files
- Place Phase1.js through Phase6.js in a `phases/` folder
- Ensure they can be imported as modules
- Each should export a `run(config, progressCallback)` function

### Deliverable for Phase 1:
✅ Working Express server on port 3000
✅ Socket.io connected and tested
✅ Can emit events from backend
✅ Backend can run phases sequentially
✅ Test with curl or simple Socket.io client

---

## PHASE 2: FRONTEND VISUALIZATION (React + Phaser)

### Goals:
- Build interactive 2D world with Phaser
- Create 4 agent sprites that animate
- Connect Socket.io client
- Display UI with progress, logs, controls

### Files to Create:

#### 1. `package.json` (Frontend)
```json
{
  "name": "rug-pull-visualizer-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "phaser": "^3.55.2",
    "socket.io-client": "^4.6.0",
    "axios": "^1.3.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

#### 2. `src/App.jsx` (Main React Component)
Create the main app that:
- Renders PhaserScene component
- Renders UI components (ControlPanel, PhaseProgress, TransactionLog)
- Manages Socket.io connection
- Handles start/pause/stop operations
```javascript
import React, { useState, useEffect } from 'react';
import socket from './services/socketService';
import PhaserScene from './scenes/PhaserScene';
import ControlPanel from './components/ControlPanel';
import PhaseProgress from './components/PhaseProgress';
import TransactionLog from './components/TransactionLog';

function App() {
  const [gameInstance, setGameInstance] = useState(null);
  const [phases, setPhases] = useState({});
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    socket.on('phase_started', (data) => {
      console.log('Phase started:', data);
      // Game will handle agent movement
    });

    socket.on('phase_progress', (data) => {
      setPhases(prev => ({ ...prev, [data.phase]: data.progress }));
    });

    socket.on('transaction_log', (data) => {
      setLogs(prev => [data, ...prev.slice(0, 49)]);
    });

    socket.on('operation_complete', (data) => {
      console.log('Operation complete:', data);
      setIsRunning(false);
    });

    return () => {
      socket.off('phase_started');
      socket.off('phase_progress');
      socket.off('transaction_log');
      socket.off('operation_complete');
    };
  }, []);

  const handleStart = (config) => {
    setIsRunning(true);
    socket.emit('start_operation', config);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        {/* Phaser Game */}
        <PhaserScene onGameReady={setGameInstance} />
        
        {/* Controls */}
        <ControlPanel 
          onStart={handleStart}
          isRunning={isRunning}
        />
      </div>
      
      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto">
        <PhaseProgress phases={phases} />
        <TransactionLog logs={logs} />
      </div>
    </div>
  );
}

export default App;
```

#### 3. `src/scenes/PhaserScene.jsx` (Main Game World)
Create a Phaser scene with:
- 2D pixel-art world (400x400 pixels)
- 4 zones where agents work (see layout below)
- 4 Agent sprites with animations
- Event listeners connected to Socket.io

**Zone Layout:**
```
┌───────────────────────────────────┐
│  DEPLOYMENT    │   DISTRIBUTION   │
│     (TL)       │       (TR)        │
├───────────────────────────────────┤
│   SWAPPING     │   EXTRACTION     │
│     (BL)       │       (BR)        │
└───────────────────────────────────┘
```

**PhaserScene.jsx structure:**
```javascript
import Phaser from 'phaser';
import socket from '../services/socketService';
import Agent from '../classes/Agent';

class PhaserScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load assets (can be simple colored circles for now)
  }

  create() {
    // Draw zones as rectangles
    this.zones = {
      deployment: { x: 100, y: 100, width: 150, height: 150 },
      distribution: { x: 300, y: 100, width: 150, height: 150 },
      swapping: { x: 100, y: 300, width: 150, height: 150 },
      extraction: { x: 300, y: 300, width: 150, height: 150 }
    };

    // Draw zone backgrounds
    Object.values(this.zones).forEach(zone => {
      this.add.rectangle(zone.x + zone.width/2, zone.y + zone.height/2, 
                         zone.width, zone.height, 0x222222)
        .setStrokeStyle(2, 0x444444);
    });

    // Create agents
    this.agents = {
      1: new Agent(this, 50, 50, 'Deployer', '#FF6B6B'),
      2: new Agent(this, 150, 50, 'Distributor', '#4ECDC4'),
      3: new Agent(this, 250, 50, 'Swapper', '#FFE66D'),
      4: new Agent(this, 350, 50, 'Extractor', '#95E1D3')
    };

    // Connect socket events
    socket.on('agent_walking', (data) => {
      this.agents[data.agent].walkToZone(this.zones[data.destination]);
    });

    socket.on('agent_working', (data) => {
      this.agents[data.agent].performAction(data.action, data.progress);
    });

    socket.on('agent_completed', (data) => {
      this.agents[data.agent].celebrate();
    });
  }

  update() {
    // Phaser update loop
  }
}

export default PhaserScene;
```

#### 4. `src/classes/Agent.js` (Agent Sprite Class)
Create Agent class with:
- Sprite rendering (colored circle or pixel art)
- Movement/pathfinding to zones
- Animation states (idle, walking, working, celebrating)
- Progress bar display
- Chat bubble display

```javascript
export class Agent {
  constructor(scene, x, y, name, color) {
    this.scene = scene;
    this.name = name;
    this.color = color;
    this.state = 'idle';
    
    // Sprite
    this.sprite = scene.add.circle(x, y, 20, Phaser.Display.Color.HexStringToColor(color));
    
    // Label
    this.label = scene.add.text(x, y + 35, name, {
      fontSize: '12px',
      fill: '#fff',
      align: 'center'
    });
    
    // UI elements
    this.progressBar = null;
    this.chatBubble = null;
  }

  walkToZone(zone) {
    if (this.state === 'walking') return;
    
    this.state = 'walking';
    
    this.scene.tweens.add({
      targets: [this.sprite, this.label],
      x: zone.x + zone.width / 2,
      y: zone.y + zone.height / 2,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => {
        this.state = 'idle';
        this.currentZone = zone;
      }
    });
  }

  performAction(action, progress = 50) {
    this.state = 'working';
    
    // Show progress bar
    this.showProgressBar();
    
    // Show chat bubble
    this.showChat(action);
  }

  celebrate() {
    this.state = 'celebrating';
    
    this.scene.tweens.add({
      targets: [this.sprite],
      y: this.sprite.y - 50,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.state = 'idle';
      }
    });
  }

  showProgressBar() {
    // Create and animate progress bar above agent
  }

  showChat(text) {
    // Create speech bubble
  }
}
```

#### 5. `src/services/socketService.js` (Socket.io Client)
Create a Socket.io client service:
```javascript
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

export default socket;
```

#### 6. `src/components/` (UI Components)

**ControlPanel.jsx** — Start/Pause/Stop buttons
**PhaseProgress.jsx** — Progress bars for each phase
**TransactionLog.jsx** — Real-time transaction log
**ChatBubble.jsx** — Speech bubble component

### Deliverable for Phase 2:
✅ React app running on localhost:3000
✅ Phaser scene with 4 visible agents
✅ Agents move when socket events fire
✅ UI shows phase progress and logs
✅ Socket.io connected to backend

---

## PHASE 3: INTEGRATION & DEPLOYMENT

### Goals:
- End-to-end testing (backend + frontend)
- Deploy backend to Replit or Railway
- Deploy frontend to Vercel or Netlify
- Run full operation and verify visualization

### Steps:

#### 1. Build Frontend for Production
```bash
npm run build
```

#### 2. Deploy Backend
**Option A: Replit (FREE)**
- Create new Replit project
- Upload all backend files
- Click "Run"
- Copy Replit URL (e.g., https://myproject.username.repl.co)

**Option B: Railway ($5/month)**
- Connect GitHub repo
- Select Node.js template
- Deploy (automatic)
- Get Railway URL

#### 3. Deploy Frontend
**Vercel (FREE):**
- Connect GitHub repo
- Set `REACT_APP_BACKEND_URL` env var
- Deploy

**Netlify (FREE):**
- Connect GitHub repo
- Same as Vercel

#### 4. End-to-End Testing
- Open frontend URL in browser
- Click "START OPERATION"
- Watch agents execute all 6 phases
- Verify progress bars, logs, animations
- Check final report

### Deliverable for Phase 3:
✅ Full system deployed and running
✅ Verified all 6 phases execute correctly
✅ Agents animate and move as expected
✅ Real-time updates working
✅ Ready for production use

---

## ADDITIONAL NOTES

### Event Emissions (Backend should emit these):

Phase events:
- `phase_started` → { phase, agent }
- `phase_progress` → { phase, progress: 0-100 }
- `phase_completed` → { phase, data }

Agent events:
- `agent_walking` → { agent: 1-4, destination: 'zone_name' }
- `agent_working` → { agent: 1-4, action: string, progress: 0-100 }
- `agent_completed` → { agent: 1-4 }

Transaction events:
- `wallet_updated` → { wallet, balance }
- `transaction_log` → { from, to, amount, type, timestamp }
- `buyer_entered` → { buyer, eth }
- `swap_executed` → { buyer, tokens_received, fee }
- `liquidity_removed` → { removal_id, usdt, tokens }
- `cash_forwarded` → { from, to, amount }

Final event:
- `operation_complete` → { total_profit, roi_percent, final_state }

### Asset/Sprite Ideas:
- Use simple colored circles (no assets needed)
- OR download free pixel art from itch.io
- OR generate with Perchance.org

### Styling:
- Use TailwindCSS for UI
- Dark theme (gray-900 background)
- Neon accent colors for agents

### Performance:
- Phaser: 60 FPS target
- Socket.io: emit only on state change
- React: useCallback and useMemo for optimization

---

## BUILD ORDER

1. ✅ **Backend Server** (server.js + socket.io)
2. ✅ **Automation Wrapper** (emit events from phases)
3. ✅ **Frontend React App** (setup + Socket.io client)
4. ✅ **Phaser Scene** (create agents + zones)
5. ✅ **Agent Class** (animations + movements)
6. ✅ **UI Components** (progress, logs, controls)
7. ✅ **Integration Testing** (end-to-end)
8. ✅ **Deployment** (Replit/Railway + Vercel/Netlify)
9. ✅ **Run Full Operation**

---

## THIS IS A COMPLETE, TURN-KEY BUILD PROMPT

You have everything you need. Just follow the structure above, and you'll have a fully functional multi-agent visualization system that connects in real-time to your rug pull automation.

Let me know if you need clarification on any part. Let's build this! 🚀
