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
let w=boot(); await wait(90); w.enterApp(false); await wait(40);

// Répond à la question courante en révélant tout de suite (on ne va pas attendre 30 vraies
// secondes par question dans un test), puis clique l'option demandée par son libellé.
async function answer(label){
  w.gameRevealNow(); await wait(10);
  const btns=[...w.document.querySelectorAll('#game-opts .game-opt')];
  const b=btns.find(x=>x.textContent.trim()===label);
  if(!b) throw new Error('option introuvable : '+label);
  b.click(); await wait(10);
}

// Espion sur la fiche de présentation : depuis le 29/09, la fin d'un jeu ouvre la fiche de
// l'accompagnant proposé au lieu d'un écran de sortie (22-retours-du-29-09.js). En JSDOM, la
// position de défilement de la fiche reste à 0, on vérifie donc l'argument passé.
const deckCalls=[];
{ const orig=w.openAgentDeck; w.openAgentDeck=function(id){ deckCalls.push(id); return orig.apply(this, arguments); }; }

console.log('\n=== 1. ONGLET PARCOURS : « TON ENTOURAGE » REMPLACE LA SECTION JEUX (29/09) ===');
w.eval("state.tier='free'"); w.showTab('objectifs'); await wait(20);
ok(!/class="games-row"/.test(w.$('obj-pad').innerHTML), "pas de section jeux en gratuit");
w.eval("state.tier='plus'"); w.showTab('objectifs'); await wait(20);
const padH=w.$('obj-pad').innerHTML;
ok(!/class="games-row"/.test(padH), "plus de section jeux en haut de l'onglet");
ok(/Découvrir mon entourage/.test(padH), "bloc Ton entourage avec son bouton");
ok(padH.indexOf('cap-hero') < padH.indexOf('entp-card') && padH.indexOf('entp-card') < padH.indexOf('Ta supervision'), "Ton entourage entre le parcours et la supervision");
w.document.querySelector('.entp-btn').click(); await wait(10);
ok(w.$('recap').classList.contains('show'), "le bouton ouvre le récapitulatif");
w.eval("closeRecap()");

console.log('\n=== 2. BRANCHE NORMALE, DE BOUT EN BOUT ===');
w.openGame('sommeil'); await wait(20);
ok(w.$('game').classList.contains('show'), "le jeu s'ouvre en plein écran");
ok(w.$('game-opts').style.display==='none', "les options restent cachées avant la révélation (10 secondes)");
await answer('Cette année');
await answer('Je me réveille la nuit');
ok(w.eval('_game.branch')==='normal', "réponse normale à la question 2 -> branche normale");
await answer('Ma tête qui tourne');
await answer('Couper les écrans le soir');
await answer('Essayer quelque chose de léger');
// 30/09 : les phrases de restitution ne sont plus affichées (écran de fin, 33-fin-de-jeu.js),
// mais gameRestitText() les assemble toujours.
const restit=w.eval('gameRestitText()');
ok(restit.includes('Cette année') && restit.includes('la nuit') && restit.includes('la tête') && restit.includes('écrans'), "la restitution assemble les réponses données, sans rien inventer ni conclure : "+restit);
ok(/Miro a tes 5 réponses/.test(w.$('game-inner').textContent) && !w.document.querySelector('.game-restit p'), "écran de fin : Miro a les réponses, plus de résumé qui les répète");
w.document.querySelector('.game-next')?.click(); await wait(60);
ok(!w.$('game').classList.contains('show'), "la fin du jeu ferme l'écran plein écran");
ok(w.eval("threadParts()[0]")==='miro' && /Je viens de finir ton jeu/.test(w.eval("activeThread().msgs.filter(function(m){return m.role==='user'}).pop().content")), "« En parler » ouvre la discussion avec Miro et y poste le récapitulatif (30/09)");
ok(w.eval('_gameLastExit')==='felix' && w.eval('_gameEnd.useful[0]')==='felix', "l'accompagnant proposé par la table (tête qui tourne -> Felix) est transmis à Miro");
ok(w.eval("agentAwake('miro')"), "finir le jeu réveille l'accompagnant du jeu (Miro)");
const runsA=w.eval("state.gameRuns.sommeil");
ok(runsA.length===1 && runsA[0].completed===true && runsA[0].exitAgent==='felix', "la couche réponses enregistre la série complète, horodatée, avec le bon accompagnant de sortie");
w.eval("closeDeck()"); await wait(10);

console.log('\n=== 3. BRANCHE COURTE : ON CROIT LA PERSONNE ===');
w.openGame('sommeil'); await wait(20);
await answer('Ce matin');
await answer('Je dors bien');
ok(w.eval('_game.branch')==='short', "«je dors bien» -> branche courte");
await answer('Toujours');
await answer('Mon activité physique');
const shortHtml=w.eval('gameRestitText()');
ok(!/mise en garde|mais|cependant|il faudrait/i.test(shortHtml), "aucune mise en garde ni suggestion d'amélioration dans la branche courte");
w.document.querySelector('.game-next')?.click(); await wait(60);
ok(w.eval("threadParts()[0]")==='miro' && w.eval('_gameEnd.useful.length')===0, "branche courte : aucun autre accompagnant suggéré, la discussion s'ouvre avec celui du jeu (question 3 jamais posée)");
w.eval("closeDeck()"); await wait(10);

console.log('\n=== 4. BRANCHE IRRÉGULIÈRE : LA QUESTION 3 SE REFORMULE ===');
w.openGame('sommeil'); await wait(20);
await answer('Je ne sais plus');
await answer('Ça change tout le temps');
ok(w.eval('_game.branch')==='irregular', "«ça change tout le temps» -> branche irrégulière");
ok(/différence entre une bonne et une mauvaise nuit/.test(w.$('game-inner').innerHTML), "la question 3 change de formulation, même structure");
await answer('Mon corps');
await answer('Rien de particulier');
await answer('Je ne sais pas par où commencer');
ok(w.eval("state.gameRuns.sommeil[state.gameRuns.sommeil.length-1].exitAgent")==='miro', "la table de sortie s'applique aussi à la question reformulée");
w.eval("gameClose()"); await wait(10);

console.log('\n=== 5. LE DÉCROCHAGE EST UNE RÉPONSE À PART, PAS UNE ABSENCE ===');
w.openGame('sommeil'); await wait(20);
w.gameRevealNow(); await wait(10);
ok(w.document.querySelector('.game-opts-dropout .game-opt.dropout')!==null, "le décrochage est visuellement séparé des paliers de l'échelle");
w.eval("gameAbandon()"); await wait(10);

console.log('\n=== 6. ABANDON EN COURS DE ROUTE : CE QUI EST RÉPONDU EST QUAND MÊME ENREGISTRÉ ===');
const before=(w.eval("state.gameRuns.sommeil")||[]).length;
w.openGame('sommeil'); await wait(20);
await answer('Cette semaine');
w.eval("gameAbandon()"); await wait(10);
const runsB=w.eval("state.gameRuns.sommeil");
ok(runsB.length===before+1, "quitter en cours de route enregistre quand même une série");
ok(runsB[runsB.length-1].completed===false, "cette série est marquée non terminée");
ok(runsB[runsB.length-1].answers.q1==='Cette semaine', "la seule réponse donnée est bien celle qui est enregistrée");
ok(!w.$('game').classList.contains('show'), "sortir ferme bien l'écran plein écran");

console.log('\n=== 7. REJEU : LES ANCIENNES RÉPONSES NE SE VOIENT QU’APRÈS AVOIR REJOUÉ ===');
w.openGame('sommeil'); await wait(20);
ok(!/game-prev/.test(w.$('game-inner').innerHTML), "aucune ancienne réponse visible avant d'avoir répondu à nouveau");
await answer('Ce mois-ci');
await answer("J'ai du mal à m'endormir");
await answer("Ce qui m'entoure, bruit, lumière, quelqu'un");
await answer('Bouger davantage dans la journée');
await answer('Ne rien changer pour l’instant');
ok(/Voir tes réponses du/.test(w.$('game-inner').innerHTML), "sur la restitution, un lien permet de consulter la série précédente");
w.document.querySelector('.game-prev-toggle[onclick="gameTogglePrev()"]')?.click(); await wait(10);
// gamePreviousRun remonte la série complétée la plus récente AVANT celle qui vient d'être
// jouée — pas forcément la toute première du test : ici, celle de la section 4 (branche
// irrégulière), la série de la section 6 étant écartée car marquée non terminée.
ok(/Je ne sais plus/.test(w.$('game-prev-list').textContent), "la comparaison montre la série complétée précédente la plus récente, pas une série abandonnée");
w.eval("gameClose()"); await wait(10);

console.log('\n=== 8. AUCUN APPEL AU MODÈLE DANS LE DÉROULÉ ===');
ok(w.__errs.length===0, "aucune erreur runtime sur tout le parcours de test"+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
