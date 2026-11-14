/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LES LANGUES (13/11/2026)
   Français, anglais, espagnol. Les textes sont écrits en français dans le
   code ; à l'affichage, chaque nœud de texte, chaque placeholder et chaque
   aria-label est traduit par le dictionnaire de la langue choisie
   (61-anglais.js, 62-espagnol.js), clé = la phrase française. Une phrase
   absente du dictionnaire reste en français. Quelques tournures composées
   (« Étape 1 sur 8 », « Bonjour, Léa ») passent par des règles.
   Jamais réécrit : ce que la personne tape, ce que le modèle répond, le
   contenu des jeux (en français pour l'instant). Le modèle reçoit la langue
   dans le dossier (33-lecture.js) et répond dans cette langue.
   ══════════════════════════════════════════════════════════════════════════ */

const LANGUES={fr:'Français', en:'English', es:'Español'};
const DICOS={en:{}, es:{}};      /* remplis par 61 et 62 */
const REGLES={en:[], es:[]};     /* [regex, remplacement] : règles écrites à la main, essayées avant tout découpage */
const REGLES_FIN={en:[], es:[]}; /* règles sans début fixe (« sommeil (3 sur 10) »), essayées après les gabarits */
const NOMS_LANGUE_MODELE={en:'anglais', es:'espagnol'};
function langue(){ return LANGUES[etat.langue] ? etat.langue : 'fr'; }
function nomLangueModele(){ return NOMS_LANGUE_MODELE[langue()] || ''; }

/* Les paires {masculin|féminin} d'une clé : à l'écran, tx() les a déjà résolues.
   On indexe donc chaque clé sous ses deux formes, chacune vers la valeur accordée de même. */
function paire(s, f){ return String(s).replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function(_, m, ff){ return f ? ff : m; }); }
const INDEX_PAIRES={}, GABARITS={};
function echapperRegex(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function indexPaires(l){
  if(INDEX_PAIRES[l]) return INDEX_PAIRES[l];
  const d=DICOS[l], x={}, g=[];
  Object.keys(d).forEach(function(k){
    const paires=/\{[^{}|]*\|[^{}|]*\}/.test(k), gabarit=/\{[xn]\}/.test(k);
    if(paires && !gabarit){ x[paire(k, false)]=paire(d[k], false); x[paire(k, true)]=paire(d[k], true); }
    /* « Tu dors {x} par nuit. » devient une règle : le morceau capturé est traduit à son tour */
    if(gabarit){
      (paires ? [false, true] : [false]).forEach(function(f){
        const re=new RegExp('^'+echapperRegex(paire(k, f)).replace(/\\\{x\\\}/g, '(.+)').replace(/\\\{n\\\}/g, '(\\d+)')+'$');
        g.push([re, paire(d[k], f).replace(/\{[xn]\}/g, '$1'), k.length]);
      });
    }
  });
  /* du plus précis au plus court : « Tu as des fiertés concrètes : « {x} ». » avant « Tu as {x}. » */
  g.sort(function(a, b){ return b[2]-a[2]; });
  GABARITS[l]=g;
  return (INDEX_PAIRES[l]=x);
}
function gabarits(l){ indexPaires(l); return GABARITS[l]; }
/* « la liberté, la sécurité et la famille » : une liste (liste(), 11-texte.js), traduite morceau par morceau,
   en prenant le « et » qui laisse tous les morceaux traduisibles. */
const ET_LISTE={en:' and ', es:' y '};
/* Un morceau de liste se traduit s'il est au dictionnaire, cité entre guillemets (mots de la personne), ou noté sur 10. */
function morceauTraduit(l, m){ return chercher(l, m)!=null || /^« .+ »$/.test(m) || /^.+ \(\d+ sur 10\)$/.test(m); }
function traduireListe(l, t){
  const positions=[]; let i=-1;
  while((i=t.indexOf(' et ', i+1))>=0) positions.push(i);
  for(let k=positions.length-1;k>=0;k--){
    const morceaux=t.slice(0, positions[k]).split(', ').concat([t.slice(positions[k]+4)]);
    if(!morceaux.every(function(m){ return morceauTraduit(l, m); })) continue;
    const trad=morceaux.map(function(m){ return traduire(m); });
    return trad.slice(0, -1).join(', ')+ET_LISTE[l]+trad[trad.length-1];
  }
  return null;
}
/* Plusieurs phrases dans un même texte (le compte-rendu composé ici). On cherche d'abord le plus long groupe de
   phrases connu tel quel (une description de profil tient en deux ou trois phrases), puis chaque phrase à son tour. */
function traduirePhrases(l, t){
  const ph=t.split(/(?<=[.!?»…])\s+(?=[A-ZÀ-ÝŒ«“¿¡])/);
  if(ph.length<2) return null;
  const out=[]; let i=0, change=false;
  while(i<ph.length){
    let pris=false;
    for(let j=ph.length;j>i+1;j--){ const v=exact(l, ph.slice(i, j).join(' ')); if(v!=null){ out.push(v); i=j; pris=true; change=true; break; } }
    if(!pris){ const v=traduire(ph[i]); if(v!==ph[i]) change=true; out.push(v); i++; }
  }
  return change ? out.join(' ') : null;
}
function chercher(l, t){
  const d=DICOS[l]; if(d[t]!=null) return tx(d[t]);
  const x=indexPaires(l); if(x[t]!=null) return tx(x[t]);
  /* « plutôt bien » au fil d'une phrase : la clé est écrite avec sa majuscule */
  const M=majus(t); if(M!==t){ const v=chercher(l, M); if(v!=null) return minus(v); }
  return null;
}
/* Traduit une phrase complète ; renvoie la phrase française sinon.
   Le texte à l'écran porte les espaces insécables posées par typo() : on compare sans elles,
   et on remplace le texte entier, en gardant ce qui l'entoure. */
function traduire(s){
  const l=langue(); if(l==='fr') return s;
  const brut=String(s), t=brut.replace(/ /g, ' ').trim();
  if(!t) return s;
  const avant=brut.match(/^\s*/)[0], apres=brut.match(/\s*$/)[0];
  function fini(x){ return avant+x+apres; }
  const sans=t.replace(/[.:!?]\s*$/, ''), fin=t.slice(sans.length).trim();
  /* 1. le texte entier : au dictionnaire ou par une règle écrite ; puis sans sa ponctuation finale (« Continuer » et « Continuer. ») */
  let v=exact(l, t); if(v!=null) return fini(v);
  if(sans!==t){ v=exact(l, sans); if(v!=null) return fini(v+fin); }
  /* 2. plusieurs phrases : chacune à son tour (un gabarit ne doit jamais enjamber deux phrases) */
  v=traduirePhrases(l, t); if(v!=null) return fini(v);
  /* 3. une seule phrase : les gabarits du dictionnaire, du plus précis au plus court ; puis une liste */
  v=appliquer(l, gabarits(l), t); if(v!=null) return fini(v);
  if(sans!==t){ v=appliquer(l, gabarits(l), sans); if(v!=null) return fini(v+fin); }
  v=appliquer(l, REGLES_FIN[l], t); if(v!=null) return fini(v);
  if(t.indexOf(' et ')>=0){ v=traduireListe(l, t); if(v!=null) return fini(v); }
  return s;
}
/* Applique la première règle qui correspond ; chaque morceau capturé est lui-même traduit (« Étape suivante : Comment tu réagis »). */
function appliquer(l, regles, t){
  for(const r of regles){
    const m=t.match(r[0]); if(!m) continue;
    const caps=m.slice(1).map(function(c){ return c==null ? '' : traduire(c); });
    const out=typeof r[1]==='function' ? r[1].apply(null, [m[0]].concat(caps)) : r[1].replace(/\$(\d)/g, function(_, i){ return caps[i-1]||''; });
    return tx(out);
  }
  return null;
}
/* Le dictionnaire, puis les règles écrites à la main : ce qui peut valoir pour un texte de plusieurs phrases. */
function exact(l, t){ const v=chercher(l, t); return v!=null ? v : appliquer(l, REGLES[l], t); }
function traduireAttr(el, nom){ const v=el.getAttribute(nom); if(v){ const t=traduire(v); if(t!==v) el.setAttribute(nom, t); } }
/* Jamais traduit : ce que la personne tape, ce que le modèle écrit (bulles, compte-rendu affiné ou corrigé), les jeux.
   Le compte-rendu composé par l'application (.cr-local) est traduit. */
function exclu(el){ return !!(el && el.closest && el.closest('textarea, input, script, style, .no-trad, .bulle, .jeu, .cr-texte:not(.cr-local), .cr-champ')); }
function traduireNoeud(root){
  if(langue()==='fr' || !root) return;
  if(root.nodeType===3){ if(!exclu(root.parentElement)){ const v=traduire(root.nodeValue); if(v!==root.nodeValue) root.nodeValue=v; } return; }
  if(root.nodeType!==1 || exclu(root)) return;
  const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); let n; const l=[];
  while((n=w.nextNode())) l.push(n);
  l.forEach(function(t){ if(!exclu(t.parentElement)){ const v=traduire(t.nodeValue); if(v!==t.nodeValue) t.nodeValue=v; } });
  root.querySelectorAll('[placeholder], [aria-label], [title]').forEach(function(el){ ['placeholder','aria-label','title'].forEach(function(a){ if(el.hasAttribute(a)) traduireAttr(el, a); }); });
  if(root.hasAttribute && root.hasAttribute('placeholder')) traduireAttr(root, 'placeholder');
}
(function(){
  try{
    const mo=new MutationObserver(function(muts){
      if(langue()==='fr') return;
      muts.forEach(function(m){
        if(m.type==='characterData') traduireNoeud(m.target);
        else if(m.type==='attributes') traduireAttr(m.target, m.attributeName);
        else m.addedNodes.forEach(traduireNoeud);
      });
    });
    mo.observe(document.documentElement, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['placeholder','aria-label']});
  }catch(_){}
})();
function appliquerLangue(){
  document.documentElement.lang=langue();
  if(langue()!=='fr') traduireNoeud(document.body);
}
function choisirLangue(l){
  if(!LANGUES[l]) return;
  etat.langue=l; garder();
  document.documentElement.lang=l;
  if(etat.fini) rafraichirOnglet(); else aller(etat.etape);
}
ACTIONS.langue=function(b){ choisirLangue(b.dataset.l); fermer(); };
function choixLangueHTML(){
  return '<p class="titre-section">Langue · Language · Idioma</p><div class="bloc"><div class="choix-ligne">'
    +Object.keys(LANGUES).map(function(l){ return '<button class="'+(langue()===l?'on':'')+'" data-action="langue" data-l="'+l+'" lang="'+l+'">'+LANGUES[l]+'</button>'; }).join('')+'</div></div>';
}
/* Toujours différé : les dictionnaires (61, 62) se remplissent après ce fichier. */
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', appliquerLangue); else setTimeout(appliquerLangue, 0);
