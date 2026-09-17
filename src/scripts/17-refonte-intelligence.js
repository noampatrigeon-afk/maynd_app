/* ══════════════════════════════════════════════════════════════════════════
   REFONTE DE L'INTELLIGENCE — MIA et les accompagnants
   Fichier tardif : toute redéfinition ci-dessous l'emporte sur les couches
   précédentes (voir docs/fonctions-redefinies.md, mis à jour en parallèle).
   Chantiers du cahier des charges, dans l'ordre d'implémentation recommandé :
   8 (retrait visible) → 1 (longueur progressive) → 6 (contexte silencieux
   étendu) → 2 (lecture de l'état réel) → 4 (spécialisation) → 5 (anti-
   redondance, historique condensé) → 3 (hiérarchisation) → 7 (MIA).
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
  if(state.tier==='plus'){
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
   survit donc au réaffichage du fil, pas seulement à l'écran au moment de l'arrivée. */
function renderMessages(){
  const th=activeThread(), box=$('messages'); box.innerHTML='';
  if(!th.msgs.length){ const a=byId(th.parts[0]); const intro=INTROS[a.id]||''; if(intro){ box.appendChild(bubbleEl('assistant',intro)); } }
  th.msgs.forEach((m,i)=>{
    if(m.note){ box.appendChild((m.arrival && !m.withdrawn) ? arrivalNoteEl(m.agent,m.text,i) : noteEl(m.agent,m.text)); }
    else if(m.invite){ box.appendChild(inviteEl(m.agent)); }
    else { box.appendChild(bubbleEl(m.role==='user'?'user':'assistant', m.content)); }
  });
  scrollChat();
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

function computeLengthBudget(th){
  th = th || activeThread();
  function def(lvl){ return {level:lvl, wordCap:LENGTH_LEVELS[lvl].words, tokenCap:LENGTH_LEVELS[lvl].tokens, instruction:LENGTH_LEVELS[lvl].instruction}; }
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
   exactement comme addBubble ; seul l'affichage en direct se découpe. */
function addBubbleSplit(role, content){
  pushMsg({role:role, content:content});
  const box=$('messages');
  let parts = role==='assistant' ? String(content||'').split(/\n{2,}/).map(function(s){return s.trim();}).filter(Boolean) : [content];
  if(parts.length>3) parts=[parts[0], parts[1], parts.slice(2).join('\n\n')];
  if(parts.length<=1){ box.appendChild(bubbleEl(role, content)); scrollChat(); return; }
  let i=0;
  (function next(){
    box.appendChild(bubbleEl(role, parts[i])); scrollChat();
    i++;
    if(i<parts.length){ addTyping(); setTimeout(function(){ removeTyping(); next(); }, 480+Math.random()*280); }
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
      if(th && th.parts && th.parts.length>1) extra.push('les accompagnants réunis ici héritent tous de ce qui est déjà compris (ancrage, état courant) : ne recommencez pas le tour de la question, ne faites pas revivre à la personne ce qu’elle a déjà raconté');

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
   [[ANCRAGE:terrain:certitude]] (chantier 3) et [[ACTE:formulation courte]] (chantier 5). */
function parseSignals(raw){
  let joinId=null, ancrage=null, actes=[];
  let clean = String(raw||'').replace(/\[\[(?:SUGGEST|HANDOFF):\s*([a-z]+)(?::[^\]]*)?\]\]/gi,(_,id)=>{ if(!joinId&&agentById(id.toLowerCase())) joinId=id.toLowerCase(); return ''; });
  clean = clean.replace(/\[\[ANCRAGE:\s*([a-z]+)\s*:\s*(faible|moyenne|forte)\s*\]\]/gi,(_,id,cert)=>{ const idl=id.toLowerCase(); if(agentById(idl)) ancrage={terrain:idl, certitude:cert.toLowerCase()}; return ''; });
  clean = clean.replace(/\[\[ACTE:\s*([^\]]{1,140})\]\]/gi,(_,txt)=>{ actes.push(txt.trim()); return ''; });
  clean = clean.replace(/\n{3,}/g,'\n\n').trim();
  return {clean, joinId, ancrage, actes};
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


/* ═══ CHANTIERS 1 + 3 + 5 — send() (3e redéfinition de cette fonction dans le dépôt) ═══
   Reprend la structure V6 (limite freemium) et y ajoute : le budget de longueur (max_tokens
   suit le niveau calculé), l'historique tronqué (les REGEN_EVERY derniers messages bruts, le
   reste porté par l'état courant condensé injecté dans composeSystem), la capture des balises
   ANCRAGE/ACTE, le découpage visuel en plusieurs bulles, et le déclenchement en tâche de fond
   de la condensation quand le fil dépasse le seuil. */
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
    if(capped) addBubbleSplit('assistant',capped); else addBubbleSplit('assistant','…');
    if(r.ancrage){
      th.ancrage={terrain:r.ancrage.terrain, certitude:r.ancrage.certitude, atMsgCount:(th.msgs||[]).filter(m=>m.role).length};
      persist();
    }
    if(r.actes && r.actes.length){
      th.actes=(th.actes||[]).concat(r.actes).slice(-8);
      persist();
    }
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
