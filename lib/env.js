// Tiny .env loader (no dependency). Tolerant of Windows quirks:
//  - Notepad saving ".env" as ".env.txt"
//  - CRLF line endings, a BOM, trailing spaces after the key, quotes around the value
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const CANDIDATES = ['.env', '.env.txt', '.env.local'];

export function loadEnv(dir) {
  for (const name of CANDIDATES) {
    const file = path.join(dir, name);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
    for (const line of text.split(/\r?\n/)) {
      if (/^\s*#/.test(line)) continue;
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const v = m[2].replace(/^["']|["']$/g, '').trim();
      if (v && !process.env[m[1]]) process.env[m[1]] = v;
    }
    return name;
  }
  return null;
}

// Shows enough to spot a typo without printing the secret.
export function describeKey(k = process.env.SARVAM_API_KEY) {
  if (!k) return 'missing';
  const ok = /^sk_[A-Za-z0-9]{8}_[A-Za-z0-9]{24}$/.test(k);
  return `${k.slice(0, 3)}…${k.slice(-3)} (${k.length} chars${ok ? ', format looks right' : ', FORMAT LOOKS WRONG — expected sk_ + 8 chars + _ + 24 chars'})`;
}
