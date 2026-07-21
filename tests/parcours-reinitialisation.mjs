import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/maynd.html', import.meta.url),'utf8');
let pass=0,fail=0; const ok=(c,n)=>{c?pass++:(fail++,console.log('  ✗ '+n));};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
const w=dom.window; w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[]})}); w.scrollTo=()=>{};
await new Promise(r=>setTimeout(r,70));
const KEY=w.eval('KEY');
const S=()=>w.eval('state');
// 1) démarrage frais
ok(S().onboarded===false && S().questionnaireDone===false && S().tier==='free','démarrage à zéro');
// 2) on simule une session : inscription + profil + upgrade
w.enterApp(false); w.eval("state.questionnaireDone=true; state.profile={key:'M'}; state.tier='plus'; state.name='Zorg'");
w.persist();
// persist ne doit RIEN écrire
ok(w.localStorage.getItem(KEY)===null,'persist() n\'écrit rien dans le stockage');
// 3) on force un état sauvegardé "fantôme" puis on recharge l'état
w.localStorage.setItem(KEY, JSON.stringify({onboarded:true,questionnaireDone:true,tier:'plus',name:'Ghost'}));
w.eval("state.onboarded=false; state.questionnaireDone=false; state.tier='free'; state.name=''"); // défauts d'un rechargement
w.loadState();
ok(S().onboarded===false && S().questionnaireDone===false && S().tier==='free' && S().name==='','loadState ignore tout état sauvegardé');
ok(w.localStorage.getItem(KEY)===null,'loadState purge le stockage');
console.log('  RESET : '+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
