// Check your keys, network and models in one go:   npm run test:ai
//   Sarvam does it all: the brain (reasoning check, coach, report), the voice (Simran) and speech-to-text
import { writeFileSync } from 'node:fs';
import { loadEnv, describeKey } from '../lib/env.js';
const envFile = loadEnv(process.cwd());
console.log('env फ़ाइल:', envFile || '— नहीं मिली —');
if (envFile && envFile !== '.env') console.log(`⚠ फ़ाइल का नाम "${envFile}" है — सही नाम सिर्फ़ ".env" है`);
console.log('Sarvam key:', describeKey());

const sarvam = await import('../lib/sarvam.js');
const hint = (e) => {
  if (e.status === 401 || e.status === 403) return '  → key reject हुई। key दोबारा copy करें (0/O, l/I), या नई बनाएँ।';
  if (e.status === 429) return '  → rate limit या credits ख़त्म।';
  if (e.status === 404) return '  → model नाम नहीं मिला। .env में SARVAM_CHAT_MODEL बदलकर देखें।';
  if (!e.status) return '  → network की दिक्कत (VPN/firewall/इंटरनेट)। Node 18+ चाहिए: node -v';
  return '';
};

if (sarvam.hasKey()) {
  try { const t0 = Date.now(); console.log('1. Sarvam chat: ✓', (await sarvam.chat([{ role: 'user', content: 'एक वाक्य में बताओ SEBI क्या है।' }], { maxTokens: 800 })).slice(0, 160), `(${Date.now() - t0} ms)`); }
  catch (e) { console.log('✗ Sarvam chat:', e.message); console.log(hint(e)); }
  try {
    const { tts } = await import('../lib/speech/index.js');
    const a = await tts('नमस्ते, मैं निवेश सेतु हूँ।', 'app', { lang: 'hi' });
    writeFileSync('test-tts.wav', Buffer.from(a.audio, 'base64'));
    console.log('2. Sarvam voice (Simran): ✓ test-tts.wav बनी — चलाकर सुनें');
  } catch (e) { console.log('✗ Sarvam voice:', e.message); console.log(hint(e)); }
} else console.log('1–2. Sarvam: key नहीं — आवाज़ फ़ोन की अपनी आवाज़ से चलेगी');

// The reasoning check end to end (server handler, no browser needed)
const { default: reason } = await import('../api/reason.js');
const res = { status() { return this; }, json(b) { this.b = b; return this; }, setHeader() {} };
await reason({ method: 'POST', headers: {}, socket: {}, url: '/api/reason', body: { app: 'sim', side: 'buy', code: 'ROCKINFR', day: 4, qty: 300, lev: 1, text: 'मेरे WhatsApp ग्रुप ने कहा है यह 3 गुना होगा', profile: { lang: 'hi', level: 'basic', domain: 'farm', startCash: 50000 }, orders: [] } }, res);
console.log(`3. Reasoning check: ${res.b.source === 'ai' ? '✓ AI' : '⚠ ' + res.b.source} · ${res.b.verdict} ${res.b.score}\n   सवाल: ${res.b.question}`);

// 4. The coach, for every event. Each must come back from the AI; if not, print why.
const { default: coach } = await import('../api/coach.js');
const { COACH_EVENTS } = await import('../public/simulator/data.js');
const prof = { lang: 'hi', level: 'basic', domain: 'farm', startCash: 50000, stated: 'wait', sources: ['people'], allowLeverage: true };
const orders = [
  { day: 2, side: 'buy', code: 'ROCKINFR', qty: 200, lev: 1, reasonText: 'दोस्त ने कहा' },
  { day: 3, side: 'buy', code: 'VIKISPAT', qty: 50, lev: 1, reasonText: 'सस्ता लगा' },
];
let coachFails = 0;
console.log('4. Coach (हर event):');
for (const event of COACH_EVENTS) {
  const r = { status() { return this; }, json(b) { this.b = b; return this; }, setHeader() {} };
  await coach({ method: 'POST', headers: {}, socket: {}, url: '/api/coach', body: { event, profile: prof, orders, day: event === 'crash' || event === 'panic' ? 9 : 4, code: 'ROCKINFR' } }, r);
  const ok = r.b.source === 'ai';
  if (!ok) coachFails++;
  console.log(`   ${ok ? '✓' : '✗'} ${event.padEnd(14)} ${ok ? r.b.title : 'fallback: ' + r.b.why} (${r.b.ms} ms)`);
}
console.log(coachFails ? `   ⚠ ${coachFails} coach events fell back. The "why" above says the cause.` : '   ✓ सभी coach events AI से आए');
