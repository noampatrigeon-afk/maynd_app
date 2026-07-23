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
w.eval("state.tier='plus'");

console.log('\n=== 1. sons : plusieurs types ===');
const snd=w.eval('Object.keys(SND)');
ok(snd.length>=9,snd.length+' sons distincts');
ok(snd.includes('select')&&snd.includes('back')&&snd.includes('open')&&snd.includes('success')&&snd.includes('toggle'),'sons de situation présents');
ok(w.eval("SND.success.n.length")===3,'son de réussite en trois notes');
ok(w.eval("SND.back.n[0] > SND.back.n[1]"),'retour = notes descendantes');
ok(w.eval("SND.next.n[0] < SND.next.n[1]"),'suivant = notes montantes');
ok((html.match(/document\.addEventListener\('click'/g)||[]).length===1,'un seul écouteur de son (pas de double son)');
const el=w.document.createElement('button'); el.className='qz2-opt';
w.document.body.appendChild(el);
ok(w.sndFor(el)==='select','clic sur une réponse -> son de sélection');

console.log('\n=== 2. couleur partout ===');
ok(html.includes('#F1E8FF')&&html.includes('#E8EFFF')&&html.includes('#FFEDE1'),'trois fonds colorés forts');
ok(html.includes('OB_TINT'),'inscription colorée étape par étape');
ok(w.eval("Object.keys(OB_TINT).length")>=18,'toutes les étapes d\'inscription teintées');
ok(html.includes('function joySVG'),'icônes colorées');
ok(w.joySVG('smile','#974AF0').includes('circle') && w.joySVG('smile','#974AF0').includes('#974AF0'),'icône sourire colorée');
ok(html.includes('.mia-cta{background:var(--violet)'),'carte MIA en violet plein');
ok(html.includes('--sc,var(--violet)'),'barres de section colorées');
w.showTab('objectifs'); await wait(20);
const bars=[...w.document.querySelectorAll('#tab-objectifs .section-head h2')];
ok(bars.length>0 && bars.some(b=>b.style.getPropertyValue('--sc')),'couleurs appliquées aux sections');
const cols=new Set(bars.map(b=>b.style.getPropertyValue('--sc')).filter(Boolean));
ok(cols.size>=2,'les sections alternent les couleurs ('+cols.size+' couleurs)');
ok((html.match(/(linear|radial)-gradient/g)||[]).length===2,'toujours zéro dégradé visuel');

console.log('\n=== 3. retour arrière ===');
w.startObjQuiz(); await wait(15);
ok(!/qz2-back/.test(w.$('or-inner').innerHTML),'pas de retour sur la 1re question');
w.objqPick(0); await wait(300);
ok(/qz2-back/.test(w.$('or-inner').innerHTML),'bouton retour dès la 2e question');
ok(w.eval('objqIdx')===1,'position 2');
w.objqBack(); await wait(15);
ok(w.eval('objqIdx')===0,'retour arrière effectif');
ok(/qz2-opt sel/.test(w.$('or-inner').innerHTML),'la réponse précédente reste cochée');
w.startQuiz(); await wait(15);
w.qzPick(0); await wait(200);
ok(/qz2-back/.test(w.$('quiz-inner').innerHTML)||w.eval('quizIdx')===0,'retour arrière aussi dans le questionnaire de base');
w.qzClose();

console.log('\n=== 4. questionnaire objectif : ouvert et positif ===');
ok(w.eval('OBJQ.length')===9,'9 questions');
ok(!w.eval("OBJQ[0].multi"),'1re question à réponse unique');
ok(w.eval("OBJQ[0].q").includes('aimes'),'ouverture positive : ce que la personne aime');
ok(w.eval("OBJQ[1].opts.some(function(o){return o.v==='grow'})"),'intention progresser disponible');
ok(w.eval("OBJQ[2].q")==='Sur quel domaine ?','domaine formulé sans connotation négative');
ok(w.eval("OBJQ[3].opts[0].v")==='none' && w.eval("OBJQ[3].opts[0].t").includes('plus haut'),'option rien ne m\'empêche en premier');
ok(w.eval("OBJQ[6].opts[0].v")==='surge' && w.eval("OBJQ[6].opts[0].t").includes('super lancée'),'réponse super lancée ajoutée');

console.log('\n=== 5. le moteur produit un objectif positif ===');
w.eval("state.objectives=[]; state.cap=''; state.capMeta=false; state.favorites=[]; state.focus=null");
w.startObjQuiz(); await wait(10);
w.objqPick(0); await wait(260);                          // aime le sport
w.objqPick(0); await wait(200);                          // progresser
w.objqPick(0); await wait(200);                          // travail
w.objqPick(0); await wait(200);                          // rien ne m'empêche
w.objqPick(0); await wait(200);                          // action concrète
w.objqPick(0); await wait(200);                          // quelques semaines
w.objqPick(0); await wait(200);                          // super lancée
w.objqPick(0); await wait(200);                          // bienveillant
w.objqPick(1); await wait(250);                          // rythme régulier
ok(S().cap==="Monter d'un cran dans mon travail.",'cap positif généré');
ok(S().objectives.length===1,'objectif créé');
ok(/cette semaine|palier|résultat/.test(S().objectives[0].name),'objectif de progression, pas de réparation');
ok(S().favorites.includes('kael'),'ce que la personne aime enrichit ses accompagnants');
ok(typeof S().objAnswers.likes==='string','réponse enregistrée pour le professionnel');
// parcours négatif -> objectif de réparation
w.eval("state.objectives=[]; state.cap=''; state.favorites=[]");
w.startObjQuiz(); await wait(10);
w.objqPick(0); await wait(260);
w.objqPick(1); await wait(200); w.objqPick(0); await wait(200); w.objqPick(1); await wait(200);
w.objqPick(0); await wait(200); w.objqPick(0); await wait(200); w.objqPick(3); await wait(200);
w.objqPick(2); await wait(200); w.objqPick(1); await wait(250);
ok(S().cap==="Avancer sur ce qui compte au travail, sans m'épuiser.",'cap de réparation quand ça coince');
ok(S().favorites.includes('felix'),'dialogue intérieur dur -> Felix ajouté');
// explorer -> objectif de se connaître
w.eval("state.cap=''; state.capMeta=false");
w.startObjQuiz(); await wait(10); w.objqPick(0); await wait(260);
w.objqPick(3); await wait(200);
for(let i=0;i<7;i++){ w.objqPick(0); await wait(200); }
ok(S().capMeta===true,'explorer -> mieux se connaître');

console.log('\n=== 6. boutons & erreurs ===');
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
