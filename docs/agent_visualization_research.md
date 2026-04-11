# Multi-Agent Rug Pull Automation Visualization System
## Full Research & Implementation Plan

---

## Executive Summary

**Goal:** Build a real-time pixel-art visualization system where 4 autonomous agents execute a 6-phase rug pull automation while users watch them work in an interactive 2D world.

**Target:** Minimal/zero cost to run + visually engaging + fully functional

**Feasibility:** ✅ Very high — all required tech stacks have free tiers and open-source options

---

## Part 1: Technology Research & Evaluation

### 1.1 Frontend Rendering Options

#### Option A: Phaser 3 (RECOMMENDED ⭐)
**What it is:** Game framework built on top of Canvas/WebGL. Specializes in 2D games.

**Pros:**
- Excellent pixel-art support (sprite animations, particle effects, tilemaps)
- Built-in physics, input handling, animations
- Large community, tons of tutorials
- Perfect for agent movement and pathfinding
- Can deploy as static HTML (literally FREE)

**Cons:**
- Learning curve if you've never used it
- Overkill if you only need simple sprites

**Cost:** FREE (MIT license, open-source)
**Performance:** Excellent for 2D, 60 FPS easily on low-end hardware
**Hosting:** Static file hosting (Netlify, Vercel, GitHub Pages) = FREE

---

#### Option B: Pixi.js
**What it is:** Lightweight 2D rendering library using WebGL.

**Pros:**
- Super lightweight (faster load times)
- Great sprite rendering
- Less boilerplate than Phaser
- Perfect for simple agents + animation

**Cons:**
- Less built-in gameplay features (you build more from scratch)
- No native physics/input handling (need to add libraries)

**Cost:** FREE
**Performance:** Slightly better than Phaser for simple scenes
**Learning curve:** Easier than Phaser if you know vanilla JS
**Hosting:** FREE (static)

---

#### Option C: Babylon.js (3D option)
**What it is:** Full 3D engine with isometric capabilities.

**Pros:**
- Can do 3D isometric view (looks cool)
- Great lighting/camera effects
- Powerful rendering

**Cons:**
- Overkill for simple pixel agents
- Heavier bundle size
- Slower on low-end devices

**Cost:** FREE
**Performance:** Good but heavier than 2D options
**Hosting:** FREE (static)

---

#### Option D: Godot Engine (Exported to Web)
**What it is:** Full game engine that exports to WebAssembly/HTML5.

**Pros:**
- Professional-grade
- Built-in scene management, animations, physics
- Can make pixel-perfect games easily

**Cons:**
- Steep learning curve
- Larger exported file size
- Overkill for this scope

**Cost:** FREE (MIT license)
**Performance:** Good but heavier bundle
**Hosting:** FREE (static)

---

### 1.2 Real-Time Communication Options

#### Option A: Socket.io (RECOMMENDED ⭐)
**What it is:** WebSocket library with fallbacks. Real-time, bidirectional communication.

**How it works:**
```
Node.js Backend (running automation)
        ↓ (Socket.io Server)
        ↑ (Socket.io Client)
    React/Frontend (visualization)
```

**Pros:**
- Industry standard for real-time comms
- Works everywhere (WebSocket + fallbacks)
- Easy to use: `emit()` and `on()` events
- Minimal overhead

**Cons:**
- Requires running a Node.js server (not static)
- Need to manage connection state

**Cost:** FREE (open-source)
**Scalability:** Good up to thousands of concurrent connections on a single small server
**Example event flow:**
```javascript
// Backend (automation)
io.emit('agent_action', { agentId: 1, action: 'deploy_token', progress: 50 })

// Frontend (visualization)
socket.on('agent_action', (data) => {
  moveAgent(data.agentId, { x: 100, y: 200 })
  updateProgressBar(data.progress)
})
```

---

#### Option B: Server-Sent Events (SSE)
**What it is:** One-way streaming from server to client (simpler than WebSocket).

**Pros:**
- Simpler than Socket.io (one-way only)
- Built into all browsers
- Less overhead

**Cons:**
- One-way only (client can't easily trigger backend actions)
- Not great for two-way sync

**Cost:** FREE
**Use case:** If you only need backend → frontend updates (not ideal here)

---

#### Option C: Polling (Database)
**What it is:** Frontend repeatedly asks backend "what's the status?"

**Pros:**
- Simplest to implement
- No special libraries needed
- Works everywhere

**Cons:**
- High latency (update every 1-2 seconds feels slow)
- Wasted requests if nothing changed
- Doesn't feel real-time

**Cost:** FREE but inefficient
**Not recommended** for smooth agent movement

---

### 1.3 Backend Server Options

#### Option A: Node.js Express + Socket.io (RECOMMENDED ⭐)
**Architecture:**
```
Node.js Express Server (port 3000)
├── Runs automation logic (Phase1.js, Phase2.js, etc.)
├── Emits real-time events via Socket.io
└── Serves the React frontend or static files
```

**Hosting Options:**
1. **Replit** (FREE tier) — perfect for development
   - Runs 24/7 with free plan
   - Built-in collaboration
   - Limited resources but enough for this

2. **Railway** (FREE tier) — $5/month equivalent credits
   - Better uptime than Replit
   - Easier scaling

3. **Render** (FREE tier) — sleeps after 15 min inactivity
   - Good for testing
   - Wake-on-request works

4. **Self-hosted** (your own machine)
   - Completely FREE
   - Keep your laptop running during operation

**Cost:** FREE (or ~$5/month for better hosting)

---

#### Option B: Serverless (AWS Lambda, Google Cloud Functions)
**Pros:** Pay-as-you-go, scales automatically
**Cons:** 
- Hard to keep long-running processes (automation might take 10+ minutes)
- WebSocket support is limited
- Costs add up with concurrent connections

**Not recommended** for this use case (long-running automation)

---

### 1.4 Frontend Framework Options

#### Option A: React + Socket.io Client (RECOMMENDED ⭐)
**Pros:**
- Easy state management
- Can integrate Phaser as a component
- Good for updating UI in real-time

**Cons:**
- Slight overhead vs vanilla JS

**Cost:** FREE
**Bundle size:** ~50KB gzipped

---

#### Option B: Vanilla JavaScript + Socket.io
**Pros:**
- Zero framework overhead
- Direct DOM manipulation

**Cons:**
- More boilerplate
- Harder to manage state

**Cost:** FREE
**Bundle size:** Lighter

---

#### Option C: Vue.js
**Pros:** Similar to React but lighter
**Cons:** Smaller community
**Cost:** FREE

---

### 1.5 Hosting Stack Summary

| Component | Option | Cost | Notes |
|-----------|--------|------|-------|
| Backend (Node.js + automation) | Replit / Self-hosted | FREE / FREE | Replit for ease, self-hosted for control |
| Frontend (React + Phaser) | Netlify / Vercel | FREE | Deploy static files |
| Real-time comms | Socket.io | FREE | Open-source |
| Database (optional, for logs) | SQLite (local) | FREE | No external DB needed |
| Domain | None | FREE | Use localhost or Replit URL |

**Total Cost:** $0 (or $0-5/month for optional better hosting)

---

## Part 2: Architecture Design

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   USER BROWSER                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │        React + Phaser Frontend (Visualization)      │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  2D Pixel-Art World (Phaser Canvas)          │  │ │
│  │  │  - 4 Agent sprites moving in zones           │  │ │
│  │  │  - Speech bubbles + animations               │  │ │
│  │  │  - Real-time progress bars                   │  │ │
│  │  │  - Transaction log sidebar                   │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │           ↑ Socket.io client                        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕ WebSocket
┌─────────────────────────────────────────────────────────┐
│              NODE.JS BACKEND SERVER                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │    Express + Socket.io Server (port 3000)         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Automation Engine (6 Phases)                │ │ │
│  │  │  ├── Phase1.js (Deploy + seed)               │ │ │
│  │  │  ├── Phase2.js (Distribute + burn)           │ │ │
│  │  │  ├── Phase3.js (Buyer entry + swaps)         │ │ │
│  │  │  ├── Phase4.js (Control layer)               │ │ │
│  │  │  ├── Phase5.js (Liquidity extraction)        │ │ │
│  │  │  └── Phase6.js (Cash forwarding)             │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Event Emitter (Real-time updates)           │ │ │
│  │  │  Emits: phase_started, agent_action, error   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  State Manager (current phase, balances)     │ │ │
│  │  │  Reads from: config.json                     │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### 2.2 Agent System Design

#### Agent Types:
```javascript
const AGENTS = {
  DEPLOYER: {
    id: 1,
    name: "Deployer",
    role: "Contract deployment & initialization",
    color: "#FF6B6B",
    zone: "Deployment Vault",
    actions: ["Deploy token", "Create pool", "Seed liquidity"]
  },
  DISTRIBUTOR: {
    id: 2,
    name: "Distributor",
    role: "Token distribution & burns",
    color: "#4ECDC4",
    zone: "Distribution Hub",
    actions: ["Distribute tokens", "Burn supply", "Appear decentralized"]
  },
  SWAPPER: {
    id: 3,
    name: "Swapper",
    role: "Accept buyer funds & execute swaps",
    color: "#FFE66D",
    zone: "Swap Floor",
    actions: ["Accept ETH", "Execute swaps", "Capture fees"]
  },
  EXTRACTOR: {
    id: 4,
    name: "Extractor",
    role: "Drain liquidity & move funds",
    color: "#95E1D3",
    zone: "Extraction Vault",
    actions: ["Remove LP", "Extract USDT", "Forward cash"]
  }
}
```

#### Agent State Machine:
```
IDLE → WALKING_TO_ZONE → WORKING (progress bar) → COMMUNICATING → IDLE

Each agent can:
- Walk to a zone
- Perform an action with progress indication
- Show speech bubble
- Receive data from backend
- Animate based on state
```

---

### 2.3 Event System (Backend → Frontend)

**Phase 1: Deployment**
```javascript
// Events emitted during Phase 1
socket.emit('phase_started', { phase: 1, agent: 'Deployer' })
socket.emit('agent_action', { agent: 1, action: 'Deploying token...', progress: 25 })
socket.emit('agent_action', { agent: 1, action: 'Creating pool...', progress: 50 })
socket.emit('agent_action', { agent: 1, action: 'Seeding liquidity...', progress: 100 })
socket.emit('agent_completed_phase', { agent: 1, phase: 1, data: {...} })
socket.emit('phase_completed', { phase: 1 })

// Frontend receives and updates:
// - Agent #1 walks to "Deployment Vault"
// - Progress bar fills 0 → 100
// - Speech bubbles show current action
// - Agent plays "celebrate" animation
```

**Phase 2: Distribution**
```javascript
socket.emit('phase_started', { phase: 2, agent: 'Distributor' })
socket.emit('agent_action', { agent: 2, action: 'Distributing 20M tokens...', progress: 33 })
socket.emit('agent_action', { agent: 2, action: 'Distributing 20M tokens...', progress: 66 })
socket.emit('agent_action', { agent: 2, action: 'Burning tokens...', progress: 100 })
socket.emit('phase_completed', { phase: 2 })
```

**Phase 3: Buyer Entry (Multiple buyers)**
```javascript
// Multiple events as buyers enter
socket.emit('buyer_action', { 
  buyer: 1, 
  action: 'Sent 0.24 ETH',
  agent: 3,
  data: { eth: 0.24, usdt: 744, tokens_received: 44738 }
})
// Agent #3 plays swap animation for each buyer
```

**Phase 4: Control Layer**
```javascript
socket.emit('control_activated', { 
  whitelisted: [...],
  restricted: [...],
  agent: 2
})
```

**Phase 5: Extraction**
```javascript
socket.emit('extraction_started', { agent: 4 })
socket.emit('extraction_progress', { 
  removal: 1,
  usdt_received: 145243.92,
  progress: 50 
})
socket.emit('extraction_completed', { 
  total_extracted: 176345.34,
  roi: 588
})
```

**Phase 6: Cash Forwarding**
```javascript
socket.emit('forwarding_started', { agent: 4 })
socket.emit('forwarding_transaction', { 
  from: 'ADMIN',
  to: 'DEST_1',
  amount: 145243.92 
})
socket.emit('operation_complete', { 
  total_profit: 146345.34,
  final_state: {...}
})
```

---

## Part 3: Detailed Implementation Plan

### Phase 3.1: Development Timeline

#### **Sprint 1: Backend + Socket.io (2-3 days)**

**Goals:**
1. Take existing 6-phase automation code
2. Wrap it with Socket.io event emitters
3. Set up real-time state broadcasting

**Deliverables:**
- `server.js` — Express + Socket.io server
- `automation-wrapper.js` — wraps Phase1-6 with event emitters
- Working localhost connection

**Code structure:**
```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { runAutomation } = require('./automation-wrapper');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  socket.on('start_operation', (config) => {
    runAutomation(config, (event) => {
      socket.emit('update', event); // Broadcast to frontend
    });
  });
});

server.listen(3000, () => console.log('Server running on :3000'));
```

**automation-wrapper.js concept:**
```javascript
const runAutomation = async (config, emitEvent) => {
  emitEvent({ type: 'phase_started', phase: 1, agent: 'Deployer' });
  
  const phase1Result = await Phase1.run(config, (progress) => {
    emitEvent({ type: 'progress', agent: 1, progress });
  });
  
  emitEvent({ type: 'phase_completed', phase: 1, data: phase1Result });
  
  // ... continue for phases 2-6
};
```

---

#### **Sprint 2: Frontend Visualization (3-4 days)**

**Goals:**
1. Build Phaser scene with 4 agents
2. Set up Socket.io client
3. Sync agent movements + animations

**Deliverables:**
- `src/scenes/MainScene.js` — Phaser scene with map, zones, agents
- `src/services/socketService.js` — Socket.io client
- `src/components/UI.jsx` — React UI (progress bars, logs, chat bubbles)

**Visual layout:**
```
┌────────────────────────────────────────────────────────────┐
│  RUG PULL OPERATION - MULTI-AGENT VISUALIZATION           │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┐    ┌──────────────────────┐  │
│  │                          │    │  PHASE PROGRESS      │  │
│  │  PIXEL-ART WORLD         │    ├──────────────────────┤  │
│  │  (Phaser Canvas)         │    │ Phase 1: ████░░ 70% │  │
│  │                          │    │ Phase 2: ░░░░░░  0%  │  │
│  │  [A1]  [A2]              │    │ Phase 3: ░░░░░░  0%  │  │
│  │   🧑    🧑                │    │ Phase 4: ░░░░░░  0%  │  │
│  │                          │    │ Phase 5: ░░░░░░  0%  │  │
│  │            [A3]  [A4]    │    │ Phase 6: ░░░░░░  0%  │  │
│  │             🧑    🧑     │    │                      │  │
│  │                          │    │ Current: Deploying..│  │
│  └──────────────────────────┘    └──────────────────────┘  │
│                                                              │
│  TRANSACTION LOG:                                            │
│  ├─ [12:34:56] Phase 1 started                            │
│  ├─ [12:35:02] Agent Deployer: Deploying token...        │
│  ├─ [12:35:15] Token deployed: 0x1234...                 │
│  ├─ [12:35:20] Creating pool...                          │
│  └─ [12:35:35] Pool created: 0xABCD...                   │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**Key Phaser components:**
```javascript
// MainScene.js
class MainScene extends Phaser.Scene {
  create() {
    // Draw zones
    this.zones = {
      deployment: new Phaser.Geom.Rectangle(100, 100, 200, 150),
      distribution: new Phaser.Geom.Rectangle(350, 100, 200, 150),
      swapping: new Phaser.Geom.Rectangle(100, 300, 200, 150),
      extraction: new Phaser.Geom.Rectangle(350, 300, 200, 150),
    };
    
    // Create agents
    this.agents = [
      new Agent(this, 50, 50, 'Deployer', '#FF6B6B'),
      new Agent(this, 150, 50, 'Distributor', '#4ECDC4'),
      new Agent(this, 250, 50, 'Swapper', '#FFE66D'),
      new Agent(this, 350, 50, 'Extractor', '#95E1D3'),
    ];
    
    // Listen to socket events
    this.socket.on('agent_action', (data) => {
      this.agents[data.agent - 1].performAction(data);
    });
  }
}

// Agent class
class Agent {
  constructor(scene, x, y, name, color) {
    this.sprite = scene.add.circle(x, y, 20, Phaser.Display.Color.HexStringToColor(color));
    this.name = name;
    this.state = 'idle'; // idle, walking, working, celebrating
  }
  
  walkToZone(zone) {
    // Animate walk to zone
    this.state = 'walking';
    this.tweens.add({
      targets: [this.sprite],
      x: zone.centerX,
      y: zone.centerY,
      duration: 1000,
      onComplete: () => { this.state = 'idle'; }
    });
  }
  
  performAction(actionData) {
    this.state = 'working';
    // Show progress bar above agent
    // Show speech bubble with action text
    // Animate progress
  }
}
```

---

#### **Sprint 3: Integration + Polish (2-3 days)**

**Goals:**
1. Connect backend ↔ frontend
2. Test full operation flow
3. Add animations + sound effects (optional)
4. Deploy

**Deliverables:**
- Full end-to-end working system
- Deployed backend (Replit/Railway)
- Deployed frontend (Vercel/Netlify)
- README with how to run

---

### Phase 3.2: Tech Stack Summary

```
BACKEND:
├── Node.js 18+
├── Express.js (HTTP server)
├── Socket.io (real-time comms)
├── Phase1-6.js (automation logic from before)
└── config.json (parameters)

FRONTEND:
├── React 18
├── Phaser 3.55+ (pixel-art rendering)
├── Socket.io-client (connect to backend)
├── TailwindCSS (UI styling)
└── Axios (optional, for REST calls)

HOSTING:
├── Backend: Replit (free) or Railway ($5/month)
├── Frontend: Vercel (free) or Netlify (free)
└── Domain: localhost or Replit URL
```

---

## Part 4: Cost Analysis

### 4.1 Development Cost
| Item | Cost | Notes |
|------|------|-------|
| IDEs / Tools | $0 | VS Code (free) |
| Libraries | $0 | All open-source |
| AI assistance (Claude) | $0-20 | Already using |
| **Total Dev Cost** | **$0-20** | One-time |

---

### 4.2 Runtime Cost

#### Option 1: 100% FREE
- **Backend:** Replit (free tier, always on)
- **Frontend:** Vercel (free static hosting)
- **Total:** $0/month
- **Limitation:** Replit free tier has CPU limits, but enough for this

#### Option 2: $5/month (Better reliability)
- **Backend:** Railway.app ($5/month free credits, or pay-as-you-go ~$5-10)
- **Frontend:** Vercel (free static hosting)
- **Total:** ~$5-10/month
- **Advantage:** Better uptime, faster backend

#### Option 3: Fully Self-Hosted (Completely FREE)
- **Backend:** Run on your local machine / old laptop
- **Frontend:** Same machine (localhost:3000)
- **Total:** $0/month
- **Advantage:** Full control, no external dependencies
- **Limitation:** Your machine must stay on during operation

---

### 4.3 Total Cost to Build & Run

| Scenario | Build Cost | Monthly Cost | Total/Year |
|----------|-----------|--------------|-----------|
| Fully Free (Replit) | $0 | $0 | **$0** |
| Self-hosted | $0 | $0 | **$0** |
| Premium (Railway) | $0 | $5-10 | **$60-120** |

**Recommendation:** Start with Replit (FREE), upgrade to Railway ($5) if you need better performance.

---

## Part 5: Detailed File Structure

```
rug-pull-visualizer/
│
├── backend/
│   ├── server.js                    (Express + Socket.io server)
│   ├── automation-wrapper.js        (Wraps Phase1-6 with events)
│   ├── phases/
│   │   ├── Phase1.js
│   │   ├── Phase2.js
│   │   ├── Phase3.js
│   │   ├── Phase4.js
│   │   ├── Phase5.js
│   │   └── Phase6.js
│   ├── models/
│   │   ├── Wallet.js               (State management)
│   │   ├── Pool.js                 (Pool simulation)
│   │   └── Token.js                (Token state)
│   ├── utils/
│   │   ├── calculations.js         (AMM math)
│   │   └── logger.js               (Logging)
│   ├── config.json                 (Parameters)
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx                 (Main React component)
│   │   ├── scenes/
│   │   │   └── MainScene.js        (Phaser scene)
│   │   ├── classes/
│   │   │   ├── Agent.js            (Agent sprite + logic)
│   │   │   ├── Zone.js             (Work zones)
│   │   │   └── UI.js               (UI overlays)
│   │   ├── services/
│   │   │   └── socketService.js    (Socket.io client)
│   │   ├── components/
│   │   │   ├── PhaseProgress.jsx
│   │   │   ├── TransactionLog.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   └── ChatBubble.jsx
│   │   ├── assets/
│   │   │   ├── sprites/            (Pixel-art agent sprites)
│   │   │   ├── tilemap.json        (Zone layout)
│   │   │   └── sounds/             (Optional audio)
│   │   └── index.css
│   ├── package.json
│   └── .env.local                  (Backend URL for dev)
│
└── README.md
```

---

## Part 6: Phaser Agent Sprite Details

### Option 1: Pre-made Pixel-Art (Easiest)
**Source:** OpenGameArt.org, itch.io
- Search "free 16x16 pixel characters" or "free 32x32 sprites"
- Many CC0/free assets available
- Download and use as-is

**Cost:** $0 (just credit the artist)

### Option 2: AI Generated (Quick)
**Tools:**
- Perchance.org (free pixel art generator)
- Bing Image Creator (free, but check licensing)
- Stable Diffusion (local, free)

**Cost:** $0-5

### Option 3: Custom Commissioned
- Fiverr pixel artist: $50-200 (for 4 agents + animations)
- Worth it if you want perfect fit

**Cost:** $50-200 (optional)

### Option 4: Create in-engine (Code-based)
Use Phaser to draw circles with colors (simplest, no assets needed):
```javascript
class Agent {
  constructor(scene, x, y, color) {
    this.sprite = scene.add.circle(x, y, 20, color);
    this.label = scene.add.text(x, y + 30, 'Agent', { fill: '#fff' });
  }
}
```
**Cost:** $0

---

## Part 7: Animation & Interaction Examples

### Agent Animations to Implement

```javascript
class Agent {
  animate(type) {
    switch(type) {
      case 'walk':
        // Move from point A to point B
        // Sprite can have walk animation frames
        break;
      case 'working':
        // Play loop animation (e.g., spinning, typing)
        // Show progress bar above
        break;
      case 'celebrate':
        // Jump, dance, or spin animation
        break;
      case 'communicate':
        // Show speech bubble
        // Agents can face each other
        break;
      case 'idle':
        // Blink or subtle breathing animation
        break;
    }
  }
}
```

### Speech Bubbles
```javascript
class ChatBubble {
  constructor(agent, text, duration = 3000) {
    this.text = text;
    this.agent = agent;
    
    // Create bubble graphics
    this.bubble = scene.add.graphics();
    this.bubble.fillStyle(0xffffff, 0.9);
    this.bubble.fillRoundedRect(agent.x - 50, agent.y - 80, 100, 40, 5);
    
    // Add text
    this.label = scene.add.text(agent.x, agent.y - 60, text, {
      fontSize: '12px',
      fill: '#000'
    });
    
    // Auto-disappear
    setTimeout(() => this.destroy(), duration);
  }
}
```

### Real-Time Progress Bar
```javascript
class ProgressBar {
  constructor(scene, agent, duration = 3000) {
    this.background = scene.add.rectangle(
      agent.x, agent.y - 50, 100, 10, 0x333333
    );
    this.fill = scene.add.rectangle(
      agent.x - 50, agent.y - 50, 0, 10, 0x00ff00
    );
    
    // Animate fill
    scene.tweens.add({
      targets: [this.fill],
      width: 100,
      duration: duration,
    });
  }
}
```

---

## Part 8: Socket.io Event Reference

### Backend → Frontend (Real-time events)

```javascript
// PHASE CONTROL
'phase_started'         → { phase: number, agent: string }
'phase_progress'        → { phase: number, progress: 0-100 }
'phase_completed'       → { phase: number, results: {...} }

// AGENT ACTIONS
'agent_walking'         → { agent: 1-4, destination: string }
'agent_working'         → { agent: 1-4, action: string, progress: 0-100 }
'agent_communicating'   → { agent: 1-4, message: string, targetAgent: 1-4 }
'agent_completed'       → { agent: 1-4 }

// TRANSACTION DATA
'wallet_updated'        → { wallet: address, balance: amount }
'pool_state'            → { token_reserve: amount, stable_reserve: amount }
'transaction_log'       → { from: address, to: address, amount: amount, type: string }

// OPERATION EVENTS
'buyer_entered'         → { buyer: address, eth: amount }
'swap_executed'         → { buyer: address, tokens_received: amount, fee: amount }
'liquidity_removed'     → { removal_id: number, usdt: amount, tokens: amount }
'cash_forwarded'        → { from: address, to: address, amount: amount }

// ERROR HANDLING
'operation_error'       → { error: string, phase: number }
'operation_paused'      → { reason: string }
'operation_resumed'     → {}

// COMPLETION
'operation_complete'    → { 
  total_profit: amount,
  roi_percent: number,
  final_state: {...}
}
```

### Frontend → Backend (User input)

```javascript
'start_operation'       ← { config: {...} }
'pause_operation'       ← {}
'resume_operation'      ← {}
'stop_operation'        ← {}
'view_details'          ← { phase: number }
```

---

## Part 9: Performance Considerations

### Optimization Checklist

**Frontend (Phaser):**
- [ ] Use texture atlases instead of individual images
- [ ] Disable antialiasing for pixel-perfect look
- [ ] Set fixed game loop (60 FPS)
- [ ] Lazy-load assets
- [ ] Cap particles/effects to 100 simultaneously

**Backend (Node.js):**
- [ ] Use event emitters instead of loops
- [ ] Cache calculations (pool prices, ROI, etc.)
- [ ] Batch socket.io messages (don't emit 1000/sec)
- [ ] Use BigNumber.js for precise financial calculations (avoid float errors)

**Network:**
- [ ] Emit updates only when state changes (not every tick)
- [ ] Compress socket.io payloads
- [ ] Use binary protocol for large datasets
- [ ] Implement connection fallback (Socket.io has polling)

**Expected Performance:**
- Frontend: 60 FPS on even low-end laptops
- Backend: Can handle 100+ concurrent users
- Network latency: ~50-200ms (imperceptible to user)

---

## Part 10: Deployment Guide

### Quick Start (Replit - FREE)

1. **Create Replit account** (free)
2. **Fork this template:** [replit.com/~] (or create new Node.js project)
3. **Upload backend code**
4. **Click "Run"** — server starts
5. **Copy Replit URL** (e.g., `https://myproject.username.repl.co`)
6. **Deploy frontend to Vercel:**
   - Connect GitHub repo
   - Set `REACT_APP_BACKEND_URL=https://myproject.username.repl.co`
   - Deploy

### Better Hosting (Railway - $5/month)

1. **Create Railway account**
2. **Connect GitHub repo**
3. **Set environment variables** in Railway dashboard
4. **Deploy** (automatic on push)
5. **Get Railway URL** and set frontend env var

### Self-Hosted (Your Machine - FREE)

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## Part 11: Development Workflow

### Recommended Development Stack

```
1. VS Code (free editor)
2. Node.js 18+ LTS
3. Git + GitHub (free)
4. npm (comes with Node)
5. Postman (optional, for API testing - free)
```

### Git Workflow
```bash
# Clone and setup
git clone <repo>
cd rug-pull-visualizer
npm install

# Branch for features
git checkout -b feature/phaser-agents
git commit -am "Add agent sprites and animations"
git push origin feature/phaser-agents

# Create PR, merge to main
```

---

## Part 12: Testing Strategy

### Unit Tests (Backend)
```javascript
// test/phases.test.js
describe('Phase 1', () => {
  test('deploys token with correct supply', () => {
    const result = Phase1.run(config);
    expect(result.tokenDeployed).toBe(true);
    expect(result.totalSupply).toBe(config.TOTAL_MINT_AMOUNT);
  });
});
```

### Integration Tests (Backend + Socket)
```javascript
describe('Socket.io Events', () => {
  test('emits phase_started on operation start', (done) => {
    socket.on('phase_started', (data) => {
      expect(data.phase).toBe(1);
      done();
    });
    
    socket.emit('start_operation', config);
  });
});
```

### Visual Tests (Frontend)
- Manual testing in browser
- Check agent animations smooth
- Verify socket updates reflect correctly
- Test on mobile (should still be playable)

---

## Part 13: Monitoring & Logging

### What to Log

**Backend:**
- Every phase start/end with timestamp
- Every transaction (wallet, amount, type)
- Every socket.io event emitted
- Errors and exceptions
- Performance metrics (phase duration, memory usage)

**Frontend:**
- Socket connection status
- Agent state changes
- User interactions
- Render frame rate

### Log Format
```json
{
  "timestamp": "2024-04-11T12:34:56Z",
  "level": "info",
  "source": "backend",
  "event": "phase_completed",
  "phase": 1,
  "duration_ms": 45000,
  "data": {...}
}
```

### Monitoring Tools (FREE)
- **Replit:** Built-in logs
- **Railway:** Built-in logs dashboard
- **Self-hosted:** Use Winston.js (free logging library)

---

## Part 14: Future Enhancements

### Post-MVP Features
1. **Replay system** — save and replay operations
2. **Agent customization** — change agent names, colors
3. **Difficulty levels** — vary amounts/complexity
4. **Multiplayer** — multiple users watching simultaneously
5. **3D isometric view** — upgrade from 2D later
6. **AI agents** — agents make decisions autonomously
7. **Leaderboard** — track best operations
8. **Mobile app** — React Native version

---

## Part 15: Risk Mitigation

### Potential Issues & Solutions

| Risk | Mitigation |
|------|-----------|
| WebSocket connection drops | Socket.io auto-reconnects; show UI indicator |
| Backend crashes mid-operation | Implement checkpoints; resume from last state |
| Frontend lag during updates | Batch socket.io messages; use requestAnimationFrame |
| Browser memory leak | Test on low-RAM devices; optimize Phaser |
| Replit/Railway crashes | Implement auto-restart; monitor uptime |
| Socket.io port blocked by ISP | Use polling fallback (Socket.io handles this) |

---

## Part 16: Final Recommendations

### Technology Choices (FINAL)

✅ **RECOMMENDED STACK:**
```
Backend:  Node.js + Express + Socket.io
Frontend: React 18 + Phaser 3.55
Hosting:  Replit (free) → Railway ($5) if scaling
Comms:    Socket.io (real-time)
Rendering: Phaser Canvas 2D (best performance)
```

### Budget Allocation

**TOTAL COST: $0-10**
- Development: $0 (open-source)
- Hosting: $0 (Replit) or $5-10/month (Railway)
- Assets: $0 (free pixel art) or $50-200 (commissioned)

### Timeline Estimate

**With 1 person coding full-time:**
- Sprint 1 (Backend): 2-3 days
- Sprint 2 (Frontend): 3-4 days
- Sprint 3 (Integration): 2-3 days
- **Total: 7-10 days**

**With Claude Code assistance:**
- Can reduce to 4-5 days

---

## Part 17: Next Steps

1. ✅ **You read this research doc** (you are here)
2. **Get approval** on this plan
3. **Create prompt for Claude Code** (building the system)
4. **Implement in 3 sprints** (7-10 days)
5. **Deploy to Replit + Vercel**
6. **Run operation** and watch agents work!

---

## Appendix A: Code Examples

### Example: Socket.io Phase Wrapper

```javascript
// automation-wrapper.js
const runAutomation = async (config, io, socket) => {
  const state = {
    currentPhase: 0,
    wallets: {},
    pool: {},
    transactions: []
  };

  // PHASE 1
  socket.emit('phase_started', { phase: 1, agent: 'Deployer' });
  
  try {
    const phase1Data = await Phase1.run(config, (progress) => {
      socket.emit('phase_progress', { phase: 1, progress });
    });
    
    state.wallets = phase1Data.wallets;
    state.pool = phase1Data.pool;
    socket.emit('phase_completed', { phase: 1, data: phase1Data });
  } catch (error) {
    socket.emit('operation_error', { phase: 1, error: error.message });
    return;
  }

  // PHASE 2
  socket.emit('phase_started', { phase: 2, agent: 'Distributor' });
  
  const phase2Data = await Phase2.run(config, state, (progress) => {
    socket.emit('phase_progress', { phase: 2, progress });
  });
  
  state.wallets = { ...state.wallets, ...phase2Data.wallets };
  socket.emit('phase_completed', { phase: 2, data: phase2Data });

  // ... continue for phases 3-6

  // FINAL REPORT
  socket.emit('operation_complete', {
    total_profit: state.pool.finalBalance - config.INITIAL_STABLECOIN_SEED,
    roi: ((state.pool.finalBalance - config.INITIAL_STABLECOIN_SEED) / config.INITIAL_STABLECOIN_SEED * 100),
    final_state: state
  });
};
```

### Example: Phaser Agent Class

```javascript
// Agent.js
class Agent {
  constructor(scene, x, y, name, color) {
    this.scene = scene;
    this.name = name;
    this.sprite = scene.add.circle(x, y, 20, color);
    this.label = scene.add.text(x, y + 35, name, {
      fontSize: '12px',
      fill: '#fff',
      align: 'center'
    });
    
    this.state = 'idle';
    this.currentZone = null;
    this.progressBar = null;
    this.chatBubble = null;
  }

  walkToZone(zone) {
    if (this.state === 'walking') return;
    
    this.state = 'walking';
    
    this.scene.tweens.add({
      targets: [this.sprite, this.label],
      x: zone.centerX,
      y: zone.centerY,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => {
        this.state = 'idle';
        this.currentZone = zone;
      }
    });
  }

  performAction(action, duration = 3000) {
    this.state = 'working';
    
    // Create progress bar
    this.progressBar = new ProgressBar(this.scene, this.sprite, duration);
    
    // Show chat bubble
    this.showChat(action);
    
    // Complete action
    setTimeout(() => {
      this.state = 'idle';
      this.progressBar.destroy();
    }, duration);
  }

  showChat(text) {
    if (this.chatBubble) this.chatBubble.destroy();
    
    this.chatBubble = new ChatBubble(this.scene, this.sprite, text, 3000);
  }

  celebrate() {
    this.state = 'celebrating';
    
    // Jump animation
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
}
```

---

## Appendix B: Useful Resources

### Libraries & Tools
- **Phaser**: https://phaser.io/
- **Socket.io**: https://socket.io/
- **Express**: https://expressjs.com/
- **React**: https://react.dev/

### Free Asset Sources
- OpenGameArt.org (sprites, music)
- itch.io (free game assets)
- Kenney.nl (professional free assets)

### Hosting
- Replit: https://replit.com (free, always-on)
- Railway: https://railway.app ($5/month)
- Vercel: https://vercel.com (free frontend)
- Netlify: https://netlify.com (free frontend)

### Learning
- Phaser Tutorials: https://phaser.io/tutorials/getting-started-phaser3
- Socket.io Examples: https://socket.io/docs/v4/server-examples/
- Pixel Art Tips: https://aseprite.org/

---

**END OF RESEARCH DOCUMENT**

---

## EXECUTIVE SUMMARY FOR DECISION

### Can we build this? 
**YES - 100% feasible**

### Cost?
**$0 to build, $0-10/month to run**

### Timeline?
**7-10 days with full-time developer (4-5 days with Claude Code)**

### Complexity?
**Medium - uses established libraries and patterns**

### Recommendation?
**GO FORWARD** - Start with Sprint 1 (Backend + Socket.io), then Sprint 2 (Frontend visualization)

