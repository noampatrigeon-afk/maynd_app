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
let w=boot(); await wait(90); const S=()=>w.eval('state');
function cw(hex){
  const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const L=0.2126*f(parseInt(hex.slice(1,3),16))+0.7152*f(parseInt(hex.slice(3,5),16))+0.0722*f(parseInt(hex.slice(5,7),16));
  return 1.05/(L+0.05);
}

console.log('\n=== 1. COULEURS PAR THÈME ===');
ok(w.eval("byId('eden').color")==='#E8467F','rose pour la sexualité');
ok(w.eval("byId('kael').color")==='#FE6601','orange pour le sport');
ok(w.eval("byId('naoki').color")==='#6F2FC0','violet pour la discipline');
ok(w.eval("byId('atlas').color")==='#8B5CF6','violet pour l\'identité et le sens');
ok(w.eval("byId('miro').color")==='#3B2FA8','indigo nuit pour le sommeil');
ok(w.eval("byId('sol').color")==='#0C96C7','bleu clair pour la respiration');
ok(w.eval("byId('mia').color")==='#974AF0','MIA garde le violet MAYND');
const shown=[].concat(
  w.eval("ALL.filter(function(a){return a.id==='mia'}).map(function(a){return a.color})"),
  w.eval("ALL.filter(function(a){return a.id!=='mia' && !a.plus}).map(function(a){return a.color})"),
  w.eval("ALL.filter(function(a){return !!a.plus}).map(function(a){return a.color})"));
ok(!shown.some((c,i)=>i>0 && c===shown[i-1]),'jamais deux couleurs identiques côte à côte');
const uniq=new Set(shown);
ok(uniq.size>=8,'palette variée : '+uniq.size+' couleurs');
const bleus=shown.filter(c=>['#0C96C7','#224CF2','#16389E'].includes(c)).length;
ok(bleus<=5,'les bleus ne dominent plus : '+bleus+' accompagnants');
const faibles=[...uniq].filter(c=>cw(c)<2.9 && c!=='#FFC400');
ok(faibles.length<=1,'lettre blanche lisible sauf sur le jaune'+(faibles.length?' ('+faibles.join(' ')+')':''));

console.log('\n=== 2. INSCRIPTION : vert MAYND à l\'étape 3, prénom en noir ===');
ok(w.eval("OB_SAT['ob-access']")==='#00A862','étape 3 (accès rapide) en vert MAYND');
ok(w.eval("OB_SOFT['ob-faceid']")==='#D8F2E4' && w.eval("OB_SOFT['ob-pin-create']")==='#D8F2E4' && w.eval("OB_SOFT['ob-pin-confirm']")==='#D8F2E4','étape 3 : écrans de saisie assortis en vert clair');
ok(w.eval("OB_SAT['ob-firstname']")==='#000000','écran du prénom en noir');
ok(w.eval("OB_SAT['ob-account-success']")==='#974AF0','validation en violet, plus de vert sur vert');
w.obShow('ob-firstname'); await wait(30);
ok(/rgb\(0, 0, 0\)|#000000/i.test(w.$('onboarding').style.background),'noir appliqué');
ok(w.$('onboarding').classList.contains('noir'),'mode noir activé');
ok(html.includes('#onboarding.noir .ob-input'),'champs adaptés au noir');
ok(html.includes('#onboarding.noir .yw-item.on{color:#fff}'),'roulette adaptée au noir');
w.obShow('ob-account-success'); await wait(30);
ok(/151, 74, 240/.test(w.$('onboarding').style.background),'validation en violet MAYND');
ok(html.includes('#onboarding.sat .ob-success .circ{background:rgba(255,255,255,.22)'),'la coche ressort sur le fond');
const obIds=[...w.document.querySelectorAll('#onboarding .ob-screen')].map(s=>s.id);
let verts=[], blancs=[];
for(const id of obIds){
  w.obShow(id); await wait(16);
  const bg=w.$('onboarding').style.background;
  if(/216, 242, 228|0, 168, 98/.test(bg)) verts.push(id);
  if(/255, 255, 255/.test(bg) || !bg) blancs.push(id);
}
const expectedVerts=['ob-access','ob-faceid','ob-fingerprint','ob-pin-create','ob-pin-confirm'];
ok(verts.length===expectedVerts.length && expectedVerts.every(id=>verts.includes(id)),'étape 3 (accès rapide) en vert, aucun autre écran : '+verts.join(', '));
ok(blancs.length===0,'aucun écran blanc');

console.log('\n=== 3. TITRES D\'ONGLET ===');
ok(html.includes(".wordmark{font-family:'Poppins',sans-serif;font-weight:800;font-size:24px"),'titres en Poppins 800, 24 pixels');
ok(html.includes('#tab-accueil #brandmark-slot{display:none}'),'logo et nom retirés de l\'accueil');
w=boot(); await wait(90); w.enterApp(false); await wait(40);
w.showTab('accueil'); await wait(30);
const bm=w.$('brandmark-slot');
ok(!!bm,'emplacement toujours présent dans la structure');
ok(w.getComputedStyle(bm).display==='none' || html.includes('#brandmark-slot{display:none}'),'mais masqué');
ok(w.$('tab-objectifs').innerHTML.includes('class="wordmark"'),'les autres onglets gardent leur titre');

console.log('\n=== 4. PANNEAU RENOMMÉ ===');
ok(w.eval("t('participants')")==='Accompagnants','panneau renommé en Accompagnants');
ok(!/aria-label="Participants"/.test(html),'plus aucun libellé Participants');
w.eval("state.tier='plus'"); w.showTab('chat'); await wait(30);
w.openParts(); await wait(30);
ok(w.$('parts-sheet').innerHTML.includes('Accompagnants'),'affiché dans le panneau');

console.log('\n=== 5. BOUTON DE PRÉSENTATION ===');
ok(/deck-btn/.test(w.$('parts-body').innerHTML),'bouton présent dans le panneau du chat');
w.openDrawer(); await wait(30);
ok(/deck-btn/.test(w.$('drawer-body').innerHTML),'bouton présent dans le tiroir');
ok(w.$('drawer-body').innerHTML.includes('Présenter les accompagnants'),'libellé du bouton');
w.document.querySelector('#drawer-body .deck-btn').click(); await wait(70);
ok(w.$('deck').classList.contains('show'),'le bouton ouvre la présentation');
const pages=[...w.document.querySelectorAll('#deck-track .deck-page')];
ok(pages.length===16,'16 fiches complètes');
ok(pages.every(p=>(p.innerHTML.match(/<li>/g)||[]).length===7),'chaque fiche est complète');
w.closeDeck();

console.log('\n=== 6. PARCOURS DE A À Z ===');
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
ok(w2.$('onboarding').classList.contains('noir'),'   et il est bien en noir');
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
ok(w2.$('home-goals').innerHTML.includes('hg-obj'),'j. objectif visible sur l\'accueil');
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

console.log('\n=== 7. INTÉGRITÉ ===');
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
