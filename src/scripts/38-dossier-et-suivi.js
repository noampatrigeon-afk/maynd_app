/* ══════════════════════════════════════════════════════════════════════════
   DOSSIER, SUIVI ET CONSIGNE DU TOUR — 05/10/2026
   (dossier « Expérience et intelligence », sections 3 et 4)

   1. Le dossier de la personne (state.dossier) : une mémoire par personne, plus
      par discussion. MIA, chaque accompagnant et le professionnel lisent le même.
      La personne le voit et le corrige dans son profil (« Ce que MAYND retient
      de toi ») ; une ligne effacée n'est jamais réécrite.
   2. Les pas datés : la balise [[ACTE:texte|quand]] crée un pas avec une
      échéance. L'accueil montre « Ton pas » (C'est fait / Pas encore / En
      parler). Un pas fait fait avancer l'objectif principal. L'accompagnant y
      revient au bon moment, par la consigne du tour.
   3. La consigne du tour, calculée par le code à chaque réponse : moment,
      sécurité, règle des questions, longueur, pas à suivre, événement proche,
      dernier message gratuit, cap à proposer. Le modèle n'a plus à tout
      arbitrer seul en écrivant.
   4. La lecture des messages : quelques secondes après une réponse, un appel
      court (Haiku 4.5) lit les derniers messages et rend un JSON : risque, l'un
      des quatre signaux, phase, besoin, énergie, information manquante, pas
      évoqués, faits nouveaux, événements à venir, piste refusée. Le risque y est
      un second filet (le premier est local, 35-securite-et-confiance.js) ; le
      reste nourrit le dossier, les signaux du professionnel et la consigne du
      tour suivant. En différé pour ne jamais ralentir la réponse, et groupé pour
      coûter moins.
   5. Dans la discussion : les choix en boutons ([[CHOIX:a|b|c]]), « Ça ne me
      parle pas » sous la dernière réponse (plus seulement sous les réponses
      croisées), la carte d'un jeu ([[JEU:id]]) et la fin douce du gratuit.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── 1. le dossier ─────────── */
function dossier(){
  var d=state.dossier;
  if(!d || typeof d!=='object') d=state.dossier={};
  ['faits','personnes','aide','marchePas','facon','refusees','aVenir','pas','effaces'].forEach(function(k){ if(!Array.isArray(d[k])) d[k]=[]; });
  if(typeof d.situation!=='string') d.situation='';
  return d;
}
function dossierEfface(texte){ var e=dossier().effaces; var n=String(texte||'').trim().toLowerCase(); return e.some(function(x){ return String(x).trim().toLowerCase()===n; }); }
function dossierAjouter(liste, texte, max){
  var d=dossier(), s=String(texte||'').trim(); if(!s || s.length>300 || dossierEfface(s)) return false;
  var l=d[liste]; if(l.some(function(x){ return String(x).trim().toLowerCase()===s.toLowerCase(); })) return false;
  l.push(s); if(l.length>(max||30)) d[liste]=l.slice(-(max||30));
  return true;
}
function dateLib(ts){
  if(!ts) return '';
  var d=new Date(ts), now=new Date(); var j0=new Date(now); j0.setHours(0,0,0,0); var j1=new Date(d); j1.setHours(0,0,0,0);
  var n=Math.round((j1-j0)/86400000);
  if(n===0) return 'aujourd’hui'; if(n===1) return 'demain'; if(n===-1) return 'hier';
  if(n>1 && n<7) return d.toLocaleDateString('fr-FR',{weekday:'long'});
  return d.toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long'});
}
function quandLib(p){ return p.echeance ? dateLib(p.echeance) : (p.quandTexte || 'cette semaine'); }
/* Lignes injectées dans le bloc « dossier » de chaque appel (37-consignes-v2.js). */
function dossierLignes(){
  var d=dossier(), L=[];
  if(d.situation) L.push('sa situation en ce moment : '+d.situation);
  if(d.personnes.length) L.push('les personnes qui comptent dans ce qu’elle raconte : '+d.personnes.slice(-8).join(' ; '));
  if(d.faits.length) L.push('ce qu’on sait d’elle : '+d.faits.slice(-12).join(' ; '));
  if(d.aide.length) L.push('ce qui l’aide : '+d.aide.slice(-6).join(' ; '));
  if(d.marchePas.length) L.push('ce qui ne marche pas pour elle : '+d.marchePas.slice(-6).join(' ; '));
  if(d.facon.length) L.push('sa façon de recevoir : '+d.facon.slice(-4).join(' ; '));
  var enCours=d.pas.filter(function(p){ return p.statut==='en_cours'||p.statut==='reporte'; });
  if(enCours.length) L.push('ses pas en cours : '+enCours.slice(-5).map(function(p){ return '« '+p.texte+' », prévu '+quandLib(p)+(p.reports?' (repoussé '+p.reports+' fois)':''); }).join(' ; '));
  var faits=d.pas.filter(function(p){ return p.statut==='fait' && p.faitLe && (Date.now()-p.faitLe)<14*86400000; });
  if(faits.length) L.push('pas faits ces deux dernières semaines : '+faits.slice(-4).map(function(p){ return '« '+p.texte+' »'; }).join(' ; '));
  var ev=d.aVenir.filter(function(e){ return e.date && evenementTs(e)>=Date.now()-86400000; });
  if(ev.length) L.push('ce qui l’attend : '+ev.slice(0,4).map(function(e){ return e.quoi+' ('+dateLib(evenementTs(e))+')'; }).join(' ; '));
  if(d.refusees.length) L.push('pistes qu’elle a refusées, à ne jamais reproposer : '+d.refusees.slice(-6).join(' ; '));
  if(d.hypothese && d.hypothese.texte) L.push('hypothèse de fond, à confirmer : '+d.hypothese.texte+' (certitude '+(d.hypothese.certitude||'faible')+')');
  return L;
}
function evenementTs(e){ var m=String(e.date||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2]-1, +m[3], 12).getTime() : 0; }

/* ─────────── 2. les pas datés ─────────── */
var JOURS_FR=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function parseQuand(s, base){
  var t=normRisque(s); if(!t) return null;
  var d=new Date(base||Date.now()); d.setHours(20,0,0,0);
  var m=t.match(/(\d{4})-(\d{2})-(\d{2})/); if(m) return new Date(+m[1], +m[2]-1, +m[3], 20).getTime();
  m=t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if(m){ var x=new Date(d); x.setMonth(+m[2]-1, +m[1]); if(x.getTime()<Date.now()-86400000) x.setFullYear(x.getFullYear()+1); return x.getTime(); }
  if(/apres-demain/.test(t)){ d.setDate(d.getDate()+2); return d.getTime(); }
  if(/demain/.test(t)){ d.setDate(d.getDate()+1); return d.getTime(); }
  if(/aujourd'hui|ce soir|ce matin|cet apres-midi|tout a l'heure|maintenant|tout de suite/.test(t)) return d.getTime();
  m=t.match(/dans (\d+) jours?/); if(m){ d.setDate(d.getDate()+(+m[1])); return d.getTime(); }
  for(var i=0;i<7;i++){ if(new RegExp('\\b'+JOURS_FR[i]+'\\b').test(t)){ var diff=(i-d.getDay()+7)%7; d.setDate(d.getDate()+diff); return d.getTime(); } }
  if(/semaine prochaine/.test(t)){ d.setDate(d.getDate()+7); return d.getTime(); }
  if(/week-?end/.test(t)){ var w=(6-d.getDay()+7)%7; d.setDate(d.getDate()+w); return d.getTime(); }
  if(/cette semaine|dans la semaine|d'ici la fin de la semaine/.test(t)){ var dim=(7-d.getDay())%7; d.setDate(d.getDate()+dim); return d.getTime(); }
  return null;
}
function enregistrerPas(th, r){
  if(!r || !Array.isArray(r.pas) || !r.pas.length) return;
  var d=dossier(), now=Date.now();
  var auteur=(r.redige && byId(r.redige)) ? r.redige : (th.parts.length===1 ? th.parts[0] : 'mia');
  r.pas.forEach(function(p){
    var texte=String(p.texte||'').trim(); if(!texte) return;
    if(d.pas.some(function(x){ return x.texte.toLowerCase()===texte.toLowerCase() && x.statut!=='fait'; })) return;
    d.pas.push({id:'p'+now+Math.floor(Math.random()*999), texte:texte.slice(0,140), quandTexte:String(p.quand||'').slice(0,40),
      echeance:parseQuand(p.quand)||(now+3*86400000), agent:auteur, threadId:th.id, statut:'en_cours', cree:now, evoques:[]});
  });
  if(d.pas.length>30) d.pas=d.pas.slice(-30);
  persist();
}
function pasParId(id){ return dossier().pas.find(function(p){ return p.id===id; }); }
function pasDuMoment(){
  var l=dossier().pas.filter(function(p){ return p.statut==='en_cours' || p.statut==='reporte'; });
  l.sort(function(a,b){ return (a.echeance||0)-(b.echeance||0); });
  return l[0]||null;
}
function marquerPasFait(p, silencieux){
  if(!p || p.statut==='fait') return;
  p.statut='fait'; p.faitLe=Date.now();
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  if(principal && principal.progress<principal.steps) stepObjective(principal.id);
  else markActivity('goal');
  persist();
  if(!silencieux) toast('C’est noté. Un pas de plus.');
}
function pasFait(id){ marquerPasFait(pasParId(id)); try{ renderHomeGoals(); }catch(e){} }
function pasPasEncore(id){
  var p=pasParId(id); if(!p) return;
  p.statut='reporte'; p.reports=(p.reports||0)+1; p.echeance=Date.now()+2*86400000; p.evoques=[];
  persist(); toast('D’accord. On en reparle dans deux jours.');
  try{ renderHomeGoals(); }catch(e){}
}
function pasEnParler(id){
  var p=pasParId(id); if(!p) return;
  var qui=(p.agent && byId(p.agent) && isUnlocked(p.agent)) ? p.agent : 'mia';
  if(qui==='mia') openMia(); else startWithAgent(qui);
  setTimeout(function(){ try{ var i=$('chat-input'); i.value='À propos de « '+p.texte+' » : '; autoGrow(i); toggleSend(); i.focus(); }catch(e){} }, 120);
}
function pasCarteHTML(){
  var p=pasDuMoment(); if(!p) return '';
  var a=byId(p.agent)||byId('mia');
  return '<div class="pas-card" style="--pc:'+a.color+'">'
    +'<div class="pas-lbl">Ton pas</div>'
    +'<div class="pas-txt">'+escapeHtml(p.texte)+'</div>'
    +'<div class="pas-meta">Proposé par '+escapeHtml(a.name)+' · prévu '+escapeHtml(quandLib(p))+'</div>'
    +'<div class="pas-btns"><button class="pas-b main" onclick="pasFait(\''+p.id+'\')">C’est fait</button>'
    +'<button class="pas-b" onclick="pasPasEncore(\''+p.id+'\')">Pas encore</button>'
    +'<button class="pas-b" onclick="pasEnParler(\''+p.id+'\')">En parler</button></div></div>';
}
(function(){
  var base=renderHomeGoals;
  if(typeof base!=='function') return;
  window.renderHomeGoals=function(){
    var r=base.apply(this, arguments);
    try{ var box=$('home-goals'); if(box){ var h=pasCarteHTML(); if(h) box.insertAdjacentHTML('afterbegin', h); } }catch(e){}
    return r;
  };
})();
function pasASuivre(th){
  var now=Date.now();
  var l=dossier().pas.filter(function(p){
    return (p.statut==='en_cours'||p.statut==='reporte') && p.echeance && p.echeance<=now && p.echeance>now-7*86400000
      && (p.evoques||[]).indexOf(th.id)<0
      && (th.parts.indexOf(p.agent)>=0 || th.parts.indexOf('mia')>=0);
  });
  l.sort(function(a,b){ return b.echeance-a.echeance; });
  return l[0]||null;
}

/* ─────────── 3. la consigne du tour ─────────── */
var INFO_MANQUANTE={situation:'la situation concrète (quand, où, avec qui)', ce_qui_compte:'ce qui compte pour elle là-dedans', deja_essaye:'ce qu’elle a déjà essayé'};
function motsDe(s){ return String(s||'').trim().split(/\s+/).filter(Boolean).length; }
function heureFr(d){ return d.getHours()+' h '+String(d.getMinutes()).padStart(2,'0'); }
function capEnAttente(th){ return (th.msgs||[]).some(function(m){ return m.capProp && !m.capFait; }); }
function evenementProche(){
  var now=Date.now();
  var l=dossier().aVenir.filter(function(e){ var ts=evenementTs(e); return ts && ts>=now-86400000 && ts<=now+3*86400000; });
  l.sort(function(a,b){ return evenementTs(a)-evenementTs(b); });
  return l[0]||null;
}
function consigneDuTour(th, opts){
  if(!th) return '';
  var L=['Consigne pour cette réponse (elle prime sur tes habitudes, jamais sur la sécurité) :'];
  var now=new Date();
  L.push('Moment : '+now.toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long'})+', '+heureFr(now)+'.');
  var users=(th.msgs||[]).filter(function(m){ return m.role==='user'; });
  var n=users.length, dernier=n ? String(users[n-1].content||'') : '';
  var ecart=state.derniereVisitePrecedente ? Math.floor((now-state.derniereVisitePrecedente)/86400000) : 0;
  if(ecart>=7 && n<=1) L.push('Elle revient après '+ecart+' jours : accueille-la sans reproche, avec une phrase de reprise. Ne parle ni de série ni d’absence.');
  else if(ecart>=2 && n<=1) L.push('Dernière visite : il y a '+ecart+' jours.');

  var r=(typeof risqueActif==='function') ? risqueActif(th) : null;
  if(r){
    th._longueur='courte';
    L.push('Sécurité : le protocole est actif et passe avant tout. Réponse très courte et présente, sans exercice ni analyse. Les numéros sont déjà affichés à l’écran.');
    if(r.alerteAt) L.push('Son professionnel référent a été prévenu à '+heureFr(new Date(r.alerteAt))+'. Tu peux le lui dire simplement.');
    else L.push('Formule gratuite : il n’y a pas de professionnel. Ne dis jamais que quelqu’un est prévenu.');
    return L.join('\n');
  }

  var assist=(th.msgs||[]).filter(function(m){ return m.role==='assistant'; });
  var deuxDernieres=assist.slice(-2);
  var serieQuestions=deuxDernieres.length===2 && deuxDernieres.every(function(m){ return /\?\s*$/.test(String(m.content||'').trim()); });
  var dn=normRisque(dernier);
  var court=n>0 && (motsDe(dernier)<=4 || /^(bof|je sais pas|je ne sais pas|j'sais pas|chais pas|ouais|mouais|ok|bah|pas trop|aucune idee|rien)\b/.test(dn));
  var demande=/\?\s*$/.test(dernier.trim()) || /^(comment|pourquoi|est-ce que|qu'est-ce|peux-tu|tu peux|aide-moi|explique|que faire|quoi faire)\b/.test(dn);
  var lu=th.lastLecture||null;
  var info=lu && lu.information_manquante && INFO_MANQUANTE[lu.information_manquante];
  if(serieQuestions) L.push('Question : aucune cette fois. Tes deux dernières réponses finissaient par une question : apporte quelque chose.');
  else if(court) L.push('Elle écrit court : pas de question ouverte. Propose quelque chose, ou offre deux ou trois choix simples avec la balise [[CHOIX:…]].');
  else if(demande) L.push('Elle te demande quelque chose de précis : réponds d’abord, concrètement. Une question ensuite seulement si sa réponse change ta proposition.');
  else if(info) L.push('Ce qui manque encore pour lui proposer un pas qui lui ressemble : '+info+'. Tu peux le demander, en une seule question, en dernière phrase.');
  else L.push('Question : facultative, une au plus, seulement si sa réponse change ce que tu vas proposer.');

  var h=now.getHours(), tard=(h>=23 || h<6);
  var energieBasse=court || (lu && lu.energie==='basse');
  var developper=motsDe(dernier)>=8 && LENGTH_DEV_TRIGGERS.some(function(re){ return re.test(dernier); });
  var longueur;
  if(n<=1){ th._longueur='courte'; longueur='courte, deux ou trois phrases, une seule idée'; }
  else if(tard || energieBasse){ th._longueur='courte'; longueur='courte, deux phrases'; }
  else if(developper){ th._longueur='developpee'; longueur='développée, prends la place qu’il faut, sans délayer'; }
  else { th._longueur='normale'; longueur='normale, deux à quatre phrases'; }
  L.push('Longueur : '+longueur+'.');
  if(tard) L.push('Il est tard : rien d’ambitieux, ce qui peut attendre demain attend demain.');

  var p=pasASuivre(th);
  if(p && !(opts && opts.extraSystem)){
    L.push('Pas à suivre : « '+p.texte+' », prévu '+quandLib(p)+'. Si le moment s’y prête, demande-lui simplement où elle en est, jamais comme un contrôle.');
    p.evoques=(p.evoques||[]).concat(th.id); persist();
  }
  var ev=evenementProche();
  if(ev) L.push('À venir pour elle : '+ev.quoi+', '+dateLib(evenementTs(ev))+'.');
  var derniere=assist[assist.length-1];
  if(derniere && derniere.pasJuste) L.push('Ta réponse précédente ne lui a pas parlé : change d’angle, sans t’excuser longuement et sans redire la même idée.');
  if(state.tier==='free'){ ensureFreeDay(); if(state.freeCount===4) L.push('C’est son dernier message gratuit aujourd’hui : termine par ce que tu retiens et un pas simple pour demain. Ne parle pas d’abonnement.'); }
  var chezMia=th.parts.length===1 && th.parts[0]==='mia';
  if(chezMia && !state.cap && !state.capMeta && n>=2 && !capEnAttente(th)) L.push('Cap : si tu as compris ce qui l’amène, propose-lui un cap en une phrase, avec ses mots à elle, et termine par la balise [[CAP:la phrase]], seule sur sa ligne. Sinon, attends encore un échange.');
  if(chezMia && energieBasse && n<=3) L.push('Si elle ne sait pas par où commencer, tu peux lui proposer le jeu de l’accompagnant le plus proche de ce qu’elle vit, avec la balise [[JEU:identifiant]].');
  return L.join('\n');
}
function plafondMots(th){ var l=th && th._longueur; return l==='developpee' ? 520 : (l==='courte' ? 80 : 150); }

/* ─────────── balises : ACTE avec échéance, CHOIX, JEU, CAP (en plus de celles de 17) ─────────── */
function parseSignals(raw){
  var joinId=null, ancrage=null, actes=[], pas=[], boucle=null, redige=null, choix=null, jeu=null, cap=null;
  var clean=String(raw||'').replace(/\[\[(?:SUGGEST|HANDOFF):\s*([a-z]+)(?::[^\]]*)?\]\]/gi, function(_,id){ if(!joinId && agentById(id.toLowerCase())) joinId=id.toLowerCase(); return ''; });
  clean=clean.replace(/\[\[ANCRAGE:\s*([a-z]+)\s*:\s*(faible|moyenne|forte)\s*\]\]/gi, function(_,id,cert){ var idl=id.toLowerCase(); if(agentById(idl)) ancrage={terrain:idl, certitude:cert.toLowerCase()}; return ''; });
  clean=clean.replace(/\[\[ACTE:\s*([^\]]{1,180})\]\]/gi, function(_,txt){ var bouts=txt.split('|'); var texte=bouts[0].trim(); if(texte){ actes.push(texte); pas.push({texte:texte, quand:(bouts[1]||'').trim()}); } return ''; });
  clean=clean.replace(/\[\[BOUCLE:\s*([a-z]+)\s*:\s*([^\]]{1,140})\]\]/gi, function(_,id,txt){ var idl=id.toLowerCase(); if(agentById(idl)) boucle={terrain:idl, texte:txt.trim()}; return ''; });
  clean=clean.replace(/\[\[REDIGE:\s*([a-z]+)\s*\]\]/gi, function(_,id){ var idl=id.toLowerCase(); if(agentById(idl)||idl==='mia') redige=idl; return ''; });
  clean=clean.replace(/\[\[CHOIX:\s*([^\]]{1,200})\]\]/gi, function(_,txt){ var c=txt.split('|').map(function(s){ return s.trim(); }).filter(Boolean).slice(0,3).map(function(s){ return s.slice(0,40); }); if(c.length>=2) choix=c; return ''; });
  clean=clean.replace(/\[\[JEU:\s*([a-z]+)\s*\]\]/gi, function(_,id){ var idl=id.toLowerCase(); if(byId(idl) && typeof gameForAgent==='function' && gameForAgent(idl)) jeu=idl; return ''; });
  clean=clean.replace(/\[\[CAP:\s*([^\]]{3,200})\]\]/gi, function(_,txt){ cap=txt.trim(); return ''; });
  clean=clean.replace(/\[\[(?:SUGGEST|HANDOFF|ANCRAGE|ACTE|BOUCLE|REDIGE|CHOIX|JEU|CAP)\b[^\]]*$/i,'');
  clean=clean.replace(/\n{3,}/g,'\n\n').trim();
  return {clean:clean, joinId:joinId, ancrage:ancrage, actes:actes, pas:pas, boucle:boucle, redige:redige, choix:choix, jeu:jeu, cap:cap};
}

/* ─────────── la réponse de l'accompagnant (remplace celle de 17) ─────────── */
async function assistantReply(opts){
  opts=opts||{};
  /* la personne vient de parler : les choix et les outils de la réponse précédente s'effacent */
  try{ [].slice.call(document.querySelectorAll('#messages .choix-row')).forEach(function(x){ x.parentNode.removeChild(x); }); rafraichirOutils(); }catch(e){}
  if(!state.apiKey){ addError(t('needKey')+'<br><a class="keylink" onclick="openProfile()">'+t('openProfileLink')+'</a>'); return null; }
  addTyping();
  try{
    var th=activeThread();
    var blocs=composeSystemBlocs(opts);
    var allMsgs=th.msgs.filter(function(m){ return m.role; }).map(function(m){ return {role:m.role, content:m.content}; });
    var msgs=allMsgs.length>KEEP_RAW ? allMsgs.slice(-KEEP_RAW) : allMsgs;
    while(msgs.length && msgs[0].role!=='user') msgs.shift();
    var out=await callClaude(blocs, msgs, REPONSE_MAX_TOKENS, {effort:'low'});
    removeTyping();
    var r=parseSignals(out||'');
    var capped=r.clean ? enforceLengthCap(r.clean, plafondMots(th)) : r.clean;
    var meta=r.boucle ? {crossed:true, boucleTerrain:r.boucle.terrain, boucleText:r.boucle.texte} : {};
    if(r.choix) meta.choix=r.choix;
    addBubbleSplit('assistant', capped||'…', meta);
    if(state.tier==='free'){ ensureFreeDay(); state.freeCount++; persist(); }
    if(r.ancrage){ th.ancrage={terrain:r.ancrage.terrain, certitude:r.ancrage.certitude, atMsgCount:(th.msgs||[]).filter(function(m){ return m.role; }).length}; }
    if(r.actes && r.actes.length) th.actes=(th.actes||[]).concat(r.actes).slice(-8);
    if(r.boucle) th.boucles=(th.boucles||[]).concat([r.boucle.terrain+' : '+r.boucle.texte]).slice(-8);
    enregistrerPas(th, r);
    var cartes=[];
    if(r.jeu){ var mj={jeu:r.jeu}; pushMsg(mj); cartes.push(mj); }
    if(r.cap && !state.cap && !state.capMeta && !capEnAttente(th)){ var mc={capProp:r.cap}; pushMsg(mc); cartes.push(mc); }
    if(state.tier==='free' && state.freeCount>=5){ var mf={finGratuit:true}; pushMsg(mf); cartes.push(mf); }
    applyBoucleOutcome(th, r);
    persist();
    if(opts.onJoin) opts.onJoin(r.joinId); else handleJoin(r.joinId);
    var freshCount=(th.msgs||[]).filter(function(m){ return m.role; }).length;
    if(freshCount>KEEP_RAW && (freshCount-(th.etatCourantAt||0))>=REGEN_EVERY) regenerateEtatCourant(th);
    apresAffichage(capped, function(){ cartes.forEach(function(m){ var el=carteEl(m, th.msgs.indexOf(m)); if(el) $('messages').appendChild(el); }); rafraichirOutils(); scrollChat(); });
    programmerLecture(th);
    compterPourSynthese();
    if(typeof gardeFilApresReponse==='function') gardeFilApresReponse(th);
    if(typeof voixApresReponse==='function') voixApresReponse(capped);
    return r;
  }catch(err){ removeTyping(); addError(errText(err)); return null; }
}
/* addBubbleSplit (17) affiche une réponse en plusieurs bulles, avec un léger décalage :
   les cartes et les outils arrivent après la dernière bulle. */
function apresAffichage(texte, fn){
  var parts=String(texte||'').split(/\n{2,}/).map(function(s){ return s.trim(); }).filter(Boolean).length;
  var n=Math.min(3, Math.max(1, parts));
  setTimeout(function(){ try{ fn(); }catch(e){} }, n>1 ? (n-1)*780+60 : 0);
}

/* ─────────── 5. discussion : rendu, choix, « Ça ne me parle pas », cartes ─────────── */
function carteEl(m, i){
  if(m.prevention) return preventionEl(m);
  if(m.jeu) return jeuCarteEl(m, i);
  if(m.finGratuit) return finGratuitEl(m);
  if(m.capProp && typeof capCarteEl==='function') return capCarteEl(m, i);
  if(m.gardeFil && typeof gardeFilEl==='function') return m.ferme ? null : gardeFilEl(m, i);
  return null;
}
function renderMessages(){
  var th=activeThread(), box=$('messages'); box.innerHTML='';
  if(!th.msgs.length){ introDiscussion(th, box); }
  th.msgs.forEach(function(m,i){
    if(m.note){ box.appendChild((m.arrival && !m.withdrawn) ? arrivalNoteEl(m.agent,m.text,i) : noteEl(m.agent,m.text)); }
    else if(m.invite){ box.appendChild(inviteEl(m.agent)); }
    else if(m.role){
      var el=bubbleEl(m.role==='user'?'user':'assistant', m.content);
      if(m.role!=='user' && m.crossed) el.appendChild(crossFeedbackEl(i));
      box.appendChild(el);
    } else { var c=carteEl(m, i); if(c) box.appendChild(c); }
  });
  rafraichirOutils();
  scrollChat();
}
/* Première ouverture d'une discussion avec MIA : la question d'accueil et quatre portes d'entrée. */
var MIA_ACCUEIL='Salut, moi c’est MIA. Qu’est-ce qui t’amène aujourd’hui ?';
var MIA_PORTES=['Une période difficile','Un objectif à atteindre','Mieux me connaître','Je ne sais pas trop'];
function introDiscussion(th, box){
  var a=byId(th.parts[0]);
  if(th.parts.length===1 && a.id==='mia'){
    box.appendChild(bubbleEl('assistant', MIA_ACCUEIL));
    box.appendChild(choixRowEl(MIA_PORTES));
    return;
  }
  var intro=INTROS[a.id]||''; if(intro) box.appendChild(bubbleEl('assistant', intro));
}
function choixRowEl(choix){
  var d=document.createElement('div'); d.className='choix-row';
  choix.forEach(function(c){
    var b=document.createElement('button'); b.type='button'; b.className='choix-b'; b.textContent=c;
    b.onclick=function(){ envoyerTexte(c); };
    d.appendChild(b);
  });
  return d;
}
function envoyerTexte(texte){
  var i=$('chat-input'); if(!i) return;
  i.value=texte; toggleSend();
  var row=document.querySelector('#messages .choix-row'); if(row) row.parentNode.removeChild(row);
  send();
}
function dernierIndexParle(th){ for(var i=th.msgs.length-1;i>=0;i--){ if(th.msgs[i].role) return i; } return -1; }
/* Outils de la dernière réponse : ses choix en boutons, et « Ça ne me parle pas ». */
function rafraichirOutils(){
  var box=$('messages'); if(!box) return;
  [].slice.call(box.querySelectorAll('.rep-outils')).forEach(function(x){ x.parentNode.removeChild(x); });
  var th=activeThread(); if(!th) return;
  var i=dernierIndexParle(th); if(i<0) return;
  var m=th.msgs[i]; if(m.role!=='assistant') return;
  /* protocole de sécurité actif : ni choix ni « Ça ne me parle pas » sous une réponse de sécurité */
  if(typeof risqueActif==='function' && risqueActif(th)) return;
  /* même après la fenêtre de 30 minutes : pas d'outils sous la réponse qui suit une carte de prévention */
  for(var k=i-1;k>=0;k--){ if(th.msgs[k].prevention) return; if(th.msgs[k].role==='user') break; }
  var d=document.createElement('div'); d.className='rep-outils';
  if(Array.isArray(m.choix) && m.choix.length) d.appendChild(choixRowEl(m.choix));
  if(!m.crossed){
    var b=document.createElement('button'); b.type='button'; b.className='rep-pasjuste';
    b.textContent=m.pasJuste ? 'Noté' : 'Ça ne me parle pas'; b.disabled=!!m.pasJuste;
    b.onclick=function(){ pasJuste(i); };
    d.appendChild(b);
  }
  if(d.childNodes.length) box.appendChild(d);
}
function pasJuste(i){
  var th=activeThread(); var m=th && th.msgs[i]; if(!m || m.pasJuste) return;
  m.pasJuste=true; state.pasJusteTotal=(state.pasJusteTotal||0)+1; persist();
  rafraichirOutils();
}
function jeuCarteEl(m, i){
  var a=byId(m.jeu), key=(typeof gameForAgent==='function') ? gameForAgent(m.jeu) : null;
  if(!a || !key || !GAMES[key]) return null;
  var nq=Object.keys(GAMES[key]).filter(function(k){ return /^q[1-9]$/.test(k); }).length;
  var d=document.createElement('div'); d.className='chat-carte'; d.style.setProperty('--cc', a.color);
  d.innerHTML='<div class="cc-t">Le jeu de '+escapeHtml(a.name)+' · '+escapeHtml(GAMES[key].label)+'</div>'
    +'<div class="cc-x">'+nq+' questions à choix, une minute. Tu peux t’arrêter quand tu veux.</div>'
    +'<button class="cc-b" onclick="openGame(\''+key+'\')">Jouer avec '+escapeHtml(a.name)+'</button>';
  return d;
}
function finGratuitEl(m){
  var d=document.createElement('div'); d.className='chat-carte doux';
  d.innerHTML='<div class="cc-x">Tes cinq messages gratuits d’aujourd’hui sont utilisés. Ils reviennent demain.</div>'
    +'<button class="cc-b" onclick="openUpsell(\'limit\')">Découvrir l’abonnement</button>';
  return d;
}

/* ─────────── 4. la lecture des messages, en différé ─────────── */
var LECTURE_SYSTEM=`Tu lis, pour l'équipe MAYND, le dernier message d'une personne dans une discussion avec un accompagnant. Ta lecture n'est jamais montrée à la personne. Tu réponds uniquement par l'objet JSON demandé, sans texte autour.

Tu reçois son dossier, ses pas en cours, les derniers échanges, et son dernier message : c'est celui que tu lis.

risque
0 : rien de préoccupant.
1 : mal-être marqué, sans idée de mort ni de se faire du mal.
2 : idée de mort ou de se faire du mal, même vague, même au détour d'une phrase ou sur le ton de la blague.
3 : projet, moyen, moment choisi, geste en cours, ou danger immédiat pour elle ou pour quelqu'un d'autre.
En cas de doute entre deux niveaux, prends le plus élevé. Pour 2 et 3, recopie la phrase exacte dans risque_citation.

signal
Un des quatre signaux de MAYND, ou null. Jamais d'autre.
stagnation : rien ne bouge depuis plusieurs échanges, malgré des pas proposés.
blocage : elle bute sur quelque chose qu'elle ne parvient pas à dépasser seule, ou une souffrance demande un regard humain.
desalignement : ce qu'elle vit ou choisit s'éloigne nettement de son cap ou de son objectif.
progression : un progrès réel, qui mérite d'être consolidé.
Recopie la preuve dans signal_preuve. Le plus souvent, signal vaut null.

phase : accueillir, comprendre, agir, suivre (elle revient sur un pas), apaiser (elle est submergée, maintenant).
besoin : ecoute, comprendre, decider, agir, information.
energie : basse, normale ou haute, d'après sa façon d'écrire.
demande_precise : vrai si elle pose une question ou demande quelque chose de précis.
information_manquante : ce qui manque encore pour lui proposer un pas qui lui ressemble : situation, ce_qui_compte, deja_essaye, ou null.
terrain : l'identifiant de l'accompagnant dont le terrain porte le cœur du message (naoki, felix, atlas, ava, leo, otis, kael, miro, sol, mateo, soren, iris, eden, vince, neo, nora), ou null.
pas_evoques : pour chaque pas en cours que son message évoque, son identifiant et son statut : fait, pas_fait, reporte, abandonne.
faits_nouveaux : les faits durables appris dans ce message, une phrase chacun, à la troisième personne, sans mot clinique ni interprétation.
a_venir : les événements datés qu'elle mentionne, avec la date au format AAAA-MM-JJ quand elle se déduit.
hypothese_refusee : la piste qu'elle vient de refuser, en quelques mots, ou null.

Format exact :
{"risque":0,"risque_citation":null,"signal":null,"signal_preuve":null,"phase":"comprendre","besoin":"ecoute","energie":"normale","demande_precise":false,"information_manquante":null,"terrain":null,"pas_evoques":[],"faits_nouveaux":[],"a_venir":[],"hypothese_refusee":null}`;

var LECTURE_DELAI_MS=8000;
var _lectureTimer=null;
function modeleLecture(){ return state.provider==='deepseek' ? 'deepseek-flash' : 'claude-haiku-4-5'; }
function programmerLecture(th){
  if(!th) return;
  clearTimeout(_lectureTimer);
  var id=th.id;
  _lectureTimer=setTimeout(function(){ lireDiscussion(id); }, LECTURE_DELAI_MS);
}
function extraireJSON(s){
  var t=String(s||''); var a=t.indexOf('{'), b=t.lastIndexOf('}');
  if(a<0 || b<=a) return null;
  try{ return JSON.parse(t.slice(a, b+1)); }catch(e){ return null; }
}
function pasEnCoursListe(){
  return dossier().pas.filter(function(p){ return p.statut==='en_cours'||p.statut==='reporte'; })
    .map(function(p){ return p.id+' : '+p.texte+' (prévu '+quandLib(p)+')'; }).join('\n') || 'aucun';
}
async function lireDiscussion(threadId){
  var th=(state.threads||[]).find(function(x){ return x.id===threadId; });
  if(!th || !state.apiKey) return;
  var msgs=(th.msgs||[]).filter(function(m){ return m.role; });
  var depuis=th.luJusqua||0;
  if(msgs.length<=depuis) return;
  var users=msgs.slice(depuis).filter(function(m){ return m.role==='user'; });
  th.luJusqua=msgs.length;
  if(!users.length){ persist(); return; }
  var recents=msgs.slice(-8).map(function(m){ return (m.role==='user'?'Personne':'Accompagnant')+' : '+String(m.content||'').slice(0,800); }).join('\n');
  var payload='Dossier :\n'+(dossierLignes().join('\n')||'vide')+'\n\nPas en cours :\n'+pasEnCoursListe()
    +'\n\nDerniers échanges :\n'+recents+'\n\nDernier message de la personne, celui que tu lis :\n'+users.map(function(m){ return m.content; }).join('\n');
  try{
    var out=await callClaude(LECTURE_SYSTEM, [{role:'user', content:payload}], 900, {model:modeleLecture()});
    var j=extraireJSON(out);
    if(j) appliquerLecture(th, j);
    persist();
  }catch(e){ th.luJusqua=depuis; persist(); }
}
var SIGNAUX_VALIDES=['stagnation','blocage','desalignement','progression'];
function appliquerLecture(th, j){
  var niveau=+j.risque||0;
  if(niveau>=2 && !risqueActif(th)) declencherProtocole(niveau, j.risque_citation||'', 'lecture', th);
  th.lastLecture={phase:j.phase||null, besoin:j.besoin||null, energie:j.energie||null, demande_precise:!!j.demande_precise,
    information_manquante:(INFO_MANQUANTE[j.information_manquante] ? j.information_manquante : null), terrain:(j.terrain && agentById(j.terrain)) ? j.terrain : null, at:Date.now()};
  if(j.signal && SIGNAUX_VALIDES.indexOf(j.signal)>=0) ajouterSignalConversation(j.signal, j.signal_preuve);
  (Array.isArray(j.pas_evoques)?j.pas_evoques:[]).forEach(function(x){
    var p=x && pasParId(x.id); if(!p) return;
    if(x.statut==='fait') marquerPasFait(p, true);
    else if(x.statut==='abandonne'){ p.statut='abandonne'; }
    else if(x.statut==='reporte'){ p.statut='reporte'; p.reports=(p.reports||0)+1; p.echeance=Date.now()+2*86400000; p.evoques=[]; }
  });
  (Array.isArray(j.faits_nouveaux)?j.faits_nouveaux:[]).slice(0,5).forEach(function(f){ dossierAjouter('faits', f, 40); });
  (Array.isArray(j.a_venir)?j.a_venir:[]).slice(0,3).forEach(function(e){
    if(!e || !e.quoi) return; var d=dossier();
    if(d.aVenir.some(function(x){ return x.quoi===e.quoi && x.date===e.date; }) || dossierEfface(e.quoi)) return;
    d.aVenir.push({quoi:String(e.quoi).slice(0,120), date:String(e.date||'').slice(0,10)});
    if(d.aVenir.length>10) d.aVenir=d.aVenir.slice(-10);
  });
  if(j.hypothese_refusee) dossierAjouter('refusees', j.hypothese_refusee, 20);
}
function ajouterSignalConversation(k, preuve){
  state.signauxConversation=Array.isArray(state.signauxConversation)?state.signauxConversation:[];
  var lim=Date.now()-7*86400000;
  var deja=state.signauxConversation.find(function(s){ return s.k===k && s.at>=lim; });
  if(deja){ deja.at=Date.now(); if(preuve) deja.preuve=String(preuve).slice(0,220); }
  else state.signauxConversation.push({k:k, preuve:String(preuve||'').slice(0,220), at:Date.now()});
  if(state.signauxConversation.length>20) state.signauxConversation=state.signauxConversation.slice(-20);
}
/* Signaux du professionnel : ceux lus dans les échanges, et un pas repoussé trois fois. */
(function(){
  var base=proSignals;
  if(typeof base!=='function') return;
  window.proSignals=function(){
    var s=base.apply(this, arguments)||[];
    try{
      var lim=Date.now()-30*86400000;
      (state.signauxConversation||[]).filter(function(x){ return x.at>=lim; }).forEach(function(x){
        if(s.some(function(y){ return y.k===x.k; })) return;
        s.push({k:x.k, d:'Lu dans les échanges'+(x.preuve?' : « '+x.preuve+' »':'.'), w:x.k==='blocage'?'Intervention rapide, hors cycle mensuel':'Traité au bilan mensuel'});
      });
      var repousse=dossier().pas.find(function(p){ return (p.reports||0)>=3 && p.statut!=='fait' && p.statut!=='abandonne'; });
      if(repousse && !s.some(function(y){ return y.k==='stagnation'; })) s.push({k:'stagnation', d:'Le pas « '+repousse.texte+' » a été repoussé '+repousse.reports+' fois.', w:'Traité au bilan mensuel'});
    }catch(e){}
    return s;
  };
})();

/* ─────────── 1 bis. la synthèse du dossier, tous les 12 messages ─────────── */
var DOSSIER_SYSTEM=`Tu tiens à jour le dossier d'une personne accompagnée par MAYND. Tu reçois le dossier actuel en JSON, les lignes qu'elle a effacées, et ses échanges récents. Tu rends le dossier complet mis à jour, uniquement en JSON, au même format, sans texte autour.
Tu gardes ce qui reste vrai. Tu retires ce qui ne l'est plus. Tu n'inventes rien et tu n'interprètes pas au-delà de ce qu'elle a dit. Aucun mot clinique, aucune étiquette, aucun jugement. « situation » tient en cinq phrases au plus, à la troisième personne. « faits » : quinze phrases courtes au plus. « personnes » : une ligne par personne citée, avec son rôle (« Julie, sa sœur, un appui »). Une ligne qu'elle a effacée ne revient jamais, même reformulée. L'hypothèse de fond reste une hypothèse, avec sa certitude : faible, moyenne ou forte.
Format exact :
{"situation":"","personnes":[],"aide":[],"marchePas":[],"facon":[],"hypothese":{"texte":"","certitude":"faible"},"faits":[]}`;
var SYNTHESE_TOUS_LES=12;
function compterPourSynthese(){
  var d=dossier(); d.compteur=(d.compteur||0)+1;
  if(d.compteur>=SYNTHESE_TOUS_LES){ d.compteur=0; synthetiserDossier(); }
  persist();
}
function listeTextes(x, max){ return (Array.isArray(x)?x:[]).map(function(s){ return String(s||'').trim(); }).filter(function(s){ return s && s.length<=300 && !dossierEfface(s); }).slice(0, max); }
async function synthetiserDossier(){
  if(!state.apiKey) return;
  var d=dossier();
  var recents=[];
  (state.threads||[]).slice().sort(function(a,b){ return b.updated-a.updated; }).slice(0,3).forEach(function(th){
    (th.msgs||[]).filter(function(m){ return m.role; }).slice(-10).forEach(function(m){ recents.push((m.role==='user'?'Personne':'Accompagnant')+' : '+String(m.content||'').slice(0,500)); });
  });
  var actuel={situation:d.situation, personnes:d.personnes, aide:d.aide, marchePas:d.marchePas, facon:d.facon, hypothese:d.hypothese||null, faits:d.faits};
  var payload='Dossier actuel :\n'+JSON.stringify(actuel)+'\n\nLignes effacées par la personne, à ne jamais réécrire :\n'+(d.effaces.join('\n')||'aucune')+'\n\nÉchanges récents :\n'+recents.join('\n');
  try{
    var out=await callClaude(DOSSIER_SYSTEM, [{role:'user', content:payload}], 1400, {model:modeleLecture()});
    var j=extraireJSON(out); if(!j) return;
    if(typeof j.situation==='string' && !dossierEfface(j.situation)) d.situation=j.situation.slice(0,900);
    d.personnes=listeTextes(j.personnes, 12); d.aide=listeTextes(j.aide, 8); d.marchePas=listeTextes(j.marchePas, 8);
    d.facon=listeTextes(j.facon, 5); d.faits=listeTextes(j.faits, 15);
    if(j.hypothese && j.hypothese.texte && !dossierEfface(j.hypothese.texte)) d.hypothese={texte:String(j.hypothese.texte).slice(0,200), certitude:/^(faible|moyenne|forte)$/.test(j.hypothese.certitude)?j.hypothese.certitude:'faible'};
    d.maj=Date.now(); persist();
  }catch(e){}
}

/* ─────────── profil : « Ce que MAYND retient de toi » ─────────── */
function dossierEffacer(liste, i){
  var d=dossier(), texte=null;
  if(liste==='situation'){ texte=d.situation; d.situation=''; }
  else if(liste==='pas'){ var p=d.pas[i]; if(p){ texte=p.texte; d.pas.splice(i,1); } }
  else if(liste==='aVenir'){ var e=d.aVenir[i]; if(e){ texte=e.quoi; d.aVenir.splice(i,1); } }
  else if(liste==='hypothese'){ texte=d.hypothese&&d.hypothese.texte; d.hypothese=null; }
  else if(Array.isArray(d[liste])){ texte=d[liste][i]; d[liste].splice(i,1); }
  if(texte) d.effaces.push(String(texte)); if(d.effaces.length>200) d.effaces=d.effaces.slice(-200);
  persist(); renderProfile(); toast('Effacé. MAYND ne le retiendra plus.');
}
function retientLigne(texte, liste, i, sous){
  return '<div class="ret-l"><span class="ret-tx">'+escapeHtml(texte)+(sous?'<span class="ret-sub">'+escapeHtml(sous)+'</span>':'')+'</span>'
    +'<button class="ret-x" aria-label="Effacer" onclick="dossierEffacer(\''+liste+'\','+i+')">Effacer</button></div>';
}
var PAS_STATUT={en_cours:'en cours', reporte:'repoussé', fait:'fait', abandonne:'laissé de côté'};
(function(){
  var base=renderProfile;
  if(typeof base!=='function') return;
  window.renderProfile=function(){
    var r=base.apply(this, arguments);
    try{
      var body=document.getElementById('profile-body'); if(!body) return r;
      var titles=body.querySelectorAll('.block-title'), ancre=null;
      for(var i=0;i<titles.length;i++){ if(titles[i].textContent.trim()===t('privacy')){ ancre=titles[i]; break; } }
      if(!ancre) return r;
      var d=dossier(), h='';
      if(d.situation) h+=retientLigne(d.situation,'situation',0);
      d.faits.forEach(function(f,i){ h+=retientLigne(f,'faits',i); });
      d.personnes.forEach(function(f,i){ h+=retientLigne(f,'personnes',i); });
      d.aide.forEach(function(f,i){ h+=retientLigne(f,'aide',i,'ce qui t’aide'); });
      d.marchePas.forEach(function(f,i){ h+=retientLigne(f,'marchePas',i,'ce qui ne marche pas pour toi'); });
      d.pas.forEach(function(p,i){ h+=retientLigne(p.texte,'pas',i,'pas '+(PAS_STATUT[p.statut]||p.statut)+(p.statut==='fait'?'':' · prévu '+quandLib(p))); });
      d.aVenir.forEach(function(e,i){ h+=retientLigne(e.quoi,'aVenir',i, e.date?dateLib(evenementTs(e)):''); });
      d.refusees.forEach(function(f,i){ h+=retientLigne(f,'refusees',i,'piste écartée'); });
      if(d.hypothese && d.hypothese.texte) h+=retientLigne(d.hypothese.texte,'hypothese',0,'hypothèse, à confirmer avec toi');
      var bloc='<div class="block-title">Ce que MAYND retient de toi</div><div class="block retient">'
        +'<div class="ret-note">Tes accompagnants et ton professionnel référent s’appuient sur ces lignes. Corrige ou efface tout ce qui n’est pas juste : une ligne effacée ne revient jamais.</div>'
        +(h || '<div class="ret-vide">Rien pour l’instant. Au fil de tes échanges, ce qui compte pour t’accompagner s’affichera ici.</div>')
        +'</div>';
      ancre.insertAdjacentHTML('beforebegin', bloc);
    }catch(e){}
    return r;
  };
})();

/* ─────────── jamais de série cassée ───────────
   Les « jours d'affilée » fabriquaient de la culpabilité le jour où la série s'arrêtait, alors que
   le socle dit qu'un revers n'est pas un échec. La pastille du Parcours compte désormais les jours
   du mois où la personne a pris soin d'elle. La série reste calculée en interne (signal
   « progression », jalon des sept jours). */
(function(){
  var base=markActivity;
  if(typeof base!=='function') return;
  window.markActivity=function(){
    try{
      var j=state.joursActifs=Array.isArray(state.joursActifs)?state.joursActifs:[];
      var k=todayKey(); if(j.indexOf(k)<0){ j.push(k); if(j.length>400) state.joursActifs=j.slice(-400); }
    }catch(e){}
    return base.apply(this, arguments);
  };
})();
function joursCeMois(){ var p=todayKey().slice(0,7); return (state.joursActifs||[]).filter(function(k){ return String(k).slice(0,7)===p; }).length; }
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var pill=document.querySelector('#obj-pad .streak-pill');
      if(pill){
        var n=joursCeMois(), svg=pill.querySelector('svg');
        pill.textContent=''; if(svg) pill.appendChild(svg);
        pill.appendChild(document.createTextNode(n+' jour'+(n>1?'s':'')+' ce mois-ci'));
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── dernière visite (consigne du tour) ─────────── */
(function(){
  var base=init;
  if(typeof base!=='function') return;
  window.init=function(){
    var r=base.apply(this, arguments);
    try{ state.derniereVisitePrecedente=state.derniereVisite||0; state.derniereVisite=Date.now(); state.lancements=(state.lancements||0)+1; persist(); }catch(e){}
    return r;
  };
})();
