import type { Info } from '../lib/types';
import { useState, useMemo } from 'react';
import { makeApi } from '../lib/api';
import { TOKEN } from './session';
import { Lightbox } from './Gallery';
import { fmtPrice } from '../lib/catalog';
import { BrandBar } from './Brand';
import { TryOnHero } from './TryOnHero';
import { Steps } from './Steps';
import type { ShadeId } from '../lib/shades';

/* ---------- the front page: try a shade on, see her work, then name and phone ---------- */
export function Welcome({
  info,
  shade,
  onShade,
  onDone,
}: {
  info: Info;
  shade: ShadeId;
  onShade: (s: ShadeId) => void;
  onDone: (token: string, name: string) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const api = useMemo(() => makeApi(TOKEN, () => {}), []);
  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api('/api/client/login', { method: 'POST', body: { fullName, phone } });
      onDone(r.token, r.customer.fullName);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="front">
      <BrandBar />
      <TryOnHero shade={shade} onShade={onShade} />

      {info.gallery.length > 0 && (
        <section className="work">
          <small>העבודות של לי</small>
          <div className="strip">
            {info.gallery.map((p, n) => (
              <button key={p.id} onClick={() => setLb(n)} aria-label="הגדלת תמונה">
                <img src={p.url} alt="עבודת ציפורניים של לי" loading={n < 4 ? 'eager' : 'lazy'} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="intro">
        <h1>
          לק ג׳ל, בנייה
          <br />
          ומילוי ציפורניים
        </h1>
        <div className="by">@ Nails by Lee{info.address ? `, ${info.address}` : ''}</div>
        <div className="prices">
          {info.catalog.services.map((s) => (
            <div className="price-row" key={s.id}>
              <b>{s.name}</b>
              <span>{fmtPrice(s.price, s.from)}</span>
            </div>
          ))}
        </div>
      </section>

      <form className="card book" onSubmit={submit}>
        <h2>קביעת תור</h2>
        <Steps at={0} />
        {err && (
          <div className="error" role="alert">
            {err}
          </div>
        )}
        <label className="field">
          <span>שם מלא</span>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="field">
          <span>טלפון</span>
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="050-000-0000"
            required
          />
        </label>
        <button className="btn shade-btn" disabled={busy || !fullName || !phone}>
          <span>{busy ? 'רגע...' : 'המשך לבחירת יום'}</span>
        </button>
      </form>

      {info.instagram && (
        <a className="ig-chip" href={`https://instagram.com/${info.instagram}`} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          {info.instagram}
        </a>
      )}
      {lb !== null && <Lightbox photos={info.gallery} start={lb} onClose={() => setLb(null)} />}
    </div>
  );
}
