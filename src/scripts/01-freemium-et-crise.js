/* ══════════ FREEMIUM : paywall + parcours d'upgrade ══════════ */
var _pwTier='plus', _upgrading=false;
function showPaywall(tierKey, title, sub){
  var isPlus=tierKey==='plus';
  var name=isPlus?'MAYND+':'MAYND';
  var price=isPlus?'69':'49';
  var feats=isPlus?['15 accompagnants + MIA','Plusieurs accompagnants ensemble (jusqu\u2019à 3)','Voix et supervision incluses','Volume d\u2019échanges étendu']
                  :['10 accompagnants + MIA','Voix incluse','Supervision par un professionnel','Mémoire et personnalisation'];
  var tick='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  $('pw-badge').textContent=name; $('pw-badge').className='pw-badge'+(isPlus?' plus':'');
  $('pw-title').textContent=title;
  $('pw-sub').textContent=sub;
  $('pw-feats').innerHTML=feats.map(function(f){return '<div class="pw-feat">'+tick+'<span>'+f+'</span></div>';}).join('');
  $('pw-price').innerHTML='<b>'+price+'&nbsp;€</b> <span>/ mois</span>';
  $('pw-cta').textContent='Passer à '+name;
  _pwTier=tierKey;
  openSheet('paywall-backdrop','paywall-sheet');
}
function pwGo(){ closeSheet('paywall-backdrop','paywall-sheet'); startUpgrade(_pwTier); }
function pwFormules(){ closeSheet('paywall-backdrop','paywall-sheet'); openFormulesRaw(); }
function pickPlan(tier){ if(typeof closeFormules==='function') closeFormules(); startUpgrade(tier); }
function startUpgrade(tier){
  if(tier==='free'){ setTier('free'); return; }
  _payPlan=tier; _upgrading=true; obFillPay();
  $('onboarding').classList.remove('done'); obShow('ob-payment'); payTab('card');
}
function payCancel(){ _upgrading=false; $('onboarding').classList.add('done'); }
function obPay(){
  if(_upgrading){
    _upgrading=false; setTier(_payPlan,true); state.paid=true; persist();
    $('onboarding').classList.add('done');
    toast(_payPlan==='plus'?'Bienvenue dans MAYND+':'Bienvenue dans MAYND');
  } else { state.paid=true; persist(); obShow('ob-pay-success'); }
}
function openUpsell(reason, id){
  var tierKey='maynd', title='Débloque tout MAYND', sub='Choisis une formule pour aller plus loin.';
  if(reason==='agent'){
    var a=id?byId(id):null;
    if(a && a.plus){ tierKey='plus'; title='Cet accompagnant fait partie de MAYND+'; sub='Passe à MAYND+ pour débloquer les 15 accompagnants et le multi-accompagnants.'; }
    else { tierKey='maynd'; title='Cet accompagnant est réservé aux abonnés'; sub='Passe à MAYND pour accéder aux accompagnants et à ton suivi par un professionnel.'; }
  } else if(reason==='mix'){ tierKey='plus'; title='Le multi-accompagnants est réservé à MAYND+'; sub='Réunis jusqu\u2019à 3 accompagnants dans une même conversation avec MAYND+.'; }
  else if(reason==='limit'){ tierKey='maynd'; title='Tu as atteint ta limite du jour'; sub='En Freemium, tu as 5 messages par jour avec MIA. Passe à MAYND pour des échanges illimités.'; }
  showPaywall(tierKey, title, sub);
}
function addParticipant(id, silent){
  var th=activeThread(); if(!th) return false;
  if(th.parts.includes(id)) return true;
  if(!isUnlocked(id)){ openUpsell(state.tier==='free'?'agent':'mix', id); return false; }
  if(th.parts.length>=3){ toast(t('max3')); return false; }
  th.parts.push(id); touchThread(); persist();
  if(!silent){ addNote(byId(id), byId(id).name+' '+t('joined')); }
  renderChatHeader(); renderPartsCount(); if(isOpen('parts-sheet')) renderParts();
  return true;
}
function startWithAgent(id){
  if(!isUnlocked(id)){ openUpsell(state.tier==='free'?'agent':'mix', id); return; }
  var th=[...state.threads].filter(function(x){return x.parts.length===1&&x.parts[0]===id;}).sort(function(a,b){return b.updated-a.updated;})[0];
  if(!th){ th=mkThread([id]); state.threads.push(th); }
  state.current=th.id; persist(); closeDrawer(); showTab('chat');
}
/* ══════════ Q1 : écran de redirection de crise (protocole v17) ══════════ */
function qzRenderCrisis(){
  var h=''
    +'<div class="qz2r-wrap">'
    +'<div class="qz2r-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>'
    +'<h1 class="qz2r-title">MAYND n\u2019est pas adapté pour toi en ce moment</h1>'
    +'<p class="qz2r-text">Ce que tu traverses mérite un accompagnement médical spécialisé. Notre solution n\u2019est pas la bonne réponse aujourd\u2019hui, et nous tenons à être honnêtes avec toi.</p>'
    +'<div class="qz2r-label">Ressources d\u2019urgence</div>'
    +'<a class="qz2r-res" href="tel:3114"><div class="qz2r-res-nm">3114 — Prévention du suicide</div><div class="qz2r-res-sub">Gratuit, anonyme, 24h/24</div></a>'
    +'<a class="qz2r-res" href="tel:0972394050"><div class="qz2r-res-nm">SOS Amitié — 09 72 39 40 50</div><div class="qz2r-res-sub">Écoute 24h/24, 7j/7</div></a>'
    +'<a class="qz2r-res" href="tel:15"><div class="qz2r-res-nm">15 — SAMU</div><div class="qz2r-res-sub">En cas d\u2019urgence vitale</div></a>'
    +'<div class="qz2r-label">Trouver un professionnel</div>'
    +'<div class="qz2r-res"><div class="qz2r-res-nm">Doctolib — psychiatres et psychologues</div><div class="qz2r-res-sub">Prise de rendez-vous en ligne</div></div>'
    +'<div class="qz2r-res"><div class="qz2r-res-nm">Mon soutien psy</div><div class="qz2r-res-sub">Séances remboursées par l\u2019Assurance Maladie</div></div>'
    +'<p class="qz2r-note">Tu peux quand même accéder à la version gratuite de MAYND.</p>'
    +'<button class="btn full" onclick="qzCrisisClose()">Accéder à la version gratuite</button>'
    +'</div>';
  $('quiz-inner').innerHTML=h; $('quiz').scrollTop=0;
}



