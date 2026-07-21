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

// teinte d'une couleur
function hue(hex){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  if(!d) return 0;
  let h; if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  return (h*60+360)%360;
}
function contrastWhite(hex){
  const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const L=0.2126*f(parseInt(hex.slice(1,3),16))+0.7152*f(parseInt(hex.slice(3,5),16))+0.0722*f(parseInt(hex.slice(5,7),16));
  return 1.05/(L+0.05);
}

console.log('\n=== 1. COULEURS DE LA PALETTE ===');
const allowed=['#974AF0','#6F2FC0','#FFC400','#8B5CF6','#16389E','#E5484D','#00A862','#FE6601','#3B2FA8','#0C96C7','#224CF2','#E07C00','#E8467F','#00875A'];
const ordre=['mia','naoki','felix','atlas','ava','leo','otis','kael','miro','sol','mateo','soren','iris','eden','vince','neo'];
const cols=ordre.map(id=>w.eval("byId('"+id+"').color"));
ok(cols.every(c=>allowed.includes(c)),'toutes les couleurs viennent de la palette');
ok(cols[0]==='#974AF0','MIA reste sur le violet MAYND');
ok(new Set(cols).size>=8,'palette variée : '+new Set(cols).size+' couleurs');
const shown=cols.slice(1);
ok(!shown.some((c,i)=>i>0 && c===shown[i-1]),'jamais deux couleurs identiques côte à côte');

console.log('\n=== 2. LETTRE BLANCHE LISIBLE PARTOUT ===');
const faibles=cols.filter(c=>contrastWhite(c)<2.9 && c!=='#FFC400');
ok(faibles.length===0,'aucun avatar où le blanc passe mal'+(faibles.length?' ('+faibles.join(' ')+')':''));
ok(contrastWhite(w.eval("byId('otis').color"))>=2.9,'Otis lisible en blanc, contraste '+contrastWhite(w.eval("byId('otis').color")).toFixed(2));
ok(w.eval("byId('otis').color")==='#00A862','Otis en bleu clair');
ok(w.eval("LIGHT_AGENTS.join(',')")==='felix','seul le jaune garde la lettre noire');
ok(html.includes('.agx-ava[style*="FFC400"],.conv-ava[style*="FFC400"],.wk-ava[style*="FFC400"],.pro-dot[style*="FFC400"]{color:#fff}'),'règle de lettre noire annulée');

console.log('\n=== 3. MAYND+ DANS LA MÊME PALETTE ===');
const plus=['soren','iris','eden','vince','neo'].map(id=>w.eval("byId('"+id+"').color"));
ok(plus.every(c=>allowed.includes(c)),'les 5 exclusifs utilisent la même palette');
ok(!plus.some((c,i)=>i>0 && c===plus[i-1]),'aucune répétition côte à côte chez les exclusifs');

console.log('\n=== 4. BUG DE PAIEMENT CORRIGÉ ===');
w.enterApp(false); await wait(30);
w.eval("state.tier='free'");
w.showTab('objectifs'); await wait(30);
ok(w.$('obj-pad').innerHTML.includes('track-lock'),'en gratuit : suivi verrouillé');
ok(w.$('obj-pad').innerHTML.includes('Débloquer ma supervision'),'en gratuit : supervision verrouillée');
w.eval("_upgrading=true; _payPlan='maynd'");
w.obPay(); await wait(60);
ok(S().tier==='maynd','la formule est appliquée');
const after=w.$('obj-pad').innerHTML;
ok(!after.includes('track-lock'),'l\'onglet se débloque sans changer d\'onglet');
ok(after.includes('wheel-card'),'la boussole apparaît immédiatement');
ok(after.includes('Feuille de route'),'la supervision apparaît immédiatement');
// même chose depuis un autre onglet
w.eval("state.tier='free'"); w.showTab('accueil'); await wait(30);
w.eval("_upgrading=true; _payPlan='plus'"); w.obPay(); await wait(60);
ok(S().tier==='plus','passage en MAYND+');
w.showTab('objectifs'); await wait(30);
ok(!w.$('obj-pad').innerHTML.includes('track-lock'),'débloqué aussi depuis un autre onglet');

console.log('\n=== 5. SUPERVISION EN GRATUIT ===');
w.eval("state.tier='free'"); w.showTab('objectifs'); await wait(30);
const pad=w.$('obj-pad').innerHTML;
ok(pad.includes('pro-ava big'),'avatar agrandi et centré');
ok(pad.includes('pro-lock-t') && pad.includes('Professionnel référent certifié'),'titre sur sa propre ligne');
ok(!/pro-lock"><div class="pro-head"/.test(pad),'plus de mise en page en ligne mal alignée');
ok(html.includes('.pro-card.pro-lock{text-align:center'),'bloc centré');
ok(html.includes('.pro-ava.big{width:64px;height:64px'),'avatar 64 pixels');

console.log('\n=== 6. PARCOURS COMPLET ===');
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
w2.enterApp(false); await wait(40); w2.eval("state.tier='plus'");
w2.startQuiz(); await wait(30);
for(let i=0;i<9;i++){ const b=w2.document.querySelectorAll('#quiz-inner .qz2-opt'); if(b.length) b[1].click(); else if(typeof w2.qzSkipText==='function') w2.qzSkipText(); await wait(250); }
try{ w2.qzClose(); }catch(e){}
w2.startObjQuiz(); await wait(30);
for(let i=0;i<9;i++){ w2.objqPick(0); await wait(260); }
ok(w2.eval('state').objAnswers!==null,'i. questionnaire cap terminé');
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
ok(w2.__errs.length===0,'j. aucune erreur sur tout le parcours'+(w2.__errs.length?' : '+w2.__errs.slice(0,4).join(' | '):''));

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
