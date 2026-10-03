// Theme-aware SVG charts with touch scrubbing. No libraries.
const store = new Map();
let uid = 0;

export function areaChart(points, { w = 360, h = 190, labels = [], base } = {}) {
  const id = 'c' + ++uid;
  const up = points[points.length - 1] >= points[0];
  const color = up ? 'var(--up)' : 'var(--down)';
  const lo = Math.min(...points), hi = Math.max(...points);
  const pad = (hi - lo) * 0.12 || hi * 0.02;
  const min = lo - pad, max = hi + pad;
  const x = (i) => (i * w) / Math.max(points.length - 1, 1);
  const y = (v) => h - ((v - min) * h) / (max - min);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const baseY = y(base ?? points[0]).toFixed(1);
  store.set(id, { points, labels, w, h, min, max });
  return `<div class="chartwrap" data-chart="${id}">
    <div class="scrub-tip" hidden></div>
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="chart" role="img" aria-label="price chart">
      <defs><linearGradient id="g${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" style="stop-color:${color};stop-opacity:.28"/>
        <stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>
      <line x1="0" x2="${w}" y1="${baseY}" y2="${baseY}" stroke="var(--line2)" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"/>
      <path d="${d}L${w},${h}L0,${h}Z" fill="url(#g${id})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <line class="scrub-line" x1="0" x2="0" y1="0" y2="${h}" stroke="var(--muted)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0"/>
      <circle class="scrub-dot" r="4" fill="${color}" opacity="0"/>
    </svg></div>`;
}

export function spark(points, { w = 64, h = 24 } = {}) {
  const up = points[points.length - 1] >= points[0];
  const lo = Math.min(...points), hi = Math.max(...points) || 1;
  const x = (i) => (i * w) / (points.length - 1);
  const y = (v) => h - 2 - ((v - lo) * (h - 4)) / (hi - lo || 1);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="spark" aria-hidden="true"><path d="${d}" fill="none" stroke="${up ? 'var(--up)' : 'var(--down)'}" stroke-width="1.6"/></svg>`;
}

// Touch / mouse scrubbing: shows price + day under the finger.
export function bindScrub(root, fmt) {
  root.querySelectorAll('[data-chart]').forEach((wrap) => {
    const c = store.get(wrap.dataset.chart);
    if (!c) return;
    const svg = wrap.querySelector('svg'), tip = wrap.querySelector('.scrub-tip');
    const line = svg.querySelector('.scrub-line'), dot = svg.querySelector('.scrub-dot');
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const i = Math.max(0, Math.min(c.points.length - 1, Math.round((px / r.width) * (c.points.length - 1))));
      const vx = (i * c.w) / (c.points.length - 1), v = c.points[i];
      const vy = c.h - ((v - c.min) * c.h) / (c.max - c.min);
      line.setAttribute('x1', vx); line.setAttribute('x2', vx); line.setAttribute('opacity', '.6');
      dot.setAttribute('cx', vx); dot.setAttribute('cy', vy); dot.setAttribute('opacity', '1');
      tip.hidden = false;
      tip.textContent = `${fmt(v)} · ${c.labels[i] ?? ''}`;
      tip.style.left = Math.min(Math.max((px / r.width) * 100, 12), 88) + '%';
    };
    const end = () => { tip.hidden = true; line.setAttribute('opacity', '0'); dot.setAttribute('opacity', '0'); };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', end);
    svg.addEventListener('pointerup', end);
    svg.addEventListener('touchmove', move, { passive: true });
    svg.addEventListener('touchend', end);
  });
}
