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
const q=()=>w.document.querySelector('#game-inner .game-q')?.textContent||'';
async function finish(){
  const restit=w.document.querySelector('.game-restit p')?.textContent||'';
  w.document.querySelector('.game-next')?.click(); await wait(40);
  const also=[...w.document.querySelectorAll('.deck-also')].map(x=>x.textContent);
  const r={restit, deck:deckCalls[deckCalls.length-1], also};
  w.eval("closeDeck()"); return r;
}

console.log('\n=== 1. NEO : LE MOT DE LA PERSONNE ===');
w.eval("state.awakeAgents=[]; state.gameRuns={}");
ok(/Pas d.étiquette, pas de morale/.test(w.eval("GAMES.habitudes.accroche")),'l\'accroche désamorce avant de commencer');
w.openGame('habitudes'); await wait(10);
ok(/Avant de commencer/.test(w.$('game-inner').textContent),'le sujet est nommé par la personne, avant la question 1');
await answer("L'alcool");
ok(/journée entière sans alcool/.test(q()),'la question 1 reprend son mot');
await answer('Cette semaine');
ok(/la place que prend l'alcool/.test(q()),'la question 2 aussi, jamais un terme plus large');
await answer("C'est tous les jours");
ok(/Ce qui déclenche/.test(q()),'« tous les jours » : le jeu enchaîne exactement comme pour les autres réponses');
await answer("L'ennui, les moments vides"); await answer('Arrêter net'); await answer('Essayer une journée sans');
let r=await finish();
ok(/journée sans alcool/.test(r.restit),'la restitution reprend son mot');
ok(r.deck==='atlas' && r.also.some(t=>/Iris/.test(t)) && r.also.some(t=>/Neo/.test(t)),'l\'ennui mène à Atlas, avec Iris et Neo proposés en plus');
const all=w.eval("JSON.stringify(GAMES.habitudes)");
ok(!/addict|dépendan|alcoolique|toxico|sevrage|abus/i.test(all),'aucune étiquette ni mot clinique');

console.log('\n=== 2. RIEN NE PREND TROP DE PLACE ===');
w.openGame('habitudes'); await wait(10);
await answer('Rien ne prend trop de place en ce moment');
ok(/déjà été le cas/.test(q()),'une seule question : est-ce que ça a déjà été le cas');
await answer("Oui, et c'est derrière moi");
ok(/On s.arrête là/.test(w.$('game-inner').textContent) && !w.document.querySelector('#game-opts'),'fermeture immédiate, aucune question sur ce que c\'était');
w.eval("gameClose()");
w.openGame('habitudes'); await wait(10);
await answer('Rien ne prend trop de place en ce moment'); await answer('Oui, et ça revient par périodes');
ok(/sans ça/.test(q()),'« ça revient par périodes » continue, sans sujet imposé');
await answer('Cette année');
ok(/période calme et une période où ça prend de la place/.test(q()),'sur la branche irrégulière, sans repasser par la question 2');
await answer('Le stress'); await answer("En parler à quelqu'un"); await answer('Observer sans rien changer');
r=await finish();
ok(r.deck==='sol' && r.also.some(t=>/Neo/.test(t)),'le stress mène à Sol, Neo reste proposé en plus');

console.log('\n=== 3. BRANCHE COURTE : AUCUNE MISE EN GARDE ===');
w.openGame('habitudes'); await wait(10);
await answer('Les achats'); await answer('Cette semaine'); await answer('Ça va, je gère'); await answer('Depuis quelques mois'); await answer('Je sais ce qui déclenche');
r=await finish();
ok(!/attention|risque|prudence|mais/i.test(r.restit),'aucune mise en garde déguisée');

console.log('\n=== 4. MIRO : SORTIES SELON LE CONTEXTE ===');
const miro=async(q3)=>{ w.openGame('sommeil'); await wait(10); for(const l of ['Cette année','Je me réveille la nuit',q3,'Couper les écrans le soir','Essayer quelque chose de léger']) await answer(l); return (await finish()).deck; };
w.eval("state.gameRuns={}; state.awakeAgents=[]");
ok(await miro('Ma tête qui tourne')==='felix','la tête qui tourne mène à Felix');
w.eval("state.gameRuns.relation=[{at:1,completed:true,exitAgent:'sol',answers:{q0:'En couple'}}]");
ok(await miro('Ma tête qui tourne')==='sol','… ou à Sol si l\'angoisse est déjà apparue ailleurs');
ok(await miro("Ce qui m'entoure, bruit, lumière, quelqu'un")==='leo','ce qui m\'entoure mène à Leo si quelqu\'un partage le lit');
w.eval("state.gameRuns.relation=[{at:1,completed:true,answers:{q0:'Séparé récemment'}}]");
ok(await miro("Ce qui m'entoure, bruit, lumière, quelqu'un")==='miro','sinon reste chez Miro');

console.log('\n=== 5. POINTS D\'ATTENTION POUR LE PROFESSIONNEL (MIRO) ===');
const nuitsLourdes="{at:1,completed:true,answers:{q1:'Je ne sais plus',q2:'Je dors, mais ça ne repose pas'}}";
w.eval("state.gameRuns={sommeil:["+nuitsLourdes+"]}");
ok(w.eval("attentionPoints().length")===0,'une seule fois : rien');
w.eval("state.gameRuns.sommeil.push("+nuitsLourdes+")");
ok(w.eval("attentionPoints().length")===1,'répété dans le temps : point d\'attention');
w.eval("openProDashboard()"); await wait(10);
ok(/Points d.attention/.test(w.$('pd-body').textContent),'visible dans l\'espace du professionnel');
w.eval("closeProDashboard()");
ok(!/attention/i.test(w.$('obj-pad').innerHTML),'rien d\'affiché à la personne');
// Mateo et Iris sont devenus des signaux de blocage (31-jeu-nora-et-signaux.js), plus des points d'attention
ok(w.eval("ATTENTION_RULES.map(function(r){return r.theme}).join()")==='sommeil','seul Miro reste en point d\'attention');
ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
