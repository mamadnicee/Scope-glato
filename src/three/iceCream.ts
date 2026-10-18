import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Flavor } from './flavors';
import { noise3, stripeTexture, waffleTexture } from './textures';
import { createTopping, disposeObject } from './toppings';

/** Lumpy hand-scooped ball with a frilly "scooper lip" and flattened base */
function scoopGeometry(seed: number): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry = new THREE.SphereGeometry(1, 128, 96);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo);
  const pos = geo.attributes.position;
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const theta = Math.atan2(n.z, n.x);
    let r =
      1 +
      0.06 * noise3(n.x * 2.2 + seed, n.y * 2.2, n.z * 2.2) +
      0.025 * noise3(n.x * 6 + seed, n.y * 6, n.z * 6 - seed);
    const lip = Math.exp(-Math.pow((n.y + 0.42) / 0.12, 2));
    r += lip * (0.1 + 0.05 * Math.sin(theta * 11 + seed) + 0.04 * noise3(n.x * 5, n.y * 5 + seed, n.z * 5));
    n.multiplyScalar(r);
    if (n.y < -0.5) n.y = -0.5 + (n.y + 0.5) * 0.2;
    pos.setXYZ(i, n.x, n.y, n.z);
  }
  geo.computeVertexNormals();
  return geo;
}

const sheenOf = (color: string) => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35);

const scoopMaterial = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.5,
    sheen: 0.35,
    sheenRoughness: 0.7,
    sheenColor: sheenOf(color),
  });

const SPRINKLE_COLORS = ['#ffffff', '#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#ff9f1c'];

export class IceCream {
  /** Rotate this group for spin / tilt */
  readonly group = new THREE.Group();
  private topMat: THREE.MeshPhysicalMaterial;
  private bottomMat: THREE.MeshPhysicalMaterial;
  private sprinkles: THREE.InstancedMesh;
  private nuts: THREE.InstancedMesh;
  private toppers: Record<Flavor['topper'], THREE.Group>;

  constructor(flavor: Flavor) {
    const inner = new THREE.Group();
    inner.position.y = -0.22;
    this.group.add(inner);

    /* ---- Waffle cone ---- */
    const waffle = waffleTexture();
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 2.7, 64, 1, true),
      new THREE.MeshStandardMaterial({
        map: waffle,
        bumpMap: waffle,
        bumpScale: 2.5,
        roughness: 0.75,
        side: THREE.DoubleSide,
      })
    );
    cone.rotation.x = Math.PI;
    cone.position.y = -1.35;
    inner.add(cone);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.1, 16, 96),
      new THREE.MeshStandardMaterial({ color: '#c0813f', roughness: 0.6 })
    );
    rim.rotation.x = Math.PI / 2;
    inner.add(rim);

    /* ---- Scoops ---- */
    this.bottomMat = scoopMaterial(flavor.scoops[1]);
    this.topMat = scoopMaterial(flavor.scoops[0]);

    const bottom = new THREE.Mesh(scoopGeometry(3.1), this.bottomMat);
    bottom.scale.setScalar(1.08);
    bottom.position.y = 0.52;
    inner.add(bottom);

    const top = new THREE.Mesh(scoopGeometry(7.7), this.topMat);
    top.scale.setScalar(0.9);
    top.position.y = 1.5;
    top.rotation.y = 1.2;
    inner.add(top);

    /* ---- Melting drips over the cone ---- */
    const drips = [
      [0.2, 0.42, 0.1], [1.1, 0.22, 0.08], [1.9, 0.55, 0.11], [2.7, 0.3, 0.085],
      [3.4, 0.62, 0.1], [4.2, 0.2, 0.075], [4.9, 0.45, 0.095], [5.7, 0.28, 0.09],
    ];
    drips.forEach(([a, len, rad]) => {
      const drip = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 8, 16), this.bottomMat);
      const cy = -len / 2 + 0.02;
      const coneR = 0.95 * (1 + cy / 2.7);
      const r = coneR + rad * 0.55;
      drip.position.set(Math.cos(a) * r, cy, Math.sin(a) * r);
      inner.add(drip);
    });
    const meltRing = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.11, 16, 96), this.bottomMat);
    meltRing.rotation.x = Math.PI / 2;
    meltRing.position.y = 0.06;
    inner.add(meltRing);

    /* ---- Rolled wafer stick ---- */
    const wafer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 1.5, 28),
      new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.55 })
    );
    wafer.position.set(0.52, 2.15, -0.2);
    wafer.rotation.set(0.25, 0, -0.55);
    inner.add(wafer);

    /* ---- Sprinkles & chopped nuts on the top scoop ---- */
    const topCenter = new THREE.Vector3(0, 1.5, 0);
    const surface = (dir: THREE.Vector3) => topCenter.clone().add(dir.clone().multiplyScalar(0.9 * 1.04));
    const randomDir = () => {
      const d = new THREE.Vector3();
      do {
        d.set(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1);
      } while (d.lengthSq() > 1 || d.lengthSq() < 0.01);
      d.normalize();
      if (d.y < 0.2) d.y = 0.2 + Math.random() * 0.3;
      return d.normalize();
    };

    const sprinkleCount = 80;
    this.sprinkles = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.022, 0.09, 4, 8),
      new THREE.MeshStandardMaterial({ roughness: 0.35 }),
      sprinkleCount
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const color = new THREE.Color();
    for (let i = 0; i < sprinkleCount; i++) {
      const d = randomDir();
      const tangent = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .cross(d)
        .normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      m.compose(surface(d), q, new THREE.Vector3(1, 1, 1));
      this.sprinkles.setMatrixAt(i, m);
      this.sprinkles.setColorAt(i, color.set(SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]));
    }
    inner.add(this.sprinkles);

    const nutCount = 60;
    this.nuts = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.055, 0),
      new THREE.MeshStandardMaterial({ roughness: 0.5, flatShading: true }),
      nutCount
    );
    for (let i = 0; i < nutCount; i++) {
      const d = randomDir();
      q.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      const s = 0.7 + Math.random() * 0.8;
      m.compose(surface(d), q, new THREE.Vector3(s, s * 0.7, s));
      this.nuts.setMatrixAt(i, m);
      this.nuts.setColorAt(i, color.set(i % 3 === 0 ? '#7d3a5c' : i % 3 === 1 ? '#a6cf55' : '#d8ec9a'));
    }
    inner.add(this.nuts);

    /* ---- Toppers (one visible per flavour) ---- */
    const cherryTop = new THREE.Group();
    const c = createTopping('cherry');
    c.scale.setScalar(0.62);
    c.position.set(-0.05, 2.72, 0.05);
    c.rotation.z = 0.15;
    cherryTop.add(c);

    const berryTop = new THREE.Group();
    [
      [-0.2, 2.5, 0.15, 0.45],
      [0.18, 2.52, 0.05, 0.42],
      [0, 2.62, -0.2, 0.4],
      [0.05, 2.82, 0.02, 0.38],
    ].forEach(([x, y, z, s]) => {
      const b = createTopping('blueberry');
      b.scale.setScalar(s);
      b.position.set(x, y, z);
      b.rotation.set(Math.random(), Math.random() * 3, Math.random());
      berryTop.add(b);
    });

    const pistachioTop = new THREE.Group();
    const leafA = createTopping('mint');
    leafA.scale.setScalar(0.6);
    leafA.position.set(-0.18, 2.62, 0.05);
    leafA.rotation.set(-0.3, 0.4, 0.55);
    const leafB = createTopping('mint');
    leafB.scale.setScalar(0.5);
    leafB.position.set(0.15, 2.6, -0.05);
    leafB.rotation.set(-0.2, -0.6, -0.6);
    const nut = createTopping('pistachio');
    nut.scale.setScalar(0.5);
    nut.position.set(0, 2.55, 0.25);
    pistachioTop.add(leafA, leafB, nut);

    this.toppers = { cherry: cherryTop, blueberries: berryTop, pistachio: pistachioTop };
    inner.add(cherryTop, berryTop, pistachioTop);

    this.setFlavor(flavor);
  }

  setFlavor(f: Flavor) {
    this.topMat.color.set(f.scoops[0]);
    this.topMat.sheenColor.copy(sheenOf(f.scoops[0]));
    this.bottomMat.color.set(f.scoops[1]);
    this.bottomMat.sheenColor.copy(sheenOf(f.scoops[1]));
    this.sprinkles.visible = f.decor === 'sprinkles';
    this.nuts.visible = f.decor === 'nuts';
    (Object.keys(this.toppers) as Flavor['topper'][]).forEach((k) => {
      this.toppers[k].visible = k === f.topper;
    });
  }

  dispose() {
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
      }
    });
    disposeObject(this.group);
  }
}
