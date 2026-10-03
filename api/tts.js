// POST /api/tts { text, voice: 'tipster' | 'app', lang: 'hi' | 'en' } → { audio: base64, mime }
// Only used when a line has no pre-generated audio file. Voice: Sarvam Bulbul v3 (Simran / Aditya).
import { tts, canSpeak } from '../lib/speech/index.js';
import { rateLimited } from '../lib/safety.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req, 60)) return res.status(429).json({ error: 'slow down' });
  if (!canSpeak()) return res.status(503).json({ error: 'no voice provider configured' });
  const text = String(req.body?.text || '').slice(0, 2400);
  if (!text) return res.status(400).json({ error: 'empty' });
  try {
    const out = await tts(text, req.body?.voice === 'tipster' ? 'tipster' : 'app', { lang: ['en', 'mr'].includes(req.body?.lang) ? req.body.lang : 'hi' });
    if (!out.audio) throw new Error('no audio returned');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(out);
  } catch (e) {
    console.error('[tts]', e.message);
    return res.status(502).json({ error: 'tts failed' });
  }
}
