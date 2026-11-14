/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LA DISCUSSION (13/11/2026)
   Une seule discussion : MIA répond en premier et fait venir les accompagnants
   ([[INVITE:id]]) ; chacun garde sa pastille en haut, et on peut s'adresser à
   l'un ou à l'autre. Le professionnel référent y écrit sur signal
   (34-professionnel.js). Balises : CHOIX, ACTE, SIGNAL, JEU, CRISE.
   Gratuit : MIA seule, cinq messages par jour ; le premier accompagnant ou le
   sixième message ouvre la formule MAYND (60 € par mois, paiement simulé).
   ══════════════════════════════════════════════════════════════════════════ */

let enCours=false, ecrit=null, retourDemande=false;

/* ─────────── quota ─────────── */
function quotaJour(){ const q=etat.quota, j=cleJour(); if(q.jour!==j){ q.jour=j; q.n=0; } return q; }
function quotaMois(){ const q=etat.quota, m=cleMois(); if(q.mois!==m){ q.mois=m; q.nMois=0; } return q; }
function messagesRestants(){ return abonne() ? Math.max(0, QUOTA_MAYND_MOIS-quotaMois().nMois) : Math.max(0, QUOTA_GRATUIT_JOUR-quotaJour().n); }
function compterReponse(){ quotaJour().n++; quotaMois().nMois++; garder(); }

/* ─────────── le fil ─────────── */
function ajouterAuFil(m){ m.at=m.at||Date.now(); etat.fil.push(m); if(etat.fil.length>400) etat.fil=etat.fil.slice(-400); garder(); rendreFil(); return m; }
function rendrePresents(){
  const el=document.getElementById('presents'); if(!el) return;
  el.innerHTML=etat.presents.map(function(id){
    const a=AG[id], on=etat.actif===id;
    return '<button class="present'+(on?' actif':'')+'" data-action="parler-a" data-id="'+id+'" aria-pressed="'+on+'">'+avatar(id, 'petit')+'<span>'+esc(a.nom)+'</span></button>';
  }).join('');
  const ta=document.getElementById('message'); if(ta) ta.placeholder='Écris à '+AG[etat.actif].nom+'…';
}
function boutonVoixHTML(id, i){
  if(typeof voixReveillee!=='function' || !voixReveillee(id)) return '';
  return '<button class="b-voix" data-action="voix-lire" data-i="'+i+'" aria-label="Écouter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></button>';
}
function rendreMsg(m, i, avecChoix){
  if(m.type==='user') return '<div class="msg moi"><div class="bulle">'+paragraphes(m.texte)+'</div></div>';
  if(m.type==='agent'){
    const a=AG[m.qui]||AG.mia;
    return '<div class="msg ag" style="--t:'+teinteDe(a.couleur)+';--c:'+a.couleur+'">'+avatar(a.id, 'petit')
      +'<div class="bulle"><span class="qui">'+esc(a.nom)+boutonVoixHTML(a.id, i)+'</span>'+paragraphes(m.texte)+'</div></div>'
      +(avecChoix && m.choix && m.choix.length ? '<div class="choix">'+m.choix.map(function(c){ return '<button class="choix-b" data-action="repondre" data-texte="'+esc(c)+'">'+esc(c)+'</button>'; }).join('')+'</div>' : '');
  }
  if(m.type==='pro') return '<div class="msg pro"><span class="av petit pro" aria-hidden="true">'+badgePro()+'</span><div class="bulle"><span class="qui">'+badgePro()+esc(nomPro())+'</span>'+paragraphes(m.texte)+'</div></div>';
  if(m.type==='info') return '<p class="info">'+esc(m.texte)+'</p>';
  if(m.type==='erreur') return '<div class="info erreur"><span>'+esc(m.texte)+'</span><button class="lien-inline" data-action="reessayer">Réessayer</button></div>';
  if(m.type==='acte'){
    const p=pasParId(m.pasId), fait=p && p.statut==='fait';
    return '<div class="carte carte-pas'+(fait?' fait':'')+'" style="--c:'+(AG[m.qui]||AG.mia).couleur+'"><span class="sur">Ton pas'+(m.quand?' · '+esc(m.quand):'')+'</span><p>'+esc(m.quoi)+'</p>'
      +(fait ? '<span class="ok">Fait</span>' : (p ? '<button class="lien-inline" data-action="pas-fait" data-id="'+p.id+'">C’est fait</button>' : ''))+'</div>';
  }
  if(m.type==='signal') return '<div class="carte carte-signal"><strong>Signal transmis à ton professionnel référent : '+esc(NOMS_SIGNAUX[m.signal]||m.signal)+'.</strong><p>Il te lit et intervient ici, sans rendez-vous, quand c’est utile.</p></div>';
  if(m.type==='crise') return carteCriseHTML(m);
  if(m.type==='cle') return '<div class="carte carte-cle"><p>Pour que MIA et les accompagnants te répondent, il faut une clé Anthropic.</p><button class="lien-inline" data-action="reglages">Ouvrir les réglages</button></div>';
  if(m.type==='jeu'){
    const a=AG[m.qui]; if(!a || typeof jeuDe!=='function' || !jeuDe(a.id)) return '';
    return '<div class="carte carte-jeu" style="--t:'+teinteDe(a.couleur)+'">'+avatar(a.id)+'<div><strong>Le jeu de '+esc(a.nom)+'</strong><span class="petit">Quelques questions à choix, une minute. Tu t’arrêtes quand tu veux.</span></div>'
      +'<button class="btn" data-action="jeu-ouvrir" data-id="'+a.id+'">Jouer</button></div>';
  }
  if(m.type==='formule'){
    if(abonne()) return '';
    const t=m.raison==='limite' ? 'Tes cinq messages gratuits d’aujourd’hui sont utilisés. Ils reviennent demain.' : (AG[m.qui]?AG[m.qui].nom:'Cet accompagnant')+' fait partie de l’abonnement MAYND.';
    return '<div class="carte carte-formule"><p>'+esc(t)+'</p><button class="lien-inline" data-action="formule-ouvrir" data-raison="'+esc(m.raison)+'">Découvrir MAYND</button></div>';
  }
  return '';
}
function rendreFil(){
  const f=document.getElementById('fil'); if(!f) return;
  let dernierAgent=-1;
  for(let i=etat.fil.length-1;i>=0;i--){ const t=etat.fil[i].type; if(t==='user') break; if(t==='agent'){ dernierAgent=i; break; } }
  f.innerHTML=typo(etat.fil.map(function(m, i){ return rendreMsg(m, i, i===dernierAgent && !enCours); }).join(''))
    +(ecrit ? '<div class="msg ag" style="--t:'+teinteDe(AG[ecrit].couleur)+'">'+avatar(ecrit, 'petit')+'<div class="bulle"><span class="points-ecrit" aria-label="'+esc(AG[ecrit].nom)+' écrit"><i></i><i></i><i></i></span></div></div>' : '');
  f.scrollTop=f.scrollHeight;
}

/* ─────────── l'onglet ─────────── */
ONGLETS.discussion=function(){
  return {html:'<div class="page">'
    +'<header class="chat-tete"><div class="presents" id="presents"></div><button class="b-menu" data-action="menu-discussion" aria-label="Menu">⋯</button></header>'
    +'<div class="fil" id="fil" aria-live="polite"></div>'
    +'<div class="saisie"><textarea id="message" rows="1" maxlength="2000" aria-label="Ton message"></textarea>'
    +'<button class="b-envoi" data-action="envoyer" aria-label="Envoyer">↑</button></div></div>',
    apres:entrerDiscussion};
};
function entrerDiscussion(){
  rendrePresents(); rendreFil();
  const ta=document.getElementById('message');
  ta.addEventListener('input', function(){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight, 160)+'px'; });
  ta.addEventListener('keydown', function(ev){ if(ev.key==='Enter' && !ev.shiftKey){ ev.preventDefault(); envoyerSaisie(); } });
  if(!etat.fil.length){ premierMessage(); return; }
  let dernier=0; etat.fil.forEach(function(m){ if(m.at) dernier=Math.max(dernier, m.at); });
  const ecart=Date.now()-dernier;
  if(retourDemande && etat.cle && dernier && ecart>3*3600000 && !enCours){
    ajouterAuFil({type:'info', texte:'Bon retour. MIA reprend là où vous en étiez.'});
    etat.actif='mia'; rendrePresents();
    reponse('mia', {retour:dureeEnMots(ecart)});
  }
  retourDemande=false;
}
function premierMessage(){
  if(etat.cle){ reponse('mia', {premier:true}); return; }
  const p=prenom(), cap=etat.rep.cap;
  /* Ce message est écrit par l'application, pas par le modèle : il part dans la langue choisie (60-langue.js). */
  const T=function(s){ return typeof traduire==='function' ? traduire(s) : s; };
  ajouterAuFil({type:'agent', qui:'mia', texte:T((p?p+', j':'J')+'’ai lu tout ton parcours.')+' '+(cap?T('Ton cap : « '+cite(cap)+' ».')+' '+T('On commence par là ?'):T('Par quoi veux-tu commencer ?')),
    choix:cap?[T('On commence par là'), T('Plutôt autre chose')]:null});
  ajouterAuFil({type:'cle'});
}
function envoyerSaisie(){
  const ta=document.getElementById('message'); if(!ta) return;
  const t=ta.value.trim(); if(!t || enCours) return;
  ta.value=''; ta.style.height='auto';
  envoyer(t);
}
function envoyer(texte){
  texte=String(texte||'').trim(); if(!texte || enCours) return;
  ajouterAuFil({type:'user', texte:texte});
  const r=risqueLocal(texte);
  if(r) declencherCrise(r, texte, 'local');
  if(!etat.cle){ ajouterAuFil({type:'cle'}); return; }
  /* Le risque passe avant la limite du gratuit ; au-delà, la carte de prévention suffit. */
  if(!messagesRestants()){ if(!r) ajouterAuFil({type:'formule', raison:'limite'}); return; }
  reponse(etat.actif, {risque:r});
}

/* ─────────── la consigne du tour ─────────── */
function motsDe(s){ return String(s||'').trim().split(/\s+/).filter(Boolean).length; }
function consigneTour(qui, o){
  const L=['Consigne pour cette réponse (elle prime sur tes habitudes, jamais sur la sécurité) :'];
  const now=new Date();
  L.push('Moment : '+JOURS_FR[now.getDay()]+' '+now.getDate()+' '+MOIS_FR[now.getMonth()]+', '+now.getHours()+' h '+String(now.getMinutes()).padStart(2, '0')+'.');
  if(o.premier) L.push("C'est ta toute première réponse : la personne vient de finir son parcours d'accueil et arrive dans la discussion. Pas de question générique. En une ou deux phrases, montre-lui que tu as saisi l'essentiel de ce qu'elle vit, avec un détail précis de son compte-rendu, dans ses mots si possible. Puis propose de commencer par son cap, et termine par une seule question précise, avec une balise CHOIX.");
  if(o.retour){
    const pas=pasDuMoment();
    L.push('La personne revient dans la discussion après '+o.retour+'. Accueille-la en une phrase, rattache-toi à ce qui était en cours'
      +(pas?', notamment son pas : « '+pas.texte+' » (prévu '+quandLib(pas)+')':'')+', puis une seule question.');
  }
  if(o.arrivee) L.push("MIA vient de te faire venir. La personne n'a rien à répéter : tu as tout l'échange et son dossier. Présente-toi en une phrase courte, puis va droit à ce qui l'aide.");
  if(o.finJeu) L.push(o.finJeu);
  if(o.risque){
    L.push("Sécurité : son dernier message laisse voir un risque. Applique le protocole de sécurité. L'application a déjà affiché les numéros d'urgence."
      +(abonne() ? ' Son professionnel référent a été prévenu : tu peux le lui dire, simplement.' : " Formule gratuite : il n'y a pas de professionnel. Ne dis jamais que quelqu'un est prévenu."));
    return L.join('\n');
  }
  const users=etat.fil.filter(function(m){ return m.type==='user'; });
  const dernier=users.length ? String(users[users.length-1].texte||'') : '', dn=normaliser(dernier);
  const assist=etat.fil.filter(function(m){ return m.type==='agent'; }).slice(-2);
  const serieQuestions=assist.length===2 && assist.every(function(m){ return /\?\s*$/.test(String(m.texte||'').trim()); });
  const court=users.length>0 && (motsDe(dernier)<=4 || /^(bof|je sais pas|je ne sais pas|j'sais pas|chais pas|ouais|mouais|ok|bah|pas trop|aucune idee|rien)\b/.test(dn));
  const demande=/\?\s*$/.test(dernier.trim()) || /^(comment|pourquoi|est-ce que|qu'est-ce|peux-tu|tu peux|aide-moi|explique|que faire|quoi faire)\b/.test(dn);
  const info=derniereLecture && derniereLecture.information_manquante && INFO_MANQUANTE[derniereLecture.information_manquante];
  if(!o.premier){
    if(serieQuestions) L.push('Question : aucune cette fois. Tes deux dernières réponses finissaient par une question : apporte quelque chose.');
    else if(court) L.push('Elle écrit court : pas de question ouverte. Propose quelque chose, ou offre deux ou trois choix simples avec la balise [[CHOIX:…]].');
    else if(demande) L.push('Elle te demande quelque chose de précis : réponds d’abord, concrètement. Une question ensuite seulement si sa réponse change ta proposition.');
    else if(info) L.push('Ce qui manque encore pour lui proposer un pas qui lui ressemble : '+info+'. Tu peux le demander, en une seule question, en dernière phrase.');
    else L.push('Question : facultative, une au plus, seulement si sa réponse change ce que tu vas proposer.');
  }
  const hr=now.getHours(), tard=(hr>=23 || hr<6);
  L.push(consigneLongueur()+(tard ? ' Il est tard : rien d’ambitieux, ce qui peut attendre demain attend demain.' : ''));
  const p=pasASuivre();
  if(p && !o.arrivee && !o.finJeu){ L.push('Pas à suivre : « '+p.texte+' », prévu '+quandLib(p)+'. Si le moment s’y prête, demande-lui simplement où elle en est, jamais comme un contrôle.'); p.evoque=1; garder(); }
  if(!abonne()){
    if(messagesRestants()===1) L.push('C’est son dernier message gratuit aujourd’hui : termine par ce que tu retiens et un pas simple pour demain. Ne parle pas d’abonnement.');
    L.push('Formule gratuite : tu peux nommer l’accompagnant qui aiderait, sans insister, mais tu ne le fais pas venir toi-même : l’application s’en charge.');
  }
  if(qui==='mia' && (court || (derniereLecture && derniereLecture.energie==='basse')) && users.length<=3 && typeof jeuDe==='function') L.push('Si elle ne sait pas par où commencer, tu peux lui proposer le jeu de l’accompagnant le plus proche de ce qu’elle vit, avec la balise [[JEU:identifiant]].');
  return L.join('\n');
}
function messagesPour(qui, o){
  const M=[{role:'user', content:"(La personne vient de terminer son parcours d'accueil et ouvre la discussion.)"}];
  etat.fil.slice(-60).forEach(function(m){
    if(m.type==='user') M.push({role:'user', content:m.texte});
    else if(m.type==='agent') M.push({role:'assistant', content:(m.qui===qui?'':'['+AG[m.qui].nom+'] ')+m.texte});
    else if(m.type==='pro') M.push({role:'assistant', content:'[Professionnel référent] '+m.texte});
  });
  if(o.retour) M.push({role:'user', content:'(La personne revient dans la discussion.)'});
  if(o.arrivee) M.push({role:'user', content:"(MIA t'a fait venir. La personne attend ta première réponse.)"});
  if(o.finJeu) M.push({role:'user', content:'(Elle vient de finir ton jeu. Réponds à ce récapitulatif.)'});
  if(M[M.length-1].role!=='user') M.push({role:'user', content:'(La personne attend ta réponse.)'});
  return M;
}

/* ─────────── la réponse et ses suites ─────────── */
function faireVenir(id, o){
  if(!AG[id] || id==='mia') return;
  if(!abonne()){ ajouterAuFil({type:'formule', raison:'accompagnant', qui:id}); return; }
  if(etat.presents.indexOf(id)<0){ etat.presents.push(id); ajouterAuFil({type:'info', texte:AG[id].nom+' rejoint la discussion.'}); }
  etat.actif=id; garder(); rendrePresents();
  return reponse(id, Object.assign({arrivee:true}, o||{}));
}
async function traiter(qui, brut){
  const b=lireBalises(brut);
  if(b.texte) ajouterAuFil({type:'agent', qui:qui, texte:b.texte, choix:b.choix});
  compterReponse();
  if(b.actes.length){
    enregistrerPas(b.actes, qui);
    b.actes.forEach(function(a){ const p=dossierObj().pas.find(function(x){ return x.texte===a.quoi.slice(0,140) && x.statut!=='fait'; }); ajouterAuFil({type:'acte', qui:qui, quoi:a.quoi, quand:a.quand, pasId:p?p.id:null}); });
  }
  b.signaux.forEach(function(s){ if(typeof poserSignal==='function') poserSignal(s, qui, false); });
  if(b.crise) declencherCrise(2, '', qui);
  if(b.jeu && typeof jeuDe==='function' && jeuDe(b.jeu)) ajouterAuFil({type:'jeu', qui:b.jeu});
  if(typeof voixApresReponse==='function') voixApresReponse(qui, b.texte);
  if(b.invite && qui==='mia' && AG[b.invite] && b.invite!=='mia') return faireVenir(b.invite);
  if(typeof proApresReponse==='function') proApresReponse();
}
async function reponse(qui, o){
  o=o||{};
  if(enCours) return;
  enCours=true; ecrit=qui; rendreFil();
  try{
    const res=await appeler(systeme(qui, consigneTour(qui, o)), messagesPour(qui, o));
    ecrit=null; enCours=false;
    if(res.refus) ajouterAuFil({type:'info', texte:AG[qui].nom+" n'a pas pu répondre à ce message. Tu peux le dire autrement ?"});
    else if(!res.texte) ajouterAuFil({type:'erreur', texte:'La réponse est arrivée vide.'});
    else await traiter(qui, res.texte);
    programmerLecture();
  }catch(err){
    ecrit=null; enCours=false;
    ajouterAuFil({type:'erreur', texte:messageErreur(err)});
  }
  rendreFil();
}

/* ─────────── la formule MAYND ─────────── */
let formuleRaison='';
function formuleHTML(){
  const p=prenom();
  return '<div class="formule"><p class="sur">La formule MAYND</p>'
    +'<h1 class="grand">'+(p?esc(p)+', tout' : 'Tout')+' MAYND, sans limite.</h1>'
    +'<div class="prix">'+PRIX_MAYND+' €<small> / mois</small></div><p class="petit">Sans engagement. Tu arrêtes quand tu veux.</p>'
    +'<ul><li>Les seize accompagnants, que MIA fait venir au bon moment</li><li>Un professionnel référent certifié, humain, qui suit ton parcours et intervient sur signal</li><li>La voix de chaque accompagnant</li><li>'+QUOTA_MAYND_MOIS+' messages par mois</li></ul>'
    +'<div class="paiement" id="paiement" hidden><label class="etiquette" for="p-carte">Carte bancaire</label><input class="champ" id="p-carte" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19">'
    +'<div class="rangee"><input class="champ" id="p-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"><input class="champ" id="p-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4"></div>'
    +'<p class="petit">Démonstration : aucun paiement réel n’est effectué.</p>'
    +bouton('Confirmer · '+PRIX_MAYND+' € par mois', 'formule-payer')+'</div>'
    +'<div id="formule-boutons">'+bouton('Passer à MAYND', 'formule-choisir')+'<button class="lien" data-action="formule-fermer">Rester en gratuit pour l’instant</button></div></div>';
}
function ouvrirFormule(raison){
  formuleRaison=raison||'';
  const pl=document.getElementById('plein');
  pl.innerHTML=typo(formuleHTML()); pl.classList.add('ouvert'); pl.setAttribute('aria-hidden', 'false'); pl.scrollTop=0;
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute('content', VIOLET);
}
function fermerPlein(){ const pl=document.getElementById('plein'); pl.classList.remove('ouvert'); pl.setAttribute('aria-hidden', 'true'); setTimeout(function(){ if(!pl.classList.contains('ouvert')) pl.innerHTML=''; }, 500); }
ACTIONS['formule-ouvrir']=function(b){ ouvrirFormule(b.dataset.raison||''); };
ACTIONS['formule-fermer']=fermerPlein;
ACTIONS['formule-choisir']=function(){ document.getElementById('paiement').hidden=false; document.getElementById('formule-boutons').hidden=true; const c=document.getElementById('p-carte'); if(c) c.focus(); };
ACTIONS['formule-payer']=function(){
  const c=String((document.getElementById('p-carte')||{}).value||'').replace(/\s/g, '');
  if(c.length<12){ toast('Un numéro de carte, même factice, pour la démonstration.'); return; }
  etat.formule='maynd'; etat.paye=Date.now(); garder();
  fermerPlein(); toast('Bienvenue dans MAYND.');
  /* Un accompagnant attendait : il vient maintenant. */
  const attente=etat.fil.slice().reverse().find(function(m){ return m.type==='formule' && m.raison==='accompagnant' && m.qui; });
  if(etat.onglet==='discussion'){ rendreFil(); if(attente && !enCours) faireVenir(attente.qui); }
  else rafraichirOnglet();
};

/* ─────────── actions ─────────── */
ACTIONS.envoyer=envoyerSaisie;
ACTIONS.repondre=function(b){ envoyer(b.dataset.texte); };
ACTIONS['parler-a']=function(b){ etat.actif=b.dataset.id; garder(); rendrePresents(); const ta=document.getElementById('message'); if(ta) ta.focus(); };
ACTIONS.reessayer=function(){
  if(enCours) return;
  const d=etat.fil[etat.fil.length-1]; if(d && d.type==='erreur'){ etat.fil.pop(); garder(); }
  if(!etat.fil.some(function(m){ return m.type==='agent'; })) reponse('mia', {premier:true}); else reponse(etat.actif, {});
};
ACTIONS['menu-discussion']=function(){
  ouvrir('<h2>MAYND</h2><div class="menu">'+lienBouton('Mon compte-rendu', 'cr-ouvrir')+lienBouton('Mon professionnel référent', 'pro-ouvrir')+lienBouton('Réglages', 'reglages')+lienBouton('Faire une pause', 'pause')+'</div>');
};
ACTIONS.pause=function(){
  const p=prenom(), o=valeurChoix('moment_parler'), pas=pasDuMoment();
  ouvrir('<h2>À plus tard'+(p?', '+esc(p):'')+'.</h2><p>MIA reprend exactement là où vous en êtes.</p>'
    +(o && o.m && o.k!=='tout' ? '<p>Tu m’as dit que ton moment pour parler, c’est '+esc(o.m)+'. Reviens à ce moment-là, si tu veux.</p>' : '<p>Reviens quand tu veux.</p>')
    +(pas ? '<div class="carte carte-pas"><span class="sur">Ton pas en cours</span><p>'+esc(pas.texte)+' · '+esc(quandLib(pas))+'</p></div>' : '')
    +bouton('Revenir à la discussion', 'fermer'));
};
