// InteractionSlot.js
// Represents a specific occupancy slot in an interaction point.
// Example: a couch with left/right seats, or a table with multiple positions.

export default class InteractionSlot {
  constructor(id, x, y, type, options = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // 'couch_left', 'couch_right', 'table_seat_1', etc.
    this.occupiedBy = null;
    this.isExclusive = options.exclusive !== false; // by default, slots are exclusive
    this.ownerAgentKey = options.ownerAgentKey || null; // if exclusive to an owner
  }

  isOccupied() {
    return this.occupiedBy !== null;
  }

  canReserve(agent) {
    if (!this.isOccupied()) return true;
    if (this.ownerAgentKey && agent.agentKey === this.ownerAgentKey) return true;
    return false;
  }

  reserve(agent) {
    this.occupiedBy = agent;
  }

  release() {
    this.occupiedBy = null;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}
