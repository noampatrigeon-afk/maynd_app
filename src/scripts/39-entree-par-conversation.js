/* ══════════════════════════════════════════════════════════════════════════
   ENTRÉE PAR LA CONVERSATION — 05/10/2026
   Décision du porteur du projet, 05/10 : le cap naît de la première discussion
   avec MIA (il remplace le questionnaire de cap obligatoire de la
   spécification du 10/08, qui reste accessible depuis le Parcours).

   1. Accueil : « Commencer » ouvre directement la discussion avec MIA, sans
      formulaire ni écran d'humeur. MIA demande ce qui amène la personne, avec
      quatre portes d'entrée en boutons (38-dossier-et-suivi.js).
   2. Le cap : après deux échanges, MIA propose un cap en une phrase, avec les
      mots de la personne ([[CAP:…]]). Une carte : « C'est ça » le pose,
      « Pas tout à fait » relance l'échange.
   3. Le compte : au troisième échange, « Je garde le fil pour toi ? ». Version
      courte : courriel, mot de passe, puis prénom, année et genre. La
      vérification et l'accès rapide viennent plus tard.
   4. L'accès rapide (Face ID, empreinte ou code) est proposé sur l'accueil à
      partir du deuxième lancement, une fois le compte créé.
   5. Le rappel « Qui es-tu ? » ne s'impose plus à qui est entré par la
      conversation : le profil se dessine dans les échanges, le questionnaire
      reste dans le Parcours.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── 1. « Commencer » ─────────── */
function obCommencer(){
  state.entreeConversation=true;
  state.moodSeen=todayKey();       /* pas d'écran d'humeur avant le tout premier échange */
  enterApp(false);
  openMia();
}
(function(){
  var base=checkQuizReminder;
  if(typeof base!=='function') return;
  window.checkQuizReminder=function(){ if(state.entreeConversation) return; return base.apply(this, arguments); };
})();

/* ─────────── 2. le cap, proposé par MIA ─────────── */
function capCarteEl(m, i){
  if(m.capFait==='non') return null;
  var d=document.createElement('div'); d.className='chat-carte cap';
  if(m.capFait==='oui'){
    d.innerHTML='<div class="cc-t">Ton cap est posé</div><div class="cc-cap">« '+escapeHtml(m.capProp)+' »</div>';
    return d;
  }
  d.innerHTML='<div class="cc-t">Ton cap, tel que je le comprends</div><div class="cc-cap">« '+escapeHtml(m.capProp)+' »</div>'
    +'<div class="cc-btns"><button class="cc-b" onclick="capOui('+i+')">C’est ça</button><button class="cc-b ghost" onclick="capNon('+i+')">Pas tout à fait</button></div>';
  return d;
}
function capOui(i){
  var th=activeThread(), m=th && th.msgs[i]; if(!m || !m.capProp) return;
  state.cap=m.capProp; state.capMeta=false; state.capSource='conversation';
  m.capFait='oui'; persist();
  renderMessages();
  try{ renderHomeGoals(); }catch(e){}
  try{ sfx('success'); }catch(e){}
  toast('Ton cap est posé.');
}
function capNon(i){
  var th=activeThread(), m=th && th.msgs[i]; if(!m || !m.capProp) return;
  m.capFait='non'; persist();
  renderMessages();
  addBubble('user','Pas tout à fait.');
  return assistantReply({extraSystem:'Elle ne se reconnaît pas tout à fait dans le cap proposé (« '+m.capProp+' »). Demande-lui, en une seule question, ce qui ne lui ressemble pas. Ne repropose pas de cap dans cette réponse.'});
}

/* ─────────── 3. « Je garde le fil pour toi ? » ─────────── */
function gardeFilEl(m, i){
  var d=document.createElement('div'); d.className='chat-carte garde';
  d.innerHTML='<div class="cc-t">Je garde le fil pour toi ?</div>'
    +'<div class="cc-x">Ton prénom et ton courriel suffisent, pour ne rien perdre de ce qu’on se dit.</div>'
    +'<div class="cc-btns"><button class="cc-b" onclick="gardeFilCreer('+i+')">Créer mon compte</button><button class="cc-b ghost" onclick="gardeFilPlusTard('+i+')">Plus tard</button></div>';
  return d;
}
function gardeFilApresReponse(th){
  if((state.account && state.account.email) || state.gardeFilPropose) return;
  var n=(th.msgs||[]).filter(function(m){ return m.role==='user'; }).length;
  if(n<3) return;
  state.gardeFilPropose=true;
  var m={gardeFil:true}; pushMsg(m);
  var dernier=((th.msgs||[]).filter(function(x){ return x.role==='assistant'; }).pop()||{}).content||'';
  apresAffichage(dernier, function(){
    if(activeThread()!==th) return;
    var el=gardeFilEl(m, th.msgs.indexOf(m)); $('messages').appendChild(el); rafraichirOutils(); scrollChat();
  });
}
function gardeFilFermer(i){ var th=activeThread(), m=th && th.msgs[i]; if(m){ m.ferme=true; persist(); } }
function gardeFilPlusTard(i){ gardeFilFermer(i); renderMessages(); }
var _obCompact=false;
function gardeFilCreer(i){
  gardeFilFermer(i);
  _obCompact=true;
  $('onboarding').classList.remove('done'); $('onboarding').classList.add('reopened');
  obShow('ob-signup');
}
/* Version courte : après le courriel, directement le prénom (vérification et accès rapide plus tard). */
(function(){
  var base=obSignupNext;
  if(typeof base!=='function') return;
  window.obSignupNext=function(){
    var r=base.apply(this, arguments);
    try{ if(_obCompact && $('ob-verify-choice').classList.contains('on')) obShow('ob-firstname'); }catch(e){}
    return r;
  };
})();
(function(){
  var base=obSaveFirstname;
  if(typeof base!=='function') return;
  window.obSaveFirstname=function(){
    var r=base.apply(this, arguments);
    try{
      if(_obCompact && state.name){
        _obCompact=false;
        $('onboarding').classList.add('done'); $('onboarding').classList.remove('reopened');
        renderGreeting();
        if(activeScreen()==='tab-chat') renderMessages(); else showTab('chat');
        toast('Ton compte est prêt.');
      }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=closeInscription;
  if(typeof base!=='function') return;
  window.closeInscription=function(){ _obCompact=false; _obAcces=false; return base.apply(this, arguments); };
})();

/* ─────────── 4. l'accès rapide, au deuxième lancement ─────────── */
var _obAcces=false;
function accesCarteHTML(){
  if(!(state.account && state.account.email) || state.accesSecurise || state.accesPlusTard || (state.lancements||0)<2) return '';
  return '<div class="pas-card acces" style="--pc:#224CF2">'
    +'<div class="pas-lbl">Ton accès</div>'
    +'<div class="pas-txt">Sécurise ton accès</div>'
    +'<div class="pas-meta">Face ID, empreinte ou code, pour que tes échanges restent à toi.</div>'
    +'<div class="pas-btns"><button class="pas-b main" onclick="accesSecuriser()">Choisir</button><button class="pas-b" onclick="accesPlusTard()">Plus tard</button></div></div>';
}
function accesSecuriser(){
  _obAcces=true;
  $('onboarding').classList.remove('done'); $('onboarding').classList.add('reopened');
  obShow('ob-access');
}
function accesPlusTard(){ state.accesPlusTard=true; persist(); try{ renderHomeGoals(); }catch(e){} }
(function(){
  var base=obShow;
  if(typeof base!=='function') return;
  window.obShow=function(id){
    if(_obAcces && id==='ob-firstname'){
      _obAcces=false; state.accesSecurise=true; persist();
      $('onboarding').classList.add('done'); $('onboarding').classList.remove('reopened');
      try{ renderHomeGoals(); }catch(e){}
      toast('Ton accès est sécurisé.');
      return;
    }
    return base.apply(this, arguments);
  };
})();
(function(){
  var base=renderHomeGoals;
  if(typeof base!=='function') return;
  window.renderHomeGoals=function(){
    var r=base.apply(this, arguments);
    try{
      var h=accesCarteHTML(); if(!h) return r;
      var box=$('home-goals'); if(!box) return r;
      var pas=box.querySelector('.pas-card');
      if(pas) pas.insertAdjacentHTML('afterend', h); else box.insertAdjacentHTML('afterbegin', h);
    }catch(e){}
    return r;
  };
})();
