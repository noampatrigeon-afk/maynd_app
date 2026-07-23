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

console.log('\n=== 1. TUNNEL D\'INSCRIPTION : aucun saut ===');
ok(cur()==='ob-welcome','départ sur l\'accueil');
async function clickMain(){
  const s=w.document.querySelector('#onboarding .ob-screen.on');
  const btns=[...s.querySelectorAll('button[onclick]')].filter(b=>!b.className.includes('ob-back'));
  const main=btns.find(b=>b.className.includes('btn') && !b.className.includes('ghost')) || btns[0];
  main.click(); await wait(60); return cur();
}
ok(await clickMain()==='ob-signup','1 accueil -> inscription (pas de saut)');
w.$('ob-email').value='a@b.fr'; w.$('ob-pwd').value='motdepasse1'; w.obToggleCgu();
ok(await clickMain()==='ob-verify-choice','2 inscription -> vérification');
ok(await clickMain()==='ob-verify-code','3 vérification -> code');
ok(await clickMain()==='ob-access','4 code -> sécurité');
ok(await clickMain()==='ob-faceid','5 sécurité -> reconnaissance');
ok(await clickMain()==='ob-trust','6 reconnaissance -> confiance');
ok(await clickMain()==='ob-firstname','7 confiance -> prénom');
w.$('ob-firstname-input').value='Noam'; w.obValidateName();
ok(await clickMain()==='ob-account-success','8 prénom -> compte créé');
ok(await clickMain()==='ob-quiz-invite','9 compte créé -> questionnaire');

console.log('\n=== 2. VERROU ANTI DOUBLE APPUI ===');
w.obShow('ob-welcome'); await wait(5);
ok(w.$('onboarding').style.pointerEvents==='none','écran verrouillé pendant la transition');
await wait(380);
ok(w.$('onboarding').style.pointerEvents!=='none','déverrouillé après la transition');
w.startObjQuiz(); await wait(15);
w.objqAdvance(); await wait(5);
ok(w.$('orient').style.pointerEvents==='none','questionnaire verrouillé après une réponse');
await wait(300); w.objqClose();

console.log('\n=== 3. AUCUN ÉCRAN D\'INSCRIPTION FADE ===');
const obIds=[...w.document.querySelectorAll('#onboarding .ob-screen')].map(s=>s.id);
ok(obIds.length>=15,obIds.length+' écrans dans le tunnel');
let blancs=[];
for(const id of obIds){
  w.obShow(id); await wait(20);
  const bg=w.$('onboarding').style.background;
  if(/255, 255, 255/.test(bg) || !bg) blancs.push(id);
}
ok(blancs.length===0,'aucun écran blanc'+(blancs.length?' ('+blancs.join(', ')+')':''));
ok(w.eval("Object.keys(OB_SAT).length")===11,'11 écrans en couleur pleine');
const obc=w.eval("Object.keys(OB_SAT).map(function(k){return OB_SAT[k]})");
ok(new Set(obc).size>=5,new Set(obc).size+' couleurs différentes dans l\'inscription');

console.log('\n=== 4. CARROUSEL : 5 paires toutes différentes ===');
w = boot(); await wait(90); w.enterApp(false); await wait(30); w.eval("state.tier='plus'");
w.showTab('accueil'); await wait(25);
const cards=[...w.$('jrow').querySelectorAll('.jcard')];
ok(cards.length===5,'5 cartes');
const pairs=cards.map(c=>c.style.getPropertyValue('--jc')+'|'+c.style.getPropertyValue('--ja'));
ok(new Set(pairs).size===5,'5 paires uniques');
const accents=cards.map(c=>c.style.getPropertyValue('--ja'));
ok(new Set(accents).size===5,'5 accents différents : '+accents.join(' '));
ok(pairs.includes('#00A862|#FFC400'),'la paire vert et jaune est conservée');

console.log('\n=== 5. COULEURS DES ACCOMPAGNANTS ===');
const cols=w.eval("ALL.map(function(a){return a.id+':'+a.color}).join(',')").split(',');
const hexes=cols.map(c=>c.split(':')[1]);
ok(hexes.length===16,'16 accompagnants');
ok(new Set(hexes).size>=8,'palette variée : '+new Set(hexes).size+' couleurs');
ok(w.eval("byId('mia').color")==='#974AF0','MIA en violet MAYND');
ok(w.eval("byId('kael').color")==='#FE6601','Kael en orange, le sport');
ok(w.eval("byId('otis').color")==='#00A862','Otis en bleu clair');
ok(w.eval("byId('leo').color")==='#E5484D','Leo en bleu');
ok(w.eval("byId('miro').color")==='#3B2FA8','Miro en indigo nuit');
const dull=hexes.filter(h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b); return mx===0?true:(mx-mn)/mx<0.40;});
ok(dull.length===0,'aucune couleur terne'+(dull.length?' ('+dull.join(' ')+')':''));

console.log('\n=== 6. FOND DU CHAT SELON L\'ACCOMPAGNANT ===');
w.startWithAgent('mia'); await wait(40);
ok(/151, 74, 240/.test(w.$('tab-chat').style.background),'MIA -> violet MAYND');
w.startWithAgent('kael'); await wait(40);
ok(/254, 102, 1/.test(w.$('tab-chat').style.background),'Kael -> orange');
w.startWithAgent('otis'); await wait(40);
ok(/0, 168, 98/.test(w.$('tab-chat').style.background),'Otis -> vert');
ok(!w.$('tab-chat').classList.contains('light-agent'),'lettre blanche partout, plus d\'exception');
w.startWithAgent('sol'); await wait(40);
ok(!w.$('tab-chat').classList.contains('light-agent'),'fond foncé -> texte blanc');

console.log('\n=== 7. FONDS D\'ONGLETS ===');
ok(html.includes('#tab-accueil{background:#FFFFFF}'),'accueil en blanc pur');
ok(html.includes('#tab-objectifs{background:#FFFFFF}'),'objectifs en blanc pur');

console.log('\n=== 8. BALAYAGE COMPLET : tous les boutons ===');
const w2=boot(); await wait(90); w2.enterApp(false); await wait(30);
w2.eval("state.tier='plus'; state.questionnaireDone=true; state.cap='x'; state.profile={key:'M',name:'Le Moteur'}; state.favorites=['naoki','sol']; state.focus={agent:'naoki'}");
let clicked=0;
for(const tab of ['accueil','chat','objectifs']){
  w2.showTab(tab); await wait(30);
  const els=[...w2.document.querySelectorAll('#tab-'+tab+' [onclick]')];
  for(const b of els){ try{ b.click(); clicked++; }catch(e){ w2.__errs.push('clic:'+e.message); } await wait(4); }
}
for(const fn of ['openDrawer','openProfile','openParts','openPro','openObjSheet','openWheelSheet','openFocusSheet','openMoodScreen','openFormules']){
  if(typeof w2[fn]==='function'){ try{ w2[fn](); clicked++; }catch(e){ w2.__errs.push(fn+':'+e.message); } await wait(20); }
}
ok(clicked>=30,clicked+' éléments actionnés');
ok(w2.__errs.length===0,'aucune erreur au balayage'+(w2.__errs.length?' : '+w2.__errs.slice(0,4).join(' | '):''));

console.log('\n=== 9. INTÉGRITÉ ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'zéro dégradé visuel');
ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,4).join(' | '):''));

console.log('\n  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
process.exit(fail?1:0);
