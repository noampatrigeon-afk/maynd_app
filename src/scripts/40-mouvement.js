/* ═══ 40 — Mouvement : attente de la réponse ═══
   Une réponse du modèle peut prendre plusieurs secondes. Après 4 s, la bulle de frappe
   annonce que ça avance ; après 12 s, elle le redit autrement. Deux phrases, à la première
   personne (donc sans accord de genre à gérer), lues par les lecteurs d'écran.
   Redéfinit addTyping() et removeTyping() de 00-noyau.js (dernière définition = active). */
var MV_ATTENTE=[[4000,'Je prends le temps de bien te répondre.'],[12000,'Encore un instant, je reste avec toi.']];
var _mvTimers=[];
function mvStopAttente(){ _mvTimers.forEach(function(t){ clearTimeout(t); }); _mvTimers=[]; }
function addTyping(){
  mvStopAttente();
  const d=document.createElement('div'); d.className='typing'; d.setAttribute('role','status'); d.setAttribute('aria-live','polite');
  d.innerHTML='<i></i><i></i><i></i>';
  $('messages').appendChild(d); _typingEl=d; scrollChat();
  MV_ATTENTE.forEach(function(p){
    _mvTimers.push(setTimeout(function(){
      if(_typingEl!==d) return;
      let w=d.querySelector('.mv-wait');
      if(!w){ w=document.createElement('span'); w.className='mv-wait'; d.appendChild(w); d.classList.add('mv-long'); }
      w.textContent=p[1]; scrollChat();
    }, p[0]));
  });
}
function removeTyping(){ mvStopAttente(); if(_typingEl){ _typingEl.remove(); _typingEl=null; } }
