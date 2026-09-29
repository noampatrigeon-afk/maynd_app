/* ══════════════════════════════════════════════════════════════════════════
   JEUX, LOT 1 — Sol, Felix, Naoki, Atlas, Ava (dossier collé le 29/09/2026).
   Avec ce lot, tous les accompagnants ont leur jeu, sauf Nora (en attente de
   relecture par le professionnel).

   - Sol : aucun temps de réflexion (reflectionMs 0, les réponses s'affichent
     tout de suite — « un compte à rebours sur le jeu de l'anxiété est un
     contresens »).
   - « X ou Y » dans les sorties : X est la sortie, Y proposé en plus (`second`),
     comme pour les lots précédents.
   - Atlas et Ava : le dossier ne dit pas où mène « Je ne sais pas » ; laissé
     chez l'accompagnant du jeu.

   Comme pour les autres lots, écrits ici et à relire : restitutions, réponses
   des branches courtes, libellés.
   ══════════════════════════════════════════════════════════════════════════ */

GAMES.anxiete = {
  agent:'sol',
  label:'Ce qui monte',
  accroche:'Cinq questions. Aucun chrono ici.',
  reflectionMs:0,
  q1:{
    title:"La dernière fois que tu t'es senti vraiment tranquille.",
    options:[
      {label:"Aujourd'hui", restit:"Aujourd'hui, tu t'es senti vraiment tranquille."},
      {label:'Cette semaine', restit:"La dernière fois que tu t'es senti vraiment tranquille, c'était cette semaine."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu t'es senti vraiment tranquille, c'était ce mois-ci."},
      {label:'Cette année', restit:"La dernière fois que tu t'es senti vraiment tranquille, c'était cette année."},
      {label:"Il y a plus d'un an", restit:"Tu ne t'es pas senti vraiment tranquille depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu t'es senti vraiment tranquille."}
  },
  q2:{
    title:'En ce moment, ce qui monte.',
    options:[
      {label:'Rien de particulier', branch:'short'},
      {label:'Ça tourne dans ma tête', branch:'normal', restit:'En ce moment, ça tourne dans ta tête.'},
      {label:'Ça se sent dans mon corps', branch:'normal', restit:'En ce moment, ça se sent dans ton corps.'},
      {label:"Ça arrive d'un coup, sans prévenir", branch:'normal', restit:"En ce moment, ça arrive d'un coup, sans prévenir."},
      {label:"C'est là en fond, tout le temps", branch:'normal', restit:"En ce moment, c'est là en fond, tout le temps."}
    ],
    dropout:{label:'Ça dépend des jours', branch:'irregular', restit:'Ça dépend des jours.'}
  },
  q3:{
    title:'Ce qui déclenche le plus souvent.',
    titleIrregular:'Ce qui fait la différence entre un jour calme et un jour où ça monte.',
    options:[
      {label:'Le travail', exit:'mateo', restit:"Ce qui déclenche le plus souvent, c'est le travail."},
      {label:'Les autres, les situations sociales', exit:'iris', second:'otis', restit:'Ce qui déclenche le plus souvent, ce sont les autres, les situations sociales.'},
      {label:"Ce qui m'attend, l'avenir", exit:'atlas', restit:"Ce qui déclenche le plus souvent, c'est ce qui t'attend."},
      {label:'Mon corps, la fatigue', exit:'miro', restit:"Ce qui déclenche le plus souvent, c'est ton corps, la fatigue."}
    ],
    dropout:{label:'Je ne sais pas', exit:'mia', restit:'Tu ne saurais pas dire ce qui déclenche le plus souvent.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Respirer, me calmer sur le moment', restit:"Tu as essayé de te calmer sur le moment, ça n'a pas suffi."},
      {label:'Éviter les situations', restit:"Tu as évité les situations, ça n'a pas suffi."},
      {label:'Bouger, me dépenser', restit:"Tu as bougé, tu t'es dépensé, ça n'a pas suffi."},
      {label:"En parler à quelqu'un", restit:"Tu en as parlé à quelqu'un, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Essayer quelque chose quand ça monte', restit:'Tu te sens capable d’essayer quelque chose quand ça monte.'},
      {label:'Juste repérer les moments', restit:'Tu te sens capable de juste repérer les moments.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça va.',
      options:[
        {label:'Depuis toujours', restit:'Ça va depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ça va depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Un rythme qui me convient', restit:'Ce qui tient, c’est un rythme qui te convient.'},
        {label:'Des gens sur qui compter', restit:'Ce qui tient, ce sont des gens sur qui compter.'},
        {label:'Je sais ce qui me fait du bien', restit:'Ce qui tient, c’est que tu sais ce qui te fait du bien.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucune suggestion d'exercice dans le jeu ; la respiration appartient
     à la conversation avec Sol. La restitution de « respirer » reste un constat. */
};

GAMES.confiance = {
  agent:'felix',
  label:'La voix dans ta tête',
  accroche:'Cinq questions sur la voix que tu as dans la tête.',
  reflectionMs:20000,
  q1:{
    title:'La dernière fois que tu as été fier de toi.',
    options:[
      {label:'Cette semaine', restit:'La dernière fois que tu as été fier de toi, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as été fier de toi, c’était ce mois-ci.'},
      {label:'Ces derniers mois', restit:'La dernière fois que tu as été fier de toi, c’était ces derniers mois.'},
      {label:'Cette année', restit:'La dernière fois que tu as été fier de toi, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas été fier de toi depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as été fier de toi.'}
  },
  q2:{
    title:'En ce moment, la façon dont tu te parles.',
    options:[
      {label:'Plutôt correcte', branch:'short'},
      {label:'Dure quand je rate quelque chose', branch:'normal', restit:'Tu te parles durement quand tu rates quelque chose.'},
      {label:'Dure tout le temps', branch:'normal', restit:'Tu te parles durement, tout le temps.'},
      {label:'Je me compare beaucoup', branch:'normal', restit:'Tu te compares beaucoup.'},
      {label:"Je n'ose pas, alors je n'essaie pas", branch:'normal', restit:"Tu n'oses pas, alors tu n'essaies pas."}
    ],
    dropout:{label:'Ça dépend des moments', branch:'irregular', restit:'Ça dépend des moments.'}
  },
  q3:{
    title:'Là où ça se joue le plus.',
    titleIrregular:'Ce qui fait la différence entre un moment où tu te tiens et un moment où ça dérape.',
    options:[
      {label:'Au travail', exit:'mateo', restit:"C'est au travail que ça se joue le plus."},
      {label:'Avec mes proches', exit:'leo', restit:"C'est avec tes proches que ça se joue le plus."},
      {label:'Avec des gens que je connais peu', exit:'otis', restit:"C'est avec des gens que tu connais peu que ça se joue le plus."},
      {label:'Quand je suis seul', exit:'atlas', second:'iris', restit:"C'est quand tu es seul que ça se joue le plus."}
    ],
    dropout:{label:'Partout pareil', exit:'felix', restit:'Ça se joue partout pareil.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Me raisonner sur le moment', restit:"Tu as essayé de te raisonner sur le moment, ça n'a pas suffi."},
      {label:'Éviter les situations', restit:"Tu as évité les situations, ça n'a pas suffi."},
      {label:'Me préparer davantage', restit:"Tu t'es préparé davantage, ça n'a pas suffi."},
      {label:"En parler à quelqu'un", restit:"Tu en as parlé à quelqu'un, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Repérer ce que je me dis', restit:'Tu te sens capable de repérer ce que tu te dis.'},
      {label:"Tenter une chose que j'évite d'habitude", restit:"Tu te sens capable de tenter une chose que tu évites d'habitude."},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça va.',
      options:[
        {label:'Depuis toujours', restit:'Tu te parles correctement depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Tu te parles correctement depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je sais ce que je vaux', restit:'Ce qui tient, c’est que tu sais ce que tu vaux.'},
        {label:'Je me compare moins', restit:'Ce qui tient, c’est que tu te compares moins.'},
        {label:'Des gens qui me voient tel que je suis', restit:'Ce qui tient, ce sont des gens qui te voient tel que tu es.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : la question 1 cherche une fierté, pas une réussite ; aucune
     restitution ne la reformule en performance. */
};

GAMES.discipline = {
  agent:'naoki',
  label:'Ce que tu tiens',
  accroche:'Cinq questions sur ce que tu arrives à tenir.',
  reflectionMs:20000,
  q1:{
    title:"La dernière fois que tu as tenu quelque chose jusqu'au bout.",
    options:[
      {label:'Cette semaine', restit:"La dernière fois que tu as tenu quelque chose jusqu'au bout, c'était cette semaine."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu as tenu quelque chose jusqu'au bout, c'était ce mois-ci."},
      {label:'Ce trimestre', restit:"La dernière fois que tu as tenu quelque chose jusqu'au bout, c'était ce trimestre."},
      {label:'Cette année', restit:"La dernière fois que tu as tenu quelque chose jusqu'au bout, c'était cette année."},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas tenu quelque chose jusqu'au bout depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu as tenu quelque chose jusqu'au bout."}
  },
  q2:{
    title:'En ce moment, tes journées.',
    options:[
      {label:'Elles tiennent debout', branch:'short'},
      {label:"Je démarre bien et j'abandonne", branch:'normal', restit:'Tu démarres bien, puis tu abandonnes.'},
      {label:"Je n'arrive pas à démarrer", branch:'normal', restit:"Tu n'arrives pas à démarrer."},
      {label:'Je fais, mais dans le désordre', branch:'normal', restit:'Tu fais, mais dans le désordre.'},
      {label:"J'en fais trop et je craque", branch:'normal', restit:'Tu en fais beaucoup, puis tu craques.'}
    ],
    dropout:{label:'Ça change toutes les semaines', branch:'irregular', restit:'Ça change toutes les semaines.'}
  },
  q3:{
    title:'Ce qui fait décrocher le plus souvent.',
    titleIrregular:'Ce qui fait la différence entre une semaine qui tient et une semaine qui part.',
    options:[
      {label:"Le manque d'énergie", exit:'miro', restit:"Ce qui fait décrocher le plus souvent, c'est le manque d'énergie."},
      {label:'Les imprévus, les autres', exit:'otis', restit:'Ce qui fait décrocher le plus souvent, ce sont les imprévus, les autres.'},
      {label:"Le manque d'envie", exit:'atlas', restit:"Ce qui fait décrocher le plus souvent, c'est le manque d'envie."},
      {label:'Des objectifs trop gros', exit:'naoki', restit:'Ce qui fait décrocher le plus souvent, ce sont des objectifs trop gros.'}
    ],
    dropout:{label:'Je ne sais pas', exit:'mia', restit:'Tu ne saurais pas dire ce qui fait décrocher.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Des listes, un agenda', restit:"Tu as essayé les listes, l'agenda, ça n'a pas suffi."},
      {label:'Découper en plus petit', restit:"Tu as découpé en plus petit, ça n'a pas suffi."},
      {label:'Me forcer', restit:"Tu t'es forcé, ça n'a pas suffi."},
      {label:'Changer mon environnement', restit:"Tu as changé ton environnement, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Tenir une seule chose', restit:'Tu te sens capable de tenir une seule chose.'},
      {label:'Observer ce qui se passe', restit:"Tu te sens capable d'observer ce qui se passe."},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça tient.',
      options:[
        {label:'Depuis toujours', restit:'Tes journées tiennent depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Tes journées tiennent depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça tient mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Des habitudes simples', restit:'Ce qui tient, ce sont des habitudes simples.'},
        {label:'Un cadre qui me convient', restit:'Ce qui tient, c’est un cadre qui te convient.'},
        {label:'Je ne vise pas trop gros', restit:'Ce qui tient, c’est que tu ne vises pas trop gros.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : « j'en fais trop et je craque » n'est jamais valorisé — restitué
     comme les autres réponses, sans « beaucoup d'efforts » ni rien qui ressemble à un compliment. */
};

GAMES.sens = {
  agent:'atlas',
  label:'Ce qui compte pour toi',
  accroche:'Cinq questions sur ce qui compte pour toi.',
  reflectionMs:20000,
  q1:{
    title:"La dernière fois que tu t'es senti vraiment à ta place.",
    options:[
      {label:'Ces jours-ci', restit:"Ces jours-ci, tu t'es senti vraiment à ta place."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu t'es senti vraiment à ta place, c'était ce mois-ci."},
      {label:'Cette année', restit:"La dernière fois que tu t'es senti vraiment à ta place, c'était cette année."},
      {label:'Il y a quelques années', restit:"La dernière fois que tu t'es senti vraiment à ta place, c'était il y a quelques années."},
      {label:'Il y a très longtemps', restit:"La dernière fois que tu t'es senti vraiment à ta place, c'était il y a très longtemps."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu t'es senti vraiment à ta place."}
  },
  q2:{
    title:'En ce moment, ce que tu fais de tes journées.',
    options:[
      {label:'Ça me ressemble', branch:'short'},
      {label:'Ça tourne, mais ça ne veut plus dire grand-chose', branch:'normal', restit:'Ça tourne, mais ça ne veut plus dire grand-chose.'},
      {label:"Je fais ce qu'on attend de moi", branch:'normal', restit:"Tu fais ce qu'on attend de toi."},
      {label:'Je ne sais plus ce que je veux', branch:'normal', restit:'Tu ne sais plus ce que tu veux.'},
      {label:"Je sais ce que je veux mais je n'y vais pas", branch:'normal', restit:"Tu sais ce que tu veux, mais tu n'y vas pas."}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  q3:{
    title:"Depuis quand c'est là.",
    titleIrregular:"Ce qui fait la différence entre une période où ça a du sens et une période où ça n'en a plus.",
    options:[
      {label:'Depuis un changement précis', exit:'atlas', restit:"C'est là depuis un changement précis."},
      {label:"Depuis longtemps, ça s'est installé", exit:'atlas', restit:"C'est là depuis longtemps, ça s'est installé."},
      {label:"Depuis que j'ai atteint ce que je visais", exit:'mateo', second:'kael', restit:"C'est là depuis que tu as atteint ce que tu visais."},
      {label:"Depuis que quelque chose s'est arrêté", exit:'atlas', second:'ava', restit:"C'est là depuis que quelque chose s'est arrêté."}
    ],
    dropout:{label:'Je ne sais pas', exit:'atlas', restit:'Tu ne saurais pas dire depuis quand c’est là.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Changer quelque chose dans ma vie', restit:"Tu as changé quelque chose dans ta vie, ça n'a pas suffi."},
      {label:'Attendre que ça passe', restit:"Tu as attendu que ça passe, ça n'a pas suffi."},
      {label:'En parler autour de moi', restit:"Tu en as parlé autour de toi, ça n'a pas suffi."},
      {label:"Me remplir, m'occuper", restit:"Tu t'es rempli, tu t'es occupé, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Regarder ça de près', restit:'Tu te sens capable de regarder ça de près.'},
      {label:'Faire une chose qui me ressemble', restit:'Tu te sens capable de faire une chose qui te ressemble.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça te ressemble.',
      options:[
        {label:'Depuis toujours', restit:'Ce que tu fais te ressemble depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ce que tu fais te ressemble depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça te ressemble davantage depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je sais ce qui compte pour moi', restit:'Ce qui tient, c’est que tu sais ce qui compte pour toi.'},
        {label:'Mes choix me ressemblent', restit:'Ce qui tient, c’est que tes choix te ressemblent.'},
        {label:'Je prends le temps de me poser la question', restit:'Ce qui tient, c’est que tu prends le temps de te poser la question.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : la question 3 porte sur la chronologie, pas sur la cause. */
};

GAMES.emotions = {
  agent:'ava',
  label:'Ce que tu ressens',
  accroche:'Cinq questions. Tu peux t’arrêter quand tu veux.',
  reflectionMs:20000,
  q1:{
    title:'La dernière fois que tu as laissé sortir ce que tu ressentais.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu as laissé sortir ce que tu ressentais.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as laissé sortir ce que tu ressentais, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as laissé sortir ce que tu ressentais, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as laissé sortir ce que tu ressentais, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas laissé sortir ce que tu ressentais depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as laissé sortir ce que tu ressentais.'}
  },
  q2:{
    title:'En ce moment, ce que tu ressens.',
    options:[
      {label:'Ça circule, ça va', branch:'short'},
      {label:"C'est lourd et ça ne bouge pas", branch:'normal', restit:"En ce moment, c'est lourd et ça ne bouge pas."},
      {label:"Ça déborde d'un coup", branch:'normal', restit:"En ce moment, ça déborde d'un coup."},
      {label:'Je ne sens plus grand-chose', branch:'normal', restit:'En ce moment, tu ne sens plus grand-chose.'},
      {label:'Je le garde pour moi', branch:'normal', restit:'En ce moment, tu le gardes pour toi.'}
    ],
    dropout:{label:'Ça change tout le temps', branch:'irregular', restit:'Ça change tout le temps.'}
  },
  q3:{
    title:'Ce qui pèse le plus en ce moment.',
    titleIrregular:'Ce qui fait la différence entre un moment où ça passe et un moment où ça pèse.',
    options:[
      {label:"Quelqu'un que j'ai perdu", exit:'ava', restit:"Ce qui pèse le plus, c'est quelqu'un que tu as perdu."},
      {label:'Une relation qui a changé', exit:'leo', restit:"Ce qui pèse le plus, c'est une relation qui a changé."},
      {label:"Quelque chose qui s'est terminé", exit:'atlas', restit:"Ce qui pèse le plus, c'est quelque chose qui s'est terminé."},
      {label:"Je n'arrive pas à le nommer", exit:'ava', restit:"Ce qui pèse le plus, tu n'arrives pas à le nommer."}
    ],
    dropout:{label:'Je ne sais pas', exit:'ava', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'En parler à des proches', restit:'Tu en as parlé à des proches.'},
      {label:"M'occuper, tenir le rythme", restit:"Tu t'es occupé, tu as tenu le rythme."},
      {label:'Laisser passer le temps', restit:'Tu as laissé passer le temps.'},
      {label:'Un accompagnement', restit:'Tu as essayé un accompagnement.'}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Mettre des mots dessus', restit:'Tu te sens capable de mettre des mots dessus.'},
      {label:'Juste laisser passer', restit:'Tu te sens capable de juste laisser passer.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça circule.',
      options:[
        {label:'Depuis toujours', restit:'Ça circule depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ça circule depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça circule mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je peux en parler', restit:'Ce qui tient, c’est que tu peux en parler.'},
        {label:'Je laisse de la place à ce que je ressens', restit:'Ce qui tient, c’est la place que tu laisses à ce que tu ressens.'},
        {label:'Des gens autour de moi', restit:'Ce qui tient, ce sont des gens autour de toi.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier (et règle d'Ava, CLAUDE.md) : jamais d'étape, jamais de progression
     attendue, jamais de vocabulaire de phase. La question 4 est restituée sans « ça n'a pas
     suffi » : ce qui a été fait face à une perte n'a pas à « suffire ». */
};
