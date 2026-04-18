// classes/InteractiveObject.js
// Manages interaction anchors and behavior (no visible sprites).
// Agents pathfind to interaction points, play animations, and return.
// Furniture sprites are rendered by OfficeEnvironment only.

import Phaser from 'phaser';

export default class InteractiveObject {
  constructor(scene, x, y, type, options = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type; // 'coffee', 'couch', 'table', 'whiteboard', 'water_cooler'
    this.interactionRadius = options.radius || 64;
    this.agentsNearby = new Set();
    this.agentsInteracting = new Map(); // agent → { state, timer }

    // No sprite creation — furniture is rendered by OfficeEnvironment
    // This class is logic-only: interaction anchors, not visible objects
  }

  // Check if agent is in interaction radius
  isAgentNearby(agent) {
    const dx = agent.container.x - this.x;
    const dy = agent.container.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.interactionRadius;
  }

  // Called from idle behavior loop to trigger interaction
  startInteraction(agent) {
    if (this.agentsInteracting.has(agent)) return;

    const interaction = {
      state: 'walking',
      agent,
      startTime: Date.now(),
      prevActivity: null,
    };

    this.agentsInteracting.set(agent, interaction);
    agent._stopPatrol();
    agent._stopWalkAnim();

    // Walk to object center
    const distance = Phaser.Math.Distance.Between(
      agent.container.x, agent.container.y, this.x, this.y
    );
    const duration = Phaser.Math.Clamp(distance * 4, 300, 1200);

    agent._walkTo(this.x, this.y, duration, () => {
      this._playInteraction(agent);
    });
  }

  _playInteraction(agent) {
    const interaction = this.agentsInteracting.get(agent);
    if (!interaction) return;

    interaction.state = 'interacting';

    switch (this.type) {
      case 'coffee':
        this._coffeeInteraction(agent);
        break;
      case 'couch':
        this._couchInteraction(agent);
        break;
      case 'table':
        this._tableInteraction(agent);
        break;
      case 'whiteboard':
        this._whiteboardInteraction(agent);
        break;
      case 'water_cooler':
        this._waterCoolerInteraction(agent);
        break;
    }
  }

  // Guard: animations for agent interactions aren't registered in the new
  // sprite pipeline. Skip silently instead of throwing & stranding the agent.
  _safePlayAnim(agent, animKey, target) {
    try {
      if (agent?.scene?.anims?.exists?.(animKey)) {
        agent.scene.anims.play(animKey, target);
      }
    } catch (e) {
      console.warn(`anim ${animKey} failed:`, e);
    }
  }

  _coffeeInteraction(agent) {
    agent._setSprite(`agent_${agent.agentKey}_coffee_reach0`);
    this._safePlayAnim(agent,`${agent.agentKey}_coffee_reach`, agent.sprite);

    // Wait for reach animation, then hold coffee
    this.scene.time.delayedCall(500, () => {
      agent._setSprite(`agent_${agent.agentKey}_coffee0`);
      agent.setChatText('☕ Sipping coffee');

      // Trigger coffee steam particles if available
      if (agent.scene.office && agent.scene.office.triggerCoffeeParticles) {
        agent.scene.office.triggerCoffeeParticles();
      }

      // Sit with coffee for 8 seconds
      this.scene.time.delayedCall(8000, () => {
        this._completeInteraction(agent);
      });
    });
  }

  _couchInteraction(agent) {
    // Sit down animation
    this._safePlayAnim(agent,`${agent.agentKey}_sit_down`, agent.sprite);

    this.scene.time.delayedCall(600, () => {
      agent._setSprite(`agent_${agent.agentKey}_couch0`);
      agent.setChatText('Relaxing…');

      // Sit for 10 seconds
      this.scene.time.delayedCall(10000, () => {
        // Get up animation
        this._safePlayAnim(agent,`${agent.agentKey}_get_up`, agent.sprite);
        this.scene.time.delayedCall(400, () => {
          this._completeInteraction(agent);
        });
      });
    });
  }

  _tableInteraction(agent) {
    agent._setSprite(`agent_${agent.agentKey}_idle0`);
    agent.setChatText('At table…');

    // Check for other agents at table
    const nearbyAgents = [];
    for (const [otherAgent, state] of this.agentsInteracting.entries()) {
      if (otherAgent !== agent && state.state === 'interacting') {
        nearbyAgents.push(otherAgent);
      }
    }

    const duration = nearbyAgents.length >= 2 ? 12000 : 6000;

    if (nearbyAgents.length >= 2) {
      this._safePlayAnim(agent,`${agent.agentKey}_talk`, agent.sprite);
      agent.setChatText('Chatting');
    }

    this.scene.time.delayedCall(duration, () => {
      this._completeInteraction(agent);
    });
  }

  _whiteboardInteraction(agent) {
    this._safePlayAnim(agent,`${agent.agentKey}_write`, agent.sprite);
    agent.setChatText('Writing…');

    // Write for 8 seconds
    this.scene.time.delayedCall(8000, () => {
      this._completeInteraction(agent);
    });
  }

  _waterCoolerInteraction(agent) {
    agent._setSprite(`agent_${agent.agentKey}_idle0`);
    agent.setChatText('Getting water…');

    // Quick interaction: 5 seconds
    this.scene.time.delayedCall(5000, () => {
      this._completeInteraction(agent);
    });
  }

  _completeInteraction(agent) {
    const interaction = this.agentsInteracting.get(agent);
    if (!interaction) return;

    agent.hideChat();
    agent._setSprite(`agent_${agent.agentKey}_idle`);
    agent._setFrame(0);
    this.agentsInteracting.delete(agent);

    // Return to patrol — use the Agent's STATE constant path.
    agent.state = 'idle';
    agent._schedulePatrol();
  }

  // Stop all interactions (for phase changes)
  cancelAll() {
    for (const [agent] of this.agentsInteracting.entries()) {
      agent._stopWalkAnim();
      agent.hideChat();
      agent._setSprite(`agent_${agent.agentKey}_idle`);
      agent._schedulePatrol();
    }
    this.agentsInteracting.clear();
    this.agentsNearby.clear();
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    this.cancelAll();
  }
}
