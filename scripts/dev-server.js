// Optional local preview: copy .env.example to .env, then run `npm run dev`.
// Serves /public and the /api/order function on http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const handler = require('../api/order.js');
const root = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const headers = (JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8')).headers || [])[0].headers;
http.createServer((req, res) => {
  headers.forEach((h) => res.setHeader(h.key, h.value));
  const url = req.url.split('?')[0];
  if (url === '/api/order') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { req.body = raw ? JSON.parse(raw) : {}; } catch (_) { req.body = null; }
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      handler(req, res);
    });
    return;
  }
  let file = path.join(root, url === '/' ? 'index.html' : url);
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('Preview on http://localhost:3000'));
