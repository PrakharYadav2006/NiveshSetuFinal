// Fails if the old product name appears anywhere user-facing (npm test runs this).
// The only allowed occurrences are lines marked "brand-allow" (the one-time storage migration).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLD = new RegExp(['r', 'uko'].join('') + '|' + ['र', 'ुको'].join(''), 'i'); // built so this file does not match itself
const SKIP = new Set(['node_modules', '.git', 'audio', 'PROJECT_CONTEXT.md', 'check-brand.js']);
const EXT = /\.(js|mjs|html|css|json|webmanifest|md)$/;
const hits = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    if (SKIP.has(f) || f.startsWith('.env')) continue;
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!EXT.test(f)) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (OLD.test(line) && !/brand-allow/.test(line) && !isAllowedWord(line)) hits.push(`${path.relative(root, p)}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
})(root);
// "रुको" is also an ordinary Hindi word ("wait"). It is allowed inside a sentence, never as a name or title.
function isAllowedWord(line) { return /रुको,/.test(line) && !/(app|title|name|Market|बाज़ार)\s*[:=]/i.test(line); }
if (hits.length) { console.log('✗ Old product name found:\n  ' + hits.join('\n  ')); process.exit(1); }
console.log('✓ Brand check: no old product name');
