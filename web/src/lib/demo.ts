// The demo's "server": the same handler the real server runs, on state kept in localStorage.
// Tokens here are plain "admin" / "client:<id>" because nothing is secret in a demo; the real server signs them.
import { handle, isWrite } from '../../../core/handler';
import { demoState } from '../../../core/seed';
import type { Session, State } from '../../../core/types';
import type { Transport } from './api';

const KEY = 'lee_demo_v2';
const PHOTOS = Array.from({ length: 9 }, (_, i) => `/gallery/${i + 1}.jpg`);
// Public details only (both are on her Instagram); no phone number in the demo.
const STUDIO = { address: 'ראש העין', instagram: 'lee_nailartist' };

let state: State | null = null;

function load(): State {
  if (state) return state;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return (state = JSON.parse(saved));
  } catch {
    /* fall through to fresh demo data */
  }
  return (state = demoState(new Date(), PHOTOS, STUDIO));
}

const parse = (token: string | null): Session | null => {
  if (token === 'admin') return { role: 'admin' };
  const m = token?.match(/^client:(\d+)$/);
  return m ? { role: 'client', id: +m[1] } : null;
};

export const demoTransport: Transport = async (path, { method, body, token }) => {
  await new Promise((r) => setTimeout(r, 120)); // so loading states show up as they would on a network
  const s = load();
  const res = handle(
    s,
    { method, path, body: structuredClone(body ?? {}), session: parse(token) },
    {
      now: new Date(),
      checkAdminPassword: () => true, // the demo opens straight into the admin side
      issueToken: (session) => (session.role === 'admin' ? 'admin' : `client:${session.id}`),
    },
  );
  if (isWrite(method) && res.status < 400) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* demo keeps working in memory */
    }
  }
  return { status: res.status, data: structuredClone(res.body ?? {}) };
};

export function resetDemo() {
  try {
    for (const k of [KEY, 'lee_client_token', 'lee_client_name', 'lee_admin_token']) localStorage.removeItem(k);
  } catch {
    /* nothing stored */
  }
  location.reload();
}
