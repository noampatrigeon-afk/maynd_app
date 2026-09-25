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

console.log('\n=== NORA, SEIZIÈME ACCOMPAGNANT (rapport au corps) ===');

ok(!!w.eval("agentById('nora')"),'Nora existe dans le registre des accompagnants');
ok(w.eval("byId('nora').color")!==w.eval("byId('neo').color"),'la couleur de Nora ne répète pas celle de sa voisine (neo)');
ok(w.eval("ALL.length")===17,'17 entités au total (MIA + 16 accompagnants)');

const nora=w.eval("DEFAULT_PERSONAS.nora");
ok(/aucun conseil alimentaire/i.test(nora),'calibrage Nora : aucun conseil alimentaire');
ok(/aucun (?:plan|menu)/i.test(nora),'calibrage Nora : aucun plan ni menu');
ok(/poids/i.test(nora) && /jamais.*objectif de poids|aucun.*objectif de poids/i.test(nora),'calibrage Nora : aucun objectif de poids');
ok(/trouble du comportement alimentaire/i.test(nora),'calibrage Nora : garde-fou TCA explicite');
ok(/oriente[sz]? calmement/i.test(nora) || /tu orientes calmement/i.test(nora),'calibrage Nora : orientation calme, sans alerte ni dramatisation');
ok(!/psycholog|thérapeut|diagnostic|patient/i.test(nora),'aucun terme clinique dans la persona de Nora');

w.eval("state.tier='plus'");
w.openAgentDeck(); await wait(70);
const pages=[...w.document.querySelectorAll('#deck-track .deck-page')];
const noraPage=pages.find(p=>p.getAttribute('data-id')==='nora');
ok(!!noraPage,'Nora a bien une fiche dans la présentation');
if(noraPage){
  ok(noraPage.innerHTML.includes('Inclus dans MAYND') && !noraPage.innerHTML.includes('Exclusif'),'Nora est incluse dans l\'abonnement unique, comme tout le monde (chantier 12)');
  ok(noraPage.innerHTML.includes('Rapport au corps'),'domaine affiché sur la fiche');
  ok(!/psycholog|thérapeut|clinique|patient|diagnostic/i.test(noraPage.innerHTML),'aucun terme clinique sur la fiche de Nora');
}
w.closeDeck();

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
