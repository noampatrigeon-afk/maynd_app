/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE PROFESSIONNEL RÉFÉRENT (13/11/2026)
   Décision du porteur du projet : l'accompagnement humain doit être visible.
   - Une carte sur Aujourd'hui : qui il est, ce qu'il a lu, son dernier mot.
   - Il écrit dans la discussion, sur signal seulement (stagnation, blocage,
     désalignement, progression à consolider) : fond vert, badge certifié.
   - Il signe la feuille de route en début de mois et le bilan en fin de mois.
   Jamais de rendez-vous. Libellé exact : « professionnel référent certifié ».
   « Ton professionnel référent » tant qu'aucun nom n'est renseigné.
   Prototype : ses messages sont rédigés par le modèle avec une consigne dédiée,
   marqués pro:true. Les réglages (section Démonstration) le disent ; l'interface
   courante, jamais. Le serveur prévu (docs/serveur.md) donnera la main à un
   vrai professionnel : même format de message, même signaux.
   En gratuit, il n'y a pas de professionnel : aucun signal n'est posé.
   ══════════════════════════════════════════════════════════════════════════ */

const PRO_CONSIGNE=`Tu es le professionnel référent certifié de MAYND : un humain, pas une intelligence artificielle. Tu suis le parcours de cette personne, tu as lu son compte-rendu et ses échanges avec MIA et les accompagnants. Tu n'écris que lorsqu'un signal le justifie, et c'est le cas maintenant.
Ta manière : chaleureuse, sobre, directe. Deux à trois phrases, jamais plus. Tu tutoies. Tu dis ce que tu as vu, ce que tu proposes, et tu laisses la porte ouverte. Tu ne poses pas de rendez-vous : tu es là, tu lis, tu reviens quand c'est utile. Tu ne parles pas à la place de MIA ni des accompagnants. Tu n'es ni médecin ni soignant, et tu ne le laisses jamais entendre : aucun vocabulaire médical ou clinique, aucun diagnostic. Si ce qu'elle vit relève du soin, tu le dis simplement et tu l'invites à consulter un professionnel de santé. Aucune balise, aucune formule toute faite, aucun mot anglais.`;
const PRO_MOTIFS={
  stagnation:"Signal : stagnation. Rien ne bouge depuis plusieurs échanges malgré les pas proposés. Nomme-le sans reproche, propose de réduire la marche, et demande ce qui coince vraiment.",
  blocage:"Signal : blocage. Elle bute sur quelque chose qu'elle ne dépasse pas seule, ou ce qu'elle vit demande un regard humain. Dis que tu as lu, que tu es là, et ce que tu proposes de faire de ton côté.",
  desalignement:"Signal : désalignement. Ses actes s'éloignent de son cap. Rappelle son cap avec ses mots, sans juger, et demande si c'est toujours le bon.",
  progression:"Signal : progression à consolider. Un vrai progrès. Dis précisément ce que tu as vu, et propose comment l'ancrer, sans en rajouter."
};
const SIGNAL_FENETRE=7*86400000;

function poserSignal(type, source, urgent, preuve){
  if(!NOMS_SIGNAUX[type] || !abonne()) return;
  const now=Date.now();
  const deja=etat.signaux.find(function(s){ return s.type===type && now-s.at<SIGNAL_FENETRE; });
  if(deja){ deja.at=now; if(preuve) deja.preuve=String(preuve).slice(0, 220); garder(); return; }
  etat.signaux.push({type:type, at:now, source:source||'', preuve:String(preuve||'').slice(0, 220), repondu:false, urgent:!!urgent});
  if(etat.signaux.length>40) etat.signaux=etat.signaux.slice(-40);
  ajouterAuFil({type:'signal', signal:type});
  if(urgent) proRepondre(etat.signaux[etat.signaux.length-1]);
}
function signalEnAttente(){ return etat.signaux.find(function(s){ return !s.repondu; })||null; }
/* Après chaque réponse d'un accompagnant : si un signal attend, le professionnel écrit. */
function proApresReponse(){ const s=signalEnAttente(); if(s && !enCours) proRepondre(s); }
let proEnCours=false;
async function proRepondre(s){
  if(!s || s.repondu || proEnCours || !etat.cle || !abonne()) return;
  proEnCours=true;
  const tour='Consigne pour ce message :\n'+(PRO_MOTIFS[s.type]||'')+(s.preuve ? '\nCe qui a été lu : « '+s.preuve+' »' : '')
    +(etat.pro.nom ? '\nTu signes de ton prénom : '+etat.pro.nom+'.' : '\nTu ne signes pas : ton nom n’est pas encore renseigné.');
  try{
    const sys=[{type:'text', text:PRO_CONSIGNE, cache_control:{type:'ephemeral'}}, {type:'text', text:dossierTexte(), cache_control:{type:'ephemeral'}}, {type:'text', text:tour}];
    const res=await appeler(sys, messagesPour('pro', {}).concat([{role:'user', content:'(Le professionnel référent intervient sur signal.)'}]).filter(function(m, i, a){ return !(i>0 && m.role===a[i-1].role && m.role==='user' && i===a.length-1 && a[i-1].content.indexOf('(La personne attend')===0); }), 600);
    const texte=res.refus ? '' : lireBalises(res.texte).texte;
    if(texte){
      s.repondu=true; s.reponduLe=Date.now();
      etat.pro.lu=Date.now();
      etat.pro.messages.push({at:Date.now(), signal:s.type, texte:texte});
      if(etat.pro.messages.length>30) etat.pro.messages=etat.pro.messages.slice(-30);
      ajouterAuFil({type:'pro', texte:texte, signal:s.type});
    }
  }catch(_){}
  proEnCours=false;
}

/* ─────────── feuille de route et bilan ─────────── */
function moisLib(d){ return MOIS_FR[d.getMonth()]+' '+d.getFullYear(); }
function axesFeuille(){
  const out=[];
  if(etat.rep.cap) out.push({id:'mia', tx:'Garder le cap : '+cite(etat.rep.cap)+'.'});
  const venus=etat.presents.filter(function(x){ return x!=='mia'; }), pressentis=equipe().filter(function(x){ return venus.indexOf(x)<0; });
  venus.slice(0, 2).forEach(function(id){ out.push({id:id, tx:'Avancer avec '+AG[id].nom+' sur '+minus(AG[id].domaine)+'.'}); });
  pressentis.slice(0, Math.max(0, 3-out.length)).forEach(function(id){ out.push({id:id, tx:'Rencontrer '+AG[id].nom+', sur '+minus(AG[id].domaine)+'.'}); });
  if(!out.length) out.push({id:'mia', tx:'Poser un premier cap avec MIA.'});
  return out.slice(0, 3);
}
function feuilleDuMois(){
  const m=cleMois();
  let f=etat.pro.feuilles.find(function(x){ return x.mois===m; });
  if(!f){ f={mois:m, axes:axesFeuille(), signee:0}; etat.pro.feuilles.push(f); if(etat.pro.feuilles.length>12) etat.pro.feuilles=etat.pro.feuilles.slice(-12); garder(); }
  return f;
}
function bilanPrecedent(){
  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
  const m=cleMois(d);
  return etat.pro.bilans.find(function(x){ return x.mois===m; })||null;
}
function prochaineEcheance(){
  const now=new Date(), f=feuilleDuMois();
  if(!f.signee){ return 'Feuille de route de '+MOIS_FR[now.getMonth()]+' : en préparation.'; }
  const fin=new Date(now.getFullYear(), now.getMonth()+1, 0);
  return 'Bilan de '+MOIS_FR[now.getMonth()]+' : le '+fin.getDate()+' '+MOIS_FR[fin.getMonth()]+'.';
}
function proCarteHTML(){
  if(!abonne()){
    return '<div class="bloc carte-pro"><div class="qui"><span class="av pro">'+badgePro()+'</span><div><strong>Professionnel référent certifié</strong><span>Inclus dans MAYND</span></div></div>'
      +'<p>Un humain qui lit ton parcours, signe ta feuille de route et intervient quand un signal le justifie. Sans rendez-vous.</p>'
      +'<button class="lien" data-action="formule-ouvrir" data-raison="pro">Découvrir ma supervision</button></div>';
  }
  const dernier=etat.pro.messages[etat.pro.messages.length-1];
  const lu=etat.pro.lu ? 'A lu ton parcours '+dateLib(etat.pro.lu)+'.' : 'Lit ton parcours.';
  return '<div class="bloc carte-pro"><div class="qui"><span class="av pro">'+badgePro()+'</span><div><strong>'+esc(nomPro())+'</strong><span>Professionnel référent certifié · '+esc(lu)+'</span></div></div>'
    +(dernier ? '<div class="mot">« '+esc(dernier.texte.length>160 ? dernier.texte.slice(0, 157).trim()+'…' : dernier.texte)+' »</div>' : '<p>Il intervient dans ta discussion quand un signal le justifie. Sans rendez-vous.</p>')
    +'<div class="prochain">'+esc(prochaineEcheance())+'</div>'
    +'<button class="lien" data-action="pro-ouvrir">Ma feuille de route et mon bilan</button></div>';
}
function proPanneauHTML(){
  if(!abonne()) return '<h2>Ton professionnel référent</h2><p>Un professionnel référent certifié suit le parcours de chaque abonné MAYND. Il lit, il signe ta feuille de route et ton bilan, et il intervient dans ta discussion quand un signal le justifie. Sans rendez-vous.</p>'+bouton('Découvrir MAYND', 'formule-ouvrir', ' data-raison="pro"');
  const f=feuilleDuMois(), b=bilanPrecedent(), now=new Date();
  let hh='<div class="fiche-tete"><span class="av pro">'+badgePro()+'</span><div><strong>'+esc(nomPro())+'</strong><span>Professionnel référent certifié</span></div></div>'
    +'<p class="petit">Il lit ton parcours, ajuste ta feuille de route et t’écrit quand c’est utile. Tu n’as jamais de rendez-vous à prendre.</p>'
    +'<p class="titre-section">Feuille de route · '+esc(MOIS_FR[now.getMonth()])+'</p><div class="bloc">'
    +f.axes.map(function(a){ return '<p>'+avatar(a.id, 'petit')+' '+esc(a.tx)+'</p>'; }).join('')
    +(f.signee ? '<p class="petit">Signée le '+esc(dateCourte(f.signee))+' par '+esc(nomPro())+'.</p>' : '<p class="petit">En préparation. Elle part à la signature au début du mois.</p>')+'</div>';
  hh+='<p class="titre-section">Bilan · '+esc(MOIS_FR[(now.getMonth()+11)%12])+'</p><div class="bloc">'
    +(b ? '<p>'+esc(b.texte)+'</p><p class="petit">Relu et signé le '+esc(dateCourte(b.signee))+'.</p>' : '<p class="petit">Le bilan se fait en fin de mois, à partir de ton compte-rendu, de tes pas et de tes échanges. Ta boussole te sera proposée juste avant.</p>')+'</div>';
  hh+='<p class="titre-section">Signaux</p><div class="bloc">'
    +(etat.signaux.length ? etat.signaux.slice(-6).reverse().map(function(s){ return '<p><strong>'+esc(majus(NOMS_SIGNAUX[s.type]))+'</strong> · '+esc(dateLib(s.at))+(s.repondu ? ' · il t’a écrit' : ' · il te lit')+'</p>'; }).join('')
      : '<p class="petit">Aucun signal pour l’instant. Il intervient en cas de stagnation, de blocage, de désalignement, ou pour consolider une progression.</p>')+'</div>';
  if(etat.pro.messages.length) hh+='<p class="titre-section">Ses messages</p><div class="pile">'+etat.pro.messages.slice(-5).reverse().map(function(m){ return '<div class="bloc carte-pro"><span class="sur">'+esc(dateLib(m.at))+'</span><p>'+esc(m.texte)+'</p></div>'; }).join('')+'</div>';
  return hh;
}
ACTIONS['pro-ouvrir']=function(){ ouvrir(proPanneauHTML()); };

/* ─────────── démonstration : signer en tant que professionnel ─────────── */
ACTIONS['demo-signer-feuille']=function(){ const f=feuilleDuMois(); f.signee=Date.now(); etat.pro.lu=Date.now(); garder(); toast('Feuille de route signée.'); rafraichirOnglet(); };
ACTIONS['demo-signer-bilan']=function(){
  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
  const m=cleMois(d); if(etat.pro.bilans.some(function(x){ return x.mois===m; })) return;
  const pas=dossierObj().pas, faits=pas.filter(function(p){ return p.statut==='fait'; }).length;
  const texte='Profil '+profil().nom+'. Cap : « '+cite(etat.rep.cap||'à poser')+' ». '+pluriel(pas.length, 'pas posé', 'pas posés')+', '+pluriel(faits, 'fait', 'faits')+'. '
    +(etat.presents.length>1 ? 'Accompagnants rencontrés : '+etat.presents.filter(function(x){ return x!=='mia'; }).map(function(x){ return AG[x].nom; }).join(', ')+'.' : 'Pas encore d’accompagnant rencontré.');
  etat.pro.bilans.push({mois:m, texte:texte, signee:Date.now()}); etat.pro.lu=Date.now(); garder(); toast('Bilan signé.'); rafraichirOnglet();
};
ACTIONS['demo-pro-nom']=function(){ const i=document.getElementById('demo-pro-nom'); etat.pro.nom=String(i && i.value || '').trim().slice(0, 40); garder(); toast(etat.pro.nom ? 'Nom enregistré.' : 'Nom retiré.'); };
