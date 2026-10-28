const fs = require('fs');
const f = fs.readFileSync('index.html', 'utf8');
const m = f.match(/name="description" content="([^"]*)"/);
console.log('DESCRIPTION:', m?.[1]);
const t = f.match(/<title>([^<]*)<\/title>/);
console.log('TITLE:', t?.[1]);
