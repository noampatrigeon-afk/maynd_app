/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE PARCOURS D'ENTRÉE : PROFILS, QUESTIONS, COMPTE-RENDU (13/11/2026)
   Repris du Tunnel (app-guidee/donnees.js). Huit étapes, quarante-six questions.
   ══════════════════════════════════════════════════════════════════════════ */
/* ─────────── les profils MAYND (repris de la première application) ───────────
   Quatre pôles : M (l'action), R (le lien), A (se poser), S (l'analyse). */
var PROFILS={
  M:  {nom:"Le Moteur",      nomF:"Le Moteur",       desc:"Tu avances, tu agis, tu règles les choses tout de suite. Ta force, c'est l'action. L'enjeu : ne pas foncer sans te retourner."},
  R:  {nom:"Le Relieur",     nomF:"La Relieuse",     desc:"Tu passes par l'échange, la parole, le lien. Parler, c'est déjà avancer, pour toi."},
  A:  {nom:"L'Ancre",        nomF:"L'Ancre",         desc:"Tu as besoin de te poser avant de repartir. Ce n'est pas de la lenteur, c'est de l'ancrage."},
  S:  {nom:"Le Stratège",    nomF:"La Stratège",     desc:"Tu analyses, tu creuses, parfois en boucle. Ta force est là, à condition de ne pas t'y enfermer trop longtemps."},
  MR: {nom:"Le Fédérateur",  nomF:"La Fédératrice",  desc:"Tu avances, et tu entraînes les autres avec toi. Ton énergie se propage."},
  MA: {nom:"Le Bâtisseur",   nomF:"La Bâtisseuse",   desc:"Tu agis, mais tu prends le temps de poser des bases solides avant d'avancer."},
  MS: {nom:"Le Tacticien",   nomF:"La Tacticienne",  desc:"Tu agis, mais jamais sans avoir réfléchi ton coup avant."},
  RA: {nom:"Le Pilier",      nomF:"Le Pilier",       desc:"Tu es le point d'appui des autres. Stable, disponible, à l'écoute."},
  RS: {nom:"Le Médiateur",   nomF:"La Médiatrice",   desc:"Tu comprends vite les gens, et tu prends le temps de bien saisir avant de répondre."},
  AS: {nom:"L'Observateur",  nomF:"L'Observatrice",  desc:"Tu prends du recul avant d'agir. Rien ne se décide chez toi dans la précipitation."},
  RAS:{nom:"Le Sage",        nomF:"La Sage",         desc:"Tu écoutes, tu te poses, tu réfléchis. Ta limite : passer à l'action."},
  MAS:{nom:"Le Veilleur",    nomF:"La Veilleuse",    desc:"Tu avances en autonomie, posément et avec recul. Ta limite : partager davantage."}
};

/* ─────────── les questionnaires ───────────
   Révision du 13/11/2026, demande du porteur du projet : le quiz doit être faisable par tout le monde.
   Ça va de l'étudiant à l'ouvrier, du parent à la personne qui découvre ces sujets, jusqu'au passionné
   de préparation mentale. Chaque question offre donc des réponses simples ET des réponses plus fines,
   « Autre » presque partout, et « Je ne sais pas » sur les échelles.

   Types : texte, choix (une réponse), multi (plusieurs, max), echelle (1 à 5 entre deux pôles),
   note (1 à 10), boussole (plusieurs curseurs de 1 à 10).

   Une réponse est un texte, ou un objet qui peut porter :
     t  : le texte affiché ;
     r  : la phrase du compte-rendu (sinon, le gabarit cr de la question) ;
     p  : le pôle de profil renforcé (M l'action, R le lien, A se poser, S l'analyse) ;
     ag : le poids donné aux accompagnants pour l'équipe pressentie ;
     k  : une clé, lue par le compte-rendu et par les consignes du modèle ;
     c  : pour un choix multiple, la formule du compte-rendu, à la deuxième personne (« ton sommeil »).
   Pour une échelle : dits (les cinq phrases du compte-rendu), pg et pd (pôles de gauche et de droite).
   poids : le poids de la question dans le calcul du profil. */
var MODULES=[
  {id:'toi', titre:"D'abord, toi", sous:"Qui tu es, ce que tu fais, avec qui tu vis.", fond:'#974AF0', teinte:'#EDE1FF', questions:[
    {id:'prenom', type:'texte', ligne:true, requis:true, titre:"Comment tu t'appelles ?", aide:"Ton prénom suffit.", exemple:"Ton prénom"},
    {id:'genre', type:'choix', titre:"Tu es… ?", aide:"Ça me sert seulement à accorder les mots quand je t'écris.",
      options:["Un homme","Une femme","Je préfère ne pas répondre"]},
    {id:'age', type:'choix', titre:"Quel âge as-tu ?", cr:"Tu as {x}.",
      options:["18 à 24 ans","25 à 34 ans","35 à 49 ans","50 à 64 ans","65 à 74 ans","75 ans ou plus"]},
    {id:'activite', type:'choix', autre:true, titre:"Qu'est-ce que tu fais dans la vie ?", aide:"Ce qui te prend le plus de temps.", cr:"Dans la vie : {x}.",
      options:[
        {t:"J'étudie ou je suis en formation", r:"Tu étudies ou tu es en formation.", ag:{mateo:1}},
        {t:"Je travaille sur le terrain : usine, chantier, commerce, transport…", r:"Tu travailles sur le terrain.", ag:{mateo:1}},
        {t:"Je travaille dans un bureau", r:"Tu travailles dans un bureau.", ag:{mateo:1}},
        {t:"J'enseigne, j'aide ou je m'occupe des autres", r:"Ton métier, c'est de t'occuper des autres.", ag:{mateo:1}},
        {t:"Je suis à mon compte", r:"Tu es à ton compte.", ag:{mateo:1}},
        {t:"Je cherche un emploi", r:"Tu cherches un emploi.", ag:{mateo:2}},
        {t:"Je m'occupe de ma famille à plein temps", r:"Tu t'occupes de ta famille à plein temps.", ag:{soren:1}},
        {t:"Je suis à la retraite", r:"Tu es à la retraite."},
        {t:"Le sport, c'est mon métier, ou presque", r:"Le sport est ton métier, ou presque.", ag:{kael:2}}
      ]},
    {id:'foyer', type:'choix', autre:true, titre:"Avec qui vis-tu ?", cr:"Chez toi : {x}.",
      options:[
        {t:"{Seul|Seule}", r:"Tu vis {seul|seule}.", ag:{iris:1}},
        {t:"En couple", r:"Tu vis en couple."},
        {t:"En couple, avec des enfants", r:"Tu vis en couple, avec des enfants.", ag:{soren:1}},
        {t:"{Seul|Seule} avec mes enfants", r:"Tu vis {seul|seule} avec tes enfants.", ag:{soren:2}},
        {t:"Chez mes parents", r:"Tu vis chez tes parents."},
        {t:"En colocation", r:"Tu vis en colocation."},
        {t:"Ça change souvent", r:"Ton foyer change souvent."}
      ]}
  ]},

  {id:'situation', titre:"Là où tu en es", sous:"Ta période, ce qui pèse, ce qui tient.", fond:'#6F2FC0', teinte:'#E6D9FF', questions:[
    {id:'periode', type:'choix', autre:true, titre:"Si tu devais résumer ta période actuelle, tu dirais quoi ?", cr:"Ta période, en tes mots : « {x} ».",
      options:[
        {t:"Ça va plutôt bien", r:"En ce moment, ça va plutôt bien."},
        {t:"Ça va, et je veux aller plus loin", r:"En ce moment, ça va, et tu veux aller plus loin."},
        {t:"Je tiens bon, mais c'est lourd", r:"En ce moment, tu tiens bon, mais c'est lourd."},
        {t:"Je traverse un moment difficile", r:"Tu traverses un moment difficile."},
        {t:"Je suis en pleine transition : travail, couple, déménagement…", r:"Tu es en pleine transition."},
        {t:"Je me sens {perdu|perdue}, sans trop savoir pourquoi", r:"Tu te sens {perdu|perdue}, sans trop savoir pourquoi.", ag:{atlas:1}},
        {t:"Je ne sais pas trop", r:"Tu as du mal à dire où tu en es. C'est une réponse aussi."}
      ]},
    {id:'boussole', type:'boussole', titre:"Comment ça va en ce moment, domaine par domaine ?", aide:"1, c'est très bas. 10, c'est au plus haut. Laisse à 5 si tu ne sais pas.",
      items:[['sommeil','Sommeil'],['energie','Énergie'],['moral','Moral'],['confiance','Confiance en toi'],['travail','Travail, études, activité'],['amour','Vie amoureuse'],
             ['famille','Famille'],['amis','Amis'],['argent','Argent'],['corps','Rapport au corps'],['sens','Sens de ta vie']]},
    {id:'sujets', type:'multi', max:3, autre:true, titre:"Qu'est-ce qui prend le plus de place dans ta tête ces jours-ci ?", aide:"Trois au plus.", cr:"Ce qui occupe ta tête : {x}.",
      options:[
        {t:"Me sentir mieux, tout simplement", c:"te sentir mieux"},
        {t:"Mieux me connaître", c:"mieux te connaître", ag:{atlas:2}},
        {t:"Ma confiance en moi", c:"ta confiance en toi", ag:{felix:4}},
        {t:"La voix critique dans ma tête", c:"la voix critique dans ta tête", ag:{felix:4}},
        {t:"Ma motivation, tenir mes bonnes habitudes", c:"ta motivation et tes habitudes", ag:{naoki:4}},
        {t:"M'organiser, gérer mon temps", c:"ton organisation et ton temps", ag:{naoki:3}},
        {t:"Le stress, l'angoisse qui monte", c:"le stress qui monte", ag:{sol:4}},
        {t:"Mon sommeil", c:"ton sommeil", ag:{miro:4}},
        {t:"Une émotion lourde, une perte", c:"une émotion lourde ou une perte", ag:{ava:4}},
        {t:"Le sens de ce que je vis", c:"le sens de ce que tu vis", ag:{atlas:4}},
        {t:"Une décision importante à prendre", c:"une décision importante", ag:{atlas:2, mateo:1}},
        {t:"Mon travail, mes études, ma carrière", c:"ton travail ou tes études", ag:{mateo:4}},
        {t:"Mon couple, ma vie amoureuse", c:"ton couple et ta vie amoureuse", ag:{leo:4}},
        {t:"Ma famille, mes proches", c:"ta famille et tes proches", ag:{otis:2, iris:1}},
        {t:"Mon rôle de parent", c:"ton rôle de parent", ag:{soren:4}},
        {t:"Me sentir {seul|seule}", c:"te sentir {seul|seule}", ag:{iris:4}},
        {t:"Dire les choses, poser mes limites", c:"dire les choses et poser tes limites", ag:{otis:4}},
        {t:"Le sport, la préparation mentale, la performance", c:"la performance et la préparation mentale", ag:{kael:4}},
        {t:"Ma sexualité, mon intimité", c:"ta sexualité et ton intimité", ag:{eden:4}},
        {t:"L'argent", c:"l'argent", ag:{vince:4}},
        {t:"Un comportement qui prend trop de place", c:"un comportement qui prend trop de place", ag:{neo:4}},
        {t:"Mon rapport à mon corps", c:"ton rapport à ton corps", ag:{nora:4}}
      ]},
    {id:'duree', type:'choix', titre:"Depuis combien de temps ça dure ?", cr:"Ça dure : {x}.",
      options:[
        {t:"Moins de 2 semaines", r:"Ça dure depuis moins de 2 semaines."},
        {t:"Entre 2 semaines et 3 mois", r:"Ça dure depuis plus de 2 semaines, moins de 3 mois."},
        {t:"Entre 3 mois et 1 an", r:"Ça dure depuis plus de 3 mois, moins d'1 an."},
        {t:"Entre 1 et 5 ans", r:"Ça dure depuis plus d'1 an, moins de 5 ans."},
        {t:"Depuis toujours, ou presque", r:"C'est là depuis toujours, ou presque."},
        {t:"Ce n'est pas un problème, c'est une envie d'avancer", r:"Ce n'est pas un problème : c'est une envie d'avancer."}
      ]},
    {id:'phrase', type:'texte', titre:"En une phrase, qu'est-ce qui t'amène aujourd'hui ?", aide:"Écris comme ça vient. Tu peux aussi passer.", exemple:"Ce qui t'amène…", cr:"Dans tes mots : « {x} »."}
  ]},

  {id:'fonctionnement', titre:"Comment tu fonctionnes", sous:"Ta façon d'avancer, de décider, de te recharger.", fond:'#224CF2', teinte:'#DFE8FF', questions:[
    {id:'recharge', type:'echelle', titre:"Après une longue journée, qu'est-ce qui te recharge le plus ?", aide:"Touche le point qui te ressemble : plus il est près d'un côté, plus c'est vrai pour toi.",
      gauche:"Voir du monde", droite:"Être {seul|seule}", pg:'R', pd:'A',
      dits:["Voir du monde te recharge vraiment.","Tu te recharges plutôt avec les autres.","Tu te recharges autant avec les autres que {seul|seule}.","Tu te recharges plutôt {seul|seule}.","Tu as besoin d'être {seul|seule} pour te recharger."]},
    {id:'projet', type:'echelle', titre:"Face à un nouveau projet, comment t'y prends-tu ?", gauche:"Je planifie tout", droite:"J'avance à l'instinct", pg:'S', pd:'M',
      dits:["Tu planifies tout avant d'avancer.","Tu prépares plutôt avant d'avancer.","Tu prépares un peu, puis tu avances.","Tu avances plutôt à l'instinct.","Tu avances à l'instinct, sans trop planifier."]},
    {id:'decision', type:'echelle', titre:"Pour une décision importante, sur quoi t'appuies-tu ?", gauche:"J'analyse", droite:"Je me fie à mon ressenti", pg:'S', pd:'RA',
      dits:["Pour décider, tu analyses tout.","Pour décider, tu analyses plutôt.","Pour décider, tu mêles analyse et ressenti.","Pour décider, tu te fies plutôt à ton ressenti.","Pour décider, tu suis ton ressenti."]},
    {id:'nouveaute', type:'echelle', titre:"La nouveauté, qu'est-ce qu'elle te fait ?", gauche:"Elle me stimule", droite:"Il me faut du temps pour m'adapter", pg:'M', pd:'A',
      dits:["La nouveauté te stimule vraiment.","La nouveauté te stimule plutôt.","La nouveauté te va, à petite dose.","La nouveauté te demande un temps d'adaptation.","La nouveauté te demande beaucoup de temps pour t'adapter."]},
    {id:'exigence', type:'echelle', titre:"Quel est ton niveau d'exigence envers toi-même ?", gauche:"Plutôt {indulgent|indulgente}", droite:"Très {exigeant|exigeante}",
      dits:["Tu es {indulgent|indulgente} avec toi-même.","Tu es plutôt {indulgent|indulgente} avec toi-même.","Ton exigence envers toi est mesurée.","Tu es {exigeant|exigeante} avec toi-même.","Tu es très {exigeant|exigeante} avec toi-même."]},
    {id:'emotions', type:'echelle', titre:"Tes émotions, est-ce qu'elles se voient ?", gauche:"Tout de suite", droite:"Je les garde pour moi",
      dits:["Tes émotions se voient tout de suite.","Tes émotions se voient plutôt vite.","Tes émotions se voient parfois.","Tu gardes plutôt tes émotions pour toi.","Tu gardes tes émotions pour toi."]},
    {id:'moteur', type:'choix', autre:true, poids:2, titre:"Qu'est-ce qui te fait avancer le plus ?", cr:"Ce qui te fait avancer : {x}.",
      options:[
        {t:"Atteindre un objectif", p:'M'},
        {t:"Progresser, apprendre", p:'S'},
        {t:"Être utile aux autres", p:'R'},
        {t:"Faire plaisir à ceux que j'aime", p:'R', r:"Ce qui te fait avancer : faire plaisir à ceux que tu aimes."},
        {t:"Me sentir libre", p:'M', r:"Ce qui te fait avancer : te sentir libre."},
        {t:"Me sentir en paix", p:'A', r:"Ce qui te fait avancer : te sentir en paix."},
        {t:"Être {reconnu|reconnue}", p:'R'},
        {t:"Gagner ma vie, être en sécurité", p:'A', r:"Ce qui te fait avancer : gagner ta vie, être en sécurité."},
        {t:"Le plaisir, tout simplement", p:'M'},
        {t:"Je ne sais pas trop", r:"Tu ne sais pas encore bien ce qui te fait avancer."}
      ]},
    {id:'moment', type:'choix', titre:"À quel moment de la journée es-tu le plus toi-même ?", cr:"Ton meilleur moment : {x}.",
      options:["Tôt le matin","Le matin","L'après-midi","Le soir","La nuit",{t:"Ça change tout le temps", r:"Ton meilleur moment change tout le temps."}]}
  ]},

  {id:'reactions', titre:"Comment tu réagis", sous:"Sous pression, après un échec, dans un désaccord.", fond:'#E8467F', teinte:'#FFE0EC', questions:[
    {id:'pression', type:'choix', autre:true, poids:2, titre:"Quand la pression monte, que fais-tu le plus souvent ?", cr:"Sous pression : {x}.",
      options:[
        {t:"J'accélère, j'en fais plus", p:'M', r:"Sous pression, tu accélères et tu en fais plus."},
        {t:"Je fais une liste, je m'organise", p:'S', k:'froid', r:"Sous pression, tu t'organises."},
        {t:"J'analyse la situation", p:'S', k:'froid', r:"Sous pression, tu analyses la situation."},
        {t:"J'en parle à quelqu'un", p:'R', r:"Sous pression, tu en parles à quelqu'un."},
        {t:"Je m'énerve vite", ag:{sol:1, otis:1}, r:"Sous pression, tu t'énerves vite."},
        {t:"Je me replie sur moi", p:'A', r:"Sous pression, tu te replies sur toi."},
        {t:"Je me fige, je n'arrive plus à rien", p:'A', ag:{sol:2}, r:"Sous pression, tu te figes."},
        {t:"Je me change les idées : sport, sortie, série…", p:'M', r:"Sous pression, tu te changes les idées."},
        {t:"Je remets à plus tard", k:'repousse', ag:{naoki:2}, r:"Sous pression, tu remets à plus tard."},
        {t:"Je respire et je prends du recul", p:'A', k:'froid', r:"Sous pression, tu respires et tu prends du recul."}
      ]},
    {id:'echec', type:'choix', autre:true, poids:1, titre:"Après un échec, à quoi ressemble ta première pensée ?", cr:"Après un échec, ta première pensée : « {x} ».",
      options:[
        {t:"« Qu'est-ce que je peux en tirer ? »", p:'S', k:'tirer', r:"Après un échec, ta première pensée : « Qu'est-ce que je peux en tirer ? »"},
        {t:"« Je suis {nul|nulle}. »", k:'nul', ag:{felix:2}, r:"Après un échec, ta première pensée : « Je suis {nul|nulle}. »"},
        {t:"« Ce n'est pas de ma faute. »", r:"Après un échec, ta première pensée : « Ce n'est pas de ma faute. »"},
        {t:"« On passe à autre chose. »", p:'M', r:"Après un échec, ta première pensée : « On passe à autre chose. »"},
        {t:"« Je recommence tout de suite. »", p:'M', r:"Après un échec, ta première pensée : « Je recommence tout de suite. »"},
        {t:"« J'ai besoin d'en parler. »", p:'R', r:"Après un échec, ta première pensée : « J'ai besoin d'en parler. »"},
        {t:"« J'ai besoin d'être {seul|seule} un moment. »", p:'A', r:"Après un échec, ta première pensée : « J'ai besoin d'être {seul|seule} un moment. »"},
        {t:"« Je le savais, ça ne marche jamais pour moi. »", k:'nul', ag:{felix:2}, r:"Après un échec, ta première pensée : « Je le savais, ça ne marche jamais pour moi. »"},
        {t:"Ça dépend vraiment de l'échec", r:"Ta réaction à un échec dépend vraiment de l'échec."}
      ]},
    {id:'desaccord', type:'choix', autre:true, poids:1, titre:"Dans un désaccord avec un proche, que fais-tu ?", cr:"Dans un désaccord : {x}.",
      options:[
        {t:"Je dis les choses tout de suite", p:'M', r:"Dans un désaccord, tu dis les choses tout de suite."},
        {t:"J'attends que ça retombe, puis j'en reparle", p:'A', r:"Dans un désaccord, tu attends que ça retombe, puis tu en reparles."},
        {t:"Je cherche un terrain d'entente", p:'R', r:"Dans un désaccord, tu cherches un terrain d'entente."},
        {t:"J'évite le sujet", k:'efface', ag:{otis:1}, r:"Dans un désaccord, tu évites le sujet."},
        {t:"Je cède pour avoir la paix", k:'efface', ag:{otis:2}, r:"Dans un désaccord, tu cèdes pour avoir la paix."},
        {t:"Je m'emporte, puis je regrette", ag:{otis:1, sol:1}, r:"Dans un désaccord, tu t'emportes, puis tu regrettes."},
        {t:"Je me ferme, je ne dis plus rien", p:'A', k:'efface', ag:{otis:1}, r:"Dans un désaccord, tu te fermes et tu ne dis plus rien."},
        {t:"Ça dépend avec qui", r:"Dans un désaccord, ta réaction dépend de la personne en face."}
      ]},
    {id:'calme', type:'choix', titre:"Après une émotion forte, combien de temps te faut-il pour retrouver ton calme ?", cr:"Pour retrouver ton calme après une émotion forte : {x}.",
      options:["Moins de 10 minutes","Environ 1 heure","Une demi-journée",
        {t:"Une journée", k:'long', ag:{sol:1, ava:1}},
        {t:"Plus de 2 jours", k:'long', ag:{sol:1, ava:2}},
        {t:"Ça dépend de l'émotion", r:"Le temps qu'il te faut pour retrouver ton calme dépend de l'émotion."}]},
    {id:'compliment', type:'choix', titre:"Quand on te fait un compliment, comment réagis-tu ?",
      options:[
        {t:"Je le prends, ça me fait plaisir", r:"Un compliment te fait plaisir, et tu le prends."},
        {t:"Ça me donne de l'élan", r:"Un compliment te donne de l'élan."},
        {t:"Je dis merci, mais je n'y crois pas trop", k:'minimise', ag:{felix:1}, r:"Quand on te complimente, tu dis merci, mais tu n'y crois pas trop."},
        {t:"Je le minimise", k:'minimise', ag:{felix:1}, r:"Tu minimises les compliments."},
        {t:"Je suis {gêné|gênée}, je change de sujet", k:'minimise', ag:{felix:1}, r:"Un compliment te gêne : tu changes de sujet."},
        {t:"Je me méfie un peu", r:"Tu te méfies un peu des compliments."},
        {t:"Je ne sais pas quoi en faire", r:"Un compliment te laisse sans savoir quoi en faire."}
      ]},
    {id:'soutien', type:'choix', autre:true, poids:1, titre:"Quand ça va mal, vers quoi te tournes-tu en premier ?", cr:"Quand ça va mal : {x}.",
      options:[
        {t:"Vers un proche : ami, famille", p:'R', k:'proche', r:"Quand ça va mal, tu te tournes vers un proche."},
        {t:"Vers mon ou ma partenaire", p:'R', k:'proche', r:"Quand ça va mal, tu te tournes vers ton ou ta partenaire."},
        {t:"Vers personne, je gère {seul|seule}", p:'A', k:'seul', ag:{iris:1}, r:"Quand ça va mal, tu gères {seul|seule}."},
        {t:"Vers une activité : sport, musique, dessin…", p:'M', r:"Quand ça va mal, tu te tournes vers une activité."},
        {t:"Vers la nature, dehors", p:'A', r:"Quand ça va mal, tu vas dehors, dans la nature."},
        {t:"Vers ce qui fait du bien sur le moment : manger, fumer, boire…", ag:{neo:2}, r:"Quand ça va mal, tu cherches ce qui fait du bien sur le moment."},
        {t:"Vers les écrans", ag:{neo:1}, r:"Quand ça va mal, tu te tournes vers les écrans."},
        {t:"Vers la prière, la méditation, la spiritualité", p:'A', r:"Quand ça va mal, tu te tournes vers la prière, la méditation ou la spiritualité."},
        {t:"Je ne sais pas", r:"Quand ça va mal, tu ne sais pas trop vers quoi te tourner."}
      ]},
    {id:'imprevu', type:'echelle', titre:"Face à un imprévu, comment réagis-tu ?", gauche:"Ça me déstabilise beaucoup", droite:"Je m'adapte vite", pg:'A', pd:'M', poids:1,
      dits:["Un imprévu te déstabilise beaucoup.","Un imprévu te déstabilise plutôt.","Un imprévu te bouscule, puis tu t'adaptes.","Tu t'adaptes plutôt vite à l'imprévu.","Tu t'adaptes très vite à l'imprévu."]}
  ]},

  {id:'valeurs', titre:"Ce qui compte pour toi", sous:"Tes valeurs, ce qui t'apaise, ce que tu veux voir changer.", fond:'#00A862', teinte:'#D8F2E4', questions:[
    {id:'valeurs', type:'multi', max:3, autre:true, titre:"Quelles sont les trois choses qui comptent le plus pour toi ?", aide:"Trois au plus.", cr:"Ce qui compte le plus pour toi : {x}.",
      options:["La liberté","La sécurité","La famille","L'amitié","L'amour","La réussite","La créativité","La justice","Le respect","L'honnêteté",
               "La santé","La sérénité","Apprendre","Être utile","L'authenticité","L'aventure",{t:"La foi, la spiritualité", c:"la foi"},"Le travail bien fait","La nature","Le plaisir"]},
    {id:'apaise', type:'multi', max:3, autre:true, titre:"Qu'est-ce qui t'apaise vraiment ?", aide:"Trois au plus.", cr:"Ce qui t'apaise : {x}.",
      options:[{t:"Prendre l'air, la nature", c:"prendre l'air"},"La musique",{t:"Bouger, faire du sport", c:"bouger"},{t:"Les gens que j'aime", c:"les gens que tu aimes"},
               "Un moment {seul|seule}",{t:"Créer, bricoler, cuisiner", c:"créer de tes mains"},"Lire","Écrire",{t:"Dormir, me reposer", c:"te reposer"},
               {t:"Un film, une série", c:"un film ou une série"},{t:"Prier, méditer", c:"prier ou méditer"},{t:"Respirer, me poser", c:"respirer et te poser"},
               "Les animaux",{t:"Jouer : jeux vidéo, jeux de société…", c:"jouer"}]},
    {id:'fierte', type:'texte', titre:"De quoi es-tu {fier|fière}, même si c'est petit ?", aide:"Tu peux passer.", exemple:"Ce dont tu es {fier|fière}…", cr:"Ce dont tu es {fier|fière} : « {x} »."},
    {id:'six_mois', type:'choix', autre:true, titre:"Si tout allait mieux dans 6 mois, qu'est-ce qui aurait changé en premier ?", cr:"Si tout allait mieux dans 6 mois, le premier changement serait : « {x} ».",
      options:["Je dormirais mieux","J'aurais plus confiance en moi","Je serais plus {serein|sereine}","Mes relations iraient mieux","J'aurais trouvé ma voie",
               "J'aurais repris la main sur mon temps","J'aurais plus d'énergie","Je me sentirais moins {seul|seule}","J'aurais atteint un objectif précis",
               "Je serais plus en paix avec mon corps","J'aurais moins de pression au travail"]},
    {id:'ne_plus', type:'texte', titre:"Qu'est-ce que tu ne veux plus vivre ?", aide:"Tu peux passer.", exemple:"Ce que tu ne veux plus…", cr:"Ce que tu ne veux plus vivre : « {x} »."}
  ]},

  {id:'energie', titre:"Ton corps et ton énergie", sous:"Ton sommeil, ton énergie, ton rapport au mouvement.", fond:'#FE6601', teinte:'#FFE6D2', questions:[
    {id:'heures', type:'choix', titre:"Combien d'heures dors-tu, une nuit habituelle ?", cr:"Tu dors {x} par nuit.",
      options:[{t:"Moins de 5 h", k:'court', ag:{miro:2}},{t:"5 à 6 h", k:'court', ag:{miro:1}},"6 à 7 h","7 à 8 h","8 à 9 h","Plus de 9 h",
        {t:"Mes horaires changent : travail de nuit, bébé…", r:"Tes horaires de sommeil changent souvent.", ag:{miro:1}}]},
    {id:'reveil', type:'choix', titre:"Au réveil, comment te sens-tu le plus souvent ?", cr:"Au réveil : {x}.",
      options:[
        {t:"{Reposé|Reposée}", r:"Au réveil, tu te sens {reposé|reposée}."},
        {t:"Plutôt en forme", r:"Au réveil, tu es plutôt en forme."},
        {t:"Ça dépend des jours", r:"Au réveil, ça dépend des jours."},
        {t:"{Fatigué|Fatiguée}", k:'fatigue', ag:{miro:1}, r:"Au réveil, tu te sens {fatigué|fatiguée}."},
        {t:"{Épuisé|Épuisée}", k:'fatigue', ag:{miro:1}, r:"Au réveil, tu te sens {épuisé|épuisée}."},
        {t:"Je me réveille plusieurs fois la nuit", k:'fatigue', ag:{miro:2}, r:"Tu te réveilles plusieurs fois la nuit."}
      ]},
    {id:'energie_jour', type:'note', titre:"Ton énergie dans la journée, de 1 à 10 ?", gauche:"À plat", droite:"Pleine forme", cr:"Ton énergie dans la journée : {n} sur 10."},
    {id:'bouger', type:'choix', autre:true, titre:"Bouger, pour toi, c'est quoi ?", cr:"Bouger : {x}.",
      options:[
        {t:"Un plaisir", r:"Bouger, pour toi, c'est un plaisir."},
        {t:"Mon métier, ou ma passion", ag:{kael:2}, r:"Bouger, c'est ton métier ou ta passion."},
        {t:"Une obligation", r:"Bouger, pour toi, c'est une obligation."},
        {t:"Quelque chose que j'aimerais faire plus", r:"Tu aimerais bouger plus."},
        {t:"Difficile en ce moment : temps, fatigue, douleurs…", r:"Bouger est difficile pour toi en ce moment."},
        {t:"Pas pour moi", r:"Bouger, ce n'est pas pour toi."}
      ]},
    {id:'ecrans', type:'choix', titre:"Le soir, avec les écrans, comment ça se passe ?",
      options:[
        {t:"Je décroche facilement", r:"Le soir, tu décroches facilement des écrans."},
        {t:"Je fais défiler plus longtemps que prévu", k:'tard', ag:{neo:1, miro:1}, r:"Le soir, tu fais défiler plus longtemps que prévu."},
        {t:"Je m'endors avec", k:'tard', ag:{miro:1}, r:"Tu t'endors avec les écrans."},
        {t:"Je travaille sur écran tard", k:'tard', ag:{mateo:1, miro:1}, r:"Tu travailles sur écran tard le soir."},
        {t:"Je joue en ligne", ag:{neo:1}, r:"Le soir, tu joues en ligne."},
        {t:"Je n'en utilise presque pas le soir", r:"Le soir, tu utilises peu les écrans."}
      ]}
  ]},

  {id:'echange', titre:"Comment tu veux qu'on te parle", sous:"Pour que MIA te parle comme il te faut.", fond:'#FFC400', teinte:'#FFEBCB', encre:'#000000', questions:[
    {id:'niveau', type:'choix', titre:"Le développement personnel, la préparation mentale, tu connais ?", aide:"Il n'y a pas de bonne réponse. Ça aide MIA à trouver les bons mots.",
      options:[
        {t:"Pas du tout, c'est nouveau pour moi", k:'debutant', r:"Tout ça est nouveau pour toi : MIA parlera simplement, sans jargon."},
        {t:"Un peu, j'ai lu ou écouté des choses", k:'curieux', r:"Tu as déjà lu ou écouté des choses sur ces sujets."},
        {t:"Oui, je m'y intéresse depuis longtemps", k:'avance', r:"Tu t'intéresses à ces sujets depuis longtemps : MIA pourra aller plus loin, avec des outils précis."},
        {t:"J'ai déjà été {accompagné|accompagnée} par un professionnel", k:'accompagne', r:"Tu as déjà été {accompagné|accompagnée} : tu sais ce que ça demande."},
        {t:"Je n'y crois pas trop, mais je veux essayer", k:'sceptique', r:"Tu n'y crois pas trop, mais tu es là pour essayer : MIA devra faire ses preuves."},
        {t:"Je me méfie des applications comme celle-ci", k:'mefiant', r:"Tu te méfies des applications comme celle-ci. MIA ne te demandera jamais plus que ce que tu veux bien dire."}
      ]},
    {id:'franchise', type:'echelle', titre:"Comment préfères-tu qu'on te dise les choses ?", gauche:"En douceur", droite:"Sans détour",
      dits:["MIA te dira les choses en douceur.","MIA te dira les choses plutôt en douceur.","MIA te dira les choses avec tact, sans tourner autour.","MIA te dira les choses plutôt sans détour.","MIA te dira les choses sans détour."]},
    {id:'longueur', type:'choix', titre:"Quelle longueur de réponse te convient ?",
      options:[
        {t:"Très courtes, l'essentiel", k:'tres_court', r:"Ses réponses iront à l'essentiel, en une ou deux phrases."},
        {t:"Courtes et nettes", k:'court', r:"Ses réponses seront courtes et nettes."},
        {t:"Moyennes", k:'moyen', r:"Ses réponses seront de longueur moyenne."},
        {t:"Développées quand il le faut", k:'long', r:"Ses réponses se développeront quand il le faut."},
        {t:"Ça dépend du moment", k:'variable', r:"La longueur de ses réponses suivra le moment."}
      ]},
    {id:'piste', type:'echelle', titre:"Qu'est-ce qui t'aide le plus ?", gauche:"Des questions pour réfléchir", droite:"Des pistes concrètes",
      dits:["Elle t'aidera par des questions, pour réfléchir.","Elle t'aidera plutôt par des questions.","Elle mêlera questions et pistes concrètes.","Elle te proposera plutôt des pistes concrètes.","Elle te proposera des pistes concrètes, vite."]},
    {id:'humour', type:'choix', titre:"L'humour, même quand c'est dur, est-ce que ça t'aide ?",
      options:[
        {t:"Oui, ça m'aide beaucoup", k:'oui', r:"Elle pourra glisser de l'humour."},
        {t:"Un peu, avec tact", k:'tact', r:"Elle gardera l'humour pour les bons moments, avec tact."},
        {t:"Seulement quand ça va mieux", k:'apres', r:"Elle attendra que ça aille mieux pour l'humour."},
        {t:"Non, pas du tout", k:'non', r:"Elle n'utilisera pas d'humour."}
      ]},
    {id:'relance', type:'choix', titre:"Quand tu n'as pas fait ce que tu avais prévu, que veux-tu que MIA fasse ?",
      options:[
        {t:"Qu'elle me relance franchement", k:'franche', r:"Si tu n'as pas fait ce que tu avais prévu, elle te relancera franchement."},
        {t:"Qu'elle me le rappelle doucement", k:'douce', r:"Si tu n'as pas fait ce que tu avais prévu, elle te le rappellera doucement."},
        {t:"Qu'elle me demande ce qui a bloqué", k:'comprendre', r:"Si tu n'as pas fait ce que tu avais prévu, elle te demandera ce qui a bloqué."},
        {t:"Qu'elle me propose un pas plus petit", k:'plus_petit', r:"Si tu n'as pas fait ce que tu avais prévu, elle te proposera un pas plus petit."},
        {t:"Qu'elle n'en parle que si j'en parle", k:'silence', r:"Elle ne parlera d'un pas non fait que si tu en parles."}
      ]},
    {id:'moment_parler', type:'choix', titre:"À quel moment aimerais-tu le plus parler avec MIA ?",
      options:[
        {t:"Le matin", m:"le matin", r:"Ton moment pour parler avec MIA : le matin."},
        {t:"Pendant mes pauses", m:"pendant tes pauses", r:"Ton moment pour parler avec MIA : pendant tes pauses."},
        {t:"Sur le trajet", m:"sur le trajet", r:"Ton moment pour parler avec MIA : sur le trajet."},
        {t:"Le soir", m:"le soir", r:"Ton moment pour parler avec MIA : le soir."},
        {t:"La nuit", m:"la nuit", r:"Ton moment pour parler avec MIA : la nuit."},
        {t:"Quand ça ne va pas", m:"quand ça ne va pas", r:"Tu aimerais parler avec MIA quand ça ne va pas."},
        {t:"N'importe quand", m:"n'importe quand", k:'tout', r:"Tu parleras avec MIA n'importe quand."}
      ]}
  ]},

  {id:'cap', titre:"Ton cap", sous:"Une seule chose à travailler en premier.", fond:'#974AF0', teinte:'#EDE1FF', questions:[
    {id:'cap', type:'texte', requis:true, idees:true, titre:"Si on ne devait travailler qu'une seule chose ensemble, ce serait laquelle ?", aide:"Choisis une idée ou écris la tienne.", exemple:"Ton cap…", cr:"Ton cap : « {x} »."},
    {id:'pourquoi', type:'texte', titre:"Pourquoi maintenant ?", aide:"Tu peux passer.", exemple:"Ce qui fait que c'est le moment…", cr:"Pourquoi maintenant : « {x} »."},
    {id:'signe', type:'texte', titre:"À quoi verras-tu que ça avance ?", aide:"Un signe concret, même petit. Tu peux passer.", exemple:"Le signe…", cr:"Tu sauras que ça avance quand : « {x} »."},
    {id:'pret', type:'note', titre:"À quel point es-tu {prêt|prête} à t'y mettre, de 1 à 10 ?", gauche:"Pas encore", droite:"Complètement", cr:"Tu es {prêt|prête} à t'y mettre à {n} sur 10."}
  ]}
];

/* Les parties du compte-rendu de fin, et les questions qui les nourrissent. */
var SECTIONS_CR=[
  {id:'bref', titre:"En bref", fond:'#974AF0', teinte:'#EDE1FF'},
  {id:'situation', titre:"Là où tu en es", fond:'#6F2FC0', teinte:'#E6D9FF', q:['age','activite','foyer','periode','duree','sujets','boussole','phrase']},
  {id:'fonctionnement', titre:"Comment tu fonctionnes", fond:'#224CF2', teinte:'#DFE8FF', q:['recharge','projet','decision','nouveaute','exigence','emotions','moteur','moment']},
  {id:'reactions', titre:"Comment tu réagis", fond:'#E8467F', teinte:'#FFE0EC', q:['pression','echec','desaccord','calme','compliment','soutien','imprevu']},
  {id:'interets', titre:"Ce qui compte pour toi", fond:'#00A862', teinte:'#D8F2E4', q:['valeurs','apaise','fierte','six_mois','ne_plus']},
  {id:'energie', titre:"Ton corps et ton énergie", fond:'#FE6601', teinte:'#FFE6D2', q:['heures','reveil','energie_jour','bouger','ecrans']},
  {id:'appuis', titre:"Tes appuis et tes points de vigilance", fond:'#6F2FC0', teinte:'#E6D9FF'},
  {id:'echange', titre:"Comment MIA va te parler", fond:'#FFC400', teinte:'#FFEBCB', q:['niveau','franchise','longueur','piste','humour','relance','moment_parler']},
  {id:'cap', titre:"Ton cap", fond:'#974AF0', teinte:'#EDE1FF', q:['cap','pourquoi','signe','pret']}
];

