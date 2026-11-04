import { useEffect, useRef, useState } from 'react';
import { FLAVORS, TOPPING_LABELS, type Flavor, type ToppingKind } from '../three/flavors';
import { sound } from '../utils/soundManager';

const toFa = (n: number) => n.toLocaleString('fa-IR');

/* ---------------- طعم‌ها ---------------- */
export function FlavorGrid({
  thumbs,
  active,
  onPreview,
  onOrder,
}: {
  thumbs: string[];
  active: number;
  onPreview: (i: number) => void;
  onOrder: (i: number) => void;
}) {
  return (
    <section id="flavors" className="section">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="sec-eyebrow">۰۹ طعم · هر روز تازه</span>
          <h2 className="sec-title">
            منوی کامل <em>طعم‌ها</em>
          </h2>
          <p className="sec-sub">
            هر طعم با میوه‌ی واقعی و بدون رنگ مصنوعی. روی «نمایش سه‌بعدی» بزنید تا بستنی در بالای
            صفحه عوض شود.
          </p>
        </header>

        <div className="flavor-grid">
          {FLAVORS.map((f, i) => (
            <article
              key={f.id}
              className={`fg-card ${i === active ? 'is-active' : ''}`}
              data-reveal
              style={{ ['--fg' as string]: f.scoops[0], ['--fg-a' as string]: f.accent }}
            >
              {f.tag && <span className="fg-tag">{f.tag}</span>}
              <div className="fg-img-box">
                {thumbs[i] ? (
                  <img
                    src={thumbs[i]}
                    alt={f.fa}
                    loading="lazy"
                    onError={(event) => event.currentTarget.classList.add('is-missing')}
                  />
                ) : (
                  <span className="fg-ph" style={{ background: f.scoops[0] }} />
                )}
              </div>
              <div className="fg-body">
                <h3>{f.fa}</h3>
                <span className="fg-en">{f.en}</span>
                <p>{f.note}</p>
                <div className="fg-meta">
                  <span className="fg-price">{f.price}</span>
                  <span className="fg-kcal">{toFa(f.kcal)} کالری</span>
                </div>
                <div className="fg-actions">
                  <button
                    className="btn-mini btn-solid"
                    onClick={() => {
                      sound.click();
                      onPreview(i);
                    }}
                  >
                    نمایش سه‌بعدی
                  </button>
                  <button
                    className="btn-mini"
                    onClick={() => {
                      sound.chime();
                      onOrder(i);
                    }}
                  >
                    سفارش
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- مواد اولیه ---------------- */
export function Ingredients({ thumbs }: { thumbs: Record<string, string> }) {
  const kinds = Object.keys(TOPPING_LABELS) as ToppingKind[];
  return (
    <section id="ingredients" className="section section-alt">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="sec-eyebrow">۱۰۰٪ طبیعی</span>
          <h2 className="sec-title">
            <em>مواد اولیه</em>‌ی ما
          </h2>
          <p className="sec-sub">
            مدل‌های سه‌بعدی زیر با کد ساخته شده‌اند و دقیقاً همان چیزی هستند که در بستنی‌تان
            می‌بینید.
          </p>
        </header>

        <div className="ing-grid">
          {kinds.map((k, i) => (
            <div className="ing-card" data-reveal key={k} style={{ ['--d' as string]: `${i * 60}ms` }}>
              <div className="ing-img">
                {thumbs[k] ? (
                  <img
                    src={thumbs[k]}
                    alt={TOPPING_LABELS[k].fa}
                    loading="lazy"
                    onError={(event) => event.currentTarget.classList.add('is-missing')}
                  />
                ) : null}
              </div>
              <h3>{TOPPING_LABELS[k].fa}</h3>
              <span className="ing-en">{TOPPING_LABELS[k].en}</span>
              <p>{TOPPING_LABELS[k].desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- کارگاه ---------------- */
const STEPS = [
  {
    n: '۰۱',
    t: 'شیر صبحگاهی',
    d: 'هر روز ساعت ۶ صبح شیر تازه از گاوداری‌های همکار می‌رسد و همان روز مصرف می‌شود.',
  },
  {
    n: '۰۲',
    t: 'پوره‌ی میوه',
    d: 'میوه‌ها در کارگاه خودمان پوره می‌شوند؛ هیچ پوره‌ی آماده یا کنسانتره‌ای استفاده نمی‌کنیم.',
  },
  {
    n: '۰۳',
    t: 'هم‌زنی آرام',
    d: 'با دور کند در دستگاه بستنی‌ساز ایتالیایی، تا هوای کمتری وارد بافت شود و کشدار بماند.',
  },
  {
    n: '۰۴',
    t: 'انجماد سریع',
    d: 'در کابینت −۱۸ درجه با زنجیره‌ی سرد کامل، تا کریستال یخ درشت نشود.',
  },
];

const COUNTERS = [
  { v: 9, suffix: '', label: 'طعم فصلی' },
  { v: 12, suffix: '', label: 'سال تجربه' },
  { v: 34000, suffix: '+', label: 'لیوان فروش ماهانه' },
  { v: 0, suffix: '', label: 'رنگ مصنوعی' },
];

function Counter({ v, suffix, label }: { v: number; suffix: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(v * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [v]);
  return (
    <div className="counter" ref={ref} data-reveal>
      <strong>
        {toFa(val)}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

export function Process() {
  return (
    <section id="process" className="section">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="sec-eyebrow">پشت صحنه</span>
          <h2 className="sec-title">
            در <em>کارگاه</em> چه می‌گذرد؟
          </h2>
        </header>

        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" data-reveal key={s.n} style={{ ['--d' as string]: `${i * 90}ms` }}>
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="counters">
          {COUNTERS.map((c) => (
            <Counter key={c.label} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- نظرات ---------------- */
const REVIEWS = [
  {
    n: 'سارا محمدی',
    c: 'تهران',
    r: 5,
    t: 'بافتش واقعاً کشدار است و طعم پسته‌اش عالی. از بستنی‌فروشی‌های معروف خیلی بهتر بود.',
  },
  {
    n: 'امیر رضایی',
    c: 'اصفهان',
    r: 5,
    t: 'زعفران و زرشک را هیچ جای دیگر ندیده بودم؛ ترشی زرشک با شیرینی بستنی عالی می‌شود.',
  },
  {
    n: 'نگار کریمی',
    c: 'شیراز',
    r: 4,
    t: 'کیوی‌ش خنک و ترش بود، دخترم عاشش شد. فقط کاش حجم خانواده هم داشت.',
  },
  {
    n: 'محمد حسینی',
    c: 'مشهد',
    r: 5,
    t: 'خرما و گردو برای من که قند نمی‌خورم بهترین انتخاب بود. شکر افزوده ندارد.',
  },
];

export function Reviews() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % REVIEWS.length), 5200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section id="reviews" className="section section-alt">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="sec-eyebrow">۴٫۹ از ۵</span>
          <h2 className="sec-title">
            <em>نظر</em> مشتری‌ها
          </h2>
        </header>

        <div className="reviews" data-reveal>
          {REVIEWS.map((r, idx) => (
            <blockquote key={r.n} className={`review ${idx === i ? 'is-active' : ''}`}>
              <div className="stars" aria-label={`${r.r} ستاره`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} className={s < r.r ? 'on' : ''}>
                    ★
                  </span>
                ))}
              </div>
              <p>{r.t}</p>
              <footer>
                <strong>{r.n}</strong>
                <span>{r.c}</span>
              </footer>
            </blockquote>
          ))}
          <div className="review-dots">
            {REVIEWS.map((r, idx) => (
              <button
                key={r.n}
                className={idx === i ? 'on' : ''}
                onClick={() => {
                  sound.click();
                  setI(idx);
                }}
                aria-label={`نظر ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- سفارش ---------------- */
export function Order({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  const [sent, setSent] = useState(false);
  const [qty, setQty] = useState(1);
  const f: Flavor = FLAVORS[selected];

  return (
    <section id="order" className="section order-section">
      <div className="wrap order-wrap">
        <header className="sec-head" data-reveal>
          <span className="sec-eyebrow">ارسال با یخ خشک</span>
          <h2 className="sec-title">
            ثبت <em>سفارش</em>
          </h2>
          <p className="sec-sub">تهران و کرج: همان روز · سایر شهرها: ۲۴ تا ۴۸ ساعت</p>
        </header>

        <div className="order-box" data-reveal>
          <div className="order-summary">
            <span className="order-label">طعم انتخابی</span>
            <strong className="order-flavor">{f.fa}</strong>
            <span className="order-en">{f.en}</span>
            <p className="order-note">{f.note}</p>
            <div className="order-chips">
              <span>{f.base}</span>
              <span>{toFa(f.kcal)} کالری</span>
            </div>
            <div className="order-total">
              <span>مبلغ قابل پرداخت</span>
              <strong>{toFa(f.priceValue * qty)} تومان</strong>
            </div>
          </div>

          <form
            className="order-form"
            onSubmit={(e) => {
              e.preventDefault();
              sound.chime(1040);
              setSent(true);
            }}
          >
            <label>
              نام و نام خانوادگی
              <input required type="text" placeholder="مثلاً سارا محمدی" />
            </label>
            <label>
              شماره تماس
              <input required type="tel" inputMode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
            </label>
            <label>
              شهر
              <input required type="text" placeholder="تهران" />
            </label>
            <label>
              انتخاب طعم
              <select
                value={selected}
                onChange={(e) => {
                  sound.click();
                  onSelect(Number(e.target.value));
                }}
              >
                {FLAVORS.map((fl, i) => (
                  <option key={fl.id} value={i}>
                    {fl.fa} — {fl.price}
                  </option>
                ))}
              </select>
            </label>
            <label>
              تعداد (لیوان ۵۰۰ میلی‌لیتری)
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{toFa(qty)}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))}>
                  +
                </button>
              </div>
            </label>
            <button className="btn-primary" type="submit">
              ثبت سفارش
              <span className="plus-icon">+</span>
            </button>
            {sent && (
              <p className="order-ok">سفارش شما ثبت شد؛ همکاران ما برای هماهنگی تماس می‌گیرند. 🍦</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------------- فوتر ---------------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-wrap">
        <div className="footer-brand">
          <strong>اسکوپ</strong>
          <span>Scoop Gelato · بستنی دست‌ساز</span>
          <p>تهران، خیابان ولیعصر، کوچه‌ی بهار، پلاک ۱۲ — هر روز ۱۰ صبح تا ۱۲ شب</p>
        </div>
        <div className="footer-col">
          <h4>دسترسی سریع</h4>
          {[
            ['طعم‌ها', '#flavors'],
            ['مواد اولیه', '#ingredients'],
            ['کارگاه', '#process'],
            ['سفارش', '#order'],
          ].map(([t, h]) => (
            <a key={h} href={h}>
              {t}
            </a>
          ))}
        </div>
        <div className="footer-col">
          <h4>تماس</h4>
          <span dir="ltr">۰۲۱ - ۸۸ ۴۵ ۱۲ ۳۴</span>
          <span dir="ltr">hello@scoopgelato.ir</span>
          <div className="socials">
            <a href="#" aria-label="اینستاگرام">IG</a>
            <a href="#" aria-label="تلگرام">TG</a>
            <a href="#" aria-label="واتساپ">WA</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {toFa(1404)} اسکوپ — همه‌ی حقوق محفوظ است.</span>
        <span>مدل‌های سه‌بعدی اختصاصی، رندر و ذخیره‌شده در همین پروژه</span>
      </div>
    </footer>
  );
}
