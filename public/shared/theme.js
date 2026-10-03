// Light / dark theme. Default follows the phone; a tap overrides it (remembered on this phone if allowed).
const KEY = 'niveshsetu-theme';
// One-time migration of settings saved before the rename. The only place the old name may appear.
try {
  for (const old of ['ruko-theme', 'ruko_theme']) { // brand-allow: migration
    const v = localStorage.getItem(old);
    if (v != null) { if (localStorage.getItem(KEY) == null) localStorage.setItem(KEY, v); localStorage.removeItem(old); }
  }
} catch {}
const root = document.documentElement;

function systemDark() { return window.matchMedia?.('(prefers-color-scheme: dark)').matches; }
export function current() { return root.dataset.theme || (systemDark() ? 'dark' : 'light'); }

function apply(t) {
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = current() === 'dark' ? '#0D0E10' : '#FFFFFF';
}

export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  apply(saved === 'light' || saved === 'dark' ? saved : null);
}

export function toggleTheme() {
  const next = current() === 'dark' ? 'light' : 'dark';
  apply(next);
  try { localStorage.setItem(KEY, next); } catch {}
  return next;
}

export const themeIcon = () => (current() === 'dark' ? '☀️' : '🌙');
