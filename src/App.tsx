import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Engine } from './three/engine';
import { FLAVORS } from './three/flavors';
import { Sprinkles } from './components/Sprinkles';

const toFa = (n: number) => n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const pad = (n: number) => toFa(n).padStart(2, '۰');

const NAV = ['خانه', 'طعم‌ها', 'مواد اولیه', 'کارگاه', 'نظرات'];

export default function App() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [index, setIndex] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [activeNav, setActiveNav] = useState(0);
  const flavor = FLAVORS[index];

  useEffect(() => {
    if (!backRef.current || !heroRef.current || !frontRef.current) return;
    const engine = new Engine(
      { back: backRef.current, hero: heroRef.current, front: frontRef.current },
      0
    );
    engineRef.current = engine;
    const t = window.setTimeout(() => {
      try {
        setThumbs(Engine.renderThumbnails());
      } catch (e) {
        console.error('Thumbnail render failed', e);
      }
    }, 500);
    return () => {
      window.clearTimeout(t);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const choose = useCallback((next: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const n = (next + FLAVORS.length) % FLAVORS.length;
    if (!engine.switchFlavor(n)) return;
    const f = FLAVORS[n];
    gsap.to(document.body, {
      '--bg-inner': f.bg.inner,
      '--bg-mid': f.bg.mid,
      '--bg-outer': f.bg.outer,
      '--accent': f.accent,
      '--ink': f.ink,
      duration: 1.5,
      ease: 'power2.inOut',
    });
    setIndex(n);
  }, []);

  // keyboard: ← next, → previous (RTL)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cur = engineRef.current?.flavorIndex ?? 0;
      if (e.key === 'ArrowLeft') choose(cur + 1);
      if (e.key === 'ArrowRight') choose(cur - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  return (
    <>
      <Sprinkles />
      <div className="halo" aria-hidden="true" />
      <div className="giant-word" key={flavor.id} aria-hidden="true">
        {flavor.giant}
      </div>

      <canvas ref={backRef} className="layer layer-back" aria-hidden="true" />
      <canvas ref={heroRef} className="layer layer-hero" aria-label="بستنی سه‌بعدی" />
      <canvas ref={frontRef} className="layer layer-front" aria-hidden="true" />

      {/* ---------- Header ---------- */}
      <header className="header">
        <a href="#" className="logo" aria-label="اسکوپ">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7.5 11.5 12 22l4.5-10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9.5 15.5h5M10.6 18.4h2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path
              d="M6.5 11.5a5.5 5.5 0 1 1 11 0z"
              fill="var(--accent)"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="14.5" cy="4.2" r="1.4" fill="currentColor" />
          </svg>
          <span className="logo-text">
            <span className="logo-fa">اسکوپ</span>
            <span className="logo-en">Scoop Gelato</span>
          </span>
        </a>

        <nav className="nav glass" aria-label="منوی اصلی">
          {NAV.map((item, i) => (
            <a
              key={item}
              href="#"
              className={`nav-item ${activeNav === i ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveNav(i);
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        <button className="contact-btn">تماس با ما</button>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="hero">
        <div className="hero-content">
          {/* Start column (right side in RTL) */}
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
              <button className="primary-btn">
                همین حالا سفارش بده
                <span className="plus-icon">+</span>
              </button>
              <button className="ghost-btn">منوی طعم‌ها</button>
            </div>

            <div className="stats">
              <div className="stat">
                <strong>٪۱۰۰</strong>
                <span>شیر تازه‌ی محلی</span>
              </div>
              <div className="stat">
                <strong>۰</strong>
                <span>رنگ و اسانس مصنوعی</span>
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

          {/* End column (left side in RTL) */}
          <div className="hero-right">
            <div className="product-carousel">
              <div className="carousel-cards">
                {FLAVORS.map((f, i) => (
                  <button
                    key={f.id}
                    className={`card ${i === index ? 'active' : ''}`}
                    onClick={() => choose(i)}
                    aria-label={`طعم ${f.fa}`}
                  >
                    {thumbs[i] ? (
                      <img src={thumbs[i]} alt={f.fa} />
                    ) : (
                      <span className="thumb-ph" style={{ background: f.scoops[0] }} />
                    )}
                    <span className="card-info">
                      <span className="card-fa">{f.fa}</span>
                      <span className="card-en">{f.en}</span>
                      <span className="card-price">{f.price}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="carousel-nav">
                <span className="flavor-note">
                  <b>{pad(index + 1)}</b> / {pad(FLAVORS.length)} · {flavor.kcal} کالری
                </span>
                <button className="nav-arrow" onClick={() => choose(index - 1)} aria-label="طعم قبلی">
                  →
                </button>
                <button className="nav-arrow" onClick={() => choose(index + 1)} aria-label="طعم بعدی">
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

      <div className="hint" aria-hidden="true">
        <span className="mouse" />
        ماوس را حرکت بده · <span dir="ltr">{flavor.en}</span>
      </div>
    </>
  );
}
