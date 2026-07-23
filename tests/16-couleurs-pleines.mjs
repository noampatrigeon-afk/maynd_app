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

console.log('\n=== 1. le violet MAYND est la couleur maîtresse ===');
ok(w.eval("QTHEME[0].bg")==='#974AF0','1re couleur = violet MAYND');
ok(w.eval("JCARDS[0].c")==='#974AF0','1re carte = violet MAYND');
const v=(html.match(/#974AF0/g)||[]).length;
ok(v>=12,'violet MAYND présent partout ('+v+' occurrences)');
ok(html.includes('.cap-card{background:var(--violet)}'),'carte cap en violet plein');
ok(html.includes('.obj-hero{background:var(--violet-deep)}'),'bloc progression en violet profond');

console.log('\n=== 2. couleurs pleines, pas de pastel délavé ===');
ok(w.eval("QTHEME.map(function(t){return t.bg}).join(',')")==='#974AF0,#224CF2,#E8467F,#00A862,#FE6601,#FFC400,#6F2FC0','les 7 couleurs de la palette en rotation');
ok(!/QTHEME[\s\S]{0,200}#F1E8FF/.test(html),'plus de fonds pâles dans les questionnaires');
ok(html.includes('.pf-card{background:var(--blue)'),'carte profil en bleu plein');

console.log('\n=== 3. cartes pleine couleur sur l\'accueil ===');
w.showTab('accueil'); await wait(20);
const row=w.$('jrow');
ok(!!row,'rangée présente');
const cards=[...row.querySelectorAll('.jcard')];
ok(cards.length===5,'5 cartes colorées');
const colors=cards.map(c=>c.style.getPropertyValue('--jc'));
ok(new Set(colors).size===5,'5 couleurs distinctes : '+colors.join(' '));
ok(colors.every(c=>['#974AF0','#224CF2','#00A862','#FE6601','#FFC400','#6F2FC0','#FFFFFF','#FFDBC2','#E8467F','#FFAFCF','#8FB4FF'].includes(c)),'uniquement des couleurs de la palette');
ok(row.innerHTML.includes('jcard-lb') && row.innerHTML.includes('jcard-go'),'étiquette blanche + flèche blanche');
ok(html.includes('.jcard::before') && html.includes('.jcard::after'),'formes rondes qui se chevauchent');
ok(!/joySVG\(/.test(w.$('or-inner').innerHTML||''),'aucun personnage');

console.log('\n=== 4. questionnaires en couleur pleine ===');
w.startObjQuiz(); await wait(20);
const or=w.$('orient');
ok(or.classList.contains('tinted'),'écran teinté en couleur pleine');
ok(or.style.background==='rgb(151, 74, 240)'||/974AF0/i.test(or.style.background),'1re question en violet MAYND');
ok(!/qz2-ico/.test(w.$('or-inner').innerHTML),'plus d\'icône personnage');
w.objqToggle(0); w.objqAdvance(); await wait(20);
ok(/rgb\(34, 76, 242\)/.test(or.style.background)||/224CF2/i.test(or.style.background),'2e question en bleu');
w.objqAdvance(); await wait(20);
ok(/rgb\(232, 70, 127\)/.test(or.style.background)||/E8467F/i.test(or.style.background),'3e question en rose');
ok(html.includes('#quiz.tinted .qz2-opt.sel,#orient.tinted .qz2-opt.sel{background:#000'),'réponse choisie en noir plein');
w.objqClose();

console.log('\n=== 5. questionnaire de base + écrans neutres ===');
w.startQuiz(); await wait(20);
ok(w.$('quiz').classList.contains('tinted'),'questionnaire de base en couleur pleine');
w.qzRenderCrisis(); await wait(20);
ok(!w.$('quiz').classList.contains('tinted') && /255, 255, 255|#FFFFFF/i.test(w.$('quiz').style.background),'écran de crise ramené au blanc');
w.qzClose();

console.log('\n=== 6. inscription colorée ===');
ok(w.eval("Object.keys(OB_SAT).length")===11,'11 écrans d\'inscription en couleur pleine');
ok(w.eval("OB_SAT['ob-welcome']")==='#974AF0','accueil d\'inscription en violet MAYND');
w.obShow('ob-welcome'); await wait(20);
const ob=w.$('onboarding');
ok(ob.classList.contains('sat'),'classe couleur pleine appliquée');
w.obShow('ob-signup'); await wait(20);
ok(ob.classList.contains('sat') && w.eval("OB_SAT['ob-signup']")==='#FE6601','création de compte en orange MAYND');

console.log('\n=== 7. non-régression ===');
w.enterApp(false); await wait(20); w.eval("state.tier='plus'");
w.showTab('objectifs'); await wait(20);
ok(w.$('obj-pad').innerHTML.includes('Ta supervision'),'supervision intacte');
ok(w.$('obj-pad').innerHTML.includes('wheel-card'),'boussole intacte');
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'toujours zéro dégradé visuel');
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
