# Le serveur d'App mix, à construire

App mix est un prototype : tout vit dans le navigateur, y compris la clé d'API. Avant de mettre de vraies personnes dessus, un serveur doit prendre quatre choses en charge. L'application est écrite pour qu'il se branche sans la refaire : chaque bloc d'état marqué « serveur » dans `scripts/10-etat.js` y migre tel quel.

## 1. Le compte

| Aujourd'hui (appareil) | Demain (serveur) |
|---|---|
| `etat.compte` : courriel, empreinte SHA-256 du mot de passe, date | `POST /comptes` (courriel, mot de passe) → jeton ; `POST /connexion` ; `GET /moi` |
| `etat.compte.acces` : empreinte du code à quatre chiffres | reste sur l'appareil (accès rapide local) |

Le mot de passe ne transite qu'une fois, au serveur, qui le hache. Le navigateur garde un jeton.

## 2. Les données de la personne

Tout l'objet `etat` sauf `cle`, `fournisseur`, `modele`, `compte.acces` : `rep`, `autres`, `cr`, `fil`, `presents`, `dossier`, `signaux`, `alertes`, `humeurs`, `jeux`, `voix.reveillees`, `pro`, `formule`, `quota`.

- `PUT /moi/etat` à chaque `garder()` (regroupé, au plus une fois par seconde) ; `GET /moi/etat` au lancement, fusionné avec l'appareil par date `vu`.
- Hébergement de données de santé : hébergeur certifié, en France (CLAUDE.md, section 5). Le texte des échanges contient ce que la personne vit.

## 3. Le modèle

Le navigateur n'appelle plus `api.anthropic.com` : il appelle `POST /modele` avec le même corps (`system` en trois blocs, `messages`, `max_tokens`, `output_config`), et le serveur ajoute la clé. Le serveur applique le quota (5 par jour en gratuit, 700 par mois en MAYND), que l'appareil ne fait qu'afficher. Même chose pour la lecture différée (`claude-haiku-4-5`) et pour le compte-rendu.

Fichier concerné : `scripts/31-modele.js`, fonction `appeler()` : remplacer l'adresse et retirer les en-têtes de clé.

## 4. Le professionnel référent

C'est le vrai changement de nature. Aujourd'hui, ses messages sont rédigés par le modèle sur signal (`scripts/34-professionnel.js`, `proRepondre`). Demain :

- `POST /signaux` : l'application pousse chaque signal (type, source, preuve, date) ; le serveur l'affiche au professionnel.
- `GET /moi/pro` : les messages du professionnel, sa feuille de route signée, son bilan signé, son nom. L'application les affiche exactement comme aujourd'hui (`{type:'pro', texte, signal, at}` dans le fil).
- Le professionnel écrit depuis son espace ; l'application reçoit le message (relance toutes les 30 secondes quand la discussion est ouverte, ou connexion maintenue).
- Les alertes de sécurité (`etat.alertes`) partent en priorité : niveau 2 ou 3, citation, heure.

Format de message du professionnel : texte brut, 2 à 3 phrases, signé de son prénom. Aucune balise.

## 5. La voix

`scripts/41-voix.js` : `VOICE_ENDPOINT` vers `POST /voix` (`agent`, `voiceId`, `text`, `format`) ; le serveur détient la clé du fournisseur, vérifie l'abonnement et la voix réveillée, applique le plafond, met en cache par empreinte du texte. Contrat détaillé dans `docs/voix.md` à la racine.

## 6. Le paiement

`scripts/32-discussion.js`, `ACTIONS['formule-payer']` : remplacer la carte factice par Stripe sur le domaine (CLAUDE.md, section 5) ; le serveur confirme et pose `formule='maynd'`.

## Ordre conseillé

1. Modèle (sortir la clé du navigateur).
2. Compte et données.
3. Professionnel.
4. Paiement.
5. Voix.
