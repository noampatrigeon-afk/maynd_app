/* ═══════════════ COULEURS DES ACCOMPAGNANTS — toute la palette, par thème ═══════════════ */
var AGENT_COLORS={
  mia:'#974AF0',     /* co-pilote            violet MAYND        */
  naoki:'#6F2FC0',   /* discipline           violet profond      */
  felix:'#FFC400',   /* confiance            jaune               */
  atlas:'#8B5CF6',   /* identité et sens     violet clair        */
  ava:'#16389E',     /* émotions et deuil    bleu profond        */
  leo:'#E5484D',     /* couple               rouge corail        */
  otis:'#00A862',    /* communication        vert                */
  kael:'#FE6601',    /* sport                orange              */
  miro:'#3B2FA8',    /* sommeil              indigo              */
  sol:'#0C96C7',     /* anxiété, respiration bleu ciel           */
  mateo:'#224CF2',   /* travail              bleu franc          */
  soren:'#E07C00',   /* parentalité          orange chaud        */
  iris:'#00A862',    /* lien social          vert                */
  eden:'#E8467F',    /* sexualité            rose                */
  vince:'#00875A',   /* argent               émeraude            */
  neo:'#6F2FC0'      /* addictions           violet profond      */
};
var LIGHT_AGENTS=['felix'];
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* la fiche de présentation passe en texte noir sur fond clair */
(function(){
  var f=window.openAgentDeck;
  if(typeof f!=='function') return;
  window.openAgentDeck=function(){
    var r=f.apply(this, arguments);
    try{
      var pages=document.querySelectorAll('#deck-track .deck-page');
      for(var i=0;i<pages.length;i++){
        pages[i].classList.toggle('light', LIGHT_AGENTS.indexOf(pages[i].getAttribute('data-id'))>=0);
      }
    }catch(e){}
    return r;
  };
  var g=window.deckSync;
  if(typeof g==='function'){
    window.deckSync=function(i){
      var r=g.apply(this, arguments);
      try{
        if(i==null) i=deckIndex();
        var d=document.getElementById('deck');
        if(d) d.classList.toggle('light', LIGHT_AGENTS.indexOf(DECK_IDS[i])>=0);
      }catch(e){}
      return r;
    };
  }
})();


/* ═══════════════ OBJECTIF PRINCIPAL + SECONDAIRES — modèle de données ═══════════════ */
(function(){
  var base=addObjective;
  if(typeof base!=='function') return;
  window.addObjective=function(name, steps, link, principal){
    var o=base.apply(this, [name, steps, link]);
    if(!o) return o;
    o.createdAt=o.createdAt||Date.now();
    var hasPrincipal=(state.objectives||[]).some(function(x){ return x!==o && x.principal; });
    if(principal || !hasPrincipal){
      state.objectives.forEach(function(x){ x.principal=(x===o); });
      state.principalObjectiveId=o.id;
    } else {
      o.principal=false;
    }
    persist();
    return o;
  };
})();
function getPrincipalObjective(){
  var list=state.objectives||[];
  return list.find(function(o){ return o.id===state.principalObjectiveId; })
      || list.find(function(o){ return o.principal; })
      || null;
}
function sameMonth(a,b){ var da=new Date(a), db=new Date(b); return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth(); }
function promoteObjective(id){
  if(state.tier==='free'){ openUpsell('objectives'); return; }
  var o=(state.objectives||[]).find(function(x){ return x.id===id; });
  if(!o || o.principal) return;
  state.objectives.forEach(function(x){ x.principal=(x===o); });
  state.principalObjectiveId=o.id;
  state.principalChanges=(state.principalChanges||[]).filter(function(ts){ return sameMonth(ts, Date.now()); });
  state.principalChanges.push(Date.now());
  persist();
  toast('Nouvel objectif principal : '+o.name);
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
var SECONDARY_OBJ_NAME={
  naoki:'Installer une habitude qui tient, un jour à la fois',
  otis:'Mieux te faire entendre dans tes échanges',
  sol:'Retrouver un peu de calme dans ta journée',
  atlas:'Y voir plus clair sur ce qui compte pour toi',
  felix:'Renforcer la confiance en toi, pas à pas',
  kael:'Bouger un peu plus, à ton rythme',
  iris:'Recréer du lien avec les gens autour de toi',
  mateo:'Avancer sur ce qui compte au travail'
};
function addSecondaryFromCap(agentId){
  if(!agentId || !byId(agentId)) return null;
  var already=(state.objectives||[]).some(function(o){ return o.fromCap && o.secondaryOf===agentId; });
  if(already) return null;
  var a=byId(agentId);
  var name=SECONDARY_OBJ_NAME[agentId]||a.domain||a.name;
  var o=addObjective(name, 3, agentId, false);
  o.fromCap=true; o.secondaryOf=agentId;
  persist();
  return o;
}
(function(){
  var base=objqFinish;
  if(typeof base!=='function') return;
  window.objqFinish=function(){
    state.objectives=(state.objectives||[]).filter(function(o){ return !(o.fromCap && o.secondaryOf); });
    var r=base.apply(this, arguments);
    try{
      var capObj=(state.objectives||[]).find(function(o){ return o.fromCap && !o.secondaryOf; });
      if(capObj){
        state.objectives.forEach(function(x){ x.principal=(x===capObj); });
        state.principalObjectiveId=capObj.id;
        if(state.tier!=='free'){
          var ans=state.objAnswers||{};
          var helpAgent=(typeof HELP_AGENT!=='undefined' && HELP_AGENT[ans.help])||null;
          if(ans.inner==='harsh') helpAgent='felix';
          var likeAgent=(typeof LIKE_AGENT!=='undefined' && ans.likes) ? (LIKE_AGENT[ans.likes]||null) : null;
          [helpAgent, likeAgent].forEach(function(id){ if(id && id!==capObj.link) addSecondaryFromCap(id); });
        }
        persist();
      }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=openUpsell;
  if(typeof base!=='function') return;
  window.openUpsell=function(reason){
    if(reason==='objectives'){ showPaywall('maynd','Objectifs secondaires réservés aux abonnés','Passe à MAYND pour ajouter des objectifs secondaires en plus de ton objectif principal.'); return; }
    return base.apply(this, arguments);
  };
})();
(function(){
  var base=openObjSheet;
  if(typeof base!=='function') return;
  window.openObjSheet=function(){
    if(state.tier==='free' && (state.objectives||[]).length>=1){ openUpsell('objectives'); return; }
    return base.apply(this, arguments);
  };
})();
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var cards=document.querySelectorAll('#obj-pad .objective');
      var list=state.objectives||[];
      cards.forEach(function(card, i){
        var o=list[i]; if(!o) return;
        var head=card.querySelector('.oh'); if(!head) return;
        var old=head.querySelector('.obj-role'); if(old) old.remove();
        var delBtn=head.querySelector('.odel');
        var nameEl=head.querySelector('.on');
        if(nameEl && !o.archived){
          nameEl.style.cursor='pointer';
          nameEl.title='Renommer';
          nameEl.onclick=function(ev){ ev.stopPropagation(); renameObjective(o.id); };
        }
        var pill=document.createElement('span');
        pill.className='obj-role';
        pill.style.cssText='align-self:center;font-family:Poppins,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:99px;';
        if(o.principal){
          pill.textContent='Principal';
          pill.style.background=o.color; pill.style.color='#fff';
        } else if(state.tier!=='free'){
          pill.textContent='Faire principal';
          pill.style.background='rgba(15,15,20,.06)'; pill.style.color='var(--ink,#15131c)'; pill.style.cursor='pointer';
          pill.onclick=function(ev){ ev.stopPropagation(); promoteObjective(o.id); };
        } else { return; }
        if(delBtn) head.insertBefore(pill, delBtn); else head.appendChild(pill);
        if(o.closureProposed){
          var badge=card.querySelector('.obadge');
          if(badge){
            var note=document.createElement('span');
            note.textContent=' · validation en attente';
            badge.appendChild(note);
          }
        }
        if(!o.deepDone){
          var ofoot=card.querySelector('.ofoot');
          if(ofoot){
            var deepBtn=document.createElement('button');
            deepBtn.type='button';
            deepBtn.className='obj-deep-cta';
            deepBtn.textContent='Mieux cerner cet objectif';
            deepBtn.style.cssText='margin-left:8px;background:none;border:none;font-size:11px;font-weight:700;color:var(--mist,#8b8894);text-decoration:underline;text-decoration-style:dotted;cursor:pointer;padding:0';
            deepBtn.onclick=function(ev){ ev.stopPropagation(); openDeepSheet(o.id); };
            ofoot.appendChild(deepBtn);
          }
        }
      });
      var archive=state.objectivesArchive||[];
      var pad=document.getElementById('obj-pad');
      if(pad && state.tier!=='free' && archive.length && !pad.querySelector('.archive-list')){
        var h='<div class="section-head"><h2>Chemin parcouru</h2></div><div class="archive-list">';
        archive.slice().reverse().forEach(function(o){
          var d=o.archivedAt?new Date(o.archivedAt):null;
          var dateTxt=d?(String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()):'';
          h+='<div class="objective archived" style="opacity:.65"><div class="oh"><span class="odot" style="background:'+o.color+'"></span><span class="on">'+escapeHtml(o.name)+'</span></div>'
            +'<div class="ofoot"><span class="opct">Clôturé'+(dateTxt?(' le '+dateTxt):'')+(o.archivedBy?(' · validé par '+escapeHtml(o.archivedBy)):'')+'</span></div></div>';
        });
        h+='</div>';
        pad.insertAdjacentHTML('beforeend', h);
      }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=stepObjective;
  if(typeof base!=='function') return;
  window.stepObjective=function(id){
    var o=(state.objectives||[]).find(function(x){ return x.id===id; });
    var wasDone=!!(o && o.progress>=o.steps);
    var r=base.apply(this, arguments);
    if(o && !wasDone){
      var now=Date.now();
      o.lastStepAt=now;
      o.stepLog=(o.stepLog||[]).concat(now).slice(-30);
      if(o.progress>=o.steps && !o.closureProposed) o.closureProposed=true;
      persist();
    }
    return r;
  };
})();
function validateClosure(id){
  var list=state.objectives||[];
  var idx=list.findIndex(function(x){ return x.id===id; });
  if(idx<0) return;
  var o=list[idx];
  list.splice(idx,1);
  o.archived=true; o.archivedAt=Date.now(); o.archivedBy=proName(); o.closureProposed=false;
  var wasPrincipal=!!o.principal;
  o.principal=false;
  state.objectivesArchive=(state.objectivesArchive||[]);
  state.objectivesArchive.push(o);
  if(wasPrincipal){
    var next=list.find(function(x){ return !x.archived; });
    list.forEach(function(x){ x.principal=(x===next); });
    state.principalObjectiveId=next?next.id:null;
  }
  persist();
  toast('Objectif clôturé, archivé dans le chemin parcouru.');
  try{ renderProSheet(); }catch(e){}
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
(function(){
  var base=renderProSheet;
  if(typeof base!=='function') return;
  window.renderProSheet=function(){
    var r=base.apply(this, arguments);
    try{
      var pending=(state.objectives||[]).filter(function(o){ return o.closureProposed && !o.archived; });
      if(pending.length){
        var body=document.getElementById('pro-sheet-body');
        if(body){
          var h='<div class="block-title">Clôtures proposées par MIA</div>';
          pending.forEach(function(o){
            h+='<div class="pro-blk"><div class="pro-tx">« '+escapeHtml(o.name)+' » semble atteint. À valider pour l’archiver dans le chemin parcouru.</div>'
              +'<button class="btn full light" onclick="validateClosure(\''+o.id+'\')">Valider la clôture</button></div>';
          });
          body.insertAdjacentHTML('beforeend', h);
        }
      }
    }catch(e){}
    return r;
  };
})();


/* ═══════════════ LES 4 SIGNAUX — détection réelle à partir du parcours ═══════════════ */
/* Seuils à calibrer avec le professionnel qui portera la supervision (non chiffrés dans le plan d'affaires). */
var SIGNAL_TUNING={ stagnationDays:5, blocageDays:12, blocageKeywordMin:2, progressionSteps:2, progressionDays:7 };
var STAGNATION_WORDS=['bloqué','bloquée','je bloque','coincé','coincée','je n’y arrive pas','je n’y arrive plus','ça ne bouge pas','rien ne change','toujours pareil','je stagne','je n’avance pas','je tourne en rond'];
var BLOCAGE_WORDS=['je craque','je n’en peux plus','épuisé','épuisée','je lâche','j’abandonne','à bout','je n’y crois plus'];
function normApos(s){ return String(s).replace(/[’‘]/g,"'"); }
function recentUserText(days){
  var since=Date.now()-days*86400000;
  var out=[];
  (state.threads||[]).forEach(function(th){
    if((th.updated||0)<since) return;
    (th.msgs||[]).forEach(function(m){ if(m.role==='user' && typeof m.content==='string') out.push(normApos(m.content.toLowerCase())); });
  });
  return out.join(' \n ');
}
function countHits(text, words){ var n=0; words.forEach(function(w){ if(text.indexOf(normApos(w.toLowerCase()))>=0) n++; }); return n; }
function proSignals(){
  var s=[];
  var changes=(state.principalChanges||[]).filter(function(ts){ return sameMonth(ts, Date.now()); });
  if(changes.length>4) s.push({k:'desalignement', d:'Le cap a changé '+changes.length+' fois ce mois-ci.', w:'Traité au bilan mensuel'});
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  var lastStep=principal?(principal.lastStepAt||principal.createdAt||0):0;
  if(principal && lastStep){
    var daysSince=Math.floor((Date.now()-lastStep)/86400000);
    if(daysSince>=SIGNAL_TUNING.stagnationDays){
      var text=recentUserText(14);
      var stagHits=countHits(text, STAGNATION_WORDS);
      var blockHits=countHits(text, BLOCAGE_WORDS);
      if(daysSince>=SIGNAL_TUNING.blocageDays && (blockHits>=1 || stagHits>=SIGNAL_TUNING.blocageKeywordMin)){
        s.push({k:'blocage', d:'Aucun pas depuis '+daysSince+' jours sur « '+principal.name+' », et le ton des échanges le confirme.', w:'Intervention rapide, hors cycle mensuel'});
      } else if(stagHits>=1){
        s.push({k:'stagnation', d:'Aucun pas depuis '+daysSince+' jours sur « '+principal.name+' ».', w:'Traité au bilan mensuel'});
      }
    }
  }
  if(principal){
    var recentSteps=(principal.stepLog||[]).filter(function(ts){ return ts>=Date.now()-SIGNAL_TUNING.progressionDays*86400000; }).length;
    if(recentSteps>=SIGNAL_TUNING.progressionSteps) s.push({k:'progression', d:recentSteps+' pas cochés cette semaine sur « '+principal.name+' ».', w:'MIA a félicité, le professionnel consolide au bilan suivant'});
  }
  return s;
}


/* ═══════════════ QUESTIONNAIRE D'APPROFONDISSEMENT PAR OBJECTIF — optionnel ═══════════════ */
var DEEP_PACE_OPTS=[{t:'Tout doucement',v:'slow'},{t:'Pas à pas, régulier',v:'steady'},{t:'À fond dès que possible',v:'fast'},{t:'Je verrai au fil de l’eau',v:'flow'}];
var _deepObjId=null, _deepStep=0, _deepAns={}, _deepQ=[];
function openDeepSheet(id){
  var o=(state.objectives||[]).find(function(x){ return x.id===id; });
  if(!o) return;
  _deepObjId=id; _deepStep=0; _deepAns=o.deepAnswers?Object.assign({}, o.deepAnswers):{};
  var reusePace=!!(o.fromCap && !o.secondaryOf && state.objAnswers && state.objAnswers.pace);
  _deepQ=[
    {ax:'importance', type:'text', q:'Pourquoi cet objectif plutôt qu’un autre, maintenant ?'},
    {ax:'impact', type:'text', q:'Qu’est-ce que ça changerait concrètement dans ton quotidien ?'}
  ];
  if(reusePace){ _deepAns.engagement=state.objAnswers.pace; }
  else { _deepQ.push({ax:'engagement', type:'choice', q:'À quel rythme tu veux avancer sur cet objectif ?', opts:DEEP_PACE_OPTS}); }
  $('obj-sheet-title').textContent='Mieux cerner : '+o.name;
  renderDeepStep();
  openSheet('obj-backdrop','obj-sheet');
}
function renderDeepStep(){
  if(_deepStep>=_deepQ.length){ finishDeepSheet(); return; }
  var q=_deepQ[_deepStep];
  var h='<div class="block-title">'+escapeHtml(q.q)+'</div>';
  if(q.type==='text'){
    h+='<textarea class="qz2-ta" id="deep-ta" placeholder="Ta réponse…">'+escapeHtml(_deepAns[q.ax]||'')+'</textarea>';
    h+='<div class="studio-actions"><button class="btn full" onclick="deepNext()">Continuer</button></div>';
  } else {
    h+=q.opts.map(function(o,i){ var sel=_deepAns[q.ax]===o.v; return '<button class="qz2-opt'+(sel?' sel':'')+'" onclick="deepPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>'; }).join('');
  }
  $('obj-sheet-body').innerHTML=h;
  if(q.type==='text'){ setTimeout(function(){ try{ $('deep-ta').focus(); }catch(e){} },150); }
}
function deepNext(){
  var q=_deepQ[_deepStep];
  if(q.type==='text'){ var ta=$('deep-ta'); _deepAns[q.ax]=ta?ta.value.trim():''; }
  _deepStep++;
  renderDeepStep();
}
function deepPick(i){
  var q=_deepQ[_deepStep];
  _deepAns[q.ax]=q.opts[i].v;
  _deepStep++;
  renderDeepStep();
}
function finishDeepSheet(){
  var o=(state.objectives||[]).find(function(x){ return x.id===_deepObjId; });
  if(o){ o.deepAnswers=_deepAns; o.deepDone=true; persist(); }
  closeObjSheet();
  toast('Merci, c’est noté.');
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
(function(){
  var base=renderProSheet;
  if(typeof base!=='function') return;
  window.renderProSheet=function(){
    var r=base.apply(this, arguments);
    try{
      var p=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
      if(p && p.deepDone && p.deepAnswers){
        var body=document.getElementById('pro-sheet-body');
        if(body){
          var d=p.deepAnswers;
          var h='<div class="block-title">Ce que la personne a partagé sur « '+escapeHtml(p.name)+' »</div><div class="pro-blk">';
          if(d.importance) h+='<div class="pro-tx">Pourquoi maintenant : '+escapeHtml(d.importance)+'</div>';
          if(d.impact) h+='<div class="pro-tx">Impact au quotidien : '+escapeHtml(d.impact)+'</div>';
          if(d.engagement){ var lb=(DEEP_PACE_OPTS.find(function(o){return o.v===d.engagement;})||{}).t||d.engagement; h+='<div class="pro-tx">Rythme souhaité : '+escapeHtml(lb)+'</div>'; }
          h+='</div>';
          body.insertAdjacentHTML('beforeend', h);
        }
      }
    }catch(e){}
    return r;
  };
})();
var MOOD_NOTE_LABELS={top:'plutôt au top', bien:'plutôt bien', moyen:'en demi-teinte', bas:'plutôt bas', dur:'difficile'};
(function(){
  var base=composeSystem;
  if(typeof base!=='function') return;
  window.composeSystem=function(){
    var sys=base.apply(this, arguments);
    try{
      var bits=[];
      if(state.profile && state.profile.name){
        var prof=(typeof PROFILES!=='undefined' && PROFILES[state.profile.key])?PROFILES[state.profile.key]:null;
        bits.push('profil MAYND de la personne : '+state.profile.name+(prof&&prof.desc?' — '+prof.desc:''));
      }
      if(!state.capMeta && state.cap && state.cap.trim()) bits.push('cap qu’elle s’est fixé : '+state.cap.trim());
      var p=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
      if(p){
        bits.push('objectif principal en cours : « '+p.name+' » ('+p.progress+'/'+p.steps+' pas faits)');
        if(p.deepDone && p.deepAnswers){
          var d=p.deepAnswers;
          if(d.importance) bits.push('pourquoi cet objectif compte maintenant : '+d.importance);
          if(d.impact) bits.push('ce que ça changerait au quotidien : '+d.impact);
          if(d.engagement) bits.push('rythme souhaité : '+d.engagement);
        }
      }
      if(typeof wheelEdited==='function' && wheelEdited() && typeof getWheel==='function' && typeof WHEEL!=='undefined'){
        var w=getWheel();
        var low=WHEEL.filter(function(a){ return w[a.k]<=4; }).sort(function(a,b){ return w[a.k]-w[b.k]; });
        if(low.length) bits.push('sur sa boussole (1 à 10), ce qui est le plus bas en ce moment : '+low.map(function(a){ return wLabel(a)+' ('+w[a.k]+'/10)'; }).join(', '));
      }
      var mk=(typeof todayMood==='function')?todayMood():null;
      if(mk && MOOD_NOTE_LABELS[mk]) bits.push('humeur du jour, à accueillir sans t’y attarder : '+MOOD_NOTE_LABELS[mk]);
      if(bits.length) sys+=SEP+'Contexte silencieux, jamais à mentionner tel quel : '+bits.join(' ; ')+'.';
    }catch(e){}
    return sys;
  };
})();


/* ═══════════════ ACCUEIL — l'objectif principal en premier plan, humeur retirée de la vitrine ═══════════════ */
function renderHomeGoals(){
  var box=$('home-goals'); if(!box) return;
  var h='';
  if(state.capMeta){
    h+='<div class="hg-cap meta"><div class="hg-lbl">Ton cap</div><div class="hg-txt">Mieux me connaître avant de viser</div></div>';
  } else if(state.cap && state.cap.trim()){
    h+='<div class="hg-cap"><div class="hg-lbl">Ton cap</div><div class="hg-txt">'+escapeHtml(state.cap)+'</div>'
      +'<button class="hg-go" style="background:rgba(255,255,255,.14)" onclick="startObrient()">Recommencer</button></div>';
  } else {
    h+='<div class="hg-cap empty"><div class="hg-lbl">Ton cap</div><div class="hg-txt">Pas encore défini</div>'
      +'<button class="hg-go" onclick="startObrient()">Le trouver</button></div>';
  }
  var objs=state.objectives||[];
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  var ordered=principal?[principal].concat(objs.filter(function(o){ return o!==principal; })):objs.slice();
  function card(o){
    var isP=(o===principal);
    var done=o.progress>=o.steps, pct=Math.round(o.progress/o.steps*100);
    var link=o.link?byId(o.link):null;
    return '<div class="hg-obj'+(done?' done':'')+(isP?' hg-principal':'')+'">'
      +'<div class="hg-oh">'+(link?'<span class="hg-ava" style="background:'+link.color+'">'+(link.id==='mia'?'M':link.name[0])+'</span>':'')
      +'<span class="hg-on">'+escapeHtml(o.name)+'</span>'+(isP?'<span class="hg-ptag" style="margin-left:6px;font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mist,#8b8894)">Principal</span>':'')+'</div>'
      +'<div class="hg-bar"><i style="width:'+pct+'%;background:'+(link?link.color:'#974AF0')+'"></i></div>'
      +'<div class="hg-of"><span>'+o.progress+' / '+o.steps+'</span>'
      +(done?'<span class="hg-done">Terminé</span>':'<button class="hg-step" onclick="stepObjective(\''+o.id+'\')" style="background:'+(link?link.color:'#974AF0')+'">+ 1 pas</button>')
      +'</div></div>';
  }
  if(ordered.length){
    h+=ordered.slice(0,3).map(card).join('');
    if(ordered.length>3) h+='<button class="hg-all" onclick="showTab(\'objectifs\')">Voir mes '+ordered.length+' objectifs</button>';
  } else {
    h+='<div class="hg-empty">Aucune action en cours. Trouve ton premier objectif et il s’affichera ici.</div>'
      +'<button class="hg-all" onclick="startObrient()">Trouver mon objectif</button>';
  }
  box.innerHTML=h;
}


/* ═══════════════ QUESTIONNAIRE DE CAP — écran d'intro à l'initiative de la personne, jamais enchaîné automatiquement ═══════════════ */
function startObrient(){
  objqAns={}; objqIdx=0;
  $('orient').classList.add('show');
  renderObjIntro();
}
function renderObjIntro(){
  var th=(typeof qTheme==='function')?qTheme(0):{bg:'#974AF0',c:'#974AF0'};
  var wrap=$('orient'); if(wrap){ wrap.style.background=th.bg; wrap.classList.add('tinted'); }
  var inner=$('or-inner'); if(inner) inner.style.height='100%';
  var h='<div class="qz2-wrap" style="height:100%"><div class="qz2-head"><button class="qz2-close" onclick="objqClose()">'+qzIcoClose()+'</button></div>'
    +'<div class="qz2-body">'
    +'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:10px">'
    +'<div class="qz2-q">Quel sera ton objectif ?</div>'
    +'<div class="qz2-hint">Quelques questions rapides, pour te proposer un premier objectif concret adapté à ce que tu vis en ce moment. Tu pourras toujours le renommer ou en changer ensuite.</div>'
    +'</div>'
    +'<div class="qz2-foot"><button class="btn full light" onclick="objqRenderQ()">Commencer</button></div>'
    +'</div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
function renameObjective(id){
  var o=(state.objectives||[]).find(function(x){ return x.id===id; });
  if(!o) return;
  var v=prompt('Renommer cet objectif', o.name);
  if(v===null) return;
  v=v.trim();
  if(!v) return;
  o.name=v;
  persist();
  try{ renderObjectives(); }catch(e){}
  try{ renderHomeGoals(); }catch(e){}
}


/* ═══════════════ DASHBOARD PROFESSIONNEL — démonstration, même compte, aucune identité ni client inventés ═══════════════ */
function openProDashboard(){
  renderProDashboard();
  var el=document.getElementById('pro-dashboard'); if(el) el.classList.add('show');
}
function closeProDashboard(){
  var el=document.getElementById('pro-dashboard'); if(el) el.classList.remove('show');
}
function draftBilanText(){
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  var bits=[];
  if(state.profile && state.profile.name) bits.push('Profil '+state.profile.name+'.');
  if(principal){
    bits.push('Objectif principal en cours : « '+principal.name+' », '+principal.progress+' pas sur '+principal.steps+' réalisés.');
    if(principal.deepDone && principal.deepAnswers && principal.deepAnswers.importance){
      bits.push('Ce que la personne en dit : '+principal.deepAnswers.importance);
    }
  } else {
    bits.push('Aucun objectif principal actif sur la période.');
  }
  bits.push('Série d’activité en cours : '+(state.streak||0)+' jour'+((state.streak||0)>1?'s':'')+'.');
  var sigs=(typeof proSignals==='function')?proSignals():[];
  if(sigs.length && typeof PRO_SIGNALS!=='undefined'){
    bits.push('Signaux du mois : '+sigs.map(function(s){ return (PRO_SIGNALS[s.k]||{}).n||s.k; }).join(', ')+'.');
  } else {
    bits.push('Aucun signal particulier ce mois-ci.');
  }
  return bits.join('\n\n');
}
function signBilan(){
  var ta=document.getElementById('pd-bilan-draft');
  var text=ta?ta.value.trim():'';
  if(!text){ toast('Écris ou garde le brouillon avant de signer.'); return; }
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  state.bilanHistory=(state.bilanHistory||[]);
  state.bilanHistory.unshift({ text:text, date:Date.now(), by:proName(), objectiveName:principal?principal.name:null });
  persist();
  toast('Bilan signé et envoyé.');
  renderProDashboard();
  try{ renderProSheet(); }catch(e){}
}
function renderProDashboard(){
  var body=document.getElementById('pd-body'); if(!body) return;
  var principal=(typeof getPrincipalObjective==='function')?getPrincipalObjective():null;
  var sigs=(typeof proSignals==='function')?proSignals():[];
  var blocage=sigs.find(function(s){ return s.k==='blocage'; });
  var h='';
  h+='<div class="block-title">File d’attente</div>';
  h+='<div class="pd-queue-row'+(blocage?' urgent':'')+'">'
    +'<span class="pd-q-ava">'+escapeHtml((state.name||'T')[0].toUpperCase())+'</span>'
    +'<span style="flex:1;min-width:0">'
    +'<span style="display:block;font-family:Poppins,sans-serif;font-weight:700;font-size:14px;color:var(--ink)">'+escapeHtml(state.name||'Cette personne')+'</span>'
    +'<span style="display:block;font-family:\'DM Sans\',sans-serif;font-size:12px;color:var(--mist);margin-top:2px">'+(principal?escapeHtml(principal.name):'Aucun objectif principal actif')+'</span>'
    +'</span>'
    +'<span class="pd-q-tag'+(blocage?' urgent':'')+'">'+(blocage?'Urgent':'Bilan du mois')+'</span>'
    +'</div>';

  h+='<div class="block-title">Vue par utilisateur</div>';
  h+='<div class="pro-card"><div class="pro-blk"><div class="pro-lbl">Feuille de route</div>';
  var axes=(typeof proAxes==='function')?proAxes():[];
  h+=axes.map(function(a){ var ag=byId(a.id)||byId('mia'); return '<div class="pro-axe"><span class="pro-dot" style="background:'+ag.color+'">'+(ag.id==='mia'?'M':ag.name[0])+'</span><span class="pro-tx">'+escapeHtml(a.tx)+'</span></div>'; }).join('');
  h+='</div>';
  if(principal && principal.deepDone && principal.deepAnswers){
    var d=principal.deepAnswers;
    h+='<div class="pro-blk"><div class="pro-lbl">Questionnaire d’approfondissement</div>';
    if(d.importance) h+='<div class="pro-tx">Pourquoi maintenant : '+escapeHtml(d.importance)+'</div>';
    if(d.impact) h+='<div class="pro-tx" style="margin-top:6px">Impact au quotidien : '+escapeHtml(d.impact)+'</div>';
    h+='</div>';
  }
  h+='</div>';

  var hist=state.bilanHistory||[];
  h+='<div class="block-title">Historique des bilans</div>';
  if(!hist.length){ h+='<div class="pro-empty">Aucun bilan signé pour l’instant.</div>'; }
  else{
    h+=hist.map(function(b){
      var d=new Date(b.date);
      var dateTxt=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
      return '<div class="pro-card" style="margin-bottom:10px"><div class="pro-tx" style="white-space:pre-wrap">'+escapeHtml(b.text)+'</div>'
        +'<div class="pro-sign">'+proCheckSVG()+'<span>Signé le '+dateTxt+' par <span class="pro-sig-nm">'+escapeHtml(b.by)+'</span></span></div></div>';
    }).join('');
  }

  h+='<div class="block-title">Brouillon de bilan, pré-rédigé par MIA</div>';
  h+='<textarea class="qz2-ta" id="pd-bilan-draft" style="min-height:160px">'+escapeHtml(draftBilanText())+'</textarea>';
  h+='<button class="btn full" style="margin-top:12px" onclick="signBilan()">Signer et publier le bilan</button>';

  body.innerHTML=h;
}
(function(){
  var base=renderProSheet;
  if(typeof base!=='function') return;
  window.renderProSheet=function(){
    var r=base.apply(this, arguments);
    try{
      var hist=state.bilanHistory||[];
      if(hist.length){
        var body=document.getElementById('pro-sheet-body');
        if(body){
          var h='<div class="block-title">Bilans signés par ton professionnel</div>';
          hist.forEach(function(b){
            var d=new Date(b.date);
            var dateTxt=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
            h+='<div class="pro-blk"><div class="pro-tx" style="white-space:pre-wrap">'+escapeHtml(b.text)+'</div>'
              +'<div class="pro-sign">'+proCheckSVG()+'<span>Signé le '+dateTxt+' par <span class="pro-sig-nm">'+escapeHtml(b.by)+'</span></span></div></div>';
          });
          body.insertAdjacentHTML('beforeend', h);
        }
      }
    }catch(e){}
    return r;
  };
})();


/* ═══════════════ ONBOARDING — quiz de personnalité puis cap, cap rendu obligatoire avant de rendre la main ═══════════════ */
/* Nouvelles fonctions dédiées aux deux boutons de l'écran ob-quiz-invite, pour ne pas changer le comportement */
/* du enterApp() générique utilisé tel quel par ailleurs (notamment les suites de tests, qui l'appellent en raccourci). */
var _obForceCap=false;
function obEnterAndQuiz(){
  _obForceCap=!state.cap && !state.capMeta;
  enterApp(true);
}
function obEnterSkipQuiz(){
  var needsCap=!state.cap && !state.capMeta;
  enterApp(false);
  if(needsCap){
    _obForceCap=true;
    try{ closeMoodScreen(); }catch(e){}
    startObrient();
  }
}
(function(){
  var base=qzFinish;
  if(typeof base!=='function') return;
  window.qzFinish=function(){
    var r=base.apply(this, arguments);
    try{
      if(_obForceCap){
        if(!state.cap && !state.capMeta) startObrient();
        else _obForceCap=false;
      }
    }catch(e){}
    return r;
  };
})();
(function(){
  var base=objqAfter;
  if(typeof base!=='function') return;
  window.objqAfter=function(){
    var r=base.apply(this, arguments);
    try{
      if(_obForceCap){ _obForceCap=false; checkMoodOnOpen(); }
    }catch(e){}
    return r;
  };
})();


/* ═══════════════ DEV — reprise du dernier écran après un rechargement (Go Live) ═══════════════ */
(function(){
  var KEY='mayndLastScreen';
  var f=window.obShow;
  if(typeof f==='function'){
    window.obShow=function(id){ try{ sessionStorage.setItem(KEY, id); }catch(e){} return f.apply(this, arguments); };
  }
  var g=window.showTab;
  if(typeof g==='function'){
    window.showTab=function(name){ try{ sessionStorage.setItem(KEY, 'tab:'+name); }catch(e){} return g.apply(this, arguments); };
  }
})();
function bootWithResume(){
  init();
  try{
    var last=sessionStorage.getItem('mayndLastScreen');
    if(!last) return;
    if(last.indexOf('tab:')===0){
      var tab=last.slice(4);
      if(state.onboarded && tab!=='accueil') showTab(tab);
    } else if(!state.onboarded && document.getElementById(last)){
      obShow(last);
    }
  }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootWithResume); else bootWithResume();
