/* ═══════════════ COULEURS PLEINES — palette MAYND ═══════════════ */
var QTHEME=[
  {c:'#974AF0', bg:'#974AF0'},
  {c:'#224CF2', bg:'#224CF2'},
  {c:'#FE6601', bg:'#FE6601'}
];
function qTheme(i){ return QTHEME[i % QTHEME.length]; }
function qzHeadHTML(idx, total, closeFn, backFn, th){
  var pct=Math.round((idx/total)*100);
  var back = idx>0 ? '<button class="qz2-back" onclick="'+backFn+'" aria-label="Retour"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' : '';
  return '<div class="qz2-head">'+back
    +'<button class="qz2-close" onclick="'+closeFn+'">'+qzIcoClose()+'</button>'
    +'<div class="qz2-prog"><i style="width:'+pct+'%"></i></div>'
    +'<div class="qz2-step">'+(idx+1)+' / '+total+'</div></div>';
}
/* questionnaire de base */
function qzRenderQuestion(){
  var q=QUIZ[quizIdx]; var th=qTheme(quizIdx);
  var wrap=$('quiz'); if(wrap){ wrap.style.background=th.bg; wrap.classList.add('tinted'); }
  var h='<div class="qz2-wrap">'+qzHeadHTML(quizIdx, QUIZ.length, 'qzClose()', 'qzBack()', th)
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.type==='text'){
    h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
    h+='<textarea class="qz2-ta" id="quiz-ta" placeholder="Ta réponse…">'+escapeHtml(quizAns.q7||'')+'</textarea>';
    h+='<div class="qz2-foot"><button class="btn full" onclick="qzSubmitText()">Continuer</button><button class="btn ghost full" onclick="qzSkipText()">Passer cette question</button></div>';
  } else {
    h+='<div class="qz2-opts">';
    q._opts.forEach(function(o,i){
      var sel = quizAns[q.id] && quizAns[q.id].t===o.t;
      h+='<button class="qz2-opt'+(sel?' sel':'')+'" onclick="qzPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>';
    });
    h+='</div>';
  }
  h+='</div></div>';
  $('quiz-inner').innerHTML=h; $('quiz').scrollTop=0;
}
/* questionnaire objectif */
function objqRenderQ(){
  var q=OBJQ[objqIdx]; var th=qTheme(objqIdx);
  var wrap=$('orient'); if(wrap){ wrap.style.background=th.bg; wrap.classList.add('tinted'); }
  var h='<div class="qz2-wrap">'+qzHeadHTML(objqIdx, OBJQ.length, 'objqClose()', 'objqBack()', th)
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.hint) h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
  h+='<div class="qz2-opts">';
  q.opts.forEach(function(o,i){
    var sel = q.multi ? (objqAns[q.ax]||[]).indexOf(o.v)>=0 : objqAns[q.ax]===o.v;
    h+='<button class="qz2-opt'+(sel?' sel':'')+'" onclick="'+(q.multi?'objqToggle('+i+')':'objqPick('+i+')')+'"><span class="rd'+(q.multi?' sq':'')+'"></span><span>'+escapeHtml(o.t)+'</span></button>';
  });
  h+='</div>';
  if(q.multi){
    var n=(objqAns[q.ax]||[]).length;
    h+='<div class="qz2-foot"><button class="btn full" onclick="objqAdvance()">'+(n?'Continuer':'Passer')+'</button></div>';
  }
  h+='</div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
/* ═══════════════ CARTES PLEINE COULEUR — ACCUEIL ═══════════════ */
var JCARDS=[
  {c:'#974AF0', lb:'Ton cap',      t:'Où tu vas',        go:"showTab('objectifs')"},
  {c:'#224CF2', lb:'Humeur',       t:'Comment tu vas',   go:"openMoodScreen()"},
  {c:'#FE6601', lb:'Profil',       t:'Qui tu es',        go:"startQuiz()"},
  {c:'#6F2FC0', lb:'Accompagnants',t:'Avec qui',         go:"openDrawer()"}
];
function jArrow(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
function renderJRow(){
  var box=$('jrow'); if(!box) return;
  box.innerHTML=JCARDS.map(function(c){
    return '<button class="jcard" style="--jc:'+c.c+'" onclick="'+c.go+'">'
      +'<span class="jcard-lb">'+c.lb+'</span>'
      +'<span class="jcard-t">'+c.t+'</span>'
      +'<span class="jcard-go">'+jArrow()+'</span></button>';
  }).join('');
}
/* ═══════════════ ÉCRANS D'INSCRIPTION EN COULEUR PLEINE ═══════════════ */
var OB_SAT={'ob-welcome':'#974AF0','ob-account-success':'#6F2FC0','ob-pay-success':'#FE6601','ob-trust':'#224CF2'};
(function(){
  var f=window.obShow;
  if(typeof f==='function'){
    window.obShow=function(id){
      var r=f.apply(this, arguments);
      try{
        var box=document.getElementById('onboarding');
        if(box){
          if(OB_SAT[id]){ box.style.background=OB_SAT[id]; box.classList.add('sat'); }
          else { box.classList.remove('sat'); if(OB_TINT[id]) box.style.background=OB_TINT[id]; }
        }
      }catch(e){}
      return r;
    };
  }
  /* écran résultat et écran de crise : fond neutre */
  ['qzShowResult','qzRenderCrisis'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){
      var r=g.apply(this,arguments);
      try{ var q=document.getElementById('quiz'); if(q){ q.classList.remove('tinted'); q.style.background='#FFFFFF'; } }catch(e){}
      return r;
    };
  });
  /* cartes de l'accueil */
  ['showTab','enterApp'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){ var r=g.apply(this,arguments); try{ renderJRow(); }catch(e){} return r; };
  });
})();



/* ═══════════════ PALETTE MAYND ÉLARGIE — paires qui s'accordent ═══════════════ */
var MC={violet:'#974AF0', violetDeep:'#6F2FC0', blue:'#224CF2', orange:'#FE6601', green:'#00A862', yellow:'#FFC400', white:'#FFFFFF'};
/* rotation des questionnaires : jamais deux couleurs qui jurent côte à côte */
var QTHEME=[
  {bg:MC.violet,     dark:false},
  {bg:MC.blue,       dark:false},
  {bg:MC.green,      dark:false},
  {bg:MC.orange,     dark:false},
  {bg:MC.yellow,     dark:true},
  {bg:MC.violetDeep, dark:false}
];
function qTheme(i){ return QTHEME[i % QTHEME.length]; }
function qzPaint(el, th){
  if(!el) return;
  el.style.background=th.bg;
  el.classList.add('tinted');
  el.classList.toggle('dark', !!th.dark);
}
/* ═══════════════ CARTES DE L'ACCUEIL — une paire par carte ═══════════════ */
var JCARDS=[
  {c:MC.violet,     a:MC.yellow, lb:'Ton cap',       t:'Où tu vas',      go:"showTab('objectifs')"},
  {c:MC.blue,       a:MC.yellow, lb:'Humeur',        t:'Comment tu vas', go:"openMoodScreen()"},
  {c:MC.green,      a:MC.yellow, lb:'Profil',        t:'Qui tu es',      go:"startQuiz()"},
  {c:MC.orange,     a:MC.white,  lb:'Accompagnants', t:'Avec qui',       go:"openDrawer()"},
  {c:MC.yellow,     a:MC.orange, lb:'Supervision',   t:'Qui te suit',    go:"showTab('objectifs')", dark:true}
];
function renderJRow(){
  var box=$('jrow'); if(!box) return;
  box.innerHTML=JCARDS.map(function(c){
    return '<button class="jcard'+(c.dark?' dark':'')+'" style="--jc:'+c.c+';--ja:'+c.a+'" onclick="'+c.go+'">'
      +'<span class="jcard-lb">'+c.lb+'</span>'
      +'<span class="jcard-t">'+c.t+'</span>'
      +'<span class="jcard-go">'+jArrow()+'</span></button>';
  }).join('');
}
/* ═══════════════ INSCRIPTION : couleur pleine, équilibrée ═══════════════ */
var OB_SAT={
  'ob-welcome':MC.violet, 'ob-trust':MC.blue, 'ob-account-success':MC.green,
  'ob-quiz-invite':MC.violetDeep, 'ob-pay-success':MC.yellow, 'ob-plan':MC.orange
};
var OB_DARK={'ob-pay-success':true};
(function(){
  var f=window.obShow;
  if(typeof f==='function'){
    window.obShow=function(id){
      var r=f.apply(this, arguments);
      try{
        var box=document.getElementById('onboarding');
        if(box){
          if(OB_SAT[id]){ box.style.background=OB_SAT[id]; box.classList.add('sat'); box.classList.toggle('dark', !!OB_DARK[id]); }
          else { box.classList.remove('sat'); box.classList.remove('dark'); if(OB_TINT[id]) box.style.background=OB_TINT[id]; }
        }
      }catch(e){}
      return r;
    };
  }
})();
/* ═══════════════ QUESTIONNAIRES REPEINTS ═══════════════ */
function qzRenderQuestion(){
  var q=QUIZ[quizIdx]; var th=qTheme(quizIdx);
  qzPaint($('quiz'), th);
  var h='<div class="qz2-wrap">'+qzHeadHTML(quizIdx, QUIZ.length, 'qzClose()', 'qzBack()', th)
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.type==='text'){
    h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
    h+='<textarea class="qz2-ta" id="quiz-ta" placeholder="Ta réponse…">'+escapeHtml(quizAns.q7||'')+'</textarea>';
    h+='<div class="qz2-foot"><button class="btn full" onclick="qzSubmitText()">Continuer</button><button class="btn ghost full" onclick="qzSkipText()">Passer cette question</button></div>';
  } else {
    h+='<div class="qz2-opts">';
    q._opts.forEach(function(o,i){
      var sel = quizAns[q.id] && quizAns[q.id].t===o.t;
      h+='<button class="qz2-opt'+(sel?' sel':'')+'" onclick="qzPick('+i+')"><span class="rd"></span><span>'+escapeHtml(o.t)+'</span></button>';
    });
    h+='</div>';
  }
  h+='</div></div>';
  $('quiz-inner').innerHTML=h; $('quiz').scrollTop=0;
}
function objqRenderQ(){
  var q=OBJQ[objqIdx]; var th=qTheme(objqIdx);
  qzPaint($('orient'), th);
  var h='<div class="qz2-wrap">'+qzHeadHTML(objqIdx, OBJQ.length, 'objqClose()', 'objqBack()', th)
    +'<div class="qz2-body"><div class="qz2-q">'+escapeHtml(q.q)+'</div>';
  if(q.hint) h+='<div class="qz2-hint">'+escapeHtml(q.hint)+'</div>';
  h+='<div class="qz2-opts">';
  q.opts.forEach(function(o,i){
    var sel = q.multi ? (objqAns[q.ax]||[]).indexOf(o.v)>=0 : objqAns[q.ax]===o.v;
    h+='<button class="qz2-opt'+(sel?' sel':'')+'" onclick="'+(q.multi?'objqToggle('+i+')':'objqPick('+i+')')+'"><span class="rd'+(q.multi?' sq':'')+'"></span><span>'+escapeHtml(o.t)+'</span></button>';
  });
  h+='</div>';
  if(q.multi){
    var n=(objqAns[q.ax]||[]).length;
    h+='<div class="qz2-foot"><button class="btn full" onclick="objqAdvance()">'+(n?'Continuer':'Passer')+'</button></div>';
  }
  h+='</div></div>';
  $('or-inner').innerHTML=h; $('orient').scrollTop=0;
}
/* écrans neutres : on retire aussi la variante claire */
(function(){
  ['qzShowResult','qzRenderCrisis'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){
      var r=g.apply(this,arguments);
      try{ var q=document.getElementById('quiz'); if(q){ q.classList.remove('tinted'); q.classList.remove('dark'); q.style.background='#FFFFFF'; } }catch(e){}
      return r;
    };
  });
})();



