/* ══════════════════════════════════════════════════════════════════════════
   FIN DE JEU, RÉPONSE « AUTRE », RÉFLEXION VISIBLE — demande du 30/09/2026

   1. Fin d'un jeu. Plus de résumé qui répète les réponses mot pour mot, et plus
      de renvoi vers un autre accompagnant. Un écran de fin, qui dit que
      l'accompagnant du jeu a les réponses et qu'il est là pour en parler, avec
      deux boutons :
      - « En parler avec X maintenant » : ouvre la discussion avec X, y poste
        le récapitulatif (pas besoin de tout retaper), et X répond dans la
        foulée : il sait qu'on sort de son jeu (consigne ajoutée à son prompt) ;
      - « Ce que X peut vraiment faire pour toi » : sa fiche de présentation.
      Si le jeu indique qu'un autre accompagnant serait utile (sortie de la
      question 3, seconds, bascule directe de Leo), X le sait. S'il juge que
      c'est vraiment utile, il le fait venir dans la discussion
      ([[SUGGEST:id]]) : l'autre arrive et répond juste après lui, avec le même
      contexte. Ce geste ne passe pas par la bascule multi-accompagnants du
      profil : c'est l'accompagnant du jeu qui appelle, à la demande du porteur
      du projet.
      Les phrases de restitution des dossiers ne sont plus affichées. Elles
      restent dans les données, et gameRestitText() les assemble encore : les
      tests y vérifient toujours l'absence de conseil ou de jugement.
   2. « Autre » sous chaque question (sauf là où une réponse « Autre » existe
      déjà, et sous les sous-questions qui ferment le jeu) : une case qui
      s'ouvre sur un champ libre et un bouton « Valider ». Le texte est
      facultatif. Une réponse « Autre » ne mène vers personne et, en
      question 2, suit la branche normale.
   3. Réflexion visible même avec « Réduire les animations » : le bloc de
      remplissage monte par paliers au lieu d'être masqué (00-base.css coupe
      toutes les transitions dans ce mode).
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── état de fin de partie (survit à gameClose) ─────────── */
var _gameEnd=null;
var _gameWasAwake=false;
(function(){
  var base=openGame;
  if(typeof base!=='function') return;
  window.openGame=function(themeKey){
    var g=GAMES[themeKey];
    _gameWasAwake = !!(g && agentAwake(g.agent));
    var r=base.apply(this, arguments);
    if(_game) _game.titles={};
    return r;
  };
})();
function agentPron(id){ return (typeof AGENT_FEM!=='undefined' && AGENT_FEM.indexOf(id)>=0) ? 'elle' : 'il'; }

/* Titre de chaque question tel qu'il a été posé (variantes : première fois de MIA, Neo, Nora). */
(function(){
  var base=gamePick;
  if(typeof base!=='function') return;
  window.gamePick=function(step){
    try{ if(_game){ var q=gameQuestionDef(step); if(q){ _game.titles=_game.titles||{}; _game.titles[step]=q.title; } } }catch(e){}
    return base.apply(this, arguments);
  };
})();

/* ─────────── 2. « Autre » ─────────── */
function gameAutreAllowed(step, q){
  if(!q || step==='q0b') return false;
  if((q.options||[]).some(function(o){ return /^Autre/i.test(o.label||''); })) return false;
  if((q.options||[]).some(function(o){ return o.close; })) return false;
  return true;
}
(function(){
  var base=gameOptionsHTML;
  if(typeof base!=='function') return;
  window.gameOptionsHTML=function(step, q){
    var h=base.apply(this, arguments);
    if(!gameAutreAllowed(step, q)) return h;
    var autre='<div class="game-autre" id="game-autre">'
      +'<button class="game-opt game-autre-btn" onclick="gameAutreOpen()">Autre</button>'
      +'<div class="game-autre-box" id="game-autre-box" style="display:none">'
      +'<textarea id="game-autre-tx" rows="2" maxlength="280" placeholder="Ce qui est juste pour toi, si tu veux l’écrire"></textarea>'
      +'<button class="game-autre-ok" onclick="gameAutreValidate(\''+step+'\')">Valider</button>'
      +'</div></div>';
    var cut=h.indexOf('<div class="game-opts-dropout">');
    return cut>=0 ? h.slice(0,cut)+autre+h.slice(cut) : h+autre;
  };
})();
function gameAutreOpen(){
  var b=document.querySelector('#game-autre .game-autre-btn'), box=$('game-autre-box');
  if(b) b.style.display='none';
  if(box){ box.style.display=''; var tx=$('game-autre-tx'); if(tx) try{ tx.focus(); }catch(e){} }
}
function gameAutreValidate(step){
  if(!_game) return;
  var tx=$('game-autre-tx'), text=tx ? String(tx.value||'').trim().slice(0,280) : '';
  try{ var q=gameQuestionDef(step); _game.titles=_game.titles||{}; if(q) _game.titles[step]=q.title; }catch(e){}
  _game.answers[step]={label:'Autre', text:text, autre:true, branch:'normal', restit:''};
  if(step==='q2') _game.branch='normal';
  clearTimeout(_gameRevealTimer);
  gameAdvance(step);
}
window.gameAnswersForStorage=function(){
  var out={};
  Object.keys(_game.answers).forEach(function(k){
    var a=_game.answers[k];
    out[k]= a.autre ? ('Autre'+(a.text?' : '+a.text:'')) : a.label;
  });
  return out;
};

/* ─────────── 3. réflexion visible en « Réduire les animations » ─────────── */
var _gameStepTimer=null;
(function(){
  var base=gameRenderQuestion;
  if(typeof base!=='function') return;
  window.gameRenderQuestion=function(step){
    clearInterval(_gameStepTimer);
    var r=base.apply(this, arguments);
    try{
      var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var g=_game && GAMES[_game.theme], ms=g && g.reflectionMs, fill=$('game-fill-wrap');
      /* Sol : la pause sans décompte (voir 29-jeux-lot-1.js) */
      if(g && g.noClock){ var rf=document.querySelector('#game-inner .game-reflect'); if(rf) rf.style.visibility='hidden'; }
      if(reduced && ms && fill){
        var t0=Date.now();
        fill.style.height='6%';
        _gameStepTimer=setInterval(function(){
          var inner=$('game-inner');
          if(!document.body.contains(fill) || (inner && inner.classList.contains('revealed'))){ clearInterval(_gameStepTimer); return; }
          fill.style.height=Math.min(100, 6+94*(Date.now()-t0)/ms).toFixed(0)+'%';
        }, 500);
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── 1. fin de jeu ─────────── */
/* Les phrases de restitution des dossiers, assemblées comme avant (plus affichées). */
function gameRestitText(){
  if(!_game) return '';
  var keys = _game.branch==='short' ? ['shortQ1','shortQ2'] : ['q1','q2','q3','q4','q5'];
  var s=keys.map(function(k){ var a=_game.answers[k]; return a?(a.autre?(a.text?'« '+a.text+' »':''):a.restit):null; });
  if(_game.answers.q0b && _game.answers.q0b.restit) s.unshift(_game.answers.q0b.restit);
  if(_game.answers.q0 && _game.answers.q0.restit) s.unshift(_game.answers.q0.restit);
  return s.filter(Boolean).join(' ');
}
function gameEndInfo(){
  var theme=_game.theme, g=GAMES[theme], agent=g.agent, A=_game.answers, short=_game.branch==='short';
  var exitId = (A.q0 && A.q0.direct) ? A.q0.direct : (short ? null : (A.q3 ? A.q3.exit : null));
  var useful=[];
  function add(v){ [].concat(v||[]).forEach(function(id){ if(id && id!=='mia' && id!==agent && byId(id) && useful.indexOf(id)<0) useful.push(id); }); }
  add(exitId);
  ['q0','q2','q3'].forEach(function(k){ var a=A[k]; if(a && a.second && !(k==='q3' && short)) add(a.second); });
  add(g.alsoAlways);
  useful=useful.slice(0,2);
  var titles=_game.titles||{};
  var rows=Object.keys(A).filter(function(k){ return /^(q0|q0b|q[1-5]|shortQ[12])$/.test(k); })
    .sort(function(a,b){ return gameStepRank(a)-gameStepRank(b); })
    .map(function(k){
      var a=A[k], qd=null; try{ qd=gameQuestionDef(k); }catch(e){}
      return {q: titles[k] || (qd?qd.title:''), a: a.autre ? (a.text ? a.text : 'Autre') : a.label};
    });
  return {theme:theme, label:g.label, agent:agent, exitId:(exitId && byId(exitId)) ? exitId : null, useful:useful, rows:rows,
    review: !!(theme==='point' && A.q5 && A.q5.reviewObjective), wasAwake:_gameWasAwake};
}
function gameStepRank(k){ return ['q0','q0b','q1','q2','q3','q4','q5','shortQ1','shortQ2'].indexOf(k); }

window.gameRenderRestitution=function(){
  var e=_gameEnd=gameEndInfo();
  _gameLastExit = e.exitId || e.agent; /* la table de sortie des dossiers, lue par les tests */
  var a=byId(e.agent), il=agentPron(e.agent), name=escapeHtml(a.name);
  if(typeof isUnlocked!=='function' || isUnlocked(e.agent)) wakeAgent(e.agent);
  try{ if(typeof recapOpen==='function' && recapOpen()) entRenderRecap(); }catch(x){}
  var inner=$('game-inner'); if(inner) inner.classList.remove('revealed');
  var ava = e.agent==='mia' ? '<span class="gend-ava mia">'+brainSVG()+'</span>' : '<span class="gend-ava" style="background:'+a.color+'">'+escapeHtml(a.name[0])+'</span>';
  var voice = (!e.wasAwake && typeof voiceAwake==='function' && voiceAwake(e.agent))
    ? '<button class="gend-voice" onclick="speakAgent(\''+e.agent+'\', voiceSample(\''+e.agent+'\'))">'+voiceIconSVG()+'<span>Tu as réveillé la voix de '+name+'. L’écouter</span></button>' : '';
  var n=e.rows.length;
  var body = e.agent==='mia'
    ? 'MIA a tes '+n+' réponses. Si tu veux voir ce qu’elles disent de ton parcours, elle les lit et te répond tout de suite. Pas besoin de tout réécrire.'
    : name+' a tes '+n+' réponses. Si tu as besoin d’en parler, c’est exactement ce pour quoi '+il+' est là : '+il+' les lit et te répond tout de suite. Pas besoin de tout réécrire.';
  var primary = e.review
    ? '<button class="btn full game-next" onclick="gameAdvance(\'restitution\')">Revoir mon objectif</button>'
      +'<button class="btn ghost full gend-talk" onclick="gameTalkNow()">En parler avec '+name+'</button>'
    : '<button class="btn full game-next" onclick="gameTalkNow()">En parler avec '+name+' maintenant</button>';
  var fiche = e.agent==='mia' ? '' : '<button class="btn ghost full gend-fiche" onclick="gameEndFiche()">Ce que '+name+' peut vraiment faire pour toi</button>';
  var prev=gamePreviousRun(e.theme);
  var h='<div class="game-top"><span></span><button class="game-exit" onclick="gameClose()">Fermer</button></div>'
    +'<div class="gend">'
    +'<div class="gend-head">'+ava+'<div><div class="gend-name">'+name+'</div><div class="gend-sub">'+escapeHtml(GAMES[e.theme].label)+'</div></div></div>'
    +'<h2 class="gend-title">Merci d’avoir pris ce temps.</h2>'
    +'<p class="gend-body">'+body+'</p>'
    +'<div class="game-restit"></div>'
    +voice
    +'<div class="gend-actions">'+primary+fiche+'</div>'
    +'<button class="game-prev-toggle gend-mine" onclick="gameToggleMine()">Revoir mes réponses</button>'
    +'<div class="gend-list" id="gend-list" style="display:none">'+e.rows.map(function(r){
        return '<div class="gend-row"><span class="gend-q">'+escapeHtml(r.q)+'</span><span class="gend-a">'+escapeHtml(r.a)+'</span></div>';
      }).join('')+'</div>'
    +(prev ? '<button class="game-prev-toggle" onclick="gameTogglePrev()">Voir tes réponses du '+formatGameDate(prev.at)+'</button>'
      +'<div class="game-prev-list" id="game-prev-list" style="display:none">'+gamePrevListHTML(prev)+'</div>' : '')
    +'</div>';
  $('game-inner').innerHTML=h;
};
function gameToggleMine(){ var el=$('gend-list'); if(el) el.style.display = el.style.display==='none' ? '' : 'none'; }

function gameEndFiche(){
  var e=_gameEnd; if(!e) return;
  gameClose();
  openAgentDeck(e.agent);
  if(!e.wasAwake && typeof voiceRewardOnDeck==='function') voiceRewardOnDeck(e.agent);
}

/* Le récapitulatif posté dans la discussion, au nom de la personne. */
function gameRecapText(e){
  return 'Je viens de finir ton jeu « '+e.label+' ». Mes réponses :\n\n'
    + e.rows.map(function(r){ return '• '+r.q+'\n→ '+r.a; }).join('\n');
}
function gameFollowupSystem(e){
  var a=byId(e.agent);
  var s='Contexte de ce message : la personne vient de terminer ton jeu « '+e.label+' », une série de questions à choix. Son dernier message contient ses réponses exactes, qu’elle t’a envoyées en un geste depuis la fin du jeu. Réponds dans la foulée, comme quelqu’un qui a vraiment lu : ne récite pas ses réponses et ne les reprends pas une par une, relie-les. Dis en une ou deux phrases ce que tu y lis, toujours comme une hypothèse ouverte, jamais comme un diagnostic ni une étiquette. Puis pose une seule question, pour avancer à partir de là. Une réponse « Autre », avec ou sans texte, compte autant que les autres ; « Je ne sais pas » est une information, pas un manque.';
  if(e.useful.length){
    var names=e.useful.map(function(id){ var b=byId(id); return b.name+' ('+(b.domain||'')+', balise [[SUGGEST:'+id+']])'; }).join(' ; ');
    s+=' D’après ses réponses, un autre accompagnant pourrait être utile : '+names+'. Si, et seulement si, ce que tu lis relève vraiment de son terrain, propose-le simplement dans ta réponse et termine par sa balise : il rejoindra la discussion et répondra juste après toi, avec les mêmes réponses sous les yeux. Sinon, garde la main, sans le mentionner.';
  }
  if(e.agent==='mia') s+=' Tu es MIA : c’est ton point de mesure, tu regardes le parcours dans son ensemble.';
  return s;
}
function gameInvitedSystem(id, e){
  var a=byId(e.agent), b=byId(id);
  return 'Contexte de ce message : '+a.name+' vient de te faire venir dans cette discussion, juste après que la personne a terminé son jeu « '+e.label+' ». Ses réponses sont plus haut, suivies de la réponse de '+a.name+'. C’est toi, '+b.name+', qui réponds maintenant, à ton compte, dans la foulée. Ouvre par une phrase très courte qui dit que '+a.name+' t’a fait venir, sans te présenter longuement. Apporte ce que ton terrain éclaire dans ce qu’elle a décrit, sans répéter ce que '+a.name+' a déjà dit, puis pose une seule question. Jamais de diagnostic ni d’étiquette. Commence ta réponse par la balise [[REDIGE:'+id+']].';
}
function gameInviteAgent(id, e){
  var th=activeThread(); if(!th || !byId(id)) return Promise.resolve(null);
  if(th.parts.indexOf(id)<0){
    if(th.parts.length>=3) return Promise.resolve(null);
    th.parts.push(id);
    if(typeof touchThread==='function') touchThread();
    persist();
    addNote(byId(id), byId(id).name+' '+t('joined'));
    wakeAgent(id);
    renderChatHeader(); renderPartsCount();
  }
  return assistantReply({extraSystem:gameInvitedSystem(id, e)});
}
var GAME_INVITE_DELAY=2200; /* laisse finir l'affichage en plusieurs bulles de la première réponse */
async function gameTalkNow(){
  var e=_gameEnd; if(!e) return;
  gameClose();
  try{ closeDeck(); }catch(x){}
  startWithAgent(e.agent);
  addBubble('user', gameRecapText(e));
  try{ markActivity('chat'); }catch(x){}
  var invite=null;
  var r=await assistantReply({extraSystem:gameFollowupSystem(e), onJoin:function(id){
    if(id && id!==e.agent && id!=='mia' && byId(id)) invite=id;
  }});
  if(r && invite){
    await new Promise(function(res){ setTimeout(res, GAME_INVITE_DELAY); });
    await gameInviteAgent(invite, e);
  }
  return r;
}
