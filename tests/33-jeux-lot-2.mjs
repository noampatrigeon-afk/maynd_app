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
// Depuis le 30/09 (33-fin-de-jeu.js) : écran de fin, puis « En parler » ouvre la discussion avec
// l'accompagnant du jeu. La table de sortie se lit dans _gameLastExit, les accompagnants utiles
// transmis à l'accompagnant du jeu dans _gameEnd.useful, la discussion ouverte dans opens.
const opens=[];
async function play(theme, labels){
  w.eval("state.awakeAgents=[]"); w.openGame(theme); await wait(10);
  for(const l of labels) await answer(l);
  const restit=w.eval('gameRestitText()');
  const also=w.eval("_gameEnd.useful.map(function(id){return byId(id).name}).join(' ')");
  w.document.querySelector('.game-next')?.click(); await wait(40);
  opens.push([theme, w.eval('threadParts()[0]')]);
  return {restit, deck:w.eval('_gameLastExit'), also};
}

console.log('\n=== 1. QUATRE NOUVEAUX JEUX, UN PAR ACCOMPAGNANT ===');
ok(['leo','otis','kael','mateo'].every(id=>w.eval(`!!gameForAgent('${id}')`)),'Leo, Otis, Kael et Mateo ont chacun leur jeu');

console.log('\n=== 2. LEO : QUESTION PRÉALABLE ===');
w.eval("state.awakeAgents=[]"); w.openGame('relation'); await wait(10);
ok(w.eval('_game.step')==='q0' && /Avant de commencer/.test(w.$('game-inner').textContent),'le jeu commence par la question préalable, sans numéro');
w.eval("gameAbandon()");
let r=await play('relation',['Seul depuis un moment']);
ok(r.deck==='iris' && /Iris/.test(r.also) && !w.$('game').classList.contains('show'),'« seul depuis un moment » arrête le jeu tout de suite, Iris transmise à Leo comme accompagnante utile');
ok(w.eval("agentAwake('leo')"),'Leo est quand même rencontré');
w.eval("closeDeck()");
r=await play('relation',['Séparé récemment','Cette semaine','On se dispute souvent','Je réagis trop fort','Attendre que ça passe','Observer ce qui se passe']);
ok(r.deck==='sol','sortie de la question 3 : réagir trop fort mène à Sol');
ok(/Ava/.test(r.also),'séparé récemment : Ava proposée en second');
ok(/Tu viens de te séparer/.test(r.restit),'la réponse préalable ouvre la restitution');
w.eval("closeDeck()");
const leoAll=w.eval("JSON.stringify(GAMES.relation)");
ok(!/il te |elle te |ton partenaire ne|l'autre ne |l'autre te /i.test(leoAll),'aucune option ne décrit le comportement du partenaire absent');

console.log('\n=== 3. OTIS, KAEL, MATEO : SORTIES ===');
r=await play('affirmation',['Ce mois-ci','Je le dis mal, ça sort de travers','Avec mon ou ma partenaire','Préparer ce que je vais dire','Dire une chose que je repousse']);
ok(r.deck==='leo','Otis : avec son ou sa partenaire mène à Leo');
w.eval("closeDeck()");
r=await play('effort',['Ce mois-ci',"Je m'entraîne mais sans plaisir",'Le regard des autres, la comparaison',"Changer d'activité",'Bouger une fois, sans objectif']);
ok(r.deck==='felix' && /Nora/.test(r.also),'Kael : le regard des autres mène à Felix, Nora en second');
w.eval("closeDeck()");
const kaelAll=w.eval("JSON.stringify(GAMES.effort)");
ok(!/poids|kilo|calorie|silhouette|minceur|record|performance chiffr/i.test(kaelAll),'Kael : aucune mention de poids, de forme, d\'apparence ni de performance chiffrée');
r=await play('travail',['Cette semaine','Trop de charge, je ne tiens plus le rythme','La quantité de travail','Poser des limites','Poser une limite précise']);
ok(r.deck==='naoki','Mateo : la quantité de travail mène à Naoki');
ok(!/burn|épuisement professionnel|dépression|clinique|symptôme/i.test(w.eval("JSON.stringify(GAMES.travail)")),'Mateo : aucun mot clinique');
w.eval("closeDeck()");

console.log('\n=== 4. BRANCHE COURTE ET FICHE ENDORMIE ===');
r=await play('travail',['Je ne sais plus','Ça me va','Depuis quelques mois','Un travail qui a du sens pour moi']);
ok(r.deck==='mateo' && /depuis quelques mois/.test(r.restit),'branche courte : on croit la personne, retour vers Mateo');
w.eval("closeDeck(); state.awakeAgents=[]"); w.openSleepFiche('leo'); await wait(10);
ok(/Jouer avec Leo/.test(w.$('sleep-body').textContent) && /5 questions/.test(w.$('sleep-body').textContent),'fiche endormie de Leo : jeu proposé, 5 questions (la préalable ne compte pas)');
ok(opens.length>5 && opens.every(([th,id])=>id===w.eval(`GAMES['${th}'].agent`)),'« En parler » ouvre toujours la discussion avec l\'accompagnant du jeu (30/09)');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
