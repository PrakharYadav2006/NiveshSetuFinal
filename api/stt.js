// POST /api/stt { audio: base64, mime, lang } → { transcript }
// Sarvam Saarika. Audio is passed straight through and never stored.
import { stt, canListen } from '../lib/speech/index.js';
import { rateLimited } from '../lib/safety.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req, 30)) return res.status(429).json({ error: 'slow down' });
  if (!canListen()) return res.status(503).json({ error: 'no speech provider configured' });
  const { audio, mime = 'audio/webm' } = req.body || {};
  if (!audio || audio.length > 4_000_000) return res.status(400).json({ error: 'missing or too long' });
  try {
    const transcript = await stt(audio, mime, ['en', 'mr'].includes(req.body?.lang) ? req.body.lang : 'hi');
    return res.status(200).json({ transcript: transcript.trim() });
  } catch (e) {
    console.error('[stt]', e.message);
    return res.status(502).json({ error: 'stt failed' });
  }
}
