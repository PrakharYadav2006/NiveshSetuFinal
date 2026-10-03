// Speech layer. Sarvam speaks (Bulbul v3) and listens (Saarika).
import * as sarvam from '../sarvam.js';

// Two deliberately different voices: the scammer vs the calm guide.
export const VOICES = {
  tipster: { speaker: process.env.TTS_SPEAKER_TIPSTER || 'aditya', pace: 1.2 },
  app: { speaker: process.env.TTS_SPEAKER_APP || 'simran', pace: 0.95 },
};

export const canSpeak = () => sarvam.hasKey();
export const canListen = () => sarvam.hasKey();

export async function tts(text, voice = 'app', opts = {}) {
  const v = VOICES[voice] || VOICES.app;
  return sarvam.tts(text, { ...v, ...opts });
}

export const stt = (audioB64, mime, lang = 'hi') => sarvam.stt(audioB64, mime, lang);
