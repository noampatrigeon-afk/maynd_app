/* ═══════════════ PALETTE DES QUESTIONNAIRES — le rose entre dans la DA ═══════════════ */
var QTHEME=[
  {bg:'#974AF0', tint:'#EDE1FF', dark:false},  /* violet MAYND   */
  {bg:'#224CF2', tint:'#DFE8FF', dark:false},  /* bleu           */
  {bg:'#E8467F', tint:'#FFE0EC', dark:false},  /* rose           */
  {bg:'#00A862', tint:'#D8F2E4', dark:false},  /* vert           */
  {bg:'#FE6601', tint:'#FFE6D2', dark:false},  /* orange         */
  {bg:'#FFC400', tint:'#FFEBCB', dark:true},   /* jaune          */
  {bg:'#6F2FC0', tint:'#E6D9FF', dark:false}   /* violet profond */
];
/* ═══════════════ COULEURS DES ACCOMPAGNANTS — six couleurs de la palette, en alternance ═══════════════ */
var AG6=['#224CF2','#E8467F','#00A862','#FE6601','#6F2FC0','#BB8E05'];
var AG_ORDER=['naoki','felix','atlas','ava','leo','otis','kael','miro','sol','mateo','soren','iris','eden','vince','neo'];
var AGENT_COLORS={mia:'#974AF0'};
AG_ORDER.forEach(function(id,i){ AGENT_COLORS[id]=AG6[i%AG6.length]; });
var LIGHT_AGENTS=[];
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* ═══════════════ INSCRIPTION — plus aucun écran blanc ═══════════════ */
var OB_SAT={
  'ob-welcome':'#974AF0', 'ob-verify-choice':'#224CF2', 'ob-access':'#6F2FC0',
  'ob-trust':'#224CF2', 'ob-firstname':'#E8467F', 'ob-account-success':'#00A862',
  'ob-quiz-invite':'#974AF0', 'ob-plan':'#FE6601', 'ob-pay-success':'#FFC400'
};
var OB_DARK={'ob-pay-success':true};
var OB_TINTS={'#974AF0':'#EDE1FF','#224CF2':'#DFE8FF','#E8467F':'#FFE0EC','#00A862':'#D8F2E4','#FE6601':'#FFE6D2','#FFC400':'#FFEBCB','#6F2FC0':'#E6D9FF'};
/* chaque écran de saisie a sa teinte claire, aucun blanc pur */
var OB_SOFT={
  'ob-signup':'#EDE1FF','ob-email':'#DFE8FF','ob-pwd':'#DFE8FF','ob-cgu':'#FFE0EC',
  'ob-verify-code':'#D8F2E4','ob-otp':'#D8F2E4','ob-faceid':'#E6D9FF',
  'ob-pin-create':'#EDE1FF','ob-pin-confirm':'#EDE1FF','ob-payment':'#FFE6D2','ob-login':'#DFE8FF'
};
(function(){
  var f=window.obShow;
  if(typeof f!=='function') return;
  window.obShow=function(id){
    var r=f.apply(this, arguments);
    try{
      var box=document.getElementById('onboarding');
      if(box){
        var c=OB_SAT[id];
        if(c){
          box.style.background=c; box.classList.add('sat'); box.classList.toggle('dark', !!OB_DARK[id]);
          box.style.setProperty('--obt', OB_TINTS[c]||'#FFFFFF');
        } else {
          box.classList.remove('sat'); box.classList.remove('dark');
          var soft=OB_SOFT[id]||'#EDE1FF';
          box.style.background=soft;
          box.style.setProperty('--obt', '#FFFFFF');
        }
      }
    }catch(e){}
    return r;
  };
})();
/* ═══════════════ HUMEUR : déplacée dans les objectifs ═══════════════ */
(function(){
  var f=window.renderSuivi;
  if(typeof f==='function'){
    window.renderSuivi=function(){ if(!document.getElementById('suivi')) return; return f.apply(this, arguments); };
  }
  var g=window.renderObjectives;
  if(typeof g==='function'){
    window.renderObjectives=function(){
      var r=g.apply(this, arguments);
      try{
        var pad=document.getElementById('obj-pad');
        if(pad && !pad.querySelector('#suivi')){
          var d=document.createElement('div');
          d.innerHTML='<div class="section-head"><h2>Ton suivi</h2><span class="link" onclick="openMoodScreen(true)">Noter mon humeur</span></div><div id="suivi"></div>';
          while(d.firstChild) pad.appendChild(d.firstChild);
          renderSuivi();
        }
      }catch(e){}
      return r;
    };
  }
})();
/* ═══════════════ OBJECTIFS VISIBLES SUR L'ACCUEIL ═══════════════ */
function renderHomeGoals(){
  var box=$('home-goals'); if(!box) return;
  var h='';
  if(state.capMeta){
    h+='<div class="hg-cap meta"><div class="hg-lbl">Ton cap</div><div class="hg-txt">Mieux me connaître avant de viser</div></div>';
  } else if(state.cap && state.cap.trim()){
    h+='<div class="hg-cap"><div class="hg-lbl">Ton cap</div><div class="hg-txt">'+escapeHtml(state.cap)+'</div></div>';
  } else {
    h+='<div class="hg-cap empty"><div class="hg-lbl">Ton cap</div><div class="hg-txt">Pas encore défini</div>'
      +'<button class="hg-go" onclick="startObjQuiz()">Le trouver</button></div>';
  }
  var objs=state.objectives||[];
  if(objs.length){
    h+=objs.slice(0,3).map(function(o){
      var done=o.progress>=o.steps, pct=Math.round(o.progress/o.steps*100);
      var link=o.link?byId(o.link):null;
      return '<div class="hg-obj'+(done?' done':'')+'">'
        +'<div class="hg-oh">'+(link?'<span class="hg-ava" style="background:'+link.color+'">'+(link.id==='mia'?'M':link.name[0])+'</span>':'')
        +'<span class="hg-on">'+escapeHtml(o.name)+'</span></div>'
        +'<div class="hg-bar"><i style="width:'+pct+'%;background:'+(link?link.color:'#974AF0')+'"></i></div>'
        +'<div class="hg-of"><span>'+o.progress+' / '+o.steps+'</span>'
        +(done?'<span class="hg-done">Terminé</span>':'<button class="hg-step" onclick="stepObjective(\''+o.id+'\')" style="background:'+(link?link.color:'#974AF0')+'">+ 1 pas</button>')
        +'</div></div>';
    }).join('');
    if(objs.length>3) h+='<button class="hg-all" onclick="showTab(\'objectifs\')">Voir mes '+objs.length+' objectifs</button>';
  } else {
    h+='<div class="hg-empty">Aucune action en cours. Trouve ton premier objectif et il s\u2019affichera ici.</div>'
      +'<button class="hg-all" onclick="startObjQuiz()">Trouver mon objectif</button>';
  }
  box.innerHTML=h;
}
(function(){
  ['showTab','enterApp','stepObjective','addObjective','deleteObjective'].forEach(function(n){
    var f=window[n];
    if(typeof f!=='function') return;
    window[n]=function(){ var r=f.apply(this, arguments); try{ renderHomeGoals(); }catch(e){} return r; };
  });
})();

/* ═══════════════ CARTES DE L'ACCUEIL — "Avec qui" ouvre la présentation ═══════════════ */
var JCARDS=[
  {c:'#974AF0', a:'#6F2FC0', lb:'Ton cap',       t:'Où tu vas',      go:"showTab('objectifs')"},
  {c:'#224CF2', a:'#8FB4FF', lb:'Humeur',        t:'Comment tu vas', go:"openMoodScreen(true)"},
  {c:'#00A862', a:'#FFC400', lb:'Profil',        t:'Qui tu es',      go:"startQuiz()"},
  {c:'#FE6601', a:'#FFDBC2', lb:'Accompagnants', t:'Avec qui',       go:"openAgentDeck()"},
  {c:'#E8467F', a:'#FFAFCF', lb:'Supervision',   t:'Qui te suit',    go:"showTab('objectifs')"}
];


