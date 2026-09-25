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
let w=boot(); await wait(90); w.enterApp(false); await wait(40); w.eval("state.tier='plus'; state.multiUnlocked=true");

console.log("\n=== BALISES DE CROISEMENT (parseSignals) ===");
let r=w.eval("parseSignals(\"J'en ai parle avec Atlas. Une reponse croisee. [[BOUCLE:atlas:le sport et le sens se repondent]] [[REDIGE:leo]]\")");
ok(!/\[\[/.test(r.clean), "les balises BOUCLE/REDIGE ne fuitent pas dans le texte affiche");
ok(r.boucle && r.boucle.terrain==='atlas' && /sport et le sens/.test(r.boucle.texte), "la boucle est capturee (terrain + formulation)");
ok(r.redige==='leo', "qui redige est capture");

r=w.eval("parseSignals('Reponse ordinaire, sans croisement.')");
ok(!r.boucle && !r.redige, "pas de boucle ni de redacteur quand la reponse ne les pose pas");

r=w.eval("parseSignals('Reponse coupee en plein milieu. [[BOUCLE:leo:une formulation tronquee')");
ok(!/\[\[/.test(r.clean) && !r.boucle, "une balise BOUCLE tronquee par le budget de longueur ne fuite pas et n'est pas retenue");

console.log("\n=== COMPOSESYSTEM : PLUS DE JUXTAPOSITION PAR PRENOM ===");
w.eval("var th=mkThread(['leo','atlas']); state.threads.push(th); state.current=th.id; persist();");
const sysMulti=w.eval('composeSystem()');
ok(!/Kael\s*:\s*…|préfixé par son prénom|chacun depuis son terrain/i.test(sysMulti), "l'ancienne instruction de juxtaposition par prenom a disparu");
ok(/point d.entrée/i.test(sysMulti) && /boucle/i.test(sysMulti), "la nouvelle instruction de croisement est bien injectee");
ok(/BOUCLE:identifiant/.test(sysMulti) && /REDIGE:identifiant/.test(sysMulti), "le format exact des deux balises est explique au modele");

w.eval("var th2=mkThread(['leo']); state.threads.push(th2); state.current=th2.id; persist();");
const sysSolo=w.eval('composeSystem()');
ok(!/REDIGE:identifiant/.test(sysSolo), "un fil a un seul accompagnant n'embarque pas le cout de tokens du croisement");

console.log("\n=== RETRAIT SILENCIEUX D'UN ACCOMPAGNANT QUI NE SERT JAMAIS ===");
w.eval("var th3=mkThread(['leo','atlas']); state.threads.push(th3); state.current=th3.id; persist();");
ok(w.eval('activeThread().parts.length')===2, "fil a deux, depart");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})");
ok(w.eval('activeThread().parts.length')===2, "toujours deux apres deux tours silencieux (sous le seuil)");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})");
const partsAfter=w.eval('activeThread().parts');
ok(partsAfter.length===1 && partsAfter.includes('leo'), "atlas, jamais sollicite apres plusieurs tours, est retire discretement ; leo (qui redige) reste");
const lastMsg=w.eval('activeThread().msgs[activeThread().msgs.length-1]');
ok(lastMsg && lastMsg.note, "le retrait laisse une note dans le fil, comme un retrait manuel");

console.log("\n=== LE REDACTEUR N'EST JAMAIS COMPTE COMME SILENCIEUX ===");
w.eval("var th4=mkThread(['leo','atlas']); state.threads.push(th4); state.current=th4.id; persist();");
for(let i=0;i<5;i++){ w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})"); }
ok(w.eval("activeThread().parts.includes('leo')"), "qui redige a chaque tour n'est jamais retire, meme apres cinq tours");

console.log("\n=== BOUCLE RECONNUE : LE SILENCE SE REINITIALISE ===");
w.eval("var th5=mkThread(['leo','atlas']); state.threads.push(th5); state.current=th5.id; persist();");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:null})");
w.eval("applyBoucleOutcome(activeThread(), {redige:'leo', boucle:{terrain:'atlas', texte:'x'}})");
ok(w.eval('activeThread().silence.atlas')===0, "une boucle reconnue remet le compteur de silence a zero");
ok(w.eval("activeThread().parts.includes('atlas')"), "atlas n'est pas retire, sa boucle vient d'etre utile");

console.log("\n=== ACTION DE RETOUR SUR UNE REPONSE CROISEE ===");
w.eval("var th6=mkThread(['leo','atlas']); state.threads.push(th6); state.current=th6.id; persist();");
w.showTab('chat'); await wait(10);
w.eval("addBubbleSplit('assistant','Reponse croisee.', {crossed:true, boucleTerrain:'atlas', boucleText:'une boucle'})");
await wait(20);
const idx=w.eval('activeThread().msgs.length-1');
ok(w.document.querySelector('.cross-feedback')!==null, "un bouton de retour apparait sur une reponse marquee croisee");
w.eval('giveBoucleFeedback('+idx+')');
ok(w.eval('activeThread().msgs['+idx+'].boucleFeedback')===true, "le retour se fige sur le message");
ok(w.eval("activeThread().boucleRefused && activeThread().boucleRefused.some(function(x){return x.indexOf('atlas')===0;})"), "la boucle refusee est memorisee, pour ne jamais etre reproposee");

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
