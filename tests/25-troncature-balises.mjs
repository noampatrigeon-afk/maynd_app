import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window;
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true; w.alert=()=>{};
  return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let w=boot(); await wait(90);
const parse=(raw)=>w.eval('parseSignals('+JSON.stringify(raw)+')');

console.log('\n=== BALISES TRONQUÉES PAR LE BUDGET DE LONGUEUR (max_tokens) ===');

// Bug réel remonté par un utilisateur : la réponse est coupée par max_tokens en plein
// milieu d'un [[ACTE:...]], la balise ouverte fuitait telle quelle dans la bulle affichée.
let r=parse("Tu peux essayer d'en parler à quelqu'un. [[ACTE:aller au CCAS ou");
ok(!/\[\[/.test(r.clean), 'un [[ACTE:...] tronqué en fin de réponse ne fuite pas dans le texte affiché');
ok(r.actes.length===0, 'un acte tronqué n\'est pas ajouté à la liste des actes (incomplet, illisible)');
ok(r.clean.startsWith("Tu peux essayer"), 'le texte valide avant la balise tronquée est conservé');

r=parse("On en reparle. [[ANCRAGE:kael:for");
ok(!/\[\[/.test(r.clean), 'un [[ANCRAGE:...] tronqué ne fuite pas');
ok(!r.ancrage, 'un ancrage tronqué n\'est pas retenu');

r=parse("Je fais venir quelqu'un. [[SUGGEST:ka");
ok(!/\[\[/.test(r.clean), 'un [[SUGGEST:...] tronqué ne fuite pas');
ok(!r.joinId, 'un accompagnant suggéré par une balise tronquée n\'est pas rejoint');

// Non-régression : les balises complètes continuent d'être capturées et retirées normalement.
r=parse("D'accord. [[ACTE:aller au CCAS lundi]] [[ANCRAGE:kael:forte]] [[SUGGEST:kael]]");
ok(r.clean==='D\'accord.', 'les balises complètes sont toujours retirées du texte affiché');
ok(r.actes[0]==='aller au CCAS lundi', 'un acte complet est toujours capturé');
ok(!!r.ancrage && r.ancrage.terrain==='kael' && r.ancrage.certitude==='forte', 'un ancrage complet est toujours capturé');
ok(r.joinId==='kael', 'un SUGGEST complet est toujours capturé');

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
