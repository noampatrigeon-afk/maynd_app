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

console.log('\n=== 1. FIN DU JEU : TOUJOURS LA FICHE DE L\'ACCOMPAGNANT DU JEU (30/09) ===');
w.eval("state.awakeAgents=[]; state.gameRuns={}");
w.openGame('sommeil'); await wait(10);
for(const l of ['Cette année','Je me réveille la nuit','Je ne sais pas','Couper les écrans le soir','Essayer quelque chose de léger']) await answer(l);
w.document.querySelector('.game-next').click(); await wait(40);
ok(deckCalls[deckCalls.length-1]==='miro','« Je ne sais pas » chez Miro : la fiche de Miro, plus celle de MIA');
ok(!w.document.querySelector('.deck-page[data-id="miro"] .deck-also'),'MIA n\'est jamais proposée en pastille (elle est toujours là)');
ok(w.eval('_gameLastExit')==='mia','la table de sortie du dossier reste enregistrée');

console.log('\n=== 2. LA VOIX, RÉCOMPENSE DU JEU ===');
const reward=w.document.querySelector('.deck-page[data-id="miro"] .deck-voice.reward');
ok(!!reward && /Tu as réveillé la voix de Miro/.test(reward.textContent),'finir le jeu réveille la voix : récompense sur la fiche');
ok(/Écouter sa voix/.test(reward.textContent) && /L’appeler/.test(reward.textContent),'deux boutons : écouter, appeler');
w.eval("closeDeck()");
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
