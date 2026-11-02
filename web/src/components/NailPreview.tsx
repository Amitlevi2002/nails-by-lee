import type { Extras } from '../lib/types';

/** Polish shades a client can point at. The name goes into the note Lee receives. */
export const SHADES = [
  { id: 'nude', name: 'ניוד', fill: '#e9c9b8' },
  { id: 'milk', name: 'לבן חלבי', fill: '#f4efe9' },
  { id: 'blush', name: 'ורוד עדין', fill: '#efb7bd' },
  { id: 'red', name: 'אדום קלאסי', fill: '#a3242f' },
  { id: 'mocha', name: 'מוקה', fill: '#7b5546' },
  { id: 'ink', name: 'שחור', fill: '#2a2422' },
] as const;
export type ShadeId = (typeof SHADES)[number]['id'];

// Five tips fanned out the way a nail tech shows samples: angle (deg) and a small vertical offset per finger.
const FAN = [
  { a: -24, y: 22 },
  { a: -11, y: 6 },
  { a: 0, y: 0 },
  { a: 11, y: 6 },
  { a: 24, y: 22 },
];

/** Nail outline from the cuticle (y=0) up to the free edge (y=-len): soft almond for hands, short and square for toes. */
function nailPath(len: number, w: number, toe: boolean) {
  const h = w / 2;
  return toe
    ? `M ${-h} 0 L ${-h} ${-len + 9} Q ${-h} ${-len} 0 ${-len} Q ${h} ${-len} ${h} ${-len + 9} L ${h} 0 Q 0 5 ${-h} 0 Z`
    : `M ${-h} 0 C ${-h} ${-len * 0.62} ${-h * 0.82} ${-len * 0.97} 0 ${-len} C ${h * 0.82} ${-len * 0.97} ${h} ${-len * 0.62} ${h} 0 Q 0 5 ${-h} 0 Z`;
}

/** Finger under the nail: rounded tip a little past the cuticle, running down out of frame. */
function fingerPath(w: number, toe: boolean) {
  const h = w / 2 + 7;
  const top = toe ? -26 : -30;
  return `M ${-h} 90 L ${-h} ${top + h} A ${h} ${h} 0 0 1 ${h} ${top + h} L ${h} 90 Z`;
}

/**
 * A live sketch of the treatment being chosen: length and shape follow the service,
 * French tips, drawings, 3D charms and repaired nails show on as many nails as were picked (up to five shown).
 */
export function NailPreview({ service, extras, shade }: { service: string; extras: Extras; shade: ShadeId }) {
  const toe = service === 'feet';
  const len = service === 'build' ? 70 : toe ? 30 : 48;
  const width = toe ? 34 : 30;
  const fill = SHADES.find((s) => s.id === shade)?.fill ?? SHADES[0].fill;
  const art = Math.min(5, extras.art ?? 0);
  const charm = Math.min(5, extras['3d'] ?? 0);
  const repair = Math.min(5, extras.complete ?? 0);
  const french = !!extras.french;
  // spread decorations from the middle finger outwards, like they'd usually be placed
  const order = [2, 1, 3, 0, 4];
  const has = (count: number, i: number) => order.indexOf(i) < count;
  const dark = shade === 'red' || shade === 'mocha' || shade === 'ink';

  return (
    <figure className="nail-preview" aria-label="הדמיה של הטיפול שבחרת">
      <svg viewBox="-160 -96 320 170" aria-hidden="true">
        <defs>
          <linearGradient id="shine" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".0" />
            <stop offset=".35" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {FAN.map(({ a, y }, i) => {
          const x = (i - 2) * (toe ? 56 : 52);
          const d = nailPath(len, width, toe);
          return (
            <g key={i} transform={`translate(${x} ${y + 34}) rotate(${a})`} className="nail">
              <path d={fingerPath(width, toe)} className="finger" />
              <path d={d} fill={fill} className="polish" />
              {french && <path d={d} className="tip" style={{ clipPath: `inset(0 0 ${toe ? 70 : 78}% 0)` }} />}
              {has(art, i) && (
                <g className="art" transform={`translate(0 ${-len * 0.48})`}>
                  {[0, 72, 144, 216, 288].map((r) => (
                    <circle
                      key={r}
                      cx={Math.cos((r * Math.PI) / 180) * 4}
                      cy={Math.sin((r * Math.PI) / 180) * 4}
                      r={2.6}
                      fill={dark ? '#f4efe9' : '#b0574a'}
                    />
                  ))}
                  <circle r={2} fill="#cdb79a" />
                </g>
              )}
              {has(charm, i) && (
                <g className="charm" transform={`translate(0 ${-len * 0.28})`}>
                  <path d="M0 -5 L4.5 0 L0 5 L-4.5 0 Z" fill="#fff" stroke="#cdb79a" strokeWidth="1" />
                  <path d="M0 -5 L1.8 0 L0 5" fill="#e9e2d6" />
                </g>
              )}
              {has(repair, i) && <path d={d} className="repair" />}
              <path d={d} fill="url(#shine)" opacity={0.5} />
            </g>
          );
        })}
      </svg>
      <figcaption>
        {[
          toe ? 'רגליים' : service === 'build' ? 'בנייה, ציפורן ארוכה' : 'מבנה טבעי',
          french && 'פרנץ׳',
          art > 0 && `ציורים ×${extras.art}`,
          charm > 0 && `תלת מימד ×${extras['3d']}`,
          repair > 0 && `השלמה ×${extras.complete}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </figcaption>
    </figure>
  );
}

export function ShadePicker({ value, onChange }: { value: ShadeId; onChange: (s: ShadeId) => void }) {
  return (
    <div className="shades" role="radiogroup" aria-label="גוון">
      {SHADES.map((s) => (
        <button
          key={s.id}
          role="radio"
          aria-checked={value === s.id}
          aria-label={s.name}
          title={s.name}
          className={`shade ${value === s.id ? 'on' : ''}`}
          style={{ background: s.fill }}
          onClick={() => onChange(s.id)}
        />
      ))}
    </div>
  );
}
