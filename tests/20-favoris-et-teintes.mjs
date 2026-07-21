import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/maynd.html', import.meta.url),'utf8');
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
let w=boot(); await wait(90); const S=()=>w.eval('state');
w.enterApp(false); await wait(30); w.eval("state.tier='plus'");

console.log('\n=== 1. carte supervision en blanc ===');
w.showTab('accueil'); await wait(25);
const cards=[...w.$('jrow').querySelectorAll('.jcard')];
const sup=cards.find(c=>c.textContent.includes('Qui te suit'));
ok(sup && !sup.classList.contains('dark'),'texte blanc comme les autres cartes');
ok(sup && sup.style.getPropertyValue('--jc')==='#E8467F','rose assez soutenu pour du texte blanc');
ok(cards.every(c=>!c.classList.contains('dark')),'les 5 cartes en texte blanc');

console.log('\n=== 2. avatar de supervision ===');
const a=w.proBadgeSVG();
ok(/cx="24"/.test(a),'silhouette centrée horizontalement');
ok(/circle cx="24" cy="18.2" r="7.9"/.test(a),'tête aux bonnes proportions');
ok(/V48h30.4/.test(a),'épaules qui vont jusqu\'au bord, cadrage d\'avatar');
ok(!/M12 22s8-4 8-10/.test(a),'plus de bouclier');
ok(html.includes('.pro-ava{background:var(--violet);border-radius:50%'),'cadre rond');
ok(html.includes('.pro-ava svg{width:100%;height:100%'),'avatar qui remplit le cadre');

console.log('\n=== 3. questionnaire cap : 1re question à réponse unique ===');
ok(w.eval("!OBJQ[0].multi")===true,'plus de réponses multiples');
ok(w.eval("!OBJQ[0].hint")===true,'mention "plusieurs réponses" retirée');
w.startObjQuiz(); await wait(25);
ok(!/qz2-foot/.test(w.$('or-inner').innerHTML),'plus de bouton Continuer');
ok(w.document.querySelectorAll('#or-inner .qz2-opt').length===6,'6 réponses proposées');
w.objqPick(0); await wait(300);
ok(w.eval('objqIdx')===1,'la réponse fait avancer directement');
ok(typeof S().objAnswers==='object','pas de plantage');
for(let i=0;i<8;i++){ w.objqPick(0); await wait(260); }
ok(S().objAnswers && typeof S().objAnswers.likes==='string','réponse enregistrée comme valeur unique');
ok(S().favorites.includes('kael'),'ce qu\'on aime ajoute toujours le bon accompagnant');

console.log('\n=== 4. favoris depuis le chat ===');
w=boot(); await wait(90); w.enterApp(false); await wait(30);
w.eval("state.tier='plus'; state.favorites=['naoki','sol']");
w.showTab('chat'); await wait(25); w.openParts(); await wait(25);
ok(/agx-star on/.test(w.$('parts-body').innerHTML),'étoiles allumées visibles');
w.toggleFav('naoki'); await wait(20);
ok(!S().favorites.includes('naoki'),'retrait pris en compte dans l\'état');
const pb=w.$('parts-body').innerHTML;
const naokiRow=pb.slice(pb.indexOf('Naoki')-800, pb.indexOf('Naoki'));
ok(!/agx-star on[^]{0,300}$/.test(naokiRow),'le panneau se rafraîchit après retrait');
w.toggleFav('naoki'); await wait(20);
ok(S().favorites.includes('naoki'),'ajout depuis le chat aussi');
ok(/agx-star on/.test(w.$('parts-body').innerHTML),'étoile rallumée');

console.log('\n=== 5. plus aucun rectangle blanc ===');
ok(html.includes('.agx-row{background:var(--agt'),'lignes d\'accompagnant teintées');
ok(html.includes('.suivi-card,.wheel-card,.pro-card,.block,.formula,.objective,.quest,.chal,.track-lock,.qz2r-res{background:#F8F4FF}'),'cartes en lavande très claire');
const rows=[...w.document.querySelectorAll('#parts-body .agx-row')];
const tints=rows.map(r=>r.style.getPropertyValue('--agt')).filter(Boolean);
ok(tints.length>=15,tints.length+' lignes teintées de leur propre couleur');
ok(!tints.some(t=>t==='#FFFFFF'),'aucune teinte blanche');
ok(w.tintOf('#974AF0',0.90)==='#F5EDFE','teinte calculée depuis le violet MAYND');
ok(w.tintOf('#00A862',0.90)==='#E6F6EF','teinte calculée depuis le vert');

console.log('\n=== 6. bulles du chat teintées ===');
w.startWithAgent('kael'); await wait(50);
ok(w.$('tab-chat').style.getPropertyValue('--chat-tint')===w.tintOf(w.eval("byId('kael').color"),0.88),'bulles en turquoise très clair pour Kael ('+w.tintOf(w.eval("byId('kael').color"),0.88)+')');
w.startWithAgent('mia'); await wait(50);
ok(w.$('tab-chat').style.getPropertyValue('--chat-tint')===w.tintOf('#974AF0',0.88),'bulles en lavande pour MIA ('+w.tintOf('#974AF0',0.88)+')');
ok(html.includes('#tab-chat .bubble.assistant{background:var(--chat-tint'),'les réponses suivent la teinte');
ok(html.includes('.bubble.assistant{background:#F6F1FF}'),'aucune bulle blanche ailleurs');

console.log('\n=== 7. inscription : champs teintés ===');
w.obShow('ob-welcome'); await wait(25);
ok(w.$('onboarding').style.getPropertyValue('--obt')==='#EDE1FF','écran violet -> champs lavande');
w.obShow('ob-account-success'); await wait(25);
ok(w.$('onboarding').style.getPropertyValue('--obt')==='#EDE1FF','écran violet -> champs lavande');
w.obShow('ob-plan'); await wait(25);
ok(w.$('onboarding').style.getPropertyValue('--obt')==='#FFE6D2','écran orange -> champs pêche');
w.obShow('ob-pay-success'); await wait(25);
ok(w.$('onboarding').style.getPropertyValue('--obt')==='#FFEBCB','écran jaune -> champs crème');
w.obShow('ob-signup'); await wait(25);
ok(!/255, 255, 255/.test(w.$('onboarding').style.background),'écran de saisie teinté, pas de blanc pur');
ok(html.includes('#onboarding .ob-input,#onboarding .ob-key'),'champs branchés sur la teinte');

console.log('\n=== 8. PARCOURS DE A À Z ===');
const w2=boot(); await wait(90);
const c2=()=>{const s=w2.document.querySelector('#onboarding .ob-screen.on'); return s?s.id:'(aucun)';};
async function step(){
  const s=w2.document.querySelector('#onboarding .ob-screen.on');
  const btns=[...s.querySelectorAll('button[onclick]')].filter(b=>!b.className.includes('ob-back'));
  const main=btns.find(b=>b.className.includes('btn') && !b.className.includes('ghost')) || btns[0];
  main.click(); await wait(70); return c2();
}
ok(await step()==='ob-signup','a. accueil -> inscription');
w2.$('ob-email').value='a@b.fr'; w2.$('ob-pwd').value='motdepasse1'; w2.obToggleCgu();
ok(await step()==='ob-verify-choice','b. vérification');
ok(await step()==='ob-verify-code','c. code');
ok(await step()==='ob-access','d. sécurité');
ok(await step()==='ob-faceid','e. reconnaissance');
ok(await step()==='ob-trust','f. confiance');
ok(await step()==='ob-firstname','g. prénom');
w2.$('ob-firstname-input').value='Noam'; w2.obValidateName();
ok(await step()==='ob-account-success','h. compte créé');
ok(await step()==='ob-quiz-invite','i. questionnaire proposé');
w2.enterApp(false); await wait(40); w2.eval("state.tier='plus'");
w2.startQuiz(); await wait(30);
for(let i=0;i<9;i++){ const b=w2.document.querySelectorAll('#quiz-inner .qz2-opt'); if(b.length) b[1].click(); else if(typeof w2.qzSkipText==='function') w2.qzSkipText(); await wait(250); }
try{ w2.qzClose(); }catch(e){}
w2.startObjQuiz(); await wait(30);
for(let i=0;i<9;i++){ w2.objqPick(0); await wait(260); }
ok(w2.eval('state').objAnswers!==null,'j. questionnaire cap terminé');
for(const tab of ['accueil','chat','objectifs']){ w2.showTab(tab); await wait(35); }
for(const fn of ['openDrawer','openProfile','openParts','openPro','openObjSheet','openWheelSheet','openFocusSheet','openFormules','openMoodScreen']){
  if(typeof w2[fn]==='function'){ try{ w2[fn](); }catch(e){ w2.__errs.push(fn+':'+e.message); } await wait(25); }
}
let clicked=0;
for(const tab of ['accueil','objectifs']){
  w2.showTab(tab); await wait(30);
  for(const b of [...w2.document.querySelectorAll('#tab-'+tab+' [onclick]')]){ try{ b.click(); clicked++; }catch(e){ w2.__errs.push('clic:'+e.message); } await wait(4); }
}
ok(clicked>20,clicked+' éléments cliqués');
ok(w2.__errs.length===0,'k. aucune erreur sur tout le parcours'+(w2.__errs.length?' : '+w2.__errs.slice(0,4).join(' | '):''));

console.log('\n=== 9. INTÉGRITÉ ===');
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
