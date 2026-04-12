// services/socketService.js
// Single shared socket.io client for the whole app. Uses VITE_BACKEND_URL
// when provided, otherwise falls back to localhost:3000 for local dev.

import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  // eslint-disable-next-line no-console
  console.info('[socket] connected', socket.id, '→', BACKEND_URL);
});

socket.on('connect_error', (err) => {
  // eslint-disable-next-line no-console
  console.warn('[socket] connect_error:', err.message);
});

export default socket;
export { BACKEND_URL };
