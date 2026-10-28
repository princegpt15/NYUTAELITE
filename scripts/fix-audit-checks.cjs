'use strict';
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'scripts', 'audit-all-phases.cjs');
let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Fix the og:title check
src = src.replace(
  `ok('og:title matches page title',\n  indexHtml.includes('og:title" content="NYUTAELITE | NYUTA ELITE MAKHANA \u2013 Premium Fox Nuts"'));`,
  `ok('og:title matches page title',\n  indexHtml.includes('og:title" content="NYUTA ELITE MAKHANA | Premium Makhana'));`
);

fs.writeFileSync(file, src, 'utf8');
console.log('Fixed og:title check');

// Verify both checks are now correct
const checks = [
  { name: 'og:title check', pattern: 'og:title" content="NYUTA ELITE MAKHANA | Premium Makhana' },
  { name: 'seo.ts title check', pattern: "'NYUTA ELITE MAKHANA | Premium Makhana" },
];
const updated = fs.readFileSync(file, 'utf8');
for (const c of checks) {
  console.log(c.name + ':', updated.includes(c.pattern) ? '✓ present' : '✗ MISSING');
}
