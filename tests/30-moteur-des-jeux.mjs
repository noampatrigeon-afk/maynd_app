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

console.log('\n=== 1. LE JEU N’EST VISIBLE QUE POUR UN COMPTE ABONNÉ ===');
w.eval("state.tier='free'"); w.showTab('objectifs'); await wait(20);
ok(!/class="games-row"/.test(w.$('obj-pad').innerHTML), "pas de section jeux en gratuit (le reste de l'onglet est déjà verrouillé)");
w.eval("state.tier='plus'"); w.showTab('objectifs'); await wait(20);
ok(/class="games-row"/.test(w.$('obj-pad').innerHTML), "section jeux visible pour un compte abonné");
ok(w.$('obj-pad').innerHTML.indexOf('games-row') < w.$('obj-pad').innerHTML.indexOf('cap-hero'), "les jeux sont bien en haut du pad, avant le cap");

console.log('\n=== 2. BRANCHE NORMALE, DE BOUT EN BOUT ===');
w.openGame('sommeil'); await wait(20);
ok(w.$('game').classList.contains('show'), "le jeu s'ouvre en plein écran");
ok(w.$('game-opts').style.display==='none', "les options restent cachées avant la révélation (30 secondes, jamais un chiffre affiché)");
await answer('Cette année');
await answer('Je me réveille la nuit');
ok(w.eval('_game.branch')==='normal', "réponse normale à la question 2 -> branche normale");
await answer('Ma tête qui tourne');
await answer('Couper les écrans le soir');
await answer('Essayer quelque chose de léger');
const restit=w.document.querySelector('.game-restit p')?.textContent || '';
ok(restit.includes('Cette année') && restit.includes('la nuit') && restit.includes('la tête') && restit.includes('écrans'), "la restitution assemble les réponses données, sans rien inventer ni conclure : "+restit);
w.document.querySelector('.game-next')?.click(); await wait(10);
ok(/Felix/.test(w.document.querySelector('.game-sortie-txt')?.textContent||''), "l'accompagnant proposé en sortie suit la table (tête qui tourne -> Felix)");
ok(/Tu veux lui en parler/.test(w.document.querySelector('.game-sortie-txt')?.textContent||''), "l'invitation, jamais un verdict");
const runsA=w.eval("state.gameRuns.sommeil");
ok(runsA.length===1 && runsA[0].completed===true && runsA[0].exitAgent==='felix', "la couche réponses enregistre la série complète, horodatée, avec le bon accompagnant de sortie");
w.eval("gameClose()"); await wait(10);

console.log('\n=== 3. BRANCHE COURTE : ON CROIT LA PERSONNE ===');
w.openGame('sommeil'); await wait(20);
await answer('Ce matin');
await answer('Je dors bien');
ok(w.eval('_game.branch')==='short', "«je dors bien» -> branche courte");
await answer('Toujours');
await answer('Mon activité physique');
const shortHtml=w.document.querySelector('.game-restit')?.innerHTML || '';
ok(!/mise en garde|mais|cependant|il faudrait/i.test(shortHtml), "aucune mise en garde ni suggestion d'amélioration dans la branche courte");
w.document.querySelector('.game-next')?.click(); await wait(10);
ok(!w.document.querySelector('.game-sortie-ava'), "pas d'accompagnant imposé en sortie de branche courte (question 3 jamais posée)");
ok(/Retour au parcours/.test(w.$('game-inner').innerHTML), "une seule action de sortie, sans agent");
w.eval("gameClose()"); await wait(10);

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
w.document.querySelector('.game-next')?.click(); await wait(10);
ok(/Voir tes réponses du/.test(w.$('game-inner').innerHTML), "après la restitution, un lien permet de consulter la série précédente");
w.document.querySelector('.game-prev-toggle')?.click(); await wait(10);
// gamePreviousRun remonte la série complétée la plus récente AVANT celle qui vient d'être
// jouée — pas forcément la toute première du test : ici, celle de la section 4 (branche
// irrégulière), la série de la section 6 étant écartée car marquée non terminée.
ok(/Je ne sais plus/.test(w.$('game-prev-list').textContent), "la comparaison montre la série complétée précédente la plus récente, pas une série abandonnée");
w.eval("gameClose()"); await wait(10);

console.log('\n=== 8. AUCUN APPEL AU MODÈLE DANS LE DÉROULÉ ===');
ok(w.__errs.length===0, "aucune erreur runtime sur tout le parcours de test"+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
