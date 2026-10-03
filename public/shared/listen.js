// Listening: record → /api/stt (Sarvam Saarika) → the phone's own recognition → typing always works.
// Returns a controller: call .stop() to finish; it resolves to the transcript ('' on failure).
export async function listen(lang = 'hi') {
  if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      let finish;
      const done = new Promise((res) => (finish = res));
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        finish(await transcribe(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), lang));
      };
      rec.start();
      const auto = setTimeout(() => rec.state === 'recording' && rec.stop(), 15000);
      return { stop: () => { clearTimeout(auto); if (rec.state === 'recording') rec.stop(); return done; } };
    } catch { /* mic blocked → try browser recognition */ }
  }
  return browserListen(lang);
}

async function transcribe(blob, lang) {
  try {
    const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    const r = await fetch('/api/stt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: b64, mime: blob.type, lang }) });
    if (r.ok) return (await r.json()).transcript || '';
  } catch {}
  return '';
}

function browserListen(lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return { stop: async () => '' };
  const sr = new SR();
  sr.lang = { en: 'en-IN', mr: 'mr-IN' }[lang] || 'hi-IN';
  let text = '', finish;
  const done = new Promise((res) => (finish = res));
  sr.onresult = (e) => { text = Array.from(e.results).map((r) => r[0].transcript).join(' '); };
  sr.onend = () => finish(text);
  sr.onerror = () => finish(text);
  sr.start();
  return { stop: () => { try { sr.stop(); } catch {} return done; } };
}

// POST helper shared by both apps.
export async function api(name, body, ms = 25000) {
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), ms);
    const r = await fetch('/api/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    clearTimeout(tm);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export async function health() {
  try { const r = await fetch('/api/health', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
}
