import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ToppingKind } from './flavors';

/**
 * Every topping is built procedurally and normalised to roughly 1 world-unit
 * across, centred at the origin. The returned outer group can be freely
 * rotated / scaled by the engine.
 */

const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

function wrap(inner: THREE.Object3D, offsetY = 0): THREE.Group {
  const outer = new THREE.Group();
  inner.position.y = offsetY;
  outer.add(inner);
  return outer;
}

function cherry(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 48, 32),
    phys({
      color: '#c10f2b',
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      sheen: 0.4,
      sheenColor: new THREE.Color('#ff7b8f'),
    })
  );
  body.scale.set(1, 0.9, 1);
  g.add(body);

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.04, 0.78, 0),
    new THREE.Vector3(0.3, 1.02, 0.05)
  );
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.03, 8, false),
    std({ color: '#5d4022', roughness: 0.7 })
  );
  g.add(stem);
  return wrap(g, -0.3);
}

function strawberry(): THREE.Group {
  const g = new THREE.Group();
  const radius = (t: number) => 0.46 * Math.pow(Math.sin(t * Math.PI * 0.55), 0.9);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector2(Math.max(radius(t), 0.001), -0.55 + t * 1.05));
  }
  pts.push(new THREE.Vector2(0.36, 0.53), new THREE.Vector2(0.18, 0.56), new THREE.Vector2(0.001, 0.57));
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 48),
    phys({ color: '#e2263f', roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2 })
  );
  g.add(body);

  // seeds
  const seedCount = 70;
  const seeds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.02, 6, 6),
    std({ color: '#ffd76a', roughness: 0.4 }),
    seedCount
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < seedCount; i++) {
    const t = 0.08 + Math.random() * 0.86;
    const a = Math.random() * Math.PI * 2;
    const r = radius(t) + 0.004;
    m.makeScale(1, 1.6, 1);
    m.setPosition(Math.cos(a) * r, -0.55 + t * 1.05, Math.sin(a) * r);
    seeds.setMatrixAt(i, m);
  }
  g.add(seeds);

  // leafy crown
  const leafMat = std({ color: '#3f9b3c', roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), leafMat);
    leaf.scale.set(1, 1, 0.25);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.17, 0.56, Math.sin(a) * 0.17);
    leaf.rotation.y = -a;
    leaf.rotation.z = -(Math.PI / 2 + 0.25);
    g.add(leaf);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8), leafMat);
  stem.position.y = 0.65;
  g.add(stem);
  return wrap(g, -0.05);
}

function blueberry(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 48, 32),
    phys({
      color: '#343a86',
      roughness: 0.42,
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#aab6ff'),
      clearcoat: 0.25,
    })
  );
  body.scale.set(1, 0.86, 1);
  g.add(body);

  const crownMat = std({ color: '#1b1739', roughness: 0.8 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.032, 8, 20), crownMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.355;
  g.add(ring);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 5), crownMat);
    tip.position.set(Math.cos(a) * 0.09, 0.39, Math.sin(a) * 0.09);
    tip.rotation.z = Math.cos(a) * -0.5;
    tip.rotation.x = Math.sin(a) * 0.5;
    g.add(tip);
  }
  return wrap(g, 0);
}

function chocolate(): THREE.Group {
  const g = new THREE.Group();
  const mat = phys({ color: '#4a2616', roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const block = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.3, 0.72, 4, 0.07), mat);
  g.add(block);
  // raised squares
  for (let x = -1; x <= 1; x += 2) {
    for (let z = -1; z <= 1; z += 2) {
      const sq = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.08, 0.28, 2, 0.03), mat);
      sq.position.set(x * 0.17, 0.17, z * 0.17);
      g.add(sq);
    }
  }
  return wrap(g, -0.04);
}

function pistachio(): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 40, 28, 0, Math.PI * 1.2),
    std({ color: '#e7d2a4', roughness: 0.62, side: THREE.DoubleSide })
  );
  shell.scale.set(1, 1.3, 0.85);
  shell.rotation.y = Math.PI * 0.9;
  g.add(shell);

  const kernel = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 40, 28),
    phys({ color: '#8fc044', roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#d6ff9a') })
  );
  kernel.scale.set(1, 1.25, 0.8);
  kernel.position.z = 0.04;
  g.add(kernel);

  // purple skin patch, typical of Persian pistachios
  const skin = new THREE.Mesh(
    new THREE.SphereGeometry(0.345, 32, 16, 0, Math.PI * 0.7, 0, Math.PI * 0.45),
    std({ color: '#7d3a5c', roughness: 0.55 })
  );
  skin.scale.copy(kernel.scale);
  skin.position.copy(kernel.position);
  skin.rotation.y = -0.4;
  g.add(skin);
  g.rotation.z = 0.5;
  return wrap(g, 0);
}

function mint(): THREE.Group {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.4, -0.3, 0.36, 0.28, 0, 0.56);
  shape.bezierCurveTo(-0.36, 0.28, -0.4, -0.3, 0, -0.5);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 28,
  });
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) + x * x * 0.7 - y * y * 0.12);
  }
  geo.computeVertexNormals();
  const leaf = new THREE.Mesh(
    geo,
    phys({ color: '#2fa45a', roughness: 0.4, clearcoat: 0.4, side: THREE.DoubleSide })
  );
  const g = new THREE.Group();
  g.add(leaf);
  const vein = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.95, 6),
    std({ color: '#8fdc9c', roughness: 0.5 })
  );
  vein.position.set(0, 0.02, 0.035);
  g.add(vein);
  return wrap(g, -0.03);
}

export function createTopping(kind: ToppingKind): THREE.Group {
  switch (kind) {
    case 'cherry':
      return cherry();
    case 'strawberry':
      return strawberry();
    case 'blueberry':
      return blueberry();
    case 'chocolate':
      return chocolate();
    case 'pistachio':
      return pistachio();
    case 'mint':
    default:
      return mint();
  }
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
  });
}
