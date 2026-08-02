import { act, render } from '@testing-library/react';
import * as THREE from 'three';
import PixelLiquidBackground, {
  DARK_LIQUID_PALETTE,
  LIQUID_PALETTE,
} from './PixelLiquidBackground';
import { THEME_STORAGE_KEY, ThemeProvider } from './ThemeSystem';

jest.mock('three', () => {
  const state = {
    throwRenderer: false,
    renderers: [],
    targets: [],
    textures: [],
    materials: [],
    geometries: [],
  };

  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    subVectors(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      return this;
    }
    copy(value) {
      this.x = value.x;
      this.y = value.y;
      return this;
    }
    multiplyScalar(value) {
      this.x *= value;
      this.y *= value;
      return this;
    }
    length() {
      return Math.hypot(this.x, this.y);
    }
    normalize() {
      const length = this.length() || 1;
      this.x /= length;
      this.y /= length;
      return this;
    }
    addScaledVector(value, scale) {
      this.x += value.x * scale;
      this.y += value.y * scale;
      return this;
    }
  }

  class Disposable {
    constructor(collection) {
      this.dispose = jest.fn();
      collection.push(this);
    }
  }

  class DataTexture extends Disposable {
    constructor(data) {
      super(state.textures);
      this.image = { data };
    }
  }

  class WebGLRenderTarget extends Disposable {
    constructor(width, height) {
      super(state.targets);
      this.width = width;
      this.height = height;
      this.texture = {};
      this.setSize = jest.fn((nextWidth, nextHeight) => {
        this.width = nextWidth;
        this.height = nextHeight;
      });
    }
  }

  class RawShaderMaterial extends Disposable {
    constructor(options) {
      super(state.materials);
      this.uniforms = options.uniforms;
      this.fragmentShader = options.fragmentShader;
    }
  }

  class PlaneGeometry extends Disposable {
    constructor() {
      super(state.geometries);
    }
  }

  class WebGLRenderer {
    constructor(options) {
      if (state.throwRenderer) throw new Error('WebGL unavailable');
      this.options = options;
      this.domElement = globalThis.document.createElement('canvas');
      this.setClearColor = jest.fn();
      this.setPixelRatio = jest.fn();
      this.setSize = jest.fn();
      this.setRenderTarget = jest.fn();
      this.render = jest.fn();
      this.dispose = jest.fn();
      state.renderers.push(this);
    }
  }

  return {
    __mockState: state,
    AdditiveBlending: 1,
    Camera: class {},
    ClampToEdgeWrapping: 1,
    Clock: class {
      start() {}
      getDelta() {
        return 0.016;
      }
    },
    Color: class {
      constructor(hex) {
        const value = Number.parseInt(hex.slice(1), 16);
        this.r = ((value >> 16) & 255) / 255;
        this.g = ((value >> 8) & 255) / 255;
        this.b = (value & 255) / 255;
      }
    },
    DataTexture,
    HalfFloatType: 1,
    LinearFilter: 1,
    MathUtils: {
      clamp: (value, minimum, maximum) =>
        Math.min(Math.max(value, minimum), maximum),
    },
    Mesh: class {
      constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
      }
    },
    NearestFilter: 1,
    PlaneGeometry,
    RGBAFormat: 1,
    RawShaderMaterial,
    RepeatWrapping: 1,
    Scene: class {
      constructor() {
        this.add = jest.fn();
      }
    },
    Vector2,
    Vector4: class {
      constructor(x = 0, y = 0, z = 0, w = 0) {
        Object.assign(this, { x, y, z, w });
      }
    },
    WebGLRenderer,
    WebGLRenderTarget,
  };
});

beforeEach(() => {
  Object.assign(THREE.__mockState, {
    throwRenderer: false,
    renderers: [],
    targets: [],
    textures: [],
    materials: [],
    geometries: [],
  });
  Object.defineProperty(window, 'WebGLRenderingContext', {
    configurable: true,
    value: function WebGLRenderingContext() {},
  });
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  });
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observe = jest.fn();
      this.disconnect = jest.fn();
    }
  };
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(17);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
  delete global.ResizeObserver;
});

test('runs the supplied WebGL pipeline and disposes every GPU resource', () => {
  const removeWindowListener = jest.spyOn(window, 'removeEventListener');
  const removeDocumentListener = jest.spyOn(document, 'removeEventListener');
  const { container, unmount } = render(
    <PixelLiquidBackground enabled />
  );
  const state = THREE.__mockState;
  const renderer = state.renderers[0];

  // The light ramp resolves into white so calm fluid disappears into the
  // page rather than greying it; only the dark ramp bottoms out at black.
  expect(LIQUID_PALETTE.at(0)).toBe('#ffffff');
  expect(LIQUID_PALETTE.at(-1)).toBe('#46ad2c');
  expect(DARK_LIQUID_PALETTE.at(0)).toBe('#000000');
  expect(DARK_LIQUID_PALETTE.at(-1)).toBe('#ff35a2');
  expect(container.querySelector('.pixel-liquid-background canvas')).toBeInTheDocument();
  expect(renderer.options).toEqual({ antialias: false, alpha: true });
  const outputMaterial = state.materials.find((material) =>
    material.fragmentShader.includes('fluidColor')
  );
  expect(outputMaterial.fragmentShader).toContain('texture2D(velocity, uv)');
  expect(outputMaterial.fragmentShader).not.toContain('pixelGrid');
  expect(outputMaterial.fragmentShader).not.toContain('uBayer');
  expect(renderer.render).toHaveBeenCalledTimes(13);
  expect(state.targets).toHaveLength(5);

  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(17);

  unmount();
  expect(removeWindowListener).toHaveBeenCalledWith(
    'mousemove',
    expect.any(Function)
  );
  expect(removeDocumentListener).toHaveBeenCalledWith(
    'visibilitychange',
    expect.any(Function)
  );
  expect(state.targets.every((target) => target.dispose.mock.calls.length === 1)).toBe(
    true
  );
  expect(state.textures.every((texture) => texture.dispose.mock.calls.length === 1)).toBe(
    true
  );
  expect(state.materials.every((material) => material.dispose.mock.calls.length === 1)).toBe(
    true
  );
  expect(state.geometries.every((geometry) => geometry.dispose.mock.calls.length === 1)).toBe(
    true
  );
  expect(renderer.dispose).toHaveBeenCalledTimes(1);
});

test('degrades to the Matrix layer when WebGL renderer creation fails', () => {
  THREE.__mockState.throwRenderer = true;

  const { container } = render(
    <PixelLiquidBackground enabled />
  );

  expect(container.querySelector('.pixel-liquid-background')).toBeInTheDocument();
  expect(container.querySelector('canvas')).not.toBeInTheDocument();
});

test('builds the WebGL palette with the dark pink accent', () => {
  window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

  render(
    <ThemeProvider>
      <PixelLiquidBackground enabled />
    </ThemeProvider>
  );

  const paletteData = THREE.__mockState.textures[0].image.data;
  expect(Array.from(paletteData.slice(-4))).toEqual([255, 53, 162, 255]);
});

test('fades calm fluid toward the active theme paper, not always black', () => {
  const readBgColor = () => {
    const outputMaterial = THREE.__mockState.materials.find((material) =>
      material.fragmentShader.includes('fluidColor')
    );
    const { x, y, z, w } = outputMaterial.uniforms.bgColor.value;
    return [x, y, z, w];
  };

  const light = render(
    <ThemeProvider>
      <PixelLiquidBackground enabled />
    </ThemeProvider>
  );
  // White, so idle areas resolve into the page instead of bruising it grey.
  expect(readBgColor()).toEqual([1, 1, 1, 0]);
  light.unmount();

  window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  Object.assign(THREE.__mockState, { materials: [] });

  render(
    <ThemeProvider>
      <PixelLiquidBackground enabled />
    </ThemeProvider>
  );
  expect(readBgColor()).toEqual([0, 0, 0, 0]);
});

test('does not start GPU passes until a hidden tab becomes visible', () => {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  });

  render(<PixelLiquidBackground enabled />);
  const renderer = THREE.__mockState.renderers[0];

  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  expect(renderer.render).not.toHaveBeenCalled();

  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  });
  act(() => document.dispatchEvent(new Event('visibilitychange')));

  expect(window.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
  expect(renderer.render).toHaveBeenCalledTimes(13);
});
