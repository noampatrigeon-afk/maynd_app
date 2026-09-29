/* ══════════════════════════════════════════════════════════════════════════
   JEU DE NORA + SIGNAUX AU PROFESSIONNEL — 29/09/2026.

   Le dossier demandait une relecture par le professionnel du mental avant mise
   en service. Le porteur du projet a levé cette condition (« pour le pro du
   mental oublie, fais au mieux ») : les choix ci-dessous sont les miens,
   volontairement prudents, et restent à faire relire dès que possible.

   NORA
   - Observation et substitution uniquement : aucune option de réduction, de
     privation, de contrôle ou d'objectif ; aucun chiffre ; aucune option sur ce
     que la personne mange ; jamais Neo en sortie.
   - Question 2 : variante « manger » si la question préalable parle
     d'alimentation (« mon rapport à ce que je mange », « les deux à la fois »).
   - « Rien de particulier » : une seule question, « est-ce que ça a déjà été le
     cas » ; « non, jamais » et « c'est derrière moi » ferment aussitôt (moteur du
     lot 0 : q0b / close / skipToIrregular).
   - ARRÊT ANTICIPÉ (règle choisie ici, le dossier ne donnait que des familles de
     signaux sans réponse correspondante) : « un rapport au corps qui pèse
     fortement et durablement ». Durablement = question 1 « il y a plusieurs
     années » ou « jamais vraiment ». Fortement = question 2 « ça prend beaucoup de
     place dans ma tête », « j'y pense souvent dans la journée », « je m'évite, je
     ne me regarde pas » ou « je mange beaucoup dans certains moments ». Les deux
     ensemble arrêtent le jeu juste après la question 2 (après la question 1 sur
     la reprise « ça revient par périodes », où la question 2 n'est pas posée),
     avec une phrase calme et une orientation humaine. Aucun mot clinique, aucune
     alerte.

   SIGNAUX (un des quatre du plan d'affaires : « blocage », intervention rapide)
   - Nora : un arrêt anticipé dans les 30 derniers jours.
   - Neo : une combinaison « c'est tous les jours » ou « j'ai du mal à m'arrêter »
     avec « il y a plus d'un an » ou « je ne sais plus » à la question 1, dans les
     30 derniers jours.
   - Mateo (« trop de charge ») et Iris (« plus personne à appeler ») : réponse
     répétée sur au moins deux passages terminés. Ils quittent donc les points
     d'attention de 28-jeux-lot-0.js, où seul Miro reste.
   ══════════════════════════════════════════════════════════════════════════ */

var NORA_FOOD_Q0=['Mon rapport à ce que je mange','Les deux premiers à la fois'];
var NORA_DURABLE=['Il y a plusieurs années','Jamais vraiment'];
var NORA_FORT=['Ça prend beaucoup de place dans ma tête',"J'y pense souvent dans la journée",'Je m’évite, je ne me regarde pas','Je mange beaucoup dans certains moments'];

GAMES.corps = {
  agent:'nora',
  label:'Ton rapport au corps',
  accroche:'Cinq questions. Aucun conseil, aucun jugement, et tu peux t’arrêter quand tu veux.',
  reflectionMs:20000,
  q0:{
    title:'Ce dont tu veux parler.',
    options:[
      {label:'Comment je me sens dans mon corps', restit:'Tu veux parler de comment tu te sens dans ton corps.'},
      {label:'Mon rapport à ce que je mange', restit:'Tu veux parler de ton rapport à ce que tu manges.'},
      {label:'Le regard que je porte sur moi', restit:'Tu veux parler du regard que tu portes sur toi.'},
      {label:'Les deux premiers à la fois', restit:'Tu veux parler de ton corps et de ce que tu manges.'}
    ],
    dropout:{label:'Rien de particulier en ce moment', sub:true}
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
    title:"La dernière fois que tu t'es senti bien dans ton corps.",
    options:[
      {label:'Ces jours-ci', restit:"Ces jours-ci, tu t'es senti bien dans ton corps."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu t'es senti bien dans ton corps, c'était ce mois-ci."},
      {label:'Cette année', restit:"La dernière fois que tu t'es senti bien dans ton corps, c'était cette année."},
      {label:'Il y a plusieurs années', restit:"La dernière fois que tu t'es senti bien dans ton corps, c'était il y a plusieurs années."},
      {label:'Jamais vraiment', restit:"Tu ne t'es jamais vraiment senti bien dans ton corps."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu t'es senti bien dans ton corps."}
  },
  q2:{
    title:'En ce moment, comment ça se passe.',
    options:[
      {label:'Ça me va', branch:'short'},
      {label:"J'y pense souvent dans la journée", branch:'normal', restit:"Tu y penses souvent dans la journée."},
      {label:'Je m’évite, je ne me regarde pas', branch:'normal', restit:'Tu t’évites, tu ne te regardes pas.'},
      {label:'Ça dépend beaucoup du regard des autres', branch:'normal', restit:'Ça dépend beaucoup du regard des autres.'},
      {label:'Ça prend beaucoup de place dans ma tête', branch:'normal', restit:'Ça prend beaucoup de place dans ta tête.'}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  /* variante « manger » (voir gameQuestionDefForKey plus bas) */
  q2Food:{
    title:'En ce moment, manger.',
    options:[
      {label:'Ça se passe bien', branch:'short'},
      {label:"Ça m'arrive de manger sans faim", branch:'normal', restit:"Ça t'arrive de manger sans faim."},
      {label:'Je mange beaucoup dans certains moments', branch:'normal', restit:'Tu manges beaucoup dans certains moments.'},
      {label:"J'y pense souvent dans la journée", branch:'normal', restit:"Tu y penses souvent dans la journée."}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  q3:{
    title:'Ce qui joue le plus.',
    titleIrregular:'Ce qui fait la différence entre une période où ça va et une période où ça pèse.',
    options:[
      {label:'Le stress', exit:'sol', restit:"Ce qui joue le plus, c'est le stress."},
      {label:"Les moments vides, l'ennui", exit:'atlas', second:'iris', restit:"Ce qui joue le plus, ce sont les moments vides, l'ennui."},
      {label:'Les autres, les comparaisons', exit:'felix', restit:'Ce qui joue le plus, ce sont les autres, les comparaisons.'},
      {label:'Des moments précis de la journée', exit:'naoki', restit:'Ce qui joue le plus, ce sont des moments précis de la journée.'}
    ],
    dropout:{label:'Je ne sais pas', exit:'nora', restit:'Tu ne saurais pas dire ce qui joue le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:"En parler à quelqu'un", restit:"Tu en as parlé à quelqu'un."},
      {label:'Changer quelque chose dans mes journées', restit:'Tu as changé quelque chose dans tes journées.'},
      {label:"Éviter d'y penser", restit:"Tu as essayé d'éviter d'y penser."},
      {label:'Un accompagnement', restit:'Tu as essayé un accompagnement.'}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Repérer les moments où ça arrive', restit:'Tu te sens capable de repérer les moments où ça arrive.'},
      {label:'Faire autre chose à ces moments-là', restit:'Tu te sens capable de faire autre chose à ces moments-là.'},
      {label:"En parler à quelqu'un", restit:"Tu te sens capable d'en parler à quelqu'un."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça te va.',
      options:[
        {label:'Depuis toujours', restit:'Ça te va depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ça te va depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je me laisse tranquille', restit:'Ce qui tient, c’est que tu te laisses tranquille.'},
        {label:'Je me compare moins', restit:'Ce qui tient, c’est que tu te compares moins.'},
        {label:"J'ai d'autres choses en tête", restit:'Ce qui tient, c’est que tu as d’autres choses en tête.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
};

/* ─────────── Nora : variante « manger » de la question 2 ─────────── */
(function(){
  var base=gameQuestionDefForKey;
  if(typeof base!=='function') return;
  window.gameQuestionDefForKey=function(g, key, branch){
    if(g===GAMES.corps && key==='q2' && _game && _game.theme==='corps' && _game.answers.q0 && NORA_FOOD_Q0.indexOf(_game.answers.q0.label)>=0) return g.q2Food;
    return base.apply(this, arguments);
  };
})();

/* ─────────── Nora : arrêt anticipé ─────────── */
function noraShouldStop(){
  if(!_game || _game.theme!=='corps') return false;
  var a=_game.answers;
  var durable = a.q1 && NORA_DURABLE.indexOf(a.q1.label)>=0;
  if(!durable) return false;
  if(_game.skipQ2) return true;                       /* « ça revient par périodes » + durable */
  return !!(a.q2 && NORA_FORT.indexOf(a.q2.label)>=0);
}
function noraRenderStop(){
  var paid=state.tier!=='free';
  $('game-inner').innerHTML='<div class="game-top"><span></span><button class="game-exit" onclick="gameClose()">Sortir</button></div>'
    +'<div class="game-sortie">'
    +'<p class="game-sortie-txt">Merci d’avoir répondu. On s’arrête là pour ce jeu&nbsp;: ce que tu décris mérite mieux que des questions à choix.</p>'
    +'<p class="game-stop-note">En parler à quelqu’un peut aider, à ton rythme.'+(paid?' Ton professionnel référent peut te lire, sans rendez-vous.':' Une personne de confiance, ou un professionnel de santé, peut t’écouter.')+'</p>'
    +(paid?'<button class="btn full" onclick="gameClose(); closeRecap(); closeEntourage(); openPro();">Écrire à mon professionnel référent</button>':'')
    +'<button class="btn '+(paid?'ghost ':'')+'full" style="margin-top:9px" onclick="gameClose(); startWithAgent(\'nora\');">Parler à Nora</button>'
    +'</div>';
}
(function(){
  var base=gameAdvance;
  if(typeof base!=='function') return;
  window.gameAdvance=function(fromStep){
    if(_game && _game.theme==='corps' && (fromStep==='q2' || (fromStep==='q1' && _game.skipQ2)) && noraShouldStop()){
      clearTimeout(_gameRevealTimer);
      var runs;
      gamePersistRun('corps', _game.branch, gameAnswersForStorage(), null, false);
      runs=(state.gameRuns||{}).corps||[]; if(runs.length){ runs[runs.length-1].stopped=true; persist(); }
      if(typeof isUnlocked!=='function' || isUnlocked('nora')) wakeAgent('nora');
      _game.step='stopped';
      noraRenderStop();
      return;
    }
    return base.apply(this, arguments);
  };
})();

/* ─────────── signaux au professionnel ─────────── */
var SIGNAL_DAYS=30;
function recentRuns(theme){
  var lim=Date.now()-SIGNAL_DAYS*86400000;
  return ((state.gameRuns||{})[theme]||[]).filter(function(r){ return r.at>=lim; });
}
function gameSignals(){
  var out=[], runs=state.gameRuns||{};
  if(recentRuns('corps').some(function(r){ return r.stopped; }))
    out.push({k:'blocage', d:'Le jeu de Nora s’est arrêté avant la fin et a orienté vers un accompagnement humain.', w:'Intervention rapide, hors cycle mensuel'});
  if(recentRuns('habitudes').some(function(r){ var a=r.answers||{}; return r.completed && ["C'est tous les jours","J'ai du mal à m'arrêter une fois lancé"].indexOf(a.q2)>=0 && ["Il y a plus d'un an",'Je ne sais plus'].indexOf(a.q1)>=0; }))
    out.push({k:'blocage', d:'Jeu de Neo : ce qui prend de la place est présent chaque jour, ou difficile à arrêter, depuis longtemps.', w:'Intervention rapide, hors cycle mensuel'});
  var rep=function(theme, q2){ return (runs[theme]||[]).filter(function(r){ return r.completed && r.answers && r.answers.q2===q2; }).length; };
  var n=rep('travail','Trop de charge, je ne tiens plus le rythme');
  if(n>=2) out.push({k:'blocage', d:'Jeu de Mateo : « trop de charge, je ne tiens plus le rythme », '+n+' passages.', w:'Intervention rapide, hors cycle mensuel'});
  n=rep('lien',"Je n'ai plus personne à appeler");
  if(n>=2) out.push({k:'blocage', d:'Jeu d’Iris : « je n’ai plus personne à appeler », '+n+' passages.', w:'Intervention rapide, hors cycle mensuel'});
  return out;
}
(function(){
  var base=proSignals;
  if(typeof base!=='function') return;
  window.proSignals=function(){
    var s=base.apply(this, arguments)||[];
    try{ s=s.concat(gameSignals()); }catch(e){}
    return s;
  };
})();
/* Mateo et Iris deviennent des signaux : ils quittent les points d'attention (seul Miro y reste) */
try{ ATTENTION_RULES=ATTENTION_RULES.filter(function(r){ return r.theme==='sommeil'; }); }catch(e){}
