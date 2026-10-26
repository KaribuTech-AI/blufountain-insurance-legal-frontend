// Fails when the files a first visit must download grow past the budget (E10.4).
//
//   node scripts/check-budget.mjs <dist folder> [budget in KB]
//
// The public apps are for basic Android phones on slow 3G. 100 KB of compressed script is about
// five seconds there; everything else (styles, markup, icons) is small enough to ignore but is
// counted so it cannot creep.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, extname } from 'node:path';

const dir = process.argv[2];
const budgetKb = Number(process.argv[3] ?? 100);
if (!dir) {
  console.error('Usage: node scripts/check-budget.mjs <dist folder> [budget in KB]');
  process.exit(2);
}

function walk(folder) {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const COUNTED = new Set(['.js', '.css', '.html']);
const rows = walk(dir)
  .filter((f) => COUNTED.has(extname(f)))
  .map((f) => ({
    file: f.replace(dir, '').replace(/^[\\/]/, ''),
    kb: gzipSync(readFileSync(f)).length / 1024,
  }))
  .sort((a, b) => b.kb - a.kb);

const total = rows.reduce((n, r) => n + r.kb, 0);
for (const r of rows) console.log(`${r.kb.toFixed(1).padStart(7)} KB  ${r.file}`);
console.log(`${total.toFixed(1).padStart(7)} KB  total gzip (budget ${budgetKb} KB)`);

if (total > budgetKb) {
  console.error(`Over budget by ${(total - budgetKb).toFixed(1)} KB.`);
  process.exit(1);
}
