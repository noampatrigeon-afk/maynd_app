/* ═══════════════ COULEUR PAR QUESTION ═══════════════ */
/* ancienne palette pâle retirée : la palette pleine fait foi */
function qzHeadHTML(idx, total, closeFn, backFn, th){
  var pct=Math.round((idx/total)*100);
  var back = idx>0 ? '<button class="qz2-back" onclick="'+backFn+'" aria-label="Retour"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' : '';
  return '<div class="qz2-head">'+back
    +'<button class="qz2-close" onclick="'+closeFn+'">'+qzIcoClose()+'</button>'
    +'<div class="qz2-prog"><i style="width:'+pct+'%;background:'+th.c+'"></i></div>'
    +'<div class="qz2-step" style="color:'+th.c+'">'+(idx+1)+' / '+total+'</div></div>';
}
/* ═══════════════ QUESTIONNAIRE DE BASE : couleur + retour arrière ═══════════════ */
function qzRenderQuestion(){
  var q=QUIZ[quizIdx]; var th=qTheme(quizIdx);
  var wrap=$('quiz'); if(wrap) wrap.style.background=th.bg;
  var h='<div class="qz2-wrap">'+qzHeadHTML(quizIdx, QUIZ.length, 'qzClose()', 'qzBack()', th)
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.type==='text'){
    h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
    h+='<textarea class="qz2-ta" id="quiz-ta" placeholder="Ta réponse…">'+escapeHtml(quizAns.q7||'')+'</textarea>';
    h+='<div class="qz2-foot"><button class="btn full" style="background:'+th.c+'" onclick="qzSubmitText()">Continuer</button><button class="btn ghost full" onclick="qzSkipText()">Passer cette question</button></div>';
  } else {
    h+='<div class="qz2-opts">';
    q._opts.forEach(function(o,i){
      var sel = quizAns[q.id] && quizAns[q.id].t===o.t;
      h+='<button class="qz2-opt'+(sel?' sel':'')+'" style="--qc:'+th.c+';--qs:'+th.soft+'" onclick="qzPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>';
    });
    h+='</div>';
  }
  h+='</div></div>';
  $('quiz-inner').innerHTML=h; $('quiz').scrollTop=0;
}
function qzBack(){ if(quizIdx<=0) return; quizIdx--; sfx('back'); qzRenderQuestion(); }
/* ═══════════════ QUESTIONNAIRE OBJECTIF — 9 questions, ouvert et positif ═══════════════ */
var OBJQ=[
 {ax:'likes', multi:true, q:"Qu'est-ce que tu aimes le plus faire ?", hint:"Plusieurs réponses possibles.", opts:[
   {t:"Bouger, le sport, le grand air",v:'sport'},{t:"Créer, fabriquer, imaginer",v:'creer'},
   {t:"Apprendre, comprendre, lire",v:'apprendre'},{t:"Être avec les gens que j'aime",v:'proches'},
   {t:"Le calme, le silence, prendre mon temps",v:'calme'},{t:"Construire des projets, entreprendre",v:'projets'}]},
 {ax:'intent', q:"Aujourd'hui, tu veux plutôt…", opts:[
   {t:"Progresser sur quelque chose qui marche déjà",v:'grow'},
   {t:"Débloquer quelque chose qui coince",v:'unblock'},
   {t:"Retrouver de l'équilibre",v:'balance'},
   {t:"Explorer, je ne sais pas encore",v:'explore'},
   {t:"Autre",v:'autre'}]},
 {ax:'domain', q:"Sur quel domaine ?", opts:[
   {t:"Mon travail, mes projets",v:'travail'},{t:"Mes relations, mon entourage",v:'relations'},
   {t:"Mon rapport à moi-même",v:'soi'},{t:"Mon corps, mon énergie",v:'energie'},{t:"Autre",v:'autre'}]},
 {ax:'block', q:"Qu'est-ce qui joue le plus en ce moment ?", opts:[
   {t:"Rien ne m'empêche, je veux juste aller plus haut",v:'none'},
   {t:"Je ne sais pas par où commencer",v:'start'},
   {t:"Je commence puis j'abandonne vite",v:'give'},
   {t:"J'ai peur de me tromper de direction",v:'fear'},
   {t:"Je manque de temps ou d'énergie",v:'time'}]},
 {ax:'help', q:"Qu'est-ce qui t'aiderait le plus ?", opts:[
   {t:"Une action concrète à cocher chaque jour",v:'action'},{t:"Quelqu'un à qui en parler",v:'talk'},
   {t:"Du temps pour souffler, sans rien prouver",v:'rest'},{t:"Comprendre ce qui se joue",v:'understand'},{t:"Autre",v:'autre'}]},
 {ax:'since', q:"Depuis combien de temps c'est comme ça ?", opts:[
   {t:"Quelques semaines",v:'weeks'},{t:"Plusieurs mois",v:'months'},{t:"Plus d'un an",v:'year'},
   {t:"Ça va et vient depuis longtemps",v:'onoff'},{t:"Autre",v:'autre'}]},
 {ax:'days', q:"Ces dernières semaines, tes journées…", opts:[
   {t:"Je suis sur une super lancée, j'avance comme jamais",v:'surge'},
   {t:"M'ont plutôt fait avancer",v:'up'},{t:"Correctes, sans plus",v:'ok'},
   {t:"Je tourne en rond",v:'stuck'},{t:"Loin de ce que je voudrais vivre",v:'far'}]},
 {ax:'inner', q:"Ton rapport à ton dialogue intérieur ?", opts:[
   {t:"Plutôt bienveillant avec moi",v:'kind'},{t:"Exigeant mais juste",v:'firm'},
   {t:"Souvent trop dur",v:'harsh'},{t:"Je ne m'écoute pas vraiment",v:'none'},{t:"Autre",v:'autre'}]},
 {ax:'pace', q:"À quel rythme tu veux avancer ?", opts:[
   {t:"Tout doucement",v:'slow'},{t:"Pas à pas, régulier",v:'steady'},
   {t:"À fond dès que possible",v:'fast'},{t:"Je verrai au fil de l'eau",v:'flow'},{t:"Autre",v:'autre'}]}
];
var DOMAIN_MAP={
 travail:{key:'travail',agent:'mateo'}, relations:{key:'relations',agent:'otis'},
 soi:{key:'soi',agent:'felix'}, energie:{key:'energie',agent:'miro'}
};
var CAP2={
 build:{travail:"Monter d'un cran dans mon travail.", relations:"Rendre mes liens encore plus vivants.",
        soi:"Aller plus loin dans ce que je construis avec moi.", energie:"Pousser mon énergie plus haut, sans casser."},
 fix:{travail:"Avancer sur ce qui compte au travail, sans m'épuiser.", relations:"Construire des liens plus vrais et plus apaisés.",
      soi:"Être plus en paix avec moi.", energie:"Retrouver de l'énergie et un rythme qui me tient."}
};
var OBJ2={
 build:{
  travail:{none:"Viser un résultat précis cette semaine et le nommer",start:"Choisir le prochain palier et l'écrire noir sur blanc",give:"Tenir 20 min par jour sur ce qui te fait progresser",fear:"Tester ton idée en petit avant de l'engager en grand",time:"Protéger 20 min par jour pour ce qui compte vraiment"},
  relations:{none:"Proposer quelque chose à quelqu'un que tu aimes cette semaine",start:"Choisir une personne et lui donner du temps de qualité",give:"Prendre des nouvelles de trois proches cette semaine",fear:"Dire une chose sincère que tu gardes pour toi",time:"Bloquer un vrai moment avec un proche cette semaine"},
  soi:{none:"Noter chaque soir un pas franchi dans la journée",start:"Repérer ta plus grande force et l'utiliser une fois par jour",give:"T'accorder 10 min par jour pour ce qui te nourrit",fear:"Faire une chose qui te tente, sans attendre d'être prêt",time:"Prendre 10 min fixes pour toi dans ta journée"},
  energie:{none:"Ajouter une séance de plus cette semaine, sans forcer",start:"Repérer le moment où ton énergie est la plus haute et l'utiliser",give:"Bouger 20 min par jour, même léger",fear:"Tester un nouveau rythme sur une semaine, juste pour voir",time:"Protéger 20 min de mouvement dans ta journée"}
 },
 fix:{
  travail:{none:"Choisir une priorité cette semaine et t'y tenir",start:"Choisir une seule priorité et t'y mettre 20 min",give:"Avancer 15 min par jour, sans viser la perfection",fear:"Faire un premier jet imparfait de ce que tu repousses",time:"Bloquer 20 min fixes par jour pour l'essentiel"},
  relations:{none:"Entretenir un lien qui compte, cette semaine",start:"Reprendre contact avec une personne qui te manque",give:"Prendre des nouvelles d'un proche plusieurs fois cette semaine",fear:"Dire une chose sincère à quelqu'un, même petite",time:"T'accorder un vrai moment avec un proche cette semaine"},
  soi:{none:"Noter chaque soir une chose que tu as bien faite",start:"Noter chaque soir une chose que tu as bien faite",give:"T'accorder 10 min pour toi chaque jour, sans rien prouver",fear:"Repérer une pensée dure et la reformuler plus juste",time:"Prendre 10 min de calme fixes dans ta journée"},
  energie:{none:"Garder le rythme qui te tient, sans en rajouter",start:"Repérer à quel moment ton énergie chute",give:"Te coucher 20 min plus tôt quelques soirs cette semaine",fear:"Tester un seul changement de rythme, juste pour voir",time:"Protéger 10 min de vraie pause dans ta journée"}
 }
};
var HELP_AGENT={action:'naoki',talk:'otis',rest:'sol',understand:'atlas'};
var LIKE_AGENT={sport:'kael',creer:'atlas',apprendre:'atlas',proches:'iris',calme:'sol',projets:'mateo'};
var PACE_STEPS={slow:6,steady:5,fast:3,flow:4};
var objqAns={}, objqIdx=0;
function startObjQuiz(){ objqAns={likes:[]}; objqIdx=0; $('orient').classList.add('show'); objqRenderQ(); }
function startObrient(){ startObjQuiz(); }
function objqClose(){ $('orient').classList.remove('show'); }
function objqBack(){ if(objqIdx<=0) return; objqIdx--; sfx('back'); objqRenderQ(); }
function objqRenderQ(){
  var q=OBJQ[objqIdx]; var th=qTheme(objqIdx);
  var wrap=$('orient'); if(wrap) wrap.style.background=th.bg;
  var h='<div class="qz2-wrap">'+qzHeadHTML(objqIdx, OBJQ.length, 'objqClose()', 'objqBack()', th)
    +'<div class="qz2-body"><div class="qz2-ico">'+joySVG(objqIdx===0?'smile':(q.ax==='intent'?'spark':(q.ax==='pace'?'flag':'dot')), th.c)+'</div>'
    +'<div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.hint) h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
  h+='<div class="qz2-opts">';
  q.opts.forEach(function(o,i){
    var sel = q.multi ? (objqAns[q.ax]||[]).indexOf(o.v)>=0 : objqAns[q.ax]===o.v;
    h+='<button class="qz2-opt'+(sel?' sel':'')+'" style="--qc:'+th.c+';--qs:'+th.soft+'" onclick="'+(q.multi?'objqToggle('+i+')':'objqPick('+i+')')+'"><span class="rd'+(q.multi?' sq':'')+'"></span><span>'+escapeHtml(o.t)+'</span></button>';
  });
  h+='</div>';
  if(q.multi){
    var n=(objqAns[q.ax]||[]).length;
    h+='<div class="qz2-foot"><button class="btn full" style="background:'+th.c+'" onclick="objqAdvance()">'+(n?'Continuer':'Passer')+'</button></div>';
  }
  h+='</div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
function objqToggle(i){
  var q=OBJQ[objqIdx]; var v=q.opts[i].v;
  if(!Array.isArray(objqAns[q.ax])) objqAns[q.ax]=[];
  var k=objqAns[q.ax].indexOf(v);
  if(k>=0) objqAns[q.ax].splice(k,1); else objqAns[q.ax].push(v);
  sfx('select'); objqRenderQ();
}
function objqPick(i){
  var q=OBJQ[objqIdx]; objqAns[q.ax]=q.opts[i].v;
  sfx('select');
  var b=document.querySelectorAll('#or-inner .qz2-opt'); if(b[i]) b[i].classList.add('sel');
  setTimeout(objqAdvance,170);
}
function objqAdvance(){ objqIdx++; if(objqIdx>=OBJQ.length){ objqFinish(); } else { sfx('next'); objqRenderQ(); } }
function objqFinish(){
  state.objAnswers=JSON.parse(JSON.stringify(objqAns));
  state.challenges=state.challenges||{}; state.challenges.objective=true;
  var intent=objqAns.intent, dom=objqAns.domain, block=objqAns.block, help=objqAns.help, pace=objqAns.pace, inner=objqAns.inner, days=objqAns.days;
  if(intent==='explore' || (intent==='autre' && (!dom||dom==='autre'))){
    state.cap=''; state.capMeta=true; persist(); objqClose(); sfx('success'); objqAfter(); return;
  }
  var family = (intent==='grow' || days==='surge' || block==='none') ? 'build' : 'fix';
  var D=DOMAIN_MAP[dom]||DOMAIN_MAP['soi'];
  var bl=(block && OBJ2[family][D.key][block])?block:'start';
  var name=OBJ2[family][D.key][bl];
  var steps=PACE_STEPS[pace]||4;
  var primary=D.agent;
  var secondary=HELP_AGENT[help]||null;
  if(inner==='harsh' && secondary!=='felix') secondary='felix';
  var likes=objqAns.likes||[];
  var third = likes.length ? LIKE_AGENT[likes[0]] : null;
  state.cap=CAP2[family][D.key]; state.capMeta=false;
  addObjective(name, steps, primary);
  if(!Array.isArray(state.favorites)) state.favorites=[];
  [primary, secondary, third].forEach(function(id){ if(id && byId(id) && state.favorites.indexOf(id)<0) state.favorites.push(id); });
  if(!state.focus||!state.focus.agent) state.focus={agent:primary};
  persist(); objqClose(); sfx('success'); objqAfter(name);
}
function objqAfter(name){
  try{renderStrip();}catch(e){}
  if(activeScreen()==='tab-objectifs') renderObjectives();
  toast(state.capMeta?'Ton premier cap : mieux te connaître.':(name?'Objectif créé':'Ton cap est défini.'));
}


/* ═══════════════ COULEUR DANS LE PARCOURS D'INSCRIPTION ═══════════════ */
var OB_TINT={
  'ob-welcome':'#F1E8FF','ob-signup':'#E8EFFF','ob-email':'#E8EFFF','ob-pwd':'#E8EFFF',
  'ob-cgu':'#FFEDE1','ob-verify-choice':'#FFEDE1','ob-verify-code':'#FFEDE1','ob-otp':'#FFEDE1',
  'ob-access':'#F1E8FF','ob-faceid':'#F1E8FF','ob-pin-create':'#F1E8FF','ob-pin-confirm':'#F1E8FF',
  'ob-trust':'#E8EFFF','ob-firstname':'#FFEDE1','ob-account-success':'#F1E8FF',
  'ob-quiz-invite':'#E8EFFF','ob-plan':'#F1E8FF','ob-payment':'#E8EFFF','ob-pay-success':'#FFEDE1',
  'ob-login':'#E8EFFF'
};
/* ═══════════════ ROUTAGE DES SONS PAR SITUATION ═══════════════ */
function sndFor(el){
  if(!el) return null;
  if(el.closest('.qz2-opt')) return 'select';
  if(el.closest('.agx-tgl,.snd-row')) return 'toggle';
  if(el.closest('.qz2-back')) return 'back';
  if(el.closest('.sheet-close,.qz2-close,.backdrop')) return 'close';
  if(el.closest('.nav-item')) return 'soft';
  if(el.closest('.ob-key')) return 'tap';
  if(el.closest('.agx-star')) return 'toggle';
  if(el.closest('.ostep,.chal-btn')) return 'next';
  if(el.closest('.btn,button,.agx-row,.conv-item,.row-btn,.quest,.chal')) return 'tap';
  return null;
}
/* ═══════════════ BARRES DE SECTION EN ROTATION DE COULEUR ═══════════════ */
function colorSections(root){
  try{
    var box=root||document;
    var hs=box.querySelectorAll('.section-head h2');
    var cols=['#974AF0','#FE6601','#224CF2'];
    for(var i=0;i<hs.length;i++) hs[i].style.setProperty('--sc', cols[i%3]);
  }catch(e){}
}
(function(){
  /* couleur des sections après chaque rendu */
  ['renderObjectives','showTab','enterApp'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){ var r=g.apply(this,arguments); try{ colorSections(); }catch(e){} return r; };
  });
  /* l'écran de crise reprend un fond neutre */
  var cr=window.qzRenderCrisis;
  if(typeof cr==='function'){
    window.qzRenderCrisis=function(){
      var r=cr.apply(this,arguments);
      try{ var q=document.getElementById('quiz'); if(q) q.style.background='#FFFFFF'; }catch(e){}
      return r;
    };
  }
  /* teinte de fond à chaque étape d'inscription */
  var f=window.obShow;
  if(typeof f==='function'){
    window.obShow=function(id){
      var r=f.apply(this, arguments);
      try{
        var box=document.getElementById('onboarding');
        if(box && OB_TINT[id]) box.style.background=OB_TINT[id];
      }catch(e){}
      return r;
    };
  }
  /* un son adapté à chaque geste */
  try{
    document.addEventListener('click', function(ev){
      var k=sndFor(ev.target);
      if(k) sfx(k);
    }, true);
  }catch(e){}
  /* sons sur l'ouverture et la fermeture des feuilles */
  ['openSheet','closeSheet'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){ var r=g.apply(this,arguments); try{ sfx(n==='openSheet'?'open':'close'); }catch(e){} return r; };
  });
  /* son de réussite au bon moment */
  ['qzFinish','obPay'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){ var r=g.apply(this,arguments); try{ sfx(n==='obPay'?'unlock':'success'); }catch(e){} return r; };
  });
})();



