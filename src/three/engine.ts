import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FLAVORS, type Flavor } from './flavors';
import { IceCream } from './iceCream';
import { createTopping, disposeObject } from './toppings';

type Layer = 'front' | 'back' | 'leaf';
interface Anchor {
  top: number;
  left: number;
  size: number;
  opacity?: number;
}

interface Item {
  layer: Layer;
  anchor: Anchor;
  index: number;
  holder: THREE.Group;
  model: THREE.Group;
  tumbleAxis: THREE.Vector3;
  rx: number;
  ry: number;
  angle: number;
  baseX: number;
  baseY: number;
  anim: { x: number; y: number; rotation: number; scale: number; opacity: number };
  opacityApplied: number;
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  hemi: THREE.HemisphereLight;
  fill: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  pmrem: THREE.PMREMGenerator;
}

/* Same anchors as the original b1..b9 / l1..l4 */
const FRONT: Anchor[] = [
  { top: 25, left: 30, size: 220 },
  { top: 60, left: 42, size: 100 },
  { top: 30, left: 62, size: 250 },
  { top: 15, left: 48, size: 140 },
  { top: 75, left: 20, size: 120 },
  { top: 45, left: 75, size: 180 },
];
const BACK: Anchor[] = [
  { top: 15, left: 40, size: 80, opacity: 0.7 },
  { top: 50, left: 55, size: 70, opacity: 0.6 },
  { top: 80, left: 35, size: 75, opacity: 0.7 },
];
const LEAVES: Anchor[] = [
  { top: 10, left: 15, size: 60 },
  { top: 40, left: 80, size: 140, opacity: 0.4 },
  { top: 70, left: 75, size: 80 },
  { top: 85, left: 20, size: 120, opacity: 0.3 },
];
const FLOAT_DURS = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];
const CAM_Z = 16;
const FOV = 30;
const deg = THREE.MathUtils.degToRad;

function makeStage(canvas: HTMLCanvasElement | null, maxDpr: number, f: Flavor): Stage {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas ?? undefined,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: !canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const hemi = new THREE.HemisphereLight('#ffffff', f.bg.inner, 0.45);
  const key = new THREE.DirectionalLight('#ffffff', 1.9);
  key.position.set(-4, 6, 7);
  const fill = new THREE.DirectionalLight(f.accent, 0.9);
  fill.position.set(5, 0, 4);
  const rim = new THREE.DirectionalLight(f.scoops[0], 2.2);
  rim.position.set(0, 3, -6);
  scene.add(hemi, key, fill, rim);

  return { renderer, scene, hemi, fill, rim, pmrem };
}

function tintStage(s: Stage, f: Flavor) {
  s.hemi.groundColor.set(f.bg.inner);
  s.fill.color.set(f.accent);
  s.rim.color.set(f.scoops[0]);
}

export class Engine {
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  private stages: { back: Stage; hero: Stage; front: Stage };
  private ice: IceCream;
  private tilt = new THREE.Group();
  private items: Item[] = [];
  private mouse = { x: 0, y: 0, px: -9999, py: -9999 };
  private cur = { x: 0, y: 0 };
  private switchSpin = 0;
  private W = 1;
  private H = 1;
  private wpp = 0.01;
  private mobile = false;
  private raf = 0;
  private heroCanvas: HTMLCanvasElement;
  isSwitching = false;
  flavorIndex: number;

  constructor(
    canvases: { back: HTMLCanvasElement; hero: HTMLCanvasElement; front: HTMLCanvasElement },
    flavorIndex = 0
  ) {
    this.flavorIndex = flavorIndex;
    const f = FLAVORS[flavorIndex];
    this.heroCanvas = canvases.hero;
    this.stages = {
      back: makeStage(canvases.back, 1.5, f),
      hero: makeStage(canvases.hero, 2, f),
      front: makeStage(canvases.front, 1.5, f),
    };

    this.ice = new IceCream(f);
    this.tilt.add(this.ice.group);
    this.stages.hero.scene.add(this.tilt);

    LEAVES.forEach((a, i) => this.addItem('leaf', a, i, 'mint'));
    FRONT.forEach((a, i) => this.addItem('front', a, i, f.toppings[i % f.toppings.length]));
    BACK.forEach((a, i) =>
      this.addItem('back', a, FRONT.length + i, f.toppings[(FRONT.length + i) % f.toppings.length])
    );

    this.camera.position.set(0, 0, CAM_Z);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer);
    window.addEventListener('touchmove', this.onTouch, { passive: true });
    this.loop();
  }

  /* ---------------- items ---------------- */
  private addItem(layer: Layer, anchor: Anchor, index: number, kind: Flavor['toppings'][number]) {
    const holder = new THREE.Group();
    const model = createTopping(kind);
    model.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    holder.add(model);
    const stage = layer === 'front' ? this.stages.front : this.stages.back;
    stage.scene.add(holder);
    const item: Item = {
      layer,
      anchor,
      index,
      holder,
      model,
      tumbleAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      rx: 0,
      ry: 0,
      angle: Math.random() * 360,
      baseX: 0,
      baseY: 0,
      anim: { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      opacityApplied: -1,
    };
    this.applyOpacity(item, anchor.opacity ?? 1);
    this.items.push(item);
  }

  private applyOpacity(item: Item, o: number) {
    if (Math.abs(o - item.opacityApplied) < 0.01) return;
    item.opacityApplied = o;
    item.model.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.Material;
        const transparent = o < 0.999;
        if (m.transparent !== transparent) m.needsUpdate = true;
        m.transparent = transparent;
        m.opacity = o;
        m.depthWrite = !transparent;
      }
    });
  }

  private swapModel(item: Item, kind: Flavor['toppings'][number]) {
    item.holder.remove(item.model);
    disposeObject(item.model);
    item.model = createTopping(kind);
    item.model.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    item.holder.add(item.model);
    item.opacityApplied = -1;
  }

  /* ---------------- input / resize ---------------- */
  private onPointer = (e: PointerEvent) => {
    this.mouse.x = e.clientX / window.innerWidth - 0.5;
    this.mouse.y = e.clientY / window.innerHeight - 0.5;
    this.mouse.px = e.clientX;
    this.mouse.py = e.clientY;
  };

  private onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    this.mouse.x = t.clientX / window.innerWidth - 0.5;
    this.mouse.y = t.clientY / window.innerHeight - 0.5;
    this.mouse.px = t.clientX;
    this.mouse.py = t.clientY;
  };

  private resize = () => {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.mobile = this.W < 900;
    this.camera.aspect = this.W / this.H;
    this.camera.updateProjectionMatrix();
    const visibleH = 2 * Math.tan(deg(FOV / 2)) * CAM_Z;
    this.wpp = visibleH / this.H;
    Object.values(this.stages).forEach((s) => s.renderer.setSize(this.W, this.H));
    const s = this.mobile ? Math.min(0.66, (visibleH * this.camera.aspect) / 3.6) : 1;
    this.tilt.scale.setScalar(s);
  };

  private sizeOf(a: Anchor) {
    return a.size * (this.mobile ? 0.42 : 1);
  }

  private anchorCenter(a: Anchor) {
    const s = this.sizeOf(a);
    return { x: (a.left / 100) * this.W + s / 2, y: (a.top / 100) * this.H + s / 2, s };
  }

  /* ---------------- main loop ---------------- */
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const time = performance.now() * 0.001;
    const { cur, mouse } = this;

    cur.x += (mouse.x - cur.x) * 0.05;
    cur.y += (mouse.y - cur.y) * 0.05;

    // Ice cream: tilt toward cursor + switch spin + 6s float (±20px)
    this.ice.group.rotation.y = deg(cur.x * 40 + this.switchSpin);
    this.ice.group.rotation.x = deg(cur.y * 20);
    this.tilt.rotation.z = deg(-12);
    this.tilt.position.y = Math.sin((time * Math.PI * 2) / 6) * 20 * this.wpp;

    const parallax: Record<Layer, number> = { front: 60, back: -30, leaf: -15 };

    for (const item of this.items) {
      const { x: ax, y: ay, s } = this.anchorCenter(item.anchor);
      const plx = cur.x * parallax[item.layer];
      const ply = cur.y * parallax[item.layer];
      let ox = 0;
      let oy = 0;
      let rot = 0;
      let scale = 1;
      let opacity = item.anchor.opacity ?? 1;

      if (item.layer === 'leaf') {
        const i = item.index;
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * ((Math.PI * 2) / dur);
        oy = Math.sin(phase) * 20;
        ox = Math.cos(phase * 0.5) * 15;
        rot = Math.sin(phase * 0.3) * 15;
        item.model.rotateOnAxis(item.tumbleAxis, 0.003);
      } else if (!this.isSwitching) {
        const i = item.index;
        const dur = FLOAT_DURS[i % 9];
        const phase = (time + i * 0.7) * ((Math.PI * 2) / dur);
        const floatY = Math.sin(phase) * 15;
        const floatAngle = Math.cos(phase) * 6;

        const bx = ax + plx + item.rx + item.baseX;
        const by = ay + ply + item.ry + item.baseY + floatY;
        const dx = mouse.px - bx;
        const dy = mouse.py - by;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let tRx = 0;
        let tRy = 0;
        let speedMult = 1;
        if (dist < 400) {
          const force = (400 - dist) / 400;
          tRx = (dx / dist) * force * -80;
          tRy = (dy / dist) * force * -80;
          speedMult = 1 + force * 5;
        }
        item.rx += (tRx - item.rx) * 0.1;
        item.ry += (tRy - item.ry) * 0.1;
        item.angle += 0.2 * speedMult;

        ox = item.rx + item.baseX;
        oy = item.ry + item.baseY + floatY;
        rot = item.angle + floatAngle;
        item.model.rotateOnAxis(item.tumbleAxis, 0.004 * speedMult);
      } else {
        ox = item.anim.x;
        oy = item.anim.y;
        rot = item.anim.rotation;
        scale = item.anim.scale;
        opacity *= item.anim.opacity;
      }

      item.holder.position.set(
        (ax + plx + ox - this.W / 2) * this.wpp,
        -(ay + ply + oy - this.H / 2) * this.wpp,
        0
      );
      item.holder.rotation.z = -deg(rot);
      item.holder.scale.setScalar(Math.max(0.0001, s * this.wpp * 0.82 * scale));
      this.applyOpacity(item, opacity);
    }

    const { back, hero, front } = this.stages;
    back.renderer.render(back.scene, this.camera);
    hero.renderer.render(hero.scene, this.camera);
    front.renderer.render(front.scene, this.camera);
  };

  /* ---------------- flavour switch ---------------- */
  switchFlavor(next: number): boolean {
    if (this.isSwitching || next === this.flavorIndex) return false;
    this.isSwitching = true;
    this.flavorIndex = next;
    const f = FLAVORS[next];

    // 1. Ice cream spin 0→360 (blur up) → swap at peak → 360→720 (blur down)
    const spin = { val: 0, blur: 0 };
    gsap.to(spin, {
      val: 360,
      blur: 15,
      duration: 0.6,
      ease: 'power2.in',
      onUpdate: () => {
        this.switchSpin = spin.val;
        this.heroCanvas.style.filter = `blur(${spin.blur}px)`;
      },
      onComplete: () => {
        this.ice.setFlavor(f);
        Object.values(this.stages).forEach((s) => tintStage(s, f));
        gsap.to(spin, {
          val: 720,
          blur: 0,
          duration: 1.5,
          ease: 'back.out(0.7)',
          onUpdate: () => {
            this.switchSpin = spin.val;
            this.heroCanvas.style.filter = `blur(${spin.blur}px)`;
          },
          onComplete: () => {
            this.switchSpin = 0;
            this.heroCanvas.style.filter = 'none';
          },
        });
      },
    });

    // 2. Toppings implode → swap model → explode to new random spots
    const movers = this.items.filter((it) => it.layer !== 'leaf');
    let done = 0;
    movers.forEach((item) => {
      const { x: ax, y: ay } = this.anchorCenter(item.anchor);
      const centerX = this.W / 2 - ax;
      const centerY = this.H / 2 - ay;
      const startAngle = item.angle;
      const nextBaseX = (Math.random() - 0.5) * 200;
      const nextBaseY = (Math.random() - 0.5) * 200;

      Object.assign(item.anim, { x: item.baseX, y: item.baseY, rotation: startAngle, scale: 1, opacity: 1 });

      gsap
        .timeline()
        .to(item.anim, {
          x: centerX,
          y: centerY,
          rotation: startAngle + 45,
          scale: 0.1,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => this.swapModel(item, f.toppings[item.index % f.toppings.length]),
        })
        .to(item.anim, { duration: 0.3 })
        .to(item.anim, {
          x: nextBaseX,
          y: nextBaseY,
          rotation: startAngle + 90,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'back.out(1.5)',
          onComplete: () => {
            item.angle = startAngle + 90;
            item.baseX = nextBaseX;
            item.baseY = nextBaseY;
            item.rx = 0;
            item.ry = 0;
            done++;
            if (done === movers.length) this.isSwitching = false;
          },
        });
    });
    return true;
  }

  /* ---------------- transparent card thumbnails ---------------- */
  static renderThumbnails(): string[] {
    const w = 300;
    const h = 400;
    const stage = makeStage(null, 1, FLAVORS[0]);
    stage.renderer.setSize(w, h, false);
    const cam = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 100);
    cam.position.set(0, 0, 12.5);
    const ice = new IceCream(FLAVORS[0]);
    const tilt = new THREE.Group();
    tilt.rotation.z = deg(-10);
    ice.group.rotation.y = 0.6;
    tilt.add(ice.group);
    stage.scene.add(tilt);

    const out = FLAVORS.map((f) => {
      ice.setFlavor(f);
      tintStage(stage, f);
      stage.renderer.render(stage.scene, cam);
      return stage.renderer.domElement.toDataURL('image/png');
    });

    ice.dispose();
    stage.pmrem.dispose();
    stage.renderer.dispose();
    stage.renderer.forceContextLoss();
    return out;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('touchmove', this.onTouch);
    this.items.forEach((it) => gsap.killTweensOf(it.anim));
    this.items.forEach((it) => disposeObject(it.model));
    this.ice.dispose();
    Object.values(this.stages).forEach((s) => {
      s.pmrem.dispose();
      s.renderer.dispose();
    });
  }
}
