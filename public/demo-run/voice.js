// Speaking: 1) pre-generated audio file (offline, zero cost)  2) /api/tts (Sarvam Bulbul: Simran / Aditya)
//           3) the phone's own voice as last resort. Listening lives in ../shared/listen.js.
import { VOICE_LINES } from './content.js';
import { lang } from '../simulator/i18n.js';

let manifest = {};
let current = null;
let muted = false;
let token = 0;

export async function initVoice() {
  try { const r = await fetch('audio/manifest.json', { cache: 'no-cache' }); if (r.ok) manifest = await r.json(); } catch {}
}
export const isMuted = () => muted;
export function setMuted(m) { muted = m; if (m) stop(); }
export function stop() {
  token++;
  if (current) { try { current.pause(); } catch {} current = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// Speak a known line (by id) or any text. Resolves when finished (or skipped).
export async function speak(id, text, who) {
  if (muted) return;
  stop();
  const my = token, l = lang();
  const line = VOICE_LINES[id];
  text = text || line?.text?.[l] || line?.text?.hi;
  who = who || line?.voice || 'app';
  if (!text) return;
  const file = id && (manifest[`${id}_${l}`] || (l === 'hi' && manifest[id]));
  if (file && (await playUrl('audio/' + file, my))) return;
  if (navigator.onLine) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: who, lang: l }), signal: ctrl.signal });
      clearTimeout(t);
      if (my !== token) return;
      if (r.ok) { const { audio, mime } = await r.json(); if (audio && (await playUrl(`data:${mime || 'audio/wav'};base64,${audio}`, my))) return; }
    } catch {}
  }
  if (my !== token) return;
  await browserSpeak(text, who, my, l);
}

function playUrl(url, my) {
  return new Promise((resolve) => {
    if (my !== token) return resolve(true);
    const a = new Audio(url);
    current = a;
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

function browserSpeak(text, who, my, l) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || my !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
    u.lang = { en: 'en-IN', mr: 'mr-IN' }[l] || 'hi-IN';
    const v = speechSynthesis.getVoices().find((x) => x.lang === u.lang) || speechSynthesis.getVoices().find((x) => x.lang?.startsWith(l));
    if (v) u.voice = v;
    u.rate = who === 'tipster' ? 1.15 : 0.92;
    u.pitch = who === 'tipster' ? 1.25 : 0.95;
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}
