#!/usr/bin/env node
/** Lance toutes les suites et agrège les résultats. */
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const files = readdirSync(dir).filter(f => f.endsWith('.mjs') && f !== 'run.mjs').sort();
let total = 0, failed = 0, suites = 0;

for (const f of files) {
  const r = spawnSync('node', [path.join(dir, f)], { encoding: 'utf8' });
  const out = r.stdout || '';
  const m = out.match(/(\d+) réussis, (\d+) échoués/) || out.match(/(\d+) réussis, (\d+) échoués/);
  const p = m ? +m[1] : 0, e = m ? +m[2] : 0;
  total += p; failed += e; suites++;
  const label = f.replace('.mjs', '');
  console.log(`${e === 0 ? '  OK  ' : ' ÉCHEC'}  ${label.padEnd(38)} ${String(p).padStart(3)} vérifications${e ? `, ${e} échouées` : ''}`);
  if (e) console.log(out.split('\n').filter(l => l.includes('✗')).join('\n'));
}
console.log(`\n${suites} suites — ${total} vérifications, ${failed} échec${failed > 1 ? 's' : ''}`);
process.exit(failed ? 1 : 0);
