/* ══════════════════════════════════════════════════════════════════════════
   LE MOTEUR DES JEUX — chantier indépendant de la refonte de l'intelligence.
   Un seul mécanisme générique (GAMES), un seul thème de contenu pour l'instant
   (sommeil, accompagnant Miro). Aucun appel à l'intelligence artificielle dans
   le déroulé : questions écrites, restitution en gabarit, sortie en table —
   tout est déterministe, comme demandé.

   Trois couches de stockage prévues (voir dossier), une seule construite ici :
   - réponses (state.gameRuns) : construite en entier dans ce fichier.
   - constats : pas construite, demande plusieurs thèmes pour avoir du sens.
   - état courant : pas construite, pas encore injectée dans les conversations.

   Emplacement de la table des thèmes : GAMES, juste en dessous. Ajouter un
   thème = ajouter une entrée dans cet objet, rien d'autre à toucher dans le
   moteur (voir la structure de "sommeil" comme gabarit).
   ══════════════════════════════════════════════════════════════════════════ */

var GAMES = {
  sommeil: {
    agent: 'miro',
    label: 'Tes nuits',
    accroche: "Cinq questions sur tes nuits. Prends ton temps.",
    reflectionMs: 30000,
    q1: {
      title: "La dernière fois que tu t'es réveillé vraiment reposé.",
      options: [
        {label:'Ce matin', restit:"Ce matin encore, tu ne t'es pas réveillé reposé."},
        {label:'Cette semaine', restit:"Cette semaine que tu ne t'es pas réveillé reposé."},
        {label:'Ce mois-ci', restit:"Ce mois-ci que tu ne t'es pas réveillé reposé."},
        {label:'Cette année', restit:"Cette année que tu ne t'es pas réveillé reposé."},
        {label:"Il y a plus d'un an", restit:"Il y a plus d'un an que tu ne t'es pas réveillé reposé."}
      ],
      dropout:{label:'Je ne sais plus', restit:"Tu ne sais même plus la dernière fois que tu t'es réveillé reposé."}
    },
    q2: {
      title: 'En ce moment, tes nuits.',
      options: [
        {label:'Je dors bien', branch:'short'},
        {label:"J'ai du mal à m'endormir", branch:'normal', restit:"Tu as du mal à t'endormir."},
        {label:'Je me réveille la nuit', branch:'normal', restit:"Tu t'endors, mais tu te réveilles la nuit."},
        {label:'Je me réveille trop tôt', branch:'normal', restit:"Tu t'endors, mais tu te réveilles trop tôt."},
        {label:'Je dors, mais ça ne repose pas', branch:'normal', restit:"Tu dors, mais ça ne repose pas."}
      ],
      dropout:{label:'Ça change tout le temps', branch:'irregular', restit:"Tes nuits changent tout le temps."}
    },
    q3: {
      title: "Ce qui t'empêche de dormir.",
      titleIrregular: 'Ce qui fait la différence entre une bonne et une mauvaise nuit.',
      options: [
        {label:'Ma tête qui tourne', exit:'felix', restit:'Tu situes ça du côté de la tête.'},
        {label:'Mon corps', exit:'miro', restit:'Tu situes ça du côté du corps.'},
        {label:'Mes horaires et mes habitudes', exit:'naoki', restit:'Tu situes ça du côté de tes horaires et de tes habitudes.'},
        {label:"Ce qui m'entoure, bruit, lumière, quelqu'un", exit:'leo', restit:"Tu situes ça du côté de ce qui t'entoure."}
      ],
      dropout:{label:'Je ne sais pas', exit:'mia', restit:"Tu ne saurais pas dire d'où ça vient."}
    },
    q4: {
      title: 'Ce que tu as déjà essayé.',
      options: [
        {label:'Changer mes horaires', restit:"Tu as changé tes horaires, ça n'a pas suffi."},
        {label:'Couper les écrans le soir', restit:"Tu as coupé les écrans, ça n'a pas suffi."},
        {label:'Bouger davantage dans la journée', restit:"Tu as bougé davantage dans la journée, ça n'a pas suffi."},
        {label:"Des aides pour m'endormir", restit:"Tu as essayé des aides pour t'endormir, ça n'a pas suffi."}
      ],
      dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
    },
    q5: {
      title: 'Cette semaine, tu te sens capable de.',
      options: [
        {label:'Changer une chose précise le soir', restit:'Tu te sens capable de changer une chose précise le soir.'},
        {label:'Essayer quelque chose de léger', restit:"Tu te sens capable d'essayer quelque chose de léger."},
        {label:'Ne rien changer pour l’instant', restit:'Tu ne te sens pas prêt à changer quoi que ce soit pour l’instant.'}
      ],
      dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
    },
    short:{
      q1:{
        title:'Depuis quand ça se passe bien.',
        options:[
          {label:'Toujours', restit:'Ça se passe bien depuis toujours.'},
          {label:'Depuis quelques mois', restit:'Ça se passe bien depuis quelques mois.'},
          {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
          {label:'Ça va sans être stable', restit:'Ça va, sans être stable.'}
        ]
      },
      q2:{
        title:'Ce qui fait que ça tient.',
        options:[
          {label:'Mes horaires', restit:'Ce qui tient, ce sont tes horaires.'},
          {label:'Mon activité physique', restit:"Ce qui tient, c'est ton activité physique."},
          {label:'Ma tête est tranquille en ce moment', restit:'Ta tête est tranquille en ce moment, et ça tient.'}
        ],
        dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
      }
    }
    /* Note de cadrage du dossier : l'option "des aides pour m'endormir" (q4) touche
       potentiellement à des médicaments. La réponse est légitime puisque donnée par la
       personne elle-même, mais rien ici ni ailleurs (Miro compris) n'enchaîne avec un
       conseil sur le sujet — la restitution reste neutre, aucun texte ajouté n'y fait
       référence, et ce chantier n'injecte de toute façon aucune réponse dans les
       conversations (couche "état courant" pas construite). */
  }
};

/* ═══════════════════════ moteur — état de la partie en cours ═══════════════════════
   Portée module, jamais persisté tel quel (seule la couche "réponses" l'est, une fois
   la question 5 — ou la 2e question courte — atteinte). */
var _game=null;
var _gameRevealTimer=null;

function gameQuestionDefForKey(g, key, branch){
  if(key==='q3' && branch==='irregular') return Object.assign({}, g.q3, {title:g.q3.titleIrregular});
  if(key==='shortQ1') return g.short.q1;
  if(key==='shortQ2') return g.short.q2;
  return g[key];
}
function gameQuestionDef(step){ return gameQuestionDefForKey(GAMES[_game.theme], step, _game.branch); }
function gameQuestionNumber(step){
  return {q1:'1',q2:'2',q3:'3',q4:'4',q5:'5',shortQ1:'1',shortQ2:'2'}[step]||'';
}
function gameOrder(){
  return _game.branch==='short'
    ? ['q1','q2','shortQ1','shortQ2','restitution','sortie']
    : ['q1','q2','q3','q4','q5','restitution','sortie'];
}

function openGame(themeKey){
  var g=GAMES[themeKey]; if(!g || !$('game')) return;
  clearTimeout(_gameRevealTimer);
  _game={theme:themeKey, branch:null, step:'q1', answers:{}};
  $('game').classList.add('show');
  gameRenderStep();
}
function gameClose(){
  _game=null;
  var el=$('game'); if(el) el.classList.remove('show');
  if(typeof renderObjectives==='function' && typeof activeScreen==='function' && activeScreen()==='tab-objectifs') renderObjectives();
}
/* Sortir en cours de route n'enregistre que ce qui a déjà été répondu (couche "réponses",
   marquée non terminée) — personne ne doit avoir l'impression d'avoir laissé quelque chose
   en plan. Rien à enregistrer une deuxième fois si la restitution a déjà été atteinte : ce
   point de complétion a déjà été sauvegardé par gameAdvance(). */
function gameAbandon(){
  clearTimeout(_gameRevealTimer);
  if(_game && _game.step!=='restitution' && _game.step!=='sortie' && Object.keys(_game.answers).length){
    gamePersistRun(_game.theme, _game.branch, gameAnswersForStorage(), null, false);
  }
  gameClose();
}

function gameRenderStep(){
  if(_game.step==='restitution'){ gameRenderRestitution(); return; }
  if(_game.step==='sortie'){ gameRenderSortie(); return; }
  gameRenderQuestion(_game.step);
}

function gameOptionsHTML(step, q){
  var main=q.options.map(function(o,i){
    return '<button class="game-opt" onclick="gamePick(\''+step+'\','+i+')">'+escapeHtml(o.label)+'</button>';
  }).join('');
  var drop=q.dropout ? '<div class="game-opts-dropout"><button class="game-opt dropout" onclick="gamePick(\''+step+'\',-1)">'+escapeHtml(q.dropout.label)+'</button></div>' : '';
  return main+drop;
}
function gameRenderQuestion(step){
  clearTimeout(_gameRevealTimer);
  var g=GAMES[_game.theme];
  var a=byId(g.agent);
  var q=gameQuestionDef(step);
  var h='<div class="game-top"><span class="game-tag" style="color:'+a.color+'">'+escapeHtml(a.name)+'</span>'
    +'<button class="game-exit" onclick="gameAbandon()">Sortir</button></div>'
    +'<div class="game-qn">Question '+gameQuestionNumber(step)+'</div>'
    +'<div class="game-q">'+escapeHtml(q.title)+'</div>'
    +'<div class="game-timeline"><i id="game-timeline-fill" style="background:'+a.color+'"></i></div>'
    +'<div class="game-opts" id="game-opts" style="display:none">'+gameOptionsHTML(step,q)+'</div>'
    +'<button class="game-reveal" id="game-reveal-btn" onclick="gameRevealNow()">Voir les réponses maintenant</button>';
  $('game-inner').innerHTML=h;
  var ms=g.reflectionMs;
  if(!ms){ gameShowOptions(); return; }
  var fill=$('game-timeline-fill');
  requestAnimationFrame(function(){
    if(!fill) return;
    fill.style.transition='width '+(ms/1000)+'s linear';
    fill.style.width='100%';
  });
  _gameRevealTimer=setTimeout(gameShowOptions, ms);
}
function gameShowOptions(){
  clearTimeout(_gameRevealTimer);
  var opts=$('game-opts'), btn=$('game-reveal-btn');
  if(opts) opts.style.display='';
  if(btn) btn.style.display='none';
}
function gameRevealNow(){ gameShowOptions(); }

function gamePick(step, idx){
  var q=gameQuestionDef(step);
  var opt = idx===-1 ? q.dropout : q.options[idx];
  if(!opt) return;
  _game.answers[step]=opt;
  if(step==='q2'){ _game.branch=opt.branch; }
  gameAdvance(step);
}
function gameAnswersForStorage(){
  var out={};
  Object.keys(_game.answers).forEach(function(k){ out[k]=_game.answers[k].label; });
  return out;
}
function gameAdvance(fromStep){
  var order=gameOrder();
  var i=order.indexOf(fromStep);
  _game.step=order[i+1];
  if(_game.step==='restitution'){
    var exitAgent = _game.branch==='short' ? null : (_game.answers.q3 ? _game.answers.q3.exit : null);
    gamePersistRun(_game.theme, _game.branch, gameAnswersForStorage(), exitAgent, true);
  }
  gameRenderStep();
}

function gameRenderRestitution(){
  var sentences = _game.branch==='short'
    ? ['shortQ1','shortQ2'].map(function(k){ var a=_game.answers[k]; return a?a.restit:null; })
    : ['q1','q2','q3','q4','q5'].map(function(k){ var a=_game.answers[k]; return a?a.restit:null; });
  sentences=sentences.filter(Boolean);
  var h='<div class="game-top"><span></span><button class="game-exit" onclick="gameAbandon()">Sortir</button></div>'
    +'<div class="game-restit"><p>'+sentences.map(escapeHtml).join(' ')+'</p></div>'
    +'<button class="btn full game-next" onclick="gameAdvance(\'restitution\')">Continuer</button>';
  $('game-inner').innerHTML=h;
}

function gamePreviousRun(theme){
  var runs=(state.gameRuns && state.gameRuns[theme]) || [];
  for(var i=runs.length-2;i>=0;i--){ if(runs[i].completed) return runs[i]; }
  return null;
}
function gamePrevListHTML(prev){
  var g=GAMES[_game.theme];
  return Object.keys(prev.answers).map(function(k){
    var qd=gameQuestionDefForKey(g, k, prev.branch);
    return '<div class="game-prev-row"><span>'+escapeHtml(qd?qd.title:k)+'</span><b>'+escapeHtml(prev.answers[k])+'</b></div>';
  }).join('');
}
function gameTogglePrev(){ var el=$('game-prev-list'); if(el) el.style.display = el.style.display==='none' ? '' : 'none'; }
function gameRenderSortie(){
  var agentId = _game.branch==='short' ? null : (_game.answers.q3 ? _game.answers.q3.exit : null);
  var prev=gamePreviousRun(_game.theme);
  var h='<div class="game-top"><span></span><button class="game-exit" onclick="gameAbandon()">Sortir</button></div>';
  if(agentId){
    var a=byId(agentId);
    h+='<div class="game-sortie"><span class="game-sortie-ava" style="background:'+a.color+'">'+a.name[0]+'</span>'
      +'<p class="game-sortie-txt">'+escapeHtml(a.name)+' travaille ça. Tu veux lui en parler ?</p>'
      +'<button class="btn full" onclick="gameTalkTo(\''+agentId+'\')">Parler à '+escapeHtml(a.name)+'</button>'
      +'<button class="btn ghost full" style="margin-top:9px" onclick="gameClose()">Retour au parcours</button></div>';
  } else {
    h+='<div class="game-sortie"><p class="game-sortie-txt">Merci d’avoir pris ce temps.</p>'
      +'<button class="btn full" onclick="gameClose()">Retour au parcours</button></div>';
  }
  if(prev){
    h+='<button class="game-prev-toggle" onclick="gameTogglePrev()">Voir tes réponses du '+formatGameDate(prev.at)+'</button>'
      +'<div class="game-prev-list" id="game-prev-list" style="display:none">'+gamePrevListHTML(prev)+'</div>';
  }
  $('game-inner').innerHTML=h;
}
function gameTalkTo(agentId){ gameClose(); if(typeof startWithAgent==='function') startWithAgent(agentId); }

function formatGameDate(ts){
  var d=new Date(ts);
  function pad(n){ return n<10?'0'+n:''+n; }
  return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();
}
/* Couche "réponses" : horodatée, jamais écrasée — un nouveau passage s'ajoute, il ne
   remplace pas l'ancien. state.gameRuns n'est pas dans defaultState (comme
   state.multiUnlocked ou state.objectivesArchive) : absent tant que personne n'a joué. */
function gamePersistRun(theme, branch, answers, exitAgent, completed){
  state.gameRuns = state.gameRuns || {};
  state.gameRuns[theme] = state.gameRuns[theme] || [];
  state.gameRuns[theme].push({at:Date.now(), branch:branch, answers:answers, exitAgent:exitAgent||null, completed:!!completed});
  persist();
}

/* ═══════════════════════ entrée dans l'onglet Parcours ═══════════════════════
   « Les jeux en haut, le suivi et le chemin parcouru en dessous. » Ces deux dernières
   sections sont déjà ajoutées en fin de pad par les enveloppes de 14-palette-et-accueil.js
   et 16-palette-finale.js, à chaque appel de renderObjectives (le pad est reconstruit en
   entier par la base à chaque fois, ces enveloppes réinjectent donc leur bloc à chaque
   fois plutôt que de vérifier une seule fois s'il existe déjà — même principe repris ici,
   en tête de pad cette fois (insertAdjacentHTML('afterbegin', ...), après l'appel à base()
   qui a déjà tout reconstruit, suivi et chemin parcouru compris). Gardé derrière
   state.tier!=='free' comme le reste de l'onglet : en gratuit, renderObjectives s'arrête
   avant même d'atteindre ce point (encart de verrouillage), donc cette section ne
   s'affiche jamais à moitié à côté d'un onglet par ailleurs verrouillé. */
function gameCardHTML(themeKey){
  var g=GAMES[themeKey];
  var a=byId(g.agent);
  var runs=(state.gameRuns && state.gameRuns[themeKey]) || [];
  var last=runs.length ? runs[runs.length-1] : null;
  var sub = last ? ('Déjà fait le '+formatGameDate(last.at)) : g.accroche;
  return '<button class="game-card" onclick="openGame(\''+themeKey+'\')">'
    +'<span class="game-card-ava" style="background:'+a.color+'">'+a.name[0]+'</span>'
    +'<span class="game-card-tx"><span class="game-card-nm">'+escapeHtml(g.label)+'</span><span class="game-card-sub">'+escapeHtml(sub)+'</span></span>'
    +'</button>';
}
function renderGamesSectionHTML(){
  var items=Object.keys(GAMES).map(gameCardHTML).join('');
  return '<div class="section-head"><h2>Jeux</h2></div><div class="games-row">'+items+'</div>';
}
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var pad=$('obj-pad');
      if(pad && state.tier!=='free') pad.insertAdjacentHTML('afterbegin', renderGamesSectionHTML());
    }catch(e){}
    return r;
  };
})();
