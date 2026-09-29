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
async function play(theme, labels){
  w.eval("state.awakeAgents=[]"); w.openGame(theme); await wait(10);
  for(const l of labels) await answer(l);
  const restit=w.document.querySelector('.game-restit p')?.textContent||'';
  w.document.querySelector('.game-next')?.click(); await wait(40);
  const r={restit, deck:deckCalls[deckCalls.length-1], also:[...w.document.querySelectorAll('.deck-also')].map(x=>x.textContent).join(' ')};
  w.eval("closeDeck()"); return r;
}

console.log('\n=== 1. TOUS LES ACCOMPAGNANTS ONT LEUR JEU, SAUF NORA ===');
ok(w.eval("ALL.map(function(a){return a.id}).filter(function(id){return !gameForAgent(id)}).join()")==='nora','seule Nora attend encore son jeu (relecture par le professionnel)');

console.log('\n=== 2. SOL : AUCUN CHRONO ===');
w.eval("state.awakeAgents=[]"); w.openGame('anxiete'); await wait(10);
ok(w.$('game-opts').style.display!=='none','les réponses s\'affichent tout de suite');
w.eval("gameAbandon()");
let r=await play('anxiete',['Cette semaine','Ça se sent dans mon corps','Les autres, les situations sociales','Bouger, me dépenser','Essayer quelque chose quand ça monte']);
ok(r.deck==='iris' && /Otis/.test(r.also),'les autres mènent à Iris, Otis proposé en plus');
ok(!/respire|inspire|expire|exercice/i.test(r.restit),'aucune suggestion d\'exercice dans la restitution');

console.log('\n=== 3. FELIX, NAOKI, ATLAS, AVA ===');
r=await play('confiance',['Ces derniers mois','Dure tout le temps','Quand je suis seul','Éviter les situations','Repérer ce que je me dis']);
ok(r.deck==='atlas' && /Iris/.test(r.also),'Felix : quand je suis seul mène à Atlas, Iris en plus');
ok(!/performance|réussi|résultat/i.test(r.restit),'Felix : la fierté n\'est jamais reformulée en performance');
r=await play('discipline',['Cette semaine',"J'en fais trop et je craque",'Des objectifs trop gros','Des listes, un agenda','Tenir une seule chose']);
ok(r.deck==='naoki','Naoki : des objectifs trop gros restent chez Naoki');
ok(!/bravo|courage|effort/i.test(r.restit),'Naoki : « j\'en fais trop » jamais valorisé');
r=await play('sens',['Ce mois-ci','Je ne sais plus ce que je veux',"Depuis que quelque chose s'est arrêté",'Attendre que ça passe','Regarder ça de près']);
ok(r.deck==='atlas' && /Ava/.test(r.also),'Atlas : ce qui s\'est arrêté reste chez Atlas, Ava en plus');
r=await play('emotions',['Cette semaine','Ça déborde d\'un coup','Une relation qui a changé','Un accompagnement','Mettre des mots dessus']);
ok(r.deck==='leo','Ava : une relation qui a changé mène à Leo');
ok(!/étape|phase|progress|encore/i.test(w.eval("JSON.stringify(GAMES.emotions)")),'Ava : jamais d\'étape, de phase ni de progression attendue');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
