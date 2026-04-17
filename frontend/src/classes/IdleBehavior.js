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

  _coffeeBreak() {
    if (!this.objects.coffee) return;
    this.objects.coffee.startInteraction(this.agent);
  }

  _whiteboard() {
    if (!this.objects.whiteboard) return;
    this.objects.whiteboard.startInteraction(this.agent);
  }

  _couch() {
    if (!this.objects.couch) return;
    this.objects.couch.startInteraction(this.agent);
  }

  _table() {
    if (!this.objects.table) return;
    this.objects.table.startInteraction(this.agent);
  }

  _waterCooler() {
    if (!this.objects.water_cooler) return;
    this.objects.water_cooler.startInteraction(this.agent);
  }

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
