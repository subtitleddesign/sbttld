// Turns the single-file build into an artifact page: the host supplies
// <!doctype>, <html>, <head> and <body>, so keep only what goes inside.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const page = [
  '<title>sbttld Studio</title>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">',
  pick(/<style[\s\S]*?<\/style>/g),
  '<div id="root"></div>',
  pick(/<script type="module"[\s\S]*?<\/script>/g),
].join('\n');
writeFileSync('dist-artifact/studio.html', page);
console.log(`dist-artifact/studio.html ${(page.length / 1024).toFixed(0)} KB`);
