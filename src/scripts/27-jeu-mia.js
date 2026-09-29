/* ══════════════════════════════════════════════════════════════════════════
   JEU DE MIA — LE POINT DE MESURE (dossier « lot 4 », collé le 29/09/2026).

   Pas un jeu d'entrée : un point de mesure qu'on rejoue, comparé au passage
   précédent (au questionnaire d'orientation pour le tout premier), le seul à
   mettre les terrains en concurrence (question 3).

   - Disponible après le premier bilan signé (state.bilanHistory) OU après trois
     jeux de terrain terminés (thèmes distincts). Ensuite en permanence, en tête
     de l'onglet Parcours (carte ajoutée par l'enveloppe de renderObjectives).
   - Question 4 : au tout premier passage, remplacée par « depuis quand ».
   - Restitution en deux blocs : les réponses, puis la comparaison — uniquement
     la question 3, uniquement si elle a changé, sans interprétation.
   - « Mes relations » : Iris, Leo ou Otis selon le contexte connu (le dernier
     de leurs trois jeux joué ; sinon l'orientation, si son terrain était les
     relations, mène à Otis comme DOMAIN_MAP ; sinon Iris). Règle choisie ici,
     le dossier ne la précise pas.
   - « Revoir mon objectif » : à la fin, ouvre le questionnaire d'objectif
     existant (startObrient) au lieu de la fiche ; le professionnel le voit au
     bilan suivant comme tout changement d'objectif.
   - Côté professionnel : la question 3 de chaque passage apparaît dans son
     espace et dans le brouillon de bilan ; trois passages consécutifs sur « je
     stagne » ajoutent le signal de stagnation existant. Rien n'est affiché à la
     personne.

   Contenu non fourni par le dossier, écrit ici : restitutions, options de la
   question 4 du premier passage, réponses de la branche courte.

   Nora : dossier reçu, volontairement NON intégré (brouillon à faire relire par
   le professionnel avant toute mise en service, combinaisons d'arrêt anticipé
   non précisées).
   ══════════════════════════════════════════════════════════════════════════ */

var MIA_TERRAIN={
  sommeil:{phrase:'de ton sommeil et de ton énergie', court:'ton sommeil et ton énergie', auj:'c’est ton sommeil et ton énergie'},
  travail:{phrase:'du travail', court:'le travail', auj:'c’est le travail'},
  relations:{phrase:'de tes relations', court:'tes relations', auj:'ce sont tes relations'},
  soi:{phrase:'de ce que tu te dis', court:'ce que tu te dis', auj:'c’est ce que tu te dis'},
  vie:{phrase:'de ce que tu fais de ta vie', court:'ce que tu fais de ta vie', auj:'c’est ce que tu fais de ta vie'}
};
/* terrains de l'orientation (09-couleur-questionnaires.js, DOMAIN_MAP) vers ceux de la question 3 */
var ORIENT_TO_TERRAIN={energie:'sommeil', travail:'travail', relations:'relations', soi:'soi'};

GAMES.point = {
  agent:'mia',
  label:'Ton point de mesure',
  accroche:'Cinq questions sur là où tu en es.',
  reflectionMs:20000,
  q1:{
    title:'La dernière fois que tu as senti que tu avançais.',
    options:[
      {label:'Ces jours-ci', restit:'Ces jours-ci, tu as senti que tu avançais.'},
      {label:'Cette semaine', restit:'La dernière fois que tu as senti que tu avançais, c’était cette semaine.'},
      {label:'Ce mois-ci', restit:'La dernière fois que tu as senti que tu avançais, c’était ce mois-ci.'},
      {label:'Cette année', restit:'La dernière fois que tu as senti que tu avançais, c’était cette année.'},
      {label:"Il y a plus d'un an", restit:"Tu n'as pas senti que tu avançais depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus quand tu as senti que tu avançais.'}
  },
  q2:{
    title:'En ce moment, ton objectif principal.',
    options:[
      {label:"J'avance dessus", branch:'short', restit:'Tu avances sur ton objectif principal.'},
      {label:"J'avance, mais moins qu'avant", branch:'normal', restit:"Tu avances sur ton objectif principal, mais moins qu'avant."},
      {label:'Je stagne', branch:'normal', restit:'Tu stagnes sur ton objectif principal.'},
      {label:"Je ne sais plus s'il est encore le bon", branch:'normal', restit:"Tu ne sais plus si ton objectif principal est encore le bon."},
      {label:"Je n'y pense plus vraiment", branch:'normal', restit:"Tu n'y penses plus vraiment."}
    ],
    dropout:{label:'Ça dépend des semaines', branch:'irregular', restit:'Ça dépend des semaines.'}
  },
  q3:{
    title:'Ce qui pèse le plus en ce moment.',
    titleIrregular:'Ce qui fait la différence entre une semaine où tu avances et une semaine où tu stagnes.',
    options:[
      {label:'Mon sommeil, mon énergie', exit:'miro', terrain:'sommeil', restit:"Ce qui pèse le plus, c'est ton sommeil et ton énergie."},
      {label:'Mon travail', exit:'mateo', terrain:'travail', restit:"Ce qui pèse le plus, c'est ton travail."},
      {label:'Mes relations', exit:'iris', exitRelations:true, terrain:'relations', restit:'Ce qui pèse le plus, ce sont tes relations.'},
      {label:'Ce que je me dis à moi-même', exit:'felix', terrain:'soi', restit:"Ce qui pèse le plus, c'est ce que tu te dis à toi-même."},
      {label:'Ce que je fais de ma vie en général', exit:'atlas', terrain:'vie', restit:"Ce qui pèse le plus, c'est ce que tu fais de ta vie en général."}
    ],
    dropout:{label:'Je ne sais pas', exit:'mia', restit:'Tu ne saurais pas dire ce qui pèse le plus.'}
  },
  q4:{
    title:'Depuis la dernière fois, ce qui a bougé.',
    options:[
      {label:"Quelque chose s'est débloqué", restit:"Depuis la dernière fois, quelque chose s'est débloqué."},
      {label:"Rien n'a vraiment changé", restit:"Depuis la dernière fois, rien n'a vraiment changé."},
      {label:"Ça s'est compliqué", restit:"Depuis la dernière fois, ça s'est compliqué."},
      {label:'Autre chose est devenu plus important', restit:'Depuis la dernière fois, autre chose est devenu plus important.'}
    ],
    dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui a bougé depuis la dernière fois.'}
  },
  /* premier passage uniquement (voir gameQuestionDefForKey plus bas) */
  q4First:{
    title:"Depuis quand c'est comme ça.",
    options:[
      {label:'Depuis quelques jours', restit:"C'est comme ça depuis quelques jours."},
      {label:'Depuis quelques semaines', restit:"C'est comme ça depuis quelques semaines."},
      {label:'Depuis quelques mois', restit:"C'est comme ça depuis quelques mois."},
      {label:"Depuis plus d'un an", restit:"C'est comme ça depuis plus d'un an."}
    ],
    dropout:{label:'Je ne sais plus', restit:'Tu ne sais plus depuis quand c’est comme ça.'}
  },
  q5:{
    title:'Pour les semaines qui viennent.',
    options:[
      {label:'Continuer comme ça', restit:'Pour les semaines qui viennent, tu veux continuer comme ça.'},
      {label:"Changer d'angle", restit:"Pour les semaines qui viennent, tu veux changer d'angle."},
      {label:'Lever le pied', restit:'Pour les semaines qui viennent, tu veux lever le pied.'},
      {label:'Revoir mon objectif', reviewObjective:true, restit:'Pour les semaines qui viennent, tu veux revoir ton objectif.'}
    ],
    dropout:{label:'Je ne sais pas par où commencer', restit:'Tu ne sais pas par où commencer.'}
  },
  short:{
    q1:{
      title:'Depuis quand ça avance.',
      options:[
        {label:'Depuis quelques jours', restit:'Ça avance depuis quelques jours.'},
        {label:'Depuis quelques semaines', restit:'Ça avance depuis quelques semaines.'},
        {label:'Depuis quelques mois', restit:'Ça avance depuis quelques mois.'},
        {label:'Depuis le début', restit:'Ça avance depuis le début.'}
      ]
    },
    q2:{
      title:'Ce qui fait que ça avance.',
      options:[
        {label:'Un rythme qui me tient', restit:'Ce qui fait avancer, c’est un rythme qui te tient.'},
        {label:'Un objectif qui me parle vraiment', restit:'Ce qui fait avancer, c’est un objectif qui te parle vraiment.'},
        {label:'Le soutien que je reçois', restit:'Ce qui fait avancer, c’est le soutien que tu reçois.'}
      ],
      dropout:{label:'Je ne sais pas', restit:'Tu ne saurais pas dire ce qui fait avancer.'}
    }
  }
};

/* ─────────── disponibilité ─────────── */
function miaGameRuns(){ return ((state.gameRuns||{}).point||[]).filter(function(r){ return r.completed; }); }
function terrainGamesDone(){
  var runs=state.gameRuns||{};
  return Object.keys(runs).filter(function(k){ return k!=='point' && (runs[k]||[]).some(function(r){ return r.completed; }); }).length;
}
function miaGameAvailable(){ return (state.bilanHistory||[]).length>0 || terrainGamesDone()>=3; }

/* ─────────── question 4 : « depuis quand » au premier passage ─────────── */
(function(){
  var base=gameQuestionDefForKey;
  if(typeof base!=='function') return;
  window.gameQuestionDefForKey=function(g, key, branch){
    if(key==='q4' && g && g.q4First && _game && GAMES[_game.theme]===g && !miaGameRuns().length) return g.q4First;
    return base.apply(this, arguments);
  };
})();

/* ─────────── « Mes relations » : Iris, Leo ou Otis selon le contexte connu ─────────── */
function miaRelationsAgent(){
  var runs=state.gameRuns||{}, best=null, at=0;
  [['relation','leo'],['affirmation','otis'],['lien','iris']].forEach(function(p){
    (runs[p[0]]||[]).forEach(function(r){ if(r.completed && r.at>at){ at=r.at; best=p[1]; } });
  });
  if(best) return best;
  if(state.objAnswers && state.objAnswers.domain==='relations') return 'otis';
  return 'iris';
}
(function(){
  var base=gamePick;
  if(typeof base!=='function') return;
  window.gamePick=function(step, idx){
    try{
      if(_game && _game.theme==='point' && step==='q3'){
        var opt=GAMES.point.q3.options[idx];
        if(opt && opt.exitRelations) opt.exit=miaRelationsAgent();
      }
    }catch(e){}
    return base.apply(this, arguments);
  };
})();

/* ─────────── restitution : deuxième bloc, la comparaison ─────────── */
function miaComparisonText(){
  if(!_game || _game.theme!=='point' || _game.branch==='short') return '';
  var now=_game.answers.q3; if(!now || !now.terrain) return '';
  var runs=miaGameRuns();
  /* le passage en cours vient d'être enregistré : le précédent est l'avant-dernier terminé */
  var prev=null;
  for(var i=runs.length-2;i>=0;i--){ if(runs[i].terrain){ prev=runs[i]; break; } }
  var nowT=MIA_TERRAIN[now.terrain];
  if(prev){
    if(prev.terrain===now.terrain) return '';
    var when=ilYa(prev.at);
    return (when==='Aujourd’hui' ? 'Tout à l’heure' : when)+', tu situais ça du côté '+MIA_TERRAIN[prev.terrain].phrase+'. Aujourd’hui, '+nowT.auj+'.';
  }
  var orient=state.objAnswers && ORIENT_TO_TERRAIN[state.objAnswers.domain];
  if(orient && orient!==now.terrain){
    return 'Quand tu as posé ton objectif, tu situais ça du côté '+MIA_TERRAIN[orient].phrase+'. Aujourd’hui, '+nowT.auj+'.';
  }
  return '';
}
(function(){
  var base=gameAdvance;
  if(typeof base!=='function') return;
  window.gameAdvance=function(fromStep){
    var r=base.apply(this, arguments);
    /* après l'enregistrement de la série (atteinte de la restitution), on y ajoute le terrain
       et l'état de l'objectif, lus par la comparaison et par l'espace du professionnel */
    try{
      if(_game && _game.theme==='point' && _game.step==='restitution'){
        var runs=(state.gameRuns||{}).point||[], last=runs[runs.length-1];
        if(last){
          last.terrain=(_game.branch!=='short' && _game.answers.q3 && _game.answers.q3.terrain) || null;
          last.state=_game.answers.q2 ? _game.answers.q2.label : null;
          persist();
          var cmp=miaComparisonText();
          if(cmp){
            var p=document.querySelector('#game-inner .game-restit');
            if(p) p.insertAdjacentHTML('beforeend','<p class="game-restit-cmp">'+escapeHtml(cmp)+'</p>');
          }
        }
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── sortie : « revoir mon objectif » ouvre le questionnaire d'objectif ─────────── */
(function(){
  var base=gameRenderSortie;
  if(typeof base!=='function') return;
  window.gameRenderSortie=function(){
    if(_game && _game.theme==='point' && _game.answers.q5 && _game.answers.q5.reviewObjective){
      gameClose();
      if(typeof startObrient==='function') startObrient();
      return;
    }
    return base.apply(this, arguments);
  };
})();

/* ─────────── en tête de l'onglet Parcours ─────────── */
function miaGameCardHTML(){
  var runs=miaGameRuns(), last=runs[runs.length-1];
  var sub = last ? ('Dernier point : '+ilYa(last.at).toLowerCase()) : GAMES.point.accroche;
  return '<div class="mia-point-card">'
    +'<span class="mia-point-ava">'+brainSVG()+'</span>'
    +'<span class="mia-point-tx"><span class="mia-point-t">Ton point de mesure</span><span class="mia-point-s">'+escapeHtml(sub)+'</span></span>'
    +'<button class="cap-edit mia-point-btn" onclick="openGame(\'point\')">'+(last?'Refaire le point':'Faire le point')+'</button>'
    +'</div>';
}
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var pad=$('obj-pad');
      if(pad && miaGameAvailable()){
        var sub=pad.querySelector('.obj-greet-sub');
        if(sub) sub.insertAdjacentHTML('afterend', miaGameCardHTML());
        else pad.insertAdjacentHTML('afterbegin', miaGameCardHTML());
      }
    }catch(e){}
    return r;
  };
})();

/* ─────────── côté professionnel ─────────── */
function miaPointLinesForPro(){
  return miaGameRuns().slice(-6).reverse().map(function(r){
    var d=new Date(r.at), dt=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
    var t=r.terrain ? MIA_TERRAIN[r.terrain].court : 'non précisé';
    return {date:dt, terrain:t, state:r.state||''};
  });
}
(function(){
  var base=proSignals;
  if(typeof base!=='function') return;
  window.proSignals=function(){
    var s=base.apply(this, arguments)||[];
    try{
      var runs=miaGameRuns(), last3=runs.slice(-3);
      if(last3.length===3 && last3.every(function(r){ return r.state==='Je stagne'; }) && !s.some(function(x){ return x.k==='stagnation'; })){
        s.push({k:'stagnation', d:'Trois points de mesure de suite sur « je stagne ».', w:'Traité au bilan mensuel'});
      }
    }catch(e){}
    return s;
  };
})();
(function(){
  var base=draftBilanText;
  if(typeof base!=='function') return;
  window.draftBilanText=function(){
    var txt=base.apply(this, arguments);
    try{
      var l=miaPointLinesForPro()[0];
      if(l) txt+='\n\nDernier point de mesure ('+l.date+') : ce qui pèse le plus, '+l.terrain+'.';
    }catch(e){}
    return txt;
  };
})();
(function(){
  var base=renderProDashboard;
  if(typeof base!=='function') return;
  window.renderProDashboard=function(){
    var r=base.apply(this, arguments);
    try{
      var lines=miaPointLinesForPro(); if(!lines.length) return r;
      var body=$('pd-body'); if(!body) return r;
      var h='<div class="block-title">Points de mesure</div><div class="pro-card"><div class="pro-blk">'
        +lines.map(function(l){ return '<div class="pro-tx" style="margin-bottom:6px"><b>'+l.date+'</b> · ce qui pèse le plus : '+escapeHtml(l.terrain)+(l.state?' · objectif : '+escapeHtml(l.state.toLowerCase()):'')+'</div>'; }).join('')
        +'</div></div>';
      var titles=body.querySelectorAll('.block-title'), hist=null;
      for(var i=0;i<titles.length;i++){ if(/Historique des bilans/.test(titles[i].textContent)){ hist=titles[i]; break; } }
      if(hist) hist.insertAdjacentHTML('beforebegin', h); else body.insertAdjacentHTML('beforeend', h);
    }catch(e){}
    return r;
  };
})();
