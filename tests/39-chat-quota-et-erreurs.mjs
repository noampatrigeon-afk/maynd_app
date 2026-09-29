import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window; const errs=[];
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true; w.alert=()=>{};
  w.addEventListener('error',e=>errs.push((e.message||String(e.error))+' @'+(e.lineno||'')));
  w.addEventListener('unhandledrejection',e=>errs.push('p:'+e.reason));
  w.__errs=errs; return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let w=boot(); await wait(90); w.enterApp(false); await wait(40);
const last=()=>{ const m=[...w.document.querySelectorAll('#messages > *')]; return m.length?m[m.length-1].textContent:''; };
async function say(t){ const i=w.$('chat-input'); i.value=t; w.toggleSend(); await w.send(); await wait(20); }

console.log('\n=== LE QUOTA GRATUIT NE SE PERD PLUS SUR UN ÉCHEC (29/09) ===');
w.eval("state.tier='free'; state.freeDay=todayKey(); state.freeCount=0; state.apiKey=''"); w.showTab('chat'); await wait(10);
await say('Bonjour');
ok(w.eval('state.freeCount')===0,'sans clé : aucun message décompté');
w.eval("state.apiKey='x'");
w.fetch=()=>Promise.reject(new w.TypeError('Failed to fetch'));
await say('Encore');
ok(w.eval('state.freeCount')===0,'réseau coupé : aucun message décompté');
ok(/Pas de connexion/.test(last()) && !/Netlify|en local/.test(last()),'en ligne, un échec réseau affiche un simple message de connexion, sans jargon');
w.fetch=()=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({content:[{type:'text',text:'Je suis là.'}]})});
await say('Ok');
ok(w.eval('state.freeCount')===1,'une vraie réponse décompte un message');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
