import type { Info } from '../lib/types';
import { useState, useMemo } from 'react';
import { makeApi } from '../lib/api';
import { TOKEN } from './session';
import { Head } from './Head';
import { StudioInfo } from './StudioInfo';
import { HeroCarousel, Lightbox } from './Gallery';
import { LOGO } from '../lib/brand';
import { IconChevron } from '../components/icons';

/* ---------- login ---------- */
export function Welcome({ info, onDone }: { info: Info; onDone: (token: string, name: string) => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const api = useMemo(() => makeApi(TOKEN, () => {}), []);
  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api('/api/client/login', {
        method: 'POST',
        body: {
          fullName,
          phone,
        },
      });
      onDone(r.token, r.customer.fullName);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (showInfo)
    return (
      <div className="app">
        <div className="screen" key="info">
          <Head onBack={() => setShowInfo(false)} />
          <h1 className="title">Nails by Lee</h1>
          <p className="subtitle">{info.about}</p>
          <StudioInfo info={info} />
          <div className="bottom">
            <button className="btn" onClick={() => setShowInfo(false)}>
              לקביעת תור
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="app">
      <form className="screen" onSubmit={submit}>
        {info.gallery.length > 0 && <HeroCarousel photos={info.gallery} onOpen={setLb} />}
        <div className={`welcome ${info.gallery.length ? 'over' : ''}`}>
          <img src={LOGO} alt="Nails by Lee" />
          <div className="brand">Nails by Lee</div>
          <p>
            {'קביעת תור \u00B7 '}
            {info.address}
          </p>
          {info.gallery.length > 0 && (
            <button type="button" className="link" onClick={() => setShowInfo(true)}>
              {'כל העבודות והמחירון '}
              <IconChevron />
            </button>
          )}
        </div>
        {err && (
          <div className="error" role="alert">
            {err}
          </div>
        )}
        <div className="fields">
          <div className="field">
            <label htmlFor="fullName">שם מלא</label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="phone">טלפון</label>
            <input
              id="phone"
              className="input"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="050-000-0000"
              required
            />
          </div>
        </div>
        <div className="bottom">
          <button className="btn" disabled={busy || !fullName || !phone}>
            {busy ? 'רגע...' : 'כניסה'}
          </button>
        </div>
      </form>
      {lb !== null && <Lightbox photos={info.gallery} start={lb} onClose={() => setLb(null)} />}
    </div>
  );
}
/* ---------- booking flow ---------- */
