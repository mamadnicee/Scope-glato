import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine } from './three/engine';
import { FLAVORS, TOPPING_LABELS } from './three/flavors';
import { Sprinkles } from './components/Sprinkles';
import {
  FlavorGrid,
  Ingredients,
  Process,
  Reviews,
  Order,
  Footer,
} from './components/Sections';
import { sound } from './utils/soundManager';

/* تصاویر از src/assets import می‌شوند تا بیلد تک‌فایل آن‌ها را به‌صورت base64 درون خود HTML درج کند؛
   این‌طور سایت در هر دیپلوئی حتی بدون فایل تصویری کنارش کار می‌کند. */
import flavorStrawberry from './assets/images/flavor-strawberry.png';
import flavorBlueberry from './assets/images/flavor-blueberry.png';
import flavorPistachio from './assets/images/flavor-pistachio.png';
import flavorChocolate from './assets/images/flavor-chocolate.png';
import flavorSaffron from './assets/images/flavor-saffron.png';
import flavorSourcherry from './assets/images/flavor-sourcherry.png';
import flavorCoconut from './assets/images/flavor-coconut.png';
import flavorKiwi from './assets/images/flavor-kiwi.png';
import flavorDate from './assets/images/flavor-date.png';
import toppingCherry from './assets/images/topping-cherry.png';
import toppingStrawberry from './assets/images/topping-strawberry.png';
import toppingBlueberry from './assets/images/topping-blueberry.png';
import toppingChocolate from './assets/images/topping-chocolate.png';
import toppingPistachio from './assets/images/topping-pistachio.png';
import toppingMint from './assets/images/topping-mint.png';
import toppingKiwi from './assets/images/topping-kiwi.png';
import toppingDate from './assets/images/topping-date.png';

const FLAVOR_IMAGES: Record<string, string> = {
  strawberry: flavorStrawberry,
  blueberry: flavorBlueberry,
  pistachio: flavorPistachio,
  chocolate: flavorChocolate,
  saffron: flavorSaffron,
  sourcherry: flavorSourcherry,
  coconut: flavorCoconut,
  kiwi: flavorKiwi,
  date: flavorDate,
};
const TOPPING_IMAGES: Record<string, string> = {
  cherry: toppingCherry,
  strawberry: toppingStrawberry,
  blueberry: toppingBlueberry,
  chocolate: toppingChocolate,
  pistachio: toppingPistachio,
  mint: toppingMint,
  kiwi: toppingKiwi,
  date: toppingDate,
};

const toFa = (n: number) => n.toLocaleString('fa-IR');
const pad = (n: number) => (n < 10 ? `۰${n}` : toFa(n));
const flavorImages = FLAVORS.map((f) => FLAVOR_IMAGES[f.id]);
const toppingImages = Object.fromEntries(
  Object.keys(TOPPING_LABELS).map((kind) => [kind, TOPPING_IMAGES[kind]])
);

const keepScrollStable = (action: () => void) => {
  const y = window.scrollY;
  action();
  requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
};

const NAV: [string, string][] = [
  ['خانه', '#hero'],
  ['طعم‌ها', '#flavors'],
  ['مواد اولیه', '#ingredients'],
  ['کارگاه', '#process'],
  ['نظرات', '#reviews'],
  ['سفارش', '#order'],
];

export default function App() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const heroBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const queuedFlavorRef = useRef<number | null>(null);
  const chooseRef = useRef<(flavorIndex: number) => void>(() => {});

  const [index, setIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [orderFlavor, setOrderFlavor] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState('#hero');
  const flavor = FLAVORS[index];

  /* --- راه‌اندازی موتور سه‌بعدی --- */
  useEffect(() => {
    if (!backRef.current || !heroRef.current || !frontRef.current || !stageRef.current) return;
    const engine = new Engine(
      {
        back: backRef.current,
        hero: heroRef.current,
        front: frontRef.current,
        stage: stageRef.current,
      },
      0
    );
    engineRef.current = engine;
    engine.onSwitchComplete = () => {
      const queued = queuedFlavorRef.current;
      queuedFlavorRef.current = null;
      if (queued !== null && queued !== engine.flavorIndex) chooseRef.current(queued);
    };

    const io = new IntersectionObserver(
      ([e]) => engine.setRunning(e.isIntersecting),
      { threshold: 0.01 }
    );
    if (heroBoxRef.current) io.observe(heroBoxRef.current);

    return () => {
      io.disconnect();
      queuedFlavorRef.current = null;
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  /* --- تغییر رنگ کل سایت هنگام تعویض طعم (با transition خود CSS) --- */
  const paint = useCallback((n: number) => {
    const f = FLAVORS[n];
    const root = document.documentElement.style;
    root.setProperty('--bg-inner', f.bg.inner);
    root.setProperty('--bg-mid', f.bg.mid);
    root.setProperty('--bg-outer', f.bg.outer);
    root.setProperty('--accent', f.accent);
    root.setProperty('--ink', f.ink);
  }, []);

  const choose = useCallback(
    (next: number, silent = false) => {
      const engine = engineRef.current;
      if (!engine) return;
      const n = (next + FLAVORS.length) % FLAVORS.length;
      if (engine.isSwitching) {
        queuedFlavorRef.current = n;
        return;
      }
      if (!engine.switchFlavor(n)) return;
      if (!silent) sound.scoop();
      window.setTimeout(() => sound.sparkle(), 900);
      paint(n);
      setIndex(n);
    },
    [paint]
  );
  useEffect(() => {
    chooseRef.current = choose;
  }, [choose]);

  /* --- اسکرول نرم به بخش‌ها --- */
  const go = useCallback((hash: string) => {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.55);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const ids = NAV.map(([, h]) => h);
    const els = ids
      .map((h) => document.querySelector(h))
      .filter((n): n is Element => !!n);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target?.id) setActiveNav('#' + vis.target.id);
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => io.observe(el));

    /* نمایش بخش‌های پایین: قبلاً data-reveal روی opacity:0 می‌ماند و صفحه خالی دیده می‌شد */
    const revealTargets = () => document.querySelectorAll<HTMLElement>('[data-reveal]');
    const rio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            rio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );
    revealTargets().forEach((t) => rio.observe(t));

    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      rio.disconnect();
    };
  }, []);

  /* --- کیبورد --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const cur = engineRef.current?.flavorIndex ?? 0;
      if (e.key === 'ArrowLeft') choose(cur + 1);
      if (e.key === 'ArrowRight') choose(cur - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  /* --- سه کارت پنجره‌ای: قبلی، فعلی، بعدی --- */
  const visible = [-1, 0, 1].map((o) => (index + o + FLAVORS.length) % FLAVORS.length);

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
          <a
            href="#hero"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              go('#hero');
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7.5 11.5 12 22l4.5-10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9.5 15.5h5M10.6 18.4h2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M6.5 11.5a5.5 5.5 0 1 1 11 0z" fill="var(--accent)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="14.5" cy="4.2" r="1.4" fill="currentColor" />
            </svg>
            <span className="logo-text">
              <span className="logo-fa">اسکوپ</span>
              <span className="logo-en">Scoop Gelato</span>
            </span>
          </a>

          <nav className="nav glass" aria-label="منوی اصلی">
            {NAV.map(([label, hash]) => (
              <a
                key={hash}
                href={hash}
                className={`nav-item ${activeNav === hash ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  sound.click();
                  go(hash);
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className={`icon-btn ${soundOn ? 'on' : ''}`}
              onClick={() => {
                const next = !soundOn;
                sound.setEnabled(next);
                if (next) sound.toggleAmbient();
                else sound.stopAmbient();
                setSoundOn(next);
              }}
              title={soundOn ? 'قطع صدا' : 'پخش صدا'}
              aria-label={soundOn ? 'قطع صدا' : 'پخش صدا'}
            >
              {soundOn ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  <path d="M17 9l4 6M21 9l-4 6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
                </svg>
              )}
            </button>
            <button className="contact-btn" onClick={() => { sound.click(); go('#order'); }}>
              سفارش آنلاین
            </button>
          </div>
         </header>

      {/* ---------------- هیرو ---------------- */}
      <div className="hero-box" id="hero" ref={heroBoxRef}>
        <Sprinkles />
        <div className="halo" aria-hidden="true" />
        <div className="giant-word" key={flavor.id} aria-hidden="true">
          {flavor.giant}
        </div>

        <canvas ref={backRef} className="layer layer-back" aria-hidden="true" />
        <canvas ref={heroRef} className="layer layer-hero" aria-label="بستنی سه‌بعدی" />
        <canvas ref={frontRef} className="layer layer-front" aria-hidden="true" />

         <main className="hero">
          <div className="hero-content">
            <div className="hero-left">
              <span className="eyebrow">
                <span className="dot" /> Handcrafted Gelato · دست‌ساز روزانه
              </span>

              <h1 className="main-title">
                <span className="line">خنکِ</span> <span className="line">خالص</span>
                <span className="title-en">Pure Chill</span>
              </h1>

              <p className="description">
                طعم واقعی میوه‌ی تازه، در هر قاشق.
                <br />
                بستنی دست‌ساز با شیر تازه و بدون رنگ مصنوعی —
                <br />
                یک تجربه‌ی سرد، شیرین و به‌یادماندنی.
              </p>

              <div className="cta-group">
                <button className="primary-btn" onClick={() => { sound.click(); go('#order'); }}>
                  همین حالا سفارش بده
                  <span className="plus-icon">+</span>
                </button>
                <button className="ghost-btn" onClick={() => { sound.click(); go('#flavors'); }}>
                  منوی طعم‌ها
                </button>
              </div>

              <div className="stats">
                <div className="stat">
                  <strong>٪۱۰۰</strong>
                  <span>شیر تازه‌ی محلی</span>
                </div>
                <div className="stat">
                  <strong>{toFa(FLAVORS.length)}</strong>
                  <span>طعم فصلی</span>
                </div>
                <div className="stat">
                  <strong dir="ltr">−۱۸°</strong>
                  <span>زنجیره‌ی سرمای کامل</span>
                </div>
              </div>

              <div className="award-badge">
                <div className="award-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 15l3 3 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="award-text">
                  <span className="award-title">جایزه‌ی طراحی</span>
                  <span className="award-subtitle">PREMIUM GELATO 2025</span>
                </div>
              </div>
            </div>

            <div ref={stageRef} className="hero-stage" aria-hidden="true" />

            <div className="hero-right">
              <div className="product-carousel">
                <div className="carousel-cards">
                  {visible.map((i) => {
                    const f = FLAVORS[i];
                    const isActive = i === index;
                    return (
                      <button
                        key={f.id}
                        className={`card ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (!isActive) keepScrollStable(() => choose(i));
                        }}
                        aria-label={`طعم ${f.fa}`}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span
                          className="card-media"
                          style={{ ['--card-color' as string]: f.scoops[0] }}
                        >
                          <img
                            src={flavorImages[i]}
                            alt={f.fa}
                            onError={(event) => event.currentTarget.classList.add('is-missing')}
                          />
                        </span>
                        <span className="card-info">
                          <span className="card-fa">{f.fa}</span>
                          <span className="card-en">{f.en}</span>
                          <span className="card-price">{f.price}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="carousel-nav">
                  <span className="flavor-note">
                    <b>{pad(index + 1)}</b> / {pad(FLAVORS.length)} · {toFa(flavor.kcal)} کالری
                  </span>
                  <button
                    className="nav-arrow"
                    onClick={() => keepScrollStable(() => choose(index - 1))}
                    aria-label="طعم قبلی"
                  >
                    →
                  </button>
                  <button
                    className="nav-arrow"
                    onClick={() => keepScrollStable(() => choose(index + 1))}
                    aria-label="طعم بعدی"
                  >
                    ←
                  </button>
                </div>
                <p className="flavor-desc" key={flavor.id}>
                  {flavor.note}
                </p>
              </div>

              <h2 className="side-title">
                <span className="line">شیرینِ</span> <span className="line">ناب</span>
                <span className="title-en">Sweet Escape</span>
              </h2>
            </div>
          </div>
        </main>

        <div className="scroll-cue" aria-hidden="true">
          <span>اسکرول کن</span>
          <i />
        </div>
      </div>

      {/* ---------------- بخش‌های بعد از هیرو ---------------- */}
      <div className="below">
        <FlavorGrid
          thumbs={flavorImages}
          active={index}
          onPreview={(i) => {
            choose(i);
            go('#hero');
          }}
          onOrder={(i) => {
            setOrderFlavor(i);
            go('#order');
          }}
        />
        <Ingredients thumbs={toppingImages} />
        <Process />
        <Reviews />
        <Order selected={orderFlavor} onSelect={setOrderFlavor} />
        <Footer />
      </div>
    </>
  );
}
