# Les voix des accompagnants

> État au 05/10/2026 : **tout est prêt à brancher**. Le code est dans `src/scripts/36-voix-prete.js`, les emplacements dans `src/scripts/32-voix.js`. En attendant le fournisseur, une doublure tourne dans le navigateur : la synthèse vocale de l'appareil, réglée différemment pour chaque accompagnant. Brancher une voix revient à renseigner deux valeurs, sans toucher au reste.

## 1. Ce qui marche déjà

- **Une voix par accompagnant.** Chacun a sa fiche de voix (section 4) et son réglage de doublure (hauteur, débit). Les dix-sept réglages sont tous différents.
- **La récompense des jeux.** Finir le jeu d'un accompagnant réveille sa voix : « Tu as réveillé la voix de Miro. L'écouter ». Elle s'écoute ensuite sur sa fiche, sous chacune de ses réponses dans la discussion, et sur les questions de son jeu.
- **L'écoute à la demande.** Un appui lit la réponse, un second arrête. Rien n'est synthétisé tant que la personne ne demande rien.
- **La lecture automatique, en option.** Dans le profil, « Lire les réponses à voix haute ». Elle est désactivée par défaut, parce que c'est le réglage le plus économe.
- **Le décompte.** Chaque caractère lu est compté par mois et par moteur (`state.voixUsage`), et affiché dans le profil.
- **Le plafond mensuel.** Il est prévu (`VOICE_CONFIG.plafondCaracteresMois`) et laissé vide tant que le modèle économique ne l'a pas fixé.
- **Jamais en gratuit.** La voix fait partie de l'abonnement. Vocabulaire : une voix se réveille, elle ne se « débloque » jamais.

## 2. Brancher le fournisseur

Deux valeurs suffisent, dans `src/scripts/32-voix.js` ou dans un fichier tardif :

```js
VOICE_ENDPOINT = 'https://voix.maynd.fr/tts';    // ton serveur, jamais le fournisseur en direct
AGENT_VOICES.mia.voiceId = 'identifiant-chez-le-fournisseur';
```

Dès qu'un accompagnant a son `voiceId`, c'est la vraie voix qui parle. Les autres gardent leur doublure, ce qui permet de brancher les voix une par une.

**La clé du fournisseur ne vit jamais dans le navigateur.** C'est le serveur qui la détient (même règle que la clé du modèle, CLAUDE.md section 5).

### Contrat d'échange

Requête de l'application vers le serveur :

```
POST {VOICE_ENDPOINT}
Content-Type: application/json

{ "agent": "miro", "voiceId": "voix-miro", "text": "On s'occupe de tes nuits.", "format": "mp3" }
```

Réponse du serveur : le fichier audio (`audio/mpeg` pour le mp3), code 200. Tout autre code s'affiche comme « La voix de Miro ne répond pas pour l'instant ».

Le texte arrive déjà nettoyé : balises retirées, émojis retirés, espaces normalisés.

### Ce que le serveur doit faire

1. Vérifier que la personne est abonnée et que la voix de cet accompagnant est réveillée.
2. Appliquer le plafond mensuel, côté serveur cette fois, puisqu'un plafond tenu dans le navigateur se contourne.
3. Mettre en cache par empreinte de (voiceId, texte). L'application met déjà en cache sur l'appareil (`caches`, nom `maynd-voix-v1`). Le serveur doit faire de même, pour que deux personnes qui écoutent la même phrase ne la paient qu'une fois : présentations, échantillons, questions des jeux.
4. Appeler le fournisseur et renvoyer l'audio.

## 3. Ce que ça coûte

Les fournisseurs facturent au caractère synthétisé. Le coût dépend donc de trois choses : la longueur des réponses, la part de réponses réellement écoutées, et le prix au million de caractères.

**Hypothèses du calcul :**
- 350 caractères par réponse, ce qui correspond aux deux à quatre phrases visées par les consignes v2 ;
- une personne qui épuise ses 700 messages du mois ;
- donc 245 000 caractères par mois si elle écoute absolument tout.

| Fournisseur (tarifs publics vérifiés le 05/10/2026) | Prix par million de caractères | Tout écouter (245 000 car.) | 30 % écouté |
|---|---|---|---|
| Google Cloud, voix WaveNet | 4 $ | 0,98 $ | 0,29 $ |
| Azure AI Speech, voix neuronales | 16 $ (moins avec engagement) | 3,92 $ | 1,18 $ |
| Google Cloud, voix Neural2 | 16 $ | 3,92 $ | 1,18 $ |
| Amazon Polly, voix neuronales | 16 $ | 3,92 $ | 1,18 $ |
| Azure AI Speech, voix Neural HD | 22 $ | 5,39 $ | 1,62 $ |
| Google Cloud, voix Chirp 3 HD | 30 $ | 7,35 $ | 2,21 $ |
| Amazon Polly, voix génératives | 30 $ | 7,35 $ | 2,21 $ |
| ElevenLabs Flash (pour mémoire) | 50 $ | 12,25 $ | 3,68 $ |
| ElevenLabs Multilingual (pour mémoire) | 100 $ | 24,50 $ | 7,35 $ |

OpenAI facture `gpt-4o-mini-tts` à la minute produite, environ 0,015 $. Une réponse de 350 caractères dure à peu près 22 secondes, soit environ 3,85 $ pour tout écouter.

**Ce que ça veut dire :**
- **ElevenLabs n'est pas tenable** pour lire toutes les réponses. Le porteur du projet l'a écarté, à raison.
- **Une voix neuronale à 16 $ coûte autant que le texte.** Pour une personne qui écoute tout, la voix pèse à peu près le même poids que le modèle de langue, soit moins de 10 $ par mois chacun, selon l'estimation du dossier. Avec l'écoute à la demande, elle pèse trois fois moins.
- **Les leviers déjà en place :**
  - l'écoute à la demande par défaut ;
  - le cache, qui fait qu'une phrase n'est jamais payée deux fois ;
  - le plafond mensuel ;
  - le décompte, qui permettra de mesurer la vraie part d'écoute sur les premiers abonnés.
- **Mélanger deux gammes est possible.** Une voix « premium » pour les moments rares (la présentation, l'échantillon réveillé à la fin du jeu, mis en cache une fois pour toutes), et une gamme neuronale pour les réponses du quotidien.

**À vérifier avant de choisir :**
- Il faut au moins dix-sept voix françaises distinctes, ou des voix qu'on peut régler en style, en hauteur et en débit.
- Le fournisseur doit accepter une utilisation commerciale.
- L'hébergement doit être compatible avec les données de santé, ce qui compte aussi pour la voix : le texte envoyé contient ce que la personne vit.

**Héberger soi-même un modèle ouvert** coûte un serveur avec carte graphique, à prix fixe, quel que soit le volume.
- Kokoro (licence Apache 2.0) n'a qu'une seule voix française, de qualité moyenne : c'est insuffisant pour dix-sept accompagnants.
- D'autres modèles ouverts parlent français (Magpie Multilingual de NVIDIA, Qwen3-TTS). Leurs licences et leur qualité sont à vérifier une par une.

C'est une piste à partir de quelques milliers d'abonnés, pas pour le lancement.

Sources :
- [Tarifs Azure AI Speech](https://texttolab.com/blog/azure-text-to-speech-pricing) et [baisse des voix Neural HD](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-speech-%E2%80%93-neural-hd-text-to-speech-recent-voice-updates/4505380)
- [Tarifs Google Cloud Text-to-Speech](https://texttolab.com/blog/google-cloud-tts-pricing)
- [Tarifs Amazon Polly](https://costbench.com/software/ai-voice-tools/amazon-polly/)
- [Tarifs OpenAI gpt-4o-mini-tts](https://costgoat.com/pricing/openai-tts)
- [Tarifs ElevenLabs](https://developer.puter.com/tutorials/elevenlabs-api-pricing/)
- [Kokoro, voix française ff_siwis](https://offlinetts.com/voice/ff-siwis/) et [modèles ouverts en 2026](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)

Ces tarifs bougent souvent. Il faut les revérifier sur les pages officielles au moment du choix.

## 4. Les fiches de voix

À donner telles quelles au fournisseur, ou à la personne qui choisira les voix. Les accompagnantes ont une voix féminine (MIA, Ava, Iris, Eden, Nora), les accompagnants une voix masculine.

| Accompagnant | Fiche | Doublure (hauteur / débit) |
|---|---|---|
| MIA | Voix féminine, chaleureuse et nette. Sourire dans la voix, débit moyen, phrases posées. La voix qui accueille. | 1,06 / 1,00 |
| Naoki | Voix masculine, posée, plutôt grave. Débit lent et ferme, aucune dureté. La voix du cadre. | 0,86 / 0,94 |
| Felix | Voix masculine, claire et vive. Énergie souriante, débit plutôt rapide. La voix qui remet en confiance. | 1,12 / 1,06 |
| Atlas | Voix masculine, grave et profonde. Débit lent, silences assumés. La voix qui prend le temps. | 0,80 / 0,90 |
| Ava | Voix féminine, douce et basse. Débit lent, beaucoup d'espace entre les phrases. La voix qui accueille ce qui pèse. | 0,94 / 0,88 |
| Leo | Voix masculine, chaude, registre médium. Débit moyen, ton d'égal à égal. | 1,00 / 0,98 |
| Otis | Voix masculine, claire et très articulée. Assurée sans être sèche. | 1,04 / 1,02 |
| Kael | Voix masculine, énergique, celle d'un partenaire d'entraînement. Débit vif, jamais criée. | 1,08 / 1,10 |
| Miro | Voix masculine, très douce et feutrée. Débit lent, une voix du soir. | 0,90 / 0,84 |
| Sol | Voix masculine, calme et apaisée. Débit lent, respiration perceptible. | 0,95 / 0,86 |
| Mateo | Voix masculine, nette et professionnelle. Débit moyen, précise. | 0,98 / 1,02 |
| Soren | Voix masculine, chaleureuse et rassurante. Registre médium, débit moyen. | 0,93 / 0,97 |
| Iris | Voix féminine, lumineuse et chaleureuse. Débit moyen, beaucoup de présence. | 1,12 / 1,00 |
| Eden | Voix féminine, posée et assurée. Intime sans jamais chuchoter. | 0,98 / 0,95 |
| Vince | Voix masculine, calme et sobre. Ton pragmatique, sans jugement. | 0,90 / 0,98 |
| Neo | Voix masculine, jeune et directe. Simple, jamais moralisatrice. | 1,10 / 1,03 |
| Nora | Voix féminine, douce et ancrée. Débit lent, ton tranquille. | 1,00 / 0,92 |

## 5. La doublure du navigateur

- Elle utilise les voix françaises de l'appareil, en commençant par les voix locales : rien ne sort de l'appareil quand une voix locale existe.
- Chaque accompagnant garde toujours la même voix de base. Sa hauteur et son débit propres le distinguent des autres.
- Sur certains navigateurs, les voix françaises sont distantes (par exemple « Google français » dans Chrome) : le texte part alors chez l'éditeur du navigateur. C'est acceptable pour une démonstration, pas pour de vrais abonnés. Une fois le fournisseur branché, la doublure ne sert plus.
- Sans aucune synthèse vocale disponible, l'application affiche « La voix de X arrive bientôt. »
