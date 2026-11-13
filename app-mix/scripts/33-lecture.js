/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE DOSSIER, LES PAS, LA LECTURE DES MESSAGES (13/11/2026)
   Repris de MAYND (38-dossier-et-suivi.js).
   1. Le dossier commun (etat.dossier) : ce que MAYND apprend dans les échanges.
      Le compte-rendu du parcours en est la base ; la lecture des messages
      l'enrichit. La personne le voit dans Toi ; une ligne effacée n'est jamais
      réécrite.
   2. Les pas datés : [[ACTE:texte|quand]] crée un pas avec une échéance.
      Aujourd'hui montre « Ton pas ». L'accompagnant y revient au bon moment.
   3. La lecture différée : huit secondes après une réponse, un appel court
      (claude-haiku-4-5) lit le dernier message et rend un JSON : risque, signal,
      phase, besoin, énergie, information manquante, pas évoqués, faits.
   4. Le bloc « dossier » envoyé au modèle : compte-rendu + lignes lues + façon
      de parler, repris du Tunnel.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── 1. le dossier ─────────── */
function dossierObj(){
  const d=etat.dossier;
  ['faits','personnes','aide','marchePas','facon','refusees','aVenir','pas','effaces'].forEach(function(k){ if(!Array.isArray(d[k])) d[k]=[]; });
  if(typeof d.situation!=='string') d.situation='';
  return d;
}
function dossierEfface(texte){ const n=String(texte||'').trim().toLowerCase(); return dossierObj().effaces.some(function(x){ return String(x).trim().toLowerCase()===n; }); }
function dossierAjouter(liste, texte, max){
  const d=dossierObj(), s=String(texte||'').trim(); if(!s || s.length>300 || dossierEfface(s)) return false;
  const l=d[liste]; if(l.some(function(x){ return String(x).trim().toLowerCase()===s.toLowerCase(); })) return false;
  l.push(s); if(l.length>(max||30)) d[liste]=l.slice(-(max||30));
  return true;
}
function evenementTs(e){ const m=String(e.date||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2]-1, +m[3], 12).getTime() : 0; }
function quandLib(p){ return p.echeance ? dateLib(p.echeance) : (p.quandTexte || 'cette semaine'); }
function dossierLignes(){
  const d=dossierObj(), L=[];
  if(d.situation) L.push('sa situation en ce moment, d’après les échanges : '+d.situation);
  if(d.personnes.length) L.push('les personnes qui comptent dans ce qu’elle raconte : '+d.personnes.slice(-8).join(' ; '));
  if(d.faits.length) L.push('ce qu’on a appris d’elle dans les échanges : '+d.faits.slice(-12).join(' ; '));
  if(d.aide.length) L.push('ce qui l’aide : '+d.aide.slice(-6).join(' ; '));
  if(d.marchePas.length) L.push('ce qui ne marche pas pour elle : '+d.marchePas.slice(-6).join(' ; '));
  const enCours=d.pas.filter(function(p){ return p.statut==='en_cours'||p.statut==='reporte'; });
  if(enCours.length) L.push('ses pas en cours, à ne pas reproposer sous une autre forme : '+enCours.slice(-5).map(function(p){ return '« '+p.texte+' », prévu '+quandLib(p)+(p.reports?' (repoussé '+p.reports+' fois)':''); }).join(' ; '));
  const faits=d.pas.filter(function(p){ return p.statut==='fait' && p.faitLe && (Date.now()-p.faitLe)<14*86400000; });
  if(faits.length) L.push('pas faits ces deux dernières semaines : '+faits.slice(-4).map(function(p){ return '« '+p.texte+' »'; }).join(' ; '));
  const ev=d.aVenir.filter(function(e){ return e.date && evenementTs(e)>=Date.now()-86400000; });
  if(ev.length) L.push('ce qui l’attend : '+ev.slice(0,4).map(function(e){ return e.quoi+' ('+dateLib(evenementTs(e))+')'; }).join(' ; '));
  if(d.refusees.length) L.push('pistes qu’elle a refusées, à ne jamais reproposer : '+d.refusees.slice(-6).join(' ; '));
  if(d.hypothese && d.hypothese.texte) L.push('hypothèse de fond, à confirmer : '+d.hypothese.texte+' (certitude '+(d.hypothese.certitude||'faible')+')');
  return L;
}
function dossierEffacer(liste, i){
  const d=dossierObj(); let texte=null;
  if(liste==='situation'){ texte=d.situation; d.situation=''; }
  else if(liste==='pas'){ const p=d.pas[i]; if(p){ texte=p.texte; d.pas.splice(i, 1); } }
  else if(liste==='aVenir'){ const e=d.aVenir[i]; if(e){ texte=e.quoi; d.aVenir.splice(i, 1); } }
  else if(Array.isArray(d[liste])){ texte=d[liste][i]; d[liste].splice(i, 1); }
  if(texte && !dossierEfface(texte)) d.effaces.push(String(texte));
  garder();
}

/* ─────────── 2. les pas datés ─────────── */
function enregistrerPas(actes, auteur){
  const d=dossierObj(), now=Date.now();
  (actes||[]).forEach(function(a){
    const texte=String(a.quoi||'').trim(); if(!texte) return;
    if(d.pas.some(function(x){ return x.texte.toLowerCase()===texte.toLowerCase() && x.statut!=='fait'; })) return;
    d.pas.push({id:'p'+now+Math.floor(Math.random()*999), texte:texte.slice(0,140), quandTexte:String(a.quand||'').slice(0,40),
      echeance:parseQuand(a.quand)||(now+3*86400000), agent:auteur||'mia', statut:'en_cours', cree:now, evoque:0});
  });
  if(d.pas.length>30) d.pas=d.pas.slice(-30);
  garder();
}
function pasParId(id){ return dossierObj().pas.find(function(p){ return p.id===id; }); }
function pasDuMoment(){
  const l=dossierObj().pas.filter(function(p){ return p.statut==='en_cours' || p.statut==='reporte'; });
  l.sort(function(a, b){ return (a.echeance||0)-(b.echeance||0); });
  return l[0]||null;
}
function marquerPasFait(p){ if(!p || p.statut==='fait') return; p.statut='fait'; p.faitLe=Date.now(); garder(); }
function pasASuivre(){
  const now=Date.now();
  const l=dossierObj().pas.filter(function(p){ return (p.statut==='en_cours'||p.statut==='reporte') && p.echeance && p.echeance<=now && p.echeance>now-7*86400000 && !p.evoque; });
  l.sort(function(a, b){ return b.echeance-a.echeance; });
  return l[0]||null;
}
ACTIONS['pas-fait']=function(b){ marquerPasFait(pasParId(b.dataset.id)); toast('C’est noté. Un pas de plus.'); rafraichirOnglet(); if(typeof rendreFil==='function') rendreFil(); };
ACTIONS['pas-encore']=function(b){
  const p=pasParId(b.dataset.id); if(!p) return;
  p.statut='reporte'; p.reports=(p.reports||0)+1; p.echeance=Date.now()+2*86400000; p.evoque=0; garder();
  toast('D’accord. On en reparle dans deux jours.'); rafraichirOnglet();
};
ACTIONS['pas-parler']=function(b){
  const p=pasParId(b.dataset.id); if(!p) return;
  const qui=(p.agent && etat.presents.indexOf(p.agent)>=0) ? p.agent : 'mia';
  etat.actif=qui; garder();
  montrerOnglet('discussion');
  setTimeout(function(){ try{ const i=document.getElementById('message'); i.value='À propos de « '+p.texte+' » : '; i.focus(); }catch(_){} }, DUREE+120);
};

/* ─────────── 3. la lecture différée ─────────── */
const LECTURE_SYSTEM=`Tu lis, pour l'équipe MAYND, le dernier message d'une personne dans une discussion avec un accompagnant. Ta lecture n'est jamais montrée à la personne. Tu réponds uniquement par l'objet JSON demandé, sans texte autour.

Tu reçois son dossier, ses pas en cours, les derniers échanges, et son dernier message : c'est celui que tu lis.

risque
0 : rien de préoccupant.
1 : mal-être marqué, sans idée de mort ni de se faire du mal.
2 : idée de mort ou de se faire du mal, même vague, même au détour d'une phrase ou sur le ton de la blague.
3 : projet, moyen, moment choisi, geste en cours, ou danger immédiat pour elle ou pour quelqu'un d'autre.
En cas de doute entre deux niveaux, prends le plus élevé. Pour 2 et 3, recopie la phrase exacte dans risque_citation.

signal
Un des quatre signaux de MAYND, ou null. Jamais d'autre.
stagnation : rien ne bouge depuis plusieurs échanges, malgré des pas proposés.
blocage : elle bute sur quelque chose qu'elle ne parvient pas à dépasser seule, ou une souffrance demande un regard humain.
desalignement : ce qu'elle vit ou choisit s'éloigne nettement de son cap.
progression : un progrès réel, qui mérite d'être consolidé.
Recopie la preuve dans signal_preuve. Le plus souvent, signal vaut null.

phase : accueillir, comprendre, agir, suivre (elle revient sur un pas), apaiser (elle est submergée, maintenant).
besoin : ecoute, comprendre, decider, agir, information.
energie : basse, normale ou haute, d'après sa façon d'écrire.
demande_precise : vrai si elle pose une question ou demande quelque chose de précis.
information_manquante : ce qui manque encore pour lui proposer un pas qui lui ressemble : situation, ce_qui_compte, deja_essaye, ou null.
terrain : l'identifiant de l'accompagnant dont le terrain porte le cœur du message (naoki, felix, atlas, ava, leo, otis, kael, miro, sol, mateo, soren, iris, eden, vince, neo, nora), ou null.
pas_evoques : pour chaque pas en cours que son message évoque, son identifiant et son statut : fait, pas_fait, reporte, abandonne.
faits_nouveaux : les faits durables appris dans ce message, une phrase chacun, à la troisième personne, sans mot clinique ni interprétation.
a_venir : les événements datés qu'elle mentionne, avec la date au format AAAA-MM-JJ quand elle se déduit.
hypothese_refusee : la piste qu'elle vient de refuser, en quelques mots, ou null.

Format exact :
{"risque":0,"risque_citation":null,"signal":null,"signal_preuve":null,"phase":"comprendre","besoin":"ecoute","energie":"normale","demande_precise":false,"information_manquante":null,"terrain":null,"pas_evoques":[],"faits_nouveaux":[],"a_venir":[],"hypothese_refusee":null}`;
const INFO_MANQUANTE={situation:'la situation concrète (quand, où, avec qui)', ce_qui_compte:'ce qui compte pour elle là-dedans', deja_essaye:'ce qu’elle a déjà essayé'};
const LECTURE_DELAI_MS=/[?&]rapide\b/.test(location.search) ? 30 : 8000;
let lectureTimer=null, derniereLecture=null, luJusqua=0;
function modeleLecture(){ return etat.fournisseur==='deepseek' ? 'deepseek-flash' : MODELE_LECTURE; }
function programmerLecture(){ clearTimeout(lectureTimer); lectureTimer=setTimeout(lireDiscussion, LECTURE_DELAI_MS); }
function extraireJSON(s){
  const t=String(s||''), a=t.indexOf('{'), b=t.lastIndexOf('}');
  if(a<0 || b<=a) return null;
  try{ return JSON.parse(t.slice(a, b+1)); }catch(_){ return null; }
}
function pasEnCoursListe(){
  return dossierObj().pas.filter(function(p){ return p.statut==='en_cours'||p.statut==='reporte'; })
    .map(function(p){ return p.id+' : '+p.texte+' (prévu '+quandLib(p)+')'; }).join('\n') || 'aucun';
}
async function lireDiscussion(){
  if(!etat.cle) return;
  const msgs=etat.fil.filter(function(m){ return m.type==='user' || m.type==='agent' || m.type==='pro'; });
  if(msgs.length<=luJusqua) return;
  const users=msgs.slice(luJusqua).filter(function(m){ return m.type==='user'; });
  const avant=luJusqua; luJusqua=msgs.length;
  if(!users.length) return;
  const recents=msgs.slice(-8).map(function(m){ return (m.type==='user'?'Personne':'Accompagnant')+' : '+String(m.texte||'').slice(0,800); }).join('\n');
  const charge='Dossier :\n'+(dossierLignes().join('\n')||'vide')+'\n\nPas en cours :\n'+pasEnCoursListe()
    +'\n\nDerniers échanges :\n'+recents+'\n\nDernier message de la personne, celui que tu lis :\n'+users.map(function(m){ return m.texte; }).join('\n');
  try{
    const res=await appeler(LECTURE_SYSTEM, [{role:'user', content:charge}], 900, {modele:modeleLecture(), sansRelais:true});
    const j=extraireJSON(res.texte);
    if(j) appliquerLecture(j);
    garder();
  }catch(_){ luJusqua=avant; }
}
function appliquerLecture(j){
  const niveau=+j.risque||0;
  if(niveau>=2) declencherCrise(niveau, j.risque_citation||'', 'lecture');
  derniereLecture={phase:j.phase||null, besoin:j.besoin||null, energie:j.energie||null, demande_precise:!!j.demande_precise,
    information_manquante:(INFO_MANQUANTE[j.information_manquante] ? j.information_manquante : null), terrain:(j.terrain && AG[j.terrain]) ? j.terrain : null, at:Date.now()};
  if(j.signal && NOMS_SIGNAUX[j.signal] && typeof poserSignal==='function') poserSignal(j.signal, 'lecture', false, j.signal_preuve);
  (Array.isArray(j.pas_evoques)?j.pas_evoques:[]).forEach(function(x){
    const p=x && pasParId(x.id); if(!p) return;
    if(x.statut==='fait') marquerPasFait(p);
    else if(x.statut==='abandonne') p.statut='abandonne';
    else if(x.statut==='reporte'){ p.statut='reporte'; p.reports=(p.reports||0)+1; p.echeance=Date.now()+2*86400000; p.evoque=0; }
  });
  (Array.isArray(j.faits_nouveaux)?j.faits_nouveaux:[]).slice(0,5).forEach(function(f){ dossierAjouter('faits', f, 40); });
  (Array.isArray(j.a_venir)?j.a_venir:[]).slice(0,3).forEach(function(e){
    if(!e || !e.quoi) return; const d=dossierObj();
    if(d.aVenir.some(function(x){ return x.quoi===e.quoi && x.date===e.date; }) || dossierEfface(e.quoi)) return;
    d.aVenir.push({quoi:String(e.quoi).slice(0,120), date:String(e.date||'').slice(0,10)});
    if(d.aVenir.length>10) d.aVenir=d.aVenir.slice(-10);
  });
  if(j.hypothese_refusee) dossierAjouter('refusees', j.hypothese_refusee, 20);
  if(typeof rendreFil==='function') rendreFil();
}

/* ─────────── 4. le bloc « dossier » envoyé au modèle ─────────── */
function consigneLongueur(){
  const C={tres_court:'longueur : très courte, une ou deux phrases, l’essentiel.',
         court:'longueur : courte et nette, deux phrases la plupart du temps, trois au plus.',
         long:'longueur : tu peux développer quand le sujet le demande, jamais plus de deux paragraphes courts.',
         variable:'longueur : suis le moment. Court quand elle écrit court, plus développé quand elle demande d’expliquer.'};
  return C[cle('longueur')] || 'longueur : trois ou quatre phrases.';
}
function dossierTexte(){
  const r=etat.rep, L=['Dossier de la personne : tout son parcours d’accueil, puis ce que MAYND a appris dans les échanges. À utiliser en silence, sans jamais le réciter.'];
  const p=prenom(); if(p) L.push('prénom : '+p);
  L.push(fem() ? 'accord : la personne est une femme. Accorde au féminin tout ce qui la désigne (« tu es prête », « tu t’es sentie »).'
               : 'accord : adresse-toi à la personne au masculin (« tu es prêt », « tu t’es senti »).');
  L.push('formule : '+(abonne() ? 'MAYND (les seize accompagnants, la voix, la supervision par son professionnel référent)' : 'gratuite (MIA seule, sans accompagnant ni professionnel référent)'));
  const pr=profil(); L.push('profil MAYND : '+pr.nom+' — '+pr.desc);
  L.push('');
  L.push('Son compte-rendu, partie par partie. Il est écrit pour elle, à la deuxième personne : « tu », c’est elle. Quand une partie est marquée « corrigée par la personne », sa version fait foi sur tout le reste du dossier.');
  SECTIONS_CR.forEach(function(s){ L.push('« '+s.titre+' »'+(etat.cr.toi[s.id]!=null?' (corrigée par la personne)':'')+' : '+texteSection(s.id).replace(/\s*\n+\s*/g, ' ')); });
  L.push('');
  const ph=String(r.phrase||'').trim(); if(ph) L.push('ce qui l’amène, dans ses mots : « '+ph+' »');
  const items=boussoleItems(); if(items.length) L.push('boussole complète (1 à 10) : '+items.map(function(x){ return x.nom+' '+x.v; }).join(', '));
  const eq=equipe(); if(eq.length) L.push('accompagnants pressentis d’après son parcours : '+eq.join(', '));
  if(etat.presents.length>1) L.push('accompagnants déjà venus dans la discussion : '+etat.presents.filter(function(x){ return x!=='mia'; }).map(function(x){ return AG[x].nom; }).join(', '));
  dossierLignes().forEach(function(x){ L.push(x); });
  if(etat.signaux.length) L.push('signaux déjà transmis à son professionnel référent : '+etat.signaux.map(function(s){ return s.type; }).join(', '));
  if(typeof jeuxFaitsLignes==='function') jeuxFaitsLignes().forEach(function(x){ L.push(x); });
  L.push('');
  L.push('Comment lui parler. Ce sont ses choix : ils priment sur tes habitudes. Si sa version corrigée de « Comment MIA va te parler » dit autre chose, suis sa version.');
  const N={debutant:'elle découvre ces sujets : parle simplement, sans jargon, avec des exemples de la vie de tous les jours.',
           curieux:'elle connaît un peu ces sujets : reste simple ; tu peux nommer une notion si tu l’expliques en une phrase.',
           avance:'elle connaît bien ces sujets : tu peux aller plus loin, avec des outils précis et concrets.',
           accompagne:'elle a déjà été accompagnée : appuie-toi sur ce qu’elle sait déjà, et demande-lui ce qui avait marché.',
           sceptique:'elle n’y croit pas trop : pas de grands mots, du concret, des effets visibles vite.',
           mefiant:'elle se méfie de ce genre d’application : ne demande jamais plus que nécessaire, et dis clairement ce que tu fais de ce qu’elle te confie.'};
  if(N[cle('niveau')]) L.push('- niveau : '+N[cle('niveau')]);
  const f=nombre('franchise'); if(f) L.push('- '+(f<=2 ? 'franchise : en douceur. Tu poses les choses avec précaution, sans jamais les taire.' : f>=4 ? 'franchise : sans détour. Tu dis les choses clairement, jamais brutalement.' : 'franchise : directe, avec tact.'));
  L.push('- '+consigneLongueur());
  const pi=nombre('piste'); if(pi) L.push('- '+(pi<=2 ? 'elle préfère réfléchir : aide-la par des questions justes, une à la fois, plutôt que par des solutions.' : pi>=4 ? 'elle préfère des pistes concrètes : propose vite un pas faisable.' : 'équilibre questions et pistes concrètes.'));
  const H={oui:'humour : un trait léger est bienvenu, jamais sur ce qui fait mal.', tact:'humour : rare et délicat.', apres:'humour : seulement quand elle va mieux, jamais dans un moment difficile.', non:'humour : aucun.'};
  if(H[cle('humour')]) L.push('- '+H[cle('humour')]);
  const R={franche:'relances : quand un pas n’a pas été fait, relance franchement, sans culpabiliser.', douce:'relances : rappelle un pas non fait doucement, une seule fois.',
           comprendre:'relances : quand un pas n’a pas été fait, demande-lui ce qui a bloqué, sans juger.', plus_petit:'relances : quand un pas n’a pas été fait, propose un pas plus petit.',
           silence:'relances : n’évoque jamais un pas non fait, sauf si elle en parle.'};
  if(R[cle('relance')]) L.push('- '+R[cle('relance')]);
  return L.join('\n');
}
