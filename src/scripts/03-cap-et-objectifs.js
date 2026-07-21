/* ══════════ CAP + objectif de la semaine (héros objectifs) ══════════ */
function renderCapCard(){
  if(state.capMeta){
    return '<div class="cap-card meta"><div class="cap-lbl">Ton cap</div>'
      +'<div class="cap-txt">Mieux me connaître avant de viser</div>'
      +'<div class="cap-meta-note">Pas de cap clair pour l\u2019instant, et c\u2019est ok. Ton premier objectif, c\u2019est d\u2019apprendre à mieux te connaître. On creuse ça avec tes accompagnants et ton pro.</div>'
      +'<div class="cap-meta-agents">'+['atlas','felix'].map(id=>{ const a=byId(id); return '<span class="cma"><span class="cma-a" style="background:'+a.color+'">'+a.name[0]+'</span>'+a.name+'</span>'; }).join('')+'</div>'
      +'<button class="btn ghost full" onclick="startObrient()">Refaire l\u2019orientation</button></div>';
  }
  if(state.cap && state.cap.trim()){
    return '<div class="cap-card"><div class="cap-lbl">Ton cap</div><div class="cap-txt">'+escapeHtml(state.cap)+'</div>'
      +'<button class="cap-edit" onclick="editCap()">Modifier</button></div>';
  }
  return '<div class="cap-card empty"><div class="cap-lbl">Ton cap</div>'
    +'<div class="cap-empty-t">Ton cap n\u2019est pas encore clair.</div>'
    +'<div class="cap-empty-s">Un objectif qu\u2019on voit est un objectif qu\u2019on peut atteindre. Définissons le tien.</div>'
    +'<button class="btn full" onclick="startObrient()">Définir mon cap</button></div>';
}
function renderWeekCard(){
  if(!state.focus||!state.focus.agent){
    return '<div class="week-card empty"><div class="wk-lbl">Objectif de la semaine</div><div class="wk-empty">Choisis l\u2019accompagnant sur lequel tu avances cette semaine.</div><button class="btn full light" onclick="openFocusSheet()">Choisir</button></div>';
  }
  const a=byId(state.focus.agent);
  const ava=a.id==='mia'?'<span class="wk-ava mia">'+brainSVG()+'</span>':'<span class="wk-ava" style="background:'+a.color+'">'+a.name[0]+'</span>';
  return '<div class="week-card" style="--wk:'+a.color+'"><div class="wk-lbl">Objectif de la semaine</div>'+ava
    +'<div class="wk-name">'+a.name+'</div><div class="wk-dom">'+(a.id==='mia'?t('miaStatus'):a.domain)+'</div>'
    +'<button class="wk-btn" onclick="openFocusSheet()">Changer</button></div>';
}
function editCap(){
  $('obj-sheet-title').textContent='Ton cap';
  $('obj-sheet-body').innerHTML='<div class="block-title">Qu\u2019est-ce que tu veux qui change ?</div><textarea class="inp" id="cap-input" rows="3" style="resize:none">'+escapeHtml(state.cap||'')+'</textarea><div class="studio-actions"><button class="btn full" onclick="saveCap()">Enregistrer</button></div>';
  openSheet('obj-backdrop','obj-sheet'); setTimeout(()=>{try{$('cap-input').focus();}catch(e){}},150);
}
function saveCap(){ const v=$('cap-input')?$('cap-input').value.trim():''; state.cap=v; state.capMeta=false; persist(); closeObjSheet(); renderObjectives(); }
function lockSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'; }
/* ══════════ objectifs : cap en héros + suivi complet (payant) ══════════ */
function renderObjectives(){
  ensureQuestDay();
  let h='<div class="obj-greet">'+t('objGreet')+'</div><div class="obj-greet-sub">'+t('objGreetSub')+'</div>';
  h+='<div class="cap-zone">'+renderCapCard()+renderWeekCard()+'</div>';
  if(state.tier==='free'){
    h+='<div class="section-head"><h2>Ton suivi</h2></div>';
    h+='<div class="track-lock"><div class="tl-ico">'+lockSVG()+'</div><div class="tl-t">Ton suivi complet</div><div class="tl-s">Boussole, jalons, objectifs et progression. Réservé aux abonnés.</div><button class="btn full" onclick="openUpsell(\'agent\')">Débloquer mon suivi</button></div>';
    $('obj-pad').innerHTML=h; return;
  }
  const lvl=levelOf(), inl=xpInLevel(), frac=inl/100; const r=36,C=2*Math.PI*r,off=C*(1-frac); const streak=state.streak||0;
  h+='<div class="section-head"><h2>Ta progression</h2></div>';
  h+='<div class="obj-hero">'
    +'<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="7"/><circle cx="42" cy="42" r="36" fill="none" stroke="#974AF0" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg><div class="lvl"><b>'+lvl+'</b><span>'+t('level')+'</span></div></div>'
    +'<div class="hx"><div class="hl">'+t('heroSub')+'</div><div class="hp">'+(100-inl)+' '+t('xpToNext')+'</div><div class="xpbar"><i style="width:'+frac*100+'%"></i></div>'
    +'<span class="streak-pill"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 .5-2 .5-2 1.5 1.5 2.5 3.5 2.5 6a6 6 0 1 1-12 0c0-3 2-5 4-10z"/></svg>'+streak+' '+(streak===1?t('streakOne'):t('streakDays'))+'</span></div></div>';
  h+='<div class="section-head"><h2>'+t('wheelTitle')+'</h2></div>';
  const w=getWheel();
  h+='<div class="wheel-card">'+drawWheel()+'<div class="wheel-legend">'
    +WHEEL.map(a=>'<div class="wheel-leg"><span class="wd" style="background:'+a.color+'"></span><span class="wn">'+wLabel(a)+'</span><span class="wv">'+w[a.k]+'</span></div>').join('')
    +'<button class="wheel-edit" onclick="openWheelSheet()">'+t('wheelEdit')+'</button></div></div>';
  h+='<div class="section-head"><h2>'+t('dailyTitle')+'</h2></div>';
  const q=state.quests; const quests=[['mood',t('qMood'),15],['chat',t('qChat'),10],['goal',t('qGoal'),20]];
  h+=quests.map(x=>'<div class="quest'+(q[x[0]]?' done':'')+'"><span class="qc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span class="qt"><span class="qn">'+x[1]+'</span></span><span class="qx">+'+x[2]+' XP</span></div>').join('');
  h+='<div class="section-head"><h2>'+t('yourGoals')+'</h2></div>';
  if(!state.objectives.length){ h+='<div class="obj-empty">'+t('objEmpty')+'</div>'; }
  state.objectives.forEach(o=>{ const done=o.progress>=o.steps; const pct=Math.round(o.progress/o.steps*100); const link=o.link?byId(o.link):null;
    h+='<div class="objective'+(done?' done':'')+'"><div class="oh"><span class="odot" style="background:'+o.color+'"></span><span class="on">'+escapeHtml(o.name)+'</span><span class="odel" onclick="deleteObjective(\''+o.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></span></div>'
      +(link?'<div class="obj2-link"><span class="lk" style="background:'+link.color+'">'+(link.id==='mia'?'':link.name[0])+'</span>'+t('linkLabel')+' '+link.name+'</div>':'')
      +'<div class="obar"><i style="width:'+pct+'%;background:'+o.color+'"></i></div>'
      +'<div class="ofoot"><span class="opct">'+o.progress+' / '+o.steps+'</span>'
      +(done?'<span class="obadge"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+t('goalDone')+'</span>':'<div class="obtns"><button class="ostep" onclick="stepObjective(\''+o.id+'\')">+</button></div>')
      +'</div></div>'; });
  h+='<button class="obj-add" onclick="openObjSheet()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'+t('addGoal')+'</button>';
  h+='<div class="section-head"><h2>'+t('badgesTitle')+'</h2></div>'+renderBadges();
  $('obj-pad').innerHTML=h;
}
/* ══════════ ORIENTATION : trouver son cap ══════════ */
const ORIENT=[
 {type:'choice', q:"En ce moment, qu'est-ce qui pèse le plus ?", opts:[
   {t:"Mon travail, mes projets", v:'travail'},{t:"Mes relations, mon entourage", v:'relations'},
   {t:"Mon rapport à moi-même", v:'soi'},{t:"Mon énergie, mon corps", v:'energie'},{t:"Je ne sais pas vraiment", v:'flou'} ]},
 {type:'text', q:"Dans six mois, qu'est-ce que tu aimerais pouvoir dire sur ta vie ?", hint:"Une phrase suffit. Tu peux aussi passer si rien ne vient."}
];
const DOMAIN_CAP={travail:"Avancer sur ce qui compte dans mon travail, sans m'y épuiser.", relations:"Construire des liens plus vrais et plus apaisés.", soi:"Mieux me comprendre et être plus en paix avec moi.", energie:"Retrouver de l'énergie et un rythme qui me tient."};
var orAns={}, orIdx=0;
function startObrient(){ orAns={}; orIdx=0; $('orient').classList.add('show'); orRenderQ(); }
function orClose(){ $('orient').classList.remove('show'); }
function orRenderQ(){
  const q=ORIENT[orIdx]; const pct=Math.round(orIdx/ORIENT.length*100);
  let h='<div class="qz2-wrap"><div class="qz2-head"><button class="qz2-close" onclick="orClose()">'+qzIcoClose()+'</button>'
    +'<div class="qz2-prog"><i style="width:'+pct+'%"></i></div><div class="qz2-step">'+(orIdx+1)+' / '+ORIENT.length+'</div></div>'
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.type==='text'){
    h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div><textarea class="qz2-ta" id="or-ta" placeholder="Ta réponse…">'+escapeHtml(orAns.txt||'')+'</textarea>';
    h+='<div class="qz2-foot"><button class="btn full" onclick="orSubmitText()">Terminer</button><button class="btn ghost full" onclick="orSkipText()">Passer</button></div>';
  } else {
    h+='<div class="qz2-opts">'+q.opts.map((o,i)=>'<button class="qz2-opt" onclick="orPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>').join('')+'</div>';
  }
  h+='</div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
function orPick(i){ orAns.domain=ORIENT[orIdx].opts[i].v; const b=document.querySelectorAll('#or-inner .qz2-opt'); if(b[i]) b[i].classList.add('sel'); setTimeout(orAdvance,170); }
function orSubmitText(){ const ta=$('or-ta'); orAns.txt=ta?ta.value.trim():''; orAdvance(); }
function orSkipText(){ orAns.txt=''; orAdvance(); }
function orAdvance(){ orIdx++; if(orIdx>=ORIENT.length) orFinish(); else orRenderQ(); }
function orFinish(){
  if(orAns.txt && orAns.txt.trim()){ state.cap=orAns.txt.trim(); state.capMeta=false; }
  else if(orAns.domain && orAns.domain!=='flou'){ state.cap=DOMAIN_CAP[orAns.domain]||''; state.capMeta=false; }
  else { state.cap=''; state.capMeta=true; }
  persist(); orClose();
  if(activeScreen()==='tab-objectifs') renderObjectives();
  toast(state.capMeta?'Ton premier cap : mieux te connaître.':'Ton cap est défini.');
}



