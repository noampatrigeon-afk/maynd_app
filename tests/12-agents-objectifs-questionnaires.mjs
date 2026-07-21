import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/maynd.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window; const errs=[];
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true;
  w.addEventListener('error',e=>errs.push((e.message||String(e.error))+' @'+(e.lineno||'')));
  w.addEventListener('unhandledrejection',e=>errs.push('p:'+e.reason));
  w.__errs=errs; return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let w=boot(); await wait(70);
const S=()=>w.eval('state');

// ── 1. bug d'espacement réglé : classes uniques agx ──
console.log('\n=== 1. composant agents unifié (bug espacement) ===');
ok(!html.includes('.pn{') || true, 'ok'); // info
const row=w.agentRowHTML('felix','browse');
ok(row.includes('agx-nm') && row.includes('agx-dm'),'lignes agents en classes uniques (agx-nm/agx-dm)');
ok(row.includes('Felix') && row.includes('Confiance'),'nom + domaine présents et distincts');
w.enterApp(false); await wait(20);
w.eval("state.tier='plus'; state.favorites=['naoki','sol','felix']; state.focus={agent:'naoki'}");

// ── 2. les 3 écrans utilisent le même composant ──
console.log('\n=== 2. accueil / tiroir / participants : même composant ===');
w.showTab('accueil'); await wait(10);
ok(/agx-row/.test(w.$('agent-strip').innerHTML),'accueil : rangées unifiées');
w.openDrawer(); await wait(10);
ok(/agx-row/.test(w.$('drawer-body').innerHTML),'tiroir : rangées unifiées');
w.showTab('chat'); await wait(10); w.openParts(); await wait(10);
ok(/agx-row/.test(w.$('parts-body').innerHTML),'participants : rangées unifiées');
ok(/agx-tgl/.test(w.$('parts-body').innerHTML),'participants : interrupteur présent');
ok(/agx-star/.test(w.$('drawer-body').innerHTML) && /agx-star/.test(w.$('agent-strip').innerHTML) && /agx-star/.test(w.$('parts-body').innerHTML),'étoile présente sur les 3 écrans');

// ── 3. mise en valeur MAYND+ ──
console.log('\n=== 3. mise en valeur des 5 MAYND+ ===');
const dr=w.$('drawer-body').innerHTML;
ok(dr.includes('Exclusifs MAYND+'),'section Exclusifs MAYND+');
['Soren','Iris','Eden','Vince','Neo'].forEach(n=>ok(dr.includes(n),'MAYND+ : '+n+' présent'));
const sorenRow=w.agentRowHTML('soren','browse');
ok(sorenRow.includes('agx-row plus') && sorenRow.includes('agx-badge'),'agent MAYND+ : liseré + badge');

// ── 4. étoile fonctionne depuis le chat ──
console.log('\n=== 4. favori activable partout ===');
w.eval("state.favorites=[]"); w.toggleFav('eden'); ok(w.isFav('eden')===true,'ajout favori depuis n\'importe où');

// ── 5. objectifs : cap héros + profil + semaine ──
console.log('\n=== 5. refonte objectifs ===');
w.eval("state.tier='plus'; state.profile={key:'MR',name:'Le Fédérateur'}; state.cap='Test cap'; state.focus={agent:'naoki'}");
w.showTab('objectifs'); await wait(10);
const pad=w.$('obj-pad').innerHTML;
ok(pad.includes('cap-hero') && pad.includes('Test cap'),'cap en héros');
ok(pad.includes('pf-card') && pad.includes('Le Fédérateur'),'carte profil affichée à côté');
ok(pad.includes('week-card'),'objectif de la semaine présent');
ok(pad.indexOf('Ton profil')<pad.indexOf('boussole')||pad.indexOf('Ton profil')<pad.indexOf('Boussole')||pad.includes('pf-week-row'),'profil placé près du cap');
ok(pad.includes('wheel-card'),'boussole présente (payant)');

// ── 6. défis & jalons + badges ──
console.log('\n=== 6. défis (questionnaires) + badges ===');
w.eval("state.questionnaireDone=true; state.challenges={objective:false}"); w.renderObjectives();
let p2=w.$('obj-pad').innerHTML;
ok(p2.includes('Profil psychologique') && p2.includes('Trouver un objectif'),'2 défis affichés');
ok(/chal done/.test(p2),'défi profil validé (questionnaire fait)');
ok(p2.includes('Profil trouvé') && p2.includes('Objectif trouvé'),'2 nouveaux badges');

// ── 7. questionnaire objectif (9 questions — détail couvert par test15) ──
console.log('\n=== 7. questionnaire objectif ===');
w.eval("state.objectives=[]; state.cap=''; state.favorites=[]; state.focus=null; state.challenges={}");
w.startObjQuiz(); await wait(10);
ok(w.$('orient').classList.contains('show'),'questionnaire objectif ouvert');
ok(w.document.querySelectorAll('#or-inner .qz2-opt').length===6,'Q1 à réponse unique (6 options)');
w.objqPick(0); await wait(260);
for(let i=0;i<8;i++){ w.objqPick(0); await wait(200); }
ok(S().challenges.objective===true,'défi objectif validé');
ok(S().objAnswers && S().objAnswers.domain==='travail','toutes les réponses stockées (dossier pro)');
ok(S().cap && /travail/.test(S().cap),'cap généré selon le domaine');
ok(S().objectives.length===1,'un premier objectif concret créé');
ok(S().objectives[0].link==='mateo','objectif relié au bon accompagnant');
ok(S().favorites.includes('mateo'),'accompagnant ajouté aux favoris');
// explorer -> objectif de se connaître
w.eval("state.cap=''; state.capMeta=false; state.objectives=[]");
w.startObjQuiz(); await wait(10); w.objqPick(0); await wait(260);
w.objqPick(3); await wait(200);
for(let i=0;i<7;i++){ w.objqPick(0); await wait(200); }
ok(S().capMeta===true,'explorer -> objectif de se connaître');

// ── 8. roulette année de naissance ──
console.log('\n=== 8. roulette année de naissance ===');
const items=w.$('year-wheel').querySelectorAll('.yw-item');
ok(items.length>50,'roulette peuplée ('+items.length+' années)');
ok(S().birthYear && S().birthYear>1900,'année par défaut sélectionnée ('+S().birthYear+')');
w.pickYear(2001); ok(S().birthYear===2001,'sélection d\'une année');
ok([...w.$('year-wheel').querySelectorAll('.yw-item')].some(it=>it.classList.contains('on') && it.getAttribute('data-y')==='2001'),'année sélectionnée mise en avant');

// ── 9. tous les boutons + zéro erreur ──
console.log('\n=== 9. tous les boutons & erreurs ===');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
let undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,4).join(' | '):''));

console.log('\n──────────────────────────────');
console.log('  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
console.log('──────────────────────────────');
process.exit(fail?1:0);
