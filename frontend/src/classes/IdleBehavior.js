// classes/IdleBehavior.js
// Manages autonomous idle behaviors: coffee breaks, couch, whiteboard, table, water cooler.
// Agents check timers and randomly decide to interact with objects.

import Phaser from 'phaser';

export default class IdleBehavior {
  constructor(agent, interactiveObjects = {}) {
    this.agent = agent;
    this.objects = interactiveObjects; // { coffee, couch, table, whiteboard, water_cooler }
    this.isActive = true;
    this.nextActionTime = Date.now() + 3000; // Wait 3s before first idle action
    this.timers = {};
  }

  // Call from Agent update() every frame - prevents freezing
  update(time) {
    if (!this.isActive || !this.agent) return;
    if (this.agent.state !== 'idle' && this.agent.state !== 'patrolling') return;

    const now = Date.now();
    if (now < this.nextActionTime) return;

    // Random chance (25%) to trigger an idle behavior
    if (Math.random() > 0.25) {
      this.nextActionTime = now + 3000; // Check again in 3s
      return;
    }

    this._chooseIdleAction();
    // Schedule next action in 30-60 seconds
    this.nextActionTime = now + Phaser.Math.Between(30000, 60000);
  }

  _chooseIdleAction() {
    const actions = [
      { weight: 0.25, action: () => this._coffeeBreak() },
      { weight: 0.20, action: () => this._whiteboard() },
      { weight: 0.20, action: () => this._couch() },
      { weight: 0.15, action: () => this._table() },
      { weight: 0.10, action: () => this._waterCooler() },
      { weight: 0.10, action: () => this._idleTyping() },
    ];

    const r = Math.random();
    let sum = 0;
    for (const { weight, action } of actions) {
      sum += weight;
      if (r < sum) {
        action();
        return;
      }
    }
  }

  // Each helper gates on slot availability — an agent that can't find a free
  // slot simply stays at its desk rather than stacking on top of someone else.
  _tryInteract(obj) {
    if (!obj || !obj.findAvailableSlot) return false;
    if (!obj.findAvailableSlot()) return false;
    obj.startInteraction(this.agent);
    return true;
  }

  _coffeeBreak()  { return this._tryInteract(this.objects.coffee); }
  _whiteboard()   { return this._tryInteract(this.objects.whiteboard); }
  _couch()        { return this._tryInteract(this.objects.couch); }
  _table()        { return this._tryInteract(this.objects.table); }
  _waterCooler()  { return this._tryInteract(this.objects.water_cooler); }

  _idleTyping() {
    // Play typing animation at desk
    this.agent._setSprite(`agent_${this.agent.agentKey}_work0`);
    this.agent.setChatText('💭 Thinking…');

    // Type for 5-8 seconds
    const duration = Phaser.Math.Between(5000, 8000);
    this.agent.scene.time.delayedCall(duration, () => {
      if (this.agent && this.agent.state === 'idle') {
        this.agent.hideChat();
        this.agent._setSprite(`agent_${this.agent.agentKey}_idle`);
      }
    });
  }

  pause() {
    this.isActive = false;
    Object.values(this.timers).forEach(timer => timer?.remove?.());
    this.timers = {};
  }

  resume() {
    this.isActive = true;
    this.nextActionTime = Date.now() + 3000;
  }

  destroy() {
    this.pause();
  }
}
