# MAYND — application

Prototype complet de l'application MAYND : développement personnel et performance mentale,
en trois couches (MIA, quinze accompagnants, supervision par un professionnel référent certifié).

Écrit en HTML, CSS et JavaScript natif. **Aucun framework, aucune dépendance à l'exécution.**
Le livrable est un fichier unique et autonome : `dist/maynd.html`.

---

## Démarrer

```bash
npm install      # uniquement jsdom, pour les tests
npm run build    # assemble src/ -> dist/maynd.html
npm start        # assemble puis sert sur http://localhost:5173
npm test         # assemble puis lance les 15 suites (594 vérifications)
```

Sans Node, `dist/maynd.html` s'ouvre directement dans un navigateur.

---

## Arborescence

```
src/
  index.html                     squelette : balisage, écrans, feuilles
  styles/     10 fichiers        assemblés dans l'ordre alphabétique
  scripts/    17 fichiers        assemblés dans l'ordre alphabétique
build.mjs                        concatène src/ dans dist/maynd.html
serve.mjs                        serveur local
dist/maynd.html                  livrable autonome (généré, versionné)
tests/                           15 suites jsdom + lanceur
docs/                            architecture et dette technique
```

## L'ordre des fichiers est significatif

`build.mjs` concatène les fichiers **dans l'ordre alphabétique**, et cet ordre est celui de
l'exécution. Il n'est pas cosmétique : plusieurs fonctions sont redéfinies ou enveloppées par
les couches suivantes, et **c'est la dernière version qui s'applique**.

Renuméroter un fichier, ou en déplacer un, change le comportement de l'application.
Après toute manipulation de ce type : `npm test`.

Tout est concaténé dans **un seul bloc `<script>`**, volontairement. Passer à des modules ES
séparés casserait la remontée des déclarations et donc les redéfinitions. Voir
`docs/architecture.md` avant d'y toucher.

---

## Ce que fait l'application

**Parcours d'inscription** — seize écrans, de l'accueil au paiement, avec vérification par code,
code d'accès, reconnaissance, prénom et roulette d'année de naissance. Verrou anti double appui.

**MIA et quinze accompagnants** — MIA répond en premier et oriente. Dix accompagnants inclus,
cinq exclusifs MAYND+. Chacun a sa couleur, sa fiche de présentation détaillée, et un calibrage
comportemental strict décrit dans `docs/architecture.md`.

**Deux questionnaires** — le profil psychologique (douze profils) et la recherche du cap
(neuf questions, moteur génératif local, quarante objectifs possibles, aucun appel réseau).

**Supervision** — feuille de route mensuelle signée, bilan, et quatre signaux déduits du parcours
réel : stagnation, blocage, désalignement, progression à consolider. Sans rendez-vous.

**Trois formules** — gratuit, MAYND, MAYND+. Le paywall intercepte les accompagnants verrouillés,
la limite de messages et le multi-accompagnants.

---

## Tests

Quinze suites jsdom, 594 vérifications, exécutées sur `dist/maynd.html`.
Chaque suite rejoue un parcours complet par de vrais clics : inscription écran par écran,
questionnaires, trois onglets, toutes les feuilles, puis balayage de tous les éléments cliquables.

```
npm test
```

Une suite échoue le plus souvent parce qu'une valeur a changé volontairement (une couleur, un
libellé). Vérifier d'abord si l'assertion est simplement périmée avant de suspecter un bug.

---

## Dette technique connue

Elle est documentée plutôt que masquée.

1. **Soixante et une fonctions sont redéfinies ou enveloppées.** Voir
   `docs/fonctions-redefinies.md`. Pour modifier un comportement, chercher la **dernière**
   occurrence. C'est le premier chantier de nettoyage à mener.
2. **Les couches sont chronologiques, pas thématiques.** Les fichiers `09` à `16` sont
   des passes successives sur les couleurs. Un regroupement par domaine est souhaitable, mais
   il faut d'abord supprimer les versions mortes.
3. **La persistance est désactivée volontairement.** Chaque lancement repart de zéro, pour les
   démonstrations. Le code de sauvegarde existe mais `persist()` ne fait rien.
4. **La clé d'API est saisie côté navigateur.** Acceptable pour un prototype, à remplacer par
   un serveur intermédiaire avant toute mise en ligne réelle.

---

## Avant une mise en production

- Hébergement de santé requis pour les données, hébergeur souverain français recommandé
- Les appels au modèle doivent passer par un serveur, jamais depuis le navigateur
- Souscriptions via Stripe sur le domaine, pour éviter les commissions des magasins
- Aucun terme clinique, aucun titre réglementé : positionnement non médical à préserver
