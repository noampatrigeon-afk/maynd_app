#!/usr/bin/env node
/** APP MIX — assemble index.html, les styles et les scripts en un seul fichier : app-mix/dist/index.html.
 *  Les scripts restent dans des balises séparées, dans le même ordre : aucune fonction n'est redéfinie,
 *  l'ordre ne porte donc que les dépendances de données. Lancer depuis la racine : node app-mix/assembler.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lire = f => fs.readFileSync(path.join(ici, f), 'utf8');
let html = lire('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">\s*/g, (_, f) => '<style>\n' + lire(f) + '\n</style>\n');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => '<script>\n' + lire(f) + '\n</script>');
fs.mkdirSync(path.join(ici, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ici, 'dist', 'index.html'), html, 'utf8');
console.log('app-mix/dist/index.html écrit — ' + html.split('\n').length + ' lignes, ' + Math.round(Buffer.byteLength(html, 'utf8') / 1024) + ' Ko');
