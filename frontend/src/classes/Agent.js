// classes/Agent.js
// Full-featured pixel-art agent with:
//   • Idle patrol:  walks short random paths around the home workstation
//   • Working pose: seated "typing" animation at the desk
//   • Walking:      2-frame walk cycle tween to destination
//   • Celebrating:  bounce + spin on phase complete
//   • Speech bubble and progress bar
// Uses a Phaser.GameObjects.Container so all sub-objects move together —
// eliminating the syncChildren() flicker of the previous implementation.

import Phaser from 'phaser';

export const STATE = {
  IDLE:        'idle',
  PATROLLING:  'patrolling',
  WALKING:     'walking',
  WORKING:     'working',
  CELEBRATING: 'celebrating',
};

const WALK_FRAME_INTERVAL_MS = 180; // how often to swap walk frames
const PATROL_STEP_MIN = 16;
const PATROL_STEP_MAX = 48;
const PATROL_PAUSE_MIN = 600;
const PATROL_PAUSE_MAX = 1800;

export default class Agent {
  /**
   * @param {Phaser.Scene} scene
   * @param {number}       x        world X (centre)
   * @param {number}       y        world Y (centre)
   * @param {string}       name     e.g. 'Deployer'
   * @param {string}       agentKey e.g. 'deployer'
   * @param {number}       tint     0xRRGGBB accent for progress bar
   */
  constructor(scene, x, y, name, agentKey, tint) {
    this.scene     = scene;
    this.name      = name;
    this.agentKey  = agentKey;
    this.tint      = tint;
    this.state     = STATE.IDLE;
    this.homeX     = x;
    this.homeY     = y;
    this.currentZone = null;
    this.idleBehavior = null; // Set by scene after creation

    // Walk animation state
    this._walkFrame    = 0;
    this._walkTimer    = null;
    this._patrolTimer  = null;
    this._activeTween  = null;

    // ── Container (all children positioned relative to container origin) ──
    this.container = scene.add.container(x, y);

    // Sprite (32×32, centred on container origin)
    const spriteKey = `agent_${agentKey}_idle`;
    this.sprite = scene.add.image(0, 0, spriteKey);
    this.sprite.setOrigin(0.5, 0.5);

    // Fallback if sprite doesn't exist
    if (!scene.textures.exists(spriteKey)) {
      console.warn(`Sprite key not found: ${spriteKey}, using placeholder`);
      this.sprite.setFillStyle(tint);
      this.sprite.setDisplaySize(16, 16);
    }

    // Name label
    this.label = scene.add.text(0, 22, name, {
      fontSize: '9px',
      color: '#cbd5e1',
      fontFamily: 'monospace',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Progress bar background
    this.progressBg = scene.add.rectangle(0, -24, 38, 5, 0x1e293b)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    // Progress fill (positioned left-edge at -19)
    this.progressFill = scene.add.rectangle(-19, -24, 0, 3, tint)
      .setOrigin(0, 0.5)
      .setVisible(false);

    // Speech bubble background (wider, sits above progress bar)
    this.bubbleBg = scene.add.rectangle(0, -42, 108, 18, 0x0f172a, 0.93)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    // Speech bubble text
    this.bubbleText = scene.add.text(0, -42, '', {
      fontSize: '8px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 102, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Depth indicator dot (tiny colored circle under sprite)
    this.shadow = scene.add.ellipse(0, 14, 18, 6, 0x000020, 0.4);

    // Add children to container in draw order
    this.container.add([
      this.shadow,
      this.sprite,
      this.label,
      this.progressBg,
      this.progressFill,
      this.bubbleBg,
      this.bubbleText,
    ]);

    // Start idle patrol immediately
    this._schedulePatrol();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Walk the agent to the centre of a zone object {x,y,width,height}. */
  walkToZone(zone) {
    if (!zone) return;
    this._stopPatrol();
    this._stopWalkAnim();

    const tx = zone.x + zone.width  / 2;
    const ty = zone.y + zone.height / 2 - 6;
    this._walkTo(tx, ty, 800, () => {
      this.state = STATE.IDLE;
      this.currentZone = zone;
      this._schedulePatrol();
    });
  }

  /** Walk to a specific (x, y) and invoke callback on arrival. */
  walkToXY(x, y, duration = 700, onComplete) {
    this._stopPatrol();
    this._walkTo(x, y, duration, onComplete);
  }

  /** Show working-at-desk pose + typing animation. */
  startWorking(action, progress = 0) {
    this._stopPatrol();
    this._stopWalkAnim();
    this.state = STATE.WORKING;
    this._setSprite(`agent_${this.agentKey}_work0`);
    this._startTypingAnim();
    this.setChatText(action);
    this.setProgress(progress);
  }

  /** Update progress bar mid-work. */
  setProgressValue(progress) {
    this.setProgress(progress);
  }

  /** Celebrate: bounce + flash, then return to idle patrol. */
  celebrate() {
    this._stopPatrol();
    this._stopWalkAnim();
    this.state = STATE.CELEBRATING;
    this.hideProgress();
    this.setChatText('Done ✓');

    // Bounce tween on the container
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 18,
      duration: 130,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.state = STATE.IDLE;
        this._setSprite(`agent_${this.agentKey}_idle`);
        this.scene.time.delayedCall(900, () => {
          this.hideChat();
          this._schedulePatrol();
        });
      }
    });
  }

  /** Stop all activity and reset to home position. */
  reset() {
    this._stopPatrol();
    this._stopWalkAnim();
    this.state = STATE.IDLE;
    this._setSprite(`agent_${this.agentKey}_idle`);
    this.hideProgress();
    this.hideChat();
    this.container.setPosition(this.homeX, this.homeY);
    this._schedulePatrol();
  }

  // ── Progress bar ────────────────────────────────────────────────────────────

  setProgress(percent) {
    const clamped = Phaser.Math.Clamp(percent, 0, 100);
    const w = (clamped / 100) * 36;
    this.progressBg.setVisible(true);
    this.progressFill.setVisible(true);
    this.progressFill.setSize(w, 3);
  }

  hideProgress() {
    this.progressBg.setVisible(false);
    this.progressFill.setVisible(false);
  }

  // ── Speech bubble ───────────────────────────────────────────────────────────

  setChatText(text) {
    const visible = Boolean(text && text.trim());
    this.bubbleText.setText(text || '');
    this.bubbleBg.setVisible(visible);
    this.bubbleText.setVisible(visible);
  }

  hideChat() {
    this.bubbleBg.setVisible(false);
    this.bubbleText.setVisible(false);
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _setSprite(key) {
    if (this.scene.textures.exists(key)) {
      this.sprite.setTexture(key);
    }
  }

  /** Move the container to (tx, ty) with a walk animation. */
  _walkTo(tx, ty, duration, onComplete) {
    this.state = STATE.WALKING;
    if (this._activeTween) {
      this._activeTween.stop();
      this._activeTween = null;
    }
    this._startWalkAnim();
    this._activeTween = this.scene.tweens.add({
      targets: this.container,
      x: tx,
      y: ty,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this._stopWalkAnim();
        this._setSprite(`agent_${this.agentKey}_idle`);
        if (onComplete) onComplete();
      }
    });
  }

  /** Flip-flop walk frames on a timer. */
  _startWalkAnim() {
    if (this._walkTimer) return;
    this._walkTimer = this.scene.time.addEvent({
      delay: WALK_FRAME_INTERVAL_MS,
      loop: true,
      callback: () => {
        this._walkFrame = 1 - this._walkFrame;
        const key = `agent_${this.agentKey}_walk${this._walkFrame}`;
        this._setSprite(key);
      }
    });
  }

  _stopWalkAnim() {
    if (this._walkTimer) {
      this._walkTimer.remove(false);
      this._walkTimer = null;
    }
  }

  /** Typing animation: alternate work0 / work1 frames. */
  _startTypingAnim() {
    if (this._walkTimer) return; // reuse slot
    this._walkTimer = this.scene.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        this._walkFrame = 1 - this._walkFrame;
        const key = `agent_${this.agentKey}_work${this._walkFrame}`;
        this._setSprite(key);
      }
    });
  }

  /** Schedule a random patrol step around the home zone. */
  _schedulePatrol() {
    if (this._patrolTimer) return;
    const pause = Phaser.Math.Between(PATROL_PAUSE_MIN, PATROL_PAUSE_MAX);
    this._patrolTimer = this.scene.time.delayedCall(pause, () => {
      this._patrolTimer = null;
      if (this.state !== STATE.IDLE && this.state !== STATE.PATROLLING) return;

      // Check idle behavior (coffee, couch, etc.)
      if (this.idleBehavior) {
        this.idleBehavior.update();
      }

      this._doPatrolStep();
    });
  }

  _doPatrolStep() {
    this.state = STATE.PATROLLING;
    const cx = this.container.x;
    const cy = this.container.y;
    const dx = Phaser.Math.Between(-PATROL_STEP_MAX, PATROL_STEP_MAX);
    const dy = Phaser.Math.Between(-PATROL_STEP_MAX / 2, PATROL_STEP_MAX / 2);
    // Clamp to stay near home
    const tx = Phaser.Math.Clamp(cx + dx, this.homeX - PATROL_STEP_MAX, this.homeX + PATROL_STEP_MAX);
    const ty = Phaser.Math.Clamp(cy + dy, this.homeY - PATROL_STEP_MAX / 2, this.homeY + PATROL_STEP_MAX / 2);
    const dist = Phaser.Math.Distance.Between(cx, cy, tx, ty);
    const dur  = Phaser.Math.Clamp(dist * 9, 200, 700);

    this._walkTo(tx, ty, dur, () => {
      this.state = STATE.IDLE;
      this._schedulePatrol();
    });
  }

  _stopPatrol() {
    if (this._patrolTimer) {
      this._patrolTimer.remove(false);
      this._patrolTimer = null;
    }
  }
}
