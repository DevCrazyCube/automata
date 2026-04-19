// Workstation.js
// A workstation is a structured group: desk + PC + seat position + owner assignment.
// Not just loose sprites on tiles, but an actual occupancy model.

export default class Workstation {
  constructor(id, agentKey, deskPos, pcPos, seatPos) {
    this.id = id;
    this.agentKey = agentKey; // owner agent
    this.deskPos = deskPos; // { col, row, x, y }
    this.pcPos = pcPos; // { col, row, x, y }
    this.seatPos = seatPos; // { x, y } where agent sits to work
    this.occupiedBy = null; // agent instance currently using it (may not be owner if shared)
    this.occupiedUntil = null; // timestamp when occupancy ends
  }

  reserve(agent, durationMs) {
    this.occupiedBy = agent;
    this.occupiedUntil = Date.now() + durationMs;
  }

  release() {
    this.occupiedBy = null;
    this.occupiedUntil = null;
  }

  isOccupied() {
    if (!this.occupiedBy) return false;
    if (this.occupiedUntil && Date.now() > this.occupiedUntil) {
      this.release();
      return false;
    }
    return true;
  }

  canReserve(agent) {
    // Owner can always use. Others can use if not occupied.
    return !this.isOccupied() || (this.agentKey === agent.agentKey);
  }

  getWorkingPosition() {
    return this.seatPos;
  }

  getDeskPosition() {
    return this.deskPos;
  }

  getPcPosition() {
    return this.pcPos;
  }
}
