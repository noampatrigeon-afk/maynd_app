/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE COMPTE (13/11/2026)
   Décision du porteur du projet : le compte se crée à l'écran du profil, dont le
   résultat est flouté derrière « Crée ton compte pour voir ton résultat ». Pas de
   paiement à ce moment. Version courte : courriel et mot de passe ; le prénom est
   déjà connu. L'accès rapide (code à quatre chiffres) est proposé plus tard,
   depuis Aujourd'hui, à partir du deuxième lancement.
   Prototype : le mot de passe n'est jamais gardé, seule son empreinte (SHA-256)
   l'est, sur l'appareil. Le serveur prévu (docs/serveur.md) reprendra ce contrat.
   ══════════════════════════════════════════════════════════════════════════ */

function courrielValide(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s||'').trim()); }
async function empreinte(s){
  try{
    if(window.crypto && crypto.subtle && window.TextEncoder){
      const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode('maynd:'+s));
      return Array.prototype.map.call(new Uint8Array(buf), function(b){ return b.toString(16).padStart(2, '0'); }).join('');
    }
  }catch(_){}
  let hh=5381; for(let i=0;i<s.length;i++){ hh=((hh<<5)+hh+s.charCodeAt(i))|0; } return 'h'+(hh>>>0).toString(36);
}
function compteFormulaireHTML(){
  const p=prenom();
  return '<div class="compte-voile"><form class="compte-form" id="compte-form" autocomplete="on">'
    +'<p class="sur">Ton résultat est prêt</p>'
    +'<h2>'+(p?esc(p)+', crée' : 'Crée')+' ton compte pour voir ton résultat.</h2>'
    +'<p class="petit">Gratuit. Ton parcours reste à toi, et tu le retrouves sur tous tes appareils quand MAYND sera en ligne.</p>'
    +'<label class="etiquette" for="c-courriel">Ton courriel</label>'
    +'<input class="champ" id="c-courriel" type="email" inputmode="email" autocomplete="email" placeholder="prenom@exemple.fr" required>'
    +'<label class="etiquette" for="c-mdp">Un mot de passe</label>'
    +'<input class="champ" id="c-mdp" type="password" autocomplete="new-password" minlength="8" placeholder="8 caractères au moins" required>'
    +'<p class="erreur-champ" id="c-erreur" aria-live="polite"></p>'
    +'<button class="btn" type="submit" id="c-creer" disabled>Voir mon résultat</button>'
    +'<p class="petit">En continuant, tu acceptes que MAYND garde tes réponses pour t’accompagner. Tu peux tout effacer quand tu veux.</p>'
    +'</form></div>';
}
function brancherCompte(){
  const f=document.getElementById('compte-form'); if(!f) return;
  const c=document.getElementById('c-courriel'), m=document.getElementById('c-mdp'), b=document.getElementById('c-creer'), err=document.getElementById('c-erreur');
  function verifier(){ b.disabled=!(courrielValide(c.value) && m.value.length>=8); err.textContent=''; }
  c.addEventListener('input', verifier); m.addEventListener('input', verifier);
  f.addEventListener('submit', async function(ev){
    ev.preventDefault();
    if(!courrielValide(c.value)){ err.textContent='Ce courriel ne semble pas complet.'; return; }
    if(m.value.length<8){ err.textContent='8 caractères au moins.'; return; }
    b.disabled=true; b.textContent='Un instant…';
    etat.compte={courriel:c.value.trim(), empreinte:await empreinte(m.value), cree:Date.now(), acces:'', accesPlusTard:false};
    garder();
    /* Le voile se lève lentement, puis le bouton Continuer apparaît. */
    const voile=document.querySelector('.compte-voile'), carte=document.getElementById('profil-carte'), centre=document.querySelector('.centre.profil');
    if(voile) voile.classList.add('leve');
    setTimeout(function(){
      if(centre) centre.classList.remove('voile');
      if(carte){ carte.setAttribute('aria-hidden', 'false'); carte.insertAdjacentHTML('beforeend', bouton('Continuer', 'suivant')); }
      if(voile && voile.parentNode) voile.parentNode.removeChild(voile);
      toast('Ton compte est créé.');
    }, DUREE ? 700 : 0);
  });
  if(window.matchMedia && window.matchMedia('(pointer:fine)').matches) c.focus();
}

/* ─────────── l'accès rapide, proposé plus tard ─────────── */
function accesCarteHTML(){
  if(!compteCree() || etat.compte.acces || etat.compte.accesPlusTard || (etat.lancements||0)<2) return '';
  return '<div class="carte carte-acces"><span class="sur">Ton accès</span><p>Un code à quatre chiffres, pour que tes échanges restent à toi.</p>'
    +'<div class="actions">'+bouton('Choisir un code', 'acces-choisir')+lienBouton('Plus tard', 'acces-plus-tard')+'</div></div>';
}
ACTIONS['acces-plus-tard']=function(){ etat.compte.accesPlusTard=true; garder(); rafraichirOnglet(); };
ACTIONS['acces-choisir']=function(){
  ouvrir('<h2>Ton code d’accès</h2><p class="petit">Quatre chiffres. Il te sera demandé à l’ouverture de MAYND sur cet appareil.</p>'
    +'<input class="champ code" id="acces-code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Code à quatre chiffres">'
    +'<div class="actions">'+bouton('Enregistrer', 'acces-enregistrer')+'</div>');
  setTimeout(function(){ const i=document.getElementById('acces-code'); if(i) i.focus(); }, 50);
};
ACTIONS['acces-enregistrer']=async function(){
  const i=document.getElementById('acces-code'), v=String(i && i.value || '');
  if(!/^\d{4}$/.test(v)){ toast('Quatre chiffres, s’il te plaît.'); return; }
  etat.compte.acces=await empreinte('code:'+v); garder(); fermer(); toast('Ton accès est sécurisé.'); rafraichirOnglet();
};
