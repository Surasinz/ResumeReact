import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeSystem';

// The light palette starts at white, not black: the output shader fades the
// fluid toward `bgColor` as it calms, so on a light page the ramp has to
// resolve into the paper colour instead of bruising it grey.
export const LIQUID_PALETTE = [
  '#ffffff',
  '#f4fbf2',
  '#dcf1d6',
  '#bfe3b6',
  '#8fc98a',
];

export const DARK_LIQUID_PALETTE = [
  '#000000',
  '#190713',
  '#521034',
  '#a91f68',
  '#ff35a2',
];

const faceVert = `
attribute vec3 position;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main() {
  vec3 pos = position;
  pos.xy *= 1.0 - boundarySpace * 2.0;
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

const mouseVert = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main() {
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const advectionFrag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
varying vec2 uv;
void main() {
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  vec2 vel = texture2D(velocity, uv).xy;
  vec2 uv2 = uv - vel * dt * ratio;
  gl_FragColor = vec4(texture2D(velocity, uv2).xy, 0.0, 0.0);
}
`;

const externalForceFrag = `
precision highp float;
uniform vec2 force;
varying vec2 vUv;
void main() {
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

const divergenceFrag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main() {
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  gl_FragColor = vec4((x1 - x0 + y1 - y0) / (2.0 * dt));
}
`;

const poissonFrag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main() {
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  gl_FragColor = vec4((p0 + p1 + p2 + p3) / 4.0 - div);
}
`;

const pressureFrag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main() {
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 velocityValue = texture2D(velocity, uv).xy;
  vec2 gradient = vec2(p0 - p1, p2 - p3) * 0.5;
  gl_FragColor = vec4(velocityValue - gradient * dt, 0.0, 1.0);
}
`;

const colorFrag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
uniform float uTime;
varying vec2 uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 vel = texture2D(velocity, uv).xy;
  float len = clamp(length(vel) * 2.2, 0.0, 1.0);
  float noiseValue = noise(uv * 5.0 + uTime * 0.12) * 0.04 - 0.02;
  float t = smoothstep(0.0, 1.0, clamp(len + noiseValue, 0.0, 1.0));
  vec3 fluidColor = texture2D(palette, vec2(t, 0.5)).rgb;
  vec3 color = mix(bgColor.rgb, fluidColor, t);
  float alpha = mix(bgColor.a, 1.0, t);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`;

function makePaletteTexture(stops) {
  const data = new Uint8Array(stops.length * 4);
  stops.forEach((stop, index) => {
    const color = new THREE.Color(stop);
    data[index * 4] = Math.round(color.r * 255);
    data[index * 4 + 1] = Math.round(color.g * 255);
    data[index * 4 + 2] = Math.round(color.b * 255);
    data[index * 4 + 3] = 255;
  });
  const texture = new THREE.DataTexture(
    data,
    stops.length,
    1,
    THREE.RGBAFormat
  );
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

class CommonGL {
  constructor() {
    this.width = 1;
    this.height = 1;
    this.time = 0;
    this.renderer = null;
    this.clock = null;
    this.container = null;
  }

  init(container) {
    this.container = container;
    this.resize();
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.domElement.style.cssText =
      'width:100%;height:100%;display:block';
    this.clock = new THREE.Clock();
    this.clock.start();
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.renderer?.setSize(this.width, this.height, false);
  }

  update() {
    if (!this.clock) return;
    this.time += this.clock.getDelta();
  }
}

class MouseGL {
  constructor() {
    this.coords = new THREE.Vector2();
    this.coordsOld = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.isAutoActive = false;
    this.autoIntensity = 2.4;
    this.container = null;
    this.onInteract = null;
    this.timer = null;
    this.move = this.onMove.bind(this);
    this.touch = this.onTouch.bind(this);
    this.leave = () => {};
  }

  init(container) {
    this.container = container;
    window.addEventListener('mousemove', this.move);
    window.addEventListener('touchmove', this.touch, { passive: true });
    window.addEventListener('touchstart', this.touch, { passive: true });
  }

  dispose() {
    window.removeEventListener('mousemove', this.move);
    window.removeEventListener('touchmove', this.touch);
    window.removeEventListener('touchstart', this.touch);
    if (this.timer) window.clearTimeout(this.timer);
  }

  onMove(event) {
    this.setFromClient(event.clientX, event.clientY);
  }

  onTouch(event) {
    if (event.touches.length === 1) {
      this.setFromClient(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  setFromClient(clientX, clientY) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return;
    }
    this.onInteract?.();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    this.coords.set(x * 2 - 1, -(y * 2 - 1));
  }

  setNormalized(x, y) {
    this.coords.set(x, y);
  }

  update() {
    this.diff.subVectors(this.coords, this.coordsOld);
    this.coordsOld.copy(this.coords);
    if (this.isAutoActive) this.diff.multiplyScalar(this.autoIntensity);
  }
}

class ShaderPass {
  constructor(renderer, fragmentShader, uniforms, output = null) {
    this.renderer = renderer;
    this.uniforms = uniforms;
    this.output = output;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.material = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader,
      uniforms,
    });
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
  }

  render(output = this.output) {
    const renderer = this.renderer();
    if (!renderer) return;
    renderer.setRenderTarget(output);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
  }

  dispose() {
    this.material.dispose();
    this.geometry.dispose();
  }
}

class AutoDriver {
  constructor(mouse, getLastInteraction) {
    this.mouse = mouse;
    this.getLastInteraction = getLastInteraction;
    this.current = new THREE.Vector2();
    this.target = new THREE.Vector2();
    this.direction = new THREE.Vector2();
    this.lastTime = performance.now();
    this.pickTarget();
  }

  pickTarget() {
    this.target.set(
      (Math.random() * 2 - 1) * 0.8,
      (Math.random() * 2 - 1) * 0.8
    );
  }

  update() {
    const now = performance.now();
    if (now - this.getLastInteraction() < 1200) {
      this.mouse.isAutoActive = false;
      this.lastTime = now;
      return;
    }
    this.mouse.isAutoActive = true;
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.direction.subVectors(this.target, this.current);
    const distance = this.direction.length();
    if (distance < 0.02) {
      this.pickTarget();
      return;
    }
    this.direction.normalize();
    this.current.addScaledVector(
      this.direction,
      Math.min(0.45 * delta, distance)
    );
    this.mouse.setNormalized(this.current.x, this.current.y);
  }
}

class FluidSimulation {
  constructor(gl, mouse) {
    this.gl = gl;
    this.mouse = mouse;
    this.resolution = 0.4;
    this.mouseForce = 8;
    this.cursorSize = 110;
    this.dt = 0.008;
    this.fboSize = new THREE.Vector2();
    this.cellScale = new THREE.Vector2();
    this.fbos = {};
    this.calculateSize();
    this.createTargets();
    this.createPasses();
  }

  calculateSize() {
    const width = Math.max(1, Math.round(this.resolution * this.gl.width));
    const height = Math.max(1, Math.round(this.resolution * this.gl.height));
    this.fboSize.set(width, height);
    this.cellScale.set(1 / width, 1 / height);
  }

  makeTarget() {
    return new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
  }

  createTargets() {
    ['vel0', 'vel1', 'div', 'p0', 'p1'].forEach((name) => {
      this.fbos[name] = this.makeTarget();
    });
  }

  createPasses() {
    const renderer = () => this.gl.renderer;
    this.advection = new ShaderPass(
      renderer,
      advectionFrag,
      {
        boundarySpace: { value: this.cellScale },
        velocity: { value: this.fbos.vel0.texture },
        dt: { value: this.dt },
        fboSize: { value: this.fboSize },
      },
      this.fbos.vel1
    );

    this.forceScene = new THREE.Scene();
    this.forceCamera = new THREE.Camera();
    this.forceMaterial = new THREE.RawShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: externalForceFrag,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        px: { value: this.cellScale },
        force: { value: new THREE.Vector2() },
        center: { value: new THREE.Vector2() },
        scale: {
          value: new THREE.Vector2(this.cursorSize, this.cursorSize),
        },
      },
    });
    this.forceGeometry = new THREE.PlaneGeometry(1, 1);
    this.forceScene.add(
      new THREE.Mesh(this.forceGeometry, this.forceMaterial)
    );

    this.divergence = new ShaderPass(
      renderer,
      divergenceFrag,
      {
        boundarySpace: { value: this.cellScale },
        velocity: { value: this.fbos.vel1.texture },
        px: { value: this.cellScale },
        dt: { value: this.dt },
      },
      this.fbos.div
    );
    this.poisson = new ShaderPass(
      renderer,
      poissonFrag,
      {
        boundarySpace: { value: this.cellScale },
        pressure: { value: this.fbos.p0.texture },
        divergence: { value: this.fbos.div.texture },
        px: { value: this.cellScale },
      },
      this.fbos.p1
    );
    this.pressure = new ShaderPass(
      renderer,
      pressureFrag,
      {
        boundarySpace: { value: this.cellScale },
        pressure: { value: this.fbos.p0.texture },
        velocity: { value: this.fbos.vel1.texture },
        px: { value: this.cellScale },
        dt: { value: this.dt },
      },
      this.fbos.vel0
    );
  }

  resize() {
    this.calculateSize();
    Object.values(this.fbos).forEach((target) =>
      target.setSize(this.fboSize.x, this.fboSize.y)
    );
  }

  update() {
    const renderer = this.gl.renderer;
    if (!renderer) return;
    this.advection.render();

    const x = this.cellScale.x;
    const y = this.cellScale.y;
    const cursor = Math.max(
      1,
      Math.min(
        this.cursorSize,
        this.fboSize.x / 2 - 1,
        this.fboSize.y / 2 - 1
      )
    );
    const centerX = THREE.MathUtils.clamp(
      this.mouse.coords.x,
      -1 + cursor * x * 2 + x * 2,
      1 - cursor * x * 2 - x * 2
    );
    const centerY = THREE.MathUtils.clamp(
      this.mouse.coords.y,
      -1 + cursor * y * 2 + y * 2,
      1 - cursor * y * 2 - y * 2
    );
    this.forceMaterial.uniforms.force.value.set(
      (this.mouse.diff.x / 2) * this.mouseForce,
      (this.mouse.diff.y / 2) * this.mouseForce
    );
    this.forceMaterial.uniforms.center.value.set(centerX, centerY);
    this.forceMaterial.uniforms.scale.value.set(cursor, cursor);
    renderer.setRenderTarget(this.fbos.vel1);
    renderer.render(this.forceScene, this.forceCamera);
    renderer.setRenderTarget(null);

    this.divergence.render();
    let input = this.fbos.p0;
    let output = this.fbos.p1;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      input = iteration % 2 === 0 ? this.fbos.p0 : this.fbos.p1;
      output = iteration % 2 === 0 ? this.fbos.p1 : this.fbos.p0;
      this.poisson.uniforms.pressure.value = input.texture;
      this.poisson.render(output);
    }
    this.pressure.uniforms.pressure.value = output.texture;
    this.pressure.render();
  }

  dispose() {
    Object.values(this.fbos).forEach((target) => target.dispose());
    this.advection.dispose();
    this.divergence.dispose();
    this.poisson.dispose();
    this.pressure.dispose();
    this.forceMaterial.dispose();
    this.forceGeometry.dispose();
  }
}

export default function PixelLiquidBackground({ enabled }) {
  const mountRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = mountRef.current;
    if (
      !container ||
      !enabled ||
      typeof window.WebGLRenderingContext === 'undefined'
    ) {
      return undefined;
    }

    const gl = new CommonGL();
    try {
      gl.init(container);
    } catch {
      gl.renderer?.dispose();
      return undefined;
    }
    container.prepend(gl.renderer.domElement);

    const mouse = new MouseGL();
    mouse.init(container);
    const isDark = theme === 'dark';
    const palette = makePaletteTexture(
      isDark ? DARK_LIQUID_PALETTE : LIQUID_PALETTE
    );
    const simulation = new FluidSimulation(gl, mouse);
    const outputUniforms = {
      velocity: { value: simulation.fbos.vel0.texture },
      palette: { value: palette },
      // Calm fluid fades to bgColor. Keeping this black on a light page is
      // what turned the idle areas into grey smoke, so it tracks the paper.
      bgColor: {
        value: isDark
          ? new THREE.Vector4(0, 0, 0, 0)
          : new THREE.Vector4(1, 1, 1, 0),
      },
      uTime: { value: 0 },
      boundarySpace: { value: new THREE.Vector2() },
    };
    const outputScene = new THREE.Scene();
    const outputCamera = new THREE.Camera();
    const outputGeometry = new THREE.PlaneGeometry(2, 2);
    const outputMaterial = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: colorFrag,
      transparent: true,
      depthWrite: false,
      uniforms: outputUniforms,
    });
    outputScene.add(
      new THREE.Mesh(outputGeometry, outputMaterial)
    );

    let lastInteraction = performance.now();
    mouse.onInteract = () => {
      lastInteraction = performance.now();
    };
    const driver = new AutoDriver(mouse, () => lastInteraction);
    const handleResize = () => {
      gl.resize();
      simulation.resize();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animationFrame = 0;
    let running = !document.hidden;
    const loop = () => {
      if (!running) return;
      animationFrame = window.requestAnimationFrame(loop);
      driver.update();
      mouse.update();
      gl.update();
      outputUniforms.uTime.value = gl.time;
      simulation.update();
      gl.renderer.setRenderTarget(null);
      gl.renderer.render(outputScene, outputCamera);
    };
    if (running) loop();

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(animationFrame);
      } else if (!running) {
        running = true;
        loop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      mouse.dispose();
      simulation.dispose();
      palette.dispose();
      outputMaterial.dispose();
      outputGeometry.dispose();
      const canvas = gl.renderer?.domElement;
      gl.renderer?.dispose();
      canvas?.remove();
    };
  }, [enabled, theme]);

  return (
    <div
      ref={mountRef}
      className={`pixel-liquid-background${enabled ? ' is-enabled' : ''}`}
      aria-hidden="true"
    />
  );
}
