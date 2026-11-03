import { rgbOf } from './shades';

/**
 * Paints the nails of the studio hand photo (white gel on a pink set) in any shade.
 * The nails are found by colour once, then each one is measured (axis, length, width) and covered
 * with an exact almond, so the paint reaches the edge and never spills onto skin or background.
 * The photo's own light and shadow stay on the nail, with a gel shine where the original was brightest.
 */
export class TryOn {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private base!: ImageData;
  private shown!: ImageData;
  private mask!: Float32Array;
  private lum!: Float32Array;
  private gloss!: Float32Array;
  private meanL = 0.85;
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

    // white gel = light and colourless; its shaded side picks up a little pink, so grow into that a few pixels
    const m = new Uint8Array(n);
    const weak = new Uint8Array(n);
    const lum = (this.lum = new Float32Array(n));
    for (let i = 0; i < n; i++) {
      const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = mx ? (mx - mn) / mx : 0;
      lum[i] = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      if (s < 0.1 && l > 150) m[i] = 1;
      if (s < 0.2 && mx < 238 && b >= g - 6 && l > 140) weak[i] = 1;
    }
    let front: number[] = [];
    for (let i = 0; i < n; i++) if (m[i]) front.push(i);
    for (let d = 0; d < 6; d++) {
      const next: number[] = [];
      for (const i of front) for (const j of N4(i)) if (j >= 0 && j < n && !m[j] && weak[j]) (m[j] = 1), next.push(j);
      front = next;
    }

    // one almond per nail
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const ox = off.getContext('2d')!;
    ox.fillStyle = '#fff';
    const seen = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!m[i] || seen[i]) continue;
      const comp = [i];
      seen[i] = 1;
      for (let h = 0; h < comp.length; h++)
        for (const j of N4(comp[h])) if (j >= 0 && j < n && m[j] && !seen[j]) (seen[j] = 1), comp.push(j);
      if (comp.length >= 800) this.almond(ox, comp);
    }
    const md = ox.getImageData(0, 0, W, H).data;
    this.mask = new Float32Array(n);
    this.gloss = new Float32Array(n);
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i++) {
      const a = (this.mask[i] = md[i * 4 + 3] / 255);
      if (a > 0.9) (sum += lum[i]), cnt++;
      if (a > 0) this.gloss[i] = Math.max(0, lum[i] - 0.92) * 10;
    }
    this.meanL = cnt ? sum / cnt : 0.85;
    this.shown = new ImageData(new Uint8ClampedArray(p), W, H);
    this.ctx.putImageData(this.shown, 0, 0);
  }

  private almond(ox: CanvasRenderingContext2D, comp: number[]) {
    const W = this.W;
    let cx = 0, cy = 0;
    for (const a of comp) (cx += a % W), (cy += (a / W) | 0);
    cx /= comp.length;
    cy /= comp.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const a of comp) {
      const dx = (a % W) - cx, dy = ((a / W) | 0) - cy;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
    // principal axis, pointing to the tip (down in this photo)
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    let ux = Math.cos(ang), uy = Math.sin(ang);
    if (uy < 0) (ux = -ux), (uy = -uy);
    const us: number[] = [], uv: [number, number][] = [];
    for (const a of comp) {
      const dx = (a % W) - cx, dy = ((a / W) | 0) - cy, u = dx * ux + dy * uy;
      us.push(u);
      uv.push([u, -dx * uy + dy * ux]);
    }
    us.sort((a, b) => a - b);
    let u0 = us[Math.floor(us.length * 0.01)], u1 = us[Math.floor(us.length * 0.995)];
    const L0 = u1 - u0;
    u0 -= 0.04 * L0;
    u1 += 0.05 * L0;
    const L = u1 - u0;
    // width from the middle of the nail; the detected part leans to the lit side, so widen and shift toward the shade
    const mid = uv.filter(([u]) => u > us[0] + L0 * 0.25 && u < us[0] + L0 * 0.55).map(([, v]) => v).sort((a, b) => a - b);
    const v0 = mid[Math.floor(mid.length * 0.03)], v1 = mid[Math.floor(mid.length * 0.97)];
    const w = ((v1 - v0) / 2) * 1.3, vc = (v0 + v1) / 2 - 0.2 * w;
    const pt = (u: number, v: number) => [cx + ux * (u0 + u) - uy * (vc + v), cy + uy * (u0 + u) + ux * (vc + v)];
    const half = (u: number) => {
      const c = 0.2 * L;
      if (u < c) return w * Math.sqrt(1 - Math.pow((c - u) / c, 2));
      return w * Math.pow(1 - Math.pow((u - c) / (L - c), 2.2), 0.55);
    };
    ox.beginPath();
    for (let k = 0; k <= 80; k++) {
      const [a, b] = pt((L * k) / 80, half((L * k) / 80));
      k ? ox.lineTo(a, b) : ox.moveTo(a, b);
    }
    for (let k = 80; k >= 0; k--) {
      const [a, b] = pt((L * k) / 80, -half((L * k) / 80));
      ox.lineTo(a, b);
    }
    ox.closePath();
    ox.fill();
  }

  private painted(hex: string) {
    const p = this.base.data, out = new Uint8ClampedArray(p), n = this.W * this.H;
    const [R, G, B] = rgbOf(hex), dark = (R + G + B) / 765 < 0.5;
    for (let i = 0; i < n; i++) {
      const a = this.mask[i];
      if (a < 0.01) continue;
      const f = Math.min(1.08, Math.max(0.55, this.lum[i] / this.meanL));
      const hl = Math.min(1, this.gloss[i] * (dark ? 1 : 0.6));
      for (let k = 0; k < 3; k++) {
        const c = Math.min(255, [R, G, B][k] * Math.pow(f, dark ? 1.8 : 1.3));
        out[i * 4 + k] = p[i * 4 + k] * (1 - a) + (c + (255 - c) * hl) * a;
      }
    }
    return out;
  }

  /** Paints the shade on; with motion, the colour runs along the nails from the cuticle to the tip. */
  paint(hex: string, animate: boolean) {
    if (!this.base) return;
    cancelAnimationFrame(this.frame);
    const to = this.painted(hex);
    if (!animate) {
      this.shown.data.set(to);
      this.ctx.putImageData(this.shown, 0, 0);
      return;
    }
    const from = new Uint8ClampedArray(this.shown.data), { W, H, mask } = this, n = W * H;
    const t0 = performance.now(), dur = 850, edge = 40;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), line = e * (H * 0.5 + edge) + H * 0.42 - edge;
      const d = this.shown.data;
      for (let i = 0; i < n; i++) {
        if (mask[i] < 0.01) continue;
        const w = Math.max(0, Math.min(1, (line - ((i / W) | 0)) / edge + 1)), j = i * 4;
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
