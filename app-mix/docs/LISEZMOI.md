# App mix — MAYND en une seule application

Créée le 13/11/2026 par fusion de MAYND (`src/`) et du Tunnel (`app-guidee/`), sans toucher ni à l'une ni à l'autre. Le site en ligne publie toujours `dist/`, c'est-à-dire MAYND : App mix n'est pas publiée tant qu'elle n'est pas validée.

## L'ouvrir

1. Dans l'Explorateur, ouvrir le dossier `app-mix`.
2. Double-cliquer sur `index.html`.
3. Pour que MIA réponde vraiment : **Réglages** (en bas du premier écran, ou l'engrenage dans Toi), coller la clé Anthropic, **Enregistrer**. Un bouton reprend la clé déjà enregistrée dans MAYND, s'il y en a une.

Pour une démonstration, avec les réponses d'une personne fictive (Léa) :
- `index.html?demo=fin` : s'ouvre sur son profil, à la fin du parcours ;
- `index.html?demo=chat` : s'ouvre directement sur la discussion.

Pour repartir de zéro : Réglages, puis « Tout effacer et recommencer ».

## Le parcours

1. **Le seuil**, puis MIA se présente : 8 étapes, 46 questions, environ 20 minutes.
2. **Les questions**, une par écran, chaque étape avec sa couleur. Des réponses simples et des réponses plus fines, « Autre » presque partout, « Je ne sais pas » sur les échelles. Après chaque étape, « Ce que je retiens ».
3. **Ton profil MAYND**, flouté derrière « Crée ton compte pour voir ton résultat » : courriel et mot de passe, rien d'autre, pas de paiement. Le voile se lève.
4. **Ton compte-rendu**, en neuf parties, chacune corrigeable. La version corrigée fait foi et n'est jamais écrasée.
5. **Ton équipe**, **ton professionnel référent**, puis la discussion.

## L'intérieur : trois onglets

- **Aujourd'hui** : comment ça va (en un geste, sans écran), ton pas, parler à MIA, ton professionnel référent.
- **Discussion** : MIA répond en premier et fait venir les accompagnants ; chacun garde sa pastille en haut. Le professionnel référent y écrit sur signal, en vert, avec son badge.
- **Toi** : profil, cap, compte-rendu (et ce que MAYND a appris dans les échanges, effaçable ligne par ligne), ton équipe avec les fiches, ton professionnel (feuille de route, bilan, signaux, ses messages), réglages.

## Les règles d'affaires

- **Gratuit** : le parcours complet, le compte-rendu, MIA seule, 5 messages par jour, les jeux. Pas d'accompagnant, pas de professionnel.
- **MAYND, 60 € par mois** : les seize accompagnants, la voix, la supervision, 700 messages par mois. Proposée au premier accompagnant que MIA veut faire venir, ou au sixième message du jour. Paiement simulé.
- **Le professionnel référent** intervient sur l'un des quatre signaux : stagnation, blocage, désalignement, progression à consolider. Un signal « blocage » le fait écrire sans attendre. Jamais de rendez-vous.
- **Les jeux** : un par accompagnant, plus le point de mesure de MIA (après trois jeux). Finir un jeu réveille la voix de l'accompagnant. Le jeu de Nora s'arrête quand le mal-être est fort et durable.

## Les fichiers

```
index.html          la page
styles/             00 base et jetons · 10 parcours d'entrée · 20 intérieur · 30 discussion · 40 jeux
scripts/
  00 à 04           données : accompagnants et fiches, 46 questions et compte-rendu, 17 jeux, consignes du modèle, accord
  10 à 12           état, texte, noyau (scène, onglets, couche, clics)
  20, 21            parcours d'entrée, compte
  30 à 34           sécurité, modèle, discussion, dossier et lecture, professionnel
  40, 41            jeux, voix
  50, 51            Aujourd'hui, Toi
assembler.mjs       produit app-mix/dist/index.html en un seul fichier
verifier.mjs        la vérification de bout en bout
docs/serveur.md     le contrat du serveur à venir
```

Aucune fonction n'est définie deux fois : chaque fichier ajoute ses écrans dans `RENDUS` ou `ONGLETS` et ses actions dans `ACTIONS`. La vérification le contrôle.

## Vérifier

Depuis la racine du dépôt, avec Node :

```
node app-mix/verifier.mjs
node app-mix/assembler.mjs
```

La vérification parcourt les 46 questions, le compte, le compte-rendu, la discussion (gratuit, formule, accompagnant, pas, signal, professionnel, crise), Aujourd'hui, Toi, deux jeux, la reprise au lancement suivant, et les règles d'écriture. Le 13/11/2026 : 103 vérifications, 0 échec. Le modèle y est simulé.

## Ce qui reste ouvert

- **Le vrai modèle** n'a pas été essayé ici : il faut la clé.
- **Les traductions** anglaise et espagnole (phase 9 du plan) ne sont pas faites : l'application est en français.
- **Le serveur** : tout vit sur l'appareil. Voir `docs/serveur.md`.
- **La mise en ligne** : décider si App mix remplace `dist/` sur GitHub Pages, ou va à une seconde adresse.
- **Les consignes du modèle** sont des copies de celles de MAYND au 13/11/2026 : si elles changent là-bas, les reporter ici.
