/* ═══════════════ SUPERVISION — espace de suivi ═══════════════ */
var PRO_SIGNALS={
  stagnation:{n:'Stagnation',c:'#FE6601'},
  blocage:{n:'Blocage',c:'#C2683F'},
  desalignement:{n:'Désalignement',c:'#224CF2'},
  progression:{n:'Progression à consolider',c:'#2E8B6B'}
};
var PRO_MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function proName(){ return (state.pro && state.pro.name) ? state.pro.name : 'Ton professionnel référent'; }
function proMonth(off){ var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+(off||0)); return PRO_MOIS[d.getMonth()]; }
function proSignDate(){ var d=new Date(); return '01/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); }
function proBadgeSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>'; }
function proCheckSVG(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'; }
/* la feuille de route se construit à partir du parcours réel */
function proAxes(){
  var out=[];
  if(state.capMeta){
    out.push({id:'atlas', tx:'Mieux te connaître avant de viser. On creuse le sens avec Atlas.'});
    out.push({id:'felix', tx:'Repérer ce que tu te racontes, avec Felix.'});
    return out;
  }
  if(state.cap && state.cap.trim()) out.push({id:(state.focus&&state.focus.agent)||'mia', tx:'Garder le cap : '+state.cap});
  var favs=(state.favorites||[]).filter(function(id){return byId(id) && id!=='mia';});
  favs.slice(0,2).forEach(function(id){ var a=byId(id); out.push({id:id, tx:'Avancer avec '+a.name+' sur '+a.domain.toLowerCase()+'.'}); });
  if(!out.length) out.push({id:'mia', tx:'Poser un premier cap avec MIA.'});
  return out.slice(0,3);
}
function proReady(){ return !!(state.questionnaireDone || (state.cap&&state.cap.trim()) || state.capMeta); }
/* les signaux se déduisent du parcours, jamais inventés */
function proSignals(){
  var s=[];
  var objs=state.objectives||[];
  var stuck=objs.length>0 && objs.every(function(o){ return o.progress===0; });
  if(stuck) s.push({k:'stagnation', d:'Tes objectifs sont posés mais aucun pas n\u2019est encore enclenché.', w:'Relance envoyée'});
  if((state.streak||0)>=7) s.push({k:'progression', d:'Sept jours de suite. On consolide avant d\u2019ajouter quoi que ce soit.', w:'Message de ton professionnel référent'});
  if(state.capMeta) s.push({k:'desalignement', d:'Pas de cap clair pour l\u2019instant. On travaille la connaissance de soi d\u2019abord.', w:'Feuille de route ajustée'});
  return s;
}
function renderProBlock(){
  var h='<div class="section-head"><h2>Ta supervision</h2></div>';
  if(state.tier==='free'){
    return h+'<div class="pro-card pro-lock"><div class="pro-head"><span class="pro-ava">'+proBadgeSVG()+'</span>'
      +'<span class="pro-id"><span class="pro-nm">Professionnel référent certifié</span><span class="pro-rl">Inclus dès l\u2019abonnement</span></span></div>'
      +'<div class="pro-note">Un professionnel certifié suit ton parcours, signe ta feuille de route chaque mois et ton bilan. Il intervient sur signal. Sans rendez-vous.</div>'
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
function openPro(){ renderProSheet(); openSheet('pro-backdrop','pro-sheet'); }
function closePro(){ closeSheet('pro-backdrop','pro-sheet'); }
function renderProSheet(){
  var axes=proAxes(), sigs=proSignals();
  var h='<div class="pro-card"><div class="pro-head"><span class="pro-ava">'+proBadgeSVG()+'</span>'
    +'<span class="pro-id"><span class="pro-nm">'+escapeHtml(proName())+'</span><span class="pro-rl">Professionnel référent certifié</span></span></div>'
    +'<div class="pro-note">Il lit ton parcours, ajuste ta feuille de route et te répond quand c\u2019est utile. Tu n\u2019as jamais de rendez-vous à prendre.</div></div>';
  h+='<div class="block-title">Feuille de route · '+proMonth(0)+'</div><div class="pro-blk">';
  h+=axes.map(function(a){ var ag=byId(a.id)||byId('mia');
    return '<div class="pro-axe"><span class="pro-dot" style="background:'+ag.color+'">'+(ag.id==='mia'?'M':ag.name[0])+'</span><span class="pro-tx">'+escapeHtml(a.tx)+'</span></div>'; }).join('');
  h+='<div class="pro-sign">'+proCheckSVG()+'<span>Signée le '+proSignDate()+' par <span class="pro-sig-nm">'+escapeHtml(proName())+'</span></span></div></div>';
  h+='<div class="block-title">Bilan · '+proMonth(-1)+'</div>';
  var nObj=(state.objectives||[]).length, done=(state.objectives||[]).filter(function(o){return o.progress>=o.steps;}).length;
  h+='<div class="pro-blk"><div class="pro-tx">'
    +(state.profile?('Profil '+escapeHtml(state.profile.name)+'. '):'')
    +(nObj?(nObj+' objectif'+(nObj>1?'s':'')+' en cours, '+done+' terminé'+(done>1?'s':'')+'. '):'Aucun objectif posé sur la période. ')
    +'Série en cours : '+(state.streak||0)+' jour'+((state.streak||0)>1?'s':'')+'.</div>'
    +'<div class="pro-sign">'+proCheckSVG()+'<span>Relu et signé par <span class="pro-sig-nm">'+escapeHtml(proName())+'</span></span></div></div>';
  h+='<div class="block-title">Signaux</div>';
  if(!sigs.length){ h+='<div class="pro-empty">Aucun signal pour l\u2019instant. Ton professionnel référent intervient en cas de stagnation, de blocage, de désalignement, ou pour consolider une progression.</div>'; }
  else { h+=sigs.map(function(s){ var d=PRO_SIGNALS[s.k];
    return '<div class="pro-sg"><span class="pro-sg-i" style="background:'+d.c+'"></span><span><span class="pro-sg-t">'+d.n+'</span><span class="pro-sg-d">'+escapeHtml(s.d)+'</span><span class="pro-sg-w">'+escapeHtml(s.w)+'</span></span></div>'; }).join(''); }
  $('pro-sheet-body').innerHTML=h;
}



