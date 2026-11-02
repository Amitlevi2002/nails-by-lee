import { useEffect, useState } from 'react';
import type { Info } from '../lib/types';
import { fmtPrice } from '../lib/catalog';

const SEASONS = ['חורף', 'חורף', 'אביב', 'אביב', 'אביב', 'קיץ', 'קיץ', 'קיץ', 'סתיו', 'סתיו', 'סתיו', 'חורף'];
const HOLD = 4200;

/**
 * The welcome screen as a magazine cover: Lee's work full-bleed, crossfading with a slow push-in,
 * an oversized masthead blended over the photo, and story-style progress bars. Tapping opens the photo.
 */
export function Cover({ info, onOpen }: { info: Info; onOpen: (i: number) => void }) {
  const photos = info.gallery;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const calm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (photos.length < 2 || paused || calm) return;
    const t = setTimeout(() => setI((n) => (n + 1) % photos.length), HOLD);
    return () => clearTimeout(t);
  }, [i, paused, photos.length, calm]);

  const now = new Date();
  // issue number: months since the studio's demo "launch", so it grows like a real magazine
  const issue = (now.getFullYear() - 2024) * 12 + now.getMonth() + 1;

  return (
    <header className="cover-hero">
      {photos.map((p, n) => (
        <button
          type="button"
          key={p.id}
          className={`cover-slide ${n === i ? 'on' : ''}`}
          onClick={() => onOpen(n)}
          aria-label="הגדלת תמונה"
          tabIndex={n === i ? 0 : -1}
        >
          <img src={p.url} alt="עבודת ציפורניים של לי" loading={n < 2 ? 'eager' : 'lazy'} />
        </button>
      ))}

      {photos.length > 1 && (
        <div className="stories" aria-hidden="true">
          {photos.slice(0, 12).map((p, n) => (
            <span key={p.id} className={n < i ? 'done' : n === i ? (paused || calm ? 'done' : 'run') : ''} style={{ animationDuration: `${HOLD}ms` }} />
          ))}
        </div>
      )}

      <div className="masthead" aria-hidden="true">
        <span className="issue">No. {issue} · {SEASONS[now.getMonth()]} {now.getFullYear()}</span>
        <span className="nails-by">NAILS BY</span>
      </div>
      <h1 className="lee">
        <span className="sr">Nails by Lee</span>
        <span aria-hidden="true">Lee</span>
      </h1>
      {(info.address || info.instagram) && (
        <p className="side" aria-hidden="true">
          {[info.address, info.instagram && `@${info.instagram}`].filter(Boolean).join(' — ')}
        </p>
      )}
      <button type="button" className="pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'המשך החלפת תמונות' : 'עצירת החלפת תמונות'}>
        {paused ? '▶' : '❚❚'}
      </button>
    </header>
  );
}

/** The price list set like a magazine's table of contents. */
export function Contents({ info }: { info: Info }) {
  return (
    <ol className="toc">
      {info.catalog.services.map((s, n) => (
        <li key={s.id}>
          <span className="toc-n">{String(n + 1).padStart(2, '0')}</span>
          <span className="toc-name">{s.name}</span>
          <span className="toc-dots" aria-hidden="true" />
          <span className="toc-price">{fmtPrice(s.price, s.from)}</span>
        </li>
      ))}
    </ol>
  );
}
