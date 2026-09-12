# MAYND — Refonte objectif-centrée : spécification produit

Session du 10 août 2026. Ce document couvre uniquement ce qui impacte l'application (parcours, données, comportement des agents, contraintes techniques). Les décisions business, juridiques et RH de la session (prix beta, capital, recrutement) sont volontairement exclues.

---

## 1. Principe directeur

L'objectif de l'utilisateur devient le fil conducteur de tout le produit, à la place de l'humeur. Chaque surface de l'app (accueil, MIA, agents, signal, feuille de route) doit se référer à l'objectif actif de la personne, pas fonctionner comme un module isolé.

---

## 2. Onboarding — nouvelle séquence

Ordre cible, à remplacer dans le flux `ob-*` existant :

1. Écrans actuels inchangés : `ob-welcome` → `ob-signup` → `ob-verify-*` → `ob-firstname`
2. **Quiz de personnalité** (`QUIZ` / `computeProfile`, existant) — déplacé ici, avant le cap
3. **Questionnaire de cap** (`OBJQ`, existant, à étendre — voir section 3) — devient une étape obligatoire de l'onboarding, plus une option cachée dans l'onglet Objectifs
4. Compte Freemium actif : cap défini, MIA accessible, simulation de feuille de route visible (verrouillée, voir section 4)
5. `ob-plan` / `ob-payment` — l'argument de vente s'appuie désormais sur l'objectif réel de la personne, pas sur une liste générique de features

Le questionnaire de cap n'est plus derrière le bouton "Définir mon cap" dans `tab-objectifs` : il doit se déclencher automatiquement à l'onboarding, avant tout mur payant.

---

## 3. Modèle de données objectif (principal + secondaires)

Extension de `OBJQ` et de la logique `addObjective` existante :

- **Un objectif principal** (`state.focus`) + **des objectifs secondaires**, interchangeables librement par l'utilisateur.
- Le questionnaire de cap capte **1 à 2 secondaires potentiels dès la première passe**, pas seulement le principal.
- **Limite : 4 changements de principal maximum par mois.** Au-delà, déclenche le signal désalignement (voir section 7). Aucun jugement affiché à l'utilisateur, aucun vocabulaire clinique (proscrire tout terme du type "instabilité").
- **Questionnaire d'approfondissement par objectif** (voir section 8), distinct du questionnaire de cap initial.

---

## 4. Freemium vs payant

- **Freemium** : cap + MIA en accès libre, **un seul objectif (le principal)**, pas de secondaires.
- Ce qui est montré côté feuille de route en Freemium est une **simulation MIA**, explicitement labellisée comme telle dans l'UI ("aperçu généré par l'IA", jamais présenté comme LA feuille de route officielle).
- La vraie feuille de route — construite, ajustée et signée par le professionnel — n'existe que pour les comptes abonnés (MAYND / MAYND+). Ne jamais générer une fausse feuille de route par IA puis la "révéler" comme si elle avait été validée par un humain.
- **Secondaires réservés aux abonnés.**
- **Multi-agents simultanés (MAYND+, jusqu'à 3)** : usage libre, non contraint à l'objectif principal — reste un espace de liberté conversationnelle.

---

## 5. Suivi humain mono-focus

Le professionnel suit **uniquement l'objectif principal actif**, jamais les secondaires. Les secondaires restent 100% pilotés par l'IA jusqu'à ce qu'ils soient promus principal. Ceci protège le ratio de charge du professionnel (contrainte business, mentionnée ici seulement parce qu'elle détermine ce que l'IA doit gérer seule vs ce qui remonte à l'humain).

---

## 6. Cycle de vie d'un objectif

- **Objectif jugé atteint** : l'IA détecte et propose la clôture ; le professionnel valide au bilan suivant. Jamais l'IA seule qui clôture un objectif.
- Une fois validé atteint : l'objectif archive en **lecture seule** dans le "chemin parcouru" (nouvel espace, voir section 9).
- Un objectif secondaire est **promu principal par défaut**.
- L'utilisateur garde la main pour choisir un autre secondaire, ou repasser le questionnaire de cap pour un nouvel objectif.

---

## 7. Les 4 signaux — mécanique complète

| Signal | Détection | Déclenchement |
|---|---|---|
| **Désalignement** | Plus de 4 changements de principal dans le mois | Remonte au professionnel, traité au bilan mensuel |
| **Stagnation** | Combinaison : aucune étape de la feuille de route cochée depuis un certain délai **ET** signaux détectés dans le contenu des échanges avec MIA/agents | Remonte au professionnel, traité au bilan mensuel |
| **Blocage** | Stagnation qui dépasse un seuil d'intensité (même signal que stagnation, sur une échelle) | Déclenche une **intervention rapide du professionnel**, hors cycle mensuel |
| **Progression à consolider** | Détecté par MIA à partir de la progression réelle sur les étapes | **MIA félicite immédiatement**, le professionnel consolide et personnalise au bilan suivant |

Stagnation et blocage ne sont **pas deux signaux distincts** : c'est un seul signal sur une échelle de sévérité. Le seuil exact déclenchant "blocage" reste à définir techniquement (paramètre à calibrer, pas encore chiffré).

Rappel de sécurité déjà en place dans les prompts agents, à ne pas confondre avec ces 4 signaux : le protocole crise (idées suicidaires, danger imminent → orientation 3114/15) reste prioritaire et distinct, toujours géré en priorité absolue.

---

## 8. Questionnaire d'approfondissement par objectif

- Optionnel, non obligatoire pour utiliser l'app.
- Chaque objectif (principal ou secondaire) génère son propre questionnaire d'approfondissement, sur 3 axes : **importance** ("pourquoi cet objectif plutôt qu'un autre, maintenant"), **impact** ("qu'est-ce que ça changerait concrètement dans ton quotidien"), **engagement** (niveau d'investissement souhaité — vérifier le recouvrement avec la question "pace" déjà existante dans `OBJQ`).
- Affiché dans `tab-objectifs` comme tâche en suspens, avec un badge discret — **jamais de notification agressive type réseau social, pas de compteur rouge**. Cohérent avec le pattern `challenges`/`quests` déjà présent dans le code.
- Une fois complété, alimente directement le contexte fourni au professionnel avant son bilan, et calibre le ton de MIA/des agents sur cet objectif précis.
- Éviter tout vocabulaire clinique dans les formulations (ex. proscrire "sensible" au sens de gravité psychologique — préférer du concret, "qu'est-ce que ça changerait dans ton quotidien").

---

## 9. Architecture d'onglets cible

Passage de 3 à 4 onglets (actuellement : Accueil / Chat / Objectifs) :

- **Accueil** : dashboard de progression vers l'objectif principal en premier plan (étape en cours, prochaine action). L'humeur n'y a plus sa place en vitrine — elle devient un signal discret alimentant MIA en arrière-plan, sans écran ni courbe dédiés (à retirer de l'accueil actuel : `#suivi`, `suivi-curve`).
- **Chat** : inchangé dans sa fonction, mais MIA et les agents doivent porter le contexte de l'objectif actif dans leurs échanges (routage `[[SUGGEST:id]]` à repondérer en fonction de la pertinence par rapport à l'objectif, pas seulement le sujet du message).
- **Parcours** (nouvel onglet, fusion de l'actuel `tab-objectifs` + le volet humain) : feuille de route du mois, objectifs actifs (principal en avant, secondaires en retrait), historique/bilans archivés, **chemin parcouru** (objectifs clôturés en lecture seule), traces des signaux quand ils se déclenchent.
- Un 4e onglet ou écran séparé reste à trancher selon les contraintes d'espace mobile (profil/paramètres).

---

## 10. Dashboard pro (nouvel outil, côté professionnel)

- **File d'attente priorisée** : blocages urgents en premier, puis bilans mensuels par échéance.
- **Vue par utilisateur** : objectif principal actif, feuille de route en cours, historique des bilans précédents, contexte du questionnaire d'approfondissement s'il a été rempli.
- **Brouillon de bilan pré-rédigé par MIA**, que le professionnel ajuste et personnalise plutôt que de rédiger de zéro.
- **Geste de validation/signature horodaté**, qui devient l'artefact visible côté utilisateur (nom du professionnel, date, message personnalisé).

---

## 11. Contraintes techniques — architecture HDS "zéro accès direct"

À respecter dès la conception du backend réel (non encore construit) :

- Aucun accès direct à la base de données pour l'équipe produit/tech, même en debug ou support.
- Logs et interfaces internes anonymisés ou agrégés côté équipe MAYND.
- Chiffrement de bout en bout, clés gérées côté hébergeur certifié (OVHcloud), pas côté MAYND.
- Toute intervention nécessaire sur des données brutes passe par le personnel certifié de l'hébergeur.
- **Exception** : le professionnel signataire (dans le cadre de sa mission de suivi clinique) peut avoir un accès plus complet aux données de l'utilisateur qu'il suit, différent de l'accès de l'équipe technique. Ce point a une réserve légale à faire confirmer avant mise en production à grande échelle — ne pas construire une architecture qui l'empêcherait techniquement le moment venu.

---

## 12. Précision agent Kael (sport & performance)

Le prompt système existant est correct et n'a pas besoin d'être modifié, mais la formulation courte "anti culture du dépassement" doit être comprise précisément si elle est réutilisée ailleurs (contenu marketing, autres prompts) :

- **Gardé** : dépassement de soi, progression réelle, ambition, régularité.
- **Banni** : rhétorique "no pain no gain", glorification de la souffrance/épuisement, ignorance des signaux du corps, sursollicitation menant à la fatigue nerveuse et mentale.

Kael pousse activement vers le progrès — ce n'est pas un agent qui décourage l'effort.
