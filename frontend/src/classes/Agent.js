// classes/Agent.js
// Simple colored-circle agent sprite with label, chat bubble, and progress
// bar. Designed to be driven by socket events from the backend.

import Phaser from 'phaser';

const STATE = {
  IDLE: 'idle',
  WALKING: 'walking',
  WORKING: 'working',
  CELEBRATING: 'celebrating'
};

class Agent {
  constructor(scene, x, y, name, colorHex) {
    this.scene = scene;
    this.name = name;
    this.colorHex = colorHex;
    this.state = STATE.IDLE;
    this.currentZone = null;

    const colorInt = Phaser.Display.Color.HexStringToColor(colorHex).color;

    // Body (circle)
    this.sprite = scene.add.circle(x, y, 18, colorInt).setStrokeStyle(2, 0x111827);

    // Label under the body
    this.label = scene.add
      .text(x, y + 26, name, {
        fontSize: '11px',
        color: '#e2e8f0',
        fontFamily: 'monospace'
      })
      .setOrigin(0.5, 0);

    // Progress bar (hidden by default)
    this.progressBg = scene.add
      .rectangle(x, y - 28, 40, 5, 0x1f2937)
      .setStrokeStyle(1, 0x374151)
      .setVisible(false);
    this.progressFill = scene.add
      .rectangle(x - 20, y - 28, 0, 4, colorInt)
      .setOrigin(0, 0.5)
      .setVisible(false);

    // Chat bubble (hidden by default)
    this.bubbleBg = scene.add
      .rectangle(x, y - 48, 120, 22, 0x111827, 0.92)
      .setStrokeStyle(1, 0x374151)
      .setVisible(false);
    this.bubbleText = scene.add
      .text(x, y - 48, '', {
        fontSize: '10px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 116, useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
  }

  /** Walk to the center of the given zone using a tween. */
  walkToZone(zone) {
    if (!zone) return;
    this.state = STATE.WALKING;
    const targetX = zone.x + zone.width / 2;
    const targetY = zone.y + zone.height / 2 - 10;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.syncChildren(),
      onComplete: () => {
        this.state = STATE.IDLE;
        this.currentZone = zone;
      }
    });
  }

  /** Perform an action: show bubble text and progress. */
  performAction(action, progress = 0) {
    this.state = STATE.WORKING;
    this.setChatText(action);
    this.setProgress(progress);
  }

  /** Celebrate by bouncing vertically a few times. */
  celebrate() {
    this.state = STATE.CELEBRATING;
    this.hideProgress();
    this.setChatText('Done ✓');
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 20,
      duration: 160,
      yoyo: true,
      repeat: 2,
      onUpdate: () => this.syncChildren(),
      onComplete: () => {
        this.state = STATE.IDLE;
        this.scene.time.delayedCall(600, () => this.hideChat());
      }
    });
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  syncChildren() {
    const x = this.sprite.x;
    const y = this.sprite.y;
    this.label.setPosition(x, y + 26);
    this.progressBg.setPosition(x, y - 28);
    this.progressFill.setPosition(x - 20, y - 28);
    this.bubbleBg.setPosition(x, y - 48);
    this.bubbleText.setPosition(x, y - 48);
  }

  setProgress(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    const width = (clamped / 100) * 40;
    this.progressBg.setVisible(true);
    this.progressFill.setVisible(true);
    this.progressFill.setSize(width, 4);
  }

  hideProgress() {
    this.progressBg.setVisible(false);
    this.progressFill.setVisible(false);
  }

  setChatText(text) {
    this.bubbleText.setText(text || '');
    const visible = Boolean(text);
    this.bubbleBg.setVisible(visible);
    this.bubbleText.setVisible(visible);
  }

  hideChat() {
    this.bubbleBg.setVisible(false);
    this.bubbleText.setVisible(false);
  }
}

export default Agent;
export { STATE };
