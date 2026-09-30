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

console.log('\n=== 1. FIN DU JEU : L\'ACCOMPAGNANT DU JEU, JAMAIS UN AUTRE (30/09) ===');
w.eval("state.awakeAgents=[]; state.gameRuns={}");
w.openGame('sommeil'); await wait(10);
for(const l of ['Cette année','Je me réveille la nuit','Je ne sais pas','Couper les écrans le soir','Essayer quelque chose de léger']) await answer(l);
const endTxt=w.$('game-inner').textContent;
ok(/Miro a tes 5 réponses/.test(endTxt) && /Pas besoin de tout réécrire/.test(endTxt),'écran de fin : Miro a les réponses et est là pour en parler');
ok(/En parler avec Miro maintenant/.test(endTxt) && /Ce que Miro peut vraiment faire pour toi/.test(endTxt),'deux boutons : en parler, découvrir ce qu\'il fait');
ok(w.eval('_gameEnd.useful.length')===0 && w.eval('_gameLastExit')==='mia','« Je ne sais pas » : MIA n\'est jamais transmise comme accompagnante utile (elle est toujours là)');

console.log('\n=== 2. LA VOIX, RÉCOMPENSE DU JEU ===');
ok(/Tu as réveillé la voix de Miro/.test(w.document.querySelector('.gend-voice')?.textContent||''),'finir le jeu réveille la voix : récompense sur l\'écran de fin');
w.eval("gameEndFiche()"); await wait(20);
ok(deckCalls[deckCalls.length-1]==='miro','« Ce que Miro peut vraiment faire pour toi » ouvre sa fiche');
const reward=w.document.querySelector('.deck-page[data-id="miro"] .deck-voice.reward');
ok(!!reward && /Écouter sa voix/.test(reward.textContent) && /L’appeler/.test(reward.textContent),'et sa fiche garde la récompense : écouter, appeler');
w.eval("closeDeck()");

console.log('\n=== 2 bis. « EN PARLER » : RÉCAPITULATIF ENVOYÉ, RÉPONSE DANS LA FOULÉE, ACCOMPAGNANT APPELÉ ===');
{
  let calls=0; const systems=[];
  const saveFetch=w.fetch;
  w.eval("state.apiKey='x'; GAME_INVITE_DELAY=10");
  w.fetch=(u,o)=>{ calls++; try{ systems.push(JSON.parse(o.body).system||''); }catch(e){}
    const txt= calls===1 ? 'Ta tête tourne la nuit. Sol travaille ça, je lui propose de venir. [[SUGGEST:sol]]' : '[[REDIGE:sol]] Miro m’a fait venir. Qu’est-ce qui tourne le plus ?';
    return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({content:[{type:'text',text:txt}]})}); };
  w.openGame('sommeil'); await wait(10);
  for(const l of ['Cette année','Je me réveille la nuit','Ma tête qui tourne','Couper les écrans le soir','Essayer quelque chose de léger']) await answer(l);
  w.document.querySelector('.game-next').click(); await wait(200);
  const msgs=w.eval("JSON.stringify(activeThread().msgs)");
  ok(w.eval("threadParts()[0]")==='miro' && /Je viens de finir ton jeu « Tes nuits »/.test(msgs) && /Ma tête qui tourne/.test(msgs),'le récapitulatif est posté dans la discussion avec Miro, sans rien retaper');
  ok(/terminer ton jeu « Tes nuits »/.test(systems[0]||''),'Miro sait qu\'on sort de son jeu');
  ok(w.eval("threadParts().indexOf('sol')")>=0 && calls===2 && /vient de te faire venir/.test(systems[1]||''),'Miro fait venir Sol, qui répond dans la foulée');
  ok(/Miro m’a fait venir/.test(msgs) && !/\[\[/.test(msgs),'réponse de Sol affichée, balises retirées');
  w.fetch=saveFetch; w.eval("state.apiKey=''");
}

console.log('\n=== 2 ter. « AUTRE » SOUS CHAQUE QUESTION ===');
w.openGame('sommeil'); await wait(10); w.gameRevealNow(); await wait(5);
ok(!!w.document.querySelector('#game-autre .game-autre-btn'),'une case « Autre »');
w.eval("gameAutreOpen()"); w.$('game-autre-tx').value='Je dors par morceaux'; w.eval("gameAutreValidate('q1')"); await wait(5);
ok(w.eval("_game.step")==='q2','valider passe à la question suivante');
w.gameRevealNow(); await wait(5); w.eval("gameAutreOpen()"); w.eval("gameAutreValidate('q2')"); await wait(5);
ok(w.eval("_game.step")==='q3' && w.eval("_game.branch")==='normal','« Autre » sans texte se valide aussi, et suit la branche normale');
w.eval("gameAbandon()");
const lastRun=w.eval("state.gameRuns.sommeil[state.gameRuns.sommeil.length-1].answers");
ok(lastRun.q1==='Autre : Je dors par morceaux' && lastRun.q2==='Autre','le texte libre est enregistré');
w.openGame('habitudes'); await wait(10); w.gameRevealNow(); await wait(5);
ok(!w.document.querySelector('#game-autre'),'pas de doublon là où une réponse « Autre chose » existe déjà');
w.eval("gameAbandon()");
w.openAgentDeck('miro'); await wait(20);
ok(!w.document.querySelector('.deck-voice.reward') && /Écouter sa voix/.test(w.document.querySelector('.deck-page[data-id="miro"] .deck-voice').textContent),'ensuite, une simple ligne voix sur sa fiche');
ok(/Sa voix dort encore/.test(w.document.querySelector('.deck-page[data-id="kael"] .deck-voice').textContent),'un accompagnant endormi : sa voix dort encore');
ok(/Écouter sa voix/.test(w.document.querySelector('.deck-page[data-id="mia"] .deck-voice').textContent),'MIA est toujours réveillée, sa voix aussi');
w.eval("closeDeck()");
w.eval("state.tier='free'"); w.openAgentDeck('mia'); await wait(20);
ok(!w.document.querySelector('.deck-voice'),'jamais de voix en gratuit');
w.eval("closeDeck(); state.tier='plus'");
w.openSleepFiche('eden'); await wait(10);
ok(/En la réveillant, tu découvres sa voix/.test(w.$('sleep-body').textContent),'fiche endormie : la voix annoncée (au féminin pour Eden)');
w.eval("closeSleepFiche()");

console.log('\n=== 3. JEU ET DISCUSSION ===');
w.openGame('sommeil'); await wait(10);
ok(!!w.document.querySelector('#game-inner .game-voice'),'jeu d\'un accompagnant réveillé : écouter la question');
w.eval("gameAbandon()");
w.openGame('effort'); await wait(10);
ok(!w.document.querySelector('#game-inner .game-voice'),'accompagnant encore endormi : pas de bouton');
w.eval("gameAbandon()");
w.startWithAgent('miro'); await wait(20);
ok(w.$('chat-voice') && w.$('chat-voice').style.display!=='none','discussion : bouton de conversation orale dans l\'en-tête');
w.eval("addBubbleSplit('assistant','Je suis là.')");
const last=[...w.document.querySelectorAll('#messages .bubble.assistant')].pop();
ok(!!last.querySelector('.bubble-voice') && last.textContent==='Je suis là.','bouton d\'écoute sur la réponse, sans texte ajouté');
w.voiceCallCurrent(); await wait(40);
ok(w.$('voice-call').classList.contains('show') && /arrive bientôt/.test(w.$('voice-call').textContent),'écran de conversation orale, en attente du fournisseur');
w.voiceEndCall(); await wait(10);
ok(!w.$('voice-call').classList.contains('show'),'raccrocher ferme l\'écran');
w.eval("speakAgent('miro','test')"); await wait(10);
ok(/La voix de Miro arrive bientôt/.test(w.$('toast').textContent),'tant que rien n\'est branché : « arrive bientôt »');
w.openAgentDeck('miro'); await wait(20);
ok(![...w.document.querySelectorAll('.deck-voice, #voice-call')].some(e=>/débloqu/i.test(e.textContent)),'jamais « débloquer » dans les emplacements de voix');
w.eval("closeDeck()");

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
