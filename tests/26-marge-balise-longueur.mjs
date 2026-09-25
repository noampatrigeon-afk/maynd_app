import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
  const w=dom.window;
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true; w.alert=()=>{};
  return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let w=boot(); await wait(90);

console.log('\n=== MARGE POUR LA BALISE TECHNIQUE DANS LE BUDGET DE LONGUEUR ===');

// Bug réel remonté : au tout premier message d'un fil (niveau 1, 90 tokens), le budget suffisait
// à peine à la réponse elle-même en français. La balise [[SUGGEST:...]] qui aurait dû faire venir
// un accompagnant pertinent (même mention explicite de son terrain) n'avait jamais de place pour
// être émise. Le budget envoyé à l'API doit inclure une marge dédiée, sans changer la longueur
// visible attendue de la réponse (wordCap).
const b1=w.eval("computeLengthBudget({msgs:[{role:'user',content:'un seul message'}]})");
ok(b1.level===1, 'un seul message utilisateur -> niveau 1');
ok(b1.wordCap===45, 'le plafond de mots du niveau 1 ne change pas (45)');
ok(b1.tokenCap===90+w.eval('TAG_HEADROOM'), 'le budget envoyé à l\'API au niveau 1 inclut la marge pour la balise, au-delà des 90 tokens de la réponse');
ok(b1.tokenCap>90, 'concrètement, plus de 90 tokens sont accordés à l\'appel (place réelle pour [[SUGGEST:...]])');

// La montée de niveau se fait d'un cran à la fois : pour observer le niveau 4 sans dérouler
// tout un échange, on part d'un fil déjà au niveau 3 (comme le ferait computeLengthBudget lui-même
// après plusieurs tours) et on envoie une vraie demande d'approfondissement explicite.
const th4={lengthLevel:3, msgs:[{role:'user',content:'un'},{role:'assistant',content:'ok'},{role:'user',content:"explique moi en détail ce mécanisme précis s'il te plaît"}]};
const b4=w.eval('computeLengthBudget('+JSON.stringify(th4)+')');
ok(b4.level===4, "une vraie demande d'approfondissement depuis le niveau 3 -> niveau 4");
ok(b4.tokenCap===1200+w.eval('TAG_HEADROOM'), "la marge s'applique aussi au niveau 4, sans changer le plafond de mots");
ok(b4.wordCap===99999, 'le plafond de mots du niveau 4 (illimité en pratique) ne change pas');

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
