/* ══════════════════════════════════════════════════════════════════════════
   RETOURS DU 29/09/2026 — corrections demandées après test de la version en
   ligne. Tout est redéfini ou enveloppé ici, en fin de chaîne :

   1. Tiroir du chat : les discussions passées descendent tout en bas, sous
      « Discussions précédentes », une ligne par discussion (prénoms + « il y a
      tant de jours »), plus d'aperçu du dernier message qui débordait.
   2. Onglet Parcours : la section « Jeux » (carte « Tes nuits ») disparaît du
      haut de l'onglet. À la place, un bloc « Ton entourage » entre le parcours
      (cap, profil, objectif de la semaine) et « Ta supervision », avec un
      bouton « Découvrir mon entourage » qui ouvre le récapitulatif.
   3. Récapitulatif : le jeu s'ouvrait SOUS le récapitulatif (#game en z-index
      87, #recap en 90) — il était donc invisible. #game passe à 91 (CSS). Un
      accompagnant éveillé touché dans le récapitulatif ouvre sa fiche de
      présentation (avant : rien de visible, la sélection se faisait sur la
      carte interactive, cachée).
   4. Fin d'un jeu : plus d'écran de sortie intermédiaire. L'accompagnant du
      jeu se réveille (le jeu est sa rencontre), et la fiche de présentation
      s'ouvre sur l'accompagnant proposé par la table de sortie (ou celui du
      jeu, en branche courte). Le lien « Voir tes réponses du … » remonte sur
      l'écran de restitution.
   5. Réveiller un accompagnant (ou lancer n'importe quelle conversation)
      ferme le récapitulatif et la carte : on arrive directement dans le chat.
   6. Fiche de présentation : compteur « 3 / 17 » au lieu de dix-sept points,
      étoile retirée d'à côté de la croix, remplacée par un bouton « Ajouter
      en favori » sous « Parler à … », marge basse agrandie pour que ces
      boutons ne passent plus sous les flèches. Pour un accompagnant qui a un
      jeu, un bouton « Rejouer · Tes nuits » en dessous (demandé le même jour :
      une fois l'accompagnant réveillé, son jeu n'était plus accessible).
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── 1. tiroir du chat ─────────── */
function ilYa(ts){
  var jour=86400000;
  var d0=new Date(); d0.setHours(0,0,0,0);
  var d1=new Date(ts); d1.setHours(0,0,0,0);
  var n=Math.round((d0-d1)/jour);
  if(n<=0) return 'Aujourd’hui';
  if(n===1) return 'Hier';
  if(n<7) return 'Il y a '+n+' jours';
  if(n<30){ var s=Math.floor(n/7); return 'Il y a '+s+' semaine'+(s>1?'s':''); }
  if(n<365) return 'Il y a '+Math.floor(n/30)+' mois';
  var y=Math.floor(n/365); return 'Il y a '+y+' an'+(y>1?'s':'');
}
/* Une discussion « a eu lieu » dès que la personne y a écrit au moins une fois : un fil
   qui ne contient que la phrase d'accueil de l'accompagnant n'en est pas une. */
function threadHasTalk(th){ return (th.msgs||[]).some(function(m){ return m.role==='user'; }); }
function renderDrawer(){
  var body=$('drawer-body');
  var h='<button class="new-btn" onclick="newConversation()"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span><span class="nl">'+t('newConversation')+'</span></button>';
  h+=renderAgentList('browse');
  var ths=[].concat(state.threads).filter(threadHasTalk).sort(function(a,b){ return b.updated-a.updated; });
  if(ths.length){
    h+='<div class="agx-sec">Discussions précédentes</div>';
    ths.forEach(function(th){
      var title=th.parts.map(function(p){ var a=byId(p); return a ? (a.id==='mia'?'MIA':a.name) : ''; }).filter(Boolean).join(' & ');
      h+='<div class="conv-item conv-past'+(th.id===state.current?' on':'')+'" role="button" tabindex="0" onclick="openThread(\''+th.id+'\')">'+convAvaHTML(th)
        +'<span class="conv-txt"><span class="ct">'+escapeHtml(title)+'</span><span class="cp">'+ilYa(th.updated||th.created)+'</span></span>'
        +'<button class="conv-del" onclick="deleteThread(\''+th.id+'\',event)" aria-label="Supprimer la discussion"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button></div>';
    });
  }
  body.innerHTML=h;
}

/* ─────────── 2. onglet Parcours : « Ton entourage » remplace « Jeux » ─────────── */
/* La section jeux de 18-moteur-des-jeux.js n'est plus insérée en haut du pad : son
   enveloppe de renderObjectives appelle renderGamesSectionHTML() par son nom, cette
   redéfinition la rend vide. Les jeux restent accessibles depuis la fiche d'un
   accompagnant endormi (récapitulatif ou carte). */
function renderGamesSectionHTML(){ return ''; }
function entMiniMapSVG(){
  var pos=entAllPositions(48,48,22,40);
  var lines='', dots='';
  entOrderedIds().forEach(function(id){
    if(id==='mia') return;
    var p=pos[id], awake=agentAwake(id);
    if(awake) lines+='<line x1="48" y1="48" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>';
    dots+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+(awake?4.6:3.4)+'" fill="#fff" fill-opacity="'+(awake?1:.32)+'"/>';
  });
  return '<svg class="entp-map" viewBox="0 0 96 96" aria-hidden="true">'+lines+dots+'<circle cx="48" cy="48" r="8" fill="#fff"/></svg>';
}
function renderEntourageBlockHTML(){
  var n=entAwakeCount();
  return '<div class="section-head entp-head"><h2>Ton entourage</h2></div>'
    +'<div class="entp-card">'
    +'<div class="entp-top">'+entMiniMapSVG()
    +'<div class="entp-tx">'
    +'<div class="entp-t">'+n+' accompagnant'+(n>1?'s':'')+' réveillé'+(n>1?'s':'')+' sur 17</div>'
    +'<div class="entp-s">Chaque rencontre trace un nouveau lien.</div></div></div>'
    +'<button class="cap-edit entp-btn" onclick="openRecap()">Découvrir mon entourage</button>'
    +'</div>';
}
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var pad=$('obj-pad'); if(!pad) return r;
      var heads=pad.querySelectorAll('.section-head h2'), sup=null;
      for(var i=0;i<heads.length;i++){ if(heads[i].textContent.trim()==='Ta supervision'){ sup=heads[i].parentNode; break; } }
      if(sup) sup.insertAdjacentHTML('beforebegin', renderEntourageBlockHTML());
    }catch(e){}
    return r;
  };
})();

/* ─────────── 3. récapitulatif : un accompagnant éveillé ouvre sa fiche ─────────── */
function recapOpen(){ var el=$('recap'); return !!(el && el.classList.contains('show')); }
(function(){
  var base=entTap;
  if(typeof base!=='function') return;
  window.entTap=function(id){
    if(recapOpen() && agentAwake(id)){ openAgentDeck(id); return; }
    return base.apply(this, arguments);
  };
})();

/* Fiche d'un accompagnant endormi : quand il a un jeu, le jeu passe en premier (c'est la
   façon de le rencontrer) ; sinon, le réveil mène directement à la discussion. */
function renderSleepFiche(id){
  var a=byId(id); if(!a) return;
  var info=(typeof AGENT_INFO!=='undefined' && AGENT_INFO[id]) ? AGENT_INFO[id] : {tag:''};
  var key=gameForAgent(id);
  var qCount=key ? Object.keys(GAMES[key]).filter(function(k){ return /^q[1-9]$/.test(k); }).length : 0; /* sans la question préalable q0 */
  var actions = key
    ? '<button class="btn full sleep-play-main" onclick="sleepPlay(\''+id+'\')">Jouer avec '+escapeHtml(a.name)+'</button>'
      +'<div class="sleep-qcount">'+qCount+' question'+(qCount>1?'s':'')+'</div>'
      +'<button class="btn ghost full" onclick="sleepWake(\''+id+'\')">Lui parler directement</button>'
    : '<button class="btn full" onclick="sleepWake(\''+id+'\')">Le réveiller</button>';
  $('sleep-body').innerHTML='<div class="sleep-wrap">'
    +'<div class="sleep-circle-box"><span class="sleep-ripple r1"></span><span class="sleep-ripple r2"></span>'
    +'<span class="sleep-circle">'+entInitial(id)+'</span></div>'
    +'<div class="sleep-name">'+escapeHtml(a.name)+'</div>'
    +'<div class="sleep-domain">'+escapeHtml(a.domain||'')+'</div>'
    +'<span class="sleep-badge">Il dort</span>'
    +'<p class="sleep-tag">'+escapeHtml(info.tag||'')+'</p>'
    +'<div class="sleep-actions">'+actions+'</div>'
    +'</div>';
}

/* ─────────── 4. fin d'un jeu : la fiche de présentation ─────────── */
function gameRenderRestitution(){
  var sentences = _game.branch==='short'
    ? ['shortQ1','shortQ2'].map(function(k){ var a=_game.answers[k]; return a?a.restit:null; })
    : ['q1','q2','q3','q4','q5'].map(function(k){ var a=_game.answers[k]; return a?a.restit:null; });
  /* question préalable (lot 2, Leo) : sa phrase ouvre la restitution, quelle que soit la branche */
  if(_game.answers.q0 && _game.answers.q0.restit) sentences.unshift(_game.answers.q0.restit);
  sentences=sentences.filter(Boolean);
  var prev=gamePreviousRun(_game.theme);
  var h='<div class="game-top"><span></span><button class="game-exit" onclick="gameAbandon()">Sortir</button></div>'
    +'<div class="game-restit"><p>'+sentences.map(escapeHtml).join(' ')+'</p></div>'
    +'<button class="btn full game-next" onclick="gameAdvance(\'restitution\')">Continuer</button>';
  if(prev){
    h+='<button class="game-prev-toggle" onclick="gameTogglePrev()">Voir tes réponses du '+formatGameDate(prev.at)+'</button>'
      +'<div class="game-prev-list" id="game-prev-list" style="display:none">'+gamePrevListHTML(prev)+'</div>';
  }
  $('game-inner').innerHTML=h;
}
function gameRenderSortie(){
  var g=GAMES[_game.theme];
  var exitId = _game.branch==='short' ? null : (_game.answers.q3 ? _game.answers.q3.exit : null);
  var target = (exitId && byId(exitId)) ? exitId : g.agent;
  /* second accompagnant proposé (lot 2) : porté par la réponse préalable ou par la sortie */
  var second=(_game.answers.q0 && _game.answers.q0.second) || (_game.branch!=='short' && _game.answers.q3 && _game.answers.q3.second) || null;
  if(second===target || !byId(second)) second=null;
  var theme=_game.theme;
  if(typeof isUnlocked!=='function' || isUnlocked(g.agent)) wakeAgent(g.agent);
  if(second){ var runs=(state.gameRuns||{})[theme]||[]; if(runs.length){ runs[runs.length-1].exitAgent2=second; persist(); } }
  gameClose();
  if(recapOpen()) entRenderRecap();
  openAgentDeck(target);
  if(second) deckAddSecond(target, second);
}
/* Sur la fiche de l'accompagnant proposé, une pastille qui mène au second. */
function deckAddSecond(target, second){
  var page=document.querySelector('#deck-track .deck-page[data-id="'+target+'"]'); if(!page) return;
  var tag=page.querySelector('.deck-tag'); if(!tag) return;
  var b=byId(second);
  tag.insertAdjacentHTML('afterend','<button class="deck-also" onclick="deckGo(DECK_IDS.indexOf(\''+second+'\'))">'
    +'<span class="deck-also-ava" style="background:'+b.color+'">'+b.name[0]+'</span>'
    +'<span>'+escapeHtml(b.name)+' peut aussi t’accompagner là-dessus</span></button>');
}

/* ─────────── 5. toute conversation qui démarre ferme récapitulatif et carte ─────────── */
(function(){
  var base=startWithAgent;
  if(typeof base!=='function') return;
  window.startWithAgent=function(id){
    try{ closeRecap(); closeEntourage(); }catch(e){}
    return base.apply(this, arguments);
  };
})();

/* ─────────── « Endormir tout le monde » (démonstrations) ───────────
   Bas du récapitulatif. Deux touches pour confirmer (pas de confirm() natif, peu lisible
   sur téléphone). Ne vide que state.awakeAgents : discussions, parcours et historique des
   jeux (state.gameRuns) restent. MIA ne dort jamais. */
var _sleepAllArmed=null;
function sleepAllReset(){
  clearTimeout(_sleepAllArmed); _sleepAllArmed=null;
  var b=$('recap-sleep-all'); if(b){ b.classList.remove('armed'); b.textContent='Endormir tout le monde'; }
}
function sleepAllTap(){
  var b=$('recap-sleep-all'); if(!b) return;
  if(!_sleepAllArmed){
    b.classList.add('armed'); b.textContent='Toucher encore pour confirmer';
    _sleepAllArmed=setTimeout(sleepAllReset, 3500);
    return;
  }
  sleepAllReset();
  sleepAll();
}
function sleepAll(){
  state.awakeAgents=[];
  persist();
  if(recapOpen()) entRenderRecap();
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
  try{ toast('Tout le monde dort. MIA reste là.'); }catch(e){}
}
(function(){
  var base=closeRecap;
  if(typeof base!=='function') return;
  window.closeRecap=function(){ sleepAllReset(); return base.apply(this, arguments); };
})();

/* ─────────── 6. fiche de présentation ─────────── */
function deckFavLabel(id){ return isFav(id) ? 'Retirer des favoris' : 'Ajouter en favori'; }
function deckFavBtnHTML(id){
  var on=isFav(id);
  return '<button class="deck-fav'+(on?' on':'')+'" data-fav="'+id+'" onclick="deckFav(\''+id+'\',event)">'+starSVG(on)+'<span>'+deckFavLabel(id)+'</span></button>';
}
/* « Rejouer » : sous « Ajouter en favori », pour tout accompagnant qui a un jeu (Miro pour
   l'instant). « Jouer » tant qu'aucune partie n'a été faite (réveillé par une conversation). */
function deckGameBtnHTML(id){
  var key=gameForAgent(id); if(!key) return '';
  var played=((state.gameRuns && state.gameRuns[key]) || []).length>0;
  return '<button class="deck-fav deck-replay" onclick="deckReplay(\''+key+'\')">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>'
    +'<span>'+(played?'Rejouer':'Jouer')+' · '+escapeHtml(GAMES[key].label)+'</span></button>';
}
function deckReplay(key){ closeDeck(); openGame(key); }
function deckFav(id, ev){
  toggleFav(id, ev);
  var btns=document.querySelectorAll('#deck-track .deck-fav[data-fav="'+id+'"]');
  for(var i=0;i<btns.length;i++) btns[i].outerHTML=deckFavBtnHTML(id);
}
(function(){
  var base=openAgentDeck;
  if(typeof base!=='function') return;
  window.openAgentDeck=function(){
    var r=base.apply(this, arguments);
    try{
      var stars=document.querySelectorAll('#deck-track .deck-star');
      for(var i=0;i<stars.length;i++) stars[i].parentNode.removeChild(stars[i]);
      var pages=document.querySelectorAll('#deck-track .deck-page');
      for(var k=0;k<pages.length;k++){
        var id=pages[k].getAttribute('data-id'), cta=pages[k].querySelector('.deck-cta');
        if(id!=='mia' && cta) cta.insertAdjacentHTML('afterend', deckFavBtnHTML(id)+deckGameBtnHTML(id));
      }
      $('deck-dots').innerHTML='<span class="deck-count" id="deck-count"></span>';
      deckSync(0);
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=deckSync;
  if(typeof base!=='function') return;
  window.deckSync=function(i){
    var r=base.apply(this, arguments);
    try{
      if(i==null) i=deckIndex();
      var c=$('deck-count'); if(c) c.textContent=(i+1)+' / '+DECK_IDS.length;
    }catch(e){}
    return r;
  };
})();
