// First-time tips for the simulator's tabs. Static text, no AI, no network.
// Each tab's tip shows once; the "?" in the tab header replays it.
// Seen state lives in localStorage (ns_tips_seen). "Reset game" keeps it; a full data reset clears it.
export const TIP_TABS = ['explore', 'portfolio', 'orders'];
const KEY = 'ns_tips_seen';

function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export const tipSeen = (id) => !!read()[id];
export function markTipSeen(id) { const v = read(); v[id] = true; write(v); }
export function resetTips() { try { localStorage.removeItem(KEY); } catch {} }

// Should this tab's tip open now? (Not if already seen, not for other tabs.)
export const maybeShowTip = (tabId) => TIP_TABS.includes(tabId) && !tipSeen(tabId);

// title, text (lines separated by \n), ok label. Strings are app-provided (no user input).
export function tipHTML({ title, text, ok, a = 'data-a' }) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<div class="scrim" ${a}="tipClose"></div>
    <section class="tipsheet" role="dialog" aria-label="${esc(title)}">
      <h3>💡 ${esc(title)}</h3>
      ${String(text).split('\n').map((l) => `<p>${esc(l)}</p>`).join('')}
      <button class="btn primary" ${a}="tipClose">${esc(ok)}</button>
    </section>`;
}
