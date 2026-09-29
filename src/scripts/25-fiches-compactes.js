/* ══════════════════════════════════════════════════════════════════════════
   FICHES DES ACCOMPAGNANTS SUR UN SEUL ÉCRAN — demande du 29/09/2026 : plus
   jamais de défilement vertical dans la présentation, quelle que soit la
   longueur du texte ou la taille du téléphone.

   Deux étages :
   1. Mise en page resserrée (CSS 17-fiches-compactes.css) : l'initiale passe à
      gauche du prénom (bloc .deck-head construit ici), « Ajouter en favori » et
      « Rejouer » se partagent une ligne (.deck-actions2), textes resserrés.
   2. Ajustement automatique (deckFit) : si une fiche dépasse encore la hauteur
      de l'écran, toutes ses tailles (variable CSS --k) baissent par pas de 4 %
      jusqu'à ce qu'elle tienne, sans descendre sous 0,6. Recalculé à l'ouverture, au redimensionnement,
      et quand le contenu change (favori, second accompagnant proposé).
   ══════════════════════════════════════════════════════════════════════════ */

function deckCompactPage(page){
  var inner=page.querySelector('.deck-inner'); if(!inner || inner.querySelector('.deck-head')) return;
  var top=inner.querySelector('.deck-top'), name=inner.querySelector('.deck-name'),
      dom=inner.querySelector('.deck-dom'), acc=inner.querySelector('.deck-acc');
  if(!top || !name) return;
  var head=document.createElement('div'); head.className='deck-head';
  var tx=document.createElement('div'); tx.className='deck-head-tx';
  inner.insertBefore(head, top);
  head.appendChild(top); head.appendChild(tx);
  [name, dom, acc].forEach(function(el){ if(el) tx.appendChild(el); });
  var fav=inner.querySelector('.deck-fav[data-fav]'), rep=inner.querySelector('.deck-replay');
  if(fav || rep){
    var row=document.createElement('div'); row.className='deck-actions2'+(fav&&rep?' two':'');
    (fav||rep).parentNode.insertBefore(row, fav||rep);
    if(fav) row.appendChild(fav);
    if(rep) row.appendChild(rep);
  }
}
function deckFitPage(page){
  var inner=page.querySelector('.deck-inner'); if(!inner) return;
  var k=1;
  inner.style.setProperty('--k', k);
  if(!page.clientHeight) return;
  var need=page.scrollHeight;
  while(need>page.clientHeight+1 && k>0.6){
    k=Math.round((k-0.04)*100)/100;
    inner.style.setProperty('--k', k);
    var now=page.scrollHeight;
    /* sécurité : si la réduction ne fait rien baisser (mise en page pas encore calculée),
       on garde la taille normale plutôt que de tout rétrécir pour rien */
    if(now>=need){ inner.style.setProperty('--k', 1); return; }
    need=now;
  }
}
function deckFit(){
  var pages=document.querySelectorAll('#deck-track .deck-page');
  for(var i=0;i<pages.length;i++){ deckCompactPage(pages[i]); deckFitPage(pages[i]); }
}
(function(){
  var base=openAgentDeck;
  if(typeof base!=='function') return;
  window.openAgentDeck=function(){
    var r=base.apply(this, arguments);
    try{ deckFit(); }catch(e){}
    /* recalculs de sécurité : premier rendu, puis polices encore en chargement au premier
       lancement (un calcul fait trop tôt réduit plus que nécessaire, deckFitPage repart de 1) */
    [60, 350, 1200].forEach(function(ms){ setTimeout(function(){ try{ if($('deck').classList.contains('show')) deckFit(); }catch(e){} }, ms); });
    return r;
  };
})();
(function(){
  var base=deckFav;
  if(typeof base!=='function') return;
  window.deckFav=function(id){
    var r=base.apply(this, arguments);
    try{ var p=document.querySelector('#deck-track .deck-page[data-id="'+id+'"]'); if(p) deckFitPage(p); }catch(e){}
    return r;
  };
})();
(function(){
  var base=deckAddSecond;
  if(typeof base!=='function') return;
  window.deckAddSecond=function(target){
    var r=base.apply(this, arguments);
    try{ var p=document.querySelector('#deck-track .deck-page[data-id="'+target+'"]'); if(p) deckFitPage(p); }catch(e){}
    return r;
  };
})();
/* Les polices (Poppins, DM Sans) peuvent finir de charger après l'ouverture et élargir le
   texte : on recalcule quand elles sont prêtes, et à chaque changement de fiche. */
function deckRefitIfOpen(){ try{ if($('deck') && $('deck').classList.contains('show')) deckFit(); }catch(e){} }
try{ if(document.fonts){ document.fonts.ready.then(deckRefitIfOpen); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', deckRefitIfOpen); } }catch(e){}
/* deckSync est appelée à chaque évènement de défilement horizontal : on ne recalcule la
   fiche qu'au changement de fiche, et dans les deux sens (un calcul fait trop tôt, avant que
   la mise en page soit stable, a pu trop réduire). */
var _deckFitIdx=-1;
(function(){
  var base=deckSync;
  if(typeof base!=='function') return;
  window.deckSync=function(i){
    var r=base.apply(this, arguments);
    try{
      if(i==null) i=deckIndex();
      if(i!==_deckFitIdx){ _deckFitIdx=i; var p=document.querySelectorAll('#deck-track .deck-page')[i]; if(p) deckFitPage(p); }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=closeDeck;
  if(typeof base!=='function') return;
  window.closeDeck=function(){ _deckFitIdx=-1; return base.apply(this, arguments); };
})();
window.addEventListener('resize', function(){ try{ if($('deck') && $('deck').classList.contains('show')) deckFit(); }catch(e){} });
