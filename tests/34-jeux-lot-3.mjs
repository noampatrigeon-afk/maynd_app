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
  w.document.querySelector('.game-next')?.click(); await wait(40);
  const r={deck:deckCalls[deckCalls.length-1], also:w.document.querySelector('.deck-also')?.textContent||''};
  w.eval("closeDeck()"); return r;
}

console.log('\n=== 1. QUATRE NOUVEAUX JEUX ===');
ok(['soren','iris','eden','vince'].every(id=>w.eval(`!!gameForAgent('${id}')`)),'Soren, Iris, Eden et Vince ont chacun leur jeu');
ok(Object.keys(w.eval('GAMES')).filter(k=>k!=='anxiete').every(k=>w.eval(`GAMES['${k}'].reflectionMs`)===10000),'tous les jeux laissent 10 secondes de réflexion (sauf Sol, sans chrono)');

console.log('\n=== 2. CADRAGES DU DOSSIER ===');
const soren=w.eval("JSON.stringify(GAMES.parentalite)");
ok(!/\bpère\b|\bmère\b|paternit|maternit/i.test(soren),'Soren : jamais père, mère, paternité ni maternité');
ok(/conseil d'éducation/.test(w.eval("getPersona('soren')")),'Soren : « aucun conseil d\'éducation » ajouté à sa consigne de conversation');
const vince=w.eval("JSON.stringify(GAMES.argent)");
ok(!/€|euro|montant|revenu|salaire|solde|dette|patrimoine|placement|épargne|crédit/i.test(vince),'Vince : aucun chiffre, montant, dette ni produit financier');
const eden=w.eval("JSON.stringify(GAMES.intimite)");
ok(!/fréquence|combien de fois|orientation|rapport sexuel|pratique/i.test(eden),'Eden : ni pratique, ni fréquence, ni orientation');
ok(/arrêter quand tu veux/.test(w.eval("GAMES.intimite.accroche")),'Eden : l\'accroche désamorce avant de commencer');

console.log('\n=== 3. SORTIES ET SECONDS ACCOMPAGNANTS ===');
let r=await play('parentalite',["J'ai un tout-petit",'Cette semaine','Je suis épuisé',"La répartition avec l'autre parent","En parler à l'autre parent",'Demander une chose précise']);
ok(r.deck==='leo','Soren : la répartition avec l\'autre parent mène à Leo');
r=await play('lien',['Ce mois-ci',"Je m'isole sans vraiment le décider",'Je ne sais pas comment m’y prendre','Reprendre contact avec des gens','Écrire à une personne']);
ok(r.deck==='otis','Iris : ne pas savoir comment s\'y prendre mène à Otis');
r=await play('intimite',['Ce mois-ci',"Le désir n'est plus là",'Ce que je pense de moi','Attendre que ça revienne','Juste observer']);
ok(r.deck==='felix' && /Nora/.test(r.also),'Eden : ce que je pense de moi mène à Felix, Nora en second');
r=await play('argent',['Cette année','Je dépense pour me sentir mieux','Ma situation actuelle','Me fixer des règles','Regarder où j\'en suis']);
ok(r.deck==='mateo' && /Neo/.test(r.also),'Vince : « je dépense pour me sentir mieux » ajoute Neo en second (réponse de la question 2)');
r=await play('lien',['Cette semaine','Elle me convient','Depuis toujours','Quelques liens qui comptent']);
ok(r.deck==='iris' && !r.also,'Iris : « elle me convient » est une réponse pleine, rien à corriger');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
