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
w.eval("state.tier='plus'; state.multiUnlocked=false");
w.showTab('chat'); await wait(10);

console.log('\n=== ÉCRAN DE DÉBLOCAGE DU MULTI-ACCOMPAGNANTS (retour utilisateur 25/09) ===');

// Un compte payant, multi non débloqué : ajouter un 2e accompagnant ne doit plus renvoyer
// vers l'écran de formules (payer ne change plus rien) ni se limiter à un toast discret.
w.eval("var th=mkThread(['leo']); state.threads.push(th); state.current=th.id; persist();");
w.eval("addParticipant('atlas')");
await wait(10);
ok(w.$('mix-sheet').classList.contains('show'), "tenter d'ajouter un 2e accompagnant sans multiUnlocked ouvre l'écran de déblocage");
ok(!w.$('paywall-sheet').classList.contains('show'), "et surtout pas l'écran de paiement (payer ne débloque plus le multi)");
ok(/Atlas/.test(w.$('mix-sub').textContent), "le nom de l'accompagnant en attente est repris dans le message");
ok(/Débloquer/.test(w.$('mix-cta').textContent), "le bouton est bien un vrai bouton de déblocage");
ok(w.eval("activeThread().parts.length")===1, "atlas n'est pas encore ajouté tant que le bouton n'a pas été cliqué");

w.mixUnlockGo();
await wait(10);
ok(w.eval('state.multiUnlocked')===true, "le bouton débloque réellement le multi-accompagnants (pas un bouton mort)");
ok(w.eval("activeThread().parts.includes('atlas')"), "l'accompagnant qui attendait rejoint la conversation immédiatement après");
ok(!w.$('mix-sheet').classList.contains('show'), "l'écran se ferme après le déblocage");

console.log('\n=== LA CARTE D’INVITATION DE MIA PASSE PAR LE MÊME CHEMIN ===');
w.eval("state.multiUnlocked=false; var th2=mkThread(['leo']); state.threads.push(th2); state.current=th2.id; persist();");
w.eval("handleJoin('atlas')");
await wait(10);
const inviteHtml=w.document.querySelector('.bubble.note')?.innerHTML || '';
ok(!/MAYND\+/.test(inviteHtml), "la carte d'invitation n'affiche plus l'ancien badge MAYND+ (palier disparu)");
w.document.querySelector('.bubble.note')?.click();
await wait(10);
ok(w.$('mix-sheet').classList.contains('show'), "cliquer la carte d'invitation ouvre le même écran de déblocage, pas l'écran de formules");

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
