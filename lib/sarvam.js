// Minimal Sarvam client. Docs: https://docs.sarvam.ai
// The only AI provider: chat (the brain), Bulbul TTS (voice: Simran / Aditya), Saarika STT.
const BASE = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';
const key = () => process.env.SARVAM_API_KEY;
const LANG_CODE = { hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN' };
export const hasKey = () => !!key();

async function post(path, body, isForm = false) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'api-subscription-key': key(), ...(isForm ? {} : { 'Content-Type': 'application/json' }) },
    body: isForm ? body : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error(`Sarvam ${path} ${r.status}: ${text.slice(0, 300)}`);
    err.status = r.status;
    throw err;
  }
  return JSON.parse(text);
}

// Chat. Older models (sarvam-m, sarvam-30b) are deprecated; 105b models are current.
// reasoning_effort 'low' keeps answers fast; if a model rejects it we retry without.
let effortOk = true;
export async function chat(messages, { maxTokens = 1500, temperature = 0.3 } = {}) {
  const models = [process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations', 'sarvam-105b'];
  const effort = process.env.SARVAM_REASONING || 'low';
  let lastErr;
  for (const model of [...new Set(models)]) {
    try {
      const body = { model, messages, max_tokens: Math.max(maxTokens, 1200), temperature };
      if (effortOk && effort !== 'default') body.reasoning_effort = effort;
      let out;
      try { out = await post('/v1/chat/completions', body); }
      catch (e) {
        if ([400, 422].includes(e.status) && /reasoning/i.test(e.message)) { effortOk = false; delete body.reasoning_effort; out = await post('/v1/chat/completions', body); }
        else throw e;
      }
      const text = stripThinking(out?.choices?.[0]?.message?.content ?? '');
      if (!text) throw Object.assign(new Error(`Sarvam ${model}: empty answer (reasoning used all tokens?)`), { status: 204 });
      return text;
    } catch (e) {
      lastErr = e;
      if (![400, 404, 422, 204].includes(e.status)) break; // only retry on "bad model"-type errors
    }
  }
  throw lastErr;
}

export function stripThinking(s) {
  return String(s).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*<\/think>/i, '').trim();
}

// Text-to-speech (Bulbul v3). Returns { audio: base64, mime }. v3 has no pitch control.
export async function tts(text, { speaker, pace = 1, codec, sampleRate = 22050, model, lang = 'hi' } = {}) {
  const body = {
    text: text.slice(0, 2400),
    target_language_code: LANG_CODE[lang] || 'hi-IN',
    model: model || process.env.SARVAM_TTS_MODEL || 'bulbul:v3',
    speaker,
    pace,
    speech_sample_rate: sampleRate,
  };
  if (codec) body.output_audio_codec = codec;
  const out = await post('/text-to-speech', body);
  return { audio: out.audios?.[0], mime: codec === 'mp3' ? 'audio/mpeg' : 'audio/wav' };
}

// Speech-to-text (Saarika). audioB64 = base64 of what the browser recorded (webm/ogg/wav).
export async function stt(audioB64, mime = 'audio/webm', lang = 'hi') {
  const form = new FormData();
  const ext = mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : mime.includes('mp4') ? 'm4a' : 'webm';
  form.append('file', new Blob([Buffer.from(audioB64, 'base64')], { type: mime.split(';')[0] }), `speech.${ext}`);
  form.append('model', process.env.SARVAM_STT_MODEL || 'saarika:v2.5');
  form.append('language_code', LANG_CODE[lang] || 'hi-IN');
  const out = await post('/speech-to-text', form, true);
  return out.transcript || '';
}
