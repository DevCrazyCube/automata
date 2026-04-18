// services/agentClickService.js
// Handles clicking on agents to show status and initiate conversations.

export class AgentClickHandler {
  constructor(scene, agents) {
    this.scene = scene;
    this.agents = agents;
    this.selectedAgent = null;
    this.setupClickHandlers();
  }

  setupClickHandlers() {
    // Add click handlers to all agent sprites
    for (const [key, agent] of Object.entries(this.agents)) {
      if (agent.sprite) {
        agent.sprite.setInteractive({ useHandCursor: true });
        agent.sprite.on('pointerdown', () => this.selectAgent(agent));
      }

      // Also make container clickable (larger hit area)
      if (agent.container) {
        agent.container.setInteractive({ useHandCursor: true });
        agent.container.on('pointerdown', () => this.selectAgent(agent));
      }
    }

    // Click anywhere to deselect
    this.scene.input.on('pointerdown', (pointer) => {
      const hit = this.scene.input.hitTestPoint(pointer);
      if (hit.length === 0 || !this._isAgentClick(hit)) {
        this.deselectAgent();
      }
    });
  }

  _isAgentClick(hitItems) {
    // Check if any hit item is an agent
    for (const agent of Object.values(this.agents)) {
      for (const item of hitItems) {
        if (item === agent.sprite || item === agent.container) {
          return true;
        }
      }
    }
    return false;
  }

  selectAgent(agent) {
    this.selectedAgent = agent;
    this.showAgentStatus(agent);
  }

  deselectAgent() {
    this.selectedAgent = null;
    this.hideAgentStatus();
  }

  showAgentStatus(agent) {
    // Show agent status in-world or in overlay
    // For now, just set a chat text showing they're selected
    agent.setChatText(`📍 ${agent.name} selected`);
  }

  hideAgentStatus() {
    if (this.selectedAgent) {
      this.selectedAgent.hideChat();
    }
  }

  getSelectedAgent() {
    return this.selectedAgent;
  }
}
