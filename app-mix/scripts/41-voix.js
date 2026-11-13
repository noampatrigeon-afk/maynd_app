/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LA VOIX (13/11/2026)
   Repris de MAYND (36-voix-prete.js). Une fiche de voix par accompagnant, une
   doublure du navigateur réglée différemment pour chacun en attendant le
   fournisseur, un serveur avec cache audio, un décompte par mois.
   Finir le jeu d'un accompagnant réveille sa voix (40-jeux.js). Elle s'écoute
   sur sa fiche, et sous chacune de ses réponses dans la discussion. La lecture
   automatique est une option, désactivée par défaut. Pas de voix en gratuit.
   La conversation orale se fera en messages vocaux, jamais en appel.
   Pour brancher : VOICE_ENDPOINT (un serveur, jamais la clé du fournisseur
   dans le navigateur) et VOIX_CHOISIES (choix Cartesia en cours, docs/voix.md).
   ══════════════════════════════════════════════════════════════════════════ */

let VOICE_ENDPOINT=null;
const VOICE_CONFIG={format:'mp3', plafondCaracteresMois:null, cache:'maynd-voix-v1'};
const VOIX_FICHES={
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
/* Voix choisies par le porteur du projet chez Cartesia (choix en cours depuis le 13/11/2026, docs/voix.md). */
const VOIX_CHOISIES={
  mia:  {nom:'Inès', voiceId:'7c58f4a4-a72c-42fa-a503-41b9408820f3'},
  naoki:{nom:'Gerard', voiceId:'5deeaea9-c3cf-4288-82ec-22d8f04eb158'},
  felix:{nom:'Vincent', voiceId:'80e11491-2d8a-4361-ac61-c4f3e0a4f7e7'},
  ava:  {nom:'Solène', voiceId:null},
  leo:  {nom:'Friendly French Man', voiceId:'ab7c61f5-3daa-47dd-a23b-4ac0aac5f5c3'}
};
function voixConfiguree(id){ return !!(VOICE_ENDPOINT && VOIX_CHOISIES[id] && VOIX_CHOISIES[id].voiceId); }
/* Une voix se réveille avec son accompagnant, jamais en gratuit. MIA a toujours la sienne. */
function voixReveillee(id){ return abonne() && (id==='mia' || etat.voix.reveillees.indexOf(id)>=0); }
function voixEchantillon(id){ const i=AGENT_INFO[id]; return i && i.tag ? i.tag : APPORTS[id] || ''; }

/* ─────────── usage ─────────── */
function voixUsage(){
  let u=etat.voix.usage;
  if(!u || u.mois!==cleMois()) u=etat.voix.usage={mois:cleMois(), serveur:0, navigateur:0};
  return u;
}
function voixCompter(moteur, n){ const u=voixUsage(); u[moteur]=(u[moteur]||0)+n; garder(); }
function voixPlafondAtteint(){ const p=VOICE_CONFIG.plafondCaracteresMois; return !!(p && voixUsage().serveur>=p); }
function voixTexte(s){ return String(s||'').replace(/\[\[[^\]]*\]\]?/g, ' ').replace(/[*_#>`~]/g, ' ').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim(); }

/* ─────────── la doublure du navigateur ─────────── */
function voixNavDisponible(){ return typeof window!=='undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance==='function'; }
const VOIX_NOMS_F=/(denise|eloise|éloise|julie|hortense|amelie|amélie|audrey|aurelie|aurélie|marie|celine|céline|léa|chantal|virginie|sylvie|caroline|brigitte|yvette|coralie|charline|jacqueline|joséphine|josephine|vivienne|female|femme)/i;
const VOIX_NOMS_M=/(henri|paul|thomas|claude|nicolas|daniel|jean|alain|antoine|rémy|remy|guillaume|gérard|gerard|maurice|fabrice|jérôme|jerome|yves|alexandre|male|homme)/i;
function voixNavChoisir(id){
  let toutes=[]; try{ toutes=window.speechSynthesis.getVoices()||[]; }catch(_){}
  let fr=toutes.filter(function(v){ return /^fr([-_]|$)/i.test(v.lang||''); });
  if(!fr.length) return null;
  const locales=fr.filter(function(v){ return v.localService; }); if(locales.length) fr=locales;
  const f=agentFem(id);
  let cands=fr.filter(function(v){ return (f?VOIX_NOMS_F:VOIX_NOMS_M).test(v.name||''); }); if(!cands.length) cands=fr;
  const rang=ACCOMPAGNANTS.filter(function(a){ return agentFem(a.id)===f; }).map(function(a){ return a.id; }).indexOf(id);
  return cands[(rang<0?0:rang)%cands.length];
}
let voixBoutonActif=null, voixAudio=null;
function voixFin(){ if(voixBoutonActif){ voixBoutonActif.classList.remove('playing'); voixBoutonActif=null; } }
function voixArreter(){
  try{ if(voixAudio){ voixAudio.pause(); voixAudio=null; } }catch(_){}
  try{ if(voixNavDisponible()) window.speechSynthesis.cancel(); }catch(_){}
  voixFin();
}
function voixNavigateur(id, texte){
  try{
    const u=new window.SpeechSynthesisUtterance(texte), v=voixNavChoisir(id);
    if(v) u.voice=v; u.lang=(v && v.lang) || 'fr-FR';
    const d=(VOIX_FICHES[id] && VOIX_FICHES[id].doublure) || {hauteur:1, debit:1};
    u.pitch=d.hauteur; u.rate=d.debit; u.onend=voixFin; u.onerror=voixFin;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    voixCompter('navigateur', texte.length);
    return true;
  }catch(_){ return false; }
}

/* ─────────── le serveur, derrière VOICE_ENDPOINT ─────────── */
function voixEmpreinte(s){ let hh=5381; for(let i=0;i<s.length;i++){ hh=((hh<<5)+hh+s.charCodeAt(i))|0; } return (hh>>>0).toString(36); }
async function voixServeur(id, texte){
  const cle=String(VOICE_ENDPOINT).replace(/\/$/, '')+'/cache/'+encodeURIComponent(id)+'/'+encodeURIComponent(VOIX_CHOISIES[id].voiceId)+'/'+voixEmpreinte(texte)+'.'+VOICE_CONFIG.format;
  let blob=null, cache=null;
  try{ if(window.caches){ cache=await window.caches.open(VOICE_CONFIG.cache); const hit=await cache.match(cle); if(hit) blob=await hit.blob(); } }catch(_){ cache=null; }
  try{
    if(!blob){
      const r=await fetch(VOICE_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({agent:id, voiceId:VOIX_CHOISIES[id].voiceId, text:texte, format:VOICE_CONFIG.format})});
      if(!r.ok) throw new Error('voix '+r.status);
      blob=await r.blob(); voixCompter('serveur', texte.length);
      try{ if(cache) await cache.put(cle, new Response(blob, {headers:{'Content-Type':'audio/'+VOICE_CONFIG.format}})); }catch(_){}
    }
    voixAudio=new Audio(URL.createObjectURL(blob)); voixAudio.onended=voixFin;
    await voixAudio.play();
    return true;
  }catch(_){ voixFin(); toast('La voix de '+AG[id].nom+' ne répond pas pour l’instant.'); return false; }
}

/* ─────────── point d'entrée ─────────── */
function parler(id, texte, bouton){
  const a=AG[id]; if(!a) return;
  const t=voixTexte(texte); if(!t) return;
  if(!voixReveillee(id)){ toast('La voix de '+a.nom+' dort encore.'); return; }
  const moteur=voixConfiguree(id) ? 'serveur' : (voixNavDisponible() ? 'navigateur' : null);
  if(!moteur){ toast('La voix de '+a.nom+' arrive bientôt.'); return; }
  if(moteur==='serveur' && voixPlafondAtteint()){ toast('Les voix sont au repos jusqu’au début du mois prochain.'); return; }
  voixArreter();
  if(bouton){ voixBoutonActif=bouton; bouton.classList.add('playing'); }
  if(moteur==='serveur') voixServeur(id, t); else voixNavigateur(id, t);
}
function voixApresReponse(qui, texte){ try{ if(etat.voix.auto && voixReveillee(qui)) parler(qui, texte); }catch(_){} }
ACTIONS['voix-lire']=function(b){
  if(b.classList.contains('playing')){ voixArreter(); return; }
  const m=etat.fil[+b.dataset.i]; if(m && m.type==='agent') parler(m.qui, m.texte, b);
};
ACTIONS['voix-echantillon']=function(b){ parler(b.dataset.id, voixEchantillon(b.dataset.id), b); };
