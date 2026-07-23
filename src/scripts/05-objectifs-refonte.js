/* ══════════════════ OBJECTIFS : refonte ══════════════════ */
function renderProfileCard(){
  if(!state.profile){
    return '<div class="pf-card empty"><div class="pf-lbl">Ton profil</div><div class="pf-empty">Fais le questionnaire pour révéler ton profil psychologique.</div><button class="btn full light" onclick="startQuiz()">Découvrir</button></div>';
  }
  var p=(typeof PROFILES!=='undefined' && PROFILES[state.profile.key]) ? PROFILES[state.profile.key] : {colors:['#974AF0']};
  var bar=(p.colors||['#974AF0']).map(function(c){return '<span style="background:'+c+'"></span>';}).join('');
  return '<div class="pf-card"><div class="pf-lbl">Ton profil</div><div class="pf-bar">'+bar+'</div><div class="pf-name">'+escapeHtml(state.profile.name)+'</div></div>';
}
function renderChallenges(){
  var c=state.challenges||{};
  var chk='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var items=[
    {n:'Profil psychologique', done:!!state.questionnaireDone, act:'startQuiz()'},
    {n:'Trouver un objectif', done:!!c.objective, act:'startObjQuiz()'}
  ];
  return items.map(function(x){ return '<div class="chal'+(x.done?' done':'')+'"><span class="chal-c">'+chk+'</span><span class="chal-t">'+x.n+'</span>'
    +(x.done?'<span class="chal-badge">'+chk.replace('width="24"','')+' Validé</span>':'<button class="chal-btn" onclick="'+x.act+'">Faire</button>')+'</div>'; }).join('');
}
function renderBadges(){
  var lvl=levelOf();
  var items=[
   {n:t('bMood'),on:state.moods.length>=1,c:'#C25E7A',i:'mood'},
   {n:t('bStreak7'),on:(state.streak||0)>=7,c:'#E8743B',i:'flame'},
   {n:'Profil trouvé',on:!!state.questionnaireDone,c:'#974AF0',i:'star'},
   {n:'Objectif trouvé',on:!!(state.challenges&&state.challenges.objective),c:'#2E8B6B',i:'check'},
   {n:t('bWheel'),on:wheelEdited(),c:'#5E3DA8',i:'compass'}
  ];
  return '<div class="badges-row">'+items.map(function(b){ return '<div class="badge'+(b.on?'':' locked')+'"><div class="bi" style="background:'+b.c+'">'+badgeIco(b.i)+'</div><div class="bn">'+b.n+'</div></div>'; }).join('')+'</div>';
}
function renderObjectives(){
  ensureQuestDay();
  var h='<div class="greet-row"><div class="greet-hi">'+t('objGreet')+'</div></div><div class="obj-greet-sub">'+t('objGreetSub')+'</div>';
  h+='<div class="cap-hero">'+renderCapCard()+'</div>';
  h+='<div class="pf-week-row">'+renderProfileCard()+renderWeekCard()+'</div>';
  h+=renderProBlock();
  if(state.tier==='free'){
    h+='<div class="section-head"><h2>Ton suivi</h2></div>';
    h+='<div class="track-lock"><div class="tl-ico">'+lockSVG()+'</div><div class="tl-t">Ton suivi complet</div><div class="tl-s">Boussole, défis, jalons et objectifs. Réservé aux abonnés.</div><button class="btn full" onclick="openUpsell(\'agent\')">Débloquer mon suivi</button></div>';
    $('obj-pad').innerHTML=h; return;
  }
  var w=getWheel();
  h+='<div class="section-head"><h2>'+t('wheelTitle')+'</h2></div>';
  h+='<div class="wheel-card">'+drawWheel()+'<div class="wheel-legend">'
    +WHEEL.map(function(a){return '<div class="wheel-leg"><span class="wd" style="background:'+a.color+'"></span><span class="wn">'+wLabel(a)+'</span><span class="wv">'+w[a.k]+'</span></div>';}).join('')
    +'<button class="wheel-edit" onclick="openWheelSheet()">'+t('wheelEdit')+'</button></div></div>';
  var lvl=levelOf(), inl=xpInLevel(), frac=inl/100; var r=36,C=2*Math.PI*r,off=C*(1-frac); var streak=state.streak||0;
  h+='<div class="section-head"><h2>'+t('level')+'</h2></div>';
  h+='<div class="obj-hero"><div class="ring"><svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="7"/><circle cx="42" cy="42" r="36" fill="none" stroke="#974AF0" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg><div class="lvl"><b>'+lvl+'</b><span>'+t('level')+'</span></div></div>'
    +'<div class="hx"><div class="hl">'+t('heroSub')+'</div><div class="hp">'+(100-inl)+' '+t('xpToNext')+'</div><div class="xpbar"><i style="width:'+frac*100+'%"></i></div>'
    +'<span class="streak-pill"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 .5-2 .5-2 1.5 1.5 2.5 3.5 2.5 6a6 6 0 1 1-12 0c0-3 2-5 4-10z"/></svg>'+streak+' '+(streak===1?t('streakOne'):t('streakDays'))+'</span></div></div>';
  h+='<div class="section-head"><h2>Défis &amp; jalons</h2></div>'+renderChallenges();
  var q=state.quests; var quests=[['mood',t('qMood'),15],['chat',t('qChat'),10],['goal',t('qGoal'),20]];
  h+=quests.map(function(x){return '<div class="quest'+(q[x[0]]?' done':'')+'"><span class="qc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span class="qt"><span class="qn">'+x[1]+'</span></span><span class="qx">+'+x[2]+' XP</span></div>';}).join('');
  h+='<div class="section-head"><h2>'+t('badgesTitle')+'</h2></div>'+renderBadges();
  h+='<div class="section-head"><h2>'+t('yourGoals')+'</h2></div>';
  if(!state.objectives.length){ h+='<div class="obj-empty">'+t('objEmpty')+'</div>'; }
  state.objectives.forEach(function(o){ var done=o.progress>=o.steps; var pct=Math.round(o.progress/o.steps*100); var link=o.link?byId(o.link):null;
    h+='<div class="objective'+(done?' done':'')+'"><div class="oh"><span class="odot" style="background:'+o.color+'"></span><span class="on">'+escapeHtml(o.name)+'</span><span class="odel" onclick="deleteObjective(\''+o.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></span></div>'
      +(link?'<div class="obj2-link"><span class="lk" style="background:'+link.color+'">'+(link.id==='mia'?'':link.name[0])+'</span>'+t('linkLabel')+' '+link.name+'</div>':'')
      +'<div class="obar"><i style="width:'+pct+'%;background:'+o.color+'"></i></div>'
      +'<div class="ofoot"><span class="opct">'+o.progress+' / '+o.steps+'</span>'
      +(done?'<span class="obadge"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+t('goalDone')+'</span>':'<div class="obtns"><button class="ostep" onclick="stepObjective(\''+o.id+'\')">+</button></div>')
      +'</div></div>'; });
  h+='<button class="obj-add" onclick="openObjSheet()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'+t('addGoal')+'</button>';
  $('obj-pad').innerHTML=h;
}
/* ══════════════════ QUESTIONNAIRE OBJECTIF (8 questions, génératif, local) ══════════════════ */
var OBJQ=[
 {ax:'domain', q:"Quel domaine pèse le plus en ce moment ?", opts:[{t:"Mon travail, mes projets",v:'travail'},{t:"Mes relations, mon entourage",v:'relations'},{t:"Mon rapport à moi-même",v:'soi'},{t:"Mon corps, mon énergie",v:'energie'},{t:"Autre",v:'autre'}]},
 {ax:'block', q:"Qu'est-ce qui te freine le plus souvent ?", opts:[{t:"Je ne sais pas par où commencer",v:'start'},{t:"Je commence puis j'abandonne vite",v:'give'},{t:"J'ai peur de me tromper de direction",v:'fear'},{t:"Je manque de temps ou d'énergie",v:'time'},{t:"Autre",v:'autre'}]},
 {ax:'help', q:"Qu'est-ce qui t'aiderait le plus à court terme ?", opts:[{t:"Une action concrète à cocher chaque jour",v:'action'},{t:"Quelqu'un à qui en parler",v:'talk'},{t:"Du temps pour souffler, sans rien prouver",v:'rest'},{t:"Comprendre pourquoi je bloque",v:'understand'},{t:"Autre",v:'autre'}]},
 {ax:'since', q:"Depuis combien de temps ça dure ?", opts:[{t:"Quelques semaines",v:'weeks'},{t:"Plusieurs mois",v:'months'},{t:"Plus d'un an",v:'year'},{t:"Ça va et vient depuis longtemps",v:'onoff'},{t:"Autre",v:'autre'}]},
 {ax:'days', q:"Ces dernières semaines, tes journées…", opts:[{t:"M'ont plutôt fait avancer",v:'up'},{t:"Correctes, sans plus",v:'ok'},{t:"Je tourne en rond",v:'stuck'},{t:"Loin de ce que je voudrais vivre",v:'far'},{t:"Autre",v:'autre'}]},
 {ax:'inner', q:"Ton rapport à ton dialogue intérieur ?", opts:[{t:"Plutôt bienveillant avec moi",v:'kind'},{t:"Exigeant mais juste",v:'firm'},{t:"Souvent trop dur",v:'harsh'},{t:"Je ne m'écoute pas vraiment",v:'none'},{t:"Autre",v:'autre'}]},
 {ax:'pace', q:"À quel rythme tu veux avancer ?", opts:[{t:"Tout doucement",v:'slow'},{t:"Pas à pas, régulier",v:'steady'},{t:"À fond dès que possible",v:'fast'},{t:"Je verrai au fil de l'eau",v:'flow'},{t:"Autre",v:'autre'}]},
 {ax:'ready', q:"Prêt à recevoir un premier petit pas ?", opts:[{t:"Oui, propose-moi quelque chose de simple",v:'yes'},{t:"Pas maintenant, je veux juste comprendre où j'en suis",v:'no'}]}
];
var DOMAIN_MAP={
 travail:{key:'travail',agent:'mateo',cap:"Avancer sur ce qui compte au travail, sans m'épuiser."},
 relations:{key:'relations',agent:'otis',cap:"Construire des liens plus vrais et plus apaisés."},
 soi:{key:'soi',agent:'felix',cap:"Être plus en paix avec moi."},
 energie:{key:'energie',agent:'miro',cap:"Retrouver de l'énergie et un rythme qui me tient."}
};
var HELP_AGENT={action:'naoki',talk:'otis',rest:'sol',understand:'atlas'};
var PACE_STEPS={slow:6,steady:5,fast:3,flow:4};
var OBJ_NAMES={
 travail:{start:"Choisir une seule priorité cette semaine et t'y mettre 20 min",give:"Avancer 15 min par jour, sans viser la perfection",fear:"Faire un premier jet imparfait de ce que tu repousses",time:"Bloquer 20 min fixes par jour pour l'essentiel"},
 relations:{start:"Reprendre contact avec une personne qui te manque",give:"Prendre des nouvelles d'un proche plusieurs fois cette semaine",fear:"Dire une chose sincère à quelqu'un, même petite",time:"T'accorder un vrai moment avec un proche cette semaine"},
 soi:{start:"Noter chaque soir une chose que tu as bien faite",give:"T'accorder 10 min pour toi chaque jour, sans rien prouver",fear:"Repérer une pensée dure et la reformuler plus juste",time:"Prendre 10 min de calme fixes dans ta journée"},
 energie:{start:"Repérer à quel moment ton énergie chute",give:"Te coucher 20 min plus tôt quelques soirs cette semaine",fear:"Tester un seul changement de rythme, juste pour voir",time:"Protéger 10 min de vraie pause dans ta journée"}
};
var objqAns={}, objqIdx=0;
function startObjQuiz(){ objqAns={}; objqIdx=0; $('orient').classList.add('show'); objqRenderQ(); }
function startObrient(){ startObjQuiz(); }
function objqClose(){ $('orient').classList.remove('show'); }
function objqRenderQ(){
  var q=OBJQ[objqIdx]; var pct=Math.round(objqIdx/OBJQ.length*100);
  var h='<div class="qz2-wrap"><div class="qz2-head"><button class="qz2-close" onclick="objqClose()">'+qzIcoClose()+'</button>'
    +'<div class="qz2-prog"><i style="width:'+pct+'%"></i></div><div class="qz2-step">'+(objqIdx+1)+' / '+OBJQ.length+'</div></div>'
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div><div class="qz2-opts">'
    +q.opts.map(function(o,i){return '<button class="qz2-opt" onclick="objqPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>';}).join('')
    +'</div></div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
function objqPick(i){ var q=OBJQ[objqIdx]; objqAns[q.ax]=q.opts[i].v; var b=document.querySelectorAll('#or-inner .qz2-opt'); if(b[i]) b[i].classList.add('sel'); setTimeout(objqAdvance,170); }
function objqAdvance(){ objqIdx++; if(objqIdx>=OBJQ.length) objqFinish(); else objqRenderQ(); }
function objqFinish(){
  state.objAnswers=Object.assign({}, objqAns);
  state.challenges=state.challenges||{}; state.challenges.objective=true;
  var dom=objqAns.domain, block=objqAns.block, help=objqAns.help, pace=objqAns.pace, inner=objqAns.inner;
  if((!dom||dom==='autre') && objqAns.ready==='no'){ state.cap=''; state.capMeta=true; persist(); objqClose(); objqAfter(); return; }
  var D=DOMAIN_MAP[dom]||DOMAIN_MAP['soi'];
  var bl=(block && block!=='autre')?block:'start';
  var name=(OBJ_NAMES[D.key] && OBJ_NAMES[D.key][bl])?OBJ_NAMES[D.key][bl]:D.cap;
  var steps=PACE_STEPS[pace]||4;
  var primary=D.agent; var secondary=HELP_AGENT[help]||null; if(inner==='harsh' && secondary!=='felix') secondary='felix';
  state.cap=D.cap; state.capMeta=false;
  var created=null;
  if(objqAns.ready!=='no'){ created=addObjective(name, steps, primary); }
  if(!Array.isArray(state.favorites)) state.favorites=[];
  [primary, secondary].forEach(function(id){ if(id && byId(id) && state.favorites.indexOf(id)<0) state.favorites.push(id); });
  if(!state.focus||!state.focus.agent) state.focus={agent:primary};
  persist(); objqClose(); objqAfter(created?name:null);
}
function objqAfter(name){
  try{renderStrip();}catch(e){}
  if(activeScreen()==='tab-objectifs') renderObjectives();
  toast(state.capMeta?'Ton premier cap : mieux te connaître.':(name?'Objectif créé':'Ton cap est défini.'));
}
