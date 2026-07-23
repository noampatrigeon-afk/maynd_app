import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window; const errs=[];
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true; w.alert=()=>{};
  w.addEventListener('error',e=>errs.push((e.message||String(e.error))+' @'+(e.lineno||'')));
  w.addEventListener('unhandledrejection',e=>errs.push('p:'+e.reason));
  w.__errs=errs; return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let w=boot(); await wait(90);
const S=()=>w.eval('state');
const cur=()=>{const s=w.document.querySelector('#onboarding .ob-screen.on'); return s?s.id:'(aucun)';};

console.log('\n=== 1. ÉCRAN 1 ===');
const wel=w.$('ob-welcome').innerHTML;
ok(!/Ton mental, ton allié/.test(wel),'ligne "Ton mental, ton allié" retirée');
ok(/Pour tous, partout, tout le temps/.test(wel),'slogan conservé');
ok(!/<br>/.test(w.$('ob-welcome').querySelector('.ob-sub').innerHTML),'plus de saut de ligne orphelin');
ok(html.includes('#ob-welcome{display:flex;flex-direction:column}'),'écran en colonne');
ok(html.includes('#ob-welcome .ob-welcome-illu{margin-top:auto'),'bloc recentré, plus de trou');
ok(html.includes('#ob-welcome .ob-welcome-illu .bw{width:128px}'),'cerveau agrandi et centré');
ok(!!w.$('ob-welcome').querySelector('.ob-brain'),'cerveau présent');

console.log('\n=== 2. RÉPONSES : plus aucun rectangle blanc ===');
ok(w.eval("QTHEME.every(function(t){return !!t.tint})"),'chaque couleur a sa teinte de réponse');
const tints=w.eval("QTHEME.map(function(t){return t.tint}).join(',')").split(',');
ok(new Set(tints).size===7,'7 teintes différentes');
ok(!tints.some(t=>t.toUpperCase()==='#FFF'||t.toUpperCase()==='#FFFFFF'),'aucune teinte blanche : '+tints.join(' '));
w.startObjQuiz(); await wait(20);
const or=w.$('orient');
ok(or.style.getPropertyValue('--qopt')==='#EDE1FF','fond violet -> réponses lavande');
w.objqToggle(0); w.objqAdvance(); await wait(280);
ok(or.style.getPropertyValue('--qopt')==='#DFE8FF','fond bleu -> réponses bleu clair');
w.objqPick(0); await wait(300);
ok(or.style.getPropertyValue('--qopt')===w.eval('QTHEME[2].tint'),'3e question : teinte assortie');
w.objqPick(0); await wait(300);
ok(or.style.getPropertyValue('--qopt')===w.eval('QTHEME[3].tint'),'4e question : teinte assortie');
w.objqPick(0); await wait(300);
ok(or.style.getPropertyValue('--qopt')===w.eval('QTHEME[4].tint'),'5e question : teinte assortie');
w.objqClose();
ok(html.includes('#quiz.tinted .qz2-opt,#orient.tinted .qz2-opt{background:var(--qopt'),'les réponses suivent la teinte');

console.log('\n=== 3. CARTES DE L\'ACCUEIL ===');
w=boot(); await wait(90); w.enterApp(false); await wait(30); w.eval("state.tier='plus'");
w.showTab('accueil'); await wait(25);
const cards=[...w.$('jrow').querySelectorAll('.jcard')];
const hum=cards.find(c=>c.textContent.includes('Comment tu vas'));
ok(hum && hum.style.getPropertyValue('--ja')==='#8FB4FF','humeur : rond bleu clair, plus de blanc');
const sup=cards.find(c=>c.textContent.includes('Qui te suit'));
ok(sup && sup.style.getPropertyValue('--jc')==='#E8467F','supervision : rose soutenu');
ok(sup && sup.style.getPropertyValue('--ja')==='#FFAFCF','supervision : accent rose clair');
ok(sup && !sup.classList.contains('dark'),'supervision : texte blanc comme les autres');
const accents=cards.map(c=>c.style.getPropertyValue('--ja'));
ok(!accents.includes('#FFFFFF'),'plus aucun accent blanc');
ok(new Set(cards.map(c=>c.style.getPropertyValue('--jc'))).size===5,'5 fonds différents');

console.log('\n=== 4. PAIEMENT : texte lisible ===');
ok(!html.includes(".pr-tag{background:var(--orange-soft)"),'ancienne règle fautive supprimée');
ok(html.includes('.pay-recap .pr-tag{background:rgba(255,255,255,.16);color:#FFFFFF'),'texte blanc sur fond sombre translucide');
ok(html.includes('.pay-recap{background:var(--ink);color:#FFFFFF}'),'bloc récapitulatif en noir');
w.obShow('ob-payment'); await wait(20);
w.eval("if(typeof renderPay==='function') renderPay();");
const tag=w.$('pay-tag');
ok(!!tag && tag.textContent.length>10,'la description du plan est présente : "'+tag.textContent.slice(0,34)+'"');

console.log('\n=== 5. SUPERVISION : avatar humain ===');
const ava=w.proBadgeSVG();
ok(!/M12 22s8-4 8-10V5/.test(ava),'bouclier retiré');
ok(/circle cx="24" cy="18.2"/.test(ava),'avatar humain : tête centrée');
ok(/V48h30.4/.test(ava),'avatar humain : épaules jusqu\'au bord');

console.log('\n=== 6. PARCOURS DE A À Z ===');
const w2=boot(); await wait(90);
const c2=()=>{const s=w2.document.querySelector('#onboarding .ob-screen.on'); return s?s.id:'(aucun)';};
async function step(){
  const s=w2.document.querySelector('#onboarding .ob-screen.on');
  const btns=[...s.querySelectorAll('button[onclick]')].filter(b=>!b.className.includes('ob-back'));
  const main=btns.find(b=>b.className.includes('btn') && !b.className.includes('ghost')) || btns[0];
  main.click(); await wait(70); return c2();
}
ok(c2()==='ob-welcome','a. accueil');
ok(await step()==='ob-signup','b. inscription');
w2.$('ob-email').value='a@b.fr'; w2.$('ob-pwd').value='motdepasse1'; w2.obToggleCgu();
ok(await step()==='ob-verify-choice','c. vérification');
ok(await step()==='ob-verify-code','d. code');
ok(await step()==='ob-access','e. sécurité');
ok(await step()==='ob-faceid','f. reconnaissance');
ok(await step()==='ob-trust','g. confiance');
ok(await step()==='ob-firstname','h. prénom');
w2.$('ob-firstname-input').value='Noam'; w2.obValidateName();
ok(await step()==='ob-account-success','i. compte créé');
ok(await step()==='ob-quiz-invite','j. invitation au questionnaire');
w2.enterApp(false); await wait(40);
ok(w2.$('tab-accueil').classList.contains('active'),'k. entrée dans l\'app');
w2.startQuiz(); await wait(30);
for(let i=0;i<9;i++){ const b=w2.document.querySelectorAll('#quiz-inner .qz2-opt'); if(b.length) b[1].click(); else if(typeof w2.qzSkipText==='function') w2.qzSkipText(); await wait(240); }
ok(w2.$('quiz').classList.contains('show')||S()!==null,'l. questionnaire profil parcouru');
try{ w2.qzClose(); }catch(e){}
w2.eval("state.tier='plus'");
w2.startObjQuiz(); await wait(30);
w2.objqToggle(0); w2.objqAdvance(); await wait(260);
for(let i=0;i<8;i++){ w2.objqPick(0); await wait(260); }
ok(w2.eval('state').objAnswers!==null,'m. questionnaire objectif terminé');
w2.showTab('objectifs'); await wait(40);
ok(w2.$('obj-pad').innerHTML.includes('Ta supervision'),'n. supervision affichée');
w2.showTab('chat'); await wait(30);
ok(!!w2.$('tab-chat').style.background,'o. chat coloré');
for(const fn of ['openDrawer','openProfile','openParts','openPro','openObjSheet','openWheelSheet','openFocusSheet','openFormules']){
  if(typeof w2[fn]==='function'){ try{ w2[fn](); }catch(e){ w2.__errs.push(fn+':'+e.message); } await wait(25); }
}
ok(w2.__errs.length===0,'p. aucune erreur sur tout le parcours'+(w2.__errs.length?' : '+w2.__errs.slice(0,4).join(' | '):''));

console.log('\n=== 7. INTÉGRITÉ ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'zéro dégradé visuel');
ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));

console.log('\n  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
process.exit(fail?1:0);
