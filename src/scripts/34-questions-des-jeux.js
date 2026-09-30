/* ══════════════════════════════════════════════════════════════════════════
   QUESTIONS DES JEUX, REFORMULÉES — demande du 30/09/2026
   « Reformule simplement les questions, avec des points d'interrogation. »

   Chaque question devient une vraie question et rappelle son sujet, pour se
   comprendre seule (quelqu'un qui revient après une interruption doit savoir
   de quoi on parle). Les réponses ne changent pas. Base : les propositions A de
   docs/questions-des-jeux-propositions.md.

   Posées ici, en fin de chaîne, par-dessus les titres des dossiers : un seul
   endroit pour relire ou retoucher toutes les questions. Clés : q0, q0b, q1 à
   q5, irr (question 3 de la branche irrégulière), c1 et c2 (branche courte),
   q4First (MIA, premier passage), q2Food (Nora, variante manger). Neo garde
   ses repères {sans} {place} {prend} {mot}, remplacés par le mot choisi.
   Accords au féminin : règles ajoutées dans 30-genre.js pour les nouvelles
   tournures (« journée de travail satisfait », « tu es entouré »).
   ══════════════════════════════════════════════════════════════════════════ */

var Q5_COMMUNE='Cette semaine, qu’est-ce que tu te sens capable de faire ?';
var QUESTIONS_V2={
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
    var g=GAMES[theme], v=QUESTIONS_V2[theme]; if(!g) return;
    function set(q, title){ if(q && title) q.title=title; }
    ['q0','q0b','q1','q2','q3','q4','q4First','q2Food'].forEach(function(k){ set(g[k], v[k]); });
    if(g.q3 && v.irr) g.q3.titleIrregular=v.irr;
    set(g.q5, v.q5 || Q5_COMMUNE);
    if(g.short){ set(g.short.q1, v.c1); set(g.short.q2, v.c2); }
  });
})();
