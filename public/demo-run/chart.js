// Tiny theme-aware SVG charts. No libraries, so it stays light on cheap phones.
export function lineChart(points, { w = 320, h = 150, upto = points.length, color = 'var(--up)', marks = [], min, max, buyAt, buyLabel = '' } = {}) {
  const shown = points.slice(0, upto);
  const lo = min ?? Math.min(...points) * 0.9;
  const hi = max ?? Math.max(...points) * 1.08;
  const pad = 8;
  const x = (i) => pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1);
  const y = (v) => h - pad - ((v - lo) * (h - pad * 2)) / (hi - lo);
  const d = shown.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = shown.length > 1 ? `${d}L${x(shown.length - 1).toFixed(1)},${h - pad}L${x(0).toFixed(1)},${h - pad}Z` : '';
  const last = shown[shown.length - 1];
  const buyLine = buyAt != null
    ? `<line x1="${pad}" x2="${w - pad}" y1="${y(buyAt)}" y2="${y(buyAt)}" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1"/>
       <text x="${w - pad}" y="${y(buyAt) - 5}" text-anchor="end" font-size="11" fill="var(--muted)">${buyLabel} ₹${buyAt}</text>` : '';
  const dots = marks.filter((i) => i < shown.length).map((i) => `<circle cx="${x(i)}" cy="${y(points[i])}" r="4" fill="var(--warn)" stroke="var(--s1)" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="dchart" role="img" aria-label="chart">
    ${area ? `<path d="${area}" fill="${color}" opacity=".12"/>` : ''}${buyLine}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}
    ${shown.length ? `<circle cx="${x(shown.length - 1)}" cy="${y(last)}" r="5" fill="${color}"/>` : ''}
  </svg>`;
}

export function salesBars(sales, { w = 320, h = 90, unit = 'Cr' } = {}) {
  const max = Math.max(...sales.map((s) => s.v)) * 1.15;
  const bw = (w - 40) / sales.length;
  return `<svg viewBox="0 0 ${w} ${h + 22}" class="dchart bars" role="img" aria-label="sales">
    ${sales.map((s, i) => {
      const bh = (s.v / max) * h, x = 20 + i * bw + bw * 0.2;
      return `<rect x="${x}" y="${h - bh}" width="${bw * 0.6}" height="${bh}" rx="4" fill="var(--brand)" opacity=".7"/>
        <text x="${x + bw * 0.3}" y="${h - bh - 5}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">₹${s.v} ${unit}</text>
        <text x="${x + bw * 0.3}" y="${h + 16}" text-anchor="middle" font-size="11" fill="var(--muted)">${s.y}</text>`;
    }).join('')}
  </svg>`;
}
