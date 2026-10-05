# Architecture

## Principe

Application d'une seule page, en JavaScript natif, sans framework et sans étape de compilation.
Toutes les vues coexistent dans le balisage et sont montrées ou masquées par opacité, jamais par
`display:none`, pour que les animations et la mesure de position restent possibles.

Le livrable est **un seul fichier** : `dist/index.html`. Styles et scripts y sont intégrés.
Le découpage de `src/` sert au travail en éditeur ; l'assemblage reproduit le fichier au
caractère près.

## Pourquoi un seul bloc script

Tous les fichiers de `src/scripts/` sont concaténés dans **un unique `<script>`**.
Ce n'est pas un détail d'implémentation, c'est une contrainte de correction.

En JavaScript, dans un même bloc, toutes les déclarations `function` sont remontées en tête
avant la moindre exécution. Le code s'appuie sur ce comportement : une fonction déclarée dans
`00-noyau.js` peut être remplacée par une redéclaration dans `10-couleurs-pleines.js`, et les
appels faits par le noyau utiliseront la version tardive.

Séparer les fichiers en balises `<script>` distinctes, ou en modules ES, casserait cette
remontée : chaque fichier ne verrait que les déclarations déjà exécutées. Le comportement
changerait silencieusement.

Le nettoyage des redéfinitions (voir `fonctions-redefinies.md`) est le préalable à toute
modularisation réelle.

## Ordre des couches

| Fichier | Rôle |
|---|---|
| `00-noyau.js` | État, traductions, liste des accompagnants, rendu, conversation, questionnaire de profil, objectifs, humeur, inscription |
| `01-freemium-et-crise.js` | Formules, paywall, parcours d'abonnement, écran de redirection de crise |
| `02-favoris-et-focus.js` | Étoiles, bande de l'accueil, tiroir, accompagnant de la semaine |
| `03-cap-et-objectifs.js` | Cap en héros, carte de la semaine, suivi complet |
| `04-composant-agents.js` | Composant de ligne partagé entre accueil, tiroir et panneau du chat |
| `05-objectifs-refonte.js` | Onglet objectifs, défis et jalons |
| `06-roulette-et-animations.js` | Roulette d'année de naissance, révélation au défilement |
| `07-supervision.js` | Feuille de route, bilan, signaux, espace de suivi |
| `08-sons-et-icones.js` | Dix bruitages de synthèse, aucun fichier audio |
| `09-couleur-questionnaires.js` | Retour arrière, moteur du questionnaire de cap, routage des sons |
| `10-couleurs-pleines.js` | Passage aux fonds saturés, cartes de l'accueil |
| `11-palette-enregistree.js` | Palette nommée, fond du chat suivant l'accompagnant, verrou anti double appui |
| `12-teintes-de-reponse.js` | Une teinte de réponse par couleur de fond |
| `13-teintes-calculees.js` | Calcul de teinte, favoris depuis le chat, correctif de paiement |
| `14-palette-et-accueil.js` | Rose dans la palette, objectifs sur l'accueil, humeur déplacée |
| `15-presentation-accompagnants.js` | Fiches détaillées des seize accompagnants |
| `16-palette-finale.js` | Attribution finale des couleurs par thème |
| `17` à `34` | Intelligence (17), jeux et entourage (18 à 29, 31, 33, 34), genre (30), emplacements de la voix (32) |
| `35-securite-et-confiance.js` | Risque repéré dans chaque message, carte de prévention, alerte au professionnel, signatures réelles, Studio rangé (05/10/2026) |
| `36-voix-prete.js` | Voix prête à brancher : fiches de voix, doublure du navigateur, serveur avec cache, décompte et plafond |
| `37-consignes-v2.js` | Consignes v2, protocole de sécurité non modifiable, appel en blocs mis en cache, modèles |
| `38-dossier-et-suivi.js` | Dossier de la personne, pas datés, consigne du tour, lecture des messages, choix en boutons, « Ton pas » |
| `39-entree-par-conversation.js` | « Commencer » vers MIA, cap proposé dans la discussion, compte en version courte, accès rapide |

Les feuilles de style suivent la même logique : `00-base.css` porte l'essentiel, les suivantes
sont des passes correctives. Dans une feuille de style, c'est la **dernière règle de même
spécificité** qui gagne ; certaines corrections en dépendent.

## Modèle de données

Un seul objet `state`, en portée lexicale (il n'est pas exposé sur `window`).

| Champ | Contenu |
|---|---|
| `tier` | `free`, `maynd` ou `plus` |
| `profile` | Profil issu du questionnaire psychologique |
| `cap`, `capMeta` | Cap formulé, ou objectif de mieux se connaître |
| `objectives[]` | Objectifs, avec avancement et accompagnant lié |
| `favorites[]` | Accompagnants mis en avant |
| `focus` | Accompagnant de la semaine |
| `objAnswers` | Réponses complètes au questionnaire de cap, destinées au professionnel |
| `moods[]`, `streak`, `quests` | Suivi |
| `pro` | Professionnel référent |

La persistance est **active depuis le 21/07/2026** : `persist()` écrit l'état dans `localStorage` et
`loadState()` le restaure (voir CLAUDE.md, section 3). Depuis le 05/10/2026, `dossier` (mémoire de la
personne, pas datés), `alertes`, `risque`, `signauxConversation`, `roadmapSigned` et `voixUsage`
s'y ajoutent.

## Calibrage des accompagnants

Ces règles sont contractuelles, pas esthétiques. Elles sont vérifiées par les tests.

- **Kael** ne pousse jamais au dépassement à tout prix
- **Eden** maintient une neutralité sans jugement, le consentement n'est pas négociable
- **Neo** ne pose aucune étiquette
- **Ava** n'impose aucune étape ni calendrier au deuil
- **Soren** parle de « l'autre parent », jamais du père ni de la mère
- **Leo** ne se prononce jamais sur le partenaire absent
- Aucun terme clinique nulle part, aucun titre réglementé
- Protocole de crise partagé : 3114, SOS Amitié, SAMU

## Accessibilité et lisibilité

Le contraste des lettres blanches sur les couleurs d'accompagnants est calculé, pas estimé.
Une seule couleur, le jaune de Felix, est trop claire pour du blanc : son initiale et sa fiche
passent en noir, via `LIGHT_AGENTS`.

Les animations respectent `prefers-reduced-motion`.
