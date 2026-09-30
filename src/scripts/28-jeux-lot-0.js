/* ══════════════════════════════════════════════════════════════════════════
   JEUX, LOT 0 — Miro et Neo (dossier collé le 29/09/2026).

   MIRO : le jeu existait déjà (« sommeil », 18-moteur-des-jeux.js), identique au
   dossier sauf deux sorties qui dépendent du contexte, résolues ici au moment de
   la réponse :
   - « Ma tête qui tourne » : Felix, ou Sol « si l'angoisse est déjà apparue
     ailleurs ». Règle choisie ici : un jeu a déjà mené vers Sol (sortie ou
     second), ou Sol est déjà réveillé (une conversation a eu lieu avec lui).
   - « Ce qui m'entoure » : Leo « si quelqu'un partage le lit », sinon Miro.
     Règle choisie ici : la dernière réponse préalable du jeu de Leo est « En
     couple ». Sans cette information, Miro.

   NEO : nouveau jeu, « habitudes ». Trois extensions du moteur, ici :
   - q0b, sous-question ouverte par un décrochage marqué `sub` : ses options
     `close` ferment le jeu aussitôt (écran calme, aucune question sur ce que
     c'était), son option `skipToIrregular` continue sans la question 2, sur la
     branche irrégulière.
   - Le mot choisi par la personne est repris dans les questions et les
     restitutions ({sans}, {place}, {prend}, {mot}), jamais un terme plus large.
   - `alsoAlways` : Neo reste proposé en plus dans tous les cas (voir
     gameRenderSortie, 22-retours-du-29-09.js).

   POINTS D'ATTENTION pour le professionnel (dossiers des lots 0, 2 et 3) : une
   réponse « répétée dans le temps » (au moins deux passages terminés) apparaît
   dans son espace, sans étiquette ni rien d'affiché à la personne. Ce ne sont
   pas des signaux au sens des quatre signaux du plan d'affaires : le choix d'en
   faire un signal (lequel) reste posé au porteur du projet.

   Non branché, faute de précision dans le dossier : les « combinaisons » du jeu
   de Neo qui doivent remonter au professionnel.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── Miro : sorties selon le contexte ─────────── */
function anxietySeenElsewhere(){
  var runs=state.gameRuns||{}, seen=false;
  Object.keys(runs).forEach(function(k){ (runs[k]||[]).forEach(function(r){ if(r.exitAgent==='sol' || r.exitAgent2==='sol' || r.exitAgent3==='sol') seen=true; }); });
  return seen || agentAwake('sol');
}
function someoneSharesBed(){
  var runs=((state.gameRuns||{}).relation||[]).filter(function(r){ return r.answers && r.answers.q0; });
  return runs.length ? runs[runs.length-1].answers.q0==='En couple' : false;
}
(function(){
  try{
    var q3=GAMES.sommeil.q3;
    q3.options.forEach(function(o){
      if(o.label==='Ma tête qui tourne') o.exitDynamic='tete';
      if(o.label.indexOf("Ce qui m'entoure")===0) o.exitDynamic='entoure';
    });
  }catch(e){}
})();

/* ─────────── Neo : contenu ─────────── */
var NEO_SANS_SUJET={mot:'ça', sans:'sans ça', place:'la place que ça prend', prend:'ça prend'};
GAMES.habitudes = {
  agent:'neo',
  label:'Ce qui prend de la place',
  accroche:'Pas d’étiquette, pas de morale. Cinq questions, et tu peux t’arrêter quand tu veux.',
  reflectionMs:10000,
  alsoAlways:'neo',
  q0:{
    title:'Ce qui prend trop de place en ce moment.',
    options:[
      {label:'Les écrans', sujet:{mot:'les écrans', sans:'sans écrans', place:'la place que prennent les écrans', prend:'les écrans prennent'}, restit:'Ce qui prend trop de place en ce moment, ce sont les écrans.'},
      {label:"L'alcool", sujet:{mot:"l'alcool", sans:'sans alcool', place:"la place que prend l'alcool", prend:"l'alcool prend"}, restit:"Ce qui prend trop de place en ce moment, c'est l'alcool."},
      {label:'Le tabac ou la vape', sujet:{mot:'le tabac ou la vape', sans:'sans tabac ni vape', place:'la place que prennent le tabac ou la vape', prend:'le tabac ou la vape prennent'}, restit:'Ce qui prend trop de place en ce moment, c’est le tabac ou la vape.'},
      {label:'Les achats', sujet:{mot:'les achats', sans:'sans achats', place:'la place que prennent les achats', prend:'les achats prennent'}, restit:'Ce qui prend trop de place en ce moment, ce sont les achats.'},
      {label:"Les jeux d'argent", sujet:{mot:"les jeux d'argent", sans:"sans jeux d'argent", place:"la place que prennent les jeux d'argent", prend:"les jeux d'argent prennent"}, restit:"Ce qui prend trop de place en ce moment, ce sont les jeux d'argent."},
      {label:'Autre chose', sujet:NEO_SANS_SUJET, restit:'Quelque chose prend trop de place en ce moment.'}
    ],
    dropout:{label:'Rien ne prend trop de place en ce moment', sub:true}
  },
  q0b:{
    title:'Est-ce que ça a déjà été le cas.',
    options:[
      {label:'Non, jamais', close:true},
      {label:"Oui, et c'est derrière moi", close:true},
      {label:'Oui, et ça revient par périodes', skipToIrregular:true, restit:'Ça revient par périodes.'}
    ]
  },
  q1:{
    title:'La dernière fois que tu as passé une journée entière {sans}.',
    options:[
      {label:"Aujourd'hui ou hier", restit:"Aujourd'hui ou hier, tu as passé une journée entière {sans}."},
      {label:'Cette semaine', restit:'La dernière fois que tu as passé une journée entière {sans}, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as passé une journée entière {sans}, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as passé une journée entière {sans}, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas passé une journée entière {sans} depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as passé une journée entière {sans}.'}
  },
  q2:{
    title:'En ce moment, {place}.',
    options:[
      {label:'Ça va, je gère', branch:'short'},
      {label:"J'y pense plus que je voudrais", branch:'normal', restit:"Tu y penses plus que tu voudrais."},
      {label:"J'ai du mal à m'arrêter une fois lancé", branch:'normal', restit:"Tu as du mal à t'arrêter une fois lancé."},
      {label:"C'est tous les jours", branch:'normal', restit:"C'est tous les jours."}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  q3:{
    title:'Ce qui déclenche le plus souvent.',
    titleIrregular:'Ce qui fait la différence entre une période calme et une période où {prend} de la place.',
    options:[
      {label:'Le stress', exit:'sol', restit:"Ce qui déclenche le plus souvent, c'est le stress."},
      {label:"L'ennui, les moments vides", exit:'atlas', second:'iris', restit:"Ce qui déclenche le plus souvent, c'est l'ennui, les moments vides."},
      {label:'Les autres, les situations sociales', exit:'iris', second:'otis', restit:'Ce qui déclenche le plus souvent, ce sont les autres, les situations sociales.'},
      {label:'Des moments précis de la journée', exit:'naoki', restit:'Ce qui déclenche le plus souvent, ce sont des moments précis de la journée.'}
    ],
    dropout:{label:'Je ne sais pas', exit:'mia', restit:'Tu ne saurais pas dire ce qui déclenche le plus souvent.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Arrêter net', restit:"Tu as essayé d'arrêter net."},
      {label:'Réduire petit à petit', restit:'Tu as essayé de réduire petit à petit.'},
      {label:'Éviter les situations', restit:'Tu as essayé d’éviter les situations.'},
      {label:"En parler à quelqu'un", restit:"Tu en as parlé à quelqu'un."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Observer sans rien changer', restit:'Tu te sens capable d’observer, sans rien changer.'},
      {label:'Réduire un peu', restit:'Tu te sens capable de réduire un peu.'},
      {label:'Essayer une journée sans', restit:'Tu te sens capable d’essayer une journée {sans}.'},
      {label:'Je ne veux rien changer', restit:'Tu ne veux rien changer.'}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand c’est stable.',
      options:[
        {label:'Depuis toujours', restit:'C’est stable depuis toujours.'},
        {label:'Depuis quelques mois', restit:'C’est stable depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'C’est stable depuis que tu as changé quelque chose.'},
        {label:'Ça reste fragile', restit:'Ça reste fragile.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je sais ce qui déclenche', restit:'Ce qui tient, c’est que tu sais ce qui déclenche.'},
        {label:"D'autres choses me font du bien", restit:'Ce qui tient, ce sont d’autres choses qui te font du bien.'},
        {label:'Je repère les moments où ça monte', restit:'Ce qui tient, c’est que tu repères les moments où ça monte.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucun retour ne ressemble à une évaluation ; « c'est tous les jours »
     est restitué exactement comme les autres réponses ; « je ne veux rien changer » est une
     réponse pleine, restituée sans insistance. Pas d'étiquette, jamais. */
};

/* ─────────── Neo : reprise du mot choisi ─────────── */
function neoSujet(){
  var a=_game && _game.answers && _game.answers.q0;
  return (a && a.sujet) ? a.sujet : NEO_SANS_SUJET;
}
function neoFill(str){
  if(typeof str!=='string') return str;
  var s=neoSujet();
  return str.replace(/\{sans\}/g, s.sans).replace(/\{place\}/g, s.place).replace(/\{prend\}/g, s.prend).replace(/\{mot\}/g, s.mot);
}
function neoFillDef(q){
  if(!q) return q;
  var c=Object.assign({}, q);
  ['title','titleIrregular'].forEach(function(k){ if(c[k]) c[k]=neoFill(c[k]); });
  if(c.options) c.options=c.options.map(function(o){ var x=Object.assign({}, o); if(x.restit) x.restit=neoFill(x.restit); return x; });
  if(c.dropout){ c.dropout=Object.assign({}, c.dropout); if(c.dropout.restit) c.dropout.restit=neoFill(c.dropout.restit); }
  return c;
}
(function(){
  var base=gameQuestionDefForKey;
  if(typeof base!=='function') return;
  window.gameQuestionDefForKey=function(g, key, branch){
    var q=base.apply(this, arguments);
    return (g===GAMES.habitudes) ? neoFillDef(q) : q;
  };
})();

/* ─────────── moteur : q0b, fermeture calme, reprise sans question 2 ─────────── */
function gameOrder(){
  var g=GAMES[_game.theme];
  var pre=g.q0 ? ['q0'] : [];
  if(_game.answers.q0 && _game.answers.q0.sub) pre=pre.concat(['q0b']);
  if(_game.skipQ2) return pre.concat(['q1','q3','q4','q5','restitution','sortie']);
  return pre.concat(_game.branch==='short'
    ? ['q1','q2','shortQ1','shortQ2','restitution','sortie']
    : ['q1','q2','q3','q4','q5','restitution','sortie']);
}
function gameRenderClosed(){
  $('game-inner').innerHTML='<div class="game-top"><span></span><button class="game-exit" onclick="gameClose()">Sortir</button></div>'
    +'<div class="game-sortie"><p class="game-sortie-txt">Merci d’avoir répondu. On s’arrête là.</p>'
    +'<button class="btn full" onclick="gameClose()">Fermer</button></div>';
}
(function(){
  var base=gamePick;
  if(typeof base!=='function') return;
  window.gamePick=function(step, idx){
    try{
      if(_game){
        var q=gameQuestionDef(step), opt=idx===-1 ? q.dropout : q.options[idx];
        /* Miro : sortie selon le contexte (l'objet d'option est partagé, on fixe sa sortie avant l'enregistrement) */
        if(_game.theme==='sommeil' && step==='q3' && opt && opt.exitDynamic){
          var shared=GAMES.sommeil.q3.options[idx];
          if(opt.exitDynamic==='tete') shared.exit = anxietySeenElsewhere() ? 'sol' : 'felix';
          if(opt.exitDynamic==='entoure') shared.exit = someoneSharesBed() ? 'leo' : 'miro';
        }
        if(step==='q0b' && opt){
          _game.answers.q0b=opt;
          if(opt.close){
            var g=GAMES[_game.theme];
            gamePersistRun(_game.theme, null, gameAnswersForStorage(), null, true);
            if(typeof isUnlocked!=='function' || isUnlocked(g.agent)) wakeAgent(g.agent);
            clearTimeout(_gameRevealTimer);
            _game.step='closed';
            gameRenderClosed();
            return;
          }
          if(opt.skipToIrregular){ _game.branch='irregular'; _game.skipQ2=true; }
          gameAdvance('q0b');
          return;
        }
      }
    }catch(e){}
    return base.apply(this, arguments);
  };
})();
(function(){
  var base=gameRenderQuestion;
  if(typeof base!=='function') return;
  window.gameRenderQuestion=function(step){
    var r=base.apply(this, arguments);
    if(step==='q0b'){ var qn=document.querySelector('#game-inner .game-qn'); if(qn) qn.textContent='Avant de commencer'; }
    return r;
  };
})();
/* restitution : la sous-question préalable (« ça revient par périodes ») ouvre le résumé,
   et la question 1 reprend sa place quand la question 2 n'a pas été posée */
(function(){
  var base=gameRenderRestitution;
  if(typeof base!=='function') return;
  window.gameRenderRestitution=function(){
    var r=base.apply(this, arguments);
    try{
      if(_game && _game.answers.q0b && _game.answers.q0b.restit){
        var p=document.querySelector('#game-inner .game-restit p');
        if(p) p.textContent=_game.answers.q0b.restit+' '+p.textContent;
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── points d'attention pour le professionnel ─────────── */
var ATTENTION_RULES=[
  {theme:'sommeil', test:function(a){ return a.q2==='Je dors, mais ça ne repose pas' && a.q1==='Je ne sais plus'; },
   tx:'Nuits : « je dors, mais ça ne repose pas » et « je ne sais plus » depuis quand elles reposent'},
  {theme:'travail', test:function(a){ return a.q2==='Trop de charge, je ne tiens plus le rythme'; },
   tx:'Travail : « trop de charge, je ne tiens plus le rythme »'},
  {theme:'lien', test:function(a){ return a.q2==="Je n'ai plus personne à appeler"; },
   tx:'Lien social : « je n’ai plus personne à appeler »'}
];
function attentionPoints(){
  var runs=state.gameRuns||{};
  return ATTENTION_RULES.map(function(rule){
    var n=(runs[rule.theme]||[]).filter(function(r){ return r.completed && r.answers && rule.test(r.answers); }).length;
    return n>=2 ? {tx:rule.tx, n:n} : null;
  }).filter(Boolean);
}
(function(){
  var base=renderProDashboard;
  if(typeof base!=='function') return;
  window.renderProDashboard=function(){
    var r=base.apply(this, arguments);
    try{
      var pts=attentionPoints(); if(!pts.length) return r;
      var body=$('pd-body'); if(!body) return r;
      var h='<div class="block-title">Points d’attention</div><div class="pro-card"><div class="pro-blk">'
        +pts.map(function(p){ return '<div class="pro-tx" style="margin-bottom:6px">'+escapeHtml(p.tx)+', '+p.n+' passages.</div>'; }).join('')
        +'</div></div>';
      var titles=body.querySelectorAll('.block-title'), hist=null;
      for(var i=0;i<titles.length;i++){ if(/Historique des bilans/.test(titles[i].textContent)){ hist=titles[i]; break; } }
      if(hist) hist.insertAdjacentHTML('beforebegin', h); else body.insertAdjacentHTML('beforeend', h);
    }catch(e){}
    return r;
  };
})();
