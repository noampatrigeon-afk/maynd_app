# Fonctions redéfinies et enveloppées

L'application a été construite par couches successives. Deux mécanismes se superposent :

1. **Redéclaration.** Plusieurs `function X()` portent le même nom. Dans un même bloc `<script>`,
   toutes les déclarations sont remontées en tête et **la dernière l'emporte**. Les précédentes
   sont du code mort.
2. **Enveloppe.** Certaines fonctions sont réassignées via `window.X = function(){ ... }` pour
   ajouter un comportement autour de l'existant. L'enveloppe s'exécute au chargement et
   **écrase la déclaration**, quelle qu'elle soit.

Conséquence pratique : pour modifier un comportement, chercher **la dernière** occurrence,
pas la première. C'est la principale source de confusion pour quelqu'un qui reprend ce code.

Avant toute reprise sérieuse : supprimer les versions mortes, puis relancer `npm test`.

**Cas particulier : `DEFAULT_PERSONAS.mia`.** Ce n'est ni une redéclaration ni une enveloppe :
`17-refonte-intelligence.js` mute une seule fois, au chargement, la propriété `mia` de l'objet
`DEFAULT_PERSONAS` (`DEFAULT_PERSONAS.mia += ...`). `DEFAULT_PERSONAS` est un `const`, donc
non réassignable dans son ensemble, mais une propriété d'objet reste mutable — ça ne duplique
rien puisque la mutation n'a lieu qu'une fois, avant toute interaction. `getPersona()` n'est pas
touchée : le Studio des accompagnants continue de lire/écrire `DEFAULT_PERSONAS.mia` (déjà
augmenté) sans rien de spécial à gérer côté édition.

**Même cas pour `DEFAULT_PERSONAS.soren` (29/09/2026).** `26-jeux-lot-3.js` y ajoute une phrase, une seule fois au chargement : « aucun conseil d'éducation », demandé par le dossier du lot 3 des jeux.

**Cas particulier : `composeSystem`.** Deux déclarations, dans deux fichiers différents (pas une
redéfinition classique dans le même fichier). `17-refonte-intelligence.js` déclare son propre
`function composeSystem(){...}` (chantier du croisement multi-accompagnants), qui remplace celle
de `00-noyau.js` au moment du hissage — les déclarations de fonction sont toutes hissées avant la
première ligne exécutée, et entre deux déclarations de même nom, la dernière du fichier l'emporte
déjà à cet instant, quelle que soit sa position relative aux enveloppes. L'enveloppe de
`composeSystem` (un peu plus bas dans le même fichier) capture donc automatiquement cette nouvelle
version comme `base`, sans rien à changer de son côté.

**Cas particulier : `renderObjectives`.** Cinq enveloppes empilées, chacune ajoutant son propre
bloc à `#obj-pad` après avoir appelé sa `base` — la base la plus profonde reconstruit tout le pad
(`$('obj-pad').innerHTML=h`, pas d'ajout incrémental), donc chaque enveloppe réinjecte son bloc à
chaque appel plutôt que de vérifier une seule fois s'il existe déjà. Ordre d'exécution donc ordre
visuel final (du haut vers le bas de l'onglet Parcours) : `18-moteur-des-jeux.js` insère « Jeux »
tout en haut (`insertAdjacentHTML('afterbegin', ...)`, après que tout le reste a déjà été construit
par les couches en dessous) ; puis le contenu de la base (cap, profil, boussole, niveau, défis,
objectifs) ; puis `14-palette-et-accueil.js` ajoute « Ton suivi » (humeur) en bas ; puis
`16-palette-finale.js` ajoute « Chemin parcouru » tout en bas. `06-roulette-et-animations.js` et
`09-couleur-questionnaires.js` sont des enveloppes sans effet visuel sur l'ordre (animation
d'apparition et couleur des titres de section).

> **Mise à jour du 29/09/2026 (`22-retours-du-29-09.js`) :** la section « Jeux » n'apparaît plus.
> L'enveloppe de `18` est toujours là, mais elle appelle `renderGamesSectionHTML()` par son nom,
> et `22` redéclare cette fonction pour qu'elle renvoie une chaîne vide. Une sixième enveloppe,
> dans `22`, insère le bloc « Ton entourage » juste avant le titre « Ta supervision » (repéré par
> son texte). Ordre visuel actuel : cap, profil et objectif de la semaine, Ton entourage, Ta
> supervision, puis la suite inchangée.

**Cas particulier : `gameRenderQuestion`.** Deux déclarations dans deux fichiers différents
(comme `composeSystem`) : `20-ecrans-jeu-refonte.js` redéfinit en entier le gabarit visuel des
deux écrans d'un jeu (réflexion, réponses), en gardant volontairement le même id `#game-opts` et
la même mécanique `display:none`→`''` que la version de `18-moteur-des-jeux.js`, pour ne rien
casser de `tests/30-moteur-des-jeux.mjs`. Les autres fonctions du moteur (`gameQuestionDef`,
`gameOptionsHTML`, `gamePick`, `gameAdvance`, `gameAbandon`) restent celles de `18` ; seules
`gameRenderQuestion`, `gameShowOptions`, `gameRenderRestitution` et `gameRenderSortie` sont
touchées par ce chantier (les deux dernières par simple enveloppe, pour retirer la teinte de
fond en quittant les deux écrans concernés).

> **Mise à jour du 29/09/2026 :** `22-retours-du-29-09.js` redéclare `gameRenderRestitution` (le
> lien « Voir tes réponses du … » y remonte) et `gameRenderSortie` (plus d'écran de sortie : réveil
> de l'accompagnant du jeu, fermeture, ouverture de la fiche de présentation). Les enveloppes de `20`
> capturent ces nouvelles déclarations au hissage, sans rien à changer de leur côté.

| Fonction | Déclarations | Enveloppes | Version qui s'applique | Fichiers concernés |
|---|---|---|---|---|
| `obShow` | 1 | 7 | 15-presentation-accompagnants.js (enveloppe) | 00-noyau.js |
| `renderObjectives` | 4 | 7 | 23-suivi-quotidien.js (enveloppe) | 00-noyau.js (x2), 03-cap-et-objectifs.js, 05-objectifs-refonte.js |
| `qzRenderCrisis` | 2 | 3 | 10-couleurs-pleines.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `showTab` | 1 | 4 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `addParticipant` | 3 | 3 | 19-carte-entourage.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js, 11-palette-enregistree.js, 17-refonte-intelligence.js |
| `enterApp` | 1 | 3 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `obPay` | 2 | 2 | 13-teintes-calculees.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `objqRenderQ` | 4 | 0 | 10-couleurs-pleines.js | 05-objectifs-refonte.js, 09-couleur-questionnaires.js, 10-couleurs-pleines.js |
| `qzRenderQuestion` | 4 | 0 | 10-couleurs-pleines.js | 00-noyau.js, 09-couleur-questionnaires.js, 10-couleurs-pleines.js |
| `startObrient` | 5 | 0 | 16-palette-finale.js | 03-cap-et-objectifs.js, 05-objectifs-refonte.js, 09-couleur-questionnaires.js, 13-teintes-calculees.js |
| `startWithAgent` | 3 | 3 | 22-retours-du-29-09.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js, 11-palette-enregistree.js |
| `addObjective` | 2 | 2 | 16-palette-finale.js (enveloppe) | 00-noyau.js |
| `agentRowHTML` | 3 | 0 | 13-teintes-calculees.js | 02-favoris-et-focus.js, 04-composant-agents.js |
| `objqAdvance` | 2 | 1 | 11-palette-enregistree.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `objqFinish` | 3 | 1 | 16-palette-finale.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js, 13-teintes-calculees.js |
| `objqPick` | 2 | 1 | 11-palette-enregistree.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `proBadgeSVG` | 3 | 0 | 13-teintes-calculees.js | 07-supervision.js, 12-teintes-de-reponse.js |
| `qzShowResult` | 1 | 2 | 10-couleurs-pleines.js (enveloppe) | 00-noyau.js |
| `renderDrawer` | 4 | 0 | 22-retours-du-29-09.js | 00-noyau.js, 02-favoris-et-focus.js, 04-composant-agents.js |
| `renderParts` | 3 | 0 | 04-composant-agents.js | 00-noyau.js, 04-composant-agents.js |
| `renderStrip` | 3 | 0 | 04-composant-agents.js | 00-noyau.js, 02-favoris-et-focus.js |
| `startObjQuiz` | 3 | 0 | 13-teintes-calculees.js | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `closeFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `closeSheet` | 1 | 1 | 09-couleur-questionnaires.js (enveloppe) | 00-noyau.js |
| `createObjective` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `callDeepSeek` | 2 | 0 | 17-refonte-intelligence.js | 00-noyau.js |
| `callClaude` | 2 | 0 | 17-refonte-intelligence.js | 00-noyau.js |
| `parseSignals` | 2 | 0 | 17-refonte-intelligence.js | 00-noyau.js |
| `handleJoin` | 2 | 0 | 17-refonte-intelligence.js | 00-noyau.js |
| `renderMessages` | 2 | 0 | 17-refonte-intelligence.js | 00-noyau.js |
| `removeParticipant` | 1 | 1 | 17-refonte-intelligence.js (enveloppe) | 00-noyau.js |
| `computeLengthBudget` | 1 | 0 | 17-refonte-intelligence.js | 17-refonte-intelligence.js |
| `addBubbleSplit` | 1 | 0 | 17-refonte-intelligence.js | 17-refonte-intelligence.js |
| `regenerateEtatCourant` | 1 | 0 | 17-refonte-intelligence.js | 17-refonte-intelligence.js |
| `arrivalNoteEl` / `withdrawArrival` | 1 | 0 | 17-refonte-intelligence.js | 17-refonte-intelligence.js |
| `setProvider` | 1 | 0 | 00-noyau.js | 00-noyau.js |
| `deckSync` | 1 | 3 | 25-fiches-compactes.js (enveloppe) | 15-presentation-accompagnants.js |
| `deleteObjective` | 1 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `feat` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `init` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `isUnlocked` | 3 | 0 | 17-refonte-intelligence.js | 00-noyau.js (x2), 17-refonte-intelligence.js |
| `newConversation` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `addSecondaryFromCap` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `getPrincipalObjective` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `obEnterAndQuiz` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `obEnterSkipQuiz` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `objqAfter` | 2 | 1 | 16-palette-finale.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `objqClose` | 2 | 0 | 09-couleur-questionnaires.js | 05-objectifs-refonte.js |
| `openAgentDeck` | 1 | 3 | 25-fiches-compactes.js (enveloppe) | 15-presentation-accompagnants.js |
| `openChat` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `openFocusSheet` | 2 | 0 | 02-favoris-et-focus.js | 00-noyau.js |
| `openFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `openObjSheet` | 2 | 1 | 16-palette-finale.js (enveloppe) | 00-noyau.js |
| `renderHomeGoals` | 2 | 0 | 16-palette-finale.js | 14-palette-et-accueil.js |
| `openSheet` | 1 | 1 | 09-couleur-questionnaires.js (enveloppe) | 00-noyau.js |
| `openThread` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `openUpgrade` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `openUpsell` | 2 | 1 | 16-palette-finale.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `promoteObjective` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `sameMonth` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `countHits` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `paintChat` | 2 | 0 | 13-teintes-calculees.js | 11-palette-enregistree.js |
| `proSignals` | 2 | 0 | 16-palette-finale.js | 07-supervision.js |
| `qTheme` | 2 | 0 | 10-couleurs-pleines.js | 10-couleurs-pleines.js |
| `recentUserText` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `qzFinish` | 1 | 2 | 16-palette-finale.js (enveloppe) | 00-noyau.js |
| `qzHeadHTML` | 2 | 0 | 10-couleurs-pleines.js | 09-couleur-questionnaires.js |
| `qzPaint` | 2 | 0 | 12-teintes-de-reponse.js | 10-couleurs-pleines.js |
| `qzPick` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `renderAgentList` | 2 | 1 | 19-carte-entourage.js (enveloppe) | 04-composant-agents.js, 15-presentation-accompagnants.js |
| `renderBadges` | 2 | 0 | 05-objectifs-refonte.js | 00-noyau.js |
| `renderChatHeader` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `renderFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `renderJRow` | 2 | 0 | 10-couleurs-pleines.js | 10-couleurs-pleines.js |
| `renderProBlock` | 2 | 0 | 13-teintes-calculees.js | 07-supervision.js |
| `renderSuivi` | 1 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `send` | 3 | 0 | 17-refonte-intelligence.js | 00-noyau.js, 17-refonte-intelligence.js |
| `setTier` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `sfx` | 2 | 0 | 08-sons-et-icones.js | 06-roulette-et-animations.js |
| `stepObjective` | 1 | 2 | 16-palette-finale.js (enveloppe) | 00-noyau.js |
| `renderProSheet` | 1 | 3 | 16-palette-finale.js (enveloppe) | 07-supervision.js |
| `openProDashboard` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `closeProDashboard` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `draftBilanText` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `signBilan` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `renderProDashboard` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `composeSystem` | 2 | 2 | 17-refonte-intelligence.js (enveloppe) | 00-noyau.js, 16-palette-finale.js, 17-refonte-intelligence.js |
| `openDeepSheet` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `renderDeepStep` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `deepNext` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `deepPick` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `finishDeepSheet` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `validateClosure` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `renderObjIntro` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `renameObjective` | 1 | 0 | 16-palette-finale.js | 16-palette-finale.js |
| `toggleFav` | 2 | 0 | 13-teintes-calculees.js | 02-favoris-et-focus.js |
| `togglePart` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `gameRenderQuestion` | 2 | 1 | 24-jeux-lot-2.js (enveloppe : libellé de la question préalable) | 18-moteur-des-jeux.js, 20-ecrans-jeu-refonte.js |
| `gameShowOptions` | 1 | 1 | 20-ecrans-jeu-refonte.js (enveloppe) | 18-moteur-des-jeux.js |
| `gameRenderRestitution` | 2 | 1 | 20-ecrans-jeu-refonte.js (enveloppe de la déclaration de 22) | 18-moteur-des-jeux.js, 22-retours-du-29-09.js |
| `gameRenderSortie` | 2 | 1 | 20-ecrans-jeu-refonte.js (enveloppe de la déclaration de 22) | 18-moteur-des-jeux.js, 22-retours-du-29-09.js |
| `deckFav` | 2 | 1 | 25-fiches-compactes.js (enveloppe de la déclaration de 22) | 15-presentation-accompagnants.js |
| `renderSleepFiche` | 2 | 0 | 22-retours-du-29-09.js | 21-fiche-recapitulatif.js |
| `renderGamesSectionHTML` | 2 | 0 | 22-retours-du-29-09.js (renvoie une chaîne vide) | 18-moteur-des-jeux.js |
| `entTap` | 1 | 1 | 22-retours-du-29-09.js (enveloppe) | 19-carte-entourage.js |
| `closeRecap` | 1 | 1 | 22-retours-du-29-09.js (enveloppe : désarme « Endormir tout le monde ») | 21-fiche-recapitulatif.js |
| `renderSuivi` | 2 | 1 | 14-palette-et-accueil.js (enveloppe de la déclaration de 23) | 00-noyau.js, 23-suivi-quotidien.js |
| `validateMood` | 1 | 1 | 23-suivi-quotidien.js (enveloppe : enchaîne sur la boussole) | 00-noyau.js |
| `openMoodScreen` | 1 | 1 | 23-suivi-quotidien.js (enveloppe) | 00-noyau.js |
| `setWheel` | 1 | 1 | 23-suivi-quotidien.js (enveloppe : relevé du jour) | 00-noyau.js |
| `objSheetDone` | 1 | 1 | 23-suivi-quotidien.js (enveloppe) | 00-noyau.js |
| `gameOrder` | 2 | 0 | 24-jeux-lot-2.js (question préalable q0) | 18-moteur-des-jeux.js |
| `openGame` | 1 | 1 | 24-jeux-lot-2.js (enveloppe : démarre sur q0) | 18-moteur-des-jeux.js |
| `gamePick` | 1 | 1 | 24-jeux-lot-2.js (enveloppe : bascule directe) | 18-moteur-des-jeux.js |
| `deckAddSecond` | 1 | 1 | 25-fiches-compactes.js (enveloppe) | 22-retours-du-29-09.js |
| `closeDeck` | 1 | 1 | 25-fiches-compactes.js (enveloppe) | 15-presentation-accompagnants.js |
