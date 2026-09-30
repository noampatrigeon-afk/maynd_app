/* ══════════════════════════════════════════════════════════════════════════
   JEUX, LOT 2 — Leo, Otis, Kael, Mateo (dossier collé le 29/09/2026).
   Même gabarit que « sommeil » (18-moteur-des-jeux.js). Deux extensions du
   moteur, ici :
   - q0, question préalable facultative (Leo) : posée avant la question 1,
     sans numéro. Une option peut porter `direct` (fin immédiate du jeu vers
     cet accompagnant, rien d'autre n'est déroulé) et `second` (un second
     accompagnant proposé en sortie).
   - `second` aussi possible sur une sortie de question 3 (Kael : « le regard
     des autres » mène à Felix, Nora en second). Affiché par deckAddSecond()
     dans 22-retours-du-29-09.js.

   Contenu NON fourni par le dossier, écrit ici sur le modèle de « sommeil » et
   à faire relire : toutes les phrases de restitution (`restit`), les réponses
   des deux questions de branche courte, les libellés courts (`label`, affichés
   sur le bouton « Rejouer »).

   Pas encore fait : le signal au professionnel de Mateo (« trop de charge »
   répété dans le temps) — le dossier ne dit pas lequel des quatre signaux il
   déclenche, question posée au porteur du projet le 29/09.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── extensions du moteur ─────────── */
function gameOrder(){
  var g=GAMES[_game.theme];
  var pre=g.q0 ? ['q0'] : [];
  return pre.concat(_game.branch==='short'
    ? ['q1','q2','shortQ1','shortQ2','restitution','sortie']
    : ['q1','q2','q3','q4','q5','restitution','sortie']);
}
(function(){
  var base=openGame;
  if(typeof base!=='function') return;
  window.openGame=function(themeKey){
    var r=base.apply(this, arguments);
    /* la base démarre toujours sur q1 : on repart de la question préalable si le jeu en a une */
    if(_game && GAMES[themeKey] && GAMES[themeKey].q0 && _game.step==='q1'){ _game.step='q0'; gameRenderStep(); }
    return r;
  };
})();
(function(){
  var base=gameRenderQuestion;
  if(typeof base!=='function') return;
  window.gameRenderQuestion=function(step){
    var r=base.apply(this, arguments);
    if(step==='q0'){ var qn=document.querySelector('#game-inner .game-qn'); if(qn) qn.textContent='Avant de commencer'; }
    return r;
  };
})();
(function(){
  var base=gamePick;
  if(typeof base!=='function') return;
  window.gamePick=function(step, idx){
    if(step==='q0' && _game){
      var q=gameQuestionDef('q0'), opt=idx===-1 ? q.dropout : q.options[idx];
      if(opt && opt.direct && byId(opt.direct)){
        /* bascule directe : la série est enregistrée (une seule réponse), l'accompagnant du jeu
           est rencontré. Depuis le 30/09, c'est sa fiche qui s'ouvre (fin de jeu = fiche de
           l'accompagnant du jeu), l'accompagnant indiqué en première pastille. */
        var g=GAMES[_game.theme], wasAwake=agentAwake(g.agent);
        _game.answers.q0=opt;
        gamePersistRun(_game.theme, null, gameAnswersForStorage(), opt.direct, true);
        if(typeof isUnlocked!=='function' || isUnlocked(g.agent)) wakeAgent(g.agent);
        gameClose();
        if(recapOpen()) entRenderRecap();
        _gameLastExit=opt.direct;
        openAgentDeck(g.agent);
        deckAddSecond(g.agent, [opt.direct]);
        if(!wasAwake && agentAwake(g.agent) && typeof voiceRewardOnDeck==='function') voiceRewardOnDeck(g.agent);
        return;
      }
    }
    return base.apply(this, arguments);
  };
})();

/* ─────────── contenu ─────────── */
GAMES.relation = {
  agent:'leo',
  label:'Ta relation',
  accroche:"Cinq questions sur ta relation. On parle de toi, pas de l'autre.",
  reflectionMs:10000,
  q0:{
    title:'Où tu en es côté relation.',
    options:[
      {label:'En couple', restit:'Tu es en couple.'},
      {label:'Séparé récemment', restit:'Tu viens de te séparer.', second:'ava'},
      {label:'Seul depuis un moment', direct:'iris'},
      {label:"C'est compliqué à définir", restit:"Ta situation est compliquée à définir."}
    ],
    dropout:{label:'Je préfère ne pas préciser'}
  },
  q1:{
    title:"La dernière fois que tu t'es senti vraiment proche de l'autre.",
    options:[
      {label:'Ces jours-ci', restit:"Ces jours-ci, tu t'es senti proche de l'autre."},
      {label:'Cette semaine', restit:"La dernière fois que tu t'es senti vraiment proche, c'était cette semaine."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu t'es senti vraiment proche, c'était ce mois-ci."},
      {label:'Cette année', restit:"La dernière fois que tu t'es senti vraiment proche, c'était cette année."},
      {label:"Il y a plus d'un an", restit:"Tu ne t'es pas senti vraiment proche depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu t'es senti vraiment proche pour la dernière fois."}
  },
  q2:{
    title:'En ce moment, entre vous.',
    options:[
      {label:'Ça va bien', branch:'short'},
      {label:'On se parle moins', branch:'normal', restit:'En ce moment, vous vous parlez moins.'},
      {label:'On se dispute souvent', branch:'normal', restit:'En ce moment, vous vous disputez souvent.'},
      {label:"Je n'ose pas dire ce que je pense", branch:'normal', restit:"En ce moment, tu n'oses pas dire ce que tu penses."},
      {label:"Je m'éloigne sans savoir pourquoi", branch:'normal', restit:"En ce moment, tu t'éloignes sans savoir pourquoi."}
    ],
    dropout:{label:'Ça dépend des semaines', branch:'irregular', restit:'Ça dépend des semaines.'}
  },
  q3:{
    title:'De ton côté, ce qui revient le plus.',
    titleIrregular:"Ce qui fait la différence entre une semaine où ça va et une semaine où ça coince.",
    options:[
      {label:'Je garde pour moi', exit:'otis', restit:'De ton côté, tu gardes pour toi.'},
      {label:'Je réagis trop fort', exit:'sol', restit:'De ton côté, tu réagis trop fort.'},
      {label:"J'attends qu'on devine", exit:'otis', restit:"De ton côté, tu attends qu'on devine."},
      {label:'Je prends de la distance', exit:'atlas', restit:'De ton côté, tu prends de la distance.'}
    ],
    dropout:{label:'Je ne sais pas', exit:'leo', restit:'Tu ne saurais pas dire ce qui revient de ton côté.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'En parler à froid', restit:"Tu en as parlé à froid, ça n'a pas suffi."},
      {label:'Attendre que ça passe', restit:"Tu as attendu que ça passe, ça n'a pas suffi."},
      {label:'Faire des efforts de mon côté', restit:"Tu as fait des efforts de ton côté, ça n'a pas suffi."},
      {label:'Un accompagnement à deux', restit:"Tu as essayé un accompagnement à deux, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Dire une chose que je garde', restit:'Tu te sens capable de dire une chose que tu gardes.'},
      {label:'Observer ce qui se passe', restit:"Tu te sens capable d'observer ce qui se passe."},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça va.',
      options:[
        {label:'Depuis toujours', restit:'Ça va entre vous depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ça va entre vous depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je dis ce que je ressens', restit:'Ce qui tient, c’est que tu dis ce que tu ressens.'},
        {label:'Je prends du temps pour nous', restit:'Ce qui tient, c’est le temps que tu prends pour vous.'},
        {label:"Je laisse de la place à l'autre", restit:"Ce qui tient, c'est la place que tu laisses à l'autre."}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
};

GAMES.affirmation = {
  agent:'otis',
  label:'Ce que tu dis',
  accroche:'Cinq questions sur ce que tu arrives à dire.',
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu as dit non sans culpabiliser.',
    options:[
      {label:'Cette semaine', restit:'La dernière fois que tu as dit non sans culpabiliser, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as dit non sans culpabiliser, c’était ce mois-ci.'},
      {label:'Ces derniers mois', restit:'La dernière fois que tu as dit non sans culpabiliser, c’était ces derniers mois.'},
      {label:'Cette année', restit:'La dernière fois que tu as dit non sans culpabiliser, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas dit non sans culpabiliser depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as dit non sans culpabiliser.'}
  },
  q2:{
    title:'En ce moment, quand tu dois dire quelque chose de difficile.',
    options:[
      {label:'Je le dis', branch:'short'},
      {label:'Je le dis mal, ça sort de travers', branch:'normal', restit:'Quand tu dois dire quelque chose de difficile, ça sort de travers.'},
      {label:'Je repousse et je finis par ne rien dire', branch:'normal', restit:'Quand tu dois dire quelque chose de difficile, tu repousses et tu finis par ne rien dire.'},
      {label:"J'accepte des choses que je ne veux pas", branch:'normal', restit:'Tu acceptes des choses que tu ne veux pas.'},
      {label:"J'explose au bout d'un moment", branch:'normal', restit:"Tu gardes, puis tu exploses au bout d'un moment."}
    ],
    dropout:{label:'Ça dépend des gens', branch:'irregular', restit:'Ça dépend des gens.'}
  },
  q3:{
    title:"Avec qui c'est le plus dur.",
    titleIrregular:"Ce qui fait la différence entre les gens avec qui tu oses et ceux avec qui tu n'oses pas.",
    options:[
      {label:'Au travail', exit:'mateo', restit:"C'est au travail que c'est le plus dur."},
      {label:'Avec mes proches', exit:'otis', restit:"C'est avec tes proches que c'est le plus dur."},
      {label:'Avec mon ou ma partenaire', exit:'leo', restit:"C'est avec la personne qui partage ta vie que c'est le plus dur."},
      {label:'Avec des inconnus, dans la vie courante', exit:'felix', restit:"C'est avec des inconnus, dans la vie courante, que c'est le plus dur."}
    ],
    dropout:{label:'Avec tout le monde pareil', exit:'felix', restit:"C'est aussi dur avec tout le monde."}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Préparer ce que je vais dire', restit:"Tu as préparé ce que tu allais dire, ça n'a pas suffi."},
      {label:'Écrire plutôt que parler', restit:"Tu as écrit plutôt que parler, ça n'a pas suffi."},
      {label:'Éviter la situation', restit:"Tu as évité la situation, ça n'a pas suffi."},
      {label:'Me forcer sur le moment', restit:"Tu t'es forcé sur le moment, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Dire une chose que je repousse', restit:'Tu te sens capable de dire une chose que tu repousses.'},
      {label:'Repérer les moments où je me tais', restit:'Tu te sens capable de repérer les moments où tu te tais.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça se passe bien.',
      options:[
        {label:'Toujours', restit:'Tu arrives à dire les choses depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Tu arrives à dire les choses depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je sais ce que je veux', restit:'Ce qui tient, c’est que tu sais ce que tu veux.'},
        {label:"Je le dis tôt, avant que ça monte", restit:'Ce qui tient, c’est que tu le dis tôt, avant que ça monte.'},
        {label:'Je ne me sens plus obligé de me justifier', restit:'Ce qui tient, c’est que tu ne te sens plus obligé de te justifier.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : le jeu ne suggère jamais de formulation. Les phrases à dire
     appartiennent à la conversation avec Otis — aucune restitution ci-dessus n'en propose. */
};

GAMES.effort = {
  agent:'kael',
  label:"Ton rapport à l'effort",
  accroche:"Cinq questions sur ton rapport à l'effort.",
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu as pris du plaisir à bouger.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu as pris du plaisir à bouger.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as pris du plaisir à bouger, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as pris du plaisir à bouger, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as pris du plaisir à bouger, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas pris de plaisir à bouger depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as pris du plaisir à bouger.'}
  },
  q2:{
    title:"En ce moment, ton rapport à l'effort.",
    options:[
      {label:'Ça me va comme ça', branch:'short'},
      {label:"J'aimerais m'y mettre et je n'y arrive pas", branch:'normal', restit:"Tu aimerais t'y mettre et tu n'y arrives pas."},
      {label:"Je m'entraîne mais sans plaisir", branch:'normal', restit:"Tu t'entraînes, mais sans plaisir."},
      {label:"Je m'en veux quand je rate une séance", branch:'normal', restit:"Tu t'en veux quand tu rates une séance."},
      {label:"J'en fais trop et mon corps suit mal", branch:'normal', restit:'Tu en fais beaucoup, et ton corps suit mal.'}
    ],
    dropout:{label:'Ça part et ça revient', branch:'irregular', restit:'Ça part et ça revient.'}
  },
  q3:{
    title:'Ce qui pèse le plus là-dedans.',
    titleIrregular:'Ce qui fait la différence entre une période où tu bouges et une période où tu t’arrêtes.',
    options:[
      {label:'Le manque de temps', exit:'mateo', restit:"Ce qui pèse le plus, c'est le manque de temps."},
      {label:"Le manque d'énergie", exit:'miro', restit:"Ce qui pèse le plus, c'est le manque d'énergie."},
      {label:"Ce que je m'impose", exit:'felix', restit:"Ce qui pèse le plus, c'est ce que tu t'imposes."},
      {label:'Le regard des autres, la comparaison', exit:'felix', second:'nora', restit:"Ce qui pèse le plus, c'est le regard des autres."}
    ],
    dropout:{label:'Je ne sais pas', exit:'kael', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Me fixer un programme', restit:"Tu t'es fixé un programme, ça n'a pas suffi."},
      {label:'Réduire mes attentes', restit:"Tu as réduit tes attentes, ça n'a pas suffi."},
      {label:"Changer d'activité", restit:"Tu as changé d'activité, ça n'a pas suffi."},
      {label:"M'entraîner avec quelqu'un", restit:"Tu t'es entraîné avec quelqu'un, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Bouger une fois, sans objectif', restit:'Tu te sens capable de bouger une fois, sans objectif.'},
      {label:"Regarder ce que je m'impose", restit:"Tu te sens capable de regarder ce que tu t'imposes."},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça te va.',
      options:[
        {label:'Depuis toujours', restit:'Ton rapport à l’effort te va depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ton rapport à l’effort te va depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je bouge pour le plaisir', restit:'Ce qui tient, c’est que tu bouges pour le plaisir.'},
        {label:"J'ai trouvé un rythme qui me va", restit:'Ce qui tient, c’est le rythme que tu as trouvé.'},
        {label:"Je ne m'impose rien", restit:'Ce qui tient, c’est que tu ne t’imposes rien.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucune option ne valorise le volume, aucune mention de poids, de
     forme, de performance chiffrée ni d'apparence. « J'en fais trop » est restitué sans
     jugement (« tu en fais beaucoup »). Le rapport au corps sort vers Nora, jamais commenté. */
};

GAMES.travail = {
  agent:'mateo',
  label:'Ton travail',
  accroche:'Cinq questions sur ton travail.',
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu as fini une journée satisfait.',
    options:[
      {label:'Aujourd’hui ou hier', restit:'Aujourd’hui ou hier, tu as fini une journée satisfait.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as fini une journée satisfait, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as fini une journée satisfait, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as fini une journée satisfait, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas fini une journée satisfait depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as fini une journée satisfait.'}
  },
  q2:{
    title:'En ce moment, ton travail.',
    options:[
      {label:'Ça me va', branch:'short'},
      {label:'Trop de charge, je ne tiens plus le rythme', branch:'normal', restit:'En ce moment, il y a trop de charge et tu ne tiens plus le rythme.'},
      {label:"Ça tourne, mais ça m'ennuie", branch:'normal', restit:"En ce moment, ça tourne, mais ça t'ennuie."},
      {label:"L'ambiance est difficile", branch:'normal', restit:"En ce moment, l'ambiance est difficile."},
      {label:"Je me demande si c'est encore pour moi", branch:'normal', restit:"En ce moment, tu te demandes si c'est encore pour toi."}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  q3:{
    title:'Ce qui pèse le plus.',
    titleIrregular:'Ce qui fait la différence entre une période qui va et une période qui pèse.',
    options:[
      {label:'La quantité de travail', exit:'naoki', restit:"Ce qui pèse le plus, c'est la quantité de travail."},
      {label:'Les relations, la hiérarchie', exit:'otis', restit:'Ce qui pèse le plus, ce sont les relations et la hiérarchie.'},
      {label:'Le contenu de ce que je fais', exit:'atlas', restit:"Ce qui pèse le plus, c'est le contenu de ce que tu fais."},
      {label:'Le manque de reconnaissance', exit:'felix', restit:"Ce qui pèse le plus, c'est le manque de reconnaissance."}
    ],
    dropout:{label:'Je ne sais pas', exit:'mateo', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'En parler à ma hiérarchie', restit:"Tu en as parlé à ta hiérarchie, ça n'a pas suffi."},
      {label:'Poser des limites', restit:"Tu as posé des limites, ça n'a pas suffi."},
      {label:'Attendre que ça change', restit:"Tu as attendu que ça change, ça n'a pas suffi."},
      {label:'Chercher ailleurs', restit:"Tu as cherché ailleurs, ça n'a pas encore abouti."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Poser une limite précise', restit:'Tu te sens capable de poser une limite précise.'},
      {label:'Regarder ce qui pèse vraiment', restit:'Tu te sens capable de regarder ce qui pèse vraiment.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça va.',
      options:[
        {label:'Depuis toujours', restit:'Ton travail te va depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ton travail te va depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Une charge que je tiens', restit:'Ce qui tient, c’est une charge que tu arrives à tenir.'},
        {label:"Les gens avec qui je travaille", restit:'Ce qui tient, ce sont les gens avec qui tu travailles.'},
        {label:'Un travail qui a du sens pour moi', restit:'Ce qui tient, c’est un travail qui a du sens pour toi.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : « trop de charge » répété dans le temps est un signal pour le
     professionnel. Aucun mot clinique affiché, aucune alerte, aucun changement de ton.
     Le branchement vers proSignals() reste à faire (voir l'en-tête). */
};
