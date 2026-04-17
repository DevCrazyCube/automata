// classes/AgentInteraction.js
// Manages proximity-based interactions between agents.
// When 2+ agents are nearby and idle, they face each other and play conversation animations.

export default class AgentInteraction {
  constructor(scene, agents) {
    this.scene = scene;
    this.agents = agents;
    this.activeConversations = new Map();
    this.checkInterval = 1000; // Check every 1s
  }

  start() {
    this.updateTimer = this.scene.time.addEvent({
      delay: this.checkInterval,
      loop: true,
      callback: () => this.update(),
    });
  }

  update() {
    const agentList = Object.values(this.agents);

    // Check for pairs of idle agents
    for (let i = 0; i < agentList.length; i++) {
      for (let j = i + 1; j < agentList.length; j++) {
        const agent1 = agentList[i];
        const agent2 = agentList[j];

        if (this._shouldConverse(agent1, agent2)) {
          this._startConversation(agent1, agent2);
        } else {
          this._endConversation(agent1, agent2);
        }
      }
    }
  }

  _shouldConverse(agent1, agent2) {
    // Only converse if both are idle
    if (agent1.state !== 'idle' || agent2.state !== 'idle') return false;

    // Check distance (within 128 pixels)
    const dx = agent1.container.x - agent2.container.x;
    const dy = agent1.container.y - agent2.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < 128 && dist > 20;
  }

  _startConversation(agent1, agent2) {
    const key = this._getPairKey(agent1, agent2);

    if (this.activeConversations.has(key)) return;

    // Make agents face each other
    const dx = agent2.container.x - agent1.container.x;
    const angle = Math.atan2(0, dx); // Just use x difference for left/right

    // Play conversation animation
    agent1.scene.anims.play(`${agent1.agentKey}_talk`, agent1.sprite);
    agent2.scene.anims.play(`${agent2.agentKey}_talk`, agent2.sprite);

    const conversation = {
      agent1, agent2,
      startTime: Date.now(),
      endTime: Date.now() + (8000 + Math.random() * 4000), // 8-12 seconds
    };

    this.activeConversations.set(key, conversation);

    agent1.setChatText('Chatting…');
    agent2.setChatText('Chatting…');
  }

  _endConversation(agent1, agent2) {
    const key = this._getPairKey(agent1, agent2);
    const conv = this.activeConversations.get(key);

    if (!conv) return;

    // Check if conversation time expired
    if (Date.now() < conv.endTime) return;

    this.activeConversations.delete(key);

    // Reset animations if still idle
    if (agent1.state === 'idle') {
      agent1.hideChat();
      agent1._setSprite(`agent_${agent1.agentKey}_idle`);
    }
    if (agent2.state === 'idle') {
      agent2.hideChat();
      agent2._setSprite(`agent_${agent2.agentKey}_idle`);
    }
  }

  _getPairKey(agent1, agent2) {
    const key1 = agent1.agentKey;
    const key2 = agent2.agentKey;
    return key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
  }

  stop() {
    if (this.updateTimer) {
      this.updateTimer.remove(false);
      this.updateTimer = null;
    }
    this.activeConversations.clear();
  }

  destroy() {
    this.stop();
  }
}
