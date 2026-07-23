import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0,fail=0; const ok=(c,n)=>{c?pass++:(fail++,console.log('  ✗ '+n));};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
const w=dom.window; w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[]})}); w.scrollTo=()=>{};
await new Promise(r=>setTimeout(r,70));
const KEY=w.eval('KEY');
const S=()=>w.eval('state');
// 1) démarrage frais, sans rien en stockage
ok(S().onboarded===false && S().questionnaireDone===false && S().tier==='free','démarrage à zéro sans état sauvegardé');
// 2) on simule une session : inscription + profil + upgrade
w.enterApp(false); w.eval("state.questionnaireDone=true; state.profile={key:'M'}; state.tier='plus'; state.name='Zorg'");
w.persist();
// persist doit écrire l'état courant (persistance réelle, plus un no-op de démo)
ok(w.localStorage.getItem(KEY)!==null,'persist() écrit l\'état dans le stockage');
const saved=JSON.parse(w.localStorage.getItem(KEY));
ok(saved.name==='Zorg' && saved.tier==='plus' && saved.onboarded===true,'l\'état écrit correspond à la session en cours');
// 3) on simule un rechargement : les variables JS repartent à zéro, loadState() doit restaurer depuis le stockage
w.eval("state.onboarded=false; state.questionnaireDone=false; state.tier='free'; state.name=''"); // défauts d'un rechargement
w.loadState();
ok(S().onboarded===true && S().questionnaireDone===true && S().tier==='plus' && S().name==='Zorg','loadState restaure l\'état sauvegardé après un rechargement');
console.log('  RESET : '+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
