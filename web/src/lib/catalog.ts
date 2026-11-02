export const DEFAULT_CATALOG = {
  services: [
    {
      id: 'anatomic',
      name: 'לק ג׳ל מבנה אנטומי',
      price: 130,
    },
    {
      id: 'build',
      name: 'בנייה בג׳ל',
      price: 200,
      from: true,
      hint: 'המחיר משתנה לפי אורך',
    },
    {
      id: 'fill',
      name: 'מילוי בג׳ל',
      price: 150,
    },
    {
      id: 'feet',
      name: 'ג׳ל רגליים',
      price: 120,
    },
  ],
  extras: [
    {
      id: 'complete',
      name: 'השלמת ציפורן',
      price: 10,
      perNail: true,
    },
    {
      id: 'french',
      name: 'פרנץ׳',
      price: 10,
      perNail: false,
    },
    {
      id: 'art',
      name: 'ציורים',
      price: 5,
      perNail: true,
    },
    {
      id: '3d',
      name: 'תלת מימד',
      price: 10,
      perNail: true,
    },
  ],
};

export const MAX_NAILS = 10;
// The web app sets this once at startup from /api/info; the server passes its own copy explicitly.

export // The web app sets this once at startup from /api/info; the server passes its own copy explicitly.
let current = DEFAULT_CATALOG;

export const setCatalog = (c) => {
  current = c;
};

export const getCatalog = () => current;
/** Cleans client input: known extras only, counts within range. */

/** Cleans client input: known extras only, counts within range. */
export function cleanExtras(raw, cat = current) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const e of cat.extras) {
    const n = Math.floor(Number(raw[e.id]) || 0);
    if (n > 0) out[e.id] = Math.min(n, e.perNail ? MAX_NAILS : 1);
  }
  return out;
}

export function priceOf(serviceId, extras, cat = current) {
  const s = cat.services.find((x) => x.id === serviceId);
  if (!s) return null;
  let total = s.price;
  for (const e of cat.extras) total += (extras[e.id] || 0) * e.price;
  return {
    total,
    from: !!s.from,
  };
}
/** "פרנץ׳ · ציורים ×4" */

/** "פרנץ׳ · ציורים ×4" */
export function extrasLabel(extras, cat = current) {
  return cat.extras
    .filter((e) => extras?.[e.id])
    .map((e) => (e.perNail ? `${e.name} ×${extras[e.id]}` : e.name))
    .join(' · ');
}

export const serviceName = (id, cat = current) => cat.services.find((s) => s.id === id)?.name ?? 'טיפול שהוסר';

export const isFromPrice = (id, cat = current) => !!cat.services.find((s) => s.id === id)?.from;

export const fmtPrice = (n, from = false) => `${from ? 'החל מ-' : ''}${n} ₪`;
/** Validates a catalog Lee saved; returns null when unusable. */

/** Validates a catalog Lee saved; returns null when unusable. */
export function cleanCatalog(raw) {
  if (!raw || !Array.isArray(raw.services) || !Array.isArray(raw.extras)) return null;
  const str = (v, max = 60) =>
    String(v ?? '')
      .trim()
      .slice(0, max);
  const num = (v) => Math.max(0, Math.min(5000, Math.round(Number(v) || 0)));
  const services = raw.services
    .map((s) => ({
      id: str(s.id, 40) || `s${Math.random().toString(36).slice(2, 8)}`,
      name: str(s.name),
      price: num(s.price),
      from: !!s.from,
      hint: str(s.hint, 80) || undefined,
    }))
    .filter((s) => s.name);
  const extras = raw.extras
    .map((e) => ({
      id: str(e.id, 40) || `e${Math.random().toString(36).slice(2, 8)}`,
      name: str(e.name),
      price: num(e.price),
      perNail: !!e.perNail,
    }))
    .filter((e) => e.name);
  return services.length
    ? {
        services,
        extras,
      }
    : null;
}
