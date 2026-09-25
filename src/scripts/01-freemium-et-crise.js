/* ══════════ FREEMIUM : paywall + parcours d'upgrade ══════════
   Chantier 12 (abonnement unique) : les deux paliers payants fusionnent en un seul, à 60 €.
   'plus' reste la valeur interne de state.tier pour ce palier — pas de renommage — afin de ne
   pas casser les très nombreux tests qui utilisent déjà state.tier='plus' comme raccourci pour
   entrer dans un scénario abonné. 'maynd' reste une valeur historique acceptée en lecture par
   isUnlocked (dernière définition, 17-refonte-intelligence.js) : quelqu'un dont l'état persisté
   datait d'avant ce chantier ne perd rien. Seule la nouvelle interface n'écrit plus jamais 'maynd'. */
var _pwTier='plus', _upgrading=false;
function showPaywall(title, sub){
  var feats=['Les seize accompagnants + MIA','Voix et supervision incluses','Mémoire et personnalisation','700 messages par mois'];
  var tick='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  $('pw-badge').textContent='MAYND'; $('pw-badge').className='pw-badge';
  $('pw-title').textContent=title;
  $('pw-sub').textContent=sub;
  $('pw-feats').innerHTML=feats.map(function(f){return '<div class="pw-feat">'+tick+'<span>'+f+'</span></div>';}).join('');
  $('pw-price').innerHTML='<b>60&nbsp;€</b> <span>/ mois</span>';
  $('pw-cta').textContent='Passer à MAYND';
  _pwTier='plus';
  openSheet('paywall-backdrop','paywall-sheet');
}
function pwGo(){ closeSheet('paywall-backdrop','paywall-sheet'); startUpgrade(_pwTier); }
function pwFormules(){ closeSheet('paywall-backdrop','paywall-sheet'); openFormulesRaw(); }
function pickPlan(tier){ if(typeof closeFormules==='function') closeFormules(); startUpgrade(tier); }
function startUpgrade(tier){
  if(tier==='free'){ setTier('free'); return; }
  _payPlan='plus'; _upgrading=true; obFillPay();
  $('onboarding').classList.remove('done'); obShow('ob-payment'); payTab('card');
}
function payCancel(){ _upgrading=false; $('onboarding').classList.add('done'); }
function obPay(){
  if(_upgrading){
    _upgrading=false; setTier(_payPlan,true); state.paid=true; persist();
    $('onboarding').classList.add('done');
    toast('Bienvenue dans MAYND');
  } else { state.paid=true; persist(); obShow('ob-pay-success'); }
}
/* Trois motifs, trois traitements distincts (chantier 12) :
   - 'agent' : personne en gratuit, un accompagnant demande l'abonnement -> paywall 60 €.
   - 'limit' : personne en gratuit, plafond de 5 messages/jour atteint -> paywall 60 €.
   - 'mix' : déjà abonnée, mais le multi-accompagnants se gagne par la progression (le chantier
     des jeux n'existe pas encore) -> jamais de paywall (pas question de payer davantage), mais un
     message net avec un bouton qui débloque réellement (openMixSheet, 17-refonte-intelligence.js) :
     un toast discret laissait croire à un bug, y compris pour une personne déjà abonnée. */
function openUpsell(reason, id){
  if(reason==='mix'){ if(typeof openMixSheet==='function') openMixSheet(id); return; }
  var title='Débloque tout MAYND', sub='Passe à l’abonnement pour aller plus loin.';
  if(reason==='agent'){ title='Cet accompagnant fait partie de l’abonnement MAYND'; sub='Passe à MAYND pour accéder aux seize accompagnants et à ton suivi par un professionnel.'; }
  else if(reason==='limit'){ title='Tu as atteint ta limite du jour'; sub='En Freemium, tu as 5 messages par jour avec MIA. Passe à MAYND pour des échanges illimités.'; }
  showPaywall(title, sub);
}
function addParticipant(id, silent){
  var th=activeThread(); if(!th) return false;
  if(th.parts.includes(id)) return true;
  if(!isUnlocked(id)){ openUpsell('agent', id); return false; }
  if(th.parts.length>=1 && !canUseMulti()){ openUpsell('mix', id); return false; }
  if(th.parts.length>=3){ toast(t('max3')); return false; }
  th.parts.push(id); touchThread(); persist();
  if(!silent){ addNote(byId(id), byId(id).name+' '+t('joined')); }
  renderChatHeader(); renderPartsCount(); if(isOpen('parts-sheet')) renderParts();
  return true;
}
function startWithAgent(id){
  if(!isUnlocked(id)){ openUpsell('agent', id); return; }
  var th=[...state.threads].filter(function(x){return x.parts.length===1&&x.parts[0]===id;}).sort(function(a,b){return b.updated-a.updated;})[0];
  if(!th){ th=mkThread([id]); state.threads.push(th); }
  state.current=th.id; persist(); closeDrawer(); showTab('chat');
}
/* ══════════ Q1 : écran de redirection de crise (protocole v17) ══════════ */
function qzRenderCrisis(){
  var h=''
    +'<div class="qz2r-wrap">'
    +'<div class="qz2r-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>'
    +'<h1 class="qz2r-title">MAYND n’est pas adapté pour toi en ce moment</h1>'
    +'<p class="qz2r-text">Ce que tu traverses mérite un accompagnement médical spécialisé. Notre solution n’est pas la bonne réponse aujourd’hui, et nous tenons à être honnêtes avec toi.</p>'
    +'<div class="qz2r-label">Ressources d’urgence</div>'
    +'<a class="qz2r-res" href="tel:3114"><div class="qz2r-res-nm">3114 — Prévention du suicide</div><div class="qz2r-res-sub">Gratuit, anonyme, 24h/24</div></a>'
    +'<a class="qz2r-res" href="tel:0972394050"><div class="qz2r-res-nm">SOS Amitié — 09 72 39 40 50</div><div class="qz2r-res-sub">Écoute 24h/24, 7j/7</div></a>'
    +'<a class="qz2r-res" href="tel:15"><div class="qz2r-res-nm">15 — SAMU</div><div class="qz2r-res-sub">En cas d’urgence vitale</div></a>'
    +'<div class="qz2r-label">Trouver un professionnel</div>'
    +'<div class="qz2r-res"><div class="qz2r-res-nm">Doctolib — psychiatres et psychologues</div><div class="qz2r-res-sub">Prise de rendez-vous en ligne</div></div>'
    +'<div class="qz2r-res"><div class="qz2r-res-nm">Mon soutien psy</div><div class="qz2r-res-sub">Séances remboursées par l’Assurance Maladie</div></div>'
    +'<p class="qz2r-note">Tu peux quand même accéder à la version gratuite de MAYND.</p>'
    +'<button class="btn full" onclick="qzCrisisClose()">Accéder à la version gratuite</button>'
    +'</div>';
  $('quiz-inner').innerHTML=h; $('quiz').scrollTop=0;
}
