/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE NOYAU (13/11/2026)
   Les accompagnants par identifiant, le chemin du parcours d'entrée, la scène
   (un écran à la fois, montré par opacité), les trois onglets, la couche
   (menu, réglages, fiches), les toasts, le thème, et un seul écouteur de clics
   qui lit data-action. Chaque fichier ajoute ses actions dans ACTIONS ; aucune
   fonction n'est jamais redéfinie.
   ══════════════════════════════════════════════════════════════════════════ */

const AG={}; ACCOMPAGNANTS.forEach(function(a){ AG[a.id]=a; });
const QX={}; MODULES.forEach(function(m){ m.questions.forEach(function(q){ QX[q.id]=q; }); });
const SECTION={}; SECTIONS_CR.forEach(function(s){ SECTION[s.id]=s; });
const SOMBRE='#1B1530', CREME='#FBFAF7', VIOLET='#974AF0';
const DUREE=/[?&]rapide\b/.test(location.search) ? 0 : 380;

/* ─────────── le chemin d'entrée ─────────── */
const ETAPES=[]; let TOTAL_Q=0;
ETAPES.push({t:'seuil'},{t:'mia'});
MODULES.forEach(function(m, mi){
  ETAPES.push({t:'intro', m:mi});
  m.questions.forEach(function(q, qi){ TOTAL_Q++; ETAPES.push({t:'q', m:mi, q:qi, n:TOTAL_Q}); });
  if(m.id!=='toi' && m.id!=='cap') ETAPES.push({t:'retenu', m:mi});
});
ETAPES.push({t:'profil'},{t:'compte'},{t:'equipe'},{t:'pro'},{t:'pret'});
function indexDe(t){ for(let i=0;i<ETAPES.length;i++){ if(ETAPES[i].t===t) return i; } return -1; }
function numeroAvant(i){ for(let j=Math.min(i, ETAPES.length-1); j>=0; j--){ if(ETAPES[j].n) return ETAPES[j].n; } return 0; }

/* ─────────── la scène ─────────── */
const RENDUS={};      /* écrans du parcours : t → function(etape) → {fond, encre, teinte, html, apres, classe} */
const ONGLETS={};     /* onglets de l'intérieur : nom → function() → {html, apres} */
const ACTIONS={};     /* data-action → function(bouton) */
let ecran=null, verrou=false, confirmeRaz=false;

function theme(fond, encre, teinte){
  const s=document.documentElement.style;
  s.setProperty('--fond', fond); s.setProperty('--encre', encre||'#FFFFFF'); s.setProperty('--teinte', teinte||'#EDE1FF');
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute('content', fond);
}
function afficher(r){
  theme(r.fond, r.encre, r.teinte);
  ecran.className='ecran entree'+(r.classe?' '+r.classe:'');
  ecran.innerHTML=typo(r.html);
  try{ window.scrollTo(0, 0); }catch(_){}
  void ecran.offsetWidth;
  ecran.classList.remove('entree');
  if(r.apres) r.apres();
}
function transition(fn){
  if(verrou) return;
  verrou=true; confirmeRaz=false;
  ecran.classList.add('sortie');
  setTimeout(function(){ verrou=false; fn(); }, DUREE);
}
/* Aller à une étape du parcours d'entrée. */
function aller(i){
  if(i<0 || i>=ETAPES.length) return;
  const e=ETAPES[i];
  transition(function(){
    if(e.t!=='seuil'){ etat.etape=i; garder(); }
    afficher(RENDUS[e.t](e));
  });
}
function suivant(){ aller(etat.etape+1); }
/* Après une réponse, on avance seul, mais seulement depuis l'écran de la réponse. */
function avancerApres(){
  const depuis=etat.etape;
  setTimeout(function(){ if(etat.etape===depuis) suivant(); }, DUREE ? 260 : 0);
}
/* Fin du parcours : l'intérieur. */
function terminerParcours(){
  etat.fini=true; etat.onglet='discussion'; garder();
  montrerOnglet('discussion');
}
function montrerOnglet(nom, sansTransition){
  if(!ONGLETS[nom]) nom='aujourdhui';
  const rendre=function(){
    etat.onglet=nom; garder();
    const r=ONGLETS[nom]();
    afficher({fond:r.fond||CREME, encre:SOMBRE, teinte:r.teinte||'#E9DDFB', classe:'interieur '+nom, html:r.html+navHTML(nom), apres:r.apres});
  };
  if(sansTransition) rendre(); else transition(rendre);
}
function navHTML(actif){
  const items=[['aujourdhui','Aujourd’hui','<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'],
               ['discussion','Discussion','<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>'],
               ['toi','Toi','<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>']];
  return '<nav class="nav" aria-label="Navigation">'+items.map(function(it){
    return '<button class="nav-b'+(it[0]===actif?' actif':'')+'" data-action="onglet" data-nom="'+it[0]+'" aria-current="'+(it[0]===actif?'page':'false')+'">'
      +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+it[2]+'</svg><span>'+it[1]+'</span></button>';
  }).join('')+'</nav>';
}
function rafraichirOnglet(){ if(etat.fini && ONGLETS[etat.onglet]) montrerOnglet(etat.onglet, true); }

/* ─────────── la couche : menu, réglages, fiches ─────────── */
let couche=null, panneau=null;
function ouvrir(html, classe){
  confirmeRaz=false;
  panneau.className='panneau'+(classe?' '+classe:'');
  panneau.innerHTML='<button class="fermer" data-action="fermer" aria-label="Fermer">×</button>'+typo(html);
  couche.classList.add('ouverte'); couche.setAttribute('aria-hidden', 'false');
  panneau.scrollTop=0;
}
function fermer(){ couche.classList.remove('ouverte'); couche.setAttribute('aria-hidden', 'true'); }
function coucheOuverte(){ return couche.classList.contains('ouverte'); }

/* ─────────── toasts ─────────── */
let toastTimer=null;
function toast(texte){
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=texte; t.classList.add('visible');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.classList.remove('visible'); }, 2600);
}

/* ─────────── petits morceaux partagés ─────────── */
function avatar(id, taille){
  const a=AG[id];
  return '<span class="av'+(taille?' '+taille:'')+'" style="background:'+a.couleur+';color:'+(a.encre||'#FFFFFF')+'" aria-hidden="true">'+a.nom.charAt(0)+'</span>';
}
function bouton(t, action, extra){ return '<button class="btn" data-action="'+action+'"'+(extra||'')+'>'+esc(t)+'</button>'; }
function lienBouton(t, action, extra){ return '<button class="lien" data-action="'+action+'"'+(extra||'')+'>'+esc(t)+'</button>'; }
function badgePro(){ return '<svg class="badge-pro" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>'; }
function nomPro(){ return (etat.pro && etat.pro.nom) ? etat.pro.nom : 'Ton professionnel référent'; }

/* ─────────── les clics ─────────── */
document.addEventListener('click', function(ev){
  const b=ev.target.closest('[data-action]'); if(!b || b.disabled) return;
  const f=ACTIONS[b.dataset.action]; if(!f) return;
  if(ecran.contains(b) && ecran.classList.contains('sortie')) return;
  /* Une réponse ne vaut que pour la question affichée. */
  const e=ETAPES[etat.etape];
  if(b.dataset.q && !(e && e.t==='q' && MODULES[e.m].questions[e.q].id===b.dataset.q && !etat.fini)) return;
  ev.preventDefault(); f(b);
});
document.addEventListener('keydown', function(ev){ if(ev.key==='Escape' && couche && coucheOuverte()) fermer(); });
ACTIONS.fermer=fermer;
ACTIONS.onglet=function(b){ if(b.dataset.nom!==etat.onglet) montrerOnglet(b.dataset.nom); };
ACTIONS.suivant=suivant;
ACTIONS.retour=function(){ if(etat.etape>1) aller(etat.etape-1); };

/* ─────────── démarrage ─────────── */
function demarrer(){
  ecran=document.getElementById('ecran'); couche=document.getElementById('couche'); panneau=document.getElementById('panneau');
  couche.addEventListener('click', function(ev){ if(ev.target===couche) fermer(); });
  etat.lancements=(etat.lancements||0)+1; garder();
  const demo=(location.search.match(/[?&]demo=(fin|chat)\b/)||[])[1];
  if(demo && !etat.fini && typeof remplirDemo==='function'){ remplirDemo(); if(demo==='chat'){ terminerParcours(); } else aller(indexDe('profil')); return; }
  if(etat.fini){ montrerOnglet(etat.onglet||'aujourdhui', true); return; }
  aller(0);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', demarrer); else setTimeout(demarrer, 0);
