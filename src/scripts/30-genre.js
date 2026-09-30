/* ══════════════════════════════════════════════════════════════════════════
   MASCULIN / FÉMININ — décision du porteur du projet, 29/09/2026.

   À l'inscription (écran du prénom) et dans le profil : « Homme · Femme · Je
   préfère ne pas répondre ». state.gender vaut 'h', 'f' ou 'n' ; 'n' et
   l'absence de réponse sont traités au masculin (choix explicite du porteur du
   projet, maintenu après discussion). CLAUDE.md, section 2, a été mis à jour.

   Trois couches :
   1. Textes affichés : les contenus sont écrits au masculin ; accordFeminin()
      les accorde au féminin selon des règles ciblées (chaque règle porte sur une
      tournure précise, jamais sur un mot isolé : « c'est le plus dur », « du
      temps seul », « tu t'es fixé un programme », « tu as senti que » ne
      bougent pas). Appliquée automatiquement à tout texte ajouté à l'écran
      (MutationObserver), SAUF le fil de discussion et les champs de saisie :
      on ne réécrit jamais ce que la personne tape ni ce que l'IA répond.
   2. L'IA : composeSystem() reçoit une consigne d'accord.
   3. Les accompagnantes (MIA, Ava, Iris, Eden, Nora) : « Elle dort », « La
      réveiller », « Ce qu'elle fait avec toi », quel que soit le genre de la
      personne.
   ══════════════════════════════════════════════════════════════════════════ */

function isFem(){ return state.gender==='f'; }
function setGender(g){
  state.gender = (g==='f'||g==='h') ? g : 'n';
  persist();
  try{ document.querySelectorAll('.gender-pick .gp').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-g')===state.gender); }); }catch(e){}
  /* textes déjà affichés : on relance les rendus des écrans ouverts */
  try{ var sc=activeScreen(); if(sc && sc.indexOf('tab-')===0) showTab(sc.replace('tab-','')); }catch(e){}
  try{ if(isFem()) accordNode(document.body); }catch(e){}
}

/* ─────────── 1. règles d'accord ─────────── */
var FEM_RULES=[
  /* participes après « tu t'es » (verbe pronominal, accord avec le sujet) — pas « fixé », suivi d'un complément */
  [/(t['’]es(?:\s+(?:pas|jamais|vraiment|déjà|toujours))*\s+)(senti|réveillé|forcé|préparé|organisé|inscrit|informé|entraîné|dépensé|rempli|occupé)(?![\p{L}])/gu, '$1$2e'],
  [/(réveillée(?:\s+vraiment)?\s+)reposé(?![\p{L}])/gu, '$1reposée'],
  [/((?:te|me)\s+sens(?:\s+(?:pas|plus))?\s+|d['’]être\s+)prêt(?![\p{L}])/gu, '$1prête'],
  [/((?:te|me)\s+sens(?:\s+(?:pas|plus))?\s+)(obligé|soutenu)(?![\p{L}])/gu, '$1$2e'],
  [/((?:suis|es|sens|tout,)\s+)seul(?![\p{L}])/gu, '$1seule'],
  [/(?<![\p{L}])Seul(\s+depuis)/gu, 'Seule$1'],
  [/(même\s+)entouré(?![\p{L}])/gu, '$1entourée'],
  [/((?:suis|es)\s+plus\s+)dur(?![\p{L}])/gu, '$1dure'],
  [/((?:suis|es)\s+)(épuisé|fatigué|sorti)(?![\p{L}])/gu, '$1$2e'],
  [/(journée(?:\s+de\s+travail)?\s+)satisfait(?![\p{L}])/gu, '$1satisfaite'],
  [/(tu\s+es\s+)entouré(?![\p{L}])/gu, '$1entourée'],
  [/(fois\s+)lancé(?![\p{L}])/gu, '$1lancée'],
  [/(été\s+)fier(?![\p{L}])/gu, '$1fière'],
  [/(?<![\p{L}])tel(\s+que\s+(?:je\s+suis|tu\s+es))/gu, 'telle$1'],
  [/(?<![\p{L}])Séparé(?![\p{L}])/gu, 'Séparée'],
  /* profils du questionnaire (« Le Moteur », « L'Ancre », « Le Pilier » sont des choses : inchangés) */
  [/Le Relieur/g, 'La Relieuse'], [/Le Stratège/g, 'La Stratège'], [/Le Fédérateur/g, 'La Fédératrice'],
  [/Le Bâtisseur/g, 'La Bâtisseuse'], [/Le Tacticien/g, 'La Tacticienne'], [/Le Médiateur/g, 'La Médiatrice'],
  [/L['’]Observateur/g, 'L’Observatrice']
];
function accordFeminin(str){
  if(typeof str!=='string' || !str) return str;
  var out=str;
  FEM_RULES.forEach(function(r){ out=out.replace(r[0], r[1]); });
  return out;
}
/* zones jamais réécrites : fil de discussion, saisies, éditeur de consignes */
function accordExcluded(el){
  return !!(el && el.closest && el.closest('#messages, textarea, input, [contenteditable], script, style, .no-accord'));
}
function accordNode(root){
  if(!isFem() || !root) return;
  if(root.nodeType===3){
    if(!accordExcluded(root.parentElement)){ var v=accordFeminin(root.nodeValue); if(v!==root.nodeValue) root.nodeValue=v; }
    return;
  }
  if(root.nodeType!==1 || accordExcluded(root)) return;
  var w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list=[];
  while((n=w.nextNode())) list.push(n);
  list.forEach(function(t){ if(!accordExcluded(t.parentElement)){ var v=accordFeminin(t.nodeValue); if(v!==t.nodeValue) t.nodeValue=v; } });
}
(function(){
  try{
    var mo=new MutationObserver(function(muts){
      if(!isFem()) return;
      muts.forEach(function(m){
        if(m.type==='characterData') accordNode(m.target);
        else m.addedNodes.forEach(function(x){ accordNode(x); });
      });
    });
    mo.observe(document.documentElement, {childList:true, subtree:true, characterData:true});
  }catch(e){}
})();

/* ─────────── inscription et profil : le choix ─────────── */
function genderPickHTML(){
  var g=state.gender||'';
  return '<div class="gender-pick" role="group" aria-label="Tu es">'
    +[['h','Homme'],['f','Femme'],['n','Je préfère ne pas répondre']].map(function(o){
      return '<button type="button" class="gp'+(g===o[0]?' on':'')+'" data-g="'+o[0]+'" onclick="setGender(\''+o[0]+'\')">'+o[1]+'</button>';
    }).join('')+'</div>';
}
(function(){
  try{
    var field=document.getElementById('ob-firstname-input');
    var wrap=field && field.closest('.ob-field');
    if(wrap) wrap.insertAdjacentHTML('afterend','<div class="yw-label gender-label">Tu es</div>'+genderPickHTML());
  }catch(e){}
})();
(function(){
  var base=renderProfile;
  if(typeof base!=='function') return;
  window.renderProfile=function(){
    var r=base.apply(this, arguments);
    try{
      var inp=document.getElementById('prof-name'), blk=inp && inp.closest('.block');
      if(blk && !blk.querySelector('.gender-pick')) blk.insertAdjacentHTML('beforeend','<div class="gender-sub">Tu es</div>'+genderPickHTML());
    }catch(e){}
    return r;
  };
})();

/* ─────────── 2. l'IA ─────────── */
(function(){
  var base=composeSystem;
  if(typeof base!=='function') return;
  window.composeSystem=function(){
    var s=base.apply(this, arguments);
    try{
      var line = isFem()
        ? "Accord : la personne est une femme. Accorde au féminin tout ce qui la désigne (« tu es prête », « tu t'es sentie »)."
        : "Accord : adresse-toi à la personne au masculin (« tu es prêt », « tu t'es senti »).";
      if(typeof s==='string') s = s + SEP + line;
    }catch(e){}
    return s;
  };
})();

/* ─────────── 3. les accompagnantes ─────────── */
var AGENT_FEM=['mia','ava','iris','eden','nora'];
function agentFem(id){ return AGENT_FEM.indexOf(id)>=0; }
(function(){
  var base=renderSleepFiche;
  if(typeof base!=='function') return;
  window.renderSleepFiche=function(id){
    var r=base.apply(this, arguments);
    try{
      if(agentFem(id)){
        var box=$('sleep-body');
        var badge=box.querySelector('.sleep-badge'); if(badge) badge.textContent='Elle dort';
        [].forEach.call(box.querySelectorAll('button'), function(b){ if(b.textContent==='Le réveiller') b.textContent='La réveiller'; });
      }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=openAgentDeck;
  if(typeof base!=='function') return;
  window.openAgentDeck=function(){
    var r=base.apply(this, arguments);
    try{
      AGENT_FEM.forEach(function(id){
        var p=document.querySelector('#deck-track .deck-page[data-id="'+id+'"]'); if(!p) return;
        [].forEach.call(p.querySelectorAll('.deck-sec'), function(s){ s.textContent=s.textContent.replace('Ce qu’il fait', 'Ce qu’elle fait'); });
      });
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=entRenderFiche;
  if(typeof base!=='function') return;
  window.entRenderFiche=function(){
    var r=base.apply(this, arguments);
    try{
      if(agentFem(_entSelected)){
        var box=$('ent-fiche');
        [].forEach.call(box.querySelectorAll('span, button'), function(el){
          if(el.childElementCount===0 && el.textContent==='Il dort') el.textContent='Elle dort';
          if(el.textContent==='Le réveiller') el.textContent='La réveiller';
        });
      }
    }catch(e){}
    return r;
  };
})();
/* légende du récapitulatif : valable pour tous, sans pronom */
(function(){
  try{ document.querySelectorAll('.recap-legend .rl-item').forEach(function(el){ if(/Il dort/.test(el.textContent)) el.lastChild.nodeValue='Endormi'; }); }catch(e){}
})();
