import { useEffect, useRef } from 'react';

const COLORS = ['#ffffff', '#ffd166', '#ff6b9a', '#7ef0c5', '#8fd3ff', '#ffb36b'];

/** Falling sprinkles & frost flakes (replaces the soda bubbles) */
export function Sprinkles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const spawn = () => {
      if (document.hidden) return;
      const el = document.createElement('span');
      const isFrost = Math.random() < 0.35;
      el.className = isFrost ? 'frost' : 'sprinkle';
      if (isFrost) {
        const s = Math.random() * 8 + 4;
        el.style.width = el.style.height = `${s}px`;
      } else {
        el.style.height = `${Math.random() * 10 + 10}px`;
        el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      el.style.left = `${Math.random() * 100}%`;
      el.style.setProperty('--o', `${Math.random() * 0.4 + 0.2}`);
      el.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
      el.style.setProperty('--spin', `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360)}deg`);
      const duration = Math.random() * 6 + 5;
      el.style.animation = `fallDown ${duration}s linear forwards`;
      container.appendChild(el);
      window.setTimeout(() => el.remove(), duration * 1000);
    };

    const id = window.setInterval(spawn, 400);
    return () => {
      window.clearInterval(id);
      container.replaceChildren();
    };
  }, []);

  return <div ref={ref} className="sprinkles-container" aria-hidden="true" />;
}
