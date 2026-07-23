#!/usr/bin/env node
/**
 * MAYND — assemblage
 * Concatène src/styles/*.css et src/scripts/*.js dans src/index.html
 * et écrit le fichier autonome dist/index.html.
 *
 * L'ordre alphabétique des fichiers EST l'ordre d'exécution. Il est
 * significatif : plusieurs fonctions sont redéfinies par les couches
 * successives, et c'est la dernière définition qui s'applique.
 * Ne jamais renuméroter un fichier sans vérifier les tests.
 */
import fs from 'fs';
import path from 'path';

const root = path.dirname(new URL(import.meta.url).pathname);
const read = (dir) => fs.readdirSync(path.join(root, dir))
  .filter(f => !f.startsWith('.'))
  .sort()
  .map(f => fs.readFileSync(path.join(root, dir, f), 'utf8'));

const styles  = read('src/styles').join('');
const scripts = read('src/scripts').join('');

let html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
if (!html.includes('/* @inject:styles */') || !html.includes('/* @inject:scripts */')) {
  console.error('Marqueurs d\'injection absents de src/index.html'); process.exit(1);
}
html = html.replace('/* @inject:styles */', () => styles)
           .replace('/* @inject:scripts */', () => scripts);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log(`dist/index.html écrit — ${html.split('\n').length} lignes, ${(html.length/1024).toFixed(0)} Ko`);
