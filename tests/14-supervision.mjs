import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8');
let pass=0, fail=0; const fails=[];
const ok=(c,n)=>{ if(c) pass++; else { fail++; fails.push(n); console.log('  ✗ '+n); } };
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://maynd.fr/'});
const w=dom.window; const errs=[];
w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({content:[{type:'text',text:'ok'}]})});
w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.confirm=()=>true;
w.addEventListener('error',e=>errs.push((e.message||String(e.error))+' @'+(e.lineno||'')));
w.addEventListener('unhandledrejection',e=>errs.push('p:'+e.reason));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(80);
const S=()=>w.eval('state');
w.enterApp(false); await wait(30);

console.log('\n=== 1. gratuit : la supervision est visible mais verrouillée ===');
w.eval("state.tier='free'"); w.showTab('objectifs'); await wait(20);
let pad=w.$('obj-pad').innerHTML;
ok(pad.includes('Ta supervision'),'section supervision présente en gratuit');
ok(pad.includes('Professionnel référent certifié'),'terme exact du business plan');
ok(pad.includes('Sans rendez-vous'),'mention sans rendez-vous');
ok(pad.includes('Débloquer ma supervision'),'levier d\'abonnement');
ok(!/openPro\(\)/.test(pad),'espace de suivi non accessible en gratuit');

console.log('\n=== 2. abonné sans questionnaire : feuille en préparation ===');
w.eval("state.tier='maynd'; state.questionnaireDone=false; state.cap=''; state.capMeta=false; state.favorites=[]");
w.renderObjectives(); pad=w.$('obj-pad').innerHTML;
ok(pad.includes('En préparation'),'état en préparation');
ok(pad.includes('Feuille de route'),'feuille de route annoncée');
ok(pad.includes('Faire mon questionnaire'),'action pour la déclencher');

console.log('\n=== 3. abonné avec parcours : feuille signée ===');
w.eval("state.questionnaireDone=true; state.cap='Être plus serein au travail'; state.focus={agent:'mateo'}; state.favorites=['mateo','sol']");
w.renderObjectives(); pad=w.$('obj-pad').innerHTML;
ok(pad.includes('Signée'),'état signé');
ok(pad.includes('Être plus serein au travail'),'le cap est repris dans la feuille de route');
ok(/Signée le \d{2}\/\d{2}\/\d{4}/.test(pad),'date de signature');
ok(pad.includes('Ouvrir mon espace de suivi'),'accès à l\'espace de suivi');
ok(pad.includes('Mateo')||pad.includes('Sol'),'les accompagnants du parcours sont dans la feuille');

console.log('\n=== 4. espace de suivi ===');
w.openPro(); await wait(20);
const sh=w.$('pro-sheet-body').innerHTML;
ok(w.$('pro-sheet').classList.contains('show'),'espace de suivi ouvert');
ok(sh.includes('Feuille de route'),'feuille de route');
ok(sh.includes('Bilan'),'bilan mensuel');
ok(sh.includes('Signaux'),'section signaux');
ok(sh.includes('Relu et signé'),'bilan signé');
ok(sh.includes('stagnation') && sh.includes('blocage') && sh.includes('désalignement'),'les 4 signaux du business plan nommés');
w.closePro(); await wait(20);
ok(!w.$('pro-sheet').classList.contains('show'),'fermeture');

console.log('\n=== 5. les signaux viennent du parcours réel ===');
w.eval("state.objectives=[{id:'o1',name:'x',steps:4,progress:0,color:'#974AF0'}]; state.streak=0; state.capMeta=false");
w.openPro(); await wait(10);
ok(w.$('pro-sheet-body').innerHTML.includes('Stagnation'),'objectif sans progrès -> signal stagnation');
w.eval("state.objectives[0].progress=2; state.streak=8");
w.renderProSheet();
const s2=w.$('pro-sheet-body').innerHTML;
ok(s2.includes('Progression'),'série de 7 jours -> signal progression');
ok(!s2.includes('Stagnation'),'signal stagnation levé quand ça avance');
w.eval("state.streak=0; state.objectives=[]"); w.renderProSheet();
ok(w.$('pro-sheet-body').innerHTML.includes('Aucun signal'),'aucun signal inventé sans raison');
w.closePro();

console.log('\n=== 6. aucun rendez-vous nulle part ===');
const mentions=[...html.matchAll(/.{0,40}rendez-vous.{0,30}/gi)].map(x=>x[0]);
const booking=mentions.filter(s=>!/sans rendez-vous|jamais de rendez-vous/i.test(s));
ok(booking.length===1 && /psychologue|Prise de rendez-vous en ligne/i.test(booking[0]),'seule prise de rendez-vous = ressources de crise externes');
ok(mentions.length-booking.length>=3,'le sans-rendez-vous est affirmé '+(mentions.length-booking.length)+' fois');
ok(!/onclick="[^"]*(rdv|booking|reserv|appointment)/i.test(html),'aucun bouton de réservation');

console.log('\n=== 7. non-régression & erreurs ===');
w.eval("state.tier='plus'"); w.showTab('accueil'); await wait(15);
ok(w.$('tab-accueil').classList.contains('active'),'accueil intact');
w.showTab('objectifs'); await wait(15);
ok(w.$('obj-pad').innerHTML.includes('wheel-card'),'boussole intacte');
const skip=new Set(['this','event','window','document','return','void','true','false','if','let','const','var']);
const names=new Set();
for(const h of [...html.matchAll(/\son(?:click|input|change)="([^"]+)"/g)].map(m=>m[1])){
  const mm=h.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(/); if(mm && !skip.has(mm[1])) names.add(mm[1]);
}
const undef=[...names].filter(n=>typeof w[n]!=='function');
ok(undef.length===0,'toutes les fonctions de boutons définies'+(undef.length?' ('+undef.join(', ')+')':''));
ok(errs.length===0,'aucune erreur runtime'+(errs.length?' : '+errs.slice(0,4).join(' | '):''));

console.log('\n  RÉSULTAT : '+pass+' réussis, '+fail+' échoués');
if(fail) console.log('  Échecs : '+fails.join(' | '));
process.exit(fail?1:0);
