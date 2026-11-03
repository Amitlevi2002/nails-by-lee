/** Polish shades a client can try on. The name travels to Lee inside the request note ("גוון: …"). */
export const SHADES = [
  { id: 'red', name: 'אדום קלאסי', hex: '#a3122a' },
  { id: 'milk', name: 'לבן חלבי', hex: '#f4efe9' },
  { id: 'blush', name: 'ורוד עדין', hex: '#f0b3bb' },
  { id: 'nude', name: 'ניוד', hex: '#d9ad96' },
  { id: 'caramel', name: 'קרמל', hex: '#b9825f' },
  { id: 'coral', name: 'קורל', hex: '#ec6a5c' },
  { id: 'cherry', name: 'בורדו', hex: '#5e0f1f' },
  { id: 'fuchsia', name: 'פוקסיה', hex: '#d6337a' },
  { id: 'plum', name: 'שזיף', hex: '#8e2a7c' },
  { id: 'lilac', name: 'לילך', hex: '#b7a2d6' },
  { id: 'baby', name: 'תכלת', hex: '#a9cbe6' },
  { id: 'sage', name: 'מרווה', hex: '#9fb59a' },
  { id: 'mocha', name: 'מוקה', hex: '#6f4a3e' },
  { id: 'ink', name: 'שחור', hex: '#1c1a1b' },
] as const;
export type Shade = (typeof SHADES)[number];
export type ShadeId = Shade['id'];

export const rgbOf = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)) as [number, number, number];
/** Light shades get dark text on top of them, dark ones white. */
export const inkOn = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255 > 0.55 ? '#1d1418' : '#ffffff';
};
export const shadeById = (id: string | null | undefined) => SHADES.find((s) => s.id === id) ?? SHADES[0];

const PREFIX = 'גוון: ';
export const shadeNote = (s: Shade, note: string) => [PREFIX + s.name, note.trim()].filter(Boolean).join(' · ');
/** Splits a request note back into the shade the client picked and whatever she wrote herself. */
export function readShadeNote(note: string): { shade: Shade | null; rest: string } {
  if (!note.startsWith(PREFIX)) return { shade: null, rest: note };
  const [first, ...more] = note.split(' · ');
  const shade = SHADES.find((s) => s.name === first.slice(PREFIX.length)) ?? null;
  return shade ? { shade, rest: more.join(' · ') } : { shade: null, rest: note };
}
