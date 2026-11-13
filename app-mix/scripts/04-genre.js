/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — MASCULIN / FÉMININ (13/11/2026)
   Deux mécanismes, repris de MAYND (30-genre.js) et du Tunnel :
   1. Les textes d'App mix portent des paires {masculin|féminin}, résolues par tx()
      (11-texte.js) selon la réponse « Tu es… ? ». « Je préfère ne pas répondre »
      s'écrit au masculin, choix explicite du porteur du projet.
   2. Les contenus repris de MAYND (jeux, fiches) sont écrits au masculin ;
      accordFeminin() les accorde par règles ciblées sur des tournures précises.
      Jamais appliqué au fil de discussion ni aux saisies.
   Les accompagnantes (MIA, Ava, Iris, Eden, Nora) sont au féminin quel que soit
   le genre de la personne.
   ══════════════════════════════════════════════════════════════════════════ */

const FEM_RULES=[
  [/(t['’]es(?:\s+(?:pas|jamais|vraiment|déjà|toujours))*\s+)(senti|réveillé|forcé|préparé|organisé|inscrit|informé|entraîné|dépensé|rempli|occupé)(?![\p{L}])/gu, '$1$2e'],
  [/(réveillée(?:\s+vraiment)?\s+)reposé(?![\p{L}])/gu, '$1reposée'],
  [/((?:te|me)\s+sens(?:\s+(?:pas|plus))?\s+|d['’]être\s+)prêt(?![\p{L}])/gu, '$1prête'],
  [/((?:te|me)\s+sens(?:\s+(?:pas|plus))?\s+)(obligé|soutenu)(?![\p{L}])/gu, '$1$2e'],
  [/((?:suis|es|sens|tout,)\s+)seul(?![\p{L}])/gu, '$1seule'],
  [/(?<![\p{L}])Seul(\s+depuis)/gu, 'Seule$1'],
  [/(même\s+)entouré(?![\p{L}])/gu, '$1entourée'],
  [/((?:suis|es)\s+plus\s+)dur(?![\p{L}])/gu, '$1dure'],
  [/((?:suis|es)\s+)(épuisé|fatigué|sorti)(?![\p{L}])/gu, '$1$2e'],
  [/(journée(?:\s+de\s+travail)?\s+)satisfait(?![\p{L}])/gu, '$1satisfaite'],
  [/(tu\s+es\s+)entouré(?![\p{L}])/gu, '$1entourée'],
  [/(fois\s+)lancé(?![\p{L}])/gu, '$1lancée'],
  [/(été\s+)fier(?![\p{L}])/gu, '$1fière'],
  [/(?<![\p{L}])tel(\s+que\s+(?:je\s+suis|tu\s+es))/gu, 'telle$1'],
  [/(?<![\p{L}])Séparé(?![\p{L}])/gu, 'Séparée'],
  [/Le Relieur/g, 'La Relieuse'], [/Le Stratège/g, 'La Stratège'], [/Le Fédérateur/g, 'La Fédératrice'],
  [/Le Bâtisseur/g, 'La Bâtisseuse'], [/Le Tacticien/g, 'La Tacticienne'], [/Le Médiateur/g, 'La Médiatrice'],
  [/L['’]Observateur/g, 'L’Observatrice']
];
function accordFeminin(str){
  if(typeof str!=='string' || !str) return str;
  let out=str;
  FEM_RULES.forEach(function(r){ out=out.replace(r[0], r[1]); });
  return out;
}
const AGENT_FEM=['mia','ava','iris','eden','nora'];
function agentFem(id){ return AGENT_FEM.indexOf(id)>=0; }
/* Pronoms d'un accompagnant : « il » ou « elle ». */
function pron(id){ return agentFem(id) ? {il:'elle', le:'la', Il:'Elle', Le:'La'} : {il:'il', le:'le', Il:'Il', Le:'Le'}; }
