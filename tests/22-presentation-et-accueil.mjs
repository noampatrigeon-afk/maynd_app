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
w.enterApp(false); await wait(40); w.eval("state.tier='plus'");

console.log('\n=== 1. PRÉSENTATION DES ACCOMPAGNANTS ===');
ok(w.eval("JCARDS[3].go")==="openAgentDeck()",'la carte "Avec qui" ouvre la présentation');
w.openAgentDeck(); await wait(60);
ok(w.$('deck').classList.contains('show'),'écran plein ouvert');
const pages=[...w.document.querySelectorAll('#deck-track .deck-page')];
ok(pages.length===16,'16 fiches, une par accompagnant');
const dots=[...w.document.querySelectorAll('#deck-dots .deck-dot')];
ok(dots.length===16,'16 repères de navigation');
ok(dots[0].classList.contains('on'),'première fiche active');
const p0=pages[0].innerHTML;
ok(p0.includes('MIA') && p0.includes('Ce qu'),'fiche MIA détaillée');
const atlas=pages.find(p=>p.getAttribute('data-id')==='atlas').innerHTML;
ok(atlas.includes('Identité'),'domaine affiché');
ok(atlas.includes('qui tu es, et vers quoi tu vas'),'présentation développée, plus deux mots');
ok((atlas.match(/<li>/g)||[]).length===7,'4 actions + 3 situations détaillées');
ok(atlas.includes('Inclus dans MAYND'),'niveau d\'accès indiqué');
const eden=pages.find(p=>p.getAttribute('data-id')==='eden').innerHTML;
ok(eden.includes('Exclusif MAYND+'),'les exclusifs sont signalés');
ok(eden.includes('consentement n')&&eden.includes('gociable'),'calibrage Eden respecté');
const neo=pages.find(p=>p.getAttribute('data-id')==='neo').innerHTML;
ok(neo.includes('Aucune étiquette'),'calibrage Neo respecté');
const soren=pages.find(p=>p.getAttribute('data-id')==='soren').innerHTML;
ok(soren.includes("l'autre parent") && !/pére|père|mère/i.test(soren),'Soren : parentalité non genrée');
const kael=pages.find(p=>p.getAttribute('data-id')==='kael').innerHTML;
ok(kael.includes('Jamais de dépassement'),'calibrage Kael respecté');
const ava=pages.find(p=>p.getAttribute('data-id')==='ava').innerHTML;
ok(!/étape/i.test(ava)||ava.includes('sans étape'),'Ava : aucune étape imposée');
ok(!/psycholog|thérapeut|clinique|patient/i.test(pages.map(p=>p.innerHTML).join('')),'aucun terme clinique');

console.log('\n=== 2. NAVIGATION DE LA PRÉSENTATION ===');
w.deckGo(3, true); await wait(40);
ok(w.eval('DECK_IDS')[3]==='atlas','navigation directe');
w.deckSync(3);
ok(w.document.querySelectorAll('#deck-dots .deck-dot')[3].classList.contains('on'),'repère suivi');
ok(/rgb|#/.test(w.$('deck').style.background),'le fond prend la couleur de l\'accompagnant');
w.eval("state.favorites=[]");
w.deckFav('atlas'); await wait(60);
ok(S().favorites.includes('atlas'),'étoile depuis la présentation');
w.deckStart('atlas'); await wait(50);
ok(!w.$('deck').classList.contains('show'),'fermeture au démarrage');
ok(w.eval("threadParts()").includes('atlas'),'conversation lancée avec le bon accompagnant');
w.eval("state.tier='free'"); w.openAgentDeck(); await wait(50);
w.deckStart('eden'); await wait(40);
ok(!w.$('deck').classList.contains('show'),'agent verrouillé : la présentation se ferme');
w.eval("state.tier='plus'");

console.log('\n=== 3. COULEURS REPRISES DES QUESTIONNAIRES ===');
const qcols=w.eval("QTHEME.map(function(t){return t.bg})");
ok(qcols.length===7,'7 couleurs de questionnaire');
ok(qcols.includes('#E8467F'),'le rose entre dans la palette des questionnaires');
const acols=w.eval("ALL.map(function(a){return a.color})");
const allowed=['#974AF0','#6F2FC0','#FFC400','#8B5CF6','#16389E','#E5484D','#00A862','#FE6601','#3B2FA8','#0C96C7','#224CF2','#E07C00','#E8467F','#00875A'];
ok(acols.every(c=>allowed.includes(c)),'les accompagnants n\'utilisent que la palette');
// ordre réellement affiché : agents de base puis exclusifs MAYND+
const shown=[].concat(w.eval("ALL.filter(function(a){return a.id!=='mia' && !a.plus}).map(function(a){return a.color})"),
                      w.eval("ALL.filter(function(a){return !!a.plus}).map(function(a){return a.color})"));
ok(!shown.some((c,i)=>i>0 && c===shown[i-1]),'jamais deux couleurs identiques côte à côte dans la liste affichée');
ok(w.eval("byId('mia').color")==='#974AF0','MIA garde le violet MAYND');
ok(new Set(acols).size>=8,'palette variée : '+new Set(acols).size+' couleurs');

console.log('\n=== 4. LE ROSE DANS L\'INSCRIPTION ===');
ok(w.eval("OB_SAT['ob-firstname']")==='#000000','écran prénom en noir');
w.obShow('ob-firstname'); await wait(30);
ok(/rgb\(0, 0, 0\)|#000000/i.test(w.$('onboarding').style.background),'noir appliqué');
w.startObjQuiz(); await wait(30);
w.objqPick(0); await wait(280); w.objqPick(0); await wait(280);
ok(/232, 70, 127/.test(w.$('orient').style.background),'rose dans le questionnaire');
w.objqClose();

console.log('\n=== 5. PLUS AUCUN ÉCRAN BLANC ===');
const obIds=[...w.document.querySelectorAll('#onboarding .ob-screen')].map(s=>s.id);
let blancs=[];
for(const id of obIds){
  w.obShow(id); await wait(18);
  const bg=w.$('onboarding').style.background;
  if(/255, 255, 255/.test(bg) || bg==='#FFFFFF' || !bg) blancs.push(id);
}
ok(blancs.length===0,'aucun écran blanc sur '+obIds.length+' écrans'+(blancs.length?' ('+blancs.join(', ')+')':''));
ok(w.eval("Object.keys(OB_SOFT).length")>=11,'chaque écran de saisie a sa teinte');

console.log('\n=== 6. OBJECTIFS SUR L\'ACCUEIL ===');
w=boot(); await wait(90); w.enterApp(false); await wait(40); w.eval("state.tier='plus'");
w.showTab('accueil'); await wait(40);
ok(!!w.$('home-goals'),'bloc présent');
ok(w.$('home-goals').innerHTML.includes('Pas encore défini'),'cap vide signalé');
ok(w.$('home-goals').innerHTML.includes('Trouver mon objectif'),'invitation quand rien n\'est posé');
w.eval("state.cap='Être plus serein au travail'");
w.addObjective('Bloquer 20 min par jour', 5, 'mateo'); await wait(30);
w.showTab('accueil'); await wait(30);
const hg=w.$('home-goals').innerHTML;
ok(hg.includes('Être plus serein au travail'),'le cap est visible sur l\'accueil');
ok(hg.includes('Bloquer 20 min par jour'),'l\'objectif est visible sur l\'accueil');
ok(hg.includes('hg-bar'),'avancement affiché');
ok(hg.includes('+ 1 pas'),'action possible depuis l\'accueil');
const before=S().objectives[0].progress;
w.document.querySelector('#home-goals .hg-step').click(); await wait(40);
ok(S().objectives[0].progress===before+1,'un pas se coche depuis l\'accueil');
ok(w.$('home-goals').innerHTML.includes((before+1)+' / 5'),'l\'accueil se met à jour tout seul');

console.log('\n=== 7. HUMEUR DÉPLACÉE DANS LES OBJECTIFS ===');
ok(!w.$('tab-accueil').innerHTML.includes('id="suivi"'),'plus d\'humeur sur l\'accueil');
w.showTab('objectifs'); await wait(40);
ok(!!w.$('suivi'),'humeur présente dans les objectifs');
ok(w.$('obj-pad').innerHTML.includes('Ton suivi'),'section Ton suivi déplacée');
ok(w.$('suivi').innerHTML.length>20,'la carte se remplit bien');
w.showTab('accueil'); await wait(30); w.showTab('objectifs'); await wait(40);
ok(w.document.querySelectorAll('#obj-pad #suivi').length===1,'aucun doublon après plusieurs passages');

console.log('\n=== 8. PARCOURS DE A À Z ===');
const w2=boot(); await wait(90);
const c2=()=>{const s=w2.document.querySelector('#onboarding .ob-screen.on'); return s?s.id:'(aucun)';};
async function step(){
  const s=w2.document.querySelector('#onboarding .ob-screen.on');
  const btns=[...s.querySelectorAll('button[onclick]')].filter(b=>!b.className.includes('ob-back'));
  const main=btns.find(b=>b.className.includes('btn') && !b.className.includes('ghost')) || btns[0];
  main.click(); await wait(70); return c2();
}
ok(await step()==='ob-signup','a. inscription');
w2.$('ob-email').value='a@b.fr'; w2.$('ob-pwd').value='motdepasse1'; w2.obToggleCgu();
ok(await step()==='ob-verify-choice','b. vérification');
ok(await step()==='ob-verify-code','c. code');
ok(await step()==='ob-access','d. sécurité');
ok(await step()==='ob-faceid','e. reconnaissance');
ok(await step()==='ob-trust','f. confiance');
ok(await step()==='ob-firstname','g. prénom');
w2.$('ob-firstname-input').value='Noam'; w2.obValidateName();
ok(await step()==='ob-account-success','h. compte créé');
w2.enterApp(false); await wait(50); w2.eval("state.tier='plus'");
w2.startQuiz(); await wait(40);
for(let i=0;i<9;i++){ const b=w2.document.querySelectorAll('#quiz-inner .qz2-opt'); if(b.length) b[1].click(); else if(typeof w2.qzSkipText==='function') w2.qzSkipText(); await wait(250); }
try{ w2.qzClose(); }catch(e){}
w2.startObjQuiz(); await wait(40);
for(let i=0;i<9;i++){ w2.objqPick(0); await wait(270); }
ok(w2.eval('state').objAnswers!==null,'i. questionnaire cap terminé');
w2.showTab('accueil'); await wait(40);
ok(w2.$('home-goals').innerHTML.includes('hg-obj'),'j. l\'objectif créé apparaît sur l\'accueil');
w2.openAgentDeck(); await wait(60); w2.closeDeck();
for(const tab of ['accueil','chat','objectifs']){ w2.showTab(tab); await wait(40); }
for(const fn of ['openDrawer','openProfile','openParts','openPro','openObjSheet','openWheelSheet','openFocusSheet','openFormules']){
  if(typeof w2[fn]==='function'){ try{ w2[fn](); }catch(e){ w2.__errs.push(fn+':'+e.message); } await wait(25); }
}
let clicked=0;
for(const tab of ['accueil','objectifs']){
  w2.showTab(tab); await wait(35);
  for(const b of [...w2.document.querySelectorAll('#tab-'+tab+' [onclick]')]){ try{ b.click(); clicked++; }catch(e){ w2.__errs.push('clic:'+e.message); } await wait(4); }
}
ok(clicked>20,clicked+' éléments cliqués');
ok(w2.__errs.length===0,'k. aucune erreur sur tout le parcours'+(w2.__errs.length?' : '+w2.__errs.slice(0,4).join(' | '):''));

console.log('\n=== 9. INTÉGRITÉ ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change|scroll)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'zéro dégradé visuel');
ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));

console.log('\n  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
process.exit(fail?1:0);
