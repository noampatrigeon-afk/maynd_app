import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
const w=dom.window; const errs=[];
w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true;
w.addEventListener('error',e=>errs.push((e.message||String(e.error))+' @'+(e.lineno||'')));
w.addEventListener('unhandledrejection',e=>errs.push('p:'+e.reason));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(80);
const S=()=>w.eval('state');

console.log('\n=== 1. direction artistique ===');
ok(html.includes('--tint-accueil:#F4EFFF') && html.includes('--tint-chat:#EDF3FF') && html.includes('--tint-obj:#FFF3EC'),'trois teintes d\'onglet définies');
ok(/#tab-accueil\{background:var\(--tint-accueil\)\}/.test(html),'accueil teinté');
ok(/#tab-chat\{background:var\(--tint-chat\)\}/.test(html),'chat teinté');
ok(/#tab-objectifs\{background:var\(--tint-obj\)\}/.test(html),'objectifs teinté');
ok(html.includes('--orange:#FE6601') && html.includes('--blue:#224CF2'),'accents orange et bleu présents');
ok(html.includes('--ink:#000000'),'noir pur');
const grads=(html.match(/(linear|radial)-gradient/g)||[]).length;
const masks=(html.match(/mask-image:linear-gradient/g)||[]).length;
ok(grads-masks===0,'zéro dégradé visuel (reste '+masks+' masques de fondu)');

console.log('\n=== 2. profondeur ===');
ok(html.includes('--sh-sm:0 1px 3px rgba(111,47,192'),'ombres teintées marque (légère)');
ok(html.includes('--sh:0 2px 6px rgba(111,47,192'),'ombres teintées marque (carte)');
const shadowed=(html.match(/box-shadow:var\(--sh(-sm|-lg)?\)/g)||[]).length;
ok(shadowed>=6,'ombres appliquées aux composants ('+shadowed+' règles)');
ok(html.includes('--r:28px'),'rayons de carte agrandis');

console.log('\n=== 3. micro-interactions ===');
ok(/button:active[^{]*\{transform:scale\(\.97\)\}/.test(html),'retour au clic global');
ok(html.includes('@keyframes mFade') && html.includes('@keyframes mPop'),'animations clés ajoutées');
ok(html.includes('prefers-reduced-motion'),'réglage système respecté');

console.log('\n=== 4. révélation au défilement ===');
w.enterApp(false); await wait(30);
w.showTab('objectifs'); await wait(20);
const pad=w.$('obj-pad');
const kids=[...pad.children];
ok(kids.length>0,'contenu objectifs rendu ('+kids.length+' blocs)');
ok(kids.filter(e=>e.classList.contains('rv')).length>0,'éléments marqués pour révélation');
ok(kids.filter(e=>e.classList.contains('in')).length>0,'éléments révélés');
ok(typeof w.revealIn==='function' && typeof w.revealActivePad==='function','fonctions de révélation exposées');

console.log('\n=== 5. bruitages ===');
ok(S().sound===true,'bruitages activés par défaut');
ok(typeof w.sfx==='function','synthèse sonore disponible');
let crashed=false; try{ w.sfx('tap'); w.sfx('ok'); }catch(e){ crashed=true; }
ok(!crashed,'aucun plantage sans moteur audio');
w.openProfile(); await wait(20);
const pb=w.$('profile-body').innerHTML;
ok(pb.includes('Bruitages'),'réglage Bruitages présent dans Réglages');
ok(pb.includes('toggleSound'),'interrupteur branché');
ok(/agx-tgl on/.test(pb),'interrupteur affiché activé');
w.toggleSound(); await wait(10);
ok(S().sound===false,'extinction des bruitages');
ok(!/agx-tgl on/.test(w.$('profile-body').innerHTML),'interrupteur affiché éteint');
w.toggleSound(); ok(S().sound===true,'réactivation');

console.log('\n=== 6. onglets et rendus intacts ===');
w.showTab('accueil'); await wait(20);
ok(w.$('tab-accueil').classList.contains('active'),'bascule accueil');
w.showTab('chat'); await wait(20);
ok(w.$('tab-chat').classList.contains('active'),'bascule chat');
w.showTab('objectifs'); await wait(20);
ok(w.$('obj-pad').innerHTML.length>200,'objectifs toujours rendus');

console.log('\n=== 7. boutons & erreurs ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok(errs.length===0,'aucune erreur runtime'+(errs.length?' : '+errs.slice(0,4).join(' | '):''));

console.log('\n──────────────────────────────');
console.log('  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
console.log('──────────────────────────────');
process.exit(fail?1:0);
