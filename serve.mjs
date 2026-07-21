#!/usr/bin/env node
/** Petit serveur local pour ouvrir l'app dans le navigateur. */
import http from 'http';
import fs from 'fs';
import path from 'path';

const root = path.dirname(new URL(import.meta.url).pathname);
const PORT = process.env.PORT || 5173;
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
                '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/dist/maynd.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Introuvable');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`MAYND sur http://localhost:${PORT}`));
