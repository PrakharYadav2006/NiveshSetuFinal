// GET /api/health        → which AI keys are configured (no network call)
// GET /api/health?ping=1 → also makes a tiny live call to each provider
import { status, ping } from '../lib/ai.js';
import { canSpeak, canListen } from '../lib/speech/index.js';

export default async function handler(req, res) {
  const s = status();
  const out = { ok: !!s.brain, brain: s.brain, voice: canSpeak() ? 'sarvam' : null, listen: canListen(), sarvam: s.sarvam };
  const wantPing = req.query?.ping || new URL(req.url, 'http://x').searchParams.get('ping');
  if (wantPing) out.live = await ping();
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(out);
}
