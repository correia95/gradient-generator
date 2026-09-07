import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT,
  GradType,
  Gradient,
  PRESETS,
  decode,
  encode,
  newStop,
  toCss,
  toCssRule,
} from './gradient';

const TYPES: { id: GradType; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'radial', label: 'Radial' },
  { id: 'conic', label: 'Conic' },
];

function normHex(c: string): string {
  // <input type=color> needs #rrggbb; keep other formats as typed
  return /^#[0-9a-f]{6}$/i.test(c) ? c : /^#[0-9a-f]{3}$/i.test(c)
    ? '#' + c.slice(1).split('').map((x) => x + x).join('')
    : '#000000';
}

export default function App() {
  const p = new URLSearchParams(window.location.search);
  const [g, setG] = useState<Gradient>(() => decode(p.get('g') || '') || { ...DEFAULT, stops: DEFAULT.stops.map((s) => ({ ...s })) });
  const [copied, setCopied] = useState<string | null>(null);
  const copyT = useRef<number>();

  const css = useMemo(() => toCss(g), [g]);
  const rule = useMemo(() => toCssRule(g), [g]);

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('g', encode(g));
    window.history.replaceState(null, '', u.toString());
  }, [g]);

  const patch = (d: Partial<Gradient>) => setG((x) => ({ ...x, ...d }));
  const setStop = (id: string, d: Partial<{ color: string; pos: number }>) =>
    setG((x) => ({ ...x, stops: x.stops.map((s) => (s.id === id ? { ...s, ...d } : s)) }));
  const addStop = () => {
    const sorted = [...g.stops].sort((a, b) => a.pos - b.pos);
    const mid = sorted.length >= 2 ? Math.round((sorted[0].pos + sorted[sorted.length - 1].pos) / 2) : 50;
    setG((x) => ({ ...x, stops: [...x.stops, newStop('#ffffff', mid)] }));
  };
  const removeStop = (id: string) =>
    setG((x) => (x.stops.length > 2 ? { ...x, stops: x.stops.filter((s) => s.id !== id) } : x));

  const copy = (v: string, k: string) => {
    navigator.clipboard.writeText(v).then(() => {
      setCopied(k);
      window.clearTimeout(copyT.current);
      copyT.current = window.setTimeout(() => setCopied(null), 1300);
    }).catch(() => {});
  };

  const sortedStops = [...g.stops].sort((a, b) => a.pos - b.pos);
  const barGradient = `linear-gradient(90deg, ${sortedStops.map((s) => `${s.color} ${s.pos}%`).join(', ')})`;

  return (
    <div className="wrap">
      <header>
        <h1>CSS Gradient Generator</h1>
        <p className="sub">
          Build a linear, radial or conic gradient with any number of colour stops and copy the CSS.
          The preview updates live and the whole gradient is in the page URL to share.
        </p>
      </header>

      <div className="preview" style={{ background: css }} />

      <div className="controls">
        <div className="seg">
          {TYPES.map((t) => (
            <button key={t.id} className={g.type === t.id ? 'on' : ''} onClick={() => patch({ type: t.id })}>{t.label}</button>
          ))}
        </div>

        {(g.type === 'linear' || g.type === 'conic') && (
          <label className="angle">
            <span>{g.type === 'linear' ? 'Angle' : 'From'} <b>{g.angle}°</b></span>
            <input type="range" min={0} max={360} value={g.angle} onChange={(e) => patch({ angle: Number(e.target.value) })} />
          </label>
        )}
        {g.type === 'radial' && (
          <div className="seg shape">
            <button className={g.shape === 'circle' ? 'on' : ''} onClick={() => patch({ shape: 'circle' })}>Circle</button>
            <button className={g.shape === 'ellipse' ? 'on' : ''} onClick={() => patch({ shape: 'ellipse' })}>Ellipse</button>
          </div>
        )}
        <label className="rep">
          <input type="checkbox" checked={g.repeating} onChange={(e) => patch({ repeating: e.target.checked })} /> Repeating
        </label>
      </div>

      <div className="bar" style={{ background: barGradient }}>
        {sortedStops.map((s) => (
          <span key={s.id} className="pin" style={{ left: `${s.pos}%`, background: s.color }} title={`${s.color} ${s.pos}%`} />
        ))}
      </div>

      <div className="stops">
        {g.stops.map((s) => (
          <div className="stop" key={s.id}>
            <input type="color" value={normHex(s.color)} onChange={(e) => setStop(s.id, { color: e.target.value })} />
            <input
              className="hex"
              type="text"
              value={s.color}
              spellCheck={false}
              onChange={(e) => setStop(s.id, { color: e.target.value })}
            />
            <input
              className="pos"
              type="range"
              min={0}
              max={100}
              value={s.pos}
              onChange={(e) => setStop(s.id, { pos: Number(e.target.value) })}
            />
            <span className="pv">{s.pos}%</span>
            <button className="rm" onClick={() => removeStop(s.id)} disabled={g.stops.length <= 2} aria-label="Remove stop">×</button>
          </div>
        ))}
        <button className="addstop" onClick={addStop}>+ Add colour stop</button>
      </div>

      <div className="output">
        <div className="orow">
          <code>{rule}</code>
          <button onClick={() => copy(rule, 'r')}>{copied === 'r' ? 'Copied' : 'Copy'}</button>
        </div>
        <div className="orow small">
          <code>{css}</code>
          <button onClick={() => copy(css, 'v')}>{copied === 'v' ? 'Copied' : 'Copy value'}</button>
        </div>
      </div>

      <div className="presets">
        <h2>Presets</h2>
        <div className="pgrid">
          {PRESETS.map((pr) => {
            const pg = pr.g();
            return (
              <button key={pr.name} style={{ background: toCss(pg) }} onClick={() => setG(pg)} title={pr.name}>
                <span>{pr.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="explain">
        <h2>Using the CSS</h2>
        <p>
          Copy the <code>background</code> declaration straight into a rule, or the bare value if
          you're setting it from JavaScript or a framework style prop. A gradient is an
          <em> image</em>, so you can also stack it with other backgrounds or use it in
          <code> background-image</code>, <code>border-image</code> and <code>mask</code>.
        </p>
        <h3>Linear, radial and conic</h3>
        <p>
          <strong>Linear</strong> runs along a line at the angle you set (0° is upward, 90° is to
          the right). <strong>Radial</strong> spreads out from the centre as a circle or ellipse.
          <strong> Conic</strong> sweeps around the centre like a colour wheel — good for pie
          charts and loading spinners.
        </p>
        <h3>Colour stops</h3>
        <p>
          Each stop is a colour and a position from 0–100%. Add as many as you like; put two stops
          at the same position for a hard edge (stripes), and turn on <strong>repeating</strong> to
          tile the pattern.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. It's all CSS generated in your browser, and the gradient is encoded in the page URL so a link reproduces it exactly.</p>
        <footer>CSS Gradient Generator · client-side · no sign-up · works offline</footer>
      </section>
    </div>
  );
}
