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
  SITTING:     'sitting',
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

    // Character sprite from spritesheet.
    // Native frame is 16×32; office grid is 32px/tile, so scale 2× to match
    // furniture/floors and read as a believable person in the room.
    const textureKey = `char_${this._getCharIdx(agentKey)}`;
    if (scene.textures.exists(textureKey)) {
      this.sprite = scene.add.sprite(0, 0, textureKey, 0);
      this.sprite.setOrigin(0.5, 1);   // anchor at bottom-center (feet)
      this.sprite.setScale(2);
      this.sprite.setDepth(20);
    } else {
      this.sprite = scene.add.rectangle(0, 0, 32, 64, tint, 0.9);
      this.sprite.setOrigin(0.5, 1);
      this.sprite.setDepth(20);
      console.warn(`Spritesheet missing: ${textureKey}`);
    }

    // Name label just below the feet
    this.label = scene.add.text(0, 8, name, {
      fontSize: '8px',
      color: '#cbd5e1',
      fontFamily: 'monospace',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Progress bar above the head (sprite is 64px tall, head at y=-64)
    this.progressBg = scene.add.rectangle(0, -70, 32, 4, 0x1e293b)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    this.progressFill = scene.add.rectangle(-16, -70, 0, 2, tint)
      .setOrigin(0, 0.5)
      .setVisible(false);

    // Speech bubble above the progress bar
    this.bubbleBg = scene.add.rectangle(0, -84, 88, 16, 0x0f172a, 0.93)
      .setStrokeStyle(1, 0x334155)
      .setVisible(false);

    this.bubbleText = scene.add.text(0, -84, '', {
      fontSize: '8px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 84, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Shadow sized to the scaled sprite's footprint
    this.shadow = scene.add.ellipse(0, 3, 20, 6, 0x000020, 0.4);

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
    const idx = map[agentKey] ?? 0;
    // Clamp to available sprites 0-5
    return Math.min(idx, 5);
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

  /** Walk to this agent's workstation and play typing animation.
   *  Reserves the workstation so other agents (shouldn't normally happen,
   *  since each workstation has one owner, but still) cannot double-book. */
  startWorking(action, progress = 0) {
    this._stopPatrol();
    this._stopWalkAnim();

    const ws = this.workstation;
    const beginTyping = () => {
      this.state = STATE.WORKING;
      this._setFrame(10);        // up-facing typing (sits south, faces desk north)
      this._startTypingAnim();
      this.setChatText(action);
      this.setProgress(progress);
    };

    if (ws && !ws.isOccupied()) {
      ws.reserve(this, 30000);
      const seat = ws.getWorkingPosition();
      this._walkTo(seat.x, seat.y, 500, beginTyping);
    } else {
      beginTyping();
    }
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
    // Y-based depth: agents render in front/behind based on their vertical position.
    // Depth = Y position means agents at lower screen positions render in front.
    this.container.setDepth(Math.round(this.container.y));

    if (this.state === STATE.IDLE || this.state === STATE.PATROLLING) {
      if (this.idleBehavior) {
        this.idleBehavior.update();
      }
    }
  }

  // ── Progress bar ────────────────────────────────────────────────────────────

  setProgress(percent) {
    const clamped = Phaser.Math.Clamp(percent, 0, 100);
    const w = (clamped / 100) * 32;
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

  // Legacy sprite-key compatibility for InteractiveObject/IdleBehavior,
  // which were written for the pre-spritesheet Agent API. Map the intent
  // of the old key to one of our three frame-set states.
  _setSprite(spriteKey) {
    if (!spriteKey || typeof spriteKey !== 'string') {
      this._setFrame(0);
      return;
    }
    if (spriteKey.includes('_work') || spriteKey.includes('_coffee_reach')
        || spriteKey.includes('_write')) {
      this._setFrame(3);   // typing
    } else if (spriteKey.includes('_coffee') || spriteKey.includes('_couch')) {
      this._setFrame(5);   // reading/sitting (row 0 variant)
    } else {
      this._setFrame(0);   // idle
    }
  }

  /** Move container to (tx, ty) with a walk animation.
   *  Sets facing frame based on movement direction for believability. */
  _walkTo(tx, ty, duration, onComplete) {
    this.state = STATE.WALKING;
    if (this._activeTween) {
      this._activeTween.stop();
      this._activeTween = null;
    }
    if (this._bobTween) { this._bobTween.stop(); this._bobTween = null; }

    // Choose direction row based on dominant axis.
    const dx = tx - this.container.x;
    const dy = ty - this.container.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this._walkRow = 2;        // right (flip for left)
      this.sprite.setFlipX(dx < 0);
    } else if (dy < 0) {
      this._walkRow = 1;        // up
      this.sprite.setFlipX(false);
    } else {
      this._walkRow = 0;        // down
      this.sprite.setFlipX(false);
    }

    this._startWalkAnim();

    // Subtle vertical bob on sprite only (NOT the container), so the agent's
    // feet stay on the floor and the tween path is perfectly linear.
    this._bobTween = this.scene.tweens.add({
      targets: this.sprite,
      y: { from: 0, to: -2 },
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this._activeTween = this.scene.tweens.add({
      targets: this.container,
      x: tx,
      y: ty,
      duration,
      ease: 'Linear',
      onComplete: () => {
        if (this._bobTween) { this._bobTween.stop(); this._bobTween = null; }
        this.sprite.setY(0);
        this._stopWalkAnim();
        this._setFrame(this._idleFrameForRow(this._walkRow));
        if (onComplete) onComplete();
      }
    });
  }

  _idleFrameForRow(row) {
    // First frame of each direction row is idle-stance.
    return row === 0 ? 0 : row === 1 ? 7 : 14;
  }

  /** Alternate walk frames on a timer. Row selects direction (0 down, 1 up, 2 right). */
  _startWalkAnim() {
    this._stopWalkAnim();

    this._walkFrame = 0;
    const row = this._walkRow ?? 0;
    const base = row === 0 ? 0 : row === 1 ? 7 : 14;
    this._walkTimer = this.scene.time.addEvent({
      delay: WALK_FRAME_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (this.state !== STATE.WALKING && this.state !== STATE.PATROLLING) return;
        this._walkFrame = (this._walkFrame + 1) % 3;
        this._setFrame(base + this._walkFrame);
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

  /** Alternate typing frames on a timer.
   *  Agent sits south of desk and faces north → use up-row typing frames 10/11. */
  _startTypingAnim() {
    this._stopWalkAnim();

    this._walkFrame = 0;
    this._walkTimer = this.scene.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (this.state !== STATE.WORKING) return;
        this._walkFrame = 1 - this._walkFrame;
        this._setFrame(10 + this._walkFrame);
      }
    });
  }

  /** Schedule a random patrol step around the home zone. Self-recovers:
   *  if the agent is busy when the timer fires we simply re-schedule, so
   *  patrol never silently terminates on a transient state mismatch. */
  _schedulePatrol() {
    if (this._patrolTimer) return;
    const pause = Phaser.Math.Between(PATROL_PAUSE_MIN, PATROL_PAUSE_MAX);
    this._patrolTimer = this.scene.time.delayedCall(pause, () => {
      this._patrolTimer = null;

      if (this.state !== STATE.IDLE && this.state !== STATE.PATROLLING) {
        // Try again later rather than giving up.
        this._schedulePatrol();
        return;
      }

      // Re-check after idleBehavior.update() in case it transitioned state.
      if (this.idleBehavior) {
        try { this.idleBehavior.update(); } catch (e) { console.warn('idleBehavior:', e); }
      }

      if (this.state === STATE.IDLE || this.state === STATE.PATROLLING) {
        this._doPatrolStep();
      } else {
        this._schedulePatrol();
      }
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
    const dur  = Phaser.Math.Clamp(dist * 5, 150, 500);

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
