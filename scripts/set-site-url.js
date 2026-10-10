#!/usr/bin/env node
// Usage: node scripts/set-site-url.js https://your-project.vercel.app
// Replaces the placeholder address in the pages, sitemap and robots.txt.
const fs = require('fs');
const path = require('path');
const arg = process.argv[2];
if (!arg || !/^https?:\/\/[^\s/]+$/.test(arg.replace(/\/$/, ''))) {
  console.error('Give the full site address, for example:\n  node scripts/set-site-url.js https://chitta-studios.vercel.app');
  process.exit(1);
}
const url = arg.replace(/\/$/, '');
const root = path.join(__dirname, '..', 'public');
let changed = 0;
for (const f of ['index.html', 'privacy.html', 'sitemap.xml', 'robots.txt']) {
  const p = path.join(root, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.split(/https:\/\/YOUR-SITE\.vercel\.app|https?:\/\/[a-z0-9.-]+\.vercel\.app(?=[\/"<\n])/g).join(url);
  if (after !== before) { fs.writeFileSync(p, after); changed++; }
}
console.log(`Updated ${changed} file(s) to ${url}`);
