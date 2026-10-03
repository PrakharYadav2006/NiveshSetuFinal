// Checks every SEBI resource link in public/shared/lessons.js.   npm run check:links
// Run on a machine with internet (the build sandbox cannot reach investor.sebi.gov.in).
// Not part of `npm test`; run it before recording and before submission.
//
//  A. Listed     — the exact pageTitle and the file path both appear on SEBI's video page, in the same block.
//  B. Reachable  — the file answers 200/206 with video/mp4 to a Range request (no full download); size saved.
//  (3) Rules     — match is direct|related, pageTitle/section/publisher present, related has a relatedNote,
//                  and each variant language is listed on the page for that title.
//  C and D (watching the video, checking language and wording) are done by a person, then
//  `verified: true`, `watchedBy` and `checkedOn` are filled in by hand in lessons.js.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LESSONS, SEBI_VIDEO_PAGE, resourceUrl } from '../public/shared/lessons.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
const LANG_WORD = { hi: /hindi|हिन्दी|हिंदी/i, en: /english/i };

let page = '';
try {
  const r = await fetch(SEBI_VIDEO_PAGE);
  page = decode(await r.text());
  console.log(`SEBI page: ${r.status}, ${Math.round(page.length / 1024)} KB`);
  if (!r.ok) { console.log('✗ The SEBI page could not be read from this network. Run this on a normal internet connection.'); process.exit(1); }
} catch (e) { console.log('✗ Could not fetch the SEBI page:', e.message); process.exit(1); }

let fail = 0;
const sizes = {};
const bad = (id, msg) => { fail++; console.log(`  ✗ ${id}: ${msg}`); };
for (const [id, l] of Object.entries(LESSONS)) {
  const r = l.resource;
  if (!r) { console.log(`· ${id}: written lesson only`); continue; }
  console.log(`· ${id}: "${r.pageTitle}" (${r.match}${r.verified ? ', verified' : ', not verified'})`);
  if (!['direct', 'related'].includes(r.match)) bad(id, `match must be direct or related, got "${r.match}"`);
  for (const k of ['pageTitle', 'section', 'publisher']) if (!r[k]) bad(id, `${k} is empty`);
  if (r.match === 'related' && !r.relatedNote) bad(id, 'related match needs a relatedNote');
  const at = page.indexOf(r.pageTitle);
  if (at < 0) { bad(id, 'A. title not found on the SEBI page'); continue; }
  const block = page.slice(Math.max(0, at - 1500), at + 3000);
  for (const [lang, v] of Object.entries(r.variants || {})) {
    if (!v?.path) continue;
    if (!block.includes(v.path)) bad(id, `A. ${lang} path not found next to the title`);
    if (!LANG_WORD[lang].test(block)) bad(id, `(3) the page does not list a ${lang} version for this title`);
    try {
      const res = await fetch(resourceUrl(v.path), { headers: { Range: 'bytes=0-1023' } });
      const type = res.headers.get('content-type') || '';
      const total = +(res.headers.get('content-range') || '').split('/')[1] || +res.headers.get('content-length') || 0;
      if (![200, 206].includes(res.status) || !/video\/mp4/.test(type)) bad(id, `B. ${lang} file answered ${res.status} ${type}`);
      else { sizes[v.path] = total; console.log(`  ✓ ${lang}: reachable, ${Math.round(total / 1e6)} MB`); }
      res.body?.cancel?.();
    } catch (e) { bad(id, `B. ${lang} file: ${e.message}`); }
  }
  if (r.verified && !(r.watchedBy && r.checkedOn)) bad(id, 'verified: true needs watchedBy and checkedOn (checks C and D)');
}
writeFileSync(path.join(root, 'public/shared/lessons.sizes.json'), JSON.stringify(sizes, null, 1));
console.log(fail ? `\n${fail} problem(s). Fix them before setting verified: true.` : '\n✓ All listed links check out. Remember checks C and D are by hand.');
process.exit(fail ? 1 : 0);
