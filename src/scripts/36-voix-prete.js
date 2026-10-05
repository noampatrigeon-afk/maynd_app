/* ══════════════════════════════════════════════════════════════════════════
   VOIX — PRÊTE À BRANCHER (05/10/2026)

   Demande du porteur du projet : « faire tout comme si j'avais déjà les voix ».
   ElevenLabs est écarté (trop cher), le fournisseur n'est pas choisi. Ce fichier
   rend la voix fonctionnelle de bout en bout, quel que soit le fournisseur :

   1. Une fiche par accompagnant (AGENT_VOICES) : le brief de casting, à donner
      tel quel à n'importe quel fournisseur, l'identifiant de la voix une fois
      choisie (voiceId), et le réglage de sa doublure.
   2. Deux moteurs derrière speakAgent(id, texte) :
      - « serveur » : dès que VOICE_ENDPOINT et le voiceId de l'accompagnant sont
        renseignés. Contrat d'échange dans docs/voix.md. Chaque fichier audio est
        mis en cache sur l'appareil : une phrase déjà entendue n'est jamais payée
        deux fois (échantillons, présentations, questions des jeux) ;
      - « navigateur » : la doublure, en attendant. La synthèse vocale du
        navigateur, voix françaises locales d'abord (rien ne sort de l'appareil
        quand une voix locale existe), avec une hauteur et un débit propres à
        chaque accompagnant, pour qu'ils sonnent différemment dès aujourd'hui.
      Sans l'un ni l'autre : « La voix de X arrive bientôt. », comme avant.
   3. Coût maîtrisé par construction : la lecture se fait à la demande (on ne
      paie que ce qui est écouté), la lecture automatique des réponses est une
      option de l'abonné, désactivée par défaut, et chaque caractère envoyé au
      serveur est décompté par mois (state.voixUsage). Un plafond mensuel est
      prévu (VOICE_CONFIG.plafondCaracteresMois), vide tant que le modèle
      économique ne l'a pas fixé.
   4. La règle de 32-voix.js ne change pas : une voix se réveille avec son
      accompagnant (à la fin de son jeu, ou en lui parlant), jamais en gratuit.
      Vocabulaire : elle se réveille, elle ne se « débloque » jamais.
   ══════════════════════════════════════════════════════════════════════════ */

var VOICE_CONFIG={
  format:'mp3',
  /* Caractères synthétisés par le serveur, par abonné et par mois. null : pas de plafond. */
  plafondCaracteresMois:null,
  /* Lecture automatique des réponses : désactivée par défaut, c'est le réglage le plus économe. */
  lectureAutoParDefaut:false,
  /* Nom du cache local des fichiers audio. */
  cache:'maynd-voix-v1'
};

/* Fiches de voix. doublure : réglage de la voix du navigateur (hauteur et débit, 1 = neutre). */
var VOIX_FICHES={
  mia:  {fiche:'Voix féminine, chaleureuse et nette. Sourire dans la voix, débit moyen, phrases posées. La voix qui accueille.', doublure:{hauteur:1.06, debit:1.0}},
  naoki:{fiche:'Voix masculine, posée, plutôt grave. Débit lent et ferme, aucune dureté. La voix du cadre.', doublure:{hauteur:0.86, debit:0.94}},
  felix:{fiche:'Voix masculine, claire et vive. Énergie souriante, débit plutôt rapide. La voix qui remet en confiance.', doublure:{hauteur:1.12, debit:1.06}},
  atlas:{fiche:'Voix masculine, grave et profonde. Débit lent, silences assumés. La voix qui prend le temps.', doublure:{hauteur:0.8, debit:0.9}},
  ava:  {fiche:'Voix féminine, douce et basse. Débit lent, beaucoup d’espace entre les phrases. La voix qui accueille ce qui pèse.', doublure:{hauteur:0.94, debit:0.88}},
  leo:  {fiche:'Voix masculine, chaude, registre médium. Débit moyen, ton d’égal à égal.', doublure:{hauteur:1.0, debit:0.98}},
  otis: {fiche:'Voix masculine, claire et très articulée. Assurée sans être sèche.', doublure:{hauteur:1.04, debit:1.02}},
  kael: {fiche:'Voix masculine, énergique, celle d’un partenaire d’entraînement. Débit vif, jamais criée.', doublure:{hauteur:1.08, debit:1.1}},
  miro: {fiche:'Voix masculine, très douce et feutrée. Débit lent, une voix du soir.', doublure:{hauteur:0.9, debit:0.84}},
  sol:  {fiche:'Voix masculine, calme et apaisée. Débit lent, respiration perceptible.', doublure:{hauteur:0.95, debit:0.86}},
  mateo:{fiche:'Voix masculine, nette et professionnelle. Débit moyen, précise.', doublure:{hauteur:0.98, debit:1.02}},
  soren:{fiche:'Voix masculine, chaleureuse et rassurante. Registre médium, débit moyen.', doublure:{hauteur:0.93, debit:0.97}},
  iris: {fiche:'Voix féminine, lumineuse et chaleureuse. Débit moyen, beaucoup de présence.', doublure:{hauteur:1.12, debit:1.0}},
  eden: {fiche:'Voix féminine, posée et assurée. Intime sans jamais chuchoter.', doublure:{hauteur:0.98, debit:0.95}},
  vince:{fiche:'Voix masculine, calme et sobre. Ton pragmatique, sans jugement.', doublure:{hauteur:0.9, debit:0.98}},
  neo:  {fiche:'Voix masculine, jeune et directe. Simple, jamais moralisatrice.', doublure:{hauteur:1.1, debit:1.03}},
  nora: {fiche:'Voix féminine, douce et ancrée. Débit lent, ton tranquille.', doublure:{hauteur:1.0, debit:0.92}}
};
ALL.forEach(function(a){
  var f=VOIX_FICHES[a.id]||{fiche:'', doublure:{hauteur:1, debit:1}};
  AGENT_VOICES[a.id]={voiceId:(AGENT_VOICES[a.id]&&AGENT_VOICES[a.id].voiceId)||null, fiche:f.fiche, doublure:f.doublure};
});

/* ─────────── usage et plafond ─────────── */
function moisCle(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function voixUsage(){
  var u=state.voixUsage;
  if(!u || u.mois!==moisCle()) u=state.voixUsage={mois:moisCle(), serveur:0, navigateur:0};
  return u;
}
function voixCompter(moteur, n){ var u=voixUsage(); u[moteur]=(u[moteur]||0)+n; persist(); }
function voixPlafondAtteint(){
  var p=VOICE_CONFIG.plafondCaracteresMois;
  return !!(p && voixUsage().serveur>=p);
}

/* ─────────── texte lu ─────────── */
function voixTexte(s){
  return String(s||'')
    .replace(/\[\[[^\]]*\]\]?/g,' ')
    .replace(/[*_#>`~]/g,' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,'')
    .replace(/\s+/g,' ').trim();
}

/* ─────────── moteur « navigateur » : la doublure ─────────── */
function voixNavDisponible(){ return typeof window!=='undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance==='function'; }
var VOIX_NOMS_F=/(denise|eloise|éloise|julie|hortense|amelie|amélie|audrey|aurelie|aurélie|marie|celine|céline|léa|chantal|virginie|sylvie|caroline|brigitte|yvette|coralie|charline|jacqueline|joséphine|josephine|vivienne|female|femme)/i;
var VOIX_NOMS_M=/(henri|paul|thomas|claude|nicolas|daniel|jean|alain|antoine|rémy|remy|guillaume|gérard|gerard|maurice|fabrice|jérôme|jerome|yves|alexandre|male|homme)/i;
function voixNavChoisir(id){
  var toutes=[]; try{ toutes=window.speechSynthesis.getVoices()||[]; }catch(e){}
  var fr=toutes.filter(function(v){ return /^fr([-_]|$)/i.test(v.lang||''); });
  if(!fr.length) return null;
  var locales=fr.filter(function(v){ return v.localService; });
  if(locales.length) fr=locales;
  var fem=voiceFem(id);
  var cands=fr.filter(function(v){ return (fem?VOIX_NOMS_F:VOIX_NOMS_M).test(v.name||''); });
  if(!cands.length) cands=fr;
  /* Chaque accompagnant garde toujours la même voix : on répartit les accompagnants du même genre sur les voix disponibles. */
  var rang=ALL.filter(function(a){ return voiceFem(a.id)===fem; }).map(function(a){ return a.id; }).indexOf(id);
  return cands[(rang<0?0:rang)%cands.length];
}
function voixNavigateur(id, texte, opts){
  return new Promise(function(resolve){
    try{
      var u=new window.SpeechSynthesisUtterance(texte);
      var v=voixNavChoisir(id); if(v) u.voice=v;
      u.lang=(v && v.lang) || 'fr-FR';
      var d=(AGENT_VOICES[id] && AGENT_VOICES[id].doublure) || {hauteur:1, debit:1};
      u.pitch=d.hauteur; u.rate=d.debit;
      u.onend=function(){ voixFin(); };
      u.onerror=function(){ voixFin(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      voixCompter('navigateur', texte.length);
      resolve(true);
    }catch(e){ resolve(false); }
  });
}

/* ─────────── moteur « serveur » : le fournisseur choisi, derrière VOICE_ENDPOINT ─────────── */
function voixEmpreinte(s){ var h=5381; for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; } return (h>>>0).toString(36); }
function voixCleCache(id, texte){ return String(VOICE_ENDPOINT).replace(/\/$/,'')+'/cache/'+encodeURIComponent(id)+'/'+encodeURIComponent(AGENT_VOICES[id].voiceId||'')+'/'+voixEmpreinte(texte)+'.'+VOICE_CONFIG.format; }
async function voixServeur(id, texte, opts){
  var a=byId(id), cle=voixCleCache(id, texte), blob=null, cache=null;
  try{ if(window.caches){ cache=await window.caches.open(VOICE_CONFIG.cache); var hit=await cache.match(cle); if(hit) blob=await hit.blob(); } }catch(e){ cache=null; }
  try{
    if(!blob){
      var r=await fetch(VOICE_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({agent:id, voiceId:AGENT_VOICES[id].voiceId, text:texte, format:VOICE_CONFIG.format})});
      if(!r.ok) throw new Error('voix '+r.status);
      blob=await r.blob();
      voixCompter('serveur', texte.length);
      try{ if(cache) await cache.put(cle, new Response(blob, {headers:{'Content-Type':'audio/'+VOICE_CONFIG.format}})); }catch(e){}
    }
    _voiceAudio=new Audio(URL.createObjectURL(blob));
    _voiceAudio.onended=function(){ voixFin(); };
    await _voiceAudio.play();
    return true;
  }catch(e){ voixFin(); toast('La voix de '+a.name+' ne répond pas pour l’instant.'); return false; }
}

/* ─────────── point d'entrée unique ─────────── */
function voixMoteur(id){
  if(voiceConfigured(id)) return 'serveur';
  if(voixNavDisponible()) return 'navigateur';
  return null;
}
var _voixBouton=null;
function voixFin(){ if(_voixBouton){ _voixBouton.classList.remove('playing'); _voixBouton=null; } }
function voiceStop(){
  try{ if(_voiceAudio){ _voiceAudio.pause(); _voiceAudio=null; } }catch(e){}
  try{ if(voixNavDisponible()) window.speechSynthesis.cancel(); }catch(e){}
  voixFin();
}
function speakAgent(id, text, opts){
  var a=byId(id); if(!a) return Promise.resolve(false);
  var texte=voixTexte(text); if(!texte) return Promise.resolve(false);
  var moteur=voixMoteur(id);
  if(!moteur){ toast('La voix de '+a.name+' arrive bientôt.'); return Promise.resolve(false); }
  if(moteur==='serveur' && voixPlafondAtteint()){ toast('Les voix sont au repos jusqu’au début du mois prochain.'); return Promise.resolve(false); }
  voiceStop();
  if(opts && opts.bouton){ _voixBouton=opts.bouton; _voixBouton.classList.add('playing'); }
  return moteur==='serveur' ? voixServeur(id, texte, opts) : voixNavigateur(id, texte, opts);
}
/* Bouton d'écoute : un appui lit, un second arrête. */
function voixBouton(btn, id, texte){
  if(btn.classList.contains('playing')){ voiceStop(); return; }
  speakAgent(id, texte, {bouton:btn});
}

/* ─────────── discussion : écoute à la demande, lecture automatique en option ─────────── */
(function(){
  var base=bubbleEl;
  if(typeof base!=='function') return;
  window.bubbleEl=function(role, content){
    var el=base.apply(this, arguments);
    try{
      var b=el.querySelector('.bubble-voice'), id=chatVoiceAgent();
      if(b && id){ b.onclick=function(ev){ ev.stopPropagation(); voixBouton(b, id, content); }; }
    }catch(e){}
    return el;
  };
})();
function voixLectureAuto(){ return state.voixAuto!=null ? !!state.voixAuto : VOICE_CONFIG.lectureAutoParDefaut; }
function toggleVoixAuto(){ state.voixAuto=!voixLectureAuto(); persist(); if(typeof renderProfile==='function') renderProfile(); }
/* Appelée après chaque réponse affichée (38-dossier-et-suivi.js). */
function voixApresReponse(texte){
  try{ if(voixLectureAuto()){ var id=chatVoiceAgent(); if(id) speakAgent(id, texte); } }catch(e){}
}

/* ─────────── profil : réglages de la voix (abonnés) ─────────── */
(function(){
  var base=renderProfile;
  if(typeof base!=='function') return;
  window.renderProfile=function(){
    var r=base.apply(this, arguments);
    try{
      if(state.tier==='free') return r;
      var body=document.getElementById('profile-body'); if(!body) return r;
      var titles=body.querySelectorAll('.block-title'), ancre=null;
      for(var i=0;i<titles.length;i++){ if(titles[i].textContent.trim()===t('yourPlan')){ ancre=titles[i]; break; } }
      if(!ancre) return r;
      var u=voixUsage();
      var moteur=voiceConfigured('mia') ? 'Voix définitives des accompagnants' : (voixNavDisponible() ? 'Voix provisoires de ton appareil, en attendant les voix définitives' : 'Les voix arrivent bientôt');
      var h='<div class="block-title">Voix</div><div class="block">'
        +'<div class="row-btn snd-row"><div class="rt"><div class="rl">Lire les réponses à voix haute</div><div class="rd">Les accompagnants dont tu as réveillé la voix te répondent aussi à l’oral.</div></div><span class="agx-tgl'+(voixLectureAuto()?' on':'')+'" onclick="toggleVoixAuto()"><span class="agx-knob"></span></span></div>'
        +'<div class="row-btn"><div class="rt"><div class="rl">'+escapeHtml(moteur)+'</div><div class="rd">Ce mois-ci : '+(u.serveur+u.navigateur).toLocaleString('fr-FR')+' caractères écoutés.</div></div></div></div>';
      ancre.insertAdjacentHTML('beforebegin', h);
    }catch(e){}
    return r;
  };
})();
