// CSS gradient model + serialisation.

export type GradType = 'linear' | 'radial' | 'conic';

export interface Stop {
  id: string;
  color: string; // any CSS colour string
  pos: number; // 0-100
}

export interface Gradient {
  type: GradType;
  angle: number; // linear: deg. conic: from deg.
  shape: 'circle' | 'ellipse'; // radial
  repeating: boolean;
  stops: Stop[];
}

let seq = 0;
export const newStop = (color: string, pos: number): Stop => ({ id: `s${Date.now().toString(36)}${seq++}`, color, pos });

export const DEFAULT: Gradient = {
  type: 'linear',
  angle: 90,
  shape: 'circle',
  repeating: false,
  stops: [newStop('#6a11cb', 0), newStop('#2575fc', 100)],
};

function stopList(stops: Stop[]): string {
  return [...stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${s.pos}%`)
    .join(', ');
}

export function toCss(g: Gradient): string {
  const fn = (g.repeating ? 'repeating-' : '') +
    (g.type === 'linear' ? 'linear-gradient' : g.type === 'radial' ? 'radial-gradient' : 'conic-gradient');
  const list = stopList(g.stops);
  if (g.type === 'linear') return `${fn}(${g.angle}deg, ${list})`;
  if (g.type === 'radial') return `${fn}(${g.shape} at center, ${list})`;
  return `${fn}(from ${g.angle}deg at center, ${list})`;
}

export function toCssRule(g: Gradient): string {
  return `background: ${toCss(g)};`;
}

export function toBackgroundImage(g: Gradient): string {
  return `background-image: ${toCss(g)};`;
}

// serialize to a compact URL string: type|angle|shape|rep|color@pos;color@pos
export function encode(g: Gradient): string {
  const t = g.type[0]; // l r c
  const parts = [t, g.angle, g.shape[0], g.repeating ? 1 : 0].join('~');
  const stops = g.stops.map((s) => `${encodeURIComponent(s.color)}@${s.pos}`).join(';');
  return `${parts}~${stops}`;
}

export function decode(str: string): Gradient | null {
  try {
    const bits = str.split('~');
    if (bits.length < 5) return null;
    const [t, angle, shape, rep, ...rest] = bits;
    const type: GradType = t === 'r' ? 'radial' : t === 'c' ? 'conic' : 'linear';
    const stopsStr = rest.join('~');
    const stops = stopsStr.split(';').map((p) => {
      const [c, pos] = p.split('@');
      return newStop(decodeURIComponent(c), Math.max(0, Math.min(100, Number(pos) || 0)));
    });
    if (stops.length < 2) return null;
    return {
      type,
      angle: Number(angle) || 0,
      shape: shape === 'e' ? 'ellipse' : 'circle',
      repeating: rep === '1',
      stops,
    };
  } catch {
    return null;
  }
}

export const PRESETS: { name: string; css: string; g: () => Gradient }[] = [
  { name: 'Purple Bliss', css: '', g: () => ({ ...DEFAULT, angle: 135, stops: [newStop('#360033', 0), newStop('#0b8793', 100)] }) },
  { name: 'Sunset', css: '', g: () => ({ ...DEFAULT, angle: 90, stops: [newStop('#ff512f', 0), newStop('#f09819', 100)] }) },
  { name: 'Ocean', css: '', g: () => ({ ...DEFAULT, angle: 120, stops: [newStop('#2193b0', 0), newStop('#6dd5ed', 100)] }) },
  { name: 'Peach', css: '', g: () => ({ ...DEFAULT, angle: 90, stops: [newStop('#ffecd2', 0), newStop('#fcb69f', 100)] }) },
  { name: 'Night Sky', css: '', g: () => ({ ...DEFAULT, angle: 200, stops: [newStop('#0f2027', 0), newStop('#203a43', 50), newStop('#2c5364', 100)] }) },
  { name: 'Lime', css: '', g: () => ({ ...DEFAULT, angle: 135, stops: [newStop('#a8ff78', 0), newStop('#78ffd6', 100)] }) },
  { name: 'Cherry', css: '', g: () => ({ ...DEFAULT, angle: 90, stops: [newStop('#eb3349', 0), newStop('#f45c43', 100)] }) },
  { name: 'Radial Pop', css: '', g: () => ({ ...DEFAULT, type: 'radial' as GradType, stops: [newStop('#fceabb', 0), newStop('#f8b500', 100)] }) },
];
