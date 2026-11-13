/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — SÉCURITÉ (13/11/2026)
   Repris de MAYND (35-securite-et-confiance.js). Repérage du risque dans chaque
   message, en local, sans appel réseau ; carte de prévention (3114, SOS Amitié,
   15) ; pour un abonné, alerte réelle au professionnel sous la forme du signal
   « blocage ». En gratuit : la carte seule, jamais d'écran de formule.
   ══════════════════════════════════════════════════════════════════════════ */

/* Niveau 3 : projet, moyen, moment choisi, geste en cours. */
const RISQUE_3=[
  /\bje vais (me tuer|me suicider|en finir|me jeter|sauter|passer a l'acte)\b/,
  /\b(me tuer|me suicider|en finir|passer a l'acte|me jeter)\b.{0,40}\b(ce soir|cette nuit|aujourd'hui|maintenant|tout de suite|demain)\b/,
  /\b(ce soir|cette nuit|aujourd'hui|maintenant|demain)\b.{0,40}\b(me tuer|me suicider|en finir|passer a l'acte)\b/,
  /\bj'ai (prevu|prepare|achete|garde|stocke|mis de cote)\b.{0,40}\b(medicaments|cachets|pilules|comprimes|corde|arme|lame)\b/,
  /\bj'ai (pris|avale)\b.{0,30}\b(tous? mes|toute? la|une boite|des boites|trop de)\b.{0,20}\b(medicaments|cachets|pilules|comprimes)\b/,
  /\b(lettre d'adieu|mes adieux|je vous dis adieu)\b/
];
/* Niveau 2 : idée de mort ou de se faire du mal, même vague. */
const RISQUE_2=[
  /\bsuicid/,
  /\b(me tuer|me foutre en l'air|me supprimer|en finir avec (la vie|tout|moi))\b/,
  /\bmettre fin a (mes jours|ma vie)\b/,
  /\b(envie|besoin) de mourir\b/, /\b(veux|voudrais|aimerais|prefererais) mourir\b/,
  /\bplus (envie|la force) de vivre\b/, /\bpas envie de vivre\b/,
  /\b(si je n'etais plus la|si je n'existais plus|plus etre la|disparaitre pour (toujours|de bon))\b/,
  /\bne (plus|jamais) me reveiller\b/,
  /\bme faire du mal\b/, /\bme (scarifier|mutiler|couper les veines)\b/, /\bje me (scarifie|mutile)\b/
];
const FENETRE_CRISE=30*60000;
function risqueLocal(texte){
  const t=normaliser(texte); if(!t) return 0;
  if(RISQUE_3.some(function(re){ return re.test(t); })) return 3;
  if(RISQUE_2.some(function(re){ return re.test(t); })) return 2;
  return 0;
}
function telLien(num, nom, sous){ return '<a class="tel" href="tel:'+num.replace(/\s/g, '')+'"><strong>'+nom+'</strong><span>'+sous+'</span></a>'; }
function carteCriseHTML(m){
  return '<div class="carte carte-crise"><strong>Tu n’as pas à porter ça sans aide.</strong>'
    +'<p>Si tu penses à te faire du mal, ou si tu es en danger, appelle maintenant. Quelqu’un répond, jour et nuit.</p>'
    +telLien('3114', '3114', 'Prévention du suicide · gratuit, 24 h/24')
    +telLien('09 72 39 40 50', 'SOS Amitié · 09 72 39 40 50', 'Écoute, 24 h/24, 7 j/7')
    +telLien('15', '15 · SAMU', 'Si le danger est immédiat')
    +(m && m.abonne ? '<p class="petit">Ton professionnel référent a été prévenu. Il te lira sans rendez-vous. Pour tout de suite, ces numéros répondent.</p>' : '')
    +'</div>';
}
/* Une carte par fenêtre de 30 minutes ; une alerte au professionnel seulement pour un abonné. */
function declencherCrise(niveau, citation, source){
  const now=Date.now();
  if(abonne() && !etat.alertes.some(function(a){ return now-a.at<FENETRE_CRISE; })){
    etat.alertes.push({at:now, niveau:niveau||2, citation:String(citation||'').slice(0,220), source:source||'local'});
    if(etat.alertes.length>50) etat.alertes=etat.alertes.slice(-50);
    if(typeof poserSignal==='function') poserSignal('blocage', 'sécurité', true);
  }
  const recente=etat.fil.some(function(m){ return m.type==='crise' && now-m.at<FENETRE_CRISE; });
  if(!recente && typeof ajouterAuFil==='function') ajouterAuFil({type:'crise', abonne:abonne()});
  garder();
}
