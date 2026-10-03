// Pre-generate scripted voice lines so the apps speak offline, instantly, at zero per-user cost.
//   npm run audio          → both apps
//   npm run audio demo     → demo-run only, Hindi + English (two voices: Aditya the tipster, Simran the guide)
//   npm run audio sim      → simulator onboarding questions (Hindi + English)
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadEnv } = await import('../lib/env.js');
loadEnv(root);
const { tts } = await import('../lib/speech/index.js');
const which = process.argv[2] || 'all';
const jobs = [];

if (which === 'all' || which === 'demo') {
  const { VOICE_LINES } = await import('../public/demo-run/content.js');
  for (const [id, line] of Object.entries(VOICE_LINES)) for (const lang of ['hi', 'en', 'mr']) jobs.push({ dir: 'public/demo-run/audio', id: `${id}_${lang}`, text: line.text[lang], voice: line.voice, lang });
}
if (which === 'all' || which === 'sim') {
  const { QUESTIONS } = await import('../public/simulator/data.js');
  for (const q of QUESTIONS) for (const lang of ['hi', 'en', 'mr']) jobs.push({ dir: 'public/simulator/audio', id: `q_${q.id}_${lang}`, text: q.q[lang], voice: 'app', lang });
  // First-time tab tips (3 tabs × 2 languages)
  const { STRINGS } = await import('../public/simulator/i18n.js');
  const { TIP_TABS } = await import('../public/shared/tips.js');
  for (const tab of TIP_TABS) for (const lang of ['hi', 'en', 'mr']) jobs.push({ dir: 'public/simulator/audio', id: `tip_${tab}_${lang}`, text: STRINGS['tip_' + tab][lang].replace(/\n/g, ' '), voice: 'app', lang });
}

const manifests = {};
let ok = 0, fail = 0;
for (const j of jobs.filter((x) => x.text)) {
  const outDir = path.join(root, j.dir);
  await mkdir(outDir, { recursive: true });
  try {
    let out, ext = 'mp3';
    try { out = await tts(j.text, j.voice, { codec: 'mp3', sampleRate: 22050, lang: j.lang }); }
    catch { out = await tts(j.text, j.voice, { sampleRate: 16000, lang: j.lang }); ext = 'wav'; }
    if (!out.audio) throw new Error('empty audio');
    await writeFile(path.join(outDir, `${j.id}.${ext}`), Buffer.from(out.audio, 'base64'));
    (manifests[j.dir] ||= {})[j.id] = `${j.id}.${ext}`;
    ok++; console.log('✓', j.dir.split('/')[1], j.id);
  } catch (e) { fail++; console.log('✗', j.id, e.message); }
}
for (const [dir, m] of Object.entries(manifests)) {
  const p = path.join(root, dir, 'manifest.json');
  const prev = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  await writeFile(p, JSON.stringify({ ...prev, ...m }, null, 1));
}
console.log(`\n${ok} बनीं, ${fail} फ़ेल।`);
