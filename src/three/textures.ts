import * as THREE from 'three';

/* ---------- Compact 3D Perlin noise (deterministic) ---------- */
const perm = new Uint8Array(512);
(() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 1337;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + t * (b - a);
function grad(h: number, x: number, y: number, z: number) {
  const hh = h & 15;
  const u = hh < 8 ? x : y;
  const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
  return ((hh & 1) ? -u : u) + ((hh & 2) ? -v : v);
}

export function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
      lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
      lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
}

/* ---------- Canvas textures ---------- */
function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return { c, ctx: c.getContext('2d')! };
}

/** Tileable diagonal waffle-cone pattern */
export function waffleTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, ctx } = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#e2ad68');
  g.addColorStop(1, '#d39a52');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const spacing = 64;
  const drawLines = (color: string, width: number, offset: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (let i = -size; i <= size * 2; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(i + offset, 0);
      ctx.lineTo(i + offset + size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + offset, size);
      ctx.lineTo(i + offset + size, 0);
      ctx.stroke();
    }
  };
  drawLines('rgba(120,60,20,0.85)', 11, 0);
  drawLines('rgba(255,225,170,0.45)', 3, 6);

  // toasted speckles
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(110,55,15,${Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Spiral stripes for the rolled wafer stick */
export function stripeTexture(): THREE.CanvasTexture {
  const size = 128;
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#f3dcb0';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#8a4b22';
  ctx.lineWidth = 16;
  for (let i = -size; i <= size * 2; i += 42) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
