import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/maynd.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window; const errs=[];
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.alert=()=>{}; w.confirm=()=>true;
  w.addEventListener('error',e=>errs.push(e.message||String(e.error)));
  w.addEventListener('unhandledrejection',e=>errs.push('promise:'+e.reason));
  w.__errs=errs; return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// ══════ 1. BOOT + POV FREEMIUM ══════
console.log('\n=== 1. démarrage & POV freemium ===');
let w=boot(); await wait(70);
const S=()=>w.eval('state');
ok(w.$('onboarding') && !w.$('onboarding').classList.contains('done'),'onboarding affiché au démarrage');
ok(w.$('ob-welcome').classList.contains('on'),'écran de bienvenue actif');
ok(S().tier==='free','tier par défaut = free (POV freemium)');
ok(w.eval("KEY")==='maynd.state.v7','clé de stockage = v7');

// ══════ 2. TOUS LES BOUTONS (handlers définis) + NAV VALIDE ══════
console.log('\n=== 2. tous les boutons & la navigation ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const handlers=[...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1]);
const names=new Set();
for(const h of handlers){ const t=h.trim(); const mm=t.match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]); }
let undef=[];
for(const n of names){ if(typeof w[n]!=='function') undef.push(n); }
ok(undef.length===0, 'toutes les fonctions de boutons définies'+(undef.length?' (manquantes: '+undef.join(', ')+')':''));
// cibles obShow('ob-x') existent
const targets=new Set([...html.matchAll(/obShow\('([^']+)'\)/g)].map(m=>m[1]));
let missT=[...targets].filter(id=>!w.document.getElementById(id));
ok(missT.length===0,'toutes les cibles de navigation existent'+(missT.length?' (manquantes: '+missT.join(', ')+')':''));

// ══════ 3. PARCOURS CRÉATION DE COMPTE (A→Z) ══════
console.log('\n=== 3. parcours création de compte ===');
const flow=['ob-welcome','ob-signup','ob-verify-choice','ob-verify-code','ob-access','ob-faceid','ob-pin-create','ob-pin-confirm','ob-trust','ob-firstname','ob-account-success','ob-quiz-invite','ob-login'];
let navErr=[];
for(const id of flow){ try{ w.obShow(id); if(!w.$(id).classList.contains('on')) navErr.push(id); }catch(e){ navErr.push(id+':'+e.message); } }
ok(navErr.length===0,'chaque écran d\'onboarding s\'affiche'+(navErr.length?' ('+navErr.join(', ')+')':''));
// freemium-first : succès -> "Accéder à MAYND" -> quiz-invite (pas de plan forcé)
ok(html.includes('Accéder à MAYND</button>') && html.includes('version gratuite'),'écran succès en mode freemium (pas de paiement forcé)');
// entrer dans l'app en freemium
w.obShow('ob-quiz-invite'); w.enterApp(false); await wait(40);
ok(w.$('onboarding').classList.contains('done'),'enterApp -> app affichée');
ok(S().tier==='free','toujours freemium après entrée');

// ══════ 4. VERROUS FREEMIUM (paywall) ══════
console.log('\n=== 4. verrous freemium (message d\'erreur payant) ===');
w.startWithAgent('naoki'); await wait(10);
ok(w.$('paywall-sheet').classList.contains('show'),'accompagnant verrouillé -> paywall');
ok(w.$('pw-badge').textContent==='MAYND','paywall accompagnant standard -> badge MAYND');
w.closeSheet('paywall-backdrop','paywall-sheet');
w.startWithAgent('soren'); await wait(10); // soren = MAYND+
ok(w.$('pw-badge').textContent==='MAYND+','accompagnant MAYND+ -> badge MAYND+');
ok(/3 accompagnants|MAYND\+/.test(w.$('pw-sub').textContent),'message paywall pertinent');
w.closeSheet('paywall-backdrop','paywall-sheet');
// limite 5 messages/jour
const s4=S(); s4.tier='free'; s4.freeDay=w.eval('todayKey()'); s4.freeCount=5;
w.showTab('chat'); await wait(10);
const ci=w.$('chat-input'); if(ci){ ci.value='salut'; w.send(); }
await wait(10);
ok(w.$('paywall-sheet').classList.contains('show'),'limite 5 msg/jour -> paywall');
ok(/limite/i.test(w.$('pw-title').textContent),'message de limite affiché');
w.closeSheet('paywall-backdrop','paywall-sheet');
// MIA toujours accessible en freemium
ok(w.isUnlocked('mia')===true && w.isUnlocked('naoki')===false,'MIA déverrouillée, accompagnants verrouillés');

// ══════ 5. UPGRADE : paywall -> paiement -> tier appliqué ══════
console.log('\n=== 5. parcours d\'upgrade ===');
w.showPaywall('plus','Test','Test sub'); await wait(5);
w.pwGo(); await wait(20); // -> startUpgrade('plus') -> paiement
ok(!w.$('onboarding').classList.contains('done') && w.$('ob-payment').classList.contains('on'),'upgrade -> écran de paiement');
ok(w.$('pay-name').textContent==='MAYND+','paiement configuré pour MAYND+');
w.obPay(); await wait(20);
ok(S().tier==='plus','après paiement -> tier MAYND+');
ok(w.$('onboarding').classList.contains('done'),'retour dans l\'app après paiement');
ok(w.isUnlocked('naoki')===true,'accompagnants déverrouillés après upgrade');
// annulation d'upgrade revient à l'app
w.startUpgrade('maynd'); await wait(10);
ok(w.$('ob-payment').classList.contains('on'),'upgrade MAYND -> paiement');
w.payCancel(); await wait(10);
ok(w.$('onboarding').classList.contains('done'),'annulation paiement -> retour app');

// ══════ 6. PROTOCOLE DE CRISE (Q1) ══════
console.log('\n=== 6. protocole de crise (v17) ===');
const w2=boot(); await wait(70);
w2.qzRenderCrisis();
const ch=w2.$('quiz-inner').innerHTML;
ok(ch.includes('3114'),'crise: 3114');
ok(ch.includes('SOS Amitié') && ch.includes('09 72 39 40 50'),'crise: SOS Amitié');
ok(ch.includes('SAMU'),'crise: 15 SAMU');
ok(ch.includes('Doctolib'),'crise: Doctolib');
ok(ch.includes('Mon soutien psy'),'crise: Mon soutien psy');
ok(ch.includes("n\u2019est pas adapté"),'crise: message honnête v17');
ok(ch.includes('version gratuite'),'crise: accès version gratuite');
ok(typeof w2.qzCrisisClose==='function','crise: bouton fonctionnel');
// via Q1 réelle
w2.startQuiz();
const labels=[...w2.document.querySelectorAll('.qz2-opt span:last-child')].map(s=>s.textContent);
const oui=labels.indexOf('Oui');
let trig=false; if(oui>=0){ w2.qzPick(oui); trig=w2.$('quiz-inner').innerHTML.includes('3114'); }
ok(trig,'répondre "Oui" en Q1 -> écran de crise');

// ══════ 7. POLICES ══════
console.log('\n=== 7. polices (v17) ===');
const link=[...w.document.querySelectorAll('link[href*="googleapis"]')].map(l=>l.href).join(' ');
ok(/Poppins/.test(link) && /DM.Sans/.test(link),'lien Google Fonts: Poppins + DM Sans');
ok(!html.includes('Sora') && !html.includes('Hanken'),'plus aucune référence Sora/Hanken');

// ══════ 8. ERREURS RUNTIME ══════
console.log('\n=== 8. erreurs runtime ===');
ok(w.__errs.length===0,'aucune erreur runtime (parcours 1)'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
ok(w2.__errs.length===0,'aucune erreur runtime (parcours crise)'+(w2.__errs.length?' : '+w2.__errs.slice(0,3).join(' | '):''));

console.log('\n──────────────────────────────');
console.log('  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
console.log('──────────────────────────────');
process.exit(fail?1:0);
