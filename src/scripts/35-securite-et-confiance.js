/* ══════════════════════════════════════════════════════════════════════════
   SÉCURITÉ ET CONFIANCE — 05/10/2026 (dossier « Expérience et intelligence »)

   Décisions du porteur du projet, 05/10 :
   - le gratuit n'a pas d'humain derrière : quand un message laisse voir un
     risque, un message de prévention, jamais d'écran d'abonnement, jamais
     d'alerte à un professionnel ;
   - l'écran de crise garde son vocabulaire médical (psychologues, séances) :
     il réoriente vers le soin, c'est voulu (exception écrite dans CLAUDE.md).

   1. Repérage du risque dans chaque message, en local, sans appel réseau. C'est
      un filet immédiat ; la lecture par le modèle (38-dossier-et-suivi.js) le
      complète quelques secondes plus tard.
   2. Carte de prévention dans la discussion (3114, SOS Amitié, 15).
   3. send() : le risque passe avant la limite du gratuit.
   4. Abonnés : alerte réelle au professionnel, sous la forme du signal
      « blocage » (intervention rapide), l'un des quatre du plan d'affaires.
      C'est seulement à ce moment que l'accompagnant peut dire qu'il est prévenu.
   5. Questionnaire de profil : la question d'exclusion disparaît (elle excluait
      jusqu'aux personnes qui préféraient ne pas répondre).
   6. Supervision : plus de « Signée » ni de « Relu et signé » sans signature.
      La vue professionnel (démonstration) permet de signer pour de vrai.
   7. Studio des accompagnants : sorti de l'usage courant, rangé dans la section
      Démonstration du profil. Le protocole de sécurité n'y est plus modifiable
      (37-consignes-v2.js).
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── 1. repérage du risque ─────────── */
function normRisque(s){
  return String(s||'').toLowerCase().replace(/[’‘`]/g,"'")
    .normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ');
}
/* Niveau 3 : projet, moyen, moment choisi, geste en cours. */
var RISQUE_3=[
  /\bje vais (me tuer|me suicider|en finir|me jeter|sauter|passer a l'acte)\b/,
  /\b(me tuer|me suicider|en finir|passer a l'acte|me jeter)\b.{0,40}\b(ce soir|cette nuit|aujourd'hui|maintenant|tout de suite|demain)\b/,
  /\b(ce soir|cette nuit|aujourd'hui|maintenant|demain)\b.{0,40}\b(me tuer|me suicider|en finir|passer a l'acte)\b/,
  /\bj'ai (prevu|prepare|achete|garde|stocke|mis de cote)\b.{0,40}\b(medicaments|cachets|pilules|comprimes|corde|arme|lame)\b/,
  /\bj'ai (pris|avale)\b.{0,30}\b(tous? mes|toute? la|une boite|des boites|trop de)\b.{0,20}\b(medicaments|cachets|pilules|comprimes)\b/,
  /\b(lettre d'adieu|mes adieux|je vous dis adieu)\b/
];
/* Niveau 2 : idée de mort ou de se faire du mal, même vague. */
var RISQUE_2=[
  /\bsuicid/,
  /\b(me tuer|me foutre en l'air|me supprimer|en finir avec (la vie|tout|moi))\b/,
  /\bmettre fin a (mes jours|ma vie)\b/,
  /\b(envie|besoin) de mourir\b/, /\b(veux|voudrais|aimerais|prefererais) mourir\b/,
  /\bplus (envie|la force) de vivre\b/, /\bpas envie de vivre\b/,
  /\b(si je n'etais plus la|si je n'existais plus|plus etre la|disparaitre pour (toujours|de bon))\b/,
  /\bne (plus|jamais) me reveiller\b/,
  /\bme faire du mal\b/, /\bme (scarifier|mutiler|couper les veines)\b/, /\bje me (scarifie|mutile)\b/
];
function risqueLocal(texte){
  var t=normRisque(texte); if(!t) return 0;
  if(RISQUE_3.some(function(re){ return re.test(t); })) return 3;
  if(RISQUE_2.some(function(re){ return re.test(t); })) return 2;
  return 0;
}

/* ─────────── 2 et 4. protocole : carte de prévention, alerte pour les abonnés ─────────── */
var RISQUE_FENETRE_MS=30*60000;   /* le protocole reste actif 30 minutes dans le fil */
function risqueActif(th){
  th = th || activeThread();
  var r=state.risque;
  if(!r || !th || r.threadId!==th.id) return null;
  return (Date.now()-r.at)<RISQUE_FENETRE_MS ? r : null;
}
function declencherProtocole(niveau, citation, source, th){
  th = th || activeThread(); if(!th || !niveau) return;
  var now=Date.now(), deja=risqueActif(th);
  var alerte=null;
  if(state.tier!=='free'){
    /* Abonné : une alerte part vers son professionnel référent, une seule par fenêtre de 30 minutes. */
    if(!(deja && deja.alerteAt)){
      state.alertes=Array.isArray(state.alertes)?state.alertes:[];
      state.alertes.push({at:now, niveau:niveau, citation:String(citation||'').slice(0,220), threadId:th.id, source:source||'local'});
      if(state.alertes.length>50) state.alertes=state.alertes.slice(-50);
      alerte=now;
    } else { alerte=deja.alerteAt; }
  }
  state.risque={niveau:Math.max(niveau, deja?deja.niveau:0), at:now, threadId:th.id, alerteAt:alerte};
  /* Une seule carte par fenêtre : la répéter à chaque message alourdirait sans rien apporter. */
  var carteRecente=(th.msgs||[]).some(function(m){ return m.prevention && (now-(m.at||0))<RISQUE_FENETRE_MS; });
  if(!carteRecente){
    var msg={prevention:true, at:now, abonne:state.tier!=='free'};
    th.msgs.push(msg); th.updated=now;
    if(th===activeThread() && typeof activeScreen==='function' && activeScreen()==='tab-chat'){
      var box=$('messages'); if(box){ box.appendChild(preventionEl(msg)); scrollChat(); }
    }
  }
  persist();
}
function telLien(num, nom, sous){
  return '<a class="prev-num" href="tel:'+num.replace(/\s/g,'')+'"><span class="prev-nm">'+nom+'</span><span class="prev-sub">'+sous+'</span></a>';
}
function preventionEl(m){
  var d=document.createElement('div');
  d.className='prev-card';
  d.innerHTML='<div class="prev-t">Tu n’as pas à porter ça sans aide.</div>'
    +'<div class="prev-x">Si tu penses à te faire du mal, ou si tu es en danger, appelle maintenant. Quelqu’un répond, jour et nuit.</div>'
    +telLien('3114','3114','Prévention du suicide · gratuit, 24 h/24')
    +telLien('09 72 39 40 50','SOS Amitié · 09 72 39 40 50','Écoute, 24 h/24, 7 j/7')
    +telLien('15','15 · SAMU','Si le danger est immédiat')
    +(m && m.abonne ? '<div class="prev-pro">Ton professionnel référent a été prévenu. Il te lira sans rendez-vous. Pour tout de suite, ces numéros répondent.</div>' : '');
  return d;
}

/* ─────────── 3. send() : le risque passe avant la limite du gratuit ─────────── */
async function send(){
  var inp=$('chat-input'); var text=(inp.value||'').trim(); if(!text) return;
  var risque=risqueLocal(text);
  if(state.tier==='free' && !risque){ ensureFreeDay(); if(state.freeCount>=5){ openUpsell('limit'); return; } }
  inp.value=''; autoGrow(inp); toggleSend();
  addBubble('user',text); markActivity('chat');
  if(risque) declencherProtocole(risque, text, 'local');
  /* Gratuit au-delà des 5 messages : la carte de prévention suffit, décision du 05/10. */
  if(state.tier==='free' && risque){ ensureFreeDay(); if(state.freeCount>=5) return null; }
  /* 29/09/2026 : le quota gratuit n'est décompté qu'à l'arrivée d'une vraie réponse (assistantReply). */
  return assistantReply();
}

/* Signal « blocage » pour le professionnel : chaque alerte des 30 derniers jours. */
(function(){
  var base=proSignals;
  if(typeof base!=='function') return;
  window.proSignals=function(){
    var s=base.apply(this, arguments)||[];
    try{
      var lim=Date.now()-30*86400000;
      (state.alertes||[]).filter(function(a){ return a.at>=lim; }).slice(-3).forEach(function(a){
        var d=new Date(a.at);
        s.push({k:'blocage', d:'Alerte de sécurité le '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' à '+d.getHours()+' h '+String(d.getMinutes()).padStart(2,'0')+' : « '+a.citation+' »', w:'Intervention rapide, hors cycle mensuel'});
      });
    }catch(e){}
    return s;
  };
})();

/* ─────────── 5. questionnaire de profil : plus de question d'exclusion ─────────── */
(function(){ try{ if(QUIZ.length && QUIZ[0].type==='exclude') QUIZ.shift(); }catch(e){} })();

/* ─────────── 6. supervision : aucune signature affichée sans signature réelle ─────────── */
function feuilleSignee(){
  var s=state.roadmapSigned;
  return !!(s && s.at && sameMonth(s.at, Date.now()));
}
function dateCourte(ts){ var d=new Date(ts); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); }
function proSignatureHTML(){
  if(feuilleSignee()) return '<div class="pro-sign">'+proCheckSVG()+'<span>Signée le '+dateCourte(state.roadmapSigned.at)+' par <span class="pro-sig-nm">'+escapeHtml(state.roadmapSigned.by||proName())+'</span></span></div>';
  return '<div class="pro-sign pending"><span>Préparée à partir de ton parcours. En attente de la signature de '+(state.pro && state.pro.name ? escapeHtml(state.pro.name) : 'ton professionnel référent')+'.</span></div>';
}
function renderProBlock(){
  var h='<div class="section-head"><h2>Ta supervision</h2></div>';
  if(state.tier==='free'){
    return h+'<div class="pro-card pro-lock">'
      +'<span class="pro-ava big">'+proBadgeSVG()+'</span>'
      +'<div class="pro-lock-t">Professionnel référent certifié</div>'
      +'<div class="pro-lock-s">Inclus dès l’abonnement</div>'
      +'<div class="pro-note">Il suit ton parcours, signe ta feuille de route chaque mois et ton bilan. Il intervient sur signal. Sans rendez-vous.</div>'
      +'<button class="btn full" onclick="openUpsell(\'agent\')">Découvrir ma supervision</button></div>';
  }
  var ready=proReady();
  var axes=proAxes();
  var signee=ready && feuilleSignee();
  h+='<div class="pro-card"><div class="pro-head"><span class="pro-ava">'+proBadgeSVG()+'</span>'
    +'<span class="pro-id"><span class="pro-nm">'+escapeHtml(proName())+'</span><span class="pro-rl">Professionnel référent certifié</span></span>'
    +'<span class="pro-st '+(signee?'signed':'prep')+'">'+(signee?'Signée':(ready?'À signer':'En préparation'))+'</span></div>';
  h+='<div class="pro-note">Il suit ton parcours et intervient sur signal. Sans rendez-vous.</div>';
  if(!ready){
    h+='<div class="pro-blk"><div class="pro-lbl">Feuille de route · '+proMonth(0)+'</div>'
      +'<div class="pro-tx">Ta première feuille de route se prépare. Fais le questionnaire pour qu’elle parte à la signature.</div></div>'
      +'<button class="btn full light" onclick="startQuiz()">Faire mon questionnaire</button></div>';
    return h;
  }
  h+='<div class="pro-blk"><div class="pro-lbl">Feuille de route · '+proMonth(0)+'</div>';
  h+=axes.map(function(a){ var ag=byId(a.id)||byId('mia');
    return '<div class="pro-axe"><span class="pro-dot" style="background:'+ag.color+'">'+(ag.id==='mia'?'M':ag.name[0])+'</span><span class="pro-tx">'+escapeHtml(a.tx)+'</span></div>'; }).join('');
  h+=proSignatureHTML()+'</div>';
  h+='<button class="btn full light" onclick="openPro()">Ouvrir mon espace de suivi</button></div>';
  return h;
}
/* Déclaration de base de l'espace de suivi : les enveloppes de 16 (approfondissement, clôtures,
   bilans signés) s'y ajoutent comme avant. Le bilan du mois précédent n'est plus présenté comme
   « relu et signé » tant qu'aucun bilan n'a été signé dans la vue professionnel. */
function renderProSheet(){
  var axes=proAxes(), sigs=proSignals();
  var h='<div class="pro-card"><div class="pro-head"><span class="pro-ava">'+proBadgeSVG()+'</span>'
    +'<span class="pro-id"><span class="pro-nm">'+escapeHtml(proName())+'</span><span class="pro-rl">Professionnel référent certifié</span></span></div>'
    +'<div class="pro-note">Il lit ton parcours, ajuste ta feuille de route et te répond quand c’est utile. Tu n’as jamais de rendez-vous à prendre.</div></div>';
  h+='<div class="block-title">Feuille de route · '+proMonth(0)+'</div><div class="pro-blk">';
  h+=axes.map(function(a){ var ag=byId(a.id)||byId('mia');
    return '<div class="pro-axe"><span class="pro-dot" style="background:'+ag.color+'">'+(ag.id==='mia'?'M':ag.name[0])+'</span><span class="pro-tx">'+escapeHtml(a.tx)+'</span></div>'; }).join('');
  h+=proSignatureHTML()+'</div>';
  h+='<div class="block-title">Bilan · '+proMonth(-1)+'</div>';
  var signes=(state.bilanHistory||[]).length;
  h+='<div class="pro-blk"><div class="pro-tx">'
    +(signes ? 'Ton dernier bilan signé est juste en dessous.' : 'Ton bilan se prépare à partir de ton parcours. Il apparaîtra ici une fois relu et signé par '+(state.pro && state.pro.name ? escapeHtml(state.pro.name) : 'ton professionnel référent')+'.')
    +'</div></div>';
  h+='<div class="block-title">Signaux</div>';
  if(!sigs.length){ h+='<div class="pro-empty">Aucun signal pour l’instant. Ton professionnel référent intervient en cas de stagnation, de blocage, de désalignement, ou pour consolider une progression.</div>'; }
  else { h+=sigs.map(function(s){ var d=PRO_SIGNALS[s.k];
    return '<div class="pro-sg"><span class="pro-sg-i" style="background:'+d.c+'"></span><span><span class="pro-sg-t">'+d.n+'</span><span class="pro-sg-d">'+escapeHtml(s.d)+'</span><span class="pro-sg-w">'+escapeHtml(s.w)+'</span></span></div>'; }).join(''); }
  $('pro-sheet-body').innerHTML=h;
}
/* Vue professionnel (démonstration) : signer la feuille de route du mois. */
function signRoadmap(){
  state.roadmapSigned={at:Date.now(), by:proName()};
  persist();
  toast('Feuille de route signée.');
  try{ renderProDashboard(); }catch(e){}
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
(function(){
  var base=renderProDashboard;
  if(typeof base!=='function') return;
  window.renderProDashboard=function(){
    var r=base.apply(this, arguments);
    try{
      var body=document.getElementById('pd-body'); if(!body) return r;
      var card=body.querySelector('.pro-card');
      var h='<div class="pro-blk pd-roadmap">'+(feuilleSignee()
        ? '<div class="pro-tx">Feuille de route de '+proMonth(0)+' signée le '+dateCourte(state.roadmapSigned.at)+'.</div>'
        : '<button class="btn full" onclick="signRoadmap()">Signer la feuille de route de '+proMonth(0)+'</button>')+'</div>';
      if(card) card.insertAdjacentHTML('beforeend', h);
    }catch(e){}
    return r;
  };
})();

/* ─────────── 7. Studio : rangé dans la section Démonstration ─────────── */
(function(){
  var base=renderProfile;
  if(typeof base!=='function') return;
  window.renderProfile=function(){
    var r=base.apply(this, arguments);
    try{
      var body=document.getElementById('profile-body'); if(!body) return r;
      var titles=body.querySelectorAll('.block-title'), atelier=null, demo=null;
      for(var i=0;i<titles.length;i++){
        var tx=titles[i].textContent.trim();
        if(tx===t('atelier')) atelier=titles[i];
        if(tx==='Démonstration') demo=titles[i];
      }
      if(atelier){
        var blk=atelier.nextElementSibling;
        if(blk && blk.classList.contains('block')) blk.parentNode.removeChild(blk);
        atelier.parentNode.removeChild(atelier);
      }
      if(demo){
        var demoBlk=demo.nextElementSibling;
        if(demoBlk && !demoBlk.querySelector('.studio-row'))
          demoBlk.insertAdjacentHTML('beforeend','<button class="row-btn studio-row" onclick="openStudio()"><div class="rt"><div class="rl">Studio des accompagnants</div><div class="rd">Modifier les consignes des accompagnants. Le protocole de sécurité n’y est pas modifiable.</div></div><span class="chev">'+chev()+'</span></button>');
      }
    }catch(e){}
    return r;
  };
})();
