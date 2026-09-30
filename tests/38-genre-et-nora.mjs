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
let w=boot(); await wait(90); w.enterApp(false); await wait(40); w.eval("state.tier='plus'");
async function answer(label){
  w.gameRevealNow(); await wait(5);
  const b=[...w.document.querySelectorAll('#game-opts .game-opt')].find(x=>x.textContent.trim()===label);
  if(!b) throw new Error('option introuvable : '+label);
  b.click(); await wait(5);
}
const F=s=>w.eval('accordFeminin('+JSON.stringify(s)+')');

console.log('\n=== 1. LE CHOIX ===');
ok(!!w.document.querySelector('#ob-firstname .gender-pick'),'à l\'inscription, sur l\'écran du prénom');
ok(w.document.querySelectorAll('#ob-firstname .gender-pick .gp').length===3,'homme, femme, je préfère ne pas répondre');
w.openProfile(); await wait(10);
ok(!!w.document.querySelector('#profile-body .gender-pick'),'modifiable dans le profil');
w.eval("closeProfile()");
w.setGender('n');
ok(w.eval("isFem()")===false,'« je préfère ne pas répondre » est traité au masculin (décision du porteur du projet)');

console.log('\n=== 2. LES RÈGLES D\'ACCORD ===');
w.setGender('f');
ok(F("La dernière fois que tu t'es réveillé vraiment reposé.")==="La dernière fois que tu t'es réveillée vraiment reposée.",'tu t\'es réveillée reposée');
ok(F("Tu ne te sens pas prêt à changer quoi que ce soit.")==="Tu ne te sens pas prête à changer quoi que ce soit.",'prête');
ok(F("La dernière fois que tu as été fier de toi.")==="La dernière fois que tu as été fière de toi.",'fière');
ok(F("Le Fédérateur")==="La Fédératrice",'profil du questionnaire au féminin');
ok(F("La dernière fois que tu as senti que tu avançais.")==="La dernière fois que tu as senti que tu avançais.",'pas d\'accord avec « avoir »');
ok(F("Avec qui c'est le plus dur.")==="Avec qui c'est le plus dur.",'tournure impersonnelle inchangée');
ok(F("Du temps seul qui me fait du bien")==="Du temps seul qui me fait du bien",'« du temps seul » inchangé');
ok(F("Tu t'es fixé un programme, ça n'a pas suffi.")==="Tu t'es fixé un programme, ça n'a pas suffi.",'pas d\'accord quand le complément suit');
ok(F("Ton compte est prêt")==="Ton compte est prêt",'« ton compte est prêt » inchangé');
const once=F("Tu te sens seul même entouré");
ok(once==="Tu te sens seule même entourée" && F(once)===once,'une règle ne s\'applique jamais deux fois');

console.log('\n=== 3. À L\'ÉCRAN, JAMAIS DANS LE CHAT ===');
w.openGame('sommeil'); await wait(20);
ok(/réveillée vraiment reposée/.test(w.$('game-inner').textContent),'les jeux s\'accordent à l\'affichage');
w.eval("gameAbandon()");
w.showTab('chat'); await wait(10);
const d=w.document.createElement('div'); d.className='bubble user'; d.textContent='Je suis épuisé'; w.$('messages').appendChild(d); await wait(20);
ok(d.textContent==='Je suis épuisé','ce que la personne écrit n\'est jamais réécrit');
ok(/la personne est une femme/.test(w.eval("composeSystem()")),'l\'IA reçoit la consigne d\'accord');
w.setGender('h');
ok(/au masculin/.test(w.eval("composeSystem()")),'et au masculin pour un homme');

console.log('\n=== 4. LES ACCOMPAGNANTES ===');
w.eval("state.awakeAgents=[]"); w.openSleepFiche('eden'); await wait(10);
ok(/Elle dort/.test(w.$('sleep-body').textContent),'« Elle dort » pour Eden');
w.eval("closeSleepFiche()"); w.openSleepFiche('leo'); await wait(10);
ok(/Il dort/.test(w.$('sleep-body').textContent),'« Il dort » pour Leo');
w.eval("closeSleepFiche()");
w.openAgentDeck('ava'); await wait(40);
ok(/Ce qu.elle fait avec toi/.test(w.document.querySelector('.deck-page[data-id="ava"] .deck-sec').textContent),'« Ce qu\'elle fait avec toi » sur la fiche d\'Ava');
w.eval("closeDeck()");

console.log('\n=== 5. NORA ===');
w.eval("state.gameRuns={}; state.awakeAgents=[]");
/* uniquement les textes affichés (titres, réponses, restitutions), pas les clés techniques */
const noraTxt=w.eval("(function(){ var S=[]; (function walk(o){ if(o&&typeof o==='object') Object.keys(o).forEach(function(k){ var v=o[k]; if(typeof v==='string' && ['title','titleIrregular','label','restit','accroche'].indexOf(k)>=0) S.push(v); else walk(v); }); })(GAMES.corps); return S.join(' | '); })()");
ok(!/[0-9]|kilo|calorie|régime|poids|maigr|IMC|anorex|boulim|priv|contrôl|rédui|réduction|objectif/i.test(noraTxt),'aucun chiffre, aucun régime, aucune réduction ni privation');
ok(!w.eval("JSON.stringify(GAMES.corps)").includes("'neo'") && !/"(exit|second|alsoAlways)":"neo"/.test(w.eval("JSON.stringify(GAMES.corps)")),'jamais Neo en sortie');
w.openGame('corps'); await wait(10);
await answer('Mon rapport à ce que je mange'); await answer('Cette année');
ok(/moments où tu manges/.test(w.$('game-inner').textContent),'branche alimentation : la question 2 devient « manger »');
w.eval("gameAbandon()");
w.openGame('corps'); await wait(10);
await answer('Le regard que je porte sur moi'); await answer('Jamais vraiment'); await answer('Ça prend beaucoup de place dans ma tête');
ok(w.eval("_game.step")==='stopped' && /On s.arrête là/.test(w.$('game-inner').textContent),'fort et durable : arrêt anticipé, calme');
ok(!/alerte|urgence|trouble|danger|inquiét/i.test(w.$('game-inner').textContent),'aucun mot clinique ni alarmant');
ok(w.eval("proSignals().some(function(s){ return s.k==='blocage' && /Nora/.test(s.d); })"),'le professionnel reçoit un signal de blocage');
w.eval("gameClose()");
w.openGame('corps'); await wait(10);
await answer('Comment je me sens dans mon corps'); await answer('Ce mois-ci'); await answer('Ça prend beaucoup de place dans ma tête');
ok(w.eval("_game.step")==='q3','fort mais pas durable : le jeu continue');
w.eval("gameAbandon()");

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
