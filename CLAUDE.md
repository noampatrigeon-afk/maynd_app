# MAYND — instructions de travail

Ce fichier est lu automatiquement par les assistants de code. Il fait autorité. Le lire en entier avant la première modification.

## 1. Le produit

MAYND est une application de développement personnel et de performance mentale. Slogan : *Pour tous, partout, tout le temps.* Lancement de la version 1 : 1er janvier 2027.

Trois couches, dans cet ordre :

- **MIA** — orchestratrice. Elle répond toujours en premier, comprend la situation, et n'oriente vers un accompagnant que si ça apporte vraiment quelque chose. Co-pilote, jamais standardiste.
- **Quinze accompagnants** — dix inclus, cinq exclusifs MAYND+.
- **Supervision** — un professionnel référent certifié suit le parcours, signe la feuille de route en début de mois et le bilan en fin de mois, et intervient sur signal.

Formules : gratuit (MIA seule), MAYND 49 €, MAYND+ 69 € (multi-accompagnants jusqu'à trois).

## 2. Règles absolues

Elles ne se discutent pas. Une seule violation suffit à casser le positionnement.

**Positionnement**
- Jamais de vocabulaire médical ou clinique. Ni pour les agents, ni pour le professionnel, ni dans les textes. Pas de « thérapie », « patient », « diagnostic », « psychologue », « santé mentale ».
- Aucun titre réglementé. Le libellé exact est « professionnel référent certifié ».
- Aucun rendez-vous, nulle part. Le sans-rendez-vous est un argument commercial. Le mot « séance » est proscrit. Le professionnel intervient sur signal, sans créneau à réserver.
- Quatre signaux, ceux du plan d'affaires : stagnation, blocage, désalignement, progression à consolider. Ne pas en inventer d'autres.

**Écriture**
- Zéro mot anglais. Toujours traduire.
- Zéro langage genré, zéro formulation qui vise un seul genre, zéro statistique genrée.
- Phrases courtes. Direct. Pas de « voici », pas de « permettez-moi », pas de méta-commentaire.
- Chiffres précis, jamais de fourchettes vagues.
- Accents partout, y compris sur les majuscules.

**Calibrage des accompagnants** (vérifié par les tests — les casser fait échouer la suite) :

| Accompagnant | Règle |
|---|---|
| Kael | Ne pousse jamais au dépassement à tout prix |
| Eden | Neutralité sans jugement, le consentement n'est pas négociable |
| Neo | Ne pose jamais d'étiquette |
| Ava | Aucune étape imposée au deuil, jamais de « cinq étapes » |
| Soren | Dit « l'autre parent », jamais « le père » ni « la mère » |
| Leo | Ne se prononce jamais sur le partenaire absent |

Tous partagent le protocole de crise : 3114, SOS Amitié, SAMU.

## 3. Contraintes techniques

**Un seul bloc script, et c'est volontaire**

Tous les fichiers de `src/scripts/` sont concaténés dans un unique `<script>`. De nombreuses fonctions sont redéfinies ou enveloppées par les couches successives. Le code s'appuie sur la remontée des déclarations : la dernière définition l'emporte.

Séparer en balises distinctes ou en modules casserait ce mécanisme silencieusement. Ne pas moderniser cette structure sans avoir d'abord supprimé les versions mortes, puis fait passer les tests.

**L'ordre alphabétique des fichiers est l'ordre d'exécution**

Renuméroter ou déplacer un fichier change le comportement. Après toute manipulation : `npm test`.

**Pour modifier un comportement**

Chercher la dernière occurrence, pas la première. Consulter `docs/fonctions-redefinies.md`, qui indique pour chaque fonction le fichier actif.

Deux façons d'intervenir, par ordre de préférence :
1. Redéfinir en fin de chaîne, dans un fichier tardif. Sûr, c'est le motif utilisé partout.
2. Modifier la définition active en place. Uniquement si elle est unique.

Ne jamais faire de remplacement de texte sur une ancre présente plusieurs fois.

**Direction artistique**
- Zéro dégradé. Aplats uniquement. Deux `mask-image` de fondu sont tolérés, ce ne sont pas des dégradés de couleur.
- Écrans montrés par opacité, jamais `display:none`.
- Polices : Poppins pour les titres, DM Sans pour le corps.
- Titres d'onglet : Poppins 800, 24 px.

Palette des questionnaires, avec la teinte de réponse associée :

| Fond | Teinte des réponses |
|---|---|
| Violet MAYND `#974AF0` | Lavande `#EDE1FF` |
| Bleu `#224CF2` | Bleu clair `#DFE8FF` |
| Rose `#E8467F` | Rose clair `#FFE0EC` |
| Vert `#00A862` | Vert clair `#D8F2E4` |
| Orange `#FE6601` | Pêche `#FFE6D2` |
| Jaune `#FFC400` (texte noir) | Crème `#FFEBCB` |
| Violet profond `#6F2FC0` | Violet clair `#E6D9FF` |

Plus aucun rectangle blanc sur fond coloré. Une réponse, une carte, un champ prennent une teinte claire de leur fond.

Couleurs des accompagnants, choisies par thème :
`mia` violet MAYND · `naoki` violet profond · `felix` jaune · `atlas` violet clair · `ava` bleu profond · `leo` rouge corail · `otis` vert · `kael` orange · `miro` indigo · `sol` bleu ciel · `mateo` bleu franc · `soren` orange chaud · `iris` vert · `eden` rose · `vince` émeraude · `neo` violet profond

Deux contraintes tenues par les tests : jamais deux couleurs identiques côte à côte dans la liste affichée, et contraste suffisant pour une lettre blanche. Seul le jaune de Felix passe en lettre noire, via `LIGHT_AGENTS`.

**État**

Un seul objet `state`, en portée lexicale, pas exposé sur `window`.

> **Mise à jour du 21/07/2026 :** la persistance était désactivée à l'origine (`persist()` no-op, `loadState()` purgeait le stockage), volontairement, pour que chaque démonstration reparte de zéro. Ce comportement a été changé à la demande explicite du porteur du projet : `persist()` écrit désormais réellement l'état dans `localStorage`, et `loadState()` le restaure au chargement. Raison : le no-op rendait les allers-retours de test insupportables (toute modification renvoyait au tout début de l'inscription). Le test `tests/parcours-reinitialisation.mjs` a été mis à jour en conséquence pour vérifier la persistance réelle plutôt que son absence. Si ce choix doit être révisé avant mise en ligne réelle (section 5), le repli vers le no-op est trivial : il suffit de revider les deux fonctions dans `00-noyau.js`.

## 4. Méthode de travail

**Cycle**
```bash
npm run build    # assemble src/ -> dist/index.html
npm test         # 15 suites
```

> **Note :** ce document mentionnait auparavant `dist/maynd.html`. Le fichier livrable s'appelle en réalité `dist/index.html` (cohérent avec `build.mjs`, `serve.mjs` et l'ensemble des fichiers de `tests/`) — corrigé ici.

`build.mjs` garantit que le fichier reconstruit est identique au livrable. Toujours assembler avant de tester : les suites lisent `dist/index.html`, pas les sources.

**Avant toute livraison**
- `npm run build` puis `npm test` — zéro échec exigé
- Vérifier le parcours de bout en bout : inscription écran par écran, les deux questionnaires, les trois onglets, toutes les feuilles
- Vérifier qu'aucun bouton ne pointe vers une fonction absente
- Vérifier qu'aucun dégradé n'est apparu
- Mettre à jour le repère « Version JJ/MM HH:MM » affiché en bas de l'accueil

**Quand un test échoue**

Regarder d'abord si l'assertion est périmée plutôt que de suspecter un bug. Une couleur ou un libellé changé volontairement fait échouer des assertions écrites pour l'ancienne valeur. Dans ce cas, mettre le test à jour et le dire explicitement.

Si c'est un vrai bug, le corriger et ajouter une vérification qui l'aurait attrapé.

**Ce qu'il ne faut jamais faire**
- Livrer sans avoir lancé les tests
- Inventer une donnée métier. En cas de doute sur le modèle économique, demander plutôt que supposer.
- Inventer une identité de professionnel. Tant qu'aucun nom n'est renseigné, afficher « Ton professionnel référent ».
- Ajouter un dégradé, un rectangle blanc sur fond coloré, ou un terme clinique
- Réintroduire une notion de rendez-vous
- Toucher à l'ordre des fichiers sans relancer les tests

> **Contrainte d'environnement constatée le 21/07/2026 :** Node.js n'est pas installé sur cette machine de développement (introuvable dans `Program Files`, `AppData`, le registre Windows). `npm run build` et `npm test` ne peuvent donc pas être exécutés depuis l'environnement de l'assistant de code — le porteur du projet doit les lancer lui-même pour valider toute modification. En attendant, les changements sont répercutés à la main dans `dist/index.html` en parallèle de `src/`, ce qui est un pis-aller, pas le workflow prévu par ce document.

## 5. Direction du projet

Chantiers, par ordre de priorité.

**Court terme**
- Nettoyer les redéfinitions de fonctions. Supprimer les versions mortes, puis regrouper les fichiers par domaine au lieu de par couche chronologique. Les tests servent de filet. C'est le préalable à tout le reste.
- Terminer le parcours produit : présentation des accompagnants, supervision, objectifs.

**Avant toute mise en ligne réelle**
- Sortir la clé d'API du navigateur. Les appels au modèle doivent passer par un serveur. En l'état c'est acceptable pour un prototype, pas pour des personnes réelles.
- Hébergement de santé, hébergeur souverain français recommandé. Consultation juridique sur la protection des données en amont.
- Souscriptions via Stripe sur le domaine, pour éviter les commissions des magasins d'applications.
- Faire évoluer la persistance locale actuelle vers un vrai compte avec synchronisation serveur.

**Organisation**

Recrutement de deux associés : un directeur technique, et un professionnel du mental certifié qui portera la supervision.

Ce dépôt est un prototype de démonstration destiné à convaincre. Il doit être impeccable à l'usage, pas nécessairement industriel. Ne pas sur-construire.

## 6. Attentes sur la façon de répondre
- Une seule réponse consolidée, pas d'aller-retour inutile
- Direct, sans remplissage, sans reformulation de la demande
- Signaler ce qui a été fait, ce qui a échoué, et ce qui reste ouvert
- En cas de doute réel, poser une question précise plutôt que de deviner
- Ne jamais affirmer qu'une chose est faite sans l'avoir vérifiée
