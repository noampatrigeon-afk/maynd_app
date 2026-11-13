/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — AUJOURD'HUI (13/11/2026)
   Une colonne, trois cartes au plus : comment ça va (en un geste, sans écran),
   ton pas, ton professionnel référent, et l'action principale : parler à MIA.
   Pas de série, pas de points, pas de défis : la régularité se lit dans le
   parcours, par le professionnel.
   ══════════════════════════════════════════════════════════════════════════ */

const HUMEURS=[['dur','😞','Difficile'],['bas','😕','Plutôt bas'],['moyen','😐','En demi-teinte'],['bien','🙂','Plutôt bien'],['top','😄','Au top']];
function humeurDuJour(){ const j=cleJour(); return etat.humeurs.find(function(x){ return x.jour===j; })||null; }
function salutation(){ const hr=new Date().getHours(); return hr<5 ? 'Bonne nuit' : hr<18 ? 'Bonjour' : 'Bonsoir'; }
function pasCarteHTML(){
  const p=pasDuMoment(); if(!p) return '';
  const a=AG[p.agent]||AG.mia;
  return '<div class="bloc carte-pas" style="--c:'+a.couleur+'"><span class="sur">Ton pas</span><p><strong>'+esc(p.texte)+'</strong></p>'
    +'<span class="quand">Proposé par '+esc(a.nom)+' · prévu '+esc(quandLib(p))+'</span>'
    +'<div class="actions">'+bouton('C’est fait', 'pas-fait', ' data-id="'+p.id+'"')+lienBouton('Pas encore', 'pas-encore', ' data-id="'+p.id+'"')+lienBouton('En parler', 'pas-parler', ' data-id="'+p.id+'"')+'</div></div>';
}
ONGLETS.aujourdhui=function(){
  const p=prenom(), hm=humeurDuJour(), now=new Date();
  const html='<div class="page">'
    +'<header class="tete"><div><div class="date">'+esc(JOURS_FR[now.getDay()]+' '+now.getDate()+' '+MOIS_FR[now.getMonth()])+'</div><h1>'+esc(salutation())+(p?', '+esc(p):'')+'.</h1></div>'
    +'<button class="b-rond" data-action="onglet" data-nom="toi" aria-label="Toi">'+esc((p||'M').charAt(0).toUpperCase())+'</button></header>'
    +'<div class="pile">'
    +'<div class="bloc"><span class="sur">Comment ça va, là, maintenant ?</span><div class="humeur">'+HUMEURS.map(function(x){ return '<button data-action="humeur" data-k="'+x[0]+'" class="'+(hm && hm.k===x[0]?'choisi':'')+'" aria-label="'+x[2]+'" aria-pressed="'+(hm && hm.k===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div>'
    +(hm ? '<p class="humeur-merci">Noté : '+esc(HUMEURS.find(function(x){ return x[0]===hm.k; })[2].toLowerCase())+'. MIA en tiendra compte.</p>' : '')+'</div>'
    +pasCarteHTML()
    +'<button class="mia-cta" data-action="onglet" data-nom="discussion">'+avatar('mia')+'<span><strong>Parler à MIA</strong><span class="sous">'+(etat.rep.cap ? 'Ton cap : '+esc(cite(etat.rep.cap)) : 'Ton co-pilote, là quand tu veux')+'</span></span><span class="fleche">›</span></button>'
    +(abonne() ? '' : '<p class="quota">MIA seule · '+pluriel(messagesRestants(), 'message restant', 'messages restants')+' aujourd’hui</p>')
    +proCarteHTML()
    +accesCarteHTML()
    +'</div><p class="petit" style="text-align:center;margin-top:24px;color:var(--gris)">Un espace à toi, confidentiel. '+VERSION_APP+'</p></div>';
  return {html:html};
};
ACTIONS.humeur=function(b){
  const j=cleJour(), k=b.dataset.k;
  const deja=humeurDuJour();
  if(deja) deja.k=k; else etat.humeurs.push({jour:j, k:k, at:Date.now()});
  if(etat.humeurs.length>120) etat.humeurs=etat.humeurs.slice(-120);
  garder(); rafraichirOnglet();
};
