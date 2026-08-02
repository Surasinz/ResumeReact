import './WebShimeji.css';

export const SHIMEJI_STATES = Object.freeze({
  Idle: 'Idle',
  WalkRight: 'WalkRight',
  WalkLeft: 'WalkLeft',
  Dragged: 'Dragged',
  Falling: 'Falling',
  Working: 'Working',
});

/*
 * SPRITE ATLAS SETUP
 * ------------------
 * The bundled atlas is 7 columns × 5 rows. Each source cell is 256 × 256 px.
 * To use another sprite sheet, update frameWidth, frameHeight, columns, rows,
 * and the row/column coordinates below. Frames do not need to be contiguous.
 */
export const DEFAULT_ANIMATIONS = Object.freeze({
  [SHIMEJI_STATES.Idle]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 0 })),
    fps: 6,
  },
  [SHIMEJI_STATES.WalkRight]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 1 })),
    fps: 10,
  },
  [SHIMEJI_STATES.WalkLeft]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 1 })),
    fps: 10,
  },
  [SHIMEJI_STATES.Dragged]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 2 })),
    fps: 8,
  },
  [SHIMEJI_STATES.Falling]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 3 })),
    fps: 10,
  },
  [SHIMEJI_STATES.Working]: {
    frames: [0, 1, 2, 3, 4, 5, 6].map((column) => ({ column, row: 4 })),
    fps: 7,
  },
});

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

const randomBetween = (random, minimum, maximum) =>
  minimum + random() * (maximum - minimum);

export default class WebShimeji {
  constructor({
    spriteUrl,
    // Pass an element to keep the mascot inside it instead of letting it
    // roam the viewport. The bounds it walks and falls within, and the
    // coordinate space it is dragged in, both follow from this.
    container = null,
    frameWidth = 256,
    frameHeight = 256,
    columns = 7,
    rows = 5,
    displayWidth = 128,
    groundOffset = 8,
    walkSpeed = 72,
    fallSpeed = 480,
    animations = DEFAULT_ANIMATIONS,
    random = Math.random,
  }) {
    if (!spriteUrl) throw new Error('WebShimeji requires a spriteUrl.');

    this.spriteUrl = spriteUrl;
    this.container = container;
    this.resizeObserver = null;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = columns;
    this.rows = rows;
    this.displayWidth = displayWidth;
    this.displayHeight = Math.round(displayWidth * (frameHeight / frameWidth));
    this.groundOffset = groundOffset;
    this.walkSpeed = walkSpeed;
    this.fallSpeed = fallSpeed;
    this.animations = animations;
    this.random = random;

    this.element = null;
    this.state = SHIMEJI_STATES.Falling;
    this.facingDirection = 1;
    this.position = { x: 0, y: 0 };
    this.bounds = { width: 0, height: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.dragging = false;
    this.frameIndex = 0;
    this.frameElapsed = 0;
    this.lastTimestamp = 0;
    this.stateEndsAt = 0;
    this.animationFrame = null;
    this.motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionPreference?.matches ?? false;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMotionPreferenceChange =
      this.handleMotionPreferenceChange.bind(this);
    this.tick = this.tick.bind(this);
  }

  mount() {
    if (this.element) return this;

    this.element = document.createElement('div');
    this.element.className = 'web-shimeji';
    this.element.dataset.webShimeji = '';
    this.element.dataset.state = this.state;
    this.element.setAttribute('role', 'img');
    this.element.setAttribute('aria-label', 'Surachet builder bot virtual mascot');
    this.element.style.width = `${this.displayWidth}px`;
    this.element.style.height = `${this.displayHeight}px`;
    this.element.style.backgroundImage = `url("${this.spriteUrl}")`;
    this.element.style.backgroundSize =
      `${this.columns * this.displayWidth}px ${this.rows * this.displayHeight}px`;

    const mountTarget =
      this.container ?? document.querySelector('.site-shell') ?? document.body;
    if (this.container) this.element.classList.add('is-contained');
    mountTarget.appendChild(this.element);
    this.updateBounds();
    this.position.x = Math.min(32, this.getMaximumX());
    this.position.y = 16;
    this.renderPosition();
    this.renderFrame();

    this.element.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove, { passive: false });
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleResize);
    // A window resize says nothing about a container that reflows on its
    // own, so watch the box directly when there is one.
    if (this.container && typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.container);
    }
    this.motionPreference?.addEventListener?.(
      'change',
      this.handleMotionPreferenceChange
    );

    if (this.reducedMotion) {
      this.position.y = this.getGroundY();
      this.setState(SHIMEJI_STATES.Idle);
      this.renderPosition();
    } else {
      this.animationFrame = window.requestAnimationFrame(this.tick);
    }

    return this;
  }

  destroy() {
    if (!this.element) return;

    this.element.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.motionPreference?.removeEventListener?.(
      'change',
      this.handleMotionPreferenceChange
    );

    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    this.element.remove();
    this.element = null;
    this.animationFrame = null;
  }

  setState(nextState, duration = 0) {
    if (!this.animations[nextState]) return;

    if (nextState === SHIMEJI_STATES.WalkLeft) {
      this.facingDirection = -1;
    } else if (nextState === SHIMEJI_STATES.WalkRight) {
      this.facingDirection = 1;
    }

    this.state = nextState;
    this.frameIndex = 0;
    this.frameElapsed = 0;
    this.stateEndsAt = duration > 0 ? performance.now() + duration : 0;

    if (this.element) {
      this.element.dataset.state = nextState;
      this.renderFrame();
      this.renderPosition();
    }
  }

  tick(timestamp) {
    if (!this.element) return;

    const elapsedSeconds = this.lastTimestamp
      ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05)
      : 0;
    this.lastTimestamp = timestamp;

    const previousX = this.position.x;
    const previousY = this.position.y;

    this.updatePhysics(elapsedSeconds, timestamp);
    this.updateAnimation(elapsedSeconds);

    if (this.position.x !== previousX || this.position.y !== previousY) {
      this.renderPosition();
    }

    this.animationFrame = window.requestAnimationFrame(this.tick);
  }

  updatePhysics(elapsedSeconds, timestamp) {
    if (this.dragging) return;

    if (this.state === SHIMEJI_STATES.Falling) {
      this.position.y += this.fallSpeed * elapsedSeconds;

      if (this.position.y >= this.getGroundY()) {
        this.position.y = this.getGroundY();
        this.enterIdle();
      }
      return;
    }

    if (
      this.state === SHIMEJI_STATES.WalkRight ||
      this.state === SHIMEJI_STATES.WalkLeft
    ) {
      const direction = this.state === SHIMEJI_STATES.WalkRight ? 1 : -1;
      const nextX = this.position.x + direction * this.walkSpeed * elapsedSeconds;
      const clampedX = clamp(nextX, 0, this.getMaximumX());
      const reachedEdge = clampedX !== nextX;
      this.position.x = clampedX;

      if (reachedEdge || timestamp >= this.stateEndsAt) {
        this.enterIdle();
      }
      return;
    }

    if (timestamp >= this.stateEndsAt) {
      if (this.state === SHIMEJI_STATES.Working) {
        this.enterIdle();
      } else {
        this.chooseNextAction();
      }
    }
  }

  updateAnimation(elapsedSeconds) {
    const animation = this.animations[this.state];
    if (!animation || animation.frames.length < 2) return;

    this.frameElapsed += elapsedSeconds;
    const frameDuration = 1 / animation.fps;

    if (this.frameElapsed >= frameDuration) {
      this.frameElapsed %= frameDuration;
      this.frameIndex = (this.frameIndex + 1) % animation.frames.length;
      this.renderFrame();
    }
  }

  renderFrame() {
    if (!this.element) return;

    const animation = this.animations[this.state];
    const frame = animation.frames[this.frameIndex] ?? animation.frames[0];
    const x = frame.column * this.displayWidth;
    const y = frame.row * this.displayHeight;
    const backgroundX = x === 0 ? '0px' : `-${x}px`;
    const backgroundY = y === 0 ? '0px' : `-${y}px`;
    this.element.style.backgroundPosition = `${backgroundX} ${backgroundY}`;
  }

  renderPosition() {
    if (!this.element) return;

    this.element.style.transform =
      `translate3d(${this.position.x.toFixed(2)}px, ${this.position.y.toFixed(2)}px, 0) ` +
      `scaleX(${this.facingDirection})`;
  }

  chooseNextAction() {
    if (this.random() < 0.72) {
      const state =
        this.random() < 0.5
          ? SHIMEJI_STATES.WalkLeft
          : SHIMEJI_STATES.WalkRight;
      this.setState(state, randomBetween(this.random, 1800, 4200));
    } else {
      this.setState(
        SHIMEJI_STATES.Working,
        randomBetween(this.random, 1800, 3400)
      );
    }
  }

  enterIdle() {
    this.setState(
      SHIMEJI_STATES.Idle,
      randomBetween(this.random, 900, 2400)
    );
  }

  handleMouseDown(event) {
    if (event.button !== 0 || !this.element) return;

    event.preventDefault();
    const rect = this.element.getBoundingClientRect();
    this.dragOffset.x = event.clientX - rect.left;
    this.dragOffset.y = event.clientY - rect.top;
    this.dragging = true;
    this.element.classList.add('is-dragging');
    this.setState(SHIMEJI_STATES.Dragged);
  }

  handleMouseMove(event) {
    if (!this.dragging) return;

    event.preventDefault();
    const origin = this.getDragOrigin();
    this.position.x = clamp(
      event.clientX - this.dragOffset.x - origin.left,
      0,
      this.getMaximumX()
    );
    this.position.y = clamp(
      event.clientY - this.dragOffset.y - origin.top,
      0,
      this.getMaximumY()
    );
    this.renderPosition();
  }

  handleMouseUp() {
    if (!this.dragging || !this.element) return;

    this.dragging = false;
    this.element.classList.remove('is-dragging');

    if (this.reducedMotion) {
      this.position.y = this.getGroundY();
      this.setState(SHIMEJI_STATES.Idle);
      this.renderPosition();
    } else {
      this.setState(SHIMEJI_STATES.Falling);
    }
  }

  handleResize() {
    this.updateBounds();
    this.position.x = clamp(this.position.x, 0, this.getMaximumX());
    this.position.y = clamp(this.position.y, 0, this.getMaximumY());

    if (!this.dragging) {
      if (this.reducedMotion) {
        this.position.y = this.getGroundY();
      } else if (this.position.y !== this.getGroundY()) {
        this.setState(SHIMEJI_STATES.Falling);
      }
    }

    this.renderPosition();
  }

  handleMotionPreferenceChange(event) {
    this.reducedMotion = event.matches;

    if (this.reducedMotion) {
      if (this.animationFrame !== null) {
        window.cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      this.dragging = false;
      this.element?.classList.remove('is-dragging');
      this.position.y = this.getGroundY();
      this.setState(SHIMEJI_STATES.Idle);
      this.renderPosition();
      return;
    }

    this.lastTimestamp = 0;
    this.setState(
      this.position.y < this.getGroundY()
        ? SHIMEJI_STATES.Falling
        : SHIMEJI_STATES.Idle
    );

    if (this.animationFrame === null) {
      this.animationFrame = window.requestAnimationFrame(this.tick);
    }
  }

  updateBounds() {
    if (this.container) {
      this.bounds.width = this.container.clientWidth;
      this.bounds.height = this.container.clientHeight;
      return;
    }

    this.bounds.width = window.innerWidth;
    this.bounds.height = window.innerHeight;
  }

  /*
    Pointer events report viewport coordinates, but the transform is relative
    to whatever the mascot is positioned against. Uncontained that is the
    viewport, so the offset is zero; inside a container it is the container's
    top-left corner.
  */
  getDragOrigin() {
    if (!this.container) return { left: 0, top: 0 };

    const rect = this.container.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }

  getMaximumX() {
    return Math.max(0, this.bounds.width - this.displayWidth);
  }

  getMaximumY() {
    return Math.max(0, this.bounds.height - this.displayHeight);
  }

  getGroundY() {
    return Math.max(0, this.getMaximumY() - this.groundOffset);
  }
}
