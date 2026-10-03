// Voice: pre-generated file → /api/tts (Sarvam Bulbul, voice: Simran) → the phone's own voice.
import { lang } from './i18n.js';

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

// cachedOnly: use a pre-generated file or the phone's own voice, never a live TTS call.
export async function speak(text, id, { cachedOnly = false } = {}) {
  if (muted || !text) return;
  stop();
  const my = token;
  const l = lang();
  if (id && manifest[`${id}_${l}`] && (await play('audio/' + manifest[`${id}_${l}`], my))) return;
  if (navigator.onLine && !cachedOnly) {
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: 'app', lang: l }), signal: ctrl.signal });
      clearTimeout(tm);
      if (my !== token) return;
      if (r.ok) {
        const { audio, mime } = await r.json();
        if (audio && (await play(`data:${mime || 'audio/wav'};base64,${audio}`, my))) return;
      }
    } catch {}
  }
  if (my === token) browserSpeak(text, l);
}

function play(url, my) {
  return new Promise((res) => {
    if (my !== token) return res(true);
    const a = new Audio(url);
    current = a;
    a.onended = () => res(true);
    a.onerror = () => res(false);
    a.play().catch(() => res(false));
  });
}

function browserSpeak(text, l) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
  u.lang = { en: 'en-IN', mr: 'mr-IN' }[l] || 'hi-IN';
  const v = speechSynthesis.getVoices().find((x) => x.lang === u.lang) || speechSynthesis.getVoices().find((x) => x.lang?.startsWith(l));
  if (v) u.voice = v;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
