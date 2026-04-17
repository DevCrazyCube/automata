// server.js
// Express + Socket.io entry point. Handles operation lifecycle events and
// delegates the actual work to automation-wrapper.js.

require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');

const config = require('./config.json');
const logger = require('./utils/logger');
const { runAutomation } = require('./automation-wrapper');
const AgentOrchestrator = require('./agents/AgentOrchestrator');

const PORT = parseInt(process.env.PORT || '3000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check endpoint used by deployment platforms.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.MODE || config.MODE,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mode info endpoint.
app.get('/api/mode', (req, res) => {
  res.json({ mode: process.env.MODE || config.MODE });
});

// Serve frontend static build if present (enables single-process hosting).
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));
app.get('/', (req, res, next) => {
  res.sendFile(path.join(frontendBuild, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: CORS_ORIGIN },
  transports: ['websocket', 'polling']
});

const operationState = {
  isRunning: false,
  paused: false,
  startedAt: null,
  orchestrator: null   // active AgentOrchestrator instance, if running in agent mode
};

/**
 * Resolve which driver to use for an operation.
 * Priority: configOverride.driver → env DRIVER → config.DRIVER → default
 *
 * "agents" requires ANTHROPIC_API_KEY; we transparently fall back to "phases"
 * if the key is missing, logging a warning so operators know.
 */
function resolveDriver(configOverride) {
  const requested =
    configOverride.driver ||
    process.env.DRIVER ||
    config.DRIVER ||
    'agents';
  if (requested === 'agents' && !process.env.ANTHROPIC_API_KEY) {
    logger.warn('server', 'ANTHROPIC_API_KEY not set — falling back to legacy phase driver');
    return 'phases';
  }
  return requested;
}

io.on('connection', (socket) => {
  logger.info('socket', `client connected: ${socket.id}`);
  socket.emit('mode_info', { mode: process.env.MODE || config.MODE });

  socket.on('start_operation', async (configOverride = {}) => {
    if (operationState.isRunning) {
      socket.emit('operation_error', {
        error: 'Operation already running',
        timestamp: new Date().toISOString()
      });
      return;
    }
    operationState.isRunning = true;
    operationState.startedAt = Date.now();
    const driver = resolveDriver(configOverride);
    io.emit('driver_info', { driver });
    logger.info('server', `starting operation with driver=${driver}`);

    try {
      if (driver === 'agents') {
        const orchestrator = new AgentOrchestrator({ io, configOverride });
        operationState.orchestrator = orchestrator;
        await orchestrator.run();
      } else {
        await runAutomation({ io, configOverride });
      }
    } catch (error) {
      logger.error('socket', `operation failed: ${error.message}`);
    } finally {
      operationState.isRunning = false;
      operationState.paused = false;
      operationState.orchestrator = null;
    }
  });

  socket.on('pause_operation', () => {
    operationState.paused = true;
    io.emit('operation_paused', { timestamp: new Date().toISOString() });
  });

  socket.on('resume_operation', () => {
    operationState.paused = false;
    io.emit('operation_resumed', { timestamp: new Date().toISOString() });
  });

  socket.on('stop_operation', () => {
    operationState.isRunning = false;
    operationState.paused = false;
    if (operationState.orchestrator) {
      operationState.orchestrator.abort();
    }
    io.emit('operation_stopped', { timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', (reason) => {
    logger.info('socket', `client disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(PORT, () => {
  const banner = '='.repeat(56);
  logger.info('server', banner);
  logger.info('server', `Automata backend listening on http://localhost:${PORT}`);
  logger.info('server', `Mode: ${(process.env.MODE || config.MODE).toUpperCase()}`);
  logger.info('server', `Network: ${config.NETWORK}`);
  logger.info('server', banner);
});

process.on('SIGINT', () => {
  logger.info('server', 'SIGINT received, shutting down');
  server.close(() => process.exit(0));
});

module.exports = { app, server, io };
