import { rgbOf } from './shades';

/**
 * Paints the nails of the studio hands photo (milky gel on a pink set) in any shade.
 * The nails are found by colour once and each one is filled by its convex outline, so the paint
 * reaches the edge and never spills onto skin or background. The photo's own light and shadow stay
 * on the nail, with a gel shine where the original reflected the light.
 */
export class TryOn {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private base!: ImageData;
  private shown!: ImageData;
  private mask!: Float32Array;
  private light!: Float32Array; // brightness around the nail's own average, so the white tips don't show through
  private gloss!: Float32Array;
  private along!: Float32Array; // 0 at the cuticle .. 1 at the tip, with a small head start per nail
  private frame = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  }

  load(img: HTMLImageElement) {
    const W = (this.W = this.canvas.width = img.naturalWidth);
    const H = (this.H = this.canvas.height = img.naturalHeight);
    const n = W * H;
    this.ctx.drawImage(img, 0, 0);
    this.base = this.ctx.getImageData(0, 0, W, H);
    const p = this.base.data;
    const N4 = (i: number) => [i - 1, i + 1, i - W, i + W];
    const pieces = (on: ArrayLike<number>, visit: (comp: number[]) => void) => {
      const seen = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        if (!on[i] || seen[i]) continue;
        const comp = [i];
        seen[i] = 1;
        for (let h = 0; h < comp.length; h++)
          for (const j of N4(comp[h])) if (j >= 0 && j < n && on[j] && !seen[j]) (seen[j] = 1), comp.push(j);
        visit(comp);
      }
    };

    // The gel is light and nearly colourless. Its shaded side and the cuticle are pinker, but unlike the
    // background their blue stays close to their green, and unlike skin it doesn't fall below it.
    const m = new Uint8Array(n), near = new Uint8Array(n), loose = new Uint8Array(n);
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = mx ? (mx - mn) / mx : 0, d = b - g;
      lum[i] = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      if (s < 0.16 && l > 170) m[i] = 1;
      if (s < 0.3 && d >= -3 && l > 130) {
        if (d <= 10) near[i] = 1;
        if (d <= 18 && r < 238) loose[i] = 1;
      }
    }
    pieces(m.slice(), (comp) => {
      if (comp.length < 1500) for (const a of comp) m[a] = 0;
    });
    let front: number[] = [];
    for (let i = 0; i < n; i++) if (m[i]) front.push(i);
    for (let d = 0; d < 60; d++) {
      const next: number[] = [];
      for (const i of front) for (const j of N4(i)) if (j >= 0 && j < n && !m[j] && near[j]) (m[j] = 1), next.push(j);
      front = next;
    }

    // smooth the outline, close the reflections, drop anything that isn't nail-sized
    let f = box(box(Float32Array.from(m), 5, W, H), 5, W, H);
    for (let i = 0; i < n; i++) f[i] = f[i] > 0.5 ? 1 : 0;
    const outside = new Uint8Array(n);
    const edge: number[] = [];
    for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) edge.push(y * W, y * W + W - 1);
    const stack = edge.filter((i) => !f[i]);
    for (const i of stack) outside[i] = 1;
    while (stack.length) for (const j of N4(stack.pop()!)) if (j >= 0 && j < n && !outside[j] && !f[j]) (outside[j] = 1), stack.push(j);
    for (let i = 0; i < n; i++) f[i] = outside[i] ? 0 : 1;
    pieces(f.slice(), (comp) => {
      if (comp.length < 1500) for (const a of comp) f[a] = 0;
    });

    // the cuticle side grows a little further, only above each nail's middle: the tips touch the background
    const extra: number[] = [];
    pieces(f, (comp) => {
      let sum = 0;
      for (const a of comp) sum += (a / W) | 0;
      const mid = sum / comp.length, added = new Set<number>();
      let ring = comp;
      for (let d = 0; d < 30; d++) {
        const next: number[] = [];
        for (const a of ring)
          for (const j of N4(a)) if (j >= 0 && j < n && !f[j] && !added.has(j) && loose[j] && ((j / W) | 0) < mid) added.add(j), next.push(j);
        ring = next;
      }
      extra.push(...added);
    });
    for (const j of extra) f[j] = 1;

    // every nail is convex: fill its outline, so notches close and nothing can leak
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const ox = off.getContext('2d')!;
    ox.fillStyle = ox.strokeStyle = '#fff';
    ox.lineJoin = 'round';
    ox.lineWidth = 4;
    pieces(f, (comp) => {
      const hull = convexHull(comp.map((a) => [a % W, (a / W) | 0]));
      ox.beginPath();
      hull.forEach(([x, y], k) => (k ? ox.lineTo(x, y) : ox.moveTo(x, y)));
      ox.closePath();
      ox.fill();
      ox.stroke();
    });
    const md = ox.getImageData(0, 0, W, H).data;
    const mask = (this.mask = new Float32Array(n));
    for (let i = 0; i < n; i++) mask[i] = md[i * 4 + 3] / 255;

    // light on the nail relative to its surroundings, measured inside the nail only
    const inside = Float32Array.from(mask, (a) => (a > 0.5 ? 1 : 0));
    const weighted = box(Float32Array.from(lum, (l, i) => l * inside[i]), 16, W, H);
    const weight = box(inside, 16, W, H);
    const soft = box(lum, 1, W, H);
    this.light = new Float32Array(n);
    this.gloss = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (!mask[i]) continue;
      const local = weight[i] > 0 ? weighted[i] / weight[i] : soft[i];
      this.light[i] = soft[i] / local;
      this.gloss[i] = Math.max(0, soft[i] - local - 0.025) * 9;
    }

    // the brush runs down each nail, one nail just after the other
    this.along = new Float32Array(n);
    let nail = 0;
    pieces(inside, (comp) => {
      let top = H, bottom = 0;
      for (const a of comp) {
        const y = (a / W) | 0;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
      for (const a of comp) this.along[a] = (((a / W) | 0) - top) / Math.max(1, bottom - top) + nail * 0.12;
      nail++;
    });
    for (let i = 0; i < n; i++) if (mask[i] && !inside[i]) this.along[i] = this.along[i - 1] || this.along[i + 1] || this.along[i - W] || this.along[i + W] || 0;

    this.shown = new ImageData(new Uint8ClampedArray(p), W, H);
    this.ctx.putImageData(this.shown, 0, 0);
  }

  private painted(hex: string) {
    const p = this.base.data, out = new Uint8ClampedArray(p), n = this.W * this.H;
    const [R, G, B] = rgbOf(hex), dark = (R + G + B) / 765 < 0.5;
    for (let i = 0; i < n; i++) {
      const a = this.mask[i];
      if (a < 0.01) continue;
      const f = Math.min(1.1, Math.max(0.8, this.light[i]));
      const hl = Math.min(0.85, this.gloss[i] * (dark ? 1 : 0.6));
      for (let k = 0; k < 3; k++) {
        const c = Math.min(255, [R, G, B][k] * Math.pow(f, dark ? 1.6 : 1.2));
        out[i * 4 + k] = p[i * 4 + k] * (1 - a) + (c + (255 - c) * hl) * a;
      }
    }
    return out;
  }

  /** Paints the shade on; with motion, the colour runs along each nail from the cuticle to the tip. */
  paint(hex: string, animate: boolean) {
    if (!this.base) return;
    cancelAnimationFrame(this.frame);
    const to = this.painted(hex);
    if (!animate) {
      this.shown.data.set(to);
      this.ctx.putImageData(this.shown, 0, 0);
      return;
    }
    const from = new Uint8ClampedArray(this.shown.data), { mask, along } = this, n = this.W * this.H;
    const t0 = performance.now(), dur = 1000, soft = 0.25, span = 1 + 9 * 0.12 + soft;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), line = (1 - Math.pow(1 - k, 2)) * span;
      const d = this.shown.data;
      for (let i = 0; i < n; i++) {
        if (mask[i] < 0.01) continue;
        const w = Math.max(0, Math.min(1, (line - along[i]) / soft)), j = i * 4;
        d[j] = from[j] + (to[j] - from[j]) * w;
        d[j + 1] = from[j + 1] + (to[j + 1] - from[j + 1]) * w;
        d[j + 2] = from[j + 2] + (to[j + 2] - from[j + 2]) * w;
      }
      this.ctx.putImageData(this.shown, 0, 0);
      if (k < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  stop() {
    cancelAnimationFrame(this.frame);
  }
}

/** Separable box blur of radius r. */
function box(a: Float32Array, r: number, W: number, H: number) {
  const n = W * H, o = new Float32Array(n), out = new Float32Array(n);
  for (let y = 0; y < H; y++) {
    let t = 0, c = 0;
    for (let x = -r; x < W; x++) {
      const add = x + r, drop = x - r - 1;
      if (add < W) (t += a[y * W + add]), c++;
      if (drop >= 0) (t -= a[y * W + drop]), c--;
      if (x >= 0) o[y * W + x] = t / c;
    }
  }
  for (let x = 0; x < W; x++) {
    let t = 0, c = 0;
    for (let y = -r; y < H; y++) {
      const add = y + r, drop = y - r - 1;
      if (add < H) (t += o[add * W + x]), c++;
      if (drop >= 0) (t -= o[drop * W + x]), c--;
      if (y >= 0) out[y * W + x] = t / c;
    }
  }
  return out;
}

function convexHull(points: number[][]) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: number[][]) => {
    const h: number[][] = [];
    for (const p of list) {
      while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  return [...half(pts), ...half(pts.slice().reverse())];
}
