/* ══════════════════════════════════════════════════════════════════════════
   MAYND, PARCOURS GUIDÉ — L'APPLICATION (13/11/2026)

   Un seul chemin, écran par écran :
   seuil → MIA se présente → huit étapes de questions (une par écran, avec
   « Ce que je retiens » à la fin de chacune) → ton profil → ton compte-rendu
   détaillé, que la personne peut corriger → ton équipe → ton professionnel
   référent → c'est prêt → la discussion avec MIA, qui fait venir les
   accompagnants.

   Tout est gardé sur l'appareil : en revenant, on reprend exactement au même
   endroit. Le compte-rendu corrigé par la personne fait foi : MIA s'en sert,
   et rien ne l'écrase jamais.

   L'état vit dans cette fermeture, jamais sur window. Les écrans se montrent
   par opacité, jamais par display:none.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var CLE='maynd.guide.v1';
var CLE_PREMIERE_APP='maynd.state.v7';   /* lue seulement, jamais écrite */
var MODELE='claude-sonnet-5-5';
var URL_API='https://api.anthropic.com/v1/messages';
var VERSION='Version 13/11 13:55';
var SOMBRE='#1B1530';
var SEP='\n\n';
var DUREE=/[?&]rapide\b/.test(location.search) ? 0 : 380;
var FENETRE_CRISE=30*60000;

var AG={}; ACCOMPAGNANTS.forEach(function(a){ AG[a.id]=a; });
var QX={}; MODULES.forEach(function(m){ m.questions.forEach(function(q){ QX[q.id]=q; }); });
var SECTION={}; SECTIONS_CR.forEach(function(s){ SECTION[s.id]=s; });

/* ─────────── état ─────────── */
function vide(){
  return {v:1, etape:0, rep:{}, autres:{}, fil:[], actif:'mia', presents:['mia'],
          actes:[], signaux:[], cle:'', cr:{mia:{}, toi:{}}, fini:false, vu:0};
}
function charger(){
  try{
    var s=JSON.parse(localStorage.getItem(CLE)||'null');
    if(s && s.v===1){ var e=vide(); for(var k in s) e[k]=s[k]; if(!e.cr || !e.cr.toi) e.cr={mia:{}, toi:{}}; return e; }
  }catch(_){}
  return vide();
}
var etat=charger();
function garder(){ etat.vu=Date.now(); try{ localStorage.setItem(CLE, JSON.stringify(etat)); }catch(_){} }

/* ─────────── texte : accord, prénom, échappement, typographie ─────────── */
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fem(){ return etat.rep.genre===1; }
function prenom(){ return String(etat.rep.prenom||'').trim(); }
function tx(s){
  return String(s==null?'':s).replace(/\{prenom\}/g, prenom())
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function(_, m, f){ return fem() ? f : m; });
}
function h(s){ return esc(tx(s)); }
/* Typographie française : espace insécable avant ? ! : ; » et après «, pour qu'aucun signe ne reste seul en début de ligne. */
function typo(s){ return String(s).replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« '); }
function minus(s){ s=String(s||''); return s.charAt(0).toLowerCase()+s.slice(1); }
function liste(a){ return a.length<2 ? a.join('') : a.slice(0,-1).join(', ')+' et '+a[a.length-1]; }
function minutes(n){ return Math.max(1, Math.round(n*25/60)); }
function remplir(gabarit, cle, valeur){ return tx(gabarit).replace(cle, function(){ return String(valeur); }); }

/* ─────────── le chemin ─────────── */
var ETAPES=[], TOTAL_Q=0;
ETAPES.push({t:'seuil'},{t:'mia'});
MODULES.forEach(function(m, mi){
  ETAPES.push({t:'intro', m:mi});
  m.questions.forEach(function(q, qi){ TOTAL_Q++; ETAPES.push({t:'q', m:mi, q:qi, n:TOTAL_Q}); });
  if(m.id!=='toi' && m.id!=='cap') ETAPES.push({t:'retenu', m:mi});
});
ETAPES.push({t:'profil'},{t:'compte'},{t:'equipe'},{t:'pro'},{t:'pret'},{t:'chat'});
function indexDe(t){ for(var i=0;i<ETAPES.length;i++){ if(ETAPES[i].t===t) return i; } return -1; }
function numeroAvant(i){ for(var j=Math.min(i, ETAPES.length-1); j>=0; j--){ if(ETAPES[j].n) return ETAPES[j].n; } return 0; }

/* ─────────── réponses ─────────── */
function opt(q, i){ var o=q.options[i]; return typeof o==='string' ? {t:o} : o; }
function valeurChoix(id){
  var q=QX[id], v=etat.rep[id];
  if(v===-1){ var a=String(etat.autres[id]||'').trim(); return a ? {t:a, autre:true} : null; }
  if(typeof v!=='number' || v<0 || !q.options || !q.options[v]) return null;
  return opt(q, v);
}
function choisi(id){ var o=valeurChoix(id); return o ? (o.autre ? o.t : tx(o.t)) : ''; }
function cle(id){ var o=valeurChoix(id); return o && o.k || ''; }
function choixMulti(id){
  var q=QX[id], L=[];
  (etat.rep[id]||[]).forEach(function(i){
    if(i===-1){ var a=String(etat.autres[id]||'').trim(); if(a) L.push({t:a, autre:true}); }
    else if(q.options[i]) L.push(opt(q, i));
  });
  return L;
}
function choisis(id){ return choixMulti(id).map(function(o){ return o.autre ? o.t : tx(o.t); }); }
/* Les choix multiples tels qu'ils s'écrivent dans une phrase adressée à la personne (« ton sommeil », pas « mon sommeil »). */
function libelles(id){ return choixMulti(id).map(function(o){ return o.autre ? '« '+cite(o.t)+' »' : (o.c ? tx(o.c) : minus(tx(o.t))); }); }
/* Un texte de la personne cité entre guillemets perd son point final : « … » suivi d'un point suffit. */
function cite(t){ return String(t||'').trim().replace(/[\s.]+$/, ''); }
function nombre(id){ var v=etat.rep[id]; return (typeof v==='number' && v>=1) ? v : 0; }
function noter(id, v){ etat.rep[id]=v; etat.cr.mia={}; garder(); }

/* La phrase qu'une réponse donne au compte-rendu et à « Ce que je retiens ». */
function phrase(id){
  var q=QX[id], v=etat.rep[id];
  if(q.type==='texte'){ var t=String(v||'').trim(); return t ? remplir(q.cr, '{x}', /«\s*\{x\}/.test(q.cr) ? cite(t) : t) : ''; }
  if(q.type==='choix'){
    var o=valeurChoix(id); if(!o) return '';
    if(o.r) return tx(o.r);
    /* Entre guillemets, la réponse est citée telle quelle ; ailleurs, elle entre dans la phrase.
       Les mots de la personne (« Autre ») sont toujours cités entre guillemets. */
    var cadre=/«\s*\{x\}/.test(q.cr||'');
    var x=o.autre ? (cadre ? cite(o.t) : '« '+cite(o.t)+' »') : (cadre ? tx(o.t) : minus(tx(o.t)));
    return q.cr ? remplir(q.cr, '{x}', x) : '';
  }
  if(q.type==='multi'){
    var l=libelles(id);
    return l.length ? remplir(q.cr, '{x}', liste(l)) : '';
  }
  if(q.type==='echelle') return nombre(id) ? tx(q.dits[v-1]) : '';
  if(q.type==='note') return nombre(id) ? remplir(q.cr, '{n}', v) : '';
  return '';
}
function boussoleItems(){
  var b=etat.rep.boussole;
  if(!b) return [];
  return QX.boussole.items.map(function(it){ return {k:it[0], nom:minus(it[1]), v:typeof b[it[0]]==='number'?b[it[0]]:5}; });
}
function boussoleHaut(){ return boussoleItems().sort(function(x, y){ return y.v-x.v; }).filter(function(x){ return x.v>=7; }).slice(0, 2); }
function boussoleBas(){ return boussoleItems().sort(function(x, y){ return x.v-y.v; }).filter(function(x){ return x.v<=4; }).slice(0, 2); }
function surDix(x){ return x.nom+' ('+x.v+' sur 10)'; }
function phrasesBoussole(){
  var items=boussoleItems(); if(!items.length) return [];
  var L=[], haut=boussoleHaut(), bas=boussoleBas();
  if(haut.length) L.push('Sur ta boussole, ce qui tient le mieux : '+liste(haut.map(surDix))+'.');
  if(bas.length) L.push('Ce qui est le plus bas : '+liste(bas.map(surDix))+'.');
  var moy=items.reduce(function(s, x){ return s+x.v; }, 0)/items.length;
  L.push('En moyenne, ta boussole est à '+moy.toFixed(1).replace('.', ',')+' sur 10.');
  return L;
}

/* ─────────── profil MAYND : quatre pôles ─────────── */
function poles(){
  var s={M:0, R:0, A:0, S:0};
  function ajoute(p, n){ if(!p) return; if(p.length===2){ s[p[0]]+=n/2; s[p[1]]+=n/2; } else s[p]+=n; }
  MODULES.forEach(function(m){ m.questions.forEach(function(q){
    if(q.type==='echelle' && (q.pg || q.pd)){
      var v=nombre(q.id), n=q.poids||2; if(!v) return;
      if(v<=2) ajoute(q.pg, n); else if(v>=4) ajoute(q.pd, n); else { ajoute(q.pg, n/2); ajoute(q.pd, n/2); }
    } else if(q.type==='choix' && q.poids){
      var o=valeurChoix(q.id); if(o && o.p) ajoute(o.p, q.poids);
    }
  }); });
  return s;
}
function profil(){
  var s=poles(), ordre=['M','R','A','S'];
  var tri=ordre.slice().sort(function(a, b){ return s[b]-s[a]; });
  var top=s[tri[0]];
  var c=ordre.filter(function(p){ return s[p]>0 && s[p]>=top-1; }).join('');
  if(!PROFILS[c]) c=ordre.filter(function(p){ return p===tri[0] || p===tri[1]; }).join('');
  if(!PROFILS[c]) c=tri[0];
  var P=PROFILS[c];
  return {cle:c, nom:fem()?P.nomF:P.nom, desc:P.desc, scores:s};
}

/* ─────────── l'équipe pressentie ─────────── */
function equipe(){
  var sc={};
  ACCOMPAGNANTS.forEach(function(a){ if(a.id!=='mia') sc[a.id]=0; });
  function ajoute(ag){ if(ag) Object.keys(ag).forEach(function(id){ if(id in sc) sc[id]+=ag[id]; }); }
  MODULES.forEach(function(m){ m.questions.forEach(function(q){
    if(q.type==='choix'){ var o=valeurChoix(q.id); if(o) ajoute(o.ag); }
    else if(q.type==='multi') choixMulti(q.id).forEach(function(o){ ajoute(o.ag); });
  }); });
  var lien={sommeil:'miro', energie:'miro', moral:'ava', confiance:'felix', travail:'mateo', amour:'leo', amis:'iris', argent:'vince', corps:'nora', sens:'atlas'};
  boussoleItems().forEach(function(x){ if(lien[x.k] && x.v<=4) sc[lien[x.k]]+=(5-x.v); });
  return Object.keys(sc).filter(function(id){ return sc[id]>0; })
    .sort(function(a, b){ return sc[b]-sc[a]; }).slice(0, 3);
}

/* ─────────── « Ce que je retiens », à la fin de chaque étape ─────────── */
function retenu(m){
  var L=[];
  m.questions.forEach(function(q){
    if(q.type==='boussole'){ var hb=boussoleHaut(), bb=boussoleBas();
      if(hb.length) L.push('Ce qui tient le mieux : '+liste(hb.map(surDix))+'.');
      if(bb.length) L.push('Ce qui est le plus bas : '+liste(bb.map(surDix))+'.');
    } else { var p=phrase(q.id); if(p) L.push(p); }
  });
  return L.slice(0, 8);
}

/* ─────────── le compte-rendu ───────────
   Trois versions possibles pour chaque partie, dans cet ordre de priorité :
   celle que la personne a corrigée (toi), celle que MIA a écrite (mia), celle que l'application compose (locale). */
function paragraphesDe(L, par){
  par=par||4; var P=[];
  for(var i=0;i<L.length;i+=par) P.push(L.slice(i, i+par).join(' '));
  return P.join('\n\n');
}
function croisements(id){
  var r=etat.rep, L=[];
  if(id==='fonctionnement'){
    if(nombre('projet') && nombre('decision') && r.projet<=2 && r.decision<=2) L.push('Tu avances avec méthode : tu prépares, tu analyses, puis tu décides.');
    if(nombre('projet')>=4 && nombre('decision')>=4) L.push("Tu fonctionnes à l'instinct, et tu le sais.");
    if(nombre('exigence')>=4 && nombre('emotions')>=4) L.push('Tu demandes beaucoup à toi-même, souvent sans le montrer.');
  }
  if(id==='reactions'){
    if(cle('echec')==='nul' && nombre('exigence')>=4) L.push('Ton exigence envers toi rend tes échecs lourds à porter.');
    if(cle('desaccord')==='efface' && cle('compliment')==='minimise') L.push(tx('Tu as tendance à te faire {petit|petite}, dans les désaccords comme face aux compliments.'));
  }
  if(id==='energie'){
    if(cle('heures')==='court' && cle('reveil')==='fatigue') L.push('Tes nuits sont courtes et ton réveil est difficile : ton sommeil est sans doute la première chose à regarder.');
    if(cle('ecrans')==='tard' && cle('heures')==='court') L.push('Les écrans du soir prennent sur ton temps de sommeil.');
  }
  return L;
}
function brefLocal(){
  var p=profil(), pr=prenom(), L=[];
  L.push((pr ? pr+', ton' : 'Ton')+" profil MAYND, c'est "+p.nom+'. '+p.desc);
  var per=phrase('periode'); if(per) L.push(per);
  var s=libelles('sujets'); if(s.length) L.push('Ce qui prend le plus de place : '+liste(s)+'.');
  var v=libelles('valeurs'); if(v.length) L.push('Ce qui compte le plus pour toi : '+liste(v)+'.');
  if(etat.rep.cap) L.push('Ton cap : « '+cite(etat.rep.cap)+' ».');
  return paragraphesDe(L, 3);
}
function appuisLocal(){
  var r=etat.rep, A=[], V=[];
  var vals=libelles('valeurs'); if(vals.length) A.push('Tu sais ce qui compte pour toi : '+liste(vals)+". C'est une boussole solide.");
  if(nombre('pret')>=7) A.push(tx("Tu es {prêt|prête} à t'y mettre (")+r.pret+" sur 10) : c'est le meilleur point de départ.");
  if(cle('soutien')==='proche') A.push('Quand ça va mal, tu sais te tourner vers les autres.');
  if(cle('pression')==='froid') A.push('Sous pression, tu gardes la tête froide.');
  if(nombre('imprevu')>=4) A.push("Tu t'adaptes vite à l'imprévu.");
  if(cle('echec')==='tirer') A.push('Tu fais de tes échecs des leçons.');
  var f=cite(r.fierte); if(f) A.push('Tu as des fiertés concrètes : « '+f+' ».');
  var hb=boussoleHaut(); if(hb.length) A.push("Tu peux t'appuyer sur ce qui tient : "+liste(hb.map(function(x){ return x.nom; }))+'.');
  if(!A.length) A.push('Tu as pris le temps de répondre à '+TOTAL_Q+" questions sur toi : c'est déjà un appui.");
  if(nombre('exigence')>=4 && (cle('echec')==='nul' || cle('compliment')==='minimise')) V.push(tx('Tu es très {exigeant|exigeante} avec toi-même, et ton dialogue intérieur peut être dur.'));
  if(cle('soutien')==='seul') V.push(tx("Tu gères souvent {seul|seule} : demander de l'aide pourrait changer beaucoup."));
  if(cle('desaccord')==='efface') V.push("Dans les désaccords, tu as tendance à t'effacer.");
  if(cle('calme')==='long') V.push('Une émotion forte te reste longtemps.');
  if(cle('heures')==='court' || cle('reveil')==='fatigue') V.push('Ton sommeil ne te recharge pas assez.');
  if(cle('ecrans')==='tard') V.push('Les écrans du soir grignotent ton repos.');
  if(cle('pression')==='repousse') V.push('Quand la pression monte, tu repousses.');
  if(nombre('emotions')>=4) V.push('Tu gardes beaucoup pour toi.');
  var bb=boussoleBas(); if(bb.length) V.push('Ce qui est le plus bas en ce moment : '+liste(bb.map(function(x){ return x.nom; }))+'.');
  if(!V.length) V.push('Rien ne ressort nettement. MIA restera attentive à ce que tu lui diras.');
  return 'Tes appuis : '+A.join(' ')+'\n\nTes points de vigilance : '+V.join(' ');
}
function texteLocal(id){
  if(id==='bref') return brefLocal();
  if(id==='appuis') return appuisLocal();
  var L=[];
  SECTION[id].q.forEach(function(qid){
    if(qid==='boussole') L=L.concat(phrasesBoussole());
    else { var p=phrase(qid); if(p) L.push(p); }
  });
  L=L.concat(croisements(id));
  return L.length ? paragraphesDe(L) : "Tu n'as pas encore répondu à cette partie.";
}
function texteSection(id){
  if(etat.cr.toi[id]!=null) return etat.cr.toi[id];
  if(etat.cr.mia[id]) return etat.cr.mia[id];
  return texteLocal(id);
}

/* ─────────── le dossier de la personne, pour le modèle ─────────── */
function dossier(){
  var r=etat.rep, L=['Dossier de la personne : tout son parcours d\'accueil. À utiliser en silence, sans jamais le réciter.'];
  var p=prenom(); if(p) L.push('prénom : '+p);
  L.push(fem() ? 'accord : la personne est une femme. Accorde au féminin tout ce qui la désigne (« tu es prête », « tu t\'es sentie »).'
               : 'accord : adresse-toi à la personne au masculin (« tu es prêt », « tu t\'es senti »).');
  L.push('formule : MAYND (les seize accompagnants, la supervision par son professionnel référent)');
  var pr=profil(); L.push('profil MAYND : '+pr.nom+' — '+pr.desc);
  L.push('');
  L.push('Son compte-rendu, partie par partie. Il est écrit pour elle, à la deuxième personne : « tu », c\'est elle. Quand une partie est marquée « corrigée par la personne », sa version fait foi sur tout le reste du dossier.');
  SECTIONS_CR.forEach(function(s){
    L.push('« '+s.titre+' »'+(etat.cr.toi[s.id]!=null?' (corrigée par la personne)':'')+' : '+texteSection(s.id).replace(/\s*\n+\s*/g, ' '));
  });
  L.push('');
  var ph=String(r.phrase||'').trim(); if(ph) L.push('ce qui l\'amène, dans ses mots : « '+ph+' »');
  var items=boussoleItems(); if(items.length) L.push('boussole complète (1 à 10) : '+items.map(function(x){ return x.nom+' '+x.v; }).join(', '));
  var eq=equipe(); if(eq.length) L.push('accompagnants pressentis d\'après son parcours : '+eq.join(', '));
  var faits=etat.actes.filter(function(a){ return a.fait; }), ouverts=etat.actes.filter(function(a){ return !a.fait; });
  if(ouverts.length) L.push('pas en cours, à ne pas reproposer sous une autre forme : '+ouverts.slice(-5).map(function(a){ return a.quoi+(a.quand?' ('+a.quand+')':''); }).join(' ; '));
  if(faits.length) L.push('pas déjà faits : '+faits.slice(-5).map(function(a){ return a.quoi; }).join(' ; '));
  if(etat.signaux.length) L.push('signaux déjà transmis à son professionnel référent : '+etat.signaux.map(function(s){ return s.type; }).join(', '));
  L.push('');
  L.push('Comment lui parler. Ce sont ses choix : ils priment sur tes habitudes. Si sa version corrigée de « Comment MIA va te parler » dit autre chose, suis sa version.');
  var N={debutant:'elle découvre ces sujets : parle simplement, sans jargon, avec des exemples de la vie de tous les jours.',
         curieux:'elle connaît un peu ces sujets : reste simple ; tu peux nommer une notion si tu l\'expliques en une phrase.',
         avance:'elle connaît bien ces sujets : tu peux aller plus loin, avec des outils précis et concrets.',
         accompagne:'elle a déjà été accompagnée : appuie-toi sur ce qu\'elle sait déjà, et demande-lui ce qui avait marché.',
         sceptique:'elle n\'y croit pas trop : pas de grands mots, du concret, des effets visibles vite.',
         mefiant:'elle se méfie de ce genre d\'application : ne demande jamais plus que nécessaire, et dis clairement ce que tu fais de ce qu\'elle te confie.'};
  if(N[cle('niveau')]) L.push('- niveau : '+N[cle('niveau')]);
  var f=nombre('franchise'); if(f) L.push('- '+(f<=2 ? 'franchise : en douceur. Tu poses les choses avec précaution, sans jamais les taire.'
                                                  : f>=4 ? 'franchise : sans détour. Tu dis les choses clairement, jamais brutalement.' : 'franchise : directe, avec tact.'));
  L.push('- '+consigneLongueur());
  var pi=nombre('piste'); if(pi) L.push('- '+(pi<=2 ? 'elle préfère réfléchir : aide-la par des questions justes, une à la fois, plutôt que par des solutions.'
                                                    : pi>=4 ? 'elle préfère des pistes concrètes : propose vite un pas faisable.' : 'équilibre questions et pistes concrètes.'));
  var H={oui:'humour : un trait léger est bienvenu, jamais sur ce qui fait mal.', tact:'humour : rare et délicat.', apres:'humour : seulement quand elle va mieux, jamais dans un moment difficile.', non:'humour : aucun.'};
  if(H[cle('humour')]) L.push('- '+H[cle('humour')]);
  var R={franche:'relances : quand un pas n\'a pas été fait, relance franchement, sans culpabiliser.', douce:'relances : rappelle un pas non fait doucement, une seule fois.',
         comprendre:'relances : quand un pas n\'a pas été fait, demande-lui ce qui a bloqué, sans juger.', plus_petit:'relances : quand un pas n\'a pas été fait, propose un pas plus petit.',
         silence:'relances : n\'évoque jamais un pas non fait, sauf si elle en parle.'};
  if(R[cle('relance')]) L.push('- '+R[cle('relance')]);
  return L.join('\n');
}
function consigneLongueur(){
  var C={tres_court:'longueur : très courte, une ou deux phrases, l\'essentiel.',
         court:'longueur : courte et nette, deux phrases la plupart du temps, trois au plus.',
         long:'longueur : tu peux développer quand le sujet le demande, jamais plus de deux paragraphes courts.',
         variable:'longueur : suis le moment. Court quand elle écrit court, plus développé quand elle demande d\'expliquer.'};
  return C[cle('longueur')] || 'longueur : trois ou quatre phrases.';
}

/* ─────────── petits morceaux d'interface ─────────── */
function teinteDe(hex, k){
  k=k==null?0.86:k;
  var n=parseInt(hex.slice(1), 16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function m(c){ return Math.round(c+(255-c)*k); }
  return 'rgb('+m(r)+','+m(g)+','+m(b)+')';
}
function avatar(id, taille){
  var a=AG[id];
  return '<span class="av'+(taille?' '+taille:'')+'" style="background:'+a.couleur+';color:'+(a.encre||'#FFFFFF')+'" aria-hidden="true">'+a.nom.charAt(0)+'</span>';
}
function bouton(t, action, extra){ return '<button class="btn" data-action="'+action+'"'+(extra||'')+'>'+esc(t)+'</button>'; }
function lienBouton(t, action){ return '<button class="lien" data-action="'+action+'">'+esc(t)+'</button>'; }
function paragraphes(t){
  return String(t||'').split(/\n{2,}/).map(function(p){
    return '<p>'+esc(p.trim()).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')+'</p>';
  }).join('');
}
function barre(){
  var n=numeroAvant(etat.etape), pct=Math.round(100*n/TOTAL_Q);
  return '<header class="barre"><button class="b-retour" data-action="retour" aria-label="Revenir en arrière">←</button>'
    +'<div class="progression" role="progressbar" aria-label="Avancement" aria-valuemin="0" aria-valuemax="'+TOTAL_Q+'" aria-valuenow="'+n+'"><span style="width:'+pct+'%"></span></div></header>';
}
function theme(fond, encre, teinte){
  var s=document.documentElement.style;
  s.setProperty('--fond', fond); s.setProperty('--encre', encre||'#FFFFFF'); s.setProperty('--teinte', teinte||'#EDE1FF');
  var meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute('content', fond);
}
function dernierPas(){ for(var i=etat.actes.length-1;i>=0;i--){ if(!etat.actes[i].fait) return etat.actes[i]; } return null; }

/* ─────────── les écrans ─────────── */
var RENDUS={};

RENDUS.seuil=function(){
  var p=prenom(), corps;
  if(etat.fini){
    var pas=dernierPas();
    corps='<p class="sur">Bon retour'+(p?', '+esc(p):'')+'.</p><h1 class="grand">MIA reprend là où vous en étiez.</h1>'
      +(pas?'<p class="note-pas">Ton pas en cours : '+esc(pas.quoi)+(pas.quand?' · '+esc(pas.quand):'')+'</p>':'')
      +bouton('Retrouver MIA', 'retrouver')+lienBouton('Revoir mon compte-rendu', 'cr-ouvrir');
  } else if(etat.etape>1){
    var n=numeroAvant(etat.etape);
    corps='<p class="sur">Bon retour'+(p?', '+esc(p):'')+'.</p><h1 class="grand">'+h("On reprend où tu t'étais {arrêté|arrêtée} ?")+'</h1>'
      +'<p class="texte">'+(n ? 'Tu en étais à la question '+n+' sur '+TOTAL_Q+'. Tout est gardé.' : 'Tout est gardé.')+'</p>'
      +bouton('Reprendre', 'reprendre')+'<button class="lien" data-action="recommencer">Tout recommencer</button>';
  } else {
    corps='<h1 class="marque">MAYND</h1><p class="slogan">Pour tous, partout, tout le temps.</p>'
      +'<p class="texte">Un parcours guidé, de bout en bout. Au bout du chemin, MIA t\'attend.</p>'+bouton('Commencer', 'commencer');
  }
  return {fond:'#974AF0', html:'<div class="centre seuil">'+corps+'</div>'
    +'<footer class="pied"><button class="lien-discret" data-action="reglages">Réglages</button><span>'+VERSION+'</span></footer>'};
};

RENDUS.mia=function(){
  return {fond:'#974AF0', html:'<div class="centre">'+avatar('mia', 'grand')
    +'<h1 class="grand">Je suis MIA.</h1>'
    +'<p class="texte">Avant qu\'on parle, je vais prendre le temps de te connaître. Vraiment.</p>'
    +'<p class="texte">'+MODULES.length+' étapes, '+TOTAL_Q+' questions, environ '+(Math.round(TOTAL_Q*25/60/5)*5)+' minutes. Il n\'y a pas de bonne réponse. Si une question ne te parle pas, « Autre » ou « Je ne sais pas » sont là.</p>'
    +'<p class="texte">'+h("Tu peux t'arrêter quand tu veux et fermer la page. Je garde tout, et on reprend exactement là où tu t'es {arrêté|arrêtée}.")+'</p>'
    +bouton('On commence', 'suivant')+'</div>'};
};

RENDUS.intro=function(e){
  var m=MODULES[e.m], n=m.questions.length;
  return {fond:m.fond, encre:m.encre, teinte:m.teinte, html:barre()+'<div class="centre">'
    +'<p class="sur">Étape '+(e.m+1)+' sur '+MODULES.length+'</p><h1 class="grand">'+h(m.titre)+'</h1>'
    +'<p class="texte">'+h(m.sous)+'</p><p class="mesure">'+n+' question'+(n>1?'s':'')+' · '+minutes(n)+' min</p>'
    +bouton("C'est parti", 'suivant')+'</div>'};
};

function champAutre(q, visible){
  return '<div class="autre" id="autre"'+(visible?'':' hidden')+'><input class="champ" id="champ-autre" type="text" maxlength="200" placeholder="Avec tes mots, si tu veux" value="'+esc(etat.autres[q.id]||'')+'">'
    +(q.type==='choix' ? '<button class="btn" data-action="valider-autre" data-q="'+q.id+'">Continuer</button>' : '')+'</div>';
}
var CONTROLES={
  texte:function(q){
    var v=String(etat.rep[q.id]||'');
    var champ=q.ligne
      ? '<input class="champ" id="champ" type="text" autocomplete="given-name" maxlength="40" placeholder="'+h(q.exemple)+'" value="'+esc(v)+'">'
      : '<textarea class="champ" id="champ" rows="3" maxlength="600" placeholder="'+h(q.exemple)+'">'+esc(v)+'</textarea>';
    return (q.idees?ideesCap():'')+champ+'<div class="actions">'
      +'<button class="btn" data-action="valider-texte" data-q="'+q.id+'"'+(q.requis && !v.trim()?' disabled':'')+'>Continuer</button>'
      +(q.requis?'':'<button class="lien" data-action="passer" data-q="'+q.id+'">Passer</button>')+'</div>';
  },
  choix:function(q){
    var cur=etat.rep[q.id];
    var o=q.options.map(function(x, i){
      return '<button class="opt'+(cur===i?' choisi':'')+'" data-action="choix" data-q="'+q.id+'" data-i="'+i+'">'+h(opt(q, i).t)+'</button>';
    }).join('');
    if(q.autre) o+='<button class="opt'+(cur===-1?' choisi':'')+'" data-action="choix-autre" data-q="'+q.id+'">Autre</button>'+champAutre(q, cur===-1);
    return '<div class="options">'+o+'</div>';
  },
  multi:function(q){
    var cur=etat.rep[q.id]||[];
    function pastille(i, texte){
      var on=cur.indexOf(i)>=0;
      return '<button class="opt'+(on?' choisi':'')+'" data-action="multi" data-q="'+q.id+'" data-i="'+i+'" aria-pressed="'+on+'">'+texte+'</button>';
    }
    return '<div class="options multi">'+q.options.map(function(x, i){ return pastille(i, h(opt(q, i).t)); }).join('')+(q.autre?pastille(-1, 'Autre'):'')+'</div>'
      +(q.autre?champAutre(q, cur.indexOf(-1)>=0):'')
      +'<div class="actions"><span class="compte" id="compte">'+cur.length+' sur '+q.max+'</span>'
      +'<button class="btn" data-action="suivant-multi" data-q="'+q.id+'"'+(cur.length?'':' disabled')+'>Continuer</button></div>';
  },
  echelle:function(q){
    var cur=etat.rep[q.id], g=tx(q.gauche), d=tx(q.droite);
    var noms=[g, 'Plutôt : '+g, 'Entre les deux', 'Plutôt : '+d, d], pts='';
    for(var i=1;i<=5;i++) pts+='<button class="point'+(cur===i?' choisi':'')+'" data-action="echelle" data-q="'+q.id+'" data-v="'+i+'" aria-label="'+esc(noms[i-1])+'"><i></i></button>';
    return '<div class="echelle"><div class="poles"><span>'+esc(g)+'</span><span>'+esc(d)+'</span></div><div class="points">'+pts+'</div></div>'
      +'<button class="lien" data-action="nsp" data-q="'+q.id+'">Je ne sais pas</button>';
  },
  note:function(q){
    var cur=etat.rep[q.id], b='';
    for(var i=1;i<=10;i++) b+='<button class="chiffre'+(cur===i?' choisi':'')+'" data-action="note" data-q="'+q.id+'" data-v="'+i+'">'+i+'</button>';
    return '<div class="note"><div class="chiffres">'+b+'</div><div class="poles"><span>'+h(q.gauche)+'</span><span>'+h(q.droite)+'</span></div></div>'
      +'<button class="lien" data-action="nsp" data-q="'+q.id+'">Je ne sais pas</button>';
  },
  boussole:function(q){
    var cur=etat.rep[q.id]||{};
    return '<div class="boussole">'+q.items.map(function(it){
        var v=typeof cur[it[0]]==='number'?cur[it[0]]:5;
        return '<label class="curseur"><span class="c-nom">'+h(it[1])+'</span><input type="range" min="1" max="10" step="1" value="'+v+'" data-k="'+it[0]+'"><output>'+v+'</output></label>';
      }).join('')+'</div><div class="actions"><button class="btn" data-action="valider-boussole" data-q="'+q.id+'">Continuer</button></div>';
  }
};
function ideesCap(){
  var ids=[];
  choixMulti('sujets').forEach(function(o){
    Object.keys(o.ag||{}).sort(function(a, b){ return o.ag[b]-o.ag[a]; }).forEach(function(id){ if(ids.indexOf(id)<0) ids.push(id); });
  });
  equipe().forEach(function(id){ if(ids.indexOf(id)<0) ids.push(id); });
  var idees=ids.slice(0, 4).map(function(id){ return IDEES_CAP[id]; }).filter(Boolean);
  if(!idees.length) return '';
  return '<div class="idees">'+idees.map(function(t){ return '<button class="idee" data-action="idee" data-texte="'+esc(t)+'">'+esc(t)+'</button>'; }).join('')+'</div>';
}

RENDUS.q=function(e){
  var m=MODULES[e.m], q=m.questions[e.q];
  return {fond:m.fond, encre:m.encre, teinte:m.teinte,
    html:barre()+'<div class="question"><p class="sur">'+h(m.titre)+' · '+e.n+' sur '+TOTAL_Q+'</p>'
      +'<h1 class="q-titre">'+h(q.titre)+'</h1>'+(q.aide?'<p class="aide">'+h(q.aide)+'</p>':'')+CONTROLES[q.type](q)+'</div>',
    apres:function(){ brancherQuestion(q); }};
};
function brancherQuestion(q){
  var champ=document.getElementById('champ');
  if(champ){
    var btn=document.querySelector('[data-action="valider-texte"]');
    champ.addEventListener('input', function(){ if(q.requis) btn.disabled=!champ.value.trim(); });
    champ.addEventListener('keydown', function(ev){
      if(ev.key==='Enter' && (q.ligne || ev.ctrlKey || ev.metaKey) && !btn.disabled){ ev.preventDefault(); btn.click(); }
    });
    if(window.matchMedia && window.matchMedia('(pointer:fine)').matches) champ.focus();
  }
  if(q.type==='boussole'){
    Array.prototype.forEach.call(document.querySelectorAll('.curseur input'), function(r){
      r.addEventListener('input', function(){ r.nextElementSibling.textContent=r.value; });
    });
  }
  var autre=document.getElementById('champ-autre');
  if(autre && q.type==='choix') autre.addEventListener('keydown', function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); document.querySelector('[data-action="valider-autre"]').click(); } });
}

RENDUS.retenu=function(e){
  var m=MODULES[e.m], lignes=retenu(m), suite=MODULES[e.m+1];
  return {fond:m.fond, encre:m.encre, teinte:m.teinte, html:barre()+'<div class="centre"><p class="sur">Ce que je retiens</p>'
    +'<ul class="retenu">'+(lignes.length ? lignes.map(function(l){ return '<li>'+esc(l)+'</li>'; }).join('') : '<li>Tu as passé cette étape. On y reviendra si tu veux.</li>')+'</ul>'
    +bouton(suite ? 'Étape suivante : '+tx(suite.titre) : 'Continuer', 'suivant')+'</div>'};
};

var NOMS_POLES={M:"L'action", R:'Le lien', A:'Se poser', S:"L'analyse"};
RENDUS.profil=function(){
  var p=profil(), max=Math.max(1, p.scores.M, p.scores.R, p.scores.A, p.scores.S);
  var jauges='<div class="jauges">'+['M','R','A','S'].map(function(k){
      return '<div class="jauge"><span>'+NOMS_POLES[k]+'</span><b><i style="width:'+Math.round(100*p.scores[k]/max)+'%"></i></b></div>';
    }).join('')+'</div>';
  return {fond:'#6F2FC0', teinte:'#E6D9FF', html:'<div class="centre"><p class="sur">Ton profil MAYND</p>'
    +'<h1 class="geant">'+esc(p.nom)+'</h1><p class="texte">'+esc(p.desc)+'</p>'+jauges+bouton('Continuer', 'suivant')+'</div>'};
};

/* ─────────── le compte-rendu : affichage et correction ─────────── */
function carteCR(id, edition){
  var s=SECTION[id], corrige=etat.cr.toi[id]!=null, t=texteSection(id);
  var corps=edition
    ? '<label class="etiquette" for="cr-champ-'+id+'">Écris-le comme c\'est vraiment pour toi.</label>'
      +'<textarea class="champ cr-champ" id="cr-champ-'+id+'" rows="7">'+esc(t)+'</textarea>'
      +'<div class="actions">'+bouton('Enregistrer', 'cr-enregistrer', ' data-id="'+id+'"')+'<button class="lien" data-action="cr-annuler" data-id="'+id+'">Annuler</button></div>'
    : '<div class="cr-texte">'+paragraphes(t)+'</div>'
      +(corrige ? '<p class="cr-note">Corrigé par toi · <button class="lien-inline" data-action="cr-retablir" data-id="'+id+'">Revenir au texte d\'origine</button></p>' : '');
  return '<section class="cr-carte" data-section="'+id+'" style="--c:'+s.fond+';--t:'+s.teinte+'">'
    +'<header><h2>'+esc(s.titre)+'</h2>'+(edition?'':'<button class="lien-inline" data-action="cr-corriger" data-id="'+id+'">Corriger</button>')+'</header>'+corps+'</section>';
}
function cartesCR(){ return SECTIONS_CR.map(function(s){ return carteCR(s.id, false); }).join(''); }
function remplacerCarte(id, edition){
  var el=document.querySelector('.cr-carte[data-section="'+id+'"]'); if(!el) return;
  var tmp=document.createElement('div'); tmp.innerHTML=typo(carteCR(id, edition));
  var neuve=tmp.firstChild; el.parentNode.replaceChild(neuve, el);
  if(edition){
    var c=document.getElementById('cr-champ-'+id);
    var ajuste=function(){ c.style.height='auto'; c.style.height=(c.scrollHeight+4)+'px'; };
    c.addEventListener('input', ajuste); ajuste(); c.focus();
  }
}
function etatCR(texte){ var el=document.getElementById('cr-etat'); if(el) el.textContent=texte||''; }

RENDUS.compte=function(){
  var p=prenom();
  return {fond:'#F5EFFE', encre:SOMBRE, teinte:'#E9DDFB', classe:'ecran-document', html:'<div class="document">'
    +'<p class="sur">Ton compte-rendu</p>'
    +'<h1 class="grand">'+(p ? esc(p)+', tout' : 'Tout')+' ce que j\'ai compris de toi.</h1>'
    +'<p class="texte">Lis-le tranquillement. Si quelque chose sonne faux, corrige-le : c\'est ta version qui compte, et c\'est elle que MIA utilisera.</p>'
    +'<p class="cr-etat" id="cr-etat" aria-live="polite"></p>'
    +'<div class="cr-liste">'+cartesCR()+'</div>'
    +bouton("C'est bien moi", 'suivant')+'</div>',
    apres:function(){ if(etat.cle && !Object.keys(etat.cr.mia).length) lancerCompteRendu(); }};
};

var crEnCours=false;
function decouperSections(t){
  var parts={}, morceaux=String(t||'').split(/\[\[\s*SECTION\s*:\s*([a-z_]+)\s*\]\]/i);
  for(var i=1;i<morceaux.length;i+=2){
    var id=morceaux[i].toLowerCase(), texte=lireBalises(morceaux[i+1]||'').texte;
    if(SECTION[id] && texte) parts[id]=texte;
  }
  return parts;
}
async function lancerCompteRendu(){
  if(!etat.cle || crEnCours) return;
  var ids=SECTIONS_CR.map(function(s){ return s.id; }).filter(function(id){ return etat.cr.toi[id]==null; });
  if(!ids.length) return;
  crEnCours=true; etatCR('MIA relit tes réponses et affine ton compte-rendu…');
  var GUIDE={bref:"l'essentiel : son profil, sa période, ce qui compte, son cap. 3 à 4 phrases.",
    situation:'ce qu\'elle fait dans la vie, avec qui elle vit, sa période, ce qui pèse, ce qui tient.',
    fonctionnement:'sa façon d\'avancer, de décider, de se recharger, ce qui la fait avancer, son rythme.',
    reactions:'comment elle réagit sous pression, après un échec, dans un désaccord, face à une émotion forte, à un compliment, quand ça va mal, face à l\'imprévu.',
    interets:'ses valeurs, ses points d\'intérêt, ce qui l\'apaise, ses fiertés, ce qu\'elle veut voir changer, ce qu\'elle ne veut plus vivre.',
    energie:'son sommeil, son énergie, son rapport au mouvement et aux écrans.',
    appuis:'deux paragraphes : le premier commence par « Tes appuis : », le second par « Tes points de vigilance : ».',
    echange:'comment MIA va lui parler, d\'après ses choix et son niveau de connaissance de ces sujets.',
    cap:'son cap, pourquoi maintenant, le signe que ça avance, à quel point elle est prête.'};
  var tour="Consigne pour cette réponse :\nTu écris le compte-rendu détaillé que la personne lit à la fin de son parcours d'accueil. Il doit l'aider à se comprendre : comment elle fonctionne, ce qu'elle fait, ce qui l'intéresse, comment elle réagit selon les situations. "
    +'Écris ces parties, dans cet ordre, chacune précédée de sa balise seule sur sa ligne :\n'
    +ids.map(function(id){ return '[[SECTION:'+id+']] '+SECTION[id].titre+' : '+GUIDE[id]; }).join('\n')
    +"\nRègles : deuxième personne ; trois à six phrases par partie ; concret, accroché à ses réponses et à ses mots ; relie entre elles des réponses qu'elle n'aurait pas rapprochées ; une lecture se propose comme une hypothèse, jamais comme un verdict ; aucune étiquette, aucun vocabulaire clinique, aucune flatterie, aucune question, aucune autre balise.";
  try{
    var res=await appeler(systeme('mia', tour), [{role:'user', content:'(Écris mon compte-rendu.)'}], 4000);
    if(!res.refus){
      var parts=decouperSections(res.texte);
      ids.forEach(function(id){ if(parts[id] && etat.cr.toi[id]==null) etat.cr.mia[id]=parts[id]; });
      garder();
      ids.forEach(function(id){
        var el=document.querySelector('.cr-carte[data-section="'+id+'"]');
        if(el && !el.querySelector('textarea')) remplacerCarte(id, false);
      });
    }
    etatCR(res.refus ? '' : 'Compte-rendu affiné par MIA.');
  }catch(_){ etatCR(''); }
  crEnCours=false;
}

RENDUS.equipe=function(){
  var t=equipe();
  var cartes='<div class="carte-ag">'+avatar('mia')+'<div><strong>MIA</strong><span>Co-pilote</span><p>Elle te parle en premier, toujours.</p></div></div>'
    +t.map(function(id){ var a=AG[id];
      return '<div class="carte-ag">'+avatar(id)+'<div><strong>'+esc(a.nom)+'</strong><span>'+esc(a.domaine)+'</span><p>'+h(APPORTS[id])+'</p></div></div>'; }).join('');
  return {fond:'#224CF2', teinte:'#DFE8FF', html:'<div class="centre"><p class="sur">Ton équipe</p>'
    +'<h1 class="grand">Les seize accompagnants sont là pour toi.</h1>'
    +'<p class="texte">'+(t.length ? 'MIA fera venir celui qui t\'aidera, au bon moment. D\'après ton parcours, les premiers seront sans doute :'
                                    : 'MIA fera venir celui qui t\'aidera, au bon moment.')+'</p>'
    +'<div class="cartes">'+cartes+'</div>'+bouton('Continuer', 'suivant')+'</div>'};
};

RENDUS.pro=function(){
  return {fond:'#00A862', teinte:'#D8F2E4', html:'<div class="centre"><p class="sur">Ton professionnel référent</p>'
    +'<h1 class="grand">Quelqu\'un veille sur ton parcours.</h1>'
    +'<p class="texte">Un professionnel référent certifié suit ton parcours MAYND. Il signe ta feuille de route en début de mois, et ton bilan en fin de mois.</p>'
    +'<p class="texte">Aucun rendez-vous à prendre. Il intervient quand un signal le justifie :</p>'
    +'<ul class="signaux">'
    +'<li><strong>Stagnation</strong>Rien ne bouge depuis un moment.</li>'
    +'<li><strong>Blocage</strong>'+h('Tu es {coincé|coincée}, ou ce que tu vis demande plus.')+'</li>'
    +'<li><strong>Désalignement</strong>Tes actes s\'éloignent de ton cap.</li>'
    +'<li><strong>Progression à consolider</strong>Un vrai progrès, à ancrer.</li></ul>'
    +bouton('Continuer', 'suivant')+'</div>'};
};

RENDUS.pret=function(){
  var p=prenom();
  return {fond:'#974AF0', html:'<div class="centre">'+avatar('mia', 'grand')
    +'<h1 class="grand">Tout est prêt'+(p?', '+esc(p):'')+'.</h1>'
    +'<p class="texte">MIA a lu tout ton parcours et ton compte-rendu. Tu n\'as rien à répéter.</p>'
    +(etat.rep.cap?'<p class="texte">Ton cap : « '+esc(etat.rep.cap)+' ».</p>':'')
    +bouton('Parler avec MIA', 'suivant')+'</div>'};
};

RENDUS.chat=function(){
  return {fond:'#F5EFFE', encre:SOMBRE, teinte:'#E9DDFB', classe:'ecran-chat', html:
    '<header class="chat-tete"><div class="presents" id="presents"></div><button class="b-menu" data-action="menu" aria-label="Menu">⋯</button></header>'
    +'<div class="fil" id="fil" aria-live="polite"></div>'
    +'<div class="saisie"><textarea id="message" rows="1" maxlength="2000"></textarea>'
    +'<button class="b-envoi" data-action="envoyer" aria-label="Envoyer">↑</button></div>',
    apres:entrerChat};
};

/* ─────────── navigation ─────────── */
var ec=null, verrou=false;
function aller(i){
  if(i<0 || i>=ETAPES.length || verrou) return;
  var e=ETAPES[i];
  verrou=true; confirmeRaz=false;
  if(e.t!=='seuil'){ etat.etape=i; if(e.t==='chat') etat.fini=true; garder(); }
  ec.classList.add('sortie');
  setTimeout(function(){
    verrou=false;
    var r=RENDUS[e.t](e);
    theme(r.fond, r.encre, r.teinte);
    ec.className='ecran entree'+(r.classe?' '+r.classe:'');
    ec.innerHTML=typo(r.html);
    try{ window.scrollTo(0, 0); }catch(_){}
    void ec.offsetWidth;
    ec.classList.remove('entree');
    if(r.apres) r.apres();
  }, DUREE);
}
function suivant(){ aller(etat.etape+1); }
/* Après une réponse, on avance seul, mais seulement depuis l'écran de la réponse :
   deux appuis rapprochés (on change d'avis) ne doivent jamais sauter une question. */
function avancerApres(){
  var depuis=etat.etape;
  setTimeout(function(){ if(etat.etape===depuis) suivant(); }, DUREE ? 260 : 0);
}

/* ─────────── la discussion ─────────── */
var enCours=false, retourDemande=false;

function entrerChat(){
  rendrePresents(); rendreFil();
  var ta=document.getElementById('message');
  ta.addEventListener('input', function(){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight, 160)+'px'; });
  ta.addEventListener('keydown', function(ev){ if(ev.key==='Enter' && !ev.shiftKey){ ev.preventDefault(); envoyerSaisie(); } });
  if(!etat.fil.length){ premierMessage(); return; }
  var dernier=0; etat.fil.forEach(function(m){ if(m.at) dernier=Math.max(dernier, m.at); });
  var ecart=Date.now()-dernier;
  if(retourDemande && etat.cle && dernier && ecart>3*3600000){
    retourDemande=false;
    ajouter({type:'info', texte:'Bon retour. MIA reprend là où vous en étiez.'});
    etat.actif='mia'; rendrePresents();
    reponse('mia', {retour:dureeEnMots(ecart)});
  }
  retourDemande=false;
}
function dureeEnMots(ms){
  var hrs=Math.round(ms/3600000);
  if(hrs<24) return hrs+' heure'+(hrs>1?'s':'');
  var j=Math.round(hrs/24); return j+' jour'+(j>1?'s':'');
}
function premierMessage(){
  if(etat.cle){ reponse('mia', {premier:true}); return; }
  var p=prenom(), cap=etat.rep.cap;
  ajouter({type:'agent', qui:'mia', texte:(p?p+', j':'J')+'\'ai lu tout ton parcours.'+(cap?' Ton cap : « '+cap+' ». On commence par là ?':' Par quoi veux-tu commencer ?'),
    choix:cap?['On commence par là','Plutôt autre chose']:null});
  ajouter({type:'cle'});
}
function ajouter(m){ m.at=m.at||Date.now(); etat.fil.push(m); garder(); rendreFil(); }

function rendrePresents(){
  var el=document.getElementById('presents'); if(!el) return;
  el.innerHTML=etat.presents.map(function(id){
    var a=AG[id], on=etat.actif===id;
    return '<button class="present'+(on?' actif':'')+'" data-action="parler-a" data-id="'+id+'" aria-pressed="'+on+'">'+avatar(id, 'petit')+'<span>'+esc(a.nom)+'</span></button>';
  }).join('');
  var ta=document.getElementById('message'); if(ta) ta.placeholder='Écris à '+AG[etat.actif].nom+'…';
}

var ECRIT=null;
function rendreFil(){
  var f=document.getElementById('fil'); if(!f) return;
  var dernierAgent=-1;
  for(var i=etat.fil.length-1;i>=0;i--){
    var t=etat.fil[i].type;
    if(t==='user') break;
    if(t==='agent'){ dernierAgent=i; break; }
  }
  f.innerHTML=typo(etat.fil.map(function(m, i){ return rendreMsg(m, i, i===dernierAgent && !enCours); }).join(''))
    +(ECRIT ? '<div class="msg ag ecrit" style="--t:'+teinteDe(AG[ECRIT].couleur)+'">'+avatar(ECRIT, 'petit')+'<div class="bulle"><span class="points-ecrit" aria-label="'+esc(AG[ECRIT].nom)+' écrit"><i></i><i></i><i></i></span></div></div>' : '');
  f.scrollTop=f.scrollHeight;
}
var NOMS_SIGNAUX={stagnation:'stagnation', blocage:'blocage', desalignement:'désalignement', progression:'progression à consolider'};
function rendreMsg(m, i, avecChoix){
  if(m.type==='user') return '<div class="msg moi"><div class="bulle">'+paragraphes(m.texte)+'</div></div>';
  if(m.type==='agent'){
    var a=AG[m.qui]||AG.mia;
    return '<div class="msg ag" style="--t:'+teinteDe(a.couleur)+';--c:'+a.couleur+'">'+avatar(a.id, 'petit')
      +'<div class="bulle"><span class="qui">'+esc(a.nom)+'</span>'+paragraphes(m.texte)+'</div></div>'
      +(avecChoix && m.choix && m.choix.length ? '<div class="choix">'+m.choix.map(function(c){ return '<button class="choix-b" data-action="repondre" data-texte="'+esc(c)+'">'+esc(c)+'</button>'; }).join('')+'</div>' : '');
  }
  if(m.type==='info') return '<p class="info">'+esc(m.texte)+'</p>';
  if(m.type==='erreur') return '<div class="info erreur"><span>'+esc(m.texte)+'</span><button class="lien-inline" data-action="reessayer">Réessayer</button></div>';
  if(m.type==='acte') return '<div class="carte carte-pas'+(m.fait?' fait':'')+'"><span class="sur">Ton pas'+(m.quand?' · '+esc(m.quand):'')+'</span><p>'+esc(m.quoi)+'</p>'
    +(m.fait ? '<span class="ok">Fait</span>' : '<button class="lien-inline" data-action="pas-fait" data-i="'+i+'">C\'est fait</button>')+'</div>';
  if(m.type==='signal') return '<div class="carte carte-signal"><strong>Signal transmis à ton professionnel référent : '+esc(NOMS_SIGNAUX[m.signal]||m.signal)+'.</strong><p>Il intervient sans rendez-vous, quand c\'est utile.</p></div>';
  if(m.type==='crise') return carteCrise();
  if(m.type==='cle') return '<div class="carte carte-cle"><p>Pour que MIA et les accompagnants te répondent, il faut une clé Anthropic.</p><button class="lien-inline" data-action="reglages">Ouvrir les réglages</button></div>';
  return '';
}
function telLien(num, nom, sous){ return '<a class="tel" href="tel:'+num.replace(/\s/g, '')+'"><strong>'+nom+'</strong><span>'+sous+'</span></a>'; }
function carteCrise(){
  return '<div class="carte carte-crise"><strong>Tu n\'as pas à porter ça sans aide.</strong>'
    +'<p>Si tu penses à te faire du mal, ou si tu es en danger, appelle maintenant. Quelqu\'un répond, jour et nuit.</p>'
    +telLien('3114', '3114', 'Prévention du suicide · gratuit, 24 h/24')
    +telLien('09 72 39 40 50', 'SOS Amitié · 09 72 39 40 50', 'Écoute, 24 h/24, 7 j/7')
    +telLien('15', '15 · SAMU', 'Si le danger est immédiat')
    +'<p class="petit">Ton professionnel référent a été prévenu. Il te lira sans rendez-vous. Pour tout de suite, ces numéros répondent.</p></div>';
}

function normRisque(s){ return String(s||'').toLowerCase().replace(/[’‘`]/g, "'").normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' '); }
function risque(t){
  var n=normRisque(t); if(!n) return 0;
  if(RISQUE_3.some(function(re){ return re.test(n); })) return 3;
  if(RISQUE_2.some(function(re){ return re.test(n); })) return 2;
  return 0;
}
function declencherCrise(){
  var now=Date.now();
  var recente=etat.fil.some(function(m){ return m.type==='crise' && now-m.at<FENETRE_CRISE; });
  if(recente) return;
  if(!etat.signaux.some(function(s){ return s.type==='blocage' && now-s.at<FENETRE_CRISE; })) etat.signaux.push({type:'blocage', at:now, source:'sécurité'});
  ajouter({type:'crise'});
}

function envoyerSaisie(){
  var ta=document.getElementById('message'); if(!ta) return;
  var t=ta.value.trim(); if(!t || enCours) return;
  ta.value=''; ta.style.height='auto';
  envoyer(t);
}
function envoyer(texte){
  texte=String(texte||'').trim(); if(!texte || enCours) return;
  ajouter({type:'user', texte:texte});
  var r=risque(texte);
  if(r) declencherCrise();
  if(!etat.cle){ ajouter({type:'cle'}); return; }
  reponse(etat.actif, {risque:r});
}

function consigneTour(qui, o){
  var L=['Consigne pour cette réponse :'];
  if(o.premier) L.push("C'est ta toute première réponse : la personne vient de finir son parcours d'accueil et arrive dans la discussion. Pas de question générique. En une ou deux phrases, montre-lui que tu as saisi l'essentiel de ce qu'elle vit, avec un détail précis de son compte-rendu, dans ses mots si possible. Puis propose de commencer par son cap, et termine par une seule question précise, avec une balise CHOIX.");
  if(o.retour){
    var pas=dernierPas();
    L.push('La personne revient dans la discussion après '+o.retour+'. Accueille-la en une phrase, rattache-toi à ce qui était en cours'
      +(pas?', notamment son pas : « '+pas.quoi+' »'+(pas.quand?' ('+pas.quand+')':''):'')+', puis une seule question.');
  }
  if(o.arrivee) L.push("MIA vient de te faire venir. La personne n'a rien à répéter : tu as tout l'échange et son dossier. Présente-toi en une phrase courte, puis va droit à ce qui l'aide.");
  if(o.risque) L.push("Sécurité : son dernier message laisse voir un risque. Applique le protocole de sécurité. L'application a déjà affiché les numéros d'urgence et a prévenu son professionnel référent : tu peux le lui dire, simplement.");
  L.push(consigneLongueur());
  return L.join('\n');
}
function systeme(qui, tour){
  var fixe=SOCLE+SEP+SECURITE+SEP+(qui==='mia' ? MIA_GUIDE : FICHES[qui]+SEP+NOTE_ACCOMPAGNANT);
  return [{type:'text', text:fixe, cache_control:{type:'ephemeral'}},
          {type:'text', text:dossier(), cache_control:{type:'ephemeral'}},
          {type:'text', text:tour}];
}
function messagesPour(qui, o){
  var M=[{role:'user', content:"(La personne vient de terminer son parcours d'accueil et ouvre la discussion.)"}];
  etat.fil.slice(-60).forEach(function(m){
    if(m.type==='user') M.push({role:'user', content:m.texte});
    else if(m.type==='agent') M.push({role:'assistant', content:(m.qui===qui?'':'['+AG[m.qui].nom+'] ')+m.texte});
  });
  if(o.retour) M.push({role:'user', content:'(La personne revient dans la discussion.)'});
  if(o.arrivee) M.push({role:'user', content:"(MIA t'a fait venir. La personne attend ta première réponse.)"});
  if(M[M.length-1].role!=='user') M.push({role:'user', content:'(La personne attend ta réponse.)'});
  return M;
}

/* Le relais en cas de refus (« fallbacks ») est une fonction en test chez Anthropic. S'il est refusé une fois,
   on renvoie sans lui, et on ne le redemande plus de la session. */
var sansRelais=false;
async function appeler(system, messages, maxTokens){
  var corps={model:MODELE, max_tokens:maxTokens||2000, system:system, messages:messages, output_config:{effort:'low'}};
  var ent={'content-type':'application/json', 'x-api-key':etat.cle, 'anthropic-version':'2023-06-01',
           'anthropic-dangerous-direct-browser-access':'true'};
  if(!sansRelais){ corps.fallbacks='default'; ent['anthropic-beta']='server-side-fallback-2026-07-01'; }
  var r=null;
  try{ r=await fetch(URL_API, {method:'POST', headers:ent, body:JSON.stringify(corps)}); }catch(_){ r=null; }
  if(!r || r.status===400){
    var detail=''; if(r){ try{ detail=JSON.stringify(await r.json()); }catch(_){} }
    if(sansRelais || (r && !/fallback|beta/i.test(detail))){
      if(!r) throw new Error('réseau');
      var e400=new Error('http 400'); e400.status=400; throw e400;
    }
    sansRelais=true;
    delete corps.fallbacks; delete ent['anthropic-beta'];
    r=await fetch(URL_API, {method:'POST', headers:ent, body:JSON.stringify(corps)});
  }
  if(!r.ok){ var e=new Error('http '+r.status); e.status=r.status; throw e; }
  var d=await r.json();
  if(d.stop_reason==='refusal') return {refus:true, texte:''};
  return {texte:(d.content||[]).filter(function(c){ return c.type==='text'; }).map(function(c){ return c.text; }).join('\n').trim()};
}
function messageErreur(err){
  var s=err && err.status;
  if(s===401 || s===403) return "La clé n'est pas reconnue. Vérifie-la dans les réglages.";
  if(s===429) return 'Trop de demandes en même temps. Réessaie dans 1 minute.';
  if(s>=500) return 'Le service est surchargé. Réessaie dans 1 minute.';
  if(s) return "La réponse n'est pas passée. Réessaie.";
  return "Pas de connexion. Vérifie ton accès à internet.";
}

function lireBalises(t){
  var res={invite:null, choix:null, actes:[], signaux:[], crise:false};
  var texte=String(t||'').replace(/\[\[\s*([A-Za-z]+)\s*(?::([^\]]*))?\]\]/g, function(_, k, v){
    k=k.toUpperCase(); v=String(v||'').trim();
    if(k==='INVITE') res.invite=v.toLowerCase();
    else if(k==='CHOIX') res.choix=v.split('|').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 3);
    else if(k==='ACTE'){ var p=v.split('|'); if(p[0].trim()) res.actes.push({quoi:p[0].trim(), quand:(p[1]||'').trim()}); }
    else if(k==='SIGNAL'){
      var s=normRisque(v).replace(/[^a-z ]/g, '').trim();
      if(/^desalign/.test(s)) s='desalignement'; else if(/^progress/.test(s)) s='progression';
      if(NOMS_SIGNAUX[s]) res.signaux.push(s);
    }
    else if(k==='CRISE') res.crise=true;
    return '';
  });
  texte=texte.replace(/\[\[[^\]]*$/, '').replace(/^\s*\[[^\]\n]{1,20}\]\s*/, '').replace(/\n{3,}/g, '\n\n').trim();
  res.texte=texte;
  return res;
}
function traiter(qui, brut){
  var b=lireBalises(brut);
  if(b.texte) ajouter({type:'agent', qui:qui, texte:b.texte, choix:b.choix});
  b.actes.forEach(function(a){ etat.actes.push({quoi:a.quoi, quand:a.quand, fait:false, at:Date.now()}); ajouter({type:'acte', quoi:a.quoi, quand:a.quand, fait:false}); });
  b.signaux.forEach(function(s){
    if(etat.signaux.some(function(x){ return x.type===s; })) return;
    etat.signaux.push({type:s, at:Date.now(), source:qui});
    ajouter({type:'signal', signal:s});
  });
  if(b.crise) declencherCrise();
  if(b.invite && qui==='mia' && AG[b.invite] && b.invite!=='mia'){
    var id=b.invite;
    if(etat.presents.indexOf(id)<0){ etat.presents.push(id); ajouter({type:'info', texte:AG[id].nom+' rejoint la discussion.'}); }
    etat.actif=id; garder(); rendrePresents();
    return reponse(id, {arrivee:true});
  }
}
async function reponse(qui, o){
  o=o||{};
  enCours=true; ECRIT=qui; rendreFil();
  try{
    var res=await appeler(systeme(qui, consigneTour(qui, o)), messagesPour(qui, o));
    ECRIT=null; enCours=false;
    if(res.refus) ajouter({type:'info', texte:AG[qui].nom+" n'a pas pu répondre à ce message. Tu peux le dire autrement ?"});
    else if(!res.texte) ajouter({type:'erreur', texte:"La réponse est arrivée vide."});
    else await traiter(qui, res.texte);
  }catch(err){
    ECRIT=null; enCours=false;
    ajouter({type:'erreur', texte:messageErreur(err)});
  }
  rendreFil();
}

/* ─────────── couches : menu, réglages, compte-rendu, pause ─────────── */
var couche, panneau;
function ouvrir(html){ confirmeRaz=false; panneau.innerHTML='<button class="fermer" data-action="fermer" aria-label="Fermer">×</button>'+typo(html); couche.classList.add('ouverte'); couche.setAttribute('aria-hidden', 'false'); }
function fermer(){ couche.classList.remove('ouverte'); couche.setAttribute('aria-hidden', 'true'); }
function clePremiereApp(){
  try{
    var s=JSON.parse(localStorage.getItem(CLE_PREMIERE_APP)||'null'); if(!s) return '';
    var k=(s.apiKeys && s.apiKeys.anthropic) || (s.provider!=='deepseek' ? s.apiKey : '');
    return String(k||'').trim();
  }catch(_){ return ''; }
}
function ouvrirReglages(){
  var importable=clePremiereApp();
  ouvrir('<h2>Réglages</h2>'
    +'<label class="etiquette" for="cle">Clé API Anthropic</label>'
    +'<input class="champ" id="cle" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="'+esc(etat.cle)+'">'
    +'<p class="petit">Elle reste sur cet appareil et sert à parler à MIA et aux accompagnants.</p>'
    +'<div class="actions">'+bouton('Enregistrer', 'cle-enregistrer')+(importable?lienBouton('Reprendre la clé de la première application', 'cle-importer'):'')+'</div>'
    +'<p class="petit">Formule : MAYND (démonstration). Modèle : Claude Sonnet 5.5.</p>'
    +'<button class="lien" data-action="recommencer">Recommencer le parcours</button>'
    +'<p class="petit">'+VERSION+'</p>');
}
function ouvrirCompteRendu(){
  var p=profil();
  ouvrir('<p class="sur">Ton compte-rendu</p><h2>'+esc(p.nom)+'</h2>'
    +'<p class="petit">Si quelque chose sonne faux, corrige-le : c\'est ta version qui compte.</p>'
    +'<p class="cr-etat" id="cr-etat" aria-live="polite"></p>'
    +'<div class="cr-liste">'+cartesCR()+'</div>');
  if(etat.cle && !Object.keys(etat.cr.mia).length) lancerCompteRendu();
}
function ouvrirPause(){
  var p=prenom(), o=valeurChoix('moment_parler'), pas=dernierPas();
  ouvrir('<h2>À plus tard'+(p?', '+esc(p):'')+'.</h2><p>MIA reprend exactement là où vous en êtes.</p>'
    +(o && o.m && o.k!=='tout' ? '<p>Tu m\'as dit que ton moment pour parler, c\'est '+esc(o.m)+'. Reviens à ce moment-là, si tu veux.</p>' : '<p>Reviens quand tu veux.</p>')
    +(pas ? '<p class="note-pas">Ton pas en cours : '+esc(pas.quoi)+(pas.quand?' · '+esc(pas.quand):'')+'</p>' : '')
    +bouton('Revenir à la discussion', 'fermer'));
}

/* ─────────── actions ─────────── */
var confirmeRaz=false;
function choisirVisuel(b, selecteur){ Array.prototype.forEach.call(document.querySelectorAll(selecteur), function(o){ o.classList.toggle('choisi', o===b); }); }
var ACTIONS={
  commencer:function(){ aller(1); },
  reprendre:function(){ aller(etat.etape); },
  retrouver:function(){ retourDemande=true; aller(indexDe('chat')); },
  suivant:suivant,
  retour:function(){ if(etat.etape>1) aller(etat.etape-1); },
  pause:ouvrirPause,
  reglages:ouvrirReglages,
  'cr-ouvrir':ouvrirCompteRendu,
  menu:function(){
    ouvrir('<h2>MAYND</h2><div class="menu">'+lienBouton('Mon compte-rendu', 'cr-ouvrir')+lienBouton('Réglages', 'reglages')+lienBouton('Faire une pause', 'pause')+'</div>');
  },
  fermer:fermer,
  recommencer:function(b){
    if(!confirmeRaz){ confirmeRaz=true; b.textContent='Confirmer : tout effacer'; return; }
    var c=etat.cle; etat=vide(); etat.cle=c; garder(); confirmeRaz=false; fermer(); aller(1);
  },
  'cle-enregistrer':function(){
    var v=String((document.getElementById('cle')||{}).value||'').trim();
    etat.cle=v; garder(); fermer();
    var e=ETAPES[etat.etape];
    if(e && e.t==='chat' && v){
      var dernier=etat.fil[etat.fil.length-1], avant=etat.fil[etat.fil.length-2];
      if(dernier && dernier.type==='cle'){ etat.fil.pop(); garder(); rendreFil(); if(avant && avant.type==='user') reponse(etat.actif, {}); }
    }
    if(e && e.t==='compte' && v) lancerCompteRendu();
  },
  'cle-importer':function(){ var k=clePremiereApp(); var c=document.getElementById('cle'); if(c && k) c.value=k; },
  choix:function(b){
    noter(b.dataset.q, +b.dataset.i);
    choisirVisuel(b, '.opt');
    var autre=document.getElementById('autre'); if(autre) autre.hidden=true;
    avancerApres();
  },
  'choix-autre':function(b){
    noter(b.dataset.q, -1);
    choisirVisuel(b, '.opt');
    document.getElementById('autre').hidden=false; document.getElementById('champ-autre').focus();
  },
  'valider-autre':function(b){ etat.autres[b.dataset.q]=String(document.getElementById('champ-autre').value||'').trim(); garder(); suivant(); },
  multi:function(b){
    var id=b.dataset.q, i=+b.dataset.i, Q=QX[id], cur=(etat.rep[id]||[]).slice(), k=cur.indexOf(i);
    if(k>=0) cur.splice(k, 1);
    else if(cur.length>=Q.max){ var c=document.getElementById('compte'); c.classList.remove('vibre'); void c.offsetWidth; c.classList.add('vibre'); return; }
    else cur.push(i);
    noter(id, cur);
    var on=cur.indexOf(i)>=0;
    b.classList.toggle('choisi', on); b.setAttribute('aria-pressed', String(on));
    if(i===-1){ var a=document.getElementById('autre'); a.hidden=!on; if(on) document.getElementById('champ-autre').focus(); }
    document.getElementById('compte').textContent=cur.length+' sur '+Q.max;
    document.querySelector('[data-action="suivant-multi"]').disabled=!cur.length;
  },
  'suivant-multi':function(b){
    var a=document.getElementById('champ-autre');
    if(a){ etat.autres[b.dataset.q]=String(a.value||'').trim(); garder(); }
    suivant();
  },
  echelle:function(b){ noter(b.dataset.q, +b.dataset.v); choisirVisuel(b, '.point'); avancerApres(); },
  note:function(b){ noter(b.dataset.q, +b.dataset.v); choisirVisuel(b, '.chiffre'); avancerApres(); },
  nsp:function(b){ noter(b.dataset.q, 0); suivant(); },
  'valider-boussole':function(b){
    var v={}; Array.prototype.forEach.call(document.querySelectorAll('.curseur input'), function(r){ v[r.dataset.k]=+r.value; });
    noter(b.dataset.q, v); suivant();
  },
  'valider-texte':function(b){
    var c=document.getElementById('champ'), v=String(c.value||'').trim();
    if(QX[b.dataset.q].requis && !v) return;
    noter(b.dataset.q, v); suivant();
  },
  passer:function(b){ noter(b.dataset.q, ''); suivant(); },
  idee:function(b){
    var c=document.getElementById('champ'); c.value=b.dataset.texte;
    var v=document.querySelector('[data-action="valider-texte"]'); if(v) v.disabled=false;
    c.focus();
  },
  'cr-corriger':function(b){ remplacerCarte(b.dataset.id, true); },
  'cr-annuler':function(b){ remplacerCarte(b.dataset.id, false); },
  'cr-enregistrer':function(b){
    var id=b.dataset.id, c=document.getElementById('cr-champ-'+id);
    var v=String(c && c.value || '').replace(/ /g, ' ').trim();
    /* Vider le champ revient au texte d'origine ; le texte inchangé ne compte pas comme une correction. */
    if(!v) delete etat.cr.toi[id];
    else if(v!==texteSection(id).replace(/ /g, ' ').trim()) etat.cr.toi[id]=v;
    garder(); remplacerCarte(id, false);
  },
  'cr-retablir':function(b){ delete etat.cr.toi[b.dataset.id]; garder(); remplacerCarte(b.dataset.id, false); },
  envoyer:envoyerSaisie,
  repondre:function(b){ envoyer(b.dataset.texte); },
  'parler-a':function(b){ etat.actif=b.dataset.id; garder(); rendrePresents(); var ta=document.getElementById('message'); if(ta) ta.focus(); },
  'pas-fait':function(b){
    var m=etat.fil[+b.dataset.i]; if(!m) return; m.fait=true;
    etat.actes.forEach(function(a){ if(a.quoi===m.quoi) a.fait=true; });
    garder(); rendreFil();
  },
  reessayer:function(){
    if(enCours) return;
    var d=etat.fil[etat.fil.length-1]; if(d && d.type==='erreur'){ etat.fil.pop(); garder(); }
    if(!etat.fil.some(function(m){ return m.type==='agent'; })) reponse('mia', {premier:true}); else reponse(etat.actif, {});
  }
};

document.addEventListener('click', function(ev){
  var b=ev.target.closest('[data-action]'); if(!b || b.disabled) return;
  var f=ACTIONS[b.dataset.action]; if(!f) return;
  /* Un écran qui s'efface ne répond plus, et une réponse ne vaut que pour la question affichée. */
  if(ec.contains(b) && ec.classList.contains('sortie')) return;
  var e=ETAPES[etat.etape];
  if(b.dataset.q && !(e && e.t==='q' && MODULES[e.m].questions[e.q].id===b.dataset.q)) return;
  ev.preventDefault(); f(b);
});
document.addEventListener('keydown', function(ev){ if(ev.key==='Escape' && couche.classList.contains('ouverte')) fermer(); });

/* ─────────── démonstration : index.html?demo=fin ou ?demo=chat ───────────
   Remplit le parcours avec les réponses d'une personne fictive, pour montrer la fin du tunnel sans tout refaire. */
function remplirDemo(){
  etat.rep={prenom:'Léa', genre:1, age:1, activite:2, foyer:1, periode:2,
    boussole:{sommeil:3, energie:4, moral:5, confiance:4, travail:4, amour:7, famille:8, amis:6, argent:5, corps:5, sens:4},
    sujets:[7, 3, 11], duree:1, phrase:"Je dors mal depuis que j'ai changé de poste, et je doute de tout.",
    recharge:4, projet:2, decision:2, nouveaute:4, exigence:5, emotions:4, moteur:1, moment:1,
    pression:2, echec:1, desaccord:4, calme:3, compliment:3, soutien:2, imprevu:2,
    valeurs:[11, 2, 12], apaise:[0, 1, 4], fierte:"J'ai repris le piano l'an dernier.", six_mois:0, ne_plus:'Me réveiller à 4 h en pensant au travail.',
    heures:1, reveil:3, energie_jour:4, bouger:3, ecrans:1,
    niveau:1, franchise:4, longueur:1, piste:4, humour:1, relance:2, moment_parler:3,
    cap:'Retrouver des nuits qui reposent', pourquoi:"Je ne tiens plus à ce rythme.", signe:"Me réveiller sans le réveil, deux matins par semaine.", pret:8};
  etat.cr={mia:{}, toi:{}};
  garder();
}

/* ─────────── démarrage ─────────── */
function demarrer(){
  ec=document.getElementById('ecran'); couche=document.getElementById('couche'); panneau=document.getElementById('panneau');
  couche.addEventListener('click', function(ev){ if(ev.target===couche) fermer(); });
  var demo=(location.search.match(/[?&]demo=(fin|chat)\b/)||[])[1];
  if(demo && !etat.fini){ remplirDemo(); aller(indexDe(demo==='chat' ? 'chat' : 'profil')); return; }
  aller(0);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
