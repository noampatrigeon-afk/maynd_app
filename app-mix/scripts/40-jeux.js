/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE MOTEUR DES JEUX (13/11/2026)
   Un seul moteur pour les dix-sept jeux de 02-donnees-jeux.js, réécrit à plat
   à partir de MAYND (18, 24, 27, 28, 31, 33) : question préalable (q0), sous-
   question qui peut fermer le jeu (q0b), branche courte, branche irrégulière,
   « Autre » avec texte libre, sorties qui dépendent du contexte (Miro, MIA),
   arrêt anticipé de Nora, point de mesure de MIA.
   Fin d'un jeu (décision du 30/09/2026) : pas de résumé qui répète, pas de
   renvoi vers un autre accompagnant. Deux boutons : « En parler avec X
   maintenant » (le récapitulatif part dans la discussion, X répond en sachant
   qu'on sort de son jeu, et fait venir qui est utile) et « Ce que X peut
   vraiment faire pour toi » (sa fiche). Finir un jeu réveille la voix de X.
   En gratuit, les jeux sont ouverts : c'est la façon douce de rencontrer un
   accompagnant. Mais c'est MIA qui en parle, puisque les accompagnants font
   partie de l'abonnement.
   ══════════════════════════════════════════════════════════════════════════ */

const THEME_PAR_AGENT={}; Object.keys(JEUX).forEach(function(k){ THEME_PAR_AGENT[JEUX[k].agent]=k; });
const REFLEXION_MS=DUREE ? 10000 : 0;
let partie=null, reflexionTimer=null, finDePartie=null;

/* ─────────── disponibilité et mémoire ─────────── */
function runsDe(theme){ return etat.jeux.runs.filter(function(r){ return r.theme===theme; }); }
function runsTermines(theme){ return runsDe(theme).filter(function(r){ return r.completed; }); }
function jeuxTerminesDistincts(){ const s={}; etat.jeux.runs.forEach(function(r){ if(r.completed && r.theme!=='point') s[r.theme]=1; }); return Object.keys(s).length; }
function jeuPointDisponible(){ return etat.pro.bilans.length>0 || jeuxTerminesDistincts()>=3; }
function jeuDe(id){
  const t=THEME_PAR_AGENT[id]; if(!t) return null;
  if(id==='mia' && !jeuPointDisponible()) return null;
  return t;
}
function jeuxFaitsLignes(){
  const L=[];
  etat.jeux.runs.filter(function(r){ return r.completed; }).slice(-4).forEach(function(r){
    const g=JEUX[r.theme]; if(!g) return;
    const rep=Object.keys(r.answers).map(function(k){ return r.answers[k]; }).join(' ; ');
    L.push('jeu « '+g.label+' » de '+AG[g.agent].nom+', fait '+dateLib(r.at)+' : '+rep);
  });
  return L;
}

/* ─────────── la définition d'une question, selon le contexte ─────────── */
function neoRemplir(str){
  if(typeof str!=='string') return str;
  const a=partie && partie.answers.q0, s=(a && a.sujet) ? a.sujet : NEO_SANS_SUJET;
  return str.replace(/\{sans\}/g, s.sans).replace(/\{place\}/g, s.place).replace(/\{prend\}/g, s.prend).replace(/\{mot\}/g, s.mot);
}
function questionDef(step){
  const g=JEUX[partie.theme]; let q;
  if(step==='shortQ1') q=g.short.q1;
  else if(step==='shortQ2') q=g.short.q2;
  else if(step==='q3' && partie.branch==='irregular') q=Object.assign({}, g.q3, {title:g.q3.titleIrregular});
  else if(step==='q2' && partie.theme==='corps' && partie.answers.q0 && NORA_FOOD_Q0.indexOf(partie.answers.q0.label)>=0) q=g.q2Food;
  else if(step==='q4' && partie.theme==='point' && !runsTermines('point').length) q=g.q4First;
  else q=g[step];
  if(!q) return null;
  if(partie.theme!=='habitudes') return q;
  const c=Object.assign({}, q);
  ['title','titleIrregular'].forEach(function(k){ if(c[k]) c[k]=neoRemplir(c[k]); });
  if(c.options) c.options=c.options.map(function(o){ const x=Object.assign({}, o); if(x.restit) x.restit=neoRemplir(x.restit); return x; });
  if(c.dropout){ c.dropout=Object.assign({}, c.dropout); if(c.dropout.restit) c.dropout.restit=neoRemplir(c.dropout.restit); }
  return c;
}
function ordre(){
  const g=JEUX[partie.theme];
  let pre=g.q0 ? ['q0'] : [];
  if(partie.answers.q0 && partie.answers.q0.sub) pre=pre.concat(['q0b']);
  if(partie.skipQ2) return pre.concat(['q1','q3','q4','q5','fin']);
  return pre.concat(partie.branch==='short' ? ['q1','q2','shortQ1','shortQ2','fin'] : ['q1','q2','q3','q4','q5','fin']);
}
function numeroDe(step){ return {q1:'Question 1', q2:'Question 2', q3:'Question 3', q4:'Question 4', q5:'Question 5', shortQ1:'Question 3', shortQ2:'Question 4'}[step] || 'Avant de commencer'; }
function autreAutorise(step, q){
  if(!q || step==='q0b') return false;
  if((q.options||[]).some(function(o){ return /^Autre/i.test(o.label||'') || o.close; })) return false;
  return true;
}

/* ─────────── sorties qui dépendent du contexte ─────────── */
function solDejaVu(){ return rencontre('sol') || etat.jeux.runs.some(function(r){ return r.exitAgent==='sol'; }); }
function quelquunPartageLeLit(){ const r=runsDe('relation').filter(function(x){ return x.answers && x.answers.q0; }); return r.length ? r[r.length-1].answers.q0==='En couple' : false; }
function miaRelationsAgent(){
  let best=null, at=0;
  [['relation','leo'],['affirmation','otis'],['lien','iris']].forEach(function(p){ runsTermines(p[0]).forEach(function(r){ if(r.at>at){ at=r.at; best=p[1]; } }); });
  return best || 'iris';
}
function sortieDe(opt, step){
  if(!opt) return null;
  if(partie.theme==='sommeil' && step==='q3'){
    if(opt.label==='Ma tête qui tourne') return solDejaVu() ? 'sol' : 'felix';
    if(/^Ce qui m'entoure/.test(opt.label)) return quelquunPartageLeLit() ? 'leo' : 'miro';
  }
  if(partie.theme==='point' && step==='q3' && opt.exitRelations) return miaRelationsAgent();
  return opt.exit || null;
}

/* ─────────── l'écran plein ─────────── */
function pleinJeu(html){
  const pl=document.getElementById('plein'), a=AG[partie.agent];
  pl.innerHTML=typo('<div class="jeu" style="--c:'+a.couleur+';--e:'+(a.encre||'#FFFFFF')+';--t:'+teinteDe(a.couleur)+'">'+html+'</div>');
  pl.classList.add('ouvert'); pl.setAttribute('aria-hidden', 'false'); pl.scrollTop=0;
  if(fem()) accordNoeud(pl);
}
function accordNoeud(root){
  const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); let n; const l=[];
  while((n=w.nextNode())) l.push(n);
  l.forEach(function(t){ if(!t.parentElement.closest('textarea')){ const v=accordFeminin(t.nodeValue); if(v!==t.nodeValue) t.nodeValue=v; } });
}
function barreJeu(step){
  const o=ordre(), i=Math.max(0, o.indexOf(step)), pct=Math.round(100*i/Math.max(1, o.length-1));
  return '<header class="barre"><span class="sur">'+esc(AG[partie.agent].nom)+' · '+esc(JEUX[partie.theme].label)+'</span>'
    +'<div class="progression" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><span style="width:'+pct+'%"></span></div>'
    +'<button class="b-quitter" data-action="jeu-quitter">Quitter</button></header>';
}
function ouvrirJeu(agentId){
  const theme=jeuDe(agentId); if(!theme) return;
  clearTimeout(reflexionTimer);
  partie={theme:theme, agent:agentId, branch:null, step:JEUX[theme].q0 ? 'q0' : 'q1', answers:{}, titles:{}, skipQ2:false, dejaReveille:voixReveillee(agentId)};
  rendreEtape();
}
function rendreEtape(){
  if(partie.step==='fin'){ rendreFin(); return; }
  rendreQuestion(partie.step);
}
function rendreQuestion(step){
  clearTimeout(reflexionTimer);
  const g=JEUX[partie.theme], q=questionDef(step);
  const opts=q.options.map(function(o, i){ return '<button class="opt" data-action="jeu-choix" data-step="'+step+'" data-i="'+i+'">'+esc(o.label)+'</button>'; }).join('')
    +(autreAutorise(step, q) ? '<button class="opt" data-action="jeu-autre">Autre</button><div class="autre" id="jeu-autre" hidden><textarea class="champ" id="jeu-autre-texte" rows="2" maxlength="280" placeholder="Ce qui est juste pour toi, si tu veux l’écrire"></textarea><button class="btn" data-action="jeu-choix" data-step="'+step+'" data-i="autre">Valider</button></div>' : '')
    +(q.dropout ? '<button class="lien" data-action="jeu-choix" data-step="'+step+'" data-i="-1">'+esc(q.dropout.label)+'</button>' : '');
  const ms=(g.reflectionMs && REFLEXION_MS) ? REFLEXION_MS : 0;
  pleinJeu(barreJeu(step)+'<div class="corps"><p class="sur">'+esc(numeroDe(step))+'</p>'
    +(ms ? '<div class="reflexion" id="jeu-reflexion"><div class="monte" style="--d:'+(ms/1000)+'s"></div><h1 class="q-titre">'+esc(q.title)+'</h1></div>'
         : '<h1 class="q-titre">'+esc(q.title)+'</h1>')
    +'<div class="options" id="jeu-options"'+(ms?' hidden':'')+'>'+opts+'</div>'
    +(ms && !g.noClock ? '<button class="lien" id="jeu-voir" data-action="jeu-voir">Voir les réponses maintenant</button>' : '')+'</div>');
  if(ms) reflexionTimer=setTimeout(montrerOptions, ms);
}
function montrerOptions(){
  clearTimeout(reflexionTimer);
  const o=document.getElementById('jeu-options'), b=document.getElementById('jeu-voir'), r=document.getElementById('jeu-reflexion');
  if(o) o.hidden=false; if(b) b.hidden=true; if(r) r.classList.add('fini');
}
function choisirJeu(step, idx){
  const q=questionDef(step); if(!q) return;
  let opt;
  if(idx==='autre'){
    const tx=document.getElementById('jeu-autre-texte'), text=tx ? String(tx.value||'').trim().slice(0, 280) : '';
    opt={label:'Autre', text:text, autre:true, branch:'normal', restit:''};
  } else opt=idx===-1 ? q.dropout : q.options[idx];
  if(!opt) return;
  partie.titles[step]=q.title;
  partie.answers[step]=opt;
  if(step==='q0' && opt.direct && AG[opt.direct]){ partie.exitAgent=opt.direct; terminer(true); return; }
  if(step==='q0b'){
    if(opt.close){ terminer(true); rendreFerme(); return; }
    if(opt.skipToIrregular){ partie.branch='irregular'; partie.skipQ2=true; }
  }
  if(step==='q2') partie.branch=opt.branch||'normal';
  if(step==='q3') partie.exitAgent=sortieDe(opt, step);
  if(partie.theme==='corps' && (step==='q2' || (step==='q1' && partie.skipQ2)) && noraDoitArreter()){ noraArreter(); return; }
  const o=ordre(), i=o.indexOf(step);
  partie.step=o[i+1]||'fin';
  if(partie.step==='fin') terminer(true);
  rendreEtape();
}
function reponsesPourMemoire(){
  const out={};
  Object.keys(partie.answers).forEach(function(k){ const a=partie.answers[k]; out[k]=a.autre ? ('Autre'+(a.text?' : '+a.text:'')) : a.label; });
  return out;
}
function terminer(complet){
  const run={theme:partie.theme, agent:partie.agent, at:Date.now(), branch:partie.branch, answers:reponsesPourMemoire(), exitAgent:partie.exitAgent||null, completed:!!complet, stopped:!!partie.stopped};
  if(partie.theme==='point'){ run.terrain=(partie.branch!=='short' && partie.answers.q3 && partie.answers.q3.terrain)||null; run.state=partie.answers.q2 ? partie.answers.q2.label : null; }
  etat.jeux.runs.push(run); if(etat.jeux.runs.length>120) etat.jeux.runs=etat.jeux.runs.slice(-120);
  if(complet || partie.stopped){
    if(etat.voix.reveillees.indexOf(partie.agent)<0) etat.voix.reveillees.push(partie.agent);
    signauxDesJeux();
  }
  garder();
  if(complet && typeof proApresReponse==='function' && jeuPointDisponible()) rafraichirOnglet();
}
function abandonner(){
  clearTimeout(reflexionTimer);
  if(partie && partie.step!=='fin' && Object.keys(partie.answers).length) terminer(false);
  fermerJeu();
}
function fermerJeu(){ partie=null; fermerPlein(); }

/* ─────────── Nora : l'arrêt anticipé ─────────── */
function noraDoitArreter(){
  const a=partie.answers;
  const durable=a.q1 && NORA_DURABLE.indexOf(a.q1.label)>=0;
  if(!durable) return false;
  if(partie.skipQ2) return true;
  return !!(a.q2 && NORA_FORT.indexOf(a.q2.label)>=0);
}
function noraArreter(){
  clearTimeout(reflexionTimer);
  partie.stopped=true; partie.step='fin';
  terminer(false);
  pleinJeu(barreJeu('fin')+'<div class="corps fin"><h1 class="grand">Merci d’avoir répondu.</h1>'
    +'<p class="texte">On s’arrête là pour ce jeu : ce que tu décris mérite mieux que des questions à choix.</p>'
    +'<p class="texte">En parler à quelqu’un peut aider, à ton rythme. '+(abonne() ? 'Ton professionnel référent te lit, sans rendez-vous.' : 'Une personne de confiance, ou un professionnel de santé, peut t’écouter.')+'</p>'
    +(abonne() ? bouton('Voir mon professionnel référent', 'jeu-pro') : '')
    +bouton(abonne() ? 'Parler à Nora' : 'En parler avec MIA', 'jeu-parler')+'</div>');
}
function rendreFerme(){
  pleinJeu(barreJeu('fin')+'<div class="corps fin"><h1 class="grand">Merci d’avoir répondu.</h1><p class="texte">On s’arrête là.</p>'+bouton('Fermer', 'jeu-quitter')+'</div>');
}

/* ─────────── signaux des jeux (31-jeu-nora-et-signaux.js) ─────────── */
function signauxDesJeux(){
  if(typeof poserSignal!=='function') return;
  const lim=Date.now()-30*86400000;
  const recents=function(theme){ return runsDe(theme).filter(function(r){ return r.at>=lim; }); };
  if(recents('corps').some(function(r){ return r.stopped; })) poserSignal('blocage', 'jeu de Nora', true, 'Le jeu de Nora s’est arrêté avant la fin et a orienté vers un accompagnement humain.');
  if(recents('habitudes').some(function(r){ const a=r.answers||{}; return r.completed && ["C'est tous les jours","J'ai du mal à m'arrêter une fois lancé"].indexOf(a.q2)>=0 && ["Il y a plus d'un an",'Je ne sais plus'].indexOf(a.q1)>=0; }))
    poserSignal('blocage', 'jeu de Neo', false, 'Ce qui prend de la place est présent chaque jour, ou difficile à arrêter, depuis longtemps.');
  const rep=function(theme, q2){ return runsTermines(theme).filter(function(r){ return r.answers && r.answers.q2===q2; }).length; };
  if(rep('travail', 'Trop de charge, je ne tiens plus le rythme')>=2) poserSignal('blocage', 'jeu de Mateo', false, '« Trop de charge, je ne tiens plus le rythme », à plusieurs passages.');
  if(rep('lien', "Je n'ai plus personne à appeler")>=2) poserSignal('blocage', 'jeu d’Iris', false, '« Je n’ai plus personne à appeler », à plusieurs passages.');
  const pts=runsTermines('point').slice(-3);
  if(pts.length===3 && pts.every(function(r){ return r.state==='Je stagne'; })) poserSignal('stagnation', 'point de mesure', false, 'Trois points de mesure de suite sur « je stagne ».');
}

/* ─────────── la fin ─────────── */
function infosFin(){
  const g=JEUX[partie.theme], A=partie.answers, court=partie.branch==='short';
  const utiles=[];
  function add(id){ if(id && id!=='mia' && id!==partie.agent && AG[id] && utiles.indexOf(id)<0) utiles.push(id); }
  add(partie.exitAgent);
  ['q0','q2','q3'].forEach(function(k){ const a=A[k]; if(a && a.second && !(k==='q3' && court)) add(a.second); });
  add(g.alsoAlways);
  const rangs=['q0','q0b','q1','q2','q3','q4','q5','shortQ1','shortQ2'];
  const lignes=Object.keys(A).filter(function(k){ return rangs.indexOf(k)>=0; }).sort(function(a, b){ return rangs.indexOf(a)-rangs.indexOf(b); })
    .map(function(k){ const a=A[k]; return {q:partie.titles[k]||'', a:a.autre ? (a.text||'Autre') : a.label}; });
  return {theme:partie.theme, label:g.label, agent:partie.agent, utiles:utiles.slice(0, 2), lignes:lignes, reveil:!partie.dejaReveille, stopped:!!partie.stopped,
    revoirCap:!!(partie.theme==='point' && A.q5 && A.q5.reviewObjective), comparaison:partie.theme==='point' ? comparaisonPoint() : ''};
}
function comparaisonPoint(){
  if(partie.branch==='short') return '';
  const now=partie.answers.q3; if(!now || !now.terrain) return '';
  const runs=runsTermines('point'); let prev=null;
  for(let i=runs.length-2;i>=0;i--){ if(runs[i].terrain){ prev=runs[i]; break; } }
  if(!prev || prev.terrain===now.terrain) return '';
  return majus(dateLib(prev.at))+', tu situais ça du côté '+MIA_TERRAIN[prev.terrain].phrase+'. Aujourd’hui, '+MIA_TERRAIN[now.terrain].auj+'.';
}
function rendreFin(){
  const e=finDePartie=infosFin(), a=AG[e.agent], pr=pron(e.agent), nom=esc(a.nom), n=e.lignes.length;
  const corps=e.agent==='mia'
    ? 'MIA a tes '+n+' réponses. Si tu veux voir ce qu’elles disent de ton parcours, elle les lit et te répond tout de suite. Pas besoin de tout réécrire.'
    : nom+' a tes '+n+' réponses. Si tu as besoin d’en parler, c’est exactement ce pour quoi '+pr.il+' est là : '+pr.il+' les lit et te répond tout de suite. Pas besoin de tout réécrire.';
  const parler=e.agent==='mia' || abonne() ? 'En parler avec '+nom+' maintenant' : 'En parler avec MIA maintenant';
  const prec=runsTermines(e.theme).slice(0, -1).pop();
  pleinJeu(barreJeu('fin')+'<div class="corps fin">'
    +'<div class="fiche-tete">'+avatar(e.agent, 'grand')+'<div><strong>'+nom+'</strong><span>'+esc(e.label)+'</span></div></div>'
    +'<h1 class="grand">Merci d’avoir pris ce temps.</h1><p class="texte">'+corps+'</p>'
    +(e.comparaison ? '<p class="texte">'+esc(e.comparaison)+'</p>' : '')
    +(e.reveil && abonne() && voixReveillee(e.agent) ? '<button class="voix-reveil" data-action="voix-echantillon" data-id="'+e.agent+'">'+iconeVoix()+'<span>Tu as réveillé la voix de '+nom+'. L’écouter</span></button>' : '')
    +(e.revoirCap ? bouton('Revoir mon cap', 'jeu-revoir-cap') : '')
    +bouton(parler, 'jeu-parler')
    +(e.agent==='mia' ? '' : '<button class="btn clair" data-action="jeu-fiche" data-id="'+e.agent+'">Ce que '+nom+' peut vraiment faire pour toi</button>')
    +'<details class="carte"><summary>Revoir mes réponses</summary><ul class="recap">'+e.lignes.map(function(r){ return '<li><strong>'+esc(r.q)+'</strong><br>'+esc(r.a)+'</li>'; }).join('')+'</ul></details>'
    +(prec ? '<details class="carte"><summary>Mes réponses du '+esc(dateCourte(prec.at))+'</summary><ul class="recap">'+Object.keys(prec.answers).map(function(k){ return '<li>'+esc(prec.answers[k])+'</li>'; }).join('')+'</ul></details>' : '')
    +'<button class="lien" data-action="jeu-quitter">Fermer</button></div>');
}
function recapJeu(e){ return 'Je viens de finir ton jeu « '+e.label+' ». Mes réponses :\n\n'+e.lignes.map(function(r){ return '• '+r.q+'\n→ '+r.a; }).join('\n'); }
function consigneFinJeu(e, qui){
  const a=AG[e.agent];
  let s=qui===e.agent
    ? 'Contexte : la personne vient de terminer ton jeu « '+e.label+' », une série de questions à choix. Son dernier message contient ses réponses exactes, envoyées en un geste depuis la fin du jeu. Réponds comme quelqu’un qui a vraiment lu : ne récite pas ses réponses, relie-les. Dis en une ou deux phrases ce que tu y lis, comme une hypothèse ouverte, jamais comme un verdict ni une étiquette. Puis une seule question, pour avancer à partir de là. Une réponse « Autre », avec ou sans texte, compte autant que les autres ; « Je ne sais pas » est une information, pas un manque.'
    : 'Contexte : la personne vient de terminer le jeu « '+e.label+' » de '+a.nom+', une série de questions à choix. Son dernier message contient ses réponses exactes. En formule gratuite, '+a.nom+' ne peut pas venir : c’est toi, MIA, qui réponds. Relie ses réponses en une ou deux phrases, comme une hypothèse ouverte, puis une seule question. Tu peux dire que '+a.nom+' travaillerait ça avec elle dans la formule MAYND, en une phrase, sans insister.';
  if(e.stopped) s+=' Le jeu s’est arrêté avant la fin, parce que ce qu’elle décrit demande un regard humain : dis-le simplement, reste présent, et propose d’en parler à son rythme.';
  if(qui===e.agent && e.utiles.length && abonne() && qui==='mia') s+=' D’après ses réponses, un autre accompagnant pourrait être utile : '+e.utiles.map(function(id){ return AG[id].nom+' ('+minus(AG[id].domaine)+', balise [[INVITE:'+id+']])'; }).join(' ; ')+'. Si, et seulement si, ce que tu lis relève vraiment de son terrain, propose-le et termine par sa balise.';
  else if(qui===e.agent && e.utiles.length) s+=' D’après ses réponses, '+e.utiles.map(function(id){ return AG[id].nom+' ('+minus(AG[id].domaine)+')'; }).join(' et ')+' pourrait être utile : si c’est vraiment le cas, dis-le simplement, MIA s’en chargera.';
  return s;
}
async function parlerDuJeu(){
  const e=finDePartie; if(!e) return;
  fermerJeu();
  const qui=(e.agent==='mia' || abonne()) ? e.agent : 'mia';
  montrerOnglet('discussion');
  setTimeout(function(){
    ajouterAuFil({type:'user', texte:recapJeu(e)});
    if(qui!=='mia' && etat.presents.indexOf(qui)<0) faireVenir(qui, {finJeu:consigneFinJeu(e, qui)});
    else { etat.actif=qui; garder(); rendrePresents(); reponse(qui, {finJeu:consigneFinJeu(e, qui)}); }
  }, DUREE+60);
}
function iconeVoix(){ return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'; }

/* ─────────── actions ─────────── */
ACTIONS['jeu-ouvrir']=function(b){ fermer(); ouvrirJeu(b.dataset.id); };
ACTIONS['jeu-choix']=function(b){ if(!partie || partie.step!==b.dataset.step) return; choisirJeu(b.dataset.step, b.dataset.i==='autre' ? 'autre' : +b.dataset.i); };
ACTIONS['jeu-autre']=function(b){ const a=document.getElementById('jeu-autre'); if(a){ a.hidden=false; b.hidden=true; document.getElementById('jeu-autre-texte').focus(); } };
ACTIONS['jeu-voir']=montrerOptions;
ACTIONS['jeu-quitter']=function(){ if(partie && partie.step==='fin') fermerJeu(); else abandonner(); };
ACTIONS['jeu-parler']=function(){ if(!finDePartie && partie) finDePartie=infosFin(); parlerDuJeu(); };
ACTIONS['jeu-fiche']=function(b){ const id=b.dataset.id; fermerJeu(); ACTIONS.fiche({dataset:{id:id}}); };
ACTIONS['jeu-pro']=function(){ fermerJeu(); ACTIONS['pro-ouvrir'](); };
ACTIONS['jeu-revoir-cap']=function(){ fermerJeu(); ACTIONS['cap-modifier'](); };
