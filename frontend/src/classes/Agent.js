// classes/Agent.js
// Pixel-art agent that walks, works, and celebrates.
// Uses character spritesheets loaded as frame grids: 112×96 = 7 cols × 3 rows of 16×32.
// Frame layout per spritesheet:
//   Row 0 (down):    [0-2] walk, [3-4] typing, [5-6] reading
//   Row 1 (up):      [7-9] walk, [10-11] typing, [12-13] reading
//   Row 2 (right):   [14-16] walk, [17-18] typing, [19-20] reading
// Left frames are flipped horizontally.

import Phaser from 'phaser';

export const STATE = {
  IDLE:        'idle',
  PATROLLING:  'patrolling',
  WALKING:     'walking',
  WORKING:     'working',
  CELEBRATING: 'celebrating',
};

const WALK_FRAME_INTERVAL_MS = 180;
const PATROL_STEP_MIN = 16;
const PATROL_STEP_MAX = 48;
const PATROL_PAUSE_MIN = 600;
const PATROL_PAUSE_MAX = 1800;

export default class Agent {
  constructor(scene, x, y, name, agentKey, tint) {
    this.scene     = scene;
    this.name      = name;
    this.agentKey  = agentKey;
    this.tint      = tint;
    this.state     = STATE.IDLE;
    this.homeX     = x;
    this.homeY     = y;
    this.currentZone = null;
    this.idleBehavior = null;

    // Walk animation state
    this._walkFrame    = 0;
    this._walkTimer    = null;
    this._patrolTimer  = null;
    this._activeTween  = null;

    // ── Container (all children positioned relative to container origin) ──
    this.container = scene.add.container(x, y);
    this.container.setDepth(25);

    // Character sprite from spritesheet
    const textureKey = `char_${this._getCharIdx(agentKey)}`;
    if (scene.textures.exists(textureKey)) {
      this.sprite = scene.add.sprite(0, 0, textureKey, 0);
      this.sprite.setOrigin(0.5, 1);  // anchor at bottom-center
      this.sprite.setScale(2);        // 16×32 → 32×64 visible size
      this.sprite.setDepth(20);
    } else {
      this.sprite = scene.add.rectangle(0, 0, 32, 64, tint, 0.9);
      this.sprite.setOrigin(0.5, 1);
      this.sprite.setDepth(20);
      console.warn(`Spritesheet missing: ${textureKey}`);
    }

    // Name label
    this.label = scene.add.text(0, 8, name, {
      fontSize: '9px',
      color: '#cbd5e1',
      fontFamily: 'monospace',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(0.5, 1);

    // Progress bar background
    this.progressBg = scene.add.rectangle(0, -42, 38, 5, 0x1e293b)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    // Progress fill
    this.progressFill = scene.add.rectangle(-19, -42, 0, 3, tint)
      .setOrigin(0, 0.5)
      .setVisible(false);

    // Speech bubble background
    this.bubbleBg = scene.add.rectangle(0, -60, 108, 18, 0x0f172a, 0.93)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    // Speech bubble text
    this.bubbleText = scene.add.text(0, -60, '', {
      fontSize: '8px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 102, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Shadow
    this.shadow = scene.add.ellipse(0, 10, 18, 6, 0x000020, 0.4);

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

    // Start idle patrol
    this._schedulePatrol();
  }

  _getCharIdx(agentKey) {
    const map = { deployer: 0, distributor: 1, swapper: 2, extractor: 3 };
    return map[agentKey] ?? 0;
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
    this._setFrame(3);  // typing frame 0
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

    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 18,
      duration: 130,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.state = STATE.IDLE;
        this._setFrame(0);
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
    this._setFrame(0);
    this.hideProgress();
    this.hideChat();
    this.container.setPosition(this.homeX, this.homeY);
    if (this.idleBehavior) this.idleBehavior.resume();
    this._schedulePatrol();
  }

  // ── Frame update (called from scene) ──
  update(time) {
    if (this.state === STATE.IDLE || this.state === STATE.PATROLLING) {
      if (this.idleBehavior) {
        this.idleBehavior.update();
      }
    }
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

  _setFrame(frameIdx) {
    if (this.sprite && this.sprite.setFrame) {
      this.sprite.setFrame(frameIdx);
    }
  }

  /** Move container to (tx, ty) with a walk animation. */
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
        this._setFrame(0);
        if (onComplete) onComplete();
      }
    });
  }

  /** Alternate walk frames on a timer. */
  _startWalkAnim() {
    if (this._walkTimer) return;
    this._walkFrame = 0;
    this._walkTimer = this.scene.time.addEvent({
      delay: WALK_FRAME_INTERVAL_MS,
      loop: true,
      callback: () => {
        this._walkFrame = (this._walkFrame + 1) % 3;  // frames 0, 1, 2 for walk
        this._setFrame(this._walkFrame);
      }
    });
  }

  _stopWalkAnim() {
    if (this._walkTimer) {
      this._walkTimer.remove(false);
      this._walkTimer = null;
    }
    this._setFrame(0);
  }

  /** Alternate typing frames on a timer. */
  _startTypingAnim() {
    if (this._walkTimer) return;
    this._walkFrame = 0;
    this._walkTimer = this.scene.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        this._walkFrame = 1 - this._walkFrame;
        // typing frames: 3, 4
        this._setFrame(3 + this._walkFrame);
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
