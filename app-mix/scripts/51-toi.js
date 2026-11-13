/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — TOI (13/11/2026)
   Ton compte-rendu, ton profil, ton cap ; ton équipe (les seize, les
   rencontrés en premier, avec leur fiche) ; ton professionnel référent ;
   les réglages, et la section Démonstration (vue professionnel, Studio,
   fournisseur), hors de l'usage courant.
   ══════════════════════════════════════════════════════════════════════════ */

const CLE_MAYND='maynd.state.v7';   /* lue seulement, jamais écrite */
function clePremiereApp(){
  try{
    const s=JSON.parse(localStorage.getItem(CLE_MAYND)||'null'); if(!s) return '';
    const k=(s.apiKeys && s.apiKeys.anthropic) || (s.provider!=='deepseek' ? s.apiKey : '');
    return String(k||'').trim();
  }catch(_){ return ''; }
}
function rencontre(id){ return etat.presents.indexOf(id)>=0; }
function ligneAgentHTML(id){
  const a=AG[id], r=rencontre(id);
  return '<button class="ligne'+(r?'':' endormi')+'" data-action="fiche" data-id="'+id+'">'+avatar(id)+'<div><strong>'+esc(a.nom)+'</strong><span class="sous">'+esc(a.domaine)+'</span></div>'
    +'<span class="pastille-etat">'+(id==='mia' ? 'Co-pilote' : r ? (agentFem(id)?'Rencontrée':'Rencontré') : (agentFem(id)?'Endormie':'Endormi'))+'</span></button>';
}
ONGLETS.toi=function(){
  const p=profil(), pr=prenom();
  const ordre=['mia'].concat(ACCOMPAGNANTS.filter(function(a){ return a.id!=='mia' && rencontre(a.id); }).map(function(a){ return a.id; }))
    .concat(equipe().filter(function(id){ return !rencontre(id); }))
    .concat(ACCOMPAGNANTS.filter(function(a){ return a.id!=='mia' && !rencontre(a.id) && equipe().indexOf(a.id)<0; }).map(function(a){ return a.id; }));
  const html='<div class="page"><header class="tete"><div><div class="date">Toi</div><h1>'+esc(pr||'Ton espace')+'</h1></div><button class="b-rond" data-action="reglages" aria-label="Réglages">⚙</button></header>'
    +'<div class="pile">'
    +'<div class="bloc teinte" style="--t:var(--lavande)"><span class="sur">Ton profil MAYND</span><h2>'+esc(p.nom)+'</h2><p>'+esc(p.desc)+'</p>'
    +(etat.rep.cap ? '<p><strong>Ton cap :</strong> « '+esc(cite(etat.rep.cap))+' »</p>' : '')
    +'<div class="actions">'+bouton('Mon compte-rendu', 'cr-ouvrir')+lienBouton('Modifier mon cap', 'cap-modifier')+'</div></div>'
    +proCarteHTML()
    +'</div>'
    +'<p class="titre-section">Ton équipe</p><div class="liste">'+ordre.map(ligneAgentHTML).join('')+'</div>'
    +'</div>';
  return {html:html};
};

/* ─────────── le compte-rendu, consultable et corrigeable ─────────── */
ACTIONS['cr-ouvrir']=function(){
  ouvrir('<p class="sur">Ton compte-rendu</p><h2>'+esc(profil().nom)+'</h2><p class="petit">Si quelque chose sonne faux, corrige-le : c’est ta version qui compte.</p>'
    +'<p class="cr-etat" id="cr-etat" aria-live="polite"></p><div class="cr-liste">'+cartesCR()+'</div>'
    +retenuDossierHTML());
  if(etat.cle && !Object.keys(etat.cr.mia).length) lancerCompteRendu();
};
/* Ce que MAYND a appris dans les échanges : chaque ligne s'efface, et ne revient jamais. */
function retenuDossierHTML(){
  const d=dossierObj(), L=[];
  if(d.situation) L.push(['situation', 0, d.situation]);
  d.faits.forEach(function(x, i){ L.push(['faits', i, x]); });
  d.personnes.forEach(function(x, i){ L.push(['personnes', i, x]); });
  d.aide.forEach(function(x, i){ L.push(['aide', i, 'Ce qui t’aide : '+x]); });
  d.marchePas.forEach(function(x, i){ L.push(['marchePas', i, 'Ce qui ne marche pas : '+x]); });
  d.aVenir.forEach(function(x, i){ L.push(['aVenir', i, 'À venir : '+x.quoi+(x.date?' ('+x.date+')':'')]); });
  if(!L.length) return '';
  return '<p class="titre-section">Ce que MAYND a appris dans vos échanges</p><div class="liste">'+L.map(function(x){
    return '<div class="ligne"><span>'+esc(x[2])+'</span><button class="lien-inline" data-action="dossier-effacer" data-liste="'+x[0]+'" data-i="'+x[1]+'" aria-label="Effacer">Effacer</button></div>';
  }).join('')+'</div>';
}
ACTIONS['dossier-effacer']=function(b){ dossierEffacer(b.dataset.liste, +b.dataset.i); ACTIONS['cr-ouvrir'](); toast('Effacé. Cette ligne ne reviendra pas.'); };
ACTIONS['cap-modifier']=function(){
  ouvrir('<h2>Ton cap</h2><p class="petit">Une seule chose à travailler en premier.</p><textarea class="champ" id="cap-champ" rows="3" maxlength="200">'+esc(etat.rep.cap||'')+'</textarea>'
    +'<div class="actions">'+bouton('Enregistrer', 'cap-enregistrer')+'</div>');
};
ACTIONS['cap-enregistrer']=function(){ const v=String((document.getElementById('cap-champ')||{}).value||'').trim(); if(!v) return; noter('cap', v); fermer(); toast('Ton cap est posé.'); rafraichirOnglet(); };

/* ─────────── la fiche d'un accompagnant ─────────── */
ACTIONS.fiche=function(b){
  const id=b.dataset.id, a=AG[id], info=AGENT_INFO[id]||{tag:'', does:[], when:[]}, pr=pron(id), r=rencontre(id);
  let hh='<div class="fiche-tete">'+avatar(id, 'grand')+'<div><strong>'+esc(a.nom)+'</strong><span>'+esc(a.domaine)+'</span></div></div>'
    +'<p class="fiche-tag">'+esc(info.tag)+'</p>';
  if(id!=='mia' && !r) hh+='<div class="fiche-dort">'+pr.Il+' dort. MIA '+pr.le+' fait venir quand c’est utile'+(typeof jeuDe==='function' && jeuDe(id) ? ', ou tu '+pr.le+' réveilles par son jeu.' : '.')+'</div>';
  if(info.does.length) hh+='<p class="titre-section">Ce qu’'+pr.il+' fait avec toi</p><ul class="fiche-liste">'+info.does.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>';
  if(info.when.length) hh+='<p class="titre-section">Quand</p><ul class="fiche-liste">'+info.when.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>';
  if(id!=='mia' && typeof voixReveillee==='function'){
    hh+='<p class="titre-section">Sa voix</p>'+(voixReveillee(id) ? '<button class="lien" data-action="voix-echantillon" data-id="'+id+'">Écouter sa voix</button>'
      : '<p class="petit">Finir son jeu réveille sa voix.</p>');
  }
  hh+='<div class="actions">'
    +(id==='mia' || r ? bouton('Lui parler', 'parler-a-depuis-fiche', ' data-id="'+id+'"') : (abonne() ? bouton((agentFem(id)?'La':'Le')+' faire venir', 'faire-venir', ' data-id="'+id+'"') : bouton('Découvrir MAYND', 'formule-ouvrir', ' data-raison="accompagnant"')))
    +(typeof jeuDe==='function' && jeuDe(id) ? lienBouton('Son jeu', 'jeu-ouvrir', ' data-id="'+id+'"') : '')+'</div>';
  ouvrir(hh);
};
ACTIONS['parler-a-depuis-fiche']=function(b){ etat.actif=b.dataset.id; garder(); fermer(); montrerOnglet('discussion'); };
ACTIONS['faire-venir']=function(b){ const id=b.dataset.id; fermer(); montrerOnglet('discussion'); setTimeout(function(){ faireVenir(id); }, DUREE+50); };

/* ─────────── réglages ─────────── */
function interrupteur(action, on, extra){ return '<button class="interrupteur'+(on?' on':'')+'" data-action="'+action+'" role="switch" aria-checked="'+on+'"'+(extra||'')+'></button>'; }
ACTIONS.reglages=function(){
  const importable=clePremiereApp();
  let hh='<h2>Réglages</h2>'
    +'<p class="titre-section">Ton compte</p><div class="bloc">'
    +(compteCree() ? '<p><strong>'+esc(etat.compte.courriel)+'</strong><br><span class="petit">Compte créé le '+esc(dateCourte(etat.compte.cree))+'.</span></p>' : '<p class="petit">Pas encore de compte : il se crée au résultat du parcours.</p>')
    +'<p><strong>Formule : '+(abonne() ? 'MAYND, '+PRIX_MAYND+' € par mois' : 'gratuite')+'</strong><br><span class="petit">'+(abonne() ? pluriel(messagesRestants(), 'message restant', 'messages restants')+' ce mois-ci.' : 'MIA seule, '+QUOTA_GRATUIT_JOUR+' messages par jour.')+'</span></p>'
    +(abonne() ? lienBouton('Revenir au gratuit', 'formule-quitter') : bouton('Passer à MAYND', 'formule-ouvrir', ' data-raison="reglages"'))+'</div>'
    +'<p class="titre-section">La clé</p><div class="bloc"><label class="etiquette" for="cle">Clé API Anthropic</label>'
    +'<input class="champ" id="cle" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="'+esc(etat.cle)+'">'
    +'<p class="petit">Elle reste sur cet appareil et sert à parler à MIA et aux accompagnants.</p>'
    +'<div class="actions">'+bouton('Enregistrer', 'cle-enregistrer')+(importable?lienBouton('Reprendre la clé de MAYND', 'cle-importer'):'')+'</div></div>'
    +'<p class="titre-section">La voix</p><div class="bloc"><div class="bascule"><div><strong>Lire les réponses à voix haute</strong><span class="sous">Les accompagnants dont tu as réveillé la voix te répondent aussi à l’oral.</span></div>'+interrupteur('voix-auto', !!etat.voix.auto)+'</div></div>'
    +'<p class="titre-section">Confidentialité</p><div class="bloc"><p class="petit">Tes réponses et tes échanges restent sur cet appareil. Tu peux tout effacer.</p>'
    +'<button class="lien" data-action="recommencer">Tout effacer et recommencer</button></div>'
    +'<details class="bloc"><summary>Démonstration</summary>'
    +'<p class="petit">Réservé aux démonstrations. Dans cette version, les messages du professionnel référent sont rédigés par le modèle sur signal : ils montrent la place qu’aura le vrai professionnel.</p>'
    +'<label class="etiquette" for="demo-pro-nom">Prénom du professionnel référent</label><input class="champ" id="demo-pro-nom" maxlength="40" value="'+esc(etat.pro.nom||'')+'"><div class="actions">'+bouton('Enregistrer', 'demo-pro-nom')+'</div>'
    +'<div class="actions">'+lienBouton('Signer la feuille de route', 'demo-signer-feuille')+lienBouton('Signer le bilan', 'demo-signer-bilan')+'</div>'
    +'<div class="actions">'+lienBouton('Poser un signal : progression', 'demo-signal', ' data-type="progression"')+lienBouton('Poser un signal : stagnation', 'demo-signal', ' data-type="stagnation"')+'</div>'
    +'<label class="etiquette">Fournisseur</label><div class="choix-ligne"><button class="'+(etat.fournisseur==='anthropic'?'on':'')+'" data-action="fournisseur" data-f="anthropic">Anthropic</button><button class="'+(etat.fournisseur==='deepseek'?'on':'')+'" data-action="fournisseur" data-f="deepseek">DeepSeek</button></div>'
    +'<label class="etiquette">Modèle</label><div class="choix-ligne">'+(etat.fournisseur==='deepseek' ? ['deepseek-flash','deepseek-v4-pro'] : ['claude-sonnet-5-5','claude-opus-5-5']).map(function(m){ return '<button class="'+(etat.modele===m?'on':'')+'" data-action="modele" data-m="'+m+'">'+m+'</button>'; }).join('')+'</div>'
    +'<label class="etiquette" for="studio-socle">Studio : le socle commun</label><textarea class="champ" id="studio-socle" rows="6">'+esc(etat.socle||SOCLE)+'</textarea>'
    +'<p class="petit">Le protocole de sécurité n’est pas modifiable.</p><div class="actions">'+bouton('Enregistrer le socle', 'studio-enregistrer')+lienBouton('Revenir au socle d’origine', 'studio-retablir')+'</div>'
    +'</details>'
    +'<p class="petit" style="margin-top:14px">'+VERSION_APP+'</p>';
  ouvrir(hh);
};
ACTIONS['cle-enregistrer']=function(){
  const v=String((document.getElementById('cle')||{}).value||'').trim();
  etat.cle=v; garder(); fermer();
  if(etat.fini && etat.onglet==='discussion' && v){
    const dernier=etat.fil[etat.fil.length-1], avant=etat.fil[etat.fil.length-2];
    if(dernier && dernier.type==='cle'){ etat.fil.pop(); garder(); rendreFil(); if(avant && avant.type==='user') reponse(etat.actif, {}); }
  }
  if(!etat.fini && ETAPES[etat.etape] && ETAPES[etat.etape].t==='compte' && v) lancerCompteRendu();
  toast(v ? 'Clé enregistrée.' : 'Clé retirée.');
};
ACTIONS['cle-importer']=function(){ const k=clePremiereApp(), c=document.getElementById('cle'); if(c && k) c.value=k; };
ACTIONS['voix-auto']=function(b){ etat.voix.auto=!etat.voix.auto; garder(); b.classList.toggle('on', etat.voix.auto); b.setAttribute('aria-checked', String(etat.voix.auto)); };
ACTIONS['formule-quitter']=function(){ etat.formule='gratuit'; garder(); fermer(); toast('Tu es en formule gratuite.'); rafraichirOnglet(); };
ACTIONS.fournisseur=function(b){ etat.fournisseur=b.dataset.f; etat.modele=b.dataset.f==='deepseek' ? 'deepseek-flash' : MODELE_REPONSE; garder(); ACTIONS.reglages(); };
ACTIONS.modele=function(b){ etat.modele=b.dataset.m; garder(); ACTIONS.reglages(); };
ACTIONS['studio-enregistrer']=function(){ const v=String((document.getElementById('studio-socle')||{}).value||'').trim(); etat.socle=(v && v!==SOCLE) ? v : ''; garder(); toast('Socle enregistré.'); };
ACTIONS['studio-retablir']=function(){ etat.socle=''; garder(); ACTIONS.reglages(); };
ACTIONS['demo-signal']=function(b){ if(!abonne()){ toast('Un signal demande la formule MAYND.'); return; } poserSignal(b.dataset.type, 'démonstration', true); fermer(); montrerOnglet('discussion'); };
