/* ═══════════════ TEINTE CLAIRE CALCULÉE À PARTIR D'UNE COULEUR ═══════════════ */
function tintOf(hex, p){
  try{
    p=(p==null)?0.90:p;
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    r=Math.round(r+(255-r)*p); g=Math.round(g+(255-g)*p); b=Math.round(b+(255-b)*p);
    return '#'+[r,g,b].map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('').toUpperCase();
  }catch(e){ return '#F6F1FF'; }
}
var OB_TINTS={'#974AF0':'#EDE1FF','#224CF2':'#DFE8FF','#00A862':'#D8F2E4','#FE6601':'#FFE6D2','#FFC400':'#FFEBCB','#6F2FC0':'#E6D9FF'};
/* ═══════════════ CARTE SUPERVISION : texte blanc comme les autres ═══════════════ */
var JCARDS=[
  {c:'#974AF0', a:'#6F2FC0', lb:'Ton cap',       t:'Où tu vas',      go:"showTab('objectifs')"},
  {c:'#224CF2', a:'#8FB4FF', lb:'Humeur',        t:'Comment tu vas', go:"openMoodScreen()"},
  {c:'#00A862', a:'#FFC400', lb:'Profil',        t:'Qui tu es',      go:"startQuiz()"},
  {c:'#FE6601', a:'#FFDBC2', lb:'Accompagnants', t:'Avec qui',       go:"openDrawer()"},
  {c:'#E8467F', a:'#FFAFCF', lb:'Supervision',   t:'Qui te suit',    go:"showTab('objectifs')"}
];
/* ═══════════════ AVATAR DE SUPERVISION — silhouette centrée ═══════════════ */
function proBadgeSVG(){
  return '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">'
    +'<circle cx="24" cy="18.2" r="7.9" fill="#fff"/>'
    +'<path d="M24 28.6c-8.4 0-15.2 6.8-15.2 15.2V48h30.4v-4.2c0-8.4-6.8-15.2-15.2-15.2z" fill="#fff"/>'
    +'</svg>';
}
/* ═══════════════ QUESTIONNAIRE CAP : première question à réponse unique ═══════════════ */
(function(){ try{ OBJQ[0].multi=false; OBJQ[0].hint=null; }catch(e){} })();
function startObjQuiz(){ objqAns={}; objqIdx=0; $('orient').classList.add('show'); objqRenderQ(); }
function startObrient(){ startObjQuiz(); }
function objqFinish(){
  state.objAnswers=JSON.parse(JSON.stringify(objqAns));
  state.challenges=state.challenges||{}; state.challenges.objective=true;
  var intent=objqAns.intent, dom=objqAns.domain, block=objqAns.block, help=objqAns.help,
      pace=objqAns.pace, inner=objqAns.inner, days=objqAns.days;
  if(intent==='explore' || (intent==='autre' && (!dom||dom==='autre'))){
    state.cap=''; state.capMeta=true; persist(); objqClose(); sfx('success'); objqAfter(); return;
  }
  var family=(intent==='grow' || days==='surge' || block==='none') ? 'build' : 'fix';
  var D=DOMAIN_MAP[dom]||DOMAIN_MAP['soi'];
  var bl=(block && OBJ2[family][D.key][block])?block:'start';
  var name=OBJ2[family][D.key][bl];
  var steps=PACE_STEPS[pace]||4;
  var primary=D.agent;
  var secondary=HELP_AGENT[help]||null;
  if(inner==='harsh' && secondary!=='felix') secondary='felix';
  var third=objqAns.likes ? (LIKE_AGENT[objqAns.likes]||null) : null;
  state.cap=CAP2[family][D.key]; state.capMeta=false;
  state.objectives=(state.objectives||[]).filter(function(o){ return !o.fromCap; });
  var capObj=addObjective(name, steps, primary);
  capObj.fromCap=true;
  if(!Array.isArray(state.favorites)) state.favorites=[];
  [primary, secondary, third].forEach(function(id){ if(id && byId(id) && state.favorites.indexOf(id)<0) state.favorites.push(id); });
  if(!state.focus||!state.focus.agent) state.focus={agent:primary};
  persist(); objqClose(); sfx('success'); objqAfter(name);
}
/* ═══════════════ FAVORIS : actifs aussi depuis le chat ═══════════════ */
function toggleFav(id, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(id==='mia') return;
  if(!Array.isArray(state.favorites)) state.favorites=[];
  var i=state.favorites.indexOf(id);
  if(i>=0){
    state.favorites.splice(i,1);
    if(state.focus && state.focus.agent===id) state.focus=state.favorites.length?{agent:state.favorites[0]}:null;
  } else { state.favorites.push(id); }
  persist();
  try{ renderStrip(); }catch(e){}
  try{ if($('drawer') && $('drawer').classList.contains('show')) renderDrawer(); }catch(e){}
  try{ if($('parts-sheet') && $('parts-sheet').classList.contains('show')) renderParts(); }catch(e){}
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
/* ═══════════════ LIGNES D'ACCOMPAGNANT TEINTÉES DE LEUR COULEUR ═══════════════ */
function agentRowHTML(id, mode){
  var a=byId(id); var plus=!!a.plus; var fav=isFav(id); var lock=!isUnlocked(id);
  var inConv = mode==='chat' && typeof threadParts==='function' && threadParts().indexOf(id)>=0;
  var ava = id==='mia' ? '<span class="agx-ava mia">'+brainSVG()+'</span>' : '<span class="agx-ava" style="background:'+a.color+'">'+a.name[0]+'</span>';
  var badge = plus ? '<span class="agx-badge">MAYND+</span>' : '';
  var star = id==='mia' ? '' : '<button class="agx-star'+(fav?' on':'')+'" onclick="toggleFav(\''+id+'\',event)" aria-label="Favori">'+starSVG(fav)+'</button>';
  var right='';
  if(mode==='chat'){
    if(id==='mia'){ right='<span class="agx-lock" style="color:var(--mist);background:rgba(0,0,0,.06)">Toujours là</span>'; }
    else if(lock && !inConv){ right='<span class="agx-lock">MAYND+</span>'; }
    else { right='<span class="agx-tgl'+(inConv?' on':'')+'" onclick="togglePartRow(\''+id+'\',event)"><span class="agx-knob"></span></span>'; }
  }
  var rowClick = mode==='chat' ? ' onclick="togglePartRow(\''+id+'\',event)"' : ' onclick="startWithAgent(\''+id+'\')"';
  return '<div class="agx-row'+(plus?' plus':'')+'" style="--agt:'+tintOf(a.color,0.90)+'">'
    +'<button class="agx-open"'+rowClick+'>'+ava
    +'<span class="agx-tx"><span class="agx-nm">'+a.name+badge+'</span><span class="agx-dm">'+(id==='mia'?t('miaStatus'):a.domain)+'</span></span></button>'
    +star+right+'</div>';
}
/* ═══════════════ CHAT : bulles dans la teinte de l'accompagnant ═══════════════ */
function paintChat(){
  try{
    var id=chatAgent(); var a=byId(id)||byId('mia');
    var sc=$('tab-chat'); if(!sc) return;
    sc.style.background=a.color;
    sc.style.setProperty('--chat-tint', tintOf(a.color, 0.88));
    sc.classList.toggle('light-agent', LIGHT_AGENTS.indexOf(id)>=0);
  }catch(e){}
}
/* ═══════════════ INSCRIPTION : les champs suivent la teinte de l'écran ═══════════════ */
(function(){
  var f=window.obShow;
  if(typeof f!=='function') return;
  window.obShow=function(id){
    var r=f.apply(this, arguments);
    try{
      var box=document.getElementById('onboarding');
      if(box){
        var c=OB_SAT[id];
        box.style.setProperty('--obt', c ? (OB_TINTS[c]||tintOf(c,0.88)) : '#F6F1FF');
      }
    }catch(e){}
    return r;
  };
})();



/* ═══════════════ ROUE DE COULEURS — dégradé régulier suivant l'ordre d'affichage ═══════════════
   Teinte espacée de 22,5° entre chaque accompagnant : la liste défile comme un arc-en-ciel
   et boucle sur le violet MAYND. Luminosité calée pour que la lettre blanche reste lisible. */
var AGENT_COLORS={
  mia:'#974AF0',    /* 270°  violet MAYND, ancre de marque */
  naoki:'#E654FB',  /* 292°  */
  felix:'#FA4CCF',  /* 315°  */
  atlas:'#FB5A96',  /* 337°  */
  ava:'#FB6262',    /*   0°  */
  leo:'#F96810',    /*  22°  */
  otis:'#BB8E05',   /*  45°  or foncé, lettre blanche lisible */
  kael:'#8B9F04',   /*  67°  */
  miro:'#56A804',   /*  90°  */
  sol:'#19AD04',    /* 112°  */
  mateo:'#04AD2E',  /* 135°  */
  soren:'#04AA6C',  /* 157°  */
  iris:'#04A5A6',   /* 180°  */
  eden:'#069BF4',   /* 202°  */
  vince:'#6C90FB',  /* 225°  */
  neo:'#9385FC'     /* 247°  boucle vers le violet */
};
var LIGHT_AGENTS=[];
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* ═══════════════ SUPERVISION EN GRATUIT : bloc centré et net ═══════════════ */
function renderProBlock(){
  var h='<div class="section-head"><h2>Ta supervision</h2></div>';
  if(state.tier==='free'){
    return h+'<div class="pro-card pro-lock">'
      +'<span class="pro-ava big">'+proBadgeSVG()+'</span>'
      +'<div class="pro-lock-t">Professionnel référent certifié</div>'
      +'<div class="pro-lock-s">Inclus dès l\u2019abonnement</div>'
      +'<div class="pro-note">Il suit ton parcours, signe ta feuille de route chaque mois et ton bilan. Il intervient sur signal. Sans rendez-vous.</div>'
      +'<button class="btn full" onclick="openUpsell(\'agent\')">Débloquer ma supervision</button></div>';
  }
  var ready=proReady();
  var axes=proAxes();
  h+='<div class="pro-card"><div class="pro-head"><span class="pro-ava">'+proBadgeSVG()+'</span>'
    +'<span class="pro-id"><span class="pro-nm">'+escapeHtml(proName())+'</span><span class="pro-rl">Professionnel référent certifié</span></span>'
    +'<span class="pro-st '+(ready?'signed':'prep')+'">'+(ready?'Signée':'En préparation')+'</span></div>';
  h+='<div class="pro-note">Il suit ton parcours et intervient sur signal. Sans rendez-vous.</div>';
  if(!ready){
    h+='<div class="pro-blk"><div class="pro-lbl">Feuille de route · '+proMonth(0)+'</div>'
      +'<div class="pro-tx">Ta première feuille de route se prépare. Fais le questionnaire pour qu\u2019elle parte à la signature.</div></div>'
      +'<button class="btn full light" onclick="startQuiz()">Faire mon questionnaire</button></div>';
    return h;
  }
  h+='<div class="pro-blk"><div class="pro-lbl">Feuille de route · '+proMonth(0)+'</div>';
  h+=axes.map(function(a){ var ag=byId(a.id)||byId('mia');
    return '<div class="pro-axe"><span class="pro-dot" style="background:'+ag.color+'">'+(ag.id==='mia'?'M':ag.name[0])+'</span><span class="pro-tx">'+escapeHtml(a.tx)+'</span></div>'; }).join('');
  h+='<div class="pro-sign">'+proCheckSVG()+'<span>Signée le '+proSignDate()+' par <span class="pro-sig-nm">'+escapeHtml(proName())+'</span></span></div></div>';
  h+='<button class="btn full light" onclick="openPro()">Ouvrir mon espace de suivi</button></div>';
  return h;
}
/* ═══════════════ APRÈS PAIEMENT : l'écran courant se remet à jour ═══════════════ */
(function(){
  var f=window.obPay;
  if(typeof f!=='function') return;
  window.obPay=function(){
    var r=f.apply(this, arguments);
    try{
      var sc=(typeof activeScreen==='function') ? activeScreen() : '';
      if(sc && sc.indexOf('tab-')===0) showTab(sc.replace('tab-',''));
      renderStrip();
      if($('parts-sheet') && $('parts-sheet').classList.contains('show')) renderParts();
      if($('drawer') && $('drawer').classList.contains('show')) renderDrawer();
      if($('profile-sheet') && $('profile-sheet').classList.contains('show')) renderProfile();
    }catch(e){}
    return r;
  };
})();



