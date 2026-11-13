# MAYND, parcours guidé

Deuxième application, créée le 13/11/2026 à côté de la première. Elle ne touche à rien de la première : ni `src/`, ni `dist/`, ni les tests, ni le site en ligne (qui ne publie que `dist/`).

## L'ouvrir

1. Dans l'Explorateur, ouvrir le dossier `app-guidee`.
2. Double-cliquer sur `index.html`.
3. Pour que MIA réponde vraiment : **Réglages** (en bas du premier écran, ou menu ⋯ dans la discussion), coller la clé Anthropic, **Enregistrer**. Si la clé est déjà enregistrée dans la première application, un bouton permet de la reprendre.

Pour une démonstration rapide, avec les réponses d'une personne fictive (Léa) :
- `index.html?demo=fin` ouvre directement son profil, à la fin des questionnaires ;
- `index.html?demo=chat` ouvre directement la discussion.

Pour repartir de zéro : Réglages, puis **Recommencer le parcours**.

## Le parcours

Un seul chemin, une idée par écran :

1. Le seuil, puis MIA qui se présente et annonce la durée : 8 étapes, 46 questions, environ 20 minutes.
2. Huit étapes de questions, toutes au début (décision du 13/11/2026). Chaque question offre des réponses simples, pour qui découvre ces sujets, et des réponses plus fines, pour qui les connaît bien. « Autre » ouvre un champ libre presque partout, et « Je ne sais pas » est proposé sur les échelles. La barre du haut ne montre que le retour et l'avancement. Les étapes :
   - D'abord, toi (dont ce que tu fais dans la vie et avec qui tu vis) ;
   - Là où tu en es ;
   - Comment tu fonctionnes ;
   - Comment tu réagis ;
   - Ce qui compte pour toi ;
   - Ton corps et ton énergie ;
   - Comment tu veux qu'on te parle (dont : connais-tu déjà ces sujets ? MIA parle simplement à qui débute, et va plus loin avec qui s'y connaît) ;
   - Ton cap.

   Après chaque étape, un écran « Ce que je retiens » montre ce que l'application a compris.
3. Ton profil MAYND : les douze profils de la première application, calculés sur quatre pôles (l'action, le lien, se poser, l'analyse).
4. **Ton compte-rendu**, en neuf parties :
   - En bref ;
   - Là où tu en es ;
   - Comment tu fonctionnes ;
   - Comment tu réagis ;
   - Ce qui compte pour toi ;
   - Ton corps et ton énergie ;
   - Tes appuis et tes points de vigilance ;
   - Comment MIA va te parler ;
   - Ton cap.

   Chaque partie a un bouton **Corriger**, qui ouvre le texte pour le réécrire. La version corrigée est marquée « Corrigé par toi ». C'est elle que MIA utilise, et rien ne l'écrase jamais, même quand MIA réécrit le reste. « Revenir au texte d'origine » annule la correction.

   Sans clé, l'application compose le compte-rendu à partir des réponses. Avec la clé, MIA le réécrit, en reliant les réponses entre elles. Il reste consultable et corrigeable à tout moment : menu ⋯, puis « Mon compte-rendu ».
5. Ton équipe : MIA, et les trois accompagnants que le parcours désigne.
6. Ton professionnel référent : supervision, sans rendez-vous, les quatre signaux.
7. La discussion avec MIA, réglée sur le profil : franchise, longueur, questions ou pistes, humour, relances. MIA fait venir un accompagnant quand c'est utile, et il arrive sans que la personne ait à se répéter.

On peut faire une pause à tout moment : tout est gardé sur l'appareil (`localStorage`, clé `maynd.guide.v1`). Au retour, l'application propose de reprendre à la question exacte, ou de retrouver MIA, qui reprend là où on en était.

## Les fichiers

- `index.html` : la page.
- `style.css` : l'apparence. Zéro dégradé, aplats de la palette des questionnaires, écrans montrés par opacité.
- `donnees.js` : les questions, les accompagnants, les profils, et les consignes du modèle.
- `app.js` : le parcours, le profil, la discussion, l'appel au modèle.
- `verifier.mjs` : la vérification de bout en bout.

Les consignes du modèle reprennent celles de la première application, telles qu'elles étaient le 13/11/2026 : le socle, le protocole de sécurité, les fiches des seize accompagnants et le repérage local du risque. Si elles changent dans la première, il faut les reporter ici à la main.

## Vérifier

Depuis la racine du dépôt, avec Node :

```
node app-guidee/verifier.mjs
```

Le script parcourt les 46 questions, puis le compte-rendu (correction, annulation, retour au texte d'origine), puis la discussion, avec un modèle simulé. Il vérifie aussi les règles d'écriture : vocabulaire, accord, deuxième personne dans le compte-rendu, typographie, aucun dégradé. Le 13/11/2026, il comptait 82 vérifications et aucun échec.

## Limites connues

- **Le vrai modèle n'a pas encore été testé ici.** La discussion a été vérifiée avec des réponses simulées : il faut la clé pour l'essayer pour de vrai.
- **La clé vit dans le navigateur.** C'est acceptable pour un prototype, pas pour de vraies personnes, comme pour la première application.
- **Les signaux ne partent vers personne.** L'écran affiche qu'un signal est transmis, mais aucun professionnel ne le reçoit encore.
- **Ni voix ni jeux** dans cette version.
