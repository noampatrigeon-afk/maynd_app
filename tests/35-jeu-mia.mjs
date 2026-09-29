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
const deckCalls=[];
{ const orig=w.openAgentDeck; w.openAgentDeck=function(id){ deckCalls.push(id); return orig.apply(this, arguments); }; }
async function answer(label){
  w.gameRevealNow(); await wait(5);
  const b=[...w.document.querySelectorAll('#game-opts .game-opt')].find(x=>x.textContent.trim()===label);
  if(!b) throw new Error('option introuvable : '+label);
  b.click(); await wait(5);
}
const card=()=>{ w.showTab('objectifs'); return !!w.document.querySelector('.mia-point-card'); };

console.log('\n=== 1. DISPONIBILITÉ ===');
w.eval("state.gameRuns={}; state.bilanHistory=[]; state.objAnswers={domain:'relations'}");
ok(!card(),'pas au premier jour');
w.eval("state.gameRuns={sommeil:[{at:1,completed:true}],relation:[{at:2,completed:true}]}");
ok(!card(),'pas après deux jeux de terrain');
w.eval("state.gameRuns.effort=[{at:3,completed:false}]");
ok(!card(),'un jeu abandonné ne compte pas');
w.eval("state.gameRuns.effort=[{at:3,completed:true}]");
ok(card(),'disponible après trois jeux de terrain terminés');
w.eval("state.gameRuns={}; state.bilanHistory=[{text:'x',date:Date.now(),by:'Ton professionnel référent'}]");
ok(card(),'disponible après le premier bilan signé');
const pad=w.$('obj-pad').innerHTML;
ok(pad.indexOf('mia-point-card') < pad.indexOf('cap-hero'),'en tête de l\'onglet Parcours');

console.log('\n=== 2. PREMIER PASSAGE ===');
w.document.querySelector('.mia-point-btn').click(); await wait(10);
ok(w.eval("_game && _game.theme")==='point','la carte lance le point de mesure');
await answer('Ce mois-ci'); await answer('Je stagne'); await answer('Mon travail');
ok(/Depuis quand/.test(w.document.querySelector('.game-q').textContent),'question 4 remplacée par « depuis quand » au premier passage');
await answer('Depuis quelques mois'); await answer('Lever le pied');
ok(/Quand tu as posé ton objectif, tu situais ça du côté de tes relations\. Aujourd’hui, c’est le travail\./.test(w.document.querySelector('.game-restit-cmp')?.textContent||''),'premier passage comparé au questionnaire d\'orientation');
w.document.querySelector('.game-next').click(); await wait(40);
ok(deckCalls[deckCalls.length-1]==='mateo','le travail mène à Mateo');
w.eval("closeDeck()");

console.log('\n=== 3. PASSAGES SUIVANTS ===');
w.openGame('point'); await wait(10);
await answer('Ce mois-ci'); await answer('Je stagne'); await answer('Mon travail');
ok(/ce qui a bougé/.test(w.document.querySelector('.game-q').textContent),'question 4 normale ensuite');
await answer("Rien n'a vraiment changé"); await answer('Continuer comme ça');
ok(!w.document.querySelector('.game-restit-cmp'),'même terrain : aucune comparaison affichée');
w.document.querySelector('.game-next').click(); await wait(40); w.eval("closeDeck()");
w.eval("state.gameRuns.affirmation=[{at:Date.now(),completed:true}]");
w.openGame('point'); await wait(10);
await answer('Ce mois-ci'); await answer('Je stagne'); await answer('Mes relations'); await answer("Ça s'est compliqué"); await answer('Lever le pied');
const cmp=w.document.querySelector('.game-restit-cmp')?.textContent||'';
ok(/du côté du travail\. Aujourd’hui, ce sont tes relations\./.test(cmp),'terrain déplacé : comparaison avec le passage précédent');
ok(!/progr|recul|mieux|moins bien/i.test(cmp),'un déplacement, jamais un progrès ni un recul');
w.document.querySelector('.game-next').click(); await wait(40);
ok(deckCalls[deckCalls.length-1]==='otis','« mes relations » suit le contexte connu (dernier jeu joué : Otis)');
w.eval("closeDeck()");

console.log('\n=== 4. PROFESSIONNEL ET SIGNAL ===');
ok(w.eval("proSignals().some(function(s){ return s.k==='stagnation' && /points de mesure/.test(s.d); })"),'trois « je stagne » de suite : signal de stagnation existant');
ok(/Dernier point de mesure/.test(w.eval("draftBilanText()")),'la question 3 remonte dans le brouillon de bilan');
w.eval("openProDashboard()"); await wait(10);
ok(/Points de mesure/.test(w.$('pd-body').textContent),'et dans l\'espace du professionnel');
w.eval("closeProDashboard()");
w.showTab('objectifs'); await wait(20);
ok(!/stagnation|points de mesure de suite/i.test(w.$('obj-pad').innerHTML),'rien n\'est affiché à la personne'); // « intervient sur signal » (supervision) est un texte normal de l'onglet

console.log('\n=== 5. REVOIR MON OBJECTIF ===');
w.openGame('point'); await wait(10);
await answer('Ce mois-ci'); await answer("J'avance, mais moins qu'avant"); await answer('Mon travail'); await answer("Rien n'a vraiment changé"); await answer('Revoir mon objectif');
const before=deckCalls.length;
w.document.querySelector('.game-next').click(); await wait(40);
ok(w.$('orient').classList.contains('show') && deckCalls.length===before,'« revoir mon objectif » ouvre le questionnaire d\'objectif, pas la fiche');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
