#!/usr/bin/env node
/**
 * MAYND — reconstruction automatique
 * Surveille src/ et relance build.mjs à chaque modification,
 * pour que dist/index.html reste à jour (et que Go Live recharge tout seul).
 */
import { watch } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');

function build() {
  const r = spawnSync(process.execPath, [path.join(root, 'build.mjs')], { stdio: 'inherit' });
  if (r.status !== 0) console.error('Échec du build.');
}

build();
console.log(`Surveillance de src/ pour reconstruction automatique (Ctrl+C pour arrêter)...`);

let timer = null;
watch(src, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(build, 120);
});
