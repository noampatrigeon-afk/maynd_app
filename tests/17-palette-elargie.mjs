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
w.enterApp(false); await wait(30); w.eval("state.tier='plus'");

console.log('\n=== 1. vert et jaune ajoutés ===');
ok(w.eval("MC.green")==='#00A862' && w.eval("MC.yellow")==='#FFC400','vert et jaune définis');
ok(html.includes('--green:#00A862') && html.includes('--yellow:#FFC400'),'jetons de couleur');
ok(w.eval("QTHEME.length")===7,'7 couleurs en rotation');
const bgs=w.eval("QTHEME.map(function(t){return t.bg}).join(',')");
ok(bgs.includes('#00A862') && bgs.includes('#FFC400'),'vert et jaune dans les questionnaires');
ok(w.eval("MC.violet")==='#974AF0' && w.eval("QTHEME[0].bg")==='#974AF0','violet MAYND toujours en tête');

console.log('\n=== 2. équilibre : une paire par carte, pas de surcharge ===');
w.showTab('accueil'); await wait(20);
const cards=[...w.$('jrow').querySelectorAll('.jcard')];
ok(cards.length===5,'5 cartes');
const pal=['#974AF0','#224CF2','#00A862','#FE6601','#FFC400','#6F2FC0','#FFFFFF','#FFDBC2','#E8467F','#FFAFCF','#8FB4FF'];
const bg=cards.map(c=>c.style.getPropertyValue('--jc'));
const ac=cards.map(c=>c.style.getPropertyValue('--ja'));
ok(new Set(bg).size===5,'5 fonds distincts : '+bg.join(' '));
ok(bg.every(c=>pal.includes(c)) && ac.every(c=>pal.includes(c)),'uniquement des couleurs de la palette');
ok(cards.every(c=>c.style.getPropertyValue('--jc')!==c.style.getPropertyValue('--ja')),'chaque carte = 2 couleurs qui s\'accordent');
ok(bg.includes('#00A862') && ac.includes('#FFC400'),'vert en fond et jaune en accent sur l\'accueil');

console.log('\n=== 3. lisibilité sur fond clair ===');
const lc=cards.find(c=>c.style.getPropertyValue('--jc')==='#E8467F');
ok(lc && !lc.classList.contains('dark'),'carte rose en texte blanc');
ok(html.includes('.jcard.dark .jcard-t{color:#000}'),'règle de texte noir');
ok(w.eval("QTHEME[5].dark")===true,'question jaune en texte noir');
ok(html.includes('#quiz.tinted.dark .qz2-q'),'questionnaire clair lisible');
ok(w.eval("OB_DARK['ob-pay-success']")===true,'écran de paiement jaune en texte noir');

console.log('\n=== 4. accueil aéré ===');
ok(html.includes('#tab-accueil .section-head{margin:32px 2px 14px}'),'sections espacées');
ok(html.includes('Aller vers'),'les cartes ont leur propre section');
const pad=w.$('tab-accueil').innerHTML;
ok(pad.indexOf('Aller vers')>pad.indexOf('mia-cta'),'séparation entre MIA et les cartes');
ok(html.includes('#tab-accueil .greet-hi{font-size:29px'),'salutation agrandie');
ok(html.includes('#tab-accueil .mia-cta{padding:20px 18px'),'carte MIA plus généreuse');

console.log('\n=== 5. couleur dans inscription et paiement ===');
ok(w.eval("Object.keys(OB_SAT).length")===9,'9 écrans d\'inscription en couleur pleine');
const obc=w.eval("Object.keys(OB_SAT).map(function(k){return OB_SAT[k]}).join(',')");
ok(obc.includes('#000000') && obc.includes('#FFC400') && obc.includes('#FE6601'),'noir, jaune et orange dans l\'inscription');
w.obShow('ob-account-success'); await wait(20);
ok(w.$('onboarding').classList.contains('sat') && /151, 74, 240/.test(w.$('onboarding').style.background),'création de compte en violet MAYND');
w.obShow('ob-pay-success'); await wait(20);
ok(w.$('onboarding').classList.contains('dark'),'paiement réussi en jaune, texte noir');
w.obShow('ob-signup'); await wait(20);
ok(!w.$('onboarding').classList.contains('sat') && !w.$('onboarding').classList.contains('dark'),'écrans de saisie remis au clair');
ok(html.includes('.formula.plus.on{border-color:var(--orange)'),'formules colorées');
ok(html.includes('.ob-plan.plus.on{border-color:var(--orange)'),'plans de paiement colorés');

console.log('\n=== 6. vert et jaune répartis dans l\'app ===');
w.enterApp(false); await wait(20); w.eval("state.tier='plus'; state.questionnaireDone=true; state.cap='x'; state.streak=8");
w.showTab('objectifs'); await wait(20);
ok(html.includes('.quest.done .qc{background:var(--green)}'),'quêtes validées en vert');
ok(html.includes('.pro-st.signed{color:#fff;background:var(--green)}'),'feuille de route signée en vert');
ok(html.includes('.pro-st.prep{color:#000;background:var(--yellow)}'),'feuille en préparation en jaune');
ok(html.includes('.streak-pill{background:var(--yellow-soft)'),'série en jaune');
ok(html.includes('.agx-row.plus{background:var(--yellow-soft)'),'agents MAYND+ en jaune');

console.log('\n=== 7. questionnaires : la rotation tourne ===');
w.startObjQuiz(); await wait(20);
const or=w.$('orient');
const seen=[];
for(let i=0;i<5;i++){ seen.push(or.style.background); if(i===0){ w.objqToggle(0); w.objqAdvance(); } else { w.objqPick(0); } await wait(210); }
ok(new Set(seen).size>=4,'les questions changent de couleur ('+new Set(seen).size+' couleurs vues)');
w.objqClose();

console.log('\n=== 8. non-régression ===');
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'toujours zéro dégradé visuel');
w.showTab('objectifs'); await wait(20);
ok(w.$('obj-pad').innerHTML.includes('Ta supervision'),'supervision intacte');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok(errs.length===0,'aucune erreur runtime'+(errs.length?' : '+errs.slice(0,4).join(' | '):''));

console.log('\n  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
process.exit(fail?1:0);
