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
const shown=id=>w.$(id).classList.contains('show');

console.log('\n=== 1. TIROIR : DISCUSSIONS PRÉCÉDENTES EN BAS, SANS APERÇU ===');
w.eval(`(function(){ var d=86400000;
  var a=mkThread(['felix']); a.msgs.push({role:'user',content:'Une phrase très longue qui débordait du cadre avant la correction du 29 septembre'}); a.updated=Date.now()-4*d; state.threads.push(a);
  var b=mkThread(['kael','sol']); b.msgs.push({role:'user',content:'Bonjour'}); b.updated=Date.now()-d; state.threads.push(b);
  var c=mkThread(['nora']); c.updated=Date.now()-2*d; state.threads.push(c);
})()`);
w.openDrawer(); await wait(20);
const dr=w.$('drawer-body').innerHTML;
ok(dr.includes('Discussions précédentes'),'titre « Discussions précédentes »');
ok(dr.indexOf('Discussions précédentes') > dr.indexOf('Tous les accompagnants'),'les discussions passées sont tout en bas');
ok(!dr.includes('débordait du cadre'),'plus d\'aperçu du dernier message');
ok(/Il y a 4 jours/.test(dr) && /Hier/.test(dr),'la date relative remplace l\'aperçu');
ok(/Kael &amp; Sol|Kael & Sol/.test(dr),'les prénoms des accompagnants de la discussion');
const past=[...w.document.querySelectorAll('#drawer-body .conv-past')];
ok(past.length===2,'un fil sans aucun message de la personne n\'est pas une discussion passée');
ok(past[0].textContent.includes('Kael'),'la plus récente en premier');
ok(w.eval("ilYa(Date.now())")==='Aujourd’hui' && w.eval("ilYa(Date.now()-86400000*14)")==='Il y a 2 semaines','dates relatives précises');
w.eval("closeDrawer()");

console.log('\n=== 2. RÉCAPITULATIF : RÉVEILLER MÈNE À LA DISCUSSION ===');
w.eval("state.awakeAgents=[]"); w.openRecap(); await wait(10);
w.entTap('leo'); await wait(10);
ok(shown('sleep-sheet'),'un accompagnant endormi ouvre sa fiche');
ok(!w.document.querySelector('#sleep-body .sleep-play-main'),'pas de jeu pour Leo : réveil direct');
w.document.querySelector('#sleep-body .btn').click(); await wait(30);
ok(!shown('recap'),'le récapitulatif se ferme');
ok(w.activeScreen()==='tab-chat' && w.eval("threadParts()").includes('leo'),'on arrive dans la discussion avec Leo');
ok(w.eval("agentAwake('leo')"),'Leo est réveillé');

console.log('\n=== 3. RÉCAPITULATIF : LE JEU PASSE AU PREMIER PLAN ===');
w.openRecap(); await wait(10);
w.entTap('miro'); await wait(10);
ok(/Jouer avec Miro/.test(w.$('sleep-body').textContent),'Miro endormi : le jeu est proposé en premier');
w.document.querySelector('#sleep-body .sleep-play-main').click(); await wait(10);
ok(shown('game'),'le jeu s\'ouvre');
ok(/#game\{z-index:91\}/.test(html),'le jeu passe au-dessus du récapitulatif (z-index 91 > 90)');
w.eval("gameAbandon()"); await wait(10);
ok(shown('recap'),'sortir du jeu ramène au récapitulatif');
w.eval("wakeAgent('miro')"); w.entTap('miro'); await wait(60);
ok(shown('deck'),'un accompagnant éveillé touché dans le récapitulatif ouvre sa fiche de présentation');
w.document.querySelector('.deck-page[data-id="miro"] .deck-replay').click(); await wait(10);
ok(shown('game') && !shown('deck'),'« Rejouer » relance le jeu de Miro une fois réveillé');
w.eval("gameAbandon()"); await wait(10);
w.eval("closeDeck(); closeRecap()");

console.log('\n=== 4. GRATUIT : LE RÉVEIL NE TRICHE PAS ===');
w.eval("state.tier='free'"); w.openRecap(); await wait(10);
w.entTap('otis'); await wait(10);
w.document.querySelector('#sleep-body .btn').click(); await wait(30);
ok(!shown('recap'),'le récapitulatif se ferme pour laisser voir la page d\'abonnement');
ok(!w.eval("agentAwake('otis')"),'Otis reste endormi sans abonnement');
w.eval("state.tier='plus'");

console.log('\n=== 5. « ENDORMIR TOUT LE MONDE » (DÉMONSTRATIONS) ===');
w.eval("state.awakeAgents=['felix','miro','nora']; state.favorites=['felix']");
const nTh=w.eval("state.threads.length");
w.openRecap(); await wait(10);
w.document.querySelector('#recap-sleep-all').click(); await wait(10);
ok(w.eval("state.awakeAgents.length")===3 && /confirmer/.test(w.$('recap-sleep-all').textContent),'une première touche demande confirmation, rien ne change');
w.document.querySelector('#recap-sleep-all').click(); await wait(10);
ok(w.eval("state.awakeAgents.length")===0,'la deuxième touche endort tout le monde');
ok(w.eval("agentAwake('mia')"),'MIA ne dort jamais');
ok(w.eval("state.threads.length")===nTh && w.eval("state.favorites.join()")==='felix','discussions et favoris conservés');
ok(/1 accompagnant réveillé/.test(w.$('recap-sub').textContent),'le récapitulatif se met à jour');
w.eval("closeRecap()");

console.log('\n=== 6. « RÉDUIRE LES ANIMATIONS » NE VIDE PLUS LES ÉCRANS ===');
ok(/prefers-reduced-motion:reduce\)\{\s*\.sleep-wrap>\*,#game-inner \.game-opts \.game-opt/.test(html),'fiche endormie et réponses du jeu restent visibles sans animation');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
