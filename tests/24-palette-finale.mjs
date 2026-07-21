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
function fam(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  if(!d) return 'gris';
  let h; if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  h=(h*60+360)%360;
  if(h<15||h>=345) return 'rouge';
  if(h<45) return 'orange';
  if(h<70) return 'jaune';
  if(h<170) return 'vert';
  if(h<200) return 'cyan';
  if(h<255) return 'bleu';
  if(h<290) return 'violet';
  return 'rose';
}

console.log('\n=== 1. TOUTES LES COULEURS SONT LÀ ===');
const ordre=['mia','naoki','felix','atlas','ava','leo','otis','kael','miro','sol','mateo','soren','iris','eden','vince','neo'];
const cols=ordre.map(id=>w.eval("byId('"+id+"').color"));
const fams=cols.map(fam);
const compte={}; fams.forEach(f=>compte[f]=(compte[f]||0)+1);
ok(compte.vert>=2,'du vert : '+(compte.vert||0)+' accompagnants');
ok(compte.jaune>=1,'du jaune : '+(compte.jaune||0));
ok(compte.orange>=2,'de l\'orange : '+(compte.orange||0));
ok(compte.rose>=1,'du rose : '+(compte.rose||0));
ok(compte.rouge>=1,'du rouge : '+(compte.rouge||0));
ok((compte.bleu||0)+(compte.cyan||0)<=5,'les bleus ne dominent plus : '+((compte.bleu||0)+(compte.cyan||0))+' sur 16');
ok((compte.violet||0)<=5,'les violets non plus : '+(compte.violet||0));
ok(Object.keys(compte).length>=6,Object.keys(compte).length+' familles de couleurs représentées : '+Object.keys(compte).join(', '));

console.log('\n=== 2. CHAQUE COULEUR COLLE À SON THÈME ===');
ok(w.eval("byId('eden').color")==='#E8467F','rose pour la sexualité');
ok(w.eval("byId('kael').color")==='#FE6601','orange pour le sport');
ok(w.eval("byId('naoki').color")==='#6F2FC0','violet pour la discipline');
ok(fam(w.eval("byId('atlas').color"))==='violet','violet pour l\'identité et le sens');
const fMiro=fam(w.eval("byId('miro').color"));
ok(fMiro==='violet'||fMiro==='bleu','indigo pour la nuit ('+fMiro+')');
ok(fam(w.eval("byId('vince').color"))==='vert','émeraude pour l\'argent');
ok(fam(w.eval("byId('leo').color"))==='rouge','rouge pour le couple');
ok(fam(w.eval("byId('soren').color"))==='orange','orange chaud pour la parentalité');
ok(w.eval("byId('mia').color")==='#974AF0','MIA garde le violet MAYND');

console.log('\n=== 3. AUCUN VOISIN IDENTIQUE ===');
const shown=[].concat(
  w.eval("ALL.filter(function(a){return a.id==='mia'}).map(function(a){return a.color})"),
  w.eval("ALL.filter(function(a){return a.id!=='mia' && !a.plus}).map(function(a){return a.color})"),
  w.eval("ALL.filter(function(a){return !!a.plus}).map(function(a){return a.color})"));
ok(!shown.some((c,i)=>i>0 && c===shown[i-1]),'aucune couleur répétée côte à côte');
ok(!shown.map(fam).some((f,i)=>i>1 && f===shown.map(fam)[i-1] && f===shown.map(fam)[i-2]),'jamais trois teintes proches à la suite');

console.log('\n=== 4. LISIBILITÉ ===');
function cw(hex){
  const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const L=0.2126*f(parseInt(hex.slice(1,3),16))+0.7152*f(parseInt(hex.slice(3,5),16))+0.0722*f(parseInt(hex.slice(5,7),16));
  return 1.05/(L+0.05);
}
ok(w.eval("LIGHT_AGENTS.join(',')")==='felix','seul le jaune passe en lettre noire');
const blancs=cols.filter((c,i)=>ordre[i]!=='felix');
ok(blancs.every(c=>cw(c)>=2.9),'lettre blanche lisible sur tous les autres');
ok(html.includes('.hg-ava[style*="FFC400"],.chip-ava[style*="FFC400"]{color:#000}'),'règle de lettre noire posée');
w.enterApp(false); await wait(40); w.eval("state.tier='plus'");
w.startWithAgent('felix'); await wait(50);
ok(w.$('tab-chat').classList.contains('light-agent'),'le chat de Felix passe en texte noir');
w.startWithAgent('kael'); await wait(50);
ok(!w.$('tab-chat').classList.contains('light-agent'),'et repasse en blanc ailleurs');

console.log('\n=== 5. PRÉSENTATION SUR FOND CLAIR ===');
w.openAgentDeck(); await wait(70);
const felixPage=w.document.querySelector('#deck-track .deck-page[data-id="felix"]');
ok(felixPage && felixPage.classList.contains('light'),'la fiche jaune passe en mode clair');
const kaelPage=w.document.querySelector('#deck-track .deck-page[data-id="kael"]');
ok(kaelPage && !kaelPage.classList.contains('light'),'les autres restent en blanc');
const fi=w.eval("DECK_IDS.indexOf('felix')");
w.deckSync(fi);
ok(w.$('deck').classList.contains('light'),'la navigation s\'adapte aussi');
w.deckSync(0);
ok(!w.$('deck').classList.contains('light'),'et revient en blanc');
ok(html.includes('.deck-page.light .deck-cta{background:#000;color:#FFC400}'),'bouton lisible sur jaune');
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
w2.openAgentDeck(); await wait(70); w2.closeDeck();
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
