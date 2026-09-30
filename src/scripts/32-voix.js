/* ══════════════════════════════════════════════════════════════════════════
   VOIX DES ACCOMPAGNANTS — EMPLACEMENTS (demande du 30/09/2026)

   Principe produit : réveiller un accompagnant (par son jeu, ou en lui parlant)
   réveille aussi SA voix. Chaque accompagnant aura sa propre voix (ElevenLabs ou
   autre, choix en cours côté porteur du projet). La voix est la récompense des
   jeux, et mène à la conversation orale.

   Ce fichier ne pose que les emplacements, prêts à brancher :
   - AGENT_VOICES : une case par accompagnant pour l'identifiant de sa voix ;
   - VOICE_ENDPOINT : l'adresse du serveur intermédiaire qui appellera le
     fournisseur. La clé du fournisseur ne doit JAMAIS vivre dans le navigateur
     (même règle que la clé du modèle, CLAUDE.md section 5) ;
   - speakAgent(id, texte) : lit un texte avec la voix de l'accompagnant. Tant que
     rien n'est branché, affiche « La voix de X arrive bientôt. » ;
   - voiceStartCall / voiceEndCall : l'écran de conversation orale (#voice-call),
     aujourd'hui une coquille.

   Où apparaît la voix :
   1. Fiche de présentation : « Écouter sa voix » et « L'appeler » quand
      l'accompagnant est réveillé ; « Sa voix dort encore » sinon.
   2. Fin d'un jeu qui réveille l'accompagnant : cette ligne devient la
      récompense (« Tu as réveillé la voix de Miro »).
   3. Fiche d'un accompagnant endormi : « En le réveillant, tu découvres sa voix. »
   4. Jeu : bouton haut-parleur pour écouter la question, si la voix est réveillée.
   5. Discussion : bouton d'appel dans l'en-tête, bouton d'écoute sur chaque
      réponse (discussion à un seul accompagnant).

   Règles : la voix fait partie de MAYND (formule payante, CLAUDE.md section 1),
   jamais en gratuit. MIA est toujours réveillée, sa voix aussi. Vocabulaire : la
   voix se réveille ou se découvre, elle ne se « débloque » jamais.
   ══════════════════════════════════════════════════════════════════════════ */

/* À remplir quand le fournisseur est choisi. voiceId : identifiant de la voix chez le
   fournisseur (ElevenLabs : « voice_id »). */
var VOICE_ENDPOINT=null;
var AGENT_VOICES={};
ALL.forEach(function(a){ AGENT_VOICES[a.id]={voiceId:null}; });

function voiceAwake(id){ return !!(state.tier && state.tier!=='free' && byId(id) && agentAwake(id)); }
function voiceConfigured(id){ return !!(VOICE_ENDPOINT && AGENT_VOICES[id] && AGENT_VOICES[id].voiceId); }
function voiceFem(id){ return typeof AGENT_FEM!=='undefined' && AGENT_FEM.indexOf(id)>=0; }
/* Première phrase de présentation : l'échantillon « Écouter sa voix ». */
function voiceSample(id){
  var s=(typeof INTROS!=='undefined' && INTROS[id]) ? INTROS[id] : '';
  var m=s.match(/^.*?[.!?](\s|$)/);
  return (m?m[0]:s).trim();
}

var _voiceAudio=null;
function voiceStop(){ try{ if(_voiceAudio){ _voiceAudio.pause(); _voiceAudio=null; } }catch(e){} }
/* Point de branchement unique : POST {voiceId, text} vers VOICE_ENDPOINT, qui renvoie l'audio. */
function speakAgent(id, text){
  var a=byId(id); if(!a) return Promise.resolve(false);
  if(!voiceConfigured(id)){ toast('La voix de '+a.name+' arrive bientôt.'); return Promise.resolve(false); }
  voiceStop();
  return fetch(VOICE_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({agent:id, voiceId:AGENT_VOICES[id].voiceId, text:String(text||'')})})
    .then(function(r){ if(!r.ok) throw new Error('voix '+r.status); return r.blob(); })
    .then(function(b){ _voiceAudio=new Audio(URL.createObjectURL(b)); return _voiceAudio.play().then(function(){ return true; }); })
    .catch(function(){ toast('La voix de '+a.name+' ne répond pas pour l’instant.'); return false; });
}

/* ─────────── icônes ─────────── */
function voiceIconSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'; }
function voiceCallSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'; }
function voiceSleepSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'; }

/* ─────────── 1 et 2. fiche de présentation ─────────── */
function deckVoiceHTML(id, reward){
  var a=byId(id); if(!a || state.tier==='free') return '';
  if(!voiceAwake(id)){
    return '<div class="deck-voice sleeping">'+voiceSleepSVG()+'<span>Sa voix dort encore</span></div>';
  }
  return '<div class="deck-voice'+(reward?' reward':'')+'">'
    +(reward?'<div class="deck-voice-t">Tu as réveillé la voix de '+escapeHtml(a.name)+'</div>':'')
    +'<div class="deck-voice-row">'
    +'<button class="deck-voice-btn" onclick="speakAgent(\''+id+'\', voiceSample(\''+id+'\'))">'+voiceIconSVG()+'<span>Écouter sa voix</span></button>'
    +'<button class="deck-voice-btn" onclick="voiceStartCall(\''+id+'\')">'+voiceCallSVG()+'<span>L’appeler</span></button>'
    +'</div></div>';
}
function deckVoicePlace(page, id, reward){
  var old=page.querySelector('.deck-voice'); if(old) old.parentNode.removeChild(old);
  var h=deckVoiceHTML(id, reward); if(!h) return;
  var cta=page.querySelector('.deck-cta'); if(cta) cta.insertAdjacentHTML('beforebegin', h);
}
(function(){
  var base=openAgentDeck;
  if(typeof base!=='function') return;
  window.openAgentDeck=function(){
    var r=base.apply(this, arguments);
    try{
      var pages=document.querySelectorAll('#deck-track .deck-page');
      for(var i=0;i<pages.length;i++) deckVoicePlace(pages[i], pages[i].getAttribute('data-id'), false);
      if(typeof deckFit==='function') deckFit();
    }catch(e){}
    return r;
  };
})();
/* Appelée par la fin d'un jeu (22-retours-du-29-09.js, 24-jeux-lot-2.js) quand le jeu vient de
   réveiller l'accompagnant : la ligne voix de sa fiche devient la récompense. */
function voiceRewardOnDeck(id){
  if(!voiceAwake(id)) return;
  var page=document.querySelector('#deck-track .deck-page[data-id="'+id+'"]'); if(!page) return;
  deckVoicePlace(page, id, true);
  try{ if(typeof deckFitPage==='function') deckFitPage(page); }catch(e){}
}

/* ─────────── 3. fiche d'un accompagnant endormi ─────────── */
(function(){
  var base=renderSleepFiche;
  if(typeof base!=='function') return;
  window.renderSleepFiche=function(id){
    var r=base.apply(this, arguments);
    try{
      if(state.tier!=='free'){
        var badge=document.querySelector('#sleep-body .sleep-badge');
        if(badge) badge.insertAdjacentHTML('afterend','<p class="sleep-voice">'+voiceIconSVG()+'<span>En '+(voiceFem(id)?'la':'le')+' réveillant, tu découvres sa voix.</span></p>');
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── 4. jeu : écouter la question ─────────── */
(function(){
  var base=gameRenderQuestion;
  if(typeof base!=='function') return;
  window.gameRenderQuestion=function(step){
    var r=base.apply(this, arguments);
    try{
      var g=_game && GAMES[_game.theme];
      if(g && voiceAwake(g.agent)){
        var tag=document.querySelector('#game-inner .game-top .game-tag');
        if(tag) tag.insertAdjacentHTML('afterend','<button class="game-voice" onclick="gameSpeakQuestion()" aria-label="Écouter la question">'+voiceIconSVG()+'</button>');
      }
    }catch(e){}
    return r;
  };
})();
function gameSpeakQuestion(){
  var q=document.querySelector('#game-inner .game-q'), g=_game && GAMES[_game.theme];
  if(q && g) speakAgent(g.agent, q.textContent);
}

/* ─────────── 5. discussion ─────────── */
function chatVoiceAgent(){
  try{ var p=threadParts(); return (p.length===1 && voiceAwake(p[0])) ? p[0] : null; }catch(e){ return null; }
}
function chatVoiceSync(){
  var top=document.querySelector('#tab-chat .chat-top'); if(!top) return;
  var btn=$('chat-voice');
  if(!btn){
    var parts=$('chat-parts'); if(!parts) return;
    parts.insertAdjacentHTML('beforebegin','<button class="iconbtn chat-voice" id="chat-voice" aria-label="Conversation orale" onclick="voiceCallCurrent()">'+voiceCallSVG()+'</button>');
    btn=$('chat-voice');
  }
  btn.style.display=chatVoiceAgent()?'':'none';
}
function voiceCallCurrent(){ var id=chatVoiceAgent(); if(id) voiceStartCall(id); }
(function(){
  var base=renderChatHeader;
  if(typeof base!=='function') return;
  window.renderChatHeader=function(){ var r=base.apply(this, arguments); try{ chatVoiceSync(); }catch(e){} return r; };
})();
(function(){
  var base=bubbleEl;
  if(typeof base!=='function') return;
  window.bubbleEl=function(role, content){
    var el=base.apply(this, arguments);
    try{
      var id=role==='assistant' ? chatVoiceAgent() : null;
      if(id && content){
        var b=document.createElement('button');
        b.className='bubble-voice'; b.setAttribute('aria-label','Écouter'); b.innerHTML=voiceIconSVG();
        b.onclick=function(ev){ ev.stopPropagation(); speakAgent(id, content); };
        el.appendChild(b); el.classList.add('has-voice');
      }
    }catch(e){}
    return el;
  };
})();

/* ─────────── écran de conversation orale (coquille) ─────────── */
function voiceEnsureScreen(){
  if($('voice-call')) return;
  var host=$('deck') ? $('deck').parentNode : document.body;
  var d=document.createElement('div'); d.id='voice-call'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Conversation orale');
  host.appendChild(d);
}
function voiceStartCall(id){
  var a=byId(id); if(!a) return;
  if(!voiceAwake(id)){ toast('Réveille d’abord '+a.name+' pour entendre sa voix.'); return; }
  voiceEnsureScreen();
  var light=typeof LIGHT_AGENTS!=='undefined' && LIGHT_AGENTS.indexOf(id)>=0;
  var v=$('voice-call');
  v.className=light?'light':'';
  v.style.background=a.color;
  v.innerHTML='<div class="vc-inner">'
    +'<div class="vc-state">Conversation orale</div>'
    +'<div class="vc-ava-box"><span class="vc-ring r1"></span><span class="vc-ring r2"></span>'
    +'<span class="vc-ava">'+(id==='mia'?brainSVG():escapeHtml(a.name[0]))+'</span></div>'
    +'<div class="vc-name">'+escapeHtml(a.name)+'</div>'
    +'<p class="vc-note">'+(voiceConfigured(id)
        ? 'Parle, '+escapeHtml(a.name)+' t’écoute.'
        : 'La voix de '+escapeHtml(a.name)+' arrive bientôt. Tu pourras lui parler à voix haute, comme au téléphone.')+'</p>'
    +'<button class="vc-end" onclick="voiceEndCall()">'+voiceCallSVG()+'<span>Raccrocher</span></button>'
    +'</div>';
  requestAnimationFrame(function(){ v.classList.add('show'); });
}
function voiceEndCall(){ voiceStop(); var v=$('voice-call'); if(v) v.classList.remove('show'); }
