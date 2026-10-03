// One door to the AI. Sarvam only: reasoning check, coach, report, Q&A, explanations.
import * as sarvam from './sarvam.js';

let lastError = null;
export const hasBrain = () => sarvam.hasKey();

const ask = ({ system, user, json, temperature, maxTokens }) => {
  const sys = json ? `${system}\n\nReturn ONLY one valid JSON object. No markdown, no code fences, no text before or after it.` : system;
  return sarvam.chat([{ role: 'system', content: sys }, { role: 'user', content: user }], { maxTokens, temperature });
};

// Plain text answer. → { text, provider }
export async function think(opts) {
  if (!hasBrain()) throw new Error('no SARVAM_API_KEY');
  try { const text = await ask(opts); lastError = null; return { text, provider: 'sarvam' }; }
  catch (e) { lastError = e.message; console.error('[ai:sarvam]', e.message); throw e; }
}

// JSON answer, validated. validate(obj) returns an error string or null. One retry on a bad answer.
export async function thinkJSON(opts, validate = () => null) {
  if (!hasBrain()) throw new Error('no SARVAM_API_KEY');
  let err;
  for (let i = 0; i < 2; i++) {
    try {
      const data = extractJSON(await ask({ ...opts, json: true }));
      const problem = data ? validate(data) : 'not_json';
      if (problem) throw new Error('answer rejected: ' + problem);
      lastError = null;
      return { data, provider: 'sarvam' };
    } catch (e) { err = e; lastError = e.message; console.error('[ai:sarvam]', e.message); if (e.status) break; }
  }
  throw err;
}

// A short machine-readable reason for a failed AI call (shown in dev, logged on the server).
export function whyOf(e) {
  const m = String(e?.message || e || '');
  if (/no SARVAM_API_KEY/.test(m)) return 'no_key';
  if (e?.name === 'AbortError' || /timeout|ETIMEDOUT|aborted/i.test(m)) return 'timeout';
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET/i.test(m + (e?.cause?.code || ''))) return 'network';
  if (/ungrounded_number/.test(m)) return 'validation:numbers';
  if (/advice|directive/.test(m)) return 'validation:advice';
  if (/not_json/.test(m)) return 'json';
  if (/answer rejected: (.+)/.test(m)) return 'validation:' + m.match(/answer rejected: ([\w ]+)/)[1].trim().replace(/\s+/g, '_');
  if (e?.status) return 'http:' + e.status;
  return 'error';
}

export function extractJSON(s) {
  const t = String(s).replace(/```(?:json)?/gi, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

export const status = () => ({ brain: hasBrain() ? 'sarvam' : null, sarvam: { key: hasBrain(), model: process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations', lastError } });

export async function ping() {
  if (!hasBrain()) return {};
  const t0 = Date.now();
  try { const s = await sarvam.chat([{ role: 'user', content: 'Reply with the single word: ready' }], { maxTokens: 300, temperature: 0 }); return { sarvam: { ok: true, sample: s.slice(0, 40), ms: Date.now() - t0 } }; }
  catch (e) { return { sarvam: { ok: false, error: e.message.slice(0, 200) } }; }
}
