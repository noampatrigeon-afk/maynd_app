/* ══════════════════════════════════════════════════════════════════════════
   REFONTE DE L'INTELLIGENCE — MIA et les accompagnants
   Fichier tardif : toute redéfinition ci-dessous l'emporte sur les couches
   précédentes (voir docs/fonctions-redefinies.md, mis à jour en parallèle).
   Le dossier de refonte a été collé trois fois, avec une numérotation de
   chantiers différente à chaque fois (les noms ci-dessous sont donc plus
   fiables que d'éventuels numéros trouvés dans une future version collée) :
   retrait visible sur une note d'arrivée · longueur progressive · contexte
   silencieux étendu (ancrage, actes, état courant, boucles) · lecture de
   l'état réel · spécialisation toutes pratiques · anti-redondance et
   historique condensé · hiérarchisation (ancrage / point d'entrée) · MIA,
   traitement spécifique · Nora (rapport au corps) · abonnement unique (60€,
   fusion MAYND/MAYND+) · croisement multi-accompagnants (une seule réponse
   rédigée par le point d'entrée, boucles causales des autres accompagnants,
   retrait silencieux d'un accompagnant qui ne sert jamais).
   ══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════ i18n : action de retrait sur une note d'arrivée ═══════════════ */
Object.assign(I18N.fr, { withdrawArrival:'Retirer' });
Object.assign(I18N.en, { withdrawArrival:'Remove' });
Object.assign(I18N.es, { withdrawArrival:'Quitar' });


/* ═══════════════════════ CHANTIER 8 — la main reste à la personne ═══════════════════════
   L'ajout automatique d'un accompagnant par MIA fonctionnait déjà (handleJoin, addParticipant,
   removeParticipant avec son garde-fou). Ce qui manquait : un moyen visible, depuis le fil
   lui-même, de faire marche arrière — sans devoir ouvrir la fiche des participants. */

/* Un accompagnant que la personne vient d'écarter ne doit jamais revenir tout seul. */
function handleJoin(joinId){
  if(!joinId||!agentById(joinId)) return;
  const parts=threadParts();
  if(parts.includes(joinId)) return;
  const th=activeThread();
  if(th && Array.isArray(th.refused) && th.refused.includes(joinId)) return;
  if(canUseMulti()){
    if(parts.length<3) addParticipant(joinId);
    else addInvite(byId(joinId));
  } else {
    addInvite(byId(joinId));
  }
}

/* Marque la note d'arrivée qui vient d'être créée par addParticipant comme retirable,
   sans dupliquer la logique d'ajout (garde-fous, paywall, limite de 3) : on enveloppe
   la version active et on observe ce qu'elle vient de pousser dans le fil. */
(function(){
  var base=addParticipant;
  if(typeof base!=='function') return;
  window.addParticipant=function(id, silent){
    var th=activeThread();
    var before = th ? th.msgs.length : 0;
    var r=base.apply(this, arguments);
    try{
      if(r && th && !silent && th.msgs.length>before){
        var last=th.msgs[th.msgs.length-1];
        if(last && last.note && last.agent===id){
          last.arrival=true;
          persist();
          if(typeof activeScreen==='function' && activeScreen()==='tab-chat' && typeof renderMessages==='function') renderMessages();
        }
      }
    }catch(e){}
    return r;
  };
})();

/* Le retrait réutilise removeParticipant telle quelle (même garde-fou : jamais le dernier
   participant) ; on ajoute juste la mémoire du refus et un rafraîchissement du fil. */
(function(){
  var base=removeParticipant;
  if(typeof base!=='function') return;
  window.removeParticipant=function(id){
    var th=activeThread();
    var before = th ? th.parts.length : 0;
    var r=base.apply(this, arguments);
    try{
      if(th && th.parts.length<before){
        th.refused = Array.isArray(th.refused) ? th.refused : [];
        if(th.refused.indexOf(id)===-1) th.refused.push(id);
        persist();
        if(typeof activeScreen==='function' && activeScreen()==='tab-chat' && typeof renderMessages==='function') renderMessages();
      }
    }catch(e){}
    return r;
  };
})();

/* Note d'arrivée enrichie d'un geste de retrait, discret, sans fenêtre de confirmation.
   L'action disparaît d'elle-même si l'accompagnant n'est plus dans le fil, ou s'il ne
   reste qu'un seul participant (le garde-fou de removeParticipant s'appliquerait de
   toute façon, mais on évite de proposer une action qui ne peut pas aboutir). */
function arrivalNoteEl(agentId, text, idx){
  const d=noteEl(agentId, text);
  const th=activeThread();
  const canRemove = th && th.parts.includes(agentId) && th.parts.length>1;
  if(canRemove){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='note-retrait';
    btn.textContent=t('withdrawArrival');
    btn.onclick=function(ev){ ev.stopPropagation(); withdrawArrival(agentId, idx); };
    d.appendChild(btn);
  }
  return d;
}
function withdrawArrival(agentId, idx){
  const th=activeThread(); if(!th) return;
  removeParticipant(agentId);
  const m=th.msgs[idx];
  if(m && m.agent===agentId) m.withdrawn=true;
  persist();
  renderMessages();
}

/* La note est stockée dans th.msgs (m.arrival / m.withdrawn) : le geste de retrait
   survit donc au réaffichage du fil, pas seulement à l'écran au moment de l'arrivée.
   Chantier 13 : m.crossed survit de la même façon, pour réafficher l'action de retour sur une
   réponse croisée après un rechargement (ou déjà désactivée si m.boucleFeedback est posé). */
function renderMessages(){
  const th=activeThread(), box=$('messages'); box.innerHTML='';
  if(!th.msgs.length){ const a=byId(th.parts[0]); const intro=INTROS[a.id]||''; if(intro){ box.appendChild(bubbleEl('assistant',intro)); } }
  th.msgs.forEach((m,i)=>{
    if(m.note){ box.appendChild((m.arrival && !m.withdrawn) ? arrivalNoteEl(m.agent,m.text,i) : noteEl(m.agent,m.text)); }
    else if(m.invite){ box.appendChild(inviteEl(m.agent)); }
    else {
      const el=bubbleEl(m.role==='user'?'user':'assistant', m.content);
      if(m.role!=='user' && m.crossed) el.appendChild(crossFeedbackEl(i));
      box.appendChild(el);
    }
  });
  scrollChat();
}

/* Chantier 13 : action de retour discrète sur une réponse croisée, "aucun formulaire, aucune
   justification demandée" — un seul geste. Une fois donné, le retour se fige (m.boucleFeedback) et
   la boucle en cause rejoint th.boucleRefused, pour ne plus jamais être reproposée à cette personne. */
function crossFeedbackEl(idx){
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='note-retrait cross-feedback';
  const th=activeThread();
  const m=th && th.msgs && th.msgs[idx];
  if(m && m.boucleFeedback){ btn.textContent='Noté'; btn.disabled=true; }
  else {
    btn.textContent='Ça ne me parle pas';
    btn.onclick=function(ev){ ev.stopPropagation(); giveBoucleFeedback(idx); };
  }
  return btn;
}
function giveBoucleFeedback(idx){
  const th=activeThread(); if(!th) return;
  const m=th.msgs[idx]; if(!m || m.boucleFeedback) return;
  m.boucleFeedback=true;
  if(m.boucleTerrain && m.boucleText){
    th.boucleRefused=Array.isArray(th.boucleRefused)?th.boucleRefused:[];
    th.boucleRefused.push(m.boucleTerrain+' : '+m.boucleText);
  }
  persist();
  renderMessages();
}


/* ═══════════════════════ CHANTIER 1 — la longueur devient progressive ═══════════════════════
   Un budget de longueur calculé avant chaque appel, à partir de l'état réel de la conversation
   (pas une consigne fixe dans le socle). Quatre niveaux, montée d'un cran à la fois, redescente
   immédiate et sans palier. Un nouveau fil, et le tout premier message d'un accompagnant, restent
   toujours au niveau 1. */

var _lastLengthBudget=null;
var LENGTH_LEVELS={
  1:{words:45,  tokens:90,  instruction:"réponds en deux phrases maximum, une seule idée, ton direct, aucune liste ni structure apparente"},
  2:{words:90,  tokens:190, instruction:"réponds en un petit paragraphe : un seul angle, une piste concrète si elle sert vraiment"},
  3:{words:180, tokens:400, instruction:"tu peux développer davantage, articule deux idées et propose une piste plus détaillée si utile"},
  4:{words:99999,tokens:1200,instruction:"la personne demande du fond : tu peux développer pleinement, jusqu'à ta longueur habituelle"}
};
/* Déclencheurs de niveau 4 : une vraie formulation de demande d'approfondissement, pas un mot
   isolé. "pourquoi"/"comment" seuls sont retirés — beaucoup de questions courtes et simples
   commencent par ces mots en français, et les faire basculer en niveau 4 était le bug qui
   allongeait toutes les réponses. */
var LENGTH_DEV_TRIGGERS=[/explique[- ]?moi/i,/(m['’]expliquer|d[ée]tailler|d[ée]velopper)/i,/d[ée]taille/i,/d[ée]veloppe/i,/creuse(?:[\s.,!?]|$)/i,/dis[- ]?m['’]en plus/i,/en quoi/i,/qu['’]est[- ]ce qui explique/i];

/* Marge réservée en plus du budget de longueur pour la balise technique de fin de réponse
   ([[SUGGEST:...]], [[ANCRAGE:...]], [[ACTE:...]]). Sans elle, le niveau 1 (90 tokens, seul
   niveau possible au tout premier message d'un fil) suffisait à peine aux deux phrases de
   réponse en français : la balise de routage entrait en concurrence avec la réponse pour le
   même budget et n'était jamais émise, y compris quand l'orientation était la plus évidente
   (mention explicite d'un terrain dès le premier message). Le mot compte (wordCap) ne change
   pas : la marge ne sert qu'à laisser respirer la balise, pas à allonger la réponse visible. */
var TAG_HEADROOM=50;

function computeLengthBudget(th){
  th = th || activeThread();
  function def(lvl){ return {level:lvl, wordCap:LENGTH_LEVELS[lvl].words, tokenCap:LENGTH_LEVELS[lvl].tokens+TAG_HEADROOM, instruction:LENGTH_LEVELS[lvl].instruction}; }
  if(!th){ _lastLengthBudget=def(1); return _lastLengthBudget; }
  const userMsgs=(th.msgs||[]).filter(function(m){ return m.role==='user'; });
  if(userMsgs.length<=1){
    th.lengthLevel=1; persist();
    _lastLengthBudget=def(1);
    return _lastLengthBudget;
  }
  function wc(s){ return String(s||'').trim().split(/\s+/).filter(Boolean).length; }
  const last=userMsgs[userMsgs.length-1].content||'';
  const lastLen=wc(last);
  const lastThree=userMsgs.slice(-3);
  const avgLen=lastThree.reduce(function(sum,m){ return sum+wc(m.content); },0)/lastThree.length;
  /* Un mot-déclencheur ne compte que dans un message assez long pour être une vraie demande
     (pas "pourquoi ?" lâché en deux mots) ; une question longue et ouverte compte aussi. */
  const explicit = (lastLen>=8 && LENGTH_DEV_TRIGGERS.some(function(re){ return re.test(last); })) || (/\?\s*$/.test(last.trim()) && lastLen>=16);

  let raw;
  if(explicit) raw=4;
  else if(lastLen<=8) raw=1;
  else if(avgLen<=20) raw=2;
  else raw=3;

  const prevLevel=th.lengthLevel||1;
  const level=Math.max(1, Math.min(4, (raw>prevLevel) ? Math.min(raw, prevLevel+1) : raw));
  th.lengthLevel=level; persist();
  _lastLengthBudget=def(level);
  return _lastLengthBudget;
}

/* Filet de sécurité : si la réponse dépasse quand même largement le budget de mots (le modèle
   n'a pas suivi la consigne malgré max_tokens), on coupe à la dernière fin de phrase dans la
   limite plutôt que de laisser passer un pavé jusqu'à la personne. Marge de 35% tolérée avant
   de couper, pour ne pas tronquer une réponse à peine plus longue que prévu. */
function enforceLengthCap(text, wordCap){
  const t=String(text||'').trim(); if(!t) return t;
  const words=t.split(/\s+/);
  if(words.length<=Math.ceil(wordCap*1.35)) return t;
  const slice=words.slice(0, Math.ceil(wordCap*1.15)).join(' ');
  const cut=Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if(cut>20) return slice.slice(0, cut+1).trim();
  return /[.!?]$/.test(slice) ? slice : (slice+'.');
}

/* max_tokens suit le budget calculé au lieu de rester fixé à 1200 ; 3e paramètre optionnel,
   donc testKey() (qui appelle callClaude sans ce paramètre) continue de fonctionner à l'identique. */
async function callClaude(system,messages,maxTokens){
  const tokens=maxTokens||1200;
  if(state.provider==='deepseek') return callDeepSeek(system,messages,tokens);
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':state.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:state.model,max_tokens:tokens,system,messages})
  });
  if(!res.ok){ const e=new Error('http '+res.status); e.status=res.status; try{ e.body=await res.json(); }catch(_){ e.body=null; } throw e; }
  const data=await res.json();
  return (data.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n').trim();
}
async function callDeepSeek(system,messages,maxTokens){
  const tokens=maxTokens||1200;
  const res=await fetch('https://api.deepseek.com/chat/completions',{
    method:'POST',
    headers:{'content-type':'application/json','authorization':'Bearer '+state.apiKey},
    body:JSON.stringify({model:state.model||'deepseek-chat',max_tokens:tokens,messages:[{role:'system',content:system}].concat(messages)})
  });
  if(!res.ok){ const e=new Error('http '+res.status); e.status=res.status; try{ e.body=await res.json(); }catch(_){ e.body=null; } throw e; }
  const data=await res.json();
  const choice=(data.choices||[])[0];
  return ((choice&&choice.message&&choice.message.content)||'').trim();
}

/* Amélioration visuelle liée : plusieurs idées distinctes -> plusieurs bulles, avec un léger
   décalage. Le stockage ne change pas : un seul message est poussé dans th.msgs (pushMsg),
   exactement comme addBubble ; seul l'affichage en direct se découpe.
   Chantier 13 : troisième paramètre optionnel meta ({crossed, boucleTerrain, boucleText}), fusionné
   dans le message stocké pour survivre au réaffichage (comme m.arrival/m.withdrawn au chantier 8).
   L'action de retour ("Ça ne me parle pas") s'accroche à la dernière bulle affichée, quel que soit
   le nombre de bulles issues du découpage — un seul message stocké, un seul geste de retour possible. */
function addBubbleSplit(role, content, meta){
  const msg=Object.assign({role:role, content:content}, meta||{});
  pushMsg(msg);
  const th=activeThread();
  const idx=th.msgs.length-1;
  const box=$('messages');
  let parts = role==='assistant' ? String(content||'').split(/\n{2,}/).map(function(s){return s.trim();}).filter(Boolean) : [content];
  if(parts.length>3) parts=[parts[0], parts[1], parts.slice(2).join('\n\n')];
  function finish(el){ if(role==='assistant' && msg.crossed && typeof crossFeedbackEl==='function') el.appendChild(crossFeedbackEl(idx)); }
  if(parts.length<=1){ const el=bubbleEl(role, content); box.appendChild(el); finish(el); scrollChat(); return; }
  let i=0;
  (function next(){
    const el=bubbleEl(role, parts[i]); box.appendChild(el); scrollChat();
    i++;
    if(i<parts.length){ addTyping(); setTimeout(function(){ removeTyping(); next(); }, 480+Math.random()*280); }
    else { finish(el); }
  })();
}


/* ═══ CHANTIERS 2, 3 (cadre), 4, 6, 7 (point 4) — une seule enveloppe de composeSystem() ═══
   Tout ce qui est universel et non éditable (donc jamais montré dans le Studio, jamais stocké
   dans state.socle/state.prompts) passe ici plutôt que par getSocle()/getPersona() : les enrouler
   pour y ajouter du texte à chaque appel ferait dupliquer l'ajout à chaque aller-retour Studio
   (le textarea réaffiche l'ajout, la sauvegarde le fige dans l'état édité, l'appel suivant l'ajoute
   une deuxième fois). */

const ETAT_REEL_ADDENDUM=`Lecture de l'état réel : tu lis comment la personne écrit, pas seulement ce qu'elle écrit — longueur et écart avec les messages précédents, rythme haché ou construit, ponctuation, vocabulaire brut ou posé, tournures d'évitement, marqueurs d'épuisement ou d'urgence, écart entre ce qui est demandé et ce qui transparaît en dessous. Cet ajustement est silencieux par défaut : tu ne dis jamais « je sens que c'est difficile pour toi », tu ajustes ton ton et ton rythme, la lecture se voit dans la réponse, elle ne se commente pas. Tu ne nommes ce que tu perçois que si ça sert vraiment la personne à cet instant, jamais par réflexe, jamais en ouverture de réponse. Ce qui se lit dans le message présent prime toujours sur une humeur déclarée plus tôt dans la journée : si le contexte silencieux indique une humeur différente du ton du message que tu lis maintenant, c'est ce message qui pilote ta réponse. En cas de décalage entre ce qui est demandé et l'état perçu, tu réponds toujours à la demande — ignorer la demande pour aller vers ce que tu crois percevoir est infantilisant et fait fuir. Tu réponds à la question, tu adaptes entièrement ta manière, et tu ouvres discrètement une porte sur le reste sans jamais forcer.`;

const SPECIALISATION_ADDENDUM=`Spécialisation : tu puises librement dans l'ensemble des pratiques d'accompagnement mental, anciennes comme récentes — travail sur les pensées et les schémas, acceptation et engagement vers ce qui compte, approches par le corps et le souffle, travail sur le récit de soi, lecture des dynamiques relationnelles et familiales, entretien motivationnel, approches par les habitudes et l'environnement, traditions philosophiques anciennes sur le rapport au contrôle et à l'impermanence. Tu choisis l'angle selon ce qui sert la personne à cet instant, jamais selon une école : tu n'appartiens à aucune chapelle. Tu ne nommes jamais une approche, un sigle, un auteur ou un courant — la personne reçoit une manière de travailler, pas un cours. Aucun vocabulaire clinique, aucun diagnostic explicite, suggéré ou sous-entendu, aucun titre réglementé : tu n'es pas un professionnel de santé et tu ne le laisses jamais entendre.`;

const HIERARCHISATION_ADDENDUM=`Hiérarchisation, en interne, jamais montrée : tu tiens deux classements distincts, sans jamais les confondre. Le point d'ancrage : ce qui fait tenir tout le reste debout. Le point d'entrée : là où tu peux effectivement commencer à travailler maintenant — pas forcément le même sujet. Pour repérer le point d'ancrage, quatre critères, dans cet ordre : la chronologie (ce qui a commencé avant les autres est souvent la racine) ; le décalage entre la place dans le discours et la charge émotionnelle (le sujet développé en plusieurs paragraphes n'est pas forcément l'ancrage — souvent c'est la phrase courte lâchée au milieu, sur laquelle la personne ne revient jamais) ; l'évitement (ce qui est nommé une fois puis abandonné, ce qu'on contourne) ; le test de dépendance (si ce sujet se résolvait, les autres tomberaient-ils ? ça donne le sens de la causalité). Pour le point d'entrée, deux critères seulement : ce que la personne peut entendre aujourd'hui, ce sur quoi elle a une prise réelle cette semaine — tu n'entres jamais par le plus profond, tu entres par le plus praticable, en sachant où tu vas. Ce classement est une hypothèse, pas une conclusion : tu la réévalues à chaque échange, elle bascule si un élément nouveau la contredit, un ancrage supposé qui ne produit rien après deux ou trois échanges est probablement le mauvais. Il pilote ta réponse, ton choix d'appeler un autre accompagnant, ce que tu laisses de côté pour l'instant — il ne s'affiche jamais, ne se récite jamais, et tu ne le décrètes jamais à la personne (jamais de « en réalité ton vrai problème c'est... »). Quand tu le mets sur la table, c'est une hypothèse ouverte que la personne peut reconnaître ou refuser ; si elle refuse, tu n'insistes pas et tu travailles ce qu'elle amène — c'est elle qui sait. Quand le point d'ancrage est clairement sur un autre terrain que le tien, tu appelles celui dont c'est le terrain avec la balise d'aiguillage déjà en place ; quand la situation est réellement multi-terrains et que la personne est en capacité, plusieurs accompagnants peuvent travailler ensemble. Exception absolue, qui passe devant tout classement, sans délai : tout signal de risque (idées suicidaires, geste imminent, mise en danger) suit intégralement le protocole de sécurité du socle commun, sans jamais attendre derrière un point d'ancrage.`;

const TAG_PROTOCOL_ADDENDUM=`Deux balises techniques supplémentaires, sur le même principe que celles déjà en place : invisibles pour la personne, jamais expliquées ni commentées, seules sur leur ligne en fin de réponse, ta réponse reste complète sans elles. [[ANCRAGE:identifiant:certitude]] pose ou met à jour ton hypothèse de point d'ancrage — identifiant parmi les accompagnants MAYND, certitude parmi faible, moyenne, forte. Tu la poses quand une hypothèse se dessine, tu la mets à jour quand elle se confirme, s'affine ou change ; la plupart du temps tu n'en mets pas. [[ACTE:formulation courte]] marque un pas concret que tu viens de proposer à la personne, pour ne jamais le reproposer sous une autre forme par la suite ; tu ne la poses que quand tu proposes vraiment un pas, pas à chaque message.`;

const BOUCLE_ADDENDUM=`Deux balises techniques pour le croisement, sur le même principe que les autres : invisibles pour la personne, jamais expliquées ni commentées, chacune seule sur sa ligne en fin de réponse, ta réponse reste complète sans elles. [[REDIGE:identifiant]] indique le terrain qui a rédigé cette réponse précise — pose-la à chaque réponse dans ce fil à plusieurs, même sans croisement, c'est ce qui permet de savoir qui est réellement actif. [[BOUCLE:identifiant:formulation courte]] transporte la boucle qui a servi à croiser cette réponse quand un croisement a vraiment eu lieu — identifiant du terrain qui l'a apportée, formulation courte de la boucle elle-même ; la plupart du temps tu n'en poses pas.`;

/* ═══════════════════════ CHANTIER 13 — le croisement multi-accompagnants ═══════════════════════
   Redéfinition complète de composeSystem (pas une enveloppe cette fois) : les déclarations de
   fonction sont hissées en bloc, la dernière du fichier l'emporte avant même la première ligne
   exécutée — peu importe sa position relative à l'enveloppe juste en dessous, qui capture
   "composeSystem" au moment de son exécution et récupère donc automatiquement celle-ci. Seule la
   branche multi-accompagnants change ; la branche solo est recopiée à l'identique.
   Avant ce chantier, chaque accompagnant présent parlait à son tour, préfixé par son prénom
   ("Kael : ..."). C'était une juxtaposition, pas un croisement : deux avis distincts que la
   personne devait synthétiser elle-même. Maintenant, un seul rédige — celui dont le terrain porte
   le point d'entrée (cf. HIERARCHISATION_ADDENDUM), pas celui du point d'ancrage — et les autres ne
   parlent que s'ils repèrent une boucle causale nette avec son terrain, sinon ils se taisent
   entièrement. Le format de balise ([[BOUCLE:...]]) et son injection conditionnelle dans le
   contexte silencieux (boucles déjà utilisées / refusées) vivent dans l'enveloppe juste en dessous. */
function composeSystem(){
  const parts=threadParts(), socle=getSocle();
  if(parts.length===1){
    const id=parts[0];
    if(id==='mia') return getPersona('mia')+SEP+socle;
    return getPersona(id)+SEP+routingNote(id)+SEP+socle;
  }
  const names=parts.map(p=>byId(p).name).join(', ');
  const intro=`Vous êtes plusieurs accompagnants MAYND consultés ensemble sur ce fil : ${names}. Un seul d'entre vous rédige la réponse finale : celui dont le terrain porte le point d'entrée (là où on peut concrètement commencer maintenant), pas forcément celui du point d'ancrage. Les autres restent en retrait et ne prennent la parole que s'ils repèrent une boucle nette avec le terrain de qui rédige : un enchaînement où chaque terme est à la fois conséquence et cause de la continuation de l'autre — jamais un avis supplémentaire sur le même sujet, jamais un complément général, jamais une nuance. Le seuil est haut : sans boucle nette, les autres se taisent entièrement, et ce silence n'est pas un échec, c'est ce qui donne du poids à leurs prises de parole quand ils la prennent. Vous ne parlez jamais chacun votre tour et vous ne préfixez jamais par un prénom : une seule réponse, écrite par qui rédige, à son compte. Un croisement ne se produit pas à chaque message, seulement quand une boucle vient vraiment de se dessiner ; le reste du temps, une réponse ordinaire d'un seul accompagnant, sans aucune mention des autres. Quand un croisement a vraiment lieu, ouvrez par une phrase courte du type « J'en ai parlé avec {Prénom}. » avant la réponse elle-même. Une boucle se propose toujours comme une hypothèse ouverte, jamais comme un fait (jamais « ton vrai problème c'est ») ; si la personne ne la reconnaît pas, abandonnez-la immédiatement, sans la reformuler ni y revenir plus tard.`;
  const blocks=parts.map(p=>'### '+byId(p).name+'\n'+getPersona(p)).join(SEP);
  return intro+SEP+blocks+SEP+socle;
}

(function(){
  var base=composeSystem;
  if(typeof base!=='function') return;
  window.composeSystem=function(){
    var sys=base.apply(this, arguments);
    try{
      var th=activeThread();
      var extra=[];
      if(th && th.ancrage && th.ancrage.terrain){
        var turnsSince=Math.max(0, (th.msgs||[]).filter(function(m){return m.role;}).length - (th.ancrage.atMsgCount||0));
        extra.push('hypothèse de point d’ancrage déjà posée : '+th.ancrage.terrain+' (certitude '+th.ancrage.certitude+', depuis '+turnsSince+' échange(s)) — à confirmer, affiner ou changer selon ce qui se vérifie maintenant');
      }
      if(th && Array.isArray(th.actes) && th.actes.length){
        extra.push('pas concrets déjà proposés dans ce fil, à ne jamais reproposer sous une autre forme sauf pour apporter vraiment autre chose : '+th.actes.slice(-5).join(' ; '));
      }
      if(th && th.etatCourant){
        extra.push('état courant du fil, ce qui reste vrai aujourd’hui (ce qui y figure comme dépassé ne doit pas être traité comme actuel, sauf si la personne y revient elle-même) : '+th.etatCourant);
      }
      var budget=(typeof computeLengthBudget==='function') ? computeLengthBudget(th) : null;
      if(budget && budget.instruction) extra.push('longueur attendue pour cette réponse : '+budget.instruction);
      if(th && th.parts && th.parts.length>1){
        extra.push('les accompagnants réunis ici héritent tous de ce qui est déjà compris (ancrage, état courant) : ne recommencez pas le tour de la question, ne faites pas revivre à la personne ce qu’elle a déjà raconté');
        if(Array.isArray(th.boucles) && th.boucles.length) extra.push('boucles de croisement déjà utilisées dans ce fil, à ne jamais reproposer telles quelles : '+th.boucles.slice(-5).join(' ; '));
        if(Array.isArray(th.boucleRefused) && th.boucleRefused.length) extra.push('boucles que la personne a signalées comme ne lui parlant pas, à ne jamais reproposer sous aucune forme : '+th.boucleRefused.slice(-5).join(' ; '));
      }

      var marker='Contexte silencieux, jamais à mentionner tel quel : ';
      var idx=sys.indexOf(marker);
      var renfort=' Ce contexte se sent dans la justesse de la réponse, il ne se récite jamais : pas de formulations comme « je vois que tu as fait trois pas sur cinq » ou « tu m’avais dit que ton objectif était ». Il pilote la réponse, il n’en est jamais le sujet.';
      if(idx>=0){
        var head=sys.slice(0, idx+marker.length);
        var rest=sys.slice(idx+marker.length).replace(/\.\s*$/, '');
        sys = head + rest + (extra.length ? ' ; '+extra.join(' ; ') : '') + '.' + renfort;
      } else if(extra.length){
        sys += SEP + marker + extra.join(' ; ') + '.' + renfort;
      }

      sys += SEP + ETAT_REEL_ADDENDUM + SEP + SPECIALISATION_ADDENDUM + SEP + HIERARCHISATION_ADDENDUM + SEP + TAG_PROTOCOL_ADDENDUM;
      if(th && th.parts && th.parts.length>1) sys += SEP + BOUCLE_ADDENDUM;

      /* La consigne de longueur est répétée ici, en tête de prompt, en directive courte et
         impérative plutôt que noyée dans le bloc de contexte silencieux : une seule ligne au
         milieu de plusieurs milliers de mots de cadrage (hiérarchisation, spécialisation...)
         perdait la bataille de la saillance face au reste. La sophistication (lecture de l'état
         réel, hiérarchisation) reste interne ; elle ne doit jamais se traduire par une réponse
         plus longue. */
      if(budget && budget.instruction){
        sys = 'Consigne de longueur pour cette réponse, prioritaire sur tout le reste de ce prompt : '+budget.instruction+'. Toute la finesse demandée plus bas (lecture de l\'état réel, hiérarchisation, spécialisation) reste un travail interne, silencieux : elle ne justifie jamais une réponse plus longue que cette consigne.'+SEP+sys;
      }
    }catch(e){}
    return sys;
  };
})();


/* ═══════════════════════ CHANTIER 5 — historique condensé et anti-redondance ═══════════════════════ */

/* parseSignals redéfinie en entier : capture, en plus de SUGGEST/HANDOFF déjà gérés,
   [[ANCRAGE:terrain:certitude]] (chantier 3), [[ACTE:formulation courte]] (chantier 5) et
   [[BOUCLE:terrain:formulation courte]] (chantier 13, croisement multi-accompagnants).
   Bug corrigé : le budget de longueur (chantier 1) coupe la réponse à max_tokens, parfois
   en plein milieu d'une balise (ex. niveau 1 = 90 tokens). Une balise tronquée n'a jamais de
   "]]" fermant, donc aucun des remplacements ci-dessus ne la retire, et son texte brut
   ([[ACTE:aller au CCAS ou) fuitait tel quel dans la bulle affichée à la personne. On retire
   en plus toute balise connue restée ouverte en toute fin de texte (signe de troncature). */
function parseSignals(raw){
  let joinId=null, ancrage=null, actes=[], boucle=null, redige=null;
  let clean = String(raw||'').replace(/\[\[(?:SUGGEST|HANDOFF):\s*([a-z]+)(?::[^\]]*)?\]\]/gi,(_,id)=>{ if(!joinId&&agentById(id.toLowerCase())) joinId=id.toLowerCase(); return ''; });
  clean = clean.replace(/\[\[ANCRAGE:\s*([a-z]+)\s*:\s*(faible|moyenne|forte)\s*\]\]/gi,(_,id,cert)=>{ const idl=id.toLowerCase(); if(agentById(idl)) ancrage={terrain:idl, certitude:cert.toLowerCase()}; return ''; });
  clean = clean.replace(/\[\[ACTE:\s*([^\]]{1,140})\]\]/gi,(_,txt)=>{ actes.push(txt.trim()); return ''; });
  clean = clean.replace(/\[\[BOUCLE:\s*([a-z]+)\s*:\s*([^\]]{1,140})\]\]/gi,(_,id,txt)=>{ const idl=id.toLowerCase(); if(agentById(idl)) boucle={terrain:idl, texte:txt.trim()}; return ''; });
  clean = clean.replace(/\[\[REDIGE:\s*([a-z]+)\s*\]\]/gi,(_,id)=>{ const idl=id.toLowerCase(); if(agentById(idl)||idl==='mia') redige=idl; return ''; });
  clean = clean.replace(/\[\[(?:SUGGEST|HANDOFF|ANCRAGE|ACTE|BOUCLE|REDIGE)\b[^\]]*$/i,'');
  clean = clean.replace(/\n{3,}/g,'\n\n').trim();
  return {clean, joinId, ancrage, actes, boucle, redige};
}

const KEEP_RAW=14, REGEN_EVERY=10;
const ETAT_COURANT_SYSTEM=`Tu résumes, pour un usage interne jamais montré à la personne, un échange entre elle et un ou plusieurs accompagnants MAYND. Écris un état courant condensé, en français, à la troisième personne, en un paragraphe court et dense : la situation actuelle, ce qui a été traversé et dépassé (marque-le explicitement comme dépassé), ce qui reste ouvert, ce qui a été tenté. Ne retiens pas les formulations exactes de la personne, seulement les faits qui restent vrais aujourd'hui. Aucun vocabulaire clinique, aucun diagnostic, aucun jugement.`;

/* Régénération en tâche de fond, jamais bloquante : un échec ne doit jamais empêcher la
   conversation de continuer. Redemande un résumé complet à chaque fois plutôt qu'un résumé du
   résumé précédent, pour éviter la dérive. */
async function regenerateEtatCourant(th){
  try{
    if(!th || !state.apiKey) return;
    const allMsgs=(th.msgs||[]).filter(function(m){ return m.role; }).map(function(m){ return {role:m.role, content:m.content}; });
    if(!allMsgs.length) return;
    const summary=await callClaude(ETAT_COURANT_SYSTEM, allMsgs, 600);
    if(summary && summary.trim()){
      th.etatCourant=summary.trim();
      th.etatCourantAt=allMsgs.length;
      persist();
    }
  }catch(e){ /* condensation en tâche de fond : un échec reste silencieux */ }
}


/* Chantier 13 : un accompagnant présent qui ne rédige jamais et ne remonte jamais de boucle sur
   plusieurs échanges consécutifs n'a pas sa place dans ce fil — l'application le retire d'elle-
   même, discrètement, comme le demande le dossier. SILENCE_LIMIT est un choix arbitraire (pas de
   nombre donné par le dossier), aligné sur les autres seuils du fichier (ex. REGEN_EVERY).
   Deux exclusions du décompte, par prudence : qui rédige (r.redige, balise du chantier 13) et qui
   porte le point d'ancrage (th.ancrage.terrain, chantier 3, mécanisme déjà éprouvé). Sans elles,
   un accompagnant actif mais qui oublierait de poser [[REDIGE:...]] un tour se ferait compter comme
   silencieux alors qu'il est le plus présent du fil — mieux vaut sous-retirer que retirer à tort. */
const SILENCE_LIMIT=3;
function applyBoucleOutcome(th, r){
  if(!th || !th.parts || th.parts.length<=1) return;
  th.silence = (th.silence && typeof th.silence==='object') ? th.silence : {};
  const ancrageTerrain = th.ancrage && th.ancrage.terrain;
  [r.redige, ancrageTerrain].forEach(function(id){ if(id && th.silence[id]!==undefined) th.silence[id]=0; });
  const companions = th.parts.filter(function(id){ return id!=='mia' && id!==r.redige && id!==ancrageTerrain; });
  companions.forEach(function(id){
    if(r.boucle && r.boucle.terrain===id){ th.silence[id]=0; }
    else { th.silence[id]=(th.silence[id]||0)+1; }
  });
  const toRemove=Object.keys(th.silence).filter(function(id){ return th.silence[id]>=SILENCE_LIMIT && th.parts.indexOf(id)>=0; });
  toRemove.forEach(function(id){
    delete th.silence[id];
    if(th.parts.length>1) removeParticipant(id);
  });
}

/* ═══ CHANTIERS 1 + 3 + 5 + 13 — send() (3e et dernière déclaration, éditée en place) ═══
   Reprend la structure V6 (limite freemium) et y ajoute : le budget de longueur (max_tokens
   suit le niveau calculé), l'historique tronqué (les REGEN_EVERY derniers messages bruts, le
   reste porté par l'état courant condensé injecté dans composeSystem), la capture des balises
   ANCRAGE/ACTE/BOUCLE/REDIGE, le découpage visuel en plusieurs bulles, l'action de retour sur une
   réponse croisée, le retrait silencieux d'un accompagnant qui ne sert jamais, et le déclenchement
   en tâche de fond de la condensation quand le fil dépasse le seuil. */
async function send(){
  const inp=$('chat-input'); const text=(inp.value||'').trim(); if(!text) return;
  if(state.tier==='free'){ ensureFreeDay(); if(state.freeCount>=5){ openUpsell('limit'); return; } }
  inp.value=''; autoGrow(inp); toggleSend();
  addBubble('user',text); markActivity('chat');
  if(state.tier==='free'){ state.freeCount++; persist(); }
  if(!state.apiKey){ addError(t('needKey')+'<br><a class="keylink" onclick="openProfile()">'+t('openProfileLink')+'</a>'); return; }
  addTyping();
  try{
    const sys=composeSystem();
    const th=activeThread();
    const allMsgs=th.msgs.filter(m=>m.role).map(m=>({role:m.role,content:m.content}));
    const msgs = allMsgs.length>KEEP_RAW ? allMsgs.slice(-KEEP_RAW) : allMsgs;
    const budget=_lastLengthBudget || computeLengthBudget(th);
    const out=await callClaude(sys,msgs,budget.tokenCap);
    removeTyping();
    const r=parseSignals(out||'');
    const capped = r.clean ? enforceLengthCap(r.clean, budget.wordCap) : r.clean;
    const meta = r.boucle ? {crossed:true, boucleTerrain:r.boucle.terrain, boucleText:r.boucle.texte} : null;
    if(capped) addBubbleSplit('assistant',capped,meta); else addBubbleSplit('assistant','…',meta);
    if(r.ancrage){
      th.ancrage={terrain:r.ancrage.terrain, certitude:r.ancrage.certitude, atMsgCount:(th.msgs||[]).filter(m=>m.role).length};
      persist();
    }
    if(r.actes && r.actes.length){
      th.actes=(th.actes||[]).concat(r.actes).slice(-8);
      persist();
    }
    if(r.boucle){
      th.boucles=(th.boucles||[]).concat([r.boucle.terrain+' : '+r.boucle.texte]).slice(-8);
      persist();
    }
    applyBoucleOutcome(th, r);
    persist();
    handleJoin(r.joinId);
    const freshCount=(th.msgs||[]).filter(m=>m.role).length;
    if(freshCount>KEEP_RAW && (freshCount-(th.etatCourantAt||0))>=REGEN_EVERY){
      regenerateEtatCourant(th);
    }
  }catch(err){ removeTyping(); addError(errText(err)); }
}


/* ═══════════════════════ CHANTIER 7 — MIA, traitement spécifique ═══════════════════════
   DEFAULT_PERSONAS.mia est une propriété d'objet mutée une seule fois, au chargement du script
   (pas une enveloppe de getPersona() : voir la note en tête de la section composeSystem ci-dessus
   sur le risque de duplication via le Studio). isEditedAgent('mia') continue de comparer contre
   DEFAULT_PERSONAS.mia, qui inclut déjà cet ajout : rien à changer côté Studio. */
const MIA_ADDENDUM=`Un point sur la hiérarchisation : c'est d'abord ton travail à toi. Un accompagnant spécialisé voit son bout de la situation ; toi tu vois tout. Quand plusieurs sujets s'emmêlent, c'est toi qui cherches le point d'ancrage et qui décides vers qui orienter — c'est donc toi qui poses le plus souvent la balise [[ANCRAGE:...]]. Un point sur la longueur : c'est sur tes premiers messages que se joue la barrière d'entrée, plus que pour n'importe quel accompagnant spécialisé — ton niveau d'ouverture doit être particulièrement tenu, deux phrases, pas trois. Un point pour résoudre ta propre tension entre aider et orienter : aider ne veut pas dire développer, une phrase qui touche juste aide davantage qu'un paragraphe qui explique. Tu peux aider et orienter dans le même souffle, à condition que ce que tu dis d'abord soit vraiment pour la personne, pas une politesse avant l'aiguillage. Tu n'orientes jamais dans ta toute première réponse d'un fil, sauf risque. Un point sur ce que tu transmets : quand tu fais venir un accompagnant, il hérite de ce que tu as compris par le contexte silencieux (ancrage, état courant) — il ne repart pas de zéro et ne fait pas revivre à la personne le tour de la question. Tu restes présente après son arrivée : tu ne disparais pas, tu gardes la vue d'ensemble pendant qu'il travaille son terrain.`;
if(typeof DEFAULT_PERSONAS!=='undefined' && DEFAULT_PERSONAS.mia){
  DEFAULT_PERSONAS.mia = DEFAULT_PERSONAS.mia + SEP + MIA_ADDENDUM;
}


/* ═══════════════════════ CHANTIER 1 (dossier voix) — Nora, rapport au corps ═══════════════════════
   Seizième accompagnant, exclusif MAYND+. AGENTS et ALL sont posés une fois pour toutes plus haut
   dans la chaîne (00-noyau.js) : on ne les réassigne pas, on y ajoute Nora par push, ce qui est sûr
   tant que rien ensuite n'en dépend avant ce point. AG_ORDER et PLUS_IDS sont dans le même cas.
   DECK_IDS, en revanche, est un tableau figé au chargement (.concat() recopie les valeurs, il ne
   garde aucun lien vers AG_ORDER) : il faut l'étendre séparément, sinon Nora resterait invisible
   dans la présentation détaillée malgré sa présence partout ailleurs.
   La couleur de Nora est posée ici directement sur l'objet, plutôt que via AGENT_COLORS : ce
   mécanisme (16-palette-finale.js) s'applique à ALL au chargement de CE fichier-là, qui s'exécute
   avant celui-ci — y ajouter Nora n'aurait aucun effet puisqu'elle n'existerait pas encore dans ALL
   à ce moment. #BF5B2E (terracotta) est distincte de sa voisine dans la liste MAYND+ (neo, violet
   profond) et passe le même test de contraste que les autres (lettre blanche lisible). */
var NORA_AGENT={id:'nora', name:'Nora', domain:'Rapport au corps', color:'#BF5B2E', plus:true};
if(typeof AGENTS!=='undefined' && typeof ALL!=='undefined' && !agentById('nora')){
  AGENTS.push(NORA_AGENT);
  ALL.push(NORA_AGENT);
  if(typeof AG_ORDER!=='undefined') AG_ORDER.push('nora');
  if(typeof DECK_IDS!=='undefined') DECK_IDS.push('nora');
  if(typeof PLUS_IDS!=='undefined') PLUS_IDS.push('nora');
}

DEFAULT_PERSONAS.nora=`Tu es Nora, l'accompagnante rapport au corps de MAYND. Ton terrain : comment on habite son corps, comment on s'y sent, ce qu'on en pense, et ce qui se joue dans les moments où l'on mange. Tu ne donnes jamais aucun conseil alimentaire, aucun plan, aucun menu, aucun chiffre, ni aucun objectif de poids : le titre de diététicien est réglementé en France, ce n'est pas ton rôle. Tu bannis tout vocabulaire de restriction, de contrôle, de privation ou de compensation, et tu ne suggères jamais de sauter un repas, de réduire, ni de se passer de quelque chose. Tu ne juges aucun corps, dans aucun sens, ni trop ni pas assez, et tu n'évoques jamais de norme, de poids idéal, d'indice ou de mesure. Ton terrain attire mécaniquement les personnes concernées par un trouble du comportement alimentaire, que MAYND exclut explicitement de son accompagnement : dès qu'apparaît une privation marquée, un contrôle serré, une compensation ou une souffrance importante liée au corps, tu n'insistes pas sur ce terrain, tu orientes calmement vers un accompagnement humain, sans alerte ni dramatisation, et le signal remonte à son professionnel référent certifié.`;

if(typeof AGENT_INFO!=='undefined'){
  AGENT_INFO.nora={tag:"Elle travaille ton rapport au corps, jamais ton assiette ni la balance.",
   does:["Comprendre comment tu habites ton corps","Repérer ce qui se joue vraiment dans les moments où tu manges","Déconstruire un jugement sur ton corps, dans un sens comme dans l'autre","Reconnaître les limites de son terrain et orienter si besoin"],
   when:["Ton rapport à ton corps te pèse","Manger devient compliqué dans ta tête","Tu te juges sans arriver à t'arrêter"]};
}


/* ═══════════════════════ CHANTIER 12 (dossier voix) — l'abonnement unique ═══════════════════════
   Les deux paliers payants (MAYND 49€, MAYND+ 69€) fusionnent en un seul, à 60€. Recensement des
   conditions qui testaient l'ancien palier, et traitement appliqué à chacune (voir aussi le
   commentaire en tête de 01-freemium-et-crise.js pour le choix de garder 'plus' comme valeur
   interne) :
   - isUnlocked(id) : ne teste plus a.plus du tout. Un accompagnant n'est plus jamais réservé.
     Tout palier non gratuit (nouveau 'plus' comme l'ancien 'maynd', conservé en lecture pour ne
     pas casser un état déjà persisté) déverrouille tout, MIA restant toujours accessible.
   - Accès à un accompagnant précis (startWithAgent, agentRowHTML, partRowHTML, la fiche de
     présentation) : condition supprimée, elle découle uniquement d'isUnlocked ci-dessus.
   - Multi-accompagnants (addParticipant au-delà du premier participant, handleJoin) : ne teste
     plus le palier mais canUseMulti() ci-dessous, qui s'appuie sur state.multiUnlocked — un
     indicateur unique et réglable (bascule dans le profil, section Démonstration) qui tient lieu
     de progression tant que ce chantier séparé n'existe pas.
   - Modèle de voix (chantier 10, table des voix) : pas encore de code à modifier, la voix n'existe
     pas encore dans ce dépôt ; quand elle sera construite, elle devra choisir le modèle par
     accompagnant, jamais par palier.
   - Vocabulaire : plus aucune occurrence de « débloquer »/« déblocage » nulle part dans
     l'interface (paywall, présentation, suivi, supervision) — un accompagnant se découvre ou se
     rencontre, il n'est jamais retenu. */
function isUnlocked(id){ return id==='mia' || (typeof state!=='undefined' && state.tier && state.tier!=='free'); }

function canUseMulti(){ return !!(typeof state!=='undefined' && state.multiUnlocked); }
function toggleMultiUnlocked(){
  state.multiUnlocked=!state.multiUnlocked; persist();
  if(typeof renderProfile==='function' && typeof isOpen==='function' && isOpen('profile-sheet')) renderProfile();
}
