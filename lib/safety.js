// Server-side guardrails around the LLM. Three layers:
//  1. isAdviceRequest  — deterministic gate BEFORE the model (shared with the browser)
//  2. system prompt    — the model is told never to advise and to use only our facts
//  3. output checks    — advice phrases, invented numbers, length; fail → next model or safe text
export { isAdviceRequest, looksLikeAdvice } from '../public/shared/safety.js';
import { looksLikeAdvice } from '../public/shared/safety.js';

const DEV = '०१२३४५६७८९';
const toLatin = (s) => String(s).replace(/[०-९]/g, (d) => DEV.indexOf(d));
const nums = (s) => (toLatin(s).replace(/(\d),(?=\d)/g, '$1').match(/\d+(\.\d+)?/g) || []).map(Number);

// Every number in the AI's text must come from the facts (rounding allowed) or be a small counting number.
export function numbersGrounded(output, facts) {
  const allowed = nums(facts);
  return nums(output).every((n) => n <= 12 || allowed.some((f) => Math.abs(n - f) <= Math.max(1, Math.abs(f) * 0.03)));
}

export function checkExplain(output, facts) {
  if (!output || output.length < 20) return 'empty';
  if (output.length > 1200) return 'too_long';
  if (looksLikeAdvice(output)) return 'advice';
  if (!numbersGrounded(output, facts)) return 'ungrounded_number';
  return null;
}

export function checkAnswer(output) {
  if (!output || output.length < 5) return 'empty';
  if (looksLikeAdvice(output)) return 'advice';
  return null;
}

// Check every string inside an AI JSON answer.
export function checkFields(obj, facts, { maxLen = 700 } = {}) {
  const strings = [];
  (function walk(v) {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(obj);
  for (const s of strings) {
    if (s.length > maxLen) return 'too_long';
    if (looksLikeAdvice(s)) return 'advice';
    if (!numbersGrounded(s, facts)) return 'ungrounded_number:' + s.slice(0, 60);
  }
  return null;
}

// Coach notes describe what the player ALREADY did ("you sold in the fall", "your friend said buy"),
// so the shared advice filter is too broad for them. The coach is checked for DIRECTIVES only,
// and text the coach quotes (the buzz message, the player's own words) is ignored.
const DIRECTIVE = /(खरीद\s*(लो|लें|लीजिए|डालो|डालें)|ख़रीद\s*(लो|लें|लीजिए)|बेच\s*(दो|दें|दीजिए|डालो|डालें)|होल्ड\s*(करो|करें|कीजिए)|रखे\s*रहो|निवेश\s*(करो|करें|कीजिए)|लगा\s*(दो|दें|दीजिए)|\b(buy|sell)\s+(it\s+)?now\b|\byou\s+should\s+(buy|sell|hold|invest|keep)\b|\bi\s+(would\s+)?(recommend|suggest)\s+(buying|selling|holding)\b|\b(go\s+ahead\s+and|just)\s+(buy|sell)\b|\b(good|great|best)\s+(time|stock|share)\s+to\s+(buy|sell)\b|target\s*price|टारगेट\s*प्राइस|अच्छा\s*शेयर|बुरा\s*शेयर|good\s+stock|bad\s+(stock|company))/i;
export const stripQuotes = (s) => String(s).replace(/"[^"]*"|“[^”]*”|'[^']{8,}'|‘[^’]*’/g, ' ');
export const looksLikeDirective = (s) => DIRECTIVE.test(stripQuotes(s));

export function checkCoach(obj, facts, { maxLen = 500 } = {}) {
  for (const s of Object.values(obj).filter((v) => typeof v === 'string')) {
    if (s.length > maxLen) return 'too_long';
    if (looksLikeDirective(s)) return 'directive';
    if (!numbersGrounded(s, facts)) return 'ungrounded_number:' + s.slice(0, 60);
  }
  return null;
}

// The reasoning check's card (right / wrong / tip / consequence / question).
// Stricter than the coach: bare imperatives ("खरीदें", "Sell.") and any judgement of the company are rejected too.
const IMPERATIVE = /(^|[\s.!?।,:;"“])(खरीदें|ख़रीदें|खरीदिए|बेचें|बेचिए|होल्ड\s*करें|रोक\s*कर\s*रखें)(?=[\s.!?।,:;"”]|$)|(^|[.!?।,;:]\s*|\bthen\s+|\band\s+|\bjust\s+)(buy|sell|hold)\b(?!\s+(order|button|side|price|sheet))/i;
const JUDGES_COMPANY = /\b(good|great|strong|solid|safe|bad|poor|risky|weak|terrible|excellent)\s+(stock|share|company|investment|pick|bet)\b|(अच्छा|बढ़िया|बुरा|ख़राब|खराब|मज़बूत|कमज़ोर|सुरक्षित)\s*(शेयर|स्टॉक)|(अच्छी|बढ़िया|बुरी|ख़राब|खराब|मज़बूत|कमज़ोर)\s*कंपनी/i;
export function checkGateText(s) {
  const t = stripQuotes(s);
  if (looksLikeAdvice(t) || looksLikeDirective(t) || IMPERATIVE.test(t)) return 'advice';
  if (JUDGES_COMPANY.test(t)) return 'judges_company';
  return null;
}
export function checkGate(obj, facts, { maxLen = {} } = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const s = String(v ?? '');
    if (s.length > (maxLen[k] || 400)) return 'too_long:' + k;
    const bad = checkGateText(s);
    if (bad) return bad + ':' + k;
    if (!numbersGrounded(s, facts)) return 'ungrounded_number:' + k;
  }
  return null;
}

// Very small per-instance, per-endpoint rate limit, to protect API credits during the demo.
const hits = new Map();
export function rateLimited(req, limit = 60) {
  const ip = (req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'x').toString().split(',')[0] + ' ' + String(req.url || '').split('?')[0];
  const now = Date.now();
  const h = hits.get(ip) || { n: 0, reset: now + 60000 };
  if (now > h.reset) { h.n = 0; h.reset = now + 60000; }
  h.n++;
  hits.set(ip, h);
  return h.n > limit;
}

// Common rules every prompt carries.
export function baseRules(lang) {
  return [
    'This is a practice game with PRETEND money. Every company, price and news item is fictional.',
    'NEVER tell the user to buy, sell, hold or invest in anything, and never say whether a stock is good or bad to own. Never predict prices or say what will happen next.',
    'Never reveal or hint at future days of the game.',
    'Use ONLY the numbers given in FACTS. Do not invent numbers, websites, phone numbers or names.',
    'You may question the user, point out risks they missed, and explain consequences of what they ALREADY did.',
    lang === 'en'
      ? 'Write in simple Indian English.'
      : lang === 'mr'
        ? 'Write in simple, everyday Marathi (मराठी) in Devanagari script — real Marathi words and grammar, not Hindi. Common English market words (share, P/E, MTF) may stay in English.'
        : 'Write in simple Hindi in Devanagari script. Common English market words (share, P/E, MTF) may stay in English.',
  ];
}
