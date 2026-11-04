import { useEffect, useRef, useState } from 'react';
import { SHADES, shadeById, type ShadeId } from '../lib/shades';
import { TryOn } from '../lib/tryon';

const HAND = '/hand.jpg';
const calm = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The studio hand with its nails painted in the chosen shade, and one shade at a time beside it:
 * arrows, a swipe on the shade, or a tap on it moves to the next one.
 */
export function TryOnHero({ shade, onShade }: { shade: ShadeId; onShade: (s: ShadeId) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<TryOn | null>(null);
  const [dir, setDir] = useState(0);
  const i = SHADES.findIndex((s) => s.id === shade);
  const s = SHADES[i];
  const shadeRef = useRef(shade);

  useEffect(() => {
    const t = new TryOn(canvas.current!);
    const img = new Image();
    img.onload = () => {
      t.load(img);
      engine.current = t;
      // the first coat goes on a moment after the hand appears, so it is clear what the shades do
      setTimeout(() => t.paint(shadeById(shadeRef.current).hex, !calm()), calm() ? 0 : 900);
    };
    img.src = HAND;
    return () => t.stop();
  }, []);
  useEffect(() => {
    if (shadeRef.current !== shade) engine.current?.paint(s.hex, !calm());
    shadeRef.current = shade;
  }, [shade]);

  const move = (d: number) => {
    setDir(d);
    onShade(SHADES[(i + d + SHADES.length) % SHADES.length].id);
  };
  const startY = useRef<number | null>(null);

  return (
    <section className="tryon">
      <canvas ref={canvas} role="img" aria-label={`יד עם ציפורני שקד בגוון ${s.name}`} />
      <div
        className="pick"
        role="group"
        aria-label="גוון"
        onPointerDown={(e) => (startY.current = e.clientY)}
        onPointerUp={(e) => {
          const y0 = startY.current;
          startY.current = null;
          if (y0 !== null && Math.abs(e.clientY - y0) > 24) move(e.clientY < y0 ? 1 : -1);
        }}
      >
        <button className="arrow" onClick={() => move(-1)} aria-label="הגוון הקודם">
          <svg viewBox="0 0 24 24">
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
        <button className="well" onClick={() => move(1)} aria-label={`${s.name}, לגוון הבא`}>
          <span key={s.id} className={`tip ${s.id === 'milk' ? 'light' : ''} ${dir > 0 ? 'from-below' : dir < 0 ? 'from-above' : ''}`} style={{ '--c': s.hex } as React.CSSProperties} />
        </button>
        <button className="arrow" onClick={() => move(1)} aria-label="הגוון הבא">
          <svg viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="shade-name" aria-live="polite">
          {s.name}
        </div>
        <div className="count">
          {i + 1} / {SHADES.length}
        </div>
      </div>
    </section>
  );
}
