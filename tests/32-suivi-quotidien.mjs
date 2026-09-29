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
const shownEl=id=>{ const e=w.$(id); return !!e && e.style.display!=='none'; };

console.log('\n=== 1. POINT DU JOUR : HUMEUR PUIS BOUSSOLE ===');
w.eval("state.moods=[]; state.moodSeen=''; state.wheelLog=[]; state.wheel={energie:5,serenite:5,confiance:5,lien:5,sens:5}");
w.checkMoodOnOpen(); await wait(10);
ok(w.$('mood-screen').classList.contains('show'),'l\'écran s\'ouvre à la première ouverture du jour');
w.validateMood(); await wait(10);
ok(shownEl('ms-wheel') && /boussole/.test(w.$('ms-q').textContent),'après l\'humeur, la boussole');
ok(w.document.querySelectorAll('#ms-wheel input[type=range]').length===5,'cinq réglettes');
ok(!w.document.querySelector('.ci-same'),'pas de « Rien n\'a bougé » au tout premier relevé');
w.ciSet('energie','9'); w.ciValidateWheel(); await wait(10);
ok(w.eval("state.wheel.energie")===9,'la boussole est mise à jour');
ok(w.eval("state.wheelLog.length")===1 && w.eval("state.wheelLog[0].v.energie")===9,'un relevé daté est enregistré');
ok(shownEl('ms-comment') && !shownEl('ms-wheel'),'puis l\'étape commentaire / En parler à MIA, comme avant');
w.closeMoodScreen(); w.checkMoodOnOpen(); await wait(10);
ok(!w.$('mood-screen').classList.contains('show'),'une seule fois par jour');
w.openMoodScreen(true); await wait(10);
ok(!shownEl('ms-wheel') && w.$('ms-wrap').style.display!=='none','rouvrir repart bien de l\'humeur');
w.validateMood(); await wait(10);
ok(!!w.document.querySelector('.ci-same'),'« Rien n\'a bougé » proposé dès qu\'un relevé existe');
w.document.querySelector('.ci-same').click(); await wait(10);
ok(w.eval("state.wheelLog.length")===1 && w.eval("state.wheel.energie")===9,'« Rien n\'a bougé » garde les valeurs, un seul relevé par jour');
w.closeMoodScreen();

console.log('\n=== 2. GRATUIT : LA BOUSSOLE RESTE RÉSERVÉE AUX ABONNÉS ===');
w.eval("state.tier='free'"); w.openMoodScreen(true); w.validateMood(); await wait(10);
ok(!shownEl('ms-wheel') && shownEl('ms-comment'),'en gratuit, pas d\'étape boussole');
w.closeMoodScreen(); w.showTab('objectifs'); await wait(20);
ok(!!w.$('suivi') && !w.document.querySelector('.sv-wheel') && !w.document.querySelector('.sv-tab'),'en gratuit, « Ton suivi » ne montre que l\'humeur');
w.eval("state.tier='plus'");

console.log('\n=== 3. « TON SUIVI » EN DEUX ONGLETS ===');
w.eval(`(function(){ var d=86400000; function dk(n){ return todayKey(new Date(Date.now()-n*d)); }
  state.moods=[{day:dk(2),k:'bien'},{day:dk(1),k:'bien'},{day:dk(0),k:'top'}];
  state.wheel={energie:6,serenite:4,confiance:7,lien:5,sens:8};
  state.wheelLog=[{day:dk(7),v:{energie:4,serenite:5,confiance:5,lien:5,sens:6}},{day:dk(0),v:{energie:6,serenite:4,confiance:7,lien:5,sens:8}}]; })()`);
w.showTab('objectifs'); await wait(20);
const pad=w.$('obj-pad').innerHTML;
ok(!/<h2>Ta boussole<\/h2>/.test(pad),'plus de section « Ta boussole » en doublon au milieu de l\'onglet');
ok(w.document.querySelectorAll('#suivi .sv-tab').length===2,'deux onglets : Humeur et Boussole');
ok(w.document.querySelectorAll('#suivi .sv-face').length===7 && w.document.querySelectorAll('#suivi .sv-face.empty').length===4,'la semaine en sept visages, les jours sans humeur restent vides');
ok(/le plus fréquent/.test(w.$('suivi').textContent),'humeur la plus fréquente quand il y a une vraie majorité');
w.svSetTab('boussole'); await wait(10);
ok(w.document.querySelector('#suivi .sv-card').getAttribute('data-tab')==='boussole','bascule vers l\'onglet Boussole');
ok(!!w.document.querySelector('#suivi .sv-avg') && !w.document.querySelector('#suivi .sv-prev'),'la moyenne est dessinée en fond (plus le relevé d\'il y a une semaine)');
ok(/\+2/.test(w.document.querySelector('#suivi .sv-p-boussole').textContent) && !!w.document.querySelector('#suivi .sv-delta.down'),'écart de chaque axe à la moyenne (hausses et baisses)');
ok(/Moyenne de 1 relevé sur les 30 derniers jours/.test(w.$('suivi').textContent),'la moyenne dit sur combien de relevés elle porte');

console.log('\n=== 4. MOYENNE DE LA BOUSSOLE (29/09) ===');
w.eval(`(function(){ var d=86400000; function dk(n){ return todayKey(new Date(Date.now()-n*d)); }
  state.wheel={energie:8,serenite:5,confiance:5,lien:5,sens:5};
  state.wheelLog=[{day:dk(40),v:{energie:1,serenite:1,confiance:1,lien:1,sens:1}},
    {day:dk(3),v:{energie:4,serenite:5,confiance:5,lien:5,sens:5}},{day:dk(2),v:{energie:5,serenite:6,confiance:5,lien:5,sens:5}},
    {day:dk(0),v:{energie:8,serenite:5,confiance:5,lien:5,sens:5}}]; })()`);
const av=w.eval('wheelAverage()');
ok(av.n===2 && av.v.energie===4.5 && av.v.serenite===5.5,'moyenne des 30 derniers jours, sans aujourd\'hui ni les relevés plus anciens');
w.renderSuivi(); w.svSetTab('boussole'); await wait(10);
const txt=w.document.querySelector('#suivi .sv-p-boussole').textContent;
ok(/\+3,5/.test(txt) && /−0,5/.test(txt),'écarts décimaux à la virgule');
ok(w.document.querySelectorAll('#suivi .sv-delta.eq').length===3,'un écart de moins de 0,5 compte comme dans la moyenne');
const svg=w.document.querySelector('#suivi .sv-radar').innerHTML;
ok(svg.indexOf('sv-avg')<svg.indexOf('sv-now'),'la forme du jour est dessinée par-dessus la moyenne');
w.eval("state.moodSeen=''; state.moods=[]"); w.openMoodScreen(true); w.validateMood(); await wait(10);
ok(!!w.document.querySelector('#ci-radar .sv-avg') && /Ta moyenne/.test(w.$('ms-wheel').textContent),'au point du jour, la moyenne apparaît aussi derrière les réglettes');
w.ciSet('energie','2'); await wait(5);
ok(!!w.document.querySelector('#ci-radar .sv-avg'),'et reste en fond pendant qu\'on bouge les réglettes');
w.closeMoodScreen();
w.eval("state.wheelLog=[]"); w.renderSuivi(); await wait(5);
ok(!w.document.querySelector('#suivi .sv-avg') && /dès ton deuxième relevé/.test(w.$('suivi').textContent),'sans relevé antérieur, pas de moyenne et une phrase d\'attente');

ok(w.__errs.length===0,'aucune erreur runtime'+(w.__errs.length?' : '+w.__errs.slice(0,3).join(' | '):''));
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail?1:0);
