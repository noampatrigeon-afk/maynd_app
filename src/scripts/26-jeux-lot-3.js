/* ══════════════════════════════════════════════════════════════════════════
   JEUX, LOT 3 — Soren, Iris, Eden, Vince (dossier collé le 29/09/2026).
   Même gabarit que les lots précédents (voir 18-moteur-des-jeux.js et
   24-jeux-lot-2.js pour q0 / direct / second).

   Comme pour le lot 2, contenu NON fourni par le dossier, écrit ici et à faire
   relire : phrases de restitution, réponses de la branche courte, libellés.

   Écarts et points ouverts, signalés au porteur du projet le 29/09 :
   - Vince, question 2 : le dossier écrit « Je me prive alors que je pourrais
     pas » (contradictoire). Mis ici : « Je me prive alors que je pourrais me le
     permettre », qui semble être le sens voulu.
   - Eden : « toute inquiétude d'ordre médical sort du jeu vers un
     professionnel de santé » — aucune option du dossier n'exprime une
     inquiétude médicale, rien n'est donc branché.
   - Iris (« je n'ai plus personne à appeler ») et Mateo (lot 2) : signal au
     professionnel à brancher dès que le signal à utiliser est choisi parmi les
     quatre.
   ══════════════════════════════════════════════════════════════════════════ */

/* Soren — cadrage du dossier : « aucun conseil d'éducation, jamais, ni dans le jeu ni en
   conversation ». Ajouté à sa consigne, sur le modèle de l'ajout à MIA (17-refonte-intelligence.js). */
if(typeof DEFAULT_PERSONAS!=='undefined' && DEFAULT_PERSONAS.soren){
  DEFAULT_PERSONAS.soren = DEFAULT_PERSONAS.soren + " Tu ne donnes jamais de conseil d'éducation : ni méthode, ni règle, ni façon de faire avec l'enfant. Tu travailles ce que la personne vit, pas la manière d'élever. Tu dis toujours « l'autre parent », jamais « le père » ni « la mère ».";
}

GAMES.parentalite = {
  agent:'soren',
  label:'Ta vie de parent',
  accroche:'Cinq questions sur ce que ça change pour toi.',
  reflectionMs:10000,
  q0:{
    title:'Où tu en es.',
    options:[
      {label:"J'attends un enfant", restit:'Tu attends un enfant.'},
      {label:"J'ai un tout-petit", restit:'Tu as un tout-petit.'},
      {label:"J'ai un enfant plus grand", restit:'Tu as un enfant plus grand.'},
      {label:"J'ai plusieurs enfants", restit:'Tu as plusieurs enfants.'},
      {label:"C'est en projet", restit:'Devenir parent est en projet.'}
    ],
    dropout:{label:'Je préfère ne pas préciser'}
  },
  q1:{
    title:"La dernière fois que tu t'es senti à l'aise dans ce rôle.",
    options:[
      {label:'Ces jours-ci', restit:"Ces jours-ci, tu t'es senti à l'aise dans ce rôle."},
      {label:'Cette semaine', restit:"La dernière fois que tu t'es senti à l'aise dans ce rôle, c'était cette semaine."},
      {label:'Ce mois-ci', restit:"La dernière fois que tu t'es senti à l'aise dans ce rôle, c'était ce mois-ci."},
      {label:'Cette année', restit:"La dernière fois que tu t'es senti à l'aise dans ce rôle, c'était cette année."},
      {label:"Depuis le début c'est difficile", restit:"Depuis le début, c'est difficile."}
    ],
    dropout:{label:'Je ne sais plus', restit:"Tu ne sais plus quand tu t'es senti à l'aise dans ce rôle."}
  },
  q2:{
    title:'En ce moment, comment tu vis ça.',
    options:[
      {label:'Ça se passe bien', branch:'short'},
      {label:'Je suis épuisé', branch:'normal', restit:'En ce moment, tu es épuisé.'},
      {label:"Je m'en veux souvent", branch:'normal', restit:"En ce moment, tu t'en veux souvent."},
      {label:'Je ne me reconnais plus', branch:'normal', restit:'En ce moment, tu ne te reconnais plus.'},
      {label:'Je porte tout, seul', branch:'normal', restit:'En ce moment, tu portes tout, seul.'}
    ],
    dropout:{label:'Ça dépend des jours', branch:'irregular', restit:'Ça dépend des jours.'}
  },
  q3:{
    title:'Ce qui pèse le plus.',
    titleIrregular:'Ce qui fait la différence entre un jour qui va et un jour qui pèse.',
    options:[
      {label:'La fatigue, le manque de sommeil', exit:'miro', restit:"Ce qui pèse le plus, c'est la fatigue."},
      {label:"Ce que je m'impose comme attentes", exit:'felix', restit:"Ce qui pèse le plus, ce sont les attentes que tu t'imposes."},
      {label:"La répartition avec l'autre parent", exit:'leo', restit:"Ce qui pèse le plus, c'est la répartition avec l'autre parent."},
      {label:'Le manque de temps pour moi', exit:'atlas', restit:"Ce qui pèse le plus, c'est le manque de temps pour toi."}
    ],
    dropout:{label:'Je ne sais pas', exit:'soren', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:"En parler à l'autre parent", restit:"Tu en as parlé à l'autre parent, ça n'a pas suffi."},
      {label:'Demander de l’aide autour de moi', restit:"Tu as demandé de l'aide autour de toi, ça n'a pas suffi."},
      {label:"M'organiser autrement", restit:"Tu t'es organisé autrement, ça n'a pas suffi."},
      {label:'Tenir, en attendant que ça passe', restit:"Tu as tenu, en attendant que ça passe."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Demander une chose précise', restit:'Tu te sens capable de demander une chose précise.'},
      {label:'Repérer ce qui pèse le plus', restit:'Tu te sens capable de repérer ce qui pèse le plus.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça se passe bien.',
      options:[
        {label:'Depuis le début', restit:'Ça se passe bien depuis le début.'},
        {label:'Depuis quelques mois', restit:'Ça se passe bien depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Je garde du temps pour moi', restit:'Ce qui tient, c’est le temps que tu gardes pour toi.'},
        {label:'Je me sens soutenu', restit:'Ce qui tient, c’est que tu te sens soutenu.'},
        {label:'Je ne cherche pas à tout faire parfaitement', restit:'Ce qui tient, c’est que tu ne cherches pas à tout faire parfaitement.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucune option ne décrit l'enfant, jamais « père » ni « mère ».
     « Je m'en veux souvent » et « je ne me reconnais plus » sont restitués tels quels, sans
     rassurer ni dramatiser. */
};

GAMES.lien = {
  agent:'iris',
  label:'Les gens autour de toi',
  accroche:'Cinq questions sur les gens autour de toi.',
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu as vu quelqu’un avec plaisir.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu as vu quelqu’un avec plaisir.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as vu quelqu’un avec plaisir, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as vu quelqu’un avec plaisir, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as vu quelqu’un avec plaisir, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas vu quelqu'un avec plaisir depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as vu quelqu’un avec plaisir.'}
  },
  q2:{
    title:'En ce moment, ta vie sociale.',
    options:[
      {label:'Elle me convient', branch:'short'},
      {label:'Je vois du monde mais ça reste en surface', branch:'normal', restit:'Tu vois du monde, mais ça reste en surface.'},
      {label:"Je m'isole sans vraiment le décider", branch:'normal', restit:"Tu t'isoles sans vraiment le décider."},
      {label:"J'aimerais voir des gens et je n'ose pas", branch:'normal', restit:"Tu aimerais voir des gens et tu n'oses pas."},
      {label:"Je n'ai plus personne à appeler", branch:'normal', restit:"Tu n'as plus personne à appeler."}
    ],
    dropout:{label:'Ça va et ça vient', branch:'irregular', restit:'Ça va et ça vient.'}
  },
  q3:{
    title:'Ce qui rend ça difficile.',
    titleIrregular:'Ce qui fait la différence entre une période entourée et une période seule.',
    options:[
      {label:'Un changement dans ma vie, déménagement ou autre', exit:'atlas', restit:"Ce qui rend ça difficile, c'est un changement dans ta vie."},
      {label:'Le manque de temps', exit:'mateo', restit:"Ce qui rend ça difficile, c'est le manque de temps."},
      {label:'La peur du regard des autres', exit:'felix', restit:"Ce qui rend ça difficile, c'est la peur du regard des autres."},
      {label:'Je ne sais pas comment m’y prendre', exit:'otis', restit:"Ce qui rend ça difficile, c'est de ne pas savoir comment t'y prendre."}
    ],
    dropout:{label:'Je ne sais pas', exit:'iris', restit:'Tu ne saurais pas dire ce qui rend ça difficile.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Reprendre contact avec des gens', restit:"Tu as repris contact avec des gens, ça n'a pas suffi."},
      {label:"M'inscrire à une activité", restit:"Tu t'es inscrit à une activité, ça n'a pas suffi."},
      {label:"Attendre qu'on vienne vers moi", restit:"Tu as attendu qu'on vienne vers toi, ça n'a pas suffi."},
      {label:'Sortir sans envie particulière', restit:"Tu es sorti sans envie particulière, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Écrire à une personne', restit:'Tu te sens capable d’écrire à une personne.'},
      {label:'Repérer ce qui me retient', restit:'Tu te sens capable de repérer ce qui te retient.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça te convient.',
      options:[
        {label:'Depuis toujours', restit:'Ta vie sociale te convient depuis toujours.'},
        {label:'Depuis quelques mois', restit:'Ta vie sociale te convient depuis quelques mois.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:'Quelques liens qui comptent', restit:'Ce qui tient, ce sont quelques liens qui comptent.'},
        {label:'Du temps seul qui me fait du bien', restit:'Ce qui tient, c’est du temps seul qui te fait du bien.'},
        {label:'Des activités partagées', restit:'Ce qui tient, ce sont des activités partagées.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : « Elle me convient » est une réponse pleine et entière — la branche
     courte ne suggère rien à corriger. Signal au professionnel sur « je n'ai plus personne à
     appeler » répété : à brancher (voir l'en-tête). */
};

GAMES.intimite = {
  agent:'eden',
  label:'Ton intimité',
  accroche:'Cinq questions. Zéro jugement, et tu peux t’arrêter quand tu veux.',
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu t’es senti bien là-dessus.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu t’es senti bien là-dessus.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu t’es senti bien là-dessus, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu t’es senti bien là-dessus, c’était cette année.'},
      {label:'Il y a plusieurs années', restit:'La dernière fois que tu t’es senti bien là-dessus, c’était il y a plusieurs années.'},
      {label:'Jamais vraiment', restit:'Tu ne t’es jamais vraiment senti bien là-dessus.'}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu t’es senti bien là-dessus.'}
  },
  q2:{
    title:'En ce moment, ce côté de ta vie.',
    options:[
      {label:'Ça me va', branch:'short'},
      {label:"Le désir n'est plus là", branch:'normal', restit:"En ce moment, le désir n'est plus là."},
      {label:"Je n'arrive pas à en parler", branch:'normal', restit:"En ce moment, tu n'arrives pas à en parler."},
      {label:'Ça crée des tensions', branch:'normal', restit:'En ce moment, ça crée des tensions.'},
      {label:"Je m'inquiète de ce que je ressens", branch:'normal', restit:"En ce moment, tu t'inquiètes de ce que tu ressens."}
    ],
    dropout:{label:'Ça dépend des périodes', branch:'irregular', restit:'Ça dépend des périodes.'}
  },
  q3:{
    title:'Ce qui pèse le plus.',
    titleIrregular:'Ce qui fait la différence entre une période où ça va et une période où ça coince.',
    options:[
      {label:'La fatigue, le stress', exit:'miro', second:'sol', restit:"Ce qui pèse le plus, c'est la fatigue ou le stress."},
      {label:'Ce que je pense de moi', exit:'felix', second:'nora', restit:"Ce qui pèse le plus, c'est ce que tu penses de toi."},
      {label:'Ce qui se passe dans la relation', exit:'leo', restit:"Ce qui pèse le plus, c'est ce qui se passe dans la relation."},
      {label:'Ce que je crois devoir être', exit:'atlas', restit:"Ce qui pèse le plus, c'est ce que tu crois devoir être."}
    ],
    dropout:{label:'Je ne sais pas', exit:'eden', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:"En parler avec l'autre", restit:"Tu en as parlé avec l'autre, ça n'a pas suffi."},
      {label:'Attendre que ça revienne', restit:"Tu as attendu que ça revienne, ça n'a pas suffi."},
      {label:"M'informer de mon côté", restit:"Tu t'es informé de ton côté, ça n'a pas suffi."},
      {label:'En parler à un professionnel', restit:"Tu en as parlé à un professionnel, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:'Mettre des mots dessus', restit:'Tu te sens capable de mettre des mots dessus.'},
      {label:'Juste observer', restit:'Tu te sens capable de juste observer.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
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
        {label:"J'arrive à en parler", restit:'Ce qui tient, c’est que tu arrives à en parler.'},
        {label:'Je me sens bien avec moi-même', restit:'Ce qui tient, c’est que tu te sens bien avec toi-même.'},
        {label:"Je ne m'impose rien", restit:'Ce qui tient, c’est que tu ne t’imposes rien.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucune option ne décrit une pratique, une fréquence ou un acte ;
     aucune question sur l'orientation, l'identité ou l'histoire. « Sortir » est présent sur
     chaque écran du moteur. Inquiétude d'ordre médical : voir l'en-tête. */
};

GAMES.argent = {
  agent:'vince',
  label:"Ton rapport à l'argent",
  accroche:"Cinq questions sur ton rapport à l'argent.",
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu t’es senti tranquille avec ça.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu t’es senti tranquille avec l’argent.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu t’es senti tranquille avec l’argent, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu t’es senti tranquille avec l’argent, c’était cette année.'},
      {label:'Il y a plusieurs années', restit:'La dernière fois que tu t’es senti tranquille avec l’argent, c’était il y a plusieurs années.'},
      {label:'Jamais vraiment', restit:'Tu ne t’es jamais vraiment senti tranquille avec l’argent.'}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu t’es senti tranquille avec l’argent.'}
  },
  q2:{
    title:"En ce moment, ton rapport à l'argent.",
    options:[
      {label:'Il est sain', branch:'short'},
      {label:"J'évite d'y penser, je ne regarde pas", branch:'normal', restit:"Tu évites d'y penser, tu ne regardes pas."},
      {label:"J'y pense tout le temps", branch:'normal', restit:"Tu y penses tout le temps."},
      {label:'Je dépense pour me sentir mieux', branch:'normal', second:'neo', restit:'Tu dépenses pour te sentir mieux.'},
      {label:'Je me prive alors que je pourrais me le permettre', branch:'normal', restit:'Tu te prives alors que tu pourrais te le permettre.'}
    ],
    dropout:{label:'Ça dépend des mois', branch:'irregular', restit:'Ça dépend des mois.'}
  },
  q3:{
    title:"D'où ça vient, selon toi.",
    titleIrregular:'Ce qui fait la différence entre un mois tranquille et un mois qui pèse.',
    options:[
      {label:'Ma situation actuelle', exit:'mateo', restit:'Selon toi, ça vient de ta situation actuelle.'},
      {label:"Mon histoire, ce que j'ai connu avant", exit:'atlas', restit:"Selon toi, ça vient de ton histoire, de ce que tu as connu avant."},
      {label:'Les comparaisons avec les autres', exit:'felix', restit:'Selon toi, ça vient des comparaisons avec les autres.'},
      {label:"Ce que je m'autorise ou pas", exit:'felix', restit:"Selon toi, ça vient de ce que tu t'autorises ou pas."}
    ],
    dropout:{label:'Je ne sais pas', exit:'vince', restit:"Tu ne saurais pas dire d'où ça vient."}
  },
  q4:{
    title:'Ce que tu as déjà essayé.',
    options:[
      {label:'Suivre mes dépenses', restit:"Tu as suivi tes dépenses, ça n'a pas suffi."},
      {label:'Me fixer des règles', restit:"Tu t'es fixé des règles, ça n'a pas suffi."},
      {label:'Éviter de regarder', restit:"Tu as évité de regarder, ça n'a pas suffi."},
      {label:"En parler à quelqu'un", restit:"Tu en as parlé à quelqu'un, ça n'a pas suffi."}
    ],
    dropout:{label:'Rien de particulier', restit:"Tu n'as encore rien essayé de particulier."}
  },
  q5:{
    title:'Cette semaine, tu te sens capable de.',
    options:[
      {label:"Regarder où j'en suis", restit:"Tu te sens capable de regarder où tu en es."},
      {label:'Repérer ce qui déclenche', restit:'Tu te sens capable de repérer ce qui déclenche.'},
      {label:"Ne rien changer pour l'instant", restit:"Tu ne te sens pas prêt à changer quoi que ce soit pour l'instant."}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand c’est sain.',
      options:[
        {label:'Depuis toujours', restit:'Ton rapport à l’argent est sain depuis toujours.'},
        {label:'Depuis quelques années', restit:'Ton rapport à l’argent est sain depuis quelques années.'},
        {label:"Depuis que j'ai changé quelque chose", restit:'Ça va mieux depuis que tu as changé quelque chose.'},
        {label:'Ça va, sans être stable', restit:'Ça va, sans être stable.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça tient.',
      options:[
        {label:"Je sais où j'en suis", restit:'Ce qui tient, c’est que tu sais où tu en es.'},
        {label:'Je ne me compare pas', restit:'Ce qui tient, c’est que tu ne te compares pas.'},
        {label:"Je m'autorise ce qui compte pour moi", restit:'Ce qui tient, c’est que tu t’autorises ce qui compte pour toi.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait que ça tient.'}
    }
  }
  /* Cadrage du dossier : aucune question sur un montant, un revenu, un solde, une dette, un
     patrimoine ; aucun conseil financier ni produit. « Je dépense pour me sentir mieux »
     propose Neo en second (question 2, voir gameRenderSortie dans 22-retours-du-29-09.js). */
};
