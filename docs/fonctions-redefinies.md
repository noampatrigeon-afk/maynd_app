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

| Fonction | Déclarations | Enveloppes | Version qui s'applique | Fichiers concernés |
|---|---|---|---|---|
| `obShow` | 1 | 7 | 15-presentation-accompagnants.js (enveloppe) | 00-noyau.js |
| `renderObjectives` | 4 | 2 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js, 03-cap-et-objectifs.js, 05-objectifs-refonte.js |
| `qzRenderCrisis` | 2 | 3 | 10-couleurs-pleines.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `showTab` | 1 | 4 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `addParticipant` | 3 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `enterApp` | 1 | 3 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `obPay` | 2 | 2 | 13-teintes-calculees.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `objqRenderQ` | 4 | 0 | 10-couleurs-pleines.js | 05-objectifs-refonte.js, 09-couleur-questionnaires.js, 10-couleurs-pleines.js |
| `qzRenderQuestion` | 4 | 0 | 10-couleurs-pleines.js | 00-noyau.js, 09-couleur-questionnaires.js, 10-couleurs-pleines.js |
| `startObrient` | 4 | 0 | 13-teintes-calculees.js | 03-cap-et-objectifs.js, 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `startWithAgent` | 3 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js, 01-freemium-et-crise.js |
| `addObjective` | 2 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `agentRowHTML` | 3 | 0 | 13-teintes-calculees.js | 02-favoris-et-focus.js, 04-composant-agents.js |
| `objqAdvance` | 2 | 1 | 11-palette-enregistree.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `objqFinish` | 3 | 0 | 13-teintes-calculees.js | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `objqPick` | 2 | 1 | 11-palette-enregistree.js (enveloppe) | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `proBadgeSVG` | 3 | 0 | 13-teintes-calculees.js | 07-supervision.js, 12-teintes-de-reponse.js |
| `qzShowResult` | 1 | 2 | 10-couleurs-pleines.js (enveloppe) | 00-noyau.js |
| `renderDrawer` | 3 | 0 | 04-composant-agents.js | 00-noyau.js, 02-favoris-et-focus.js |
| `renderParts` | 3 | 0 | 04-composant-agents.js | 00-noyau.js, 04-composant-agents.js |
| `renderStrip` | 3 | 0 | 04-composant-agents.js | 00-noyau.js, 02-favoris-et-focus.js |
| `startObjQuiz` | 3 | 0 | 13-teintes-calculees.js | 05-objectifs-refonte.js, 09-couleur-questionnaires.js |
| `closeFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `closeSheet` | 1 | 1 | 09-couleur-questionnaires.js (enveloppe) | 00-noyau.js |
| `createObjective` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `deckSync` | 1 | 1 | 16-palette-finale.js (enveloppe) | 15-presentation-accompagnants.js |
| `deleteObjective` | 1 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `feat` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `init` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `isUnlocked` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `newConversation` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `objqAfter` | 2 | 0 | 09-couleur-questionnaires.js | 05-objectifs-refonte.js |
| `objqClose` | 2 | 0 | 09-couleur-questionnaires.js | 05-objectifs-refonte.js |
| `openAgentDeck` | 1 | 1 | 16-palette-finale.js (enveloppe) | 15-presentation-accompagnants.js |
| `openChat` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `openFocusSheet` | 2 | 0 | 02-favoris-et-focus.js | 00-noyau.js |
| `openFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `openObjSheet` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `openSheet` | 1 | 1 | 09-couleur-questionnaires.js (enveloppe) | 00-noyau.js |
| `openThread` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `openUpgrade` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `openUpsell` | 2 | 0 | 01-freemium-et-crise.js | 00-noyau.js |
| `paintChat` | 2 | 0 | 13-teintes-calculees.js | 11-palette-enregistree.js |
| `qTheme` | 2 | 0 | 10-couleurs-pleines.js | 10-couleurs-pleines.js |
| `qzFinish` | 1 | 1 | 09-couleur-questionnaires.js (enveloppe) | 00-noyau.js |
| `qzHeadHTML` | 2 | 0 | 10-couleurs-pleines.js | 09-couleur-questionnaires.js |
| `qzPaint` | 2 | 0 | 12-teintes-de-reponse.js | 10-couleurs-pleines.js |
| `qzPick` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `renderAgentList` | 2 | 0 | 15-presentation-accompagnants.js | 04-composant-agents.js |
| `renderBadges` | 2 | 0 | 05-objectifs-refonte.js | 00-noyau.js |
| `renderChatHeader` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
| `renderFormules` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `renderJRow` | 2 | 0 | 10-couleurs-pleines.js | 10-couleurs-pleines.js |
| `renderProBlock` | 2 | 0 | 13-teintes-calculees.js | 07-supervision.js |
| `renderSuivi` | 1 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `send` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `setTier` | 2 | 0 | 00-noyau.js | 00-noyau.js |
| `sfx` | 2 | 0 | 08-sons-et-icones.js | 06-roulette-et-animations.js |
| `stepObjective` | 1 | 1 | 14-palette-et-accueil.js (enveloppe) | 00-noyau.js |
| `toggleFav` | 2 | 0 | 13-teintes-calculees.js | 02-favoris-et-focus.js |
| `togglePart` | 1 | 1 | 11-palette-enregistree.js (enveloppe) | 00-noyau.js |
