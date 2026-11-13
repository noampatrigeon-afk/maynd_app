/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LES JEUX, DONNÉES (13/11/2026)
   Les tables des dix-sept jeux, reprises telles quelles de MAYND :
   18 (Miro), 28 (Neo), 29 (Sol, Felix, Naoki, Atlas, Ava), 24 (Leo, Otis,
   Kael, Mateo), 26 (Soren, Iris, Eden, Vince), 27 (MIA, le point de mesure),
   31 (Nora), puis 34 (les questions reformulées, avec leur point d'interrogation,
   posées par-dessus les titres). Le moteur est dans 40-jeux.js.
   Les textes sont au masculin ; accordFeminin() (04-genre.js) les accorde.
   Règles tenues par les données : Kael ne pousse jamais au dépassement ; Ava
   n'impose aucune étape au deuil ; Soren dit « l'autre parent » ; Neo ne pose
   aucune étiquette ; Nora n'offre qu'observation et substitution, jamais Neo,
   et son jeu s'arrête quand le mal-être est fort et durable (NORA_DURABLE,
   NORA_FORT).
   ══════════════════════════════════════════════════════════════════════════ */
const JEUX={};

/* ─────────── Miro : le sommeil (18-moteur-des-jeux.js) ─────────── */

JEUX.sommeil = {
  agent: 'miro',
  label: 'Tes nuits',
  accroche: "Cinq questions sur tes nuits. Prends ton temps.",
  reflectionMs: 10000, /* 30 s à l'origine, 20 s le 29/09/2026, 10 s le 30/09/2026 */
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
};

/* ─────────── Neo : les habitudes (28-jeux-lot-0.js) ─────────── */
const NEO_SANS_SUJET={mot:'ça', sans:'sans ça', place:'la place que ça prend', prend:'ça prend'};
JEUX.habitudes = {
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

/* ─────────── Sol, Felix, Naoki, Atlas, Ava (29-jeux-lot-1.js) ─────────── */
JEUX.anxiete = {
  agent:'sol',
  label:'Ce qui monte',
  accroche:'Cinq questions. Prends ton temps.',
  /* 30/09/2026 : le porteur du projet veut une pause avant les réponses, comme ailleurs.
     Compromis avec le dossier (« un compte à rebours sur le jeu de l'anxiété est un
     contresens ») : l'écran se remplit, mais ni horloge ni « Réponses dans … secondes »
     (noClock, 33-fin-de-jeu.js). */
  reflectionMs:10000,
  noClock:true,
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

JEUX.confiance = {
  agent:'felix',
  label:'La voix dans ta tête',
  accroche:'Cinq questions sur la voix que tu as dans la tête.',
  reflectionMs:10000,
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

JEUX.discipline = {
  agent:'naoki',
  label:'Ce que tu tiens',
  accroche:'Cinq questions sur ce que tu arrives à tenir.',
  reflectionMs:10000,
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

JEUX.sens = {
  agent:'atlas',
  label:'Ce qui compte pour toi',
  accroche:'Cinq questions sur ce qui compte pour toi.',
  reflectionMs:10000,
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

JEUX.emotions = {
  agent:'ava',
  label:'Ce que tu ressens',
  accroche:'Cinq questions. Tu peux t’arrêter quand tu veux.',
  reflectionMs:10000,
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
    dropout:{label:'Rien de particulier', restit:"Tu n'as rien essayé de particulier."}
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

/* ─────────── Leo, Otis, Kael, Mateo (24-jeux-lot-2.js) ─────────── */
JEUX.relation = {
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

JEUX.affirmation = {
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

JEUX.effort = {
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

JEUX.travail = {
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

/* ─────────── Soren, Iris, Eden, Vince (26-jeux-lot-3.js) ─────────── */
JEUX.parentalite = {
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

JEUX.lien = {
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

JEUX.intimite = {
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

JEUX.argent = {
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

/* ─────────── MIA : le point de mesure (27-jeu-mia.js) ─────────── */
const MIA_TERRAIN={
  sommeil:{phrase:'de ton sommeil et de ton énergie', court:'ton sommeil et ton énergie', auj:'c’est ton sommeil et ton énergie'},
  travail:{phrase:'du travail', court:'le travail', auj:'c’est le travail'},
  relations:{phrase:'de tes relations', court:'tes relations', auj:'ce sont tes relations'},
  soi:{phrase:'de ce que tu te dis', court:'ce que tu te dis', auj:'c’est ce que tu te dis'},
  vie:{phrase:'de ce que tu fais de ta vie', court:'ce que tu fais de ta vie', auj:'c’est ce que tu fais de ta vie'}
};
/* terrains de l'orientation (09-couleur-questionnaires.js, DOMAIN_MAP) vers ceux de la question 3 */
const ORIENT_TO_TERRAIN={energie:'sommeil', travail:'travail', relations:'relations', soi:'soi'};

JEUX.point = {
  agent:'mia',
  label:'Ton point de mesure',
  accroche:'Cinq questions sur là où tu en es.',
  reflectionMs:10000,
  q1:{
    title:'La dernière fois que tu as senti que tu avançais.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu as senti que tu avançais.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as senti que tu avançais, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as senti que tu avançais, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as senti que tu avançais, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas senti que tu avançais depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as senti que tu avançais.'}
  },
  q2:{
    title:'En ce moment, ton objectif principal.',
    options:[
      {label:"J'avance dessus", branch:'short', restit:'Tu avances sur ton objectif principal.'},
      {label:"J'avance, mais moins qu'avant", branch:'normal', restit:"Tu avances sur ton objectif principal, mais moins qu'avant."},
      {label:'Je stagne', branch:'normal', restit:'Tu stagnes sur ton objectif principal.'},
      {label:"Je ne sais plus s'il est encore le bon", branch:'normal', restit:"Tu ne sais plus si ton objectif principal est encore le bon."},
      {label:"Je n'y pense plus vraiment", branch:'normal', restit:"Tu n'y penses plus vraiment."}
    ],
    dropout:{label:'Ça dépend des semaines', branch:'irregular', restit:'Ça dépend des semaines.'}
  },
  q3:{
    title:'Ce qui pèse le plus en ce moment.',
    titleIrregular:'Ce qui fait la différence entre une semaine où tu avances et une semaine où tu stagnes.',
    options:[
      {label:'Mon sommeil, mon énergie', exit:'miro', terrain:'sommeil', restit:"Ce qui pèse le plus, c'est ton sommeil et ton énergie."},
      {label:'Mon travail', exit:'mateo', terrain:'travail', restit:"Ce qui pèse le plus, c'est ton travail."},
      {label:'Mes relations', exit:'iris', exitRelations:true, terrain:'relations', restit:'Ce qui pèse le plus, ce sont tes relations.'},
      {label:'Ce que je me dis à moi-même', exit:'felix', terrain:'soi', restit:"Ce qui pèse le plus, c'est ce que tu te dis à toi-même."},
      {label:'Ce que je fais de ma vie en général', exit:'atlas', terrain:'vie', restit:"Ce qui pèse le plus, c'est ce que tu fais de ta vie en général."}
    ],
    dropout:{label:'Je ne sais pas', exit:'mia', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Depuis la dernière fois, ce qui a bougé.',
    options:[
      {label:"Quelque chose s'est débloqué", restit:"Depuis la dernière fois, quelque chose s'est débloqué."},
      {label:"Rien n'a vraiment changé", restit:"Depuis la dernière fois, rien n'a vraiment changé."},
      {label:"Ça s'est compliqué", restit:"Depuis la dernière fois, ça s'est compliqué."},
      {label:'Autre chose est devenu plus important', restit:'Depuis la dernière fois, autre chose est devenu plus important.'}
    ],
    dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui a bougé depuis la dernière fois.'}
  },
  /* premier passage uniquement (voir gameQuestionDefForKey plus bas) */
  q4First:{
    title:"Depuis quand c'est comme ça.",
    options:[
      {label:'Depuis quelques jours', restit:"C'est comme ça depuis quelques jours."},
      {label:'Depuis quelques semaines', restit:"C'est comme ça depuis quelques semaines."},
      {label:'Depuis quelques mois', restit:"C'est comme ça depuis quelques mois."},
      {label:"Depuis plus d'un an", restit:"C'est comme ça depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus depuis quand c’est comme ça.'}
  },
  q5:{
    title:'Pour les semaines qui viennent.',
    options:[
      {label:'Continuer comme ça', restit:'Pour les semaines qui viennent, tu veux continuer comme ça.'},
      {label:"Changer d'angle", restit:"Pour les semaines qui viennent, tu veux changer d'angle."},
      {label:'Lever le pied', restit:'Pour les semaines qui viennent, tu veux lever le pied.'},
      {label:'Revoir mon objectif', reviewObjective:true, restit:'Pour les semaines qui viennent, tu veux revoir ton objectif.'}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça avance.',
      options:[
        {label:'Depuis quelques jours', restit:'Ça avance depuis quelques jours.'},
        {label:'Depuis quelques semaines', restit:'Ça avance depuis quelques semaines.'},
        {label:'Depuis quelques mois', restit:'Ça avance depuis quelques mois.'},
        {label:'Depuis le début', restit:'Ça avance depuis le début.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça avance.',
      options:[
        {label:'Un rythme qui me tient', restit:'Ce qui fait avancer, c’est un rythme qui te tient.'},
        {label:'Un objectif qui me parle vraiment', restit:'Ce qui fait avancer, c’est un objectif qui te parle vraiment.'},
        {label:'Le soutien que je reçois', restit:'Ce qui fait avancer, c’est le soutien que tu reçois.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait avancer.'}
    }
  }
};

/* ─────────── Nora : le rapport au corps (31-jeu-nora-et-signaux.js) ─────────── */
const NORA_FOOD_Q0=['Mon rapport à ce que je mange','Les deux premiers à la fois'];
const NORA_DURABLE=['Il y a plusieurs années','Jamais vraiment'];
const NORA_FORT=['Ça prend beaucoup de place dans ma tête',"J'y pense souvent dans la journée",'Je m’évite, je ne me regarde pas','Je mange beaucoup dans certains moments'];

JEUX.corps = {
  agent:'nora',
  label:'Ton rapport au corps',
  accroche:'Cinq questions. Aucun conseil, aucun jugement, et tu peux t’arrêter quand tu veux.',
  reflectionMs:10000,
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

/* ─────────── Les questions reformulées (34-questions-des-jeux.js) ─────────── */
const Q5_COMMUNE='Cette semaine, qu’est-ce que tu te sens capable de faire ?';
const QUESTIONS_V2={
  sommeil:{
    q1:'À quand remonte la dernière fois où tu t’es réveillé vraiment reposé ?',
    q2:'En ce moment, comment se passent tes nuits ?',
    q3:'Qu’est-ce qui t’empêche le plus de bien dormir ?',
    irr:'Qu’est-ce qui fait la différence entre une bonne et une mauvaise nuit ?',
    q4:'Pour mieux dormir, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand tes nuits se passent bien ?',
    c2:'Qu’est-ce qui t’aide à garder de bonnes nuits ?'
  },
  relation:{
    q0:'Où en es-tu dans ta vie amoureuse ?',
    q1:'À quand remonte la dernière fois où tu t’es senti vraiment proche de l’autre ?',
    q2:'En ce moment, comment ça se passe entre vous ?',
    q3:'Quand ça coince entre vous, qu’est-ce que tu fais le plus souvent, toi ?',
    irr:'Qu’est-ce qui fait la différence entre une semaine où ça va entre vous et une semaine où ça coince ?',
    q4:'Pour votre relation, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ça va bien entre vous ?',
    c2:'D’après toi, qu’est-ce qui fait que ça va bien entre vous ?'
  },
  affirmation:{
    q1:'À quand remonte la dernière fois où tu as dit non sans culpabiliser ?',
    q2:'En ce moment, quand tu dois dire quelque chose de difficile, comment ça se passe ?',
    q3:'Avec qui est-ce le plus dur de dire les choses ?',
    irr:'Qu’est-ce qui fait la différence entre les gens avec qui tu oses parler et ceux avec qui tu n’oses pas ?',
    q4:'Pour arriver à dire les choses, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand arrives-tu à dire les choses facilement ?',
    c2:'Qu’est-ce qui t’aide à dire les choses ?'
  },
  effort:{
    q1:'À quand remonte la dernière fois où tu as pris du plaisir à bouger ?',
    q2:'En ce moment, comment vis-tu le sport et l’effort ?',
    q3:'Dans ton rapport au sport, qu’est-ce qui pèse le plus ?',
    irr:'Qu’est-ce qui fait la différence entre une période où tu bouges et une période où tu t’arrêtes ?',
    q4:'Côté sport, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ton rapport au sport te va ?',
    c2:'Qu’est-ce qui fait que ça te va, aujourd’hui ?'
  },
  travail:{
    q1:'À quand remonte la dernière fois où tu as fini une journée de travail satisfait ?',
    q2:'En ce moment, comment ça se passe au travail ?',
    q3:'Au travail, qu’est-ce qui pèse le plus en ce moment ?',
    irr:'Qu’est-ce qui fait la différence entre une période de travail qui va et une période qui pèse ?',
    q4:'Pour que ça aille mieux au travail, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ça va bien au travail ?',
    c2:'Qu’est-ce qui fait que ça va bien au travail ?'
  },
  parentalite:{
    q0:'Pour commencer, où en es-tu en tant que parent ?',
    q1:'À quand remonte la dernière fois où tu t’es senti à l’aise dans ton rôle de parent ?',
    q2:'En ce moment, comment vis-tu ta vie de parent ?',
    q3:'Dans ta vie de parent, qu’est-ce qui pèse le plus en ce moment ?',
    irr:'Dans ta vie de parent, qu’est-ce qui fait la différence entre un jour qui va et un jour qui pèse ?',
    q4:'Pour que ce soit moins lourd, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ça se passe bien pour toi, en tant que parent ?',
    c2:'Qu’est-ce qui t’aide à tenir, en tant que parent ?'
  },
  lien:{
    q1:'À quand remonte la dernière fois où tu as vu quelqu’un avec plaisir ?',
    q2:'En ce moment, comment va ta vie sociale ?',
    q3:'Qu’est-ce qui rend les liens difficiles pour toi en ce moment ?',
    irr:'Qu’est-ce qui fait la différence entre une période où tu es entouré et une période où tu es seul ?',
    q4:'Pour recréer du lien, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ta vie sociale te convient ?',
    c2:'Qu’est-ce qui fait que ta vie sociale te convient ?'
  },
  intimite:{
    q1:'À quand remonte la dernière fois où tu t’es senti bien dans ton intimité ?',
    q2:'En ce moment, comment ça se passe dans ton intimité ?',
    q3:'Dans ton intimité, qu’est-ce qui pèse le plus en ce moment ?',
    irr:'Dans ton intimité, qu’est-ce qui fait la différence entre une période où ça va et une période où ça coince ?',
    q4:'Pour ton intimité, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ton intimité te convient ?',
    c2:'Qu’est-ce qui fait que ça va bien pour toi, de ce côté-là ?'
  },
  argent:{
    q1:'À quand remonte la dernière fois où tu t’es senti tranquille avec l’argent ?',
    q2:'En ce moment, comment est ton rapport à l’argent ?',
    q3:'Selon toi, d’où vient ton rapport à l’argent ?',
    irr:'Qu’est-ce qui fait la différence entre un mois tranquille et un mois où l’argent pèse ?',
    q4:'Avec l’argent, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ton rapport à l’argent est-il sain ?',
    c2:'Qu’est-ce qui t’aide à garder un rapport sain à l’argent ?'
  },
  point:{
    q1:'À quand remonte la dernière fois où tu as senti que tu avançais ?',
    q2:'En ce moment, où en es-tu avec ton objectif principal ?',
    q3:'Dans ta vie en ce moment, qu’est-ce qui pèse le plus ?',
    irr:'Qu’est-ce qui fait la différence entre une semaine où tu avances et une semaine où tu stagnes ?',
    q4:'Depuis notre dernier point, qu’est-ce qui a bougé ?',
    q4First:'Ce que tu viens de décrire, ça dure depuis quand ?',
    q5:'Pour les semaines qui viennent, qu’est-ce qui te semble juste ?',
    c1:'Depuis quand est-ce que ça avance ?',
    c2:'Qu’est-ce qui t’aide à avancer ?'
  },
  habitudes:{
    q0:'En ce moment, qu’est-ce qui prend trop de place dans ta vie ?',
    q0b:'Et avant, est-ce que quelque chose a déjà pris trop de place ?',
    q1:'À quand remonte ta dernière journée entière {sans} ?',
    q2:'En ce moment, comment vis-tu {place} ?',
    q3:'Le plus souvent, qu’est-ce qui te pousse vers {mot} ?',
    irr:'Qu’est-ce qui fait la différence entre une période calme et une période où {prend} de la place ?',
    q4:'Avec {mot}, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand est-ce stable avec {mot} ?',
    c2:'Qu’est-ce qui t’aide à garder ça stable ?'
  },
  anxiete:{
    q1:'À quand remonte la dernière fois où tu t’es senti vraiment tranquille ?',
    q2:'En ce moment, comment ça se passe quand le stress ou l’inquiétude montent ?',
    q3:'Quand le stress monte, qu’est-ce qui le déclenche le plus souvent ?',
    irr:'Qu’est-ce qui fait la différence entre un jour calme et un jour où le stress monte ?',
    q4:'Quand ça monte, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand te sens-tu tranquille ?',
    c2:'Qu’est-ce qui t’aide à rester tranquille ?'
  },
  confiance:{
    q1:'À quand remonte la dernière fois où tu as été fier de toi ?',
    q2:'En ce moment, comment te parles-tu à toi-même ?',
    q3:'Dans quelles situations te parles-tu le plus durement ?',
    irr:'Qu’est-ce qui fait la différence entre un moment où ta voix intérieure t’aide et un moment où elle te descend ?',
    q4:'Face à cette petite voix, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ta voix intérieure est-elle plutôt bienveillante ?',
    c2:'Qu’est-ce qui t’aide à bien te parler ?'
  },
  discipline:{
    q1:'À quand remonte la dernière fois où tu as tenu quelque chose jusqu’au bout ?',
    q2:'En ce moment, comment se passent tes journées ?',
    q3:'Quand tu décroches, qu’est-ce qui en est la cause le plus souvent ?',
    irr:'Qu’est-ce qui fait la différence entre une semaine qui tient et une semaine qui part dans tous les sens ?',
    q4:'Pour tenir, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand tes journées tiennent-elles debout ?',
    c2:'Qu’est-ce qui t’aide à tenir ?'
  },
  sens:{
    q1:'À quand remonte la dernière fois où tu t’es senti vraiment à ta place ?',
    q2:'En ce moment, est-ce que ce que tu fais de tes journées te ressemble ?',
    q3:'Ce sentiment, il est là depuis quand ?',
    irr:'Qu’est-ce qui fait la différence entre une période où ta vie a du sens et une période où elle n’en a plus ?',
    q4:'Pour retrouver du sens, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand ce que tu fais te ressemble ?',
    c2:'Qu’est-ce qui t’aide à rester fidèle à ce qui compte pour toi ?'
  },
  emotions:{
    q1:'À quand remonte la dernière fois où tu as laissé sortir ce que tu ressentais ?',
    q2:'En ce moment, comment vis-tu ce que tu ressens ?',
    q3:'Qu’est-ce qui pèse le plus sur ton cœur en ce moment ?',
    irr:'Qu’est-ce qui fait la différence entre un moment où ça passe et un moment où ça pèse ?',
    q4:'Pour traverser ça, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand tes émotions circulent-elles bien ?',
    c2:'Qu’est-ce qui t’aide à laisser circuler ce que tu ressens ?'
  },
  corps:{
    q0:'De quoi as-tu envie de parler aujourd’hui ?',
    q0b:'Et avant, est-ce que ça a déjà été compliqué avec ton corps ?',
    q1:'À quand remonte la dernière fois où tu t’es senti bien dans ton corps ?',
    q2:'En ce moment, comment ça se passe avec ton corps ?',
    q2Food:'En ce moment, comment se passent les moments où tu manges ?',
    q3:'Le plus souvent, qu’est-ce qui déclenche ces moments-là ?',
    irr:'Qu’est-ce qui fait la différence entre une période où ça va et une période où ça pèse ?',
    q4:'Là-dessus, qu’est-ce que tu as déjà essayé ?',
    c1:'Depuis quand te sens-tu bien avec ton corps ?',
    c2:'Qu’est-ce qui t’aide à te sentir bien ?'
  }
};
(function(){
  Object.keys(QUESTIONS_V2).forEach(function(theme){
    var g=JEUX[theme], v=QUESTIONS_V2[theme]; if(!g) return;
    function set(q, title){ if(q && title) q.title=title; }
    ['q0','q0b','q1','q2','q3','q4','q4First','q2Food'].forEach(function(k){ set(g[k], v[k]); });
    if(g.q3 && v.irr) g.q3.titleIrregular=v.irr;
    set(g.q5, v.q5 || Q5_COMMUNE);
    if(g.short){ set(g.short.q1, v.c1); set(g.short.q2, v.c2); }
  });
})();
