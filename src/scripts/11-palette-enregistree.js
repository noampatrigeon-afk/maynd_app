/* ═══════════════ PALETTE MAYND — enregistrée, source unique ═══════════════ */
var PAL={
  violet:'#974AF0', violetDeep:'#6F2FC0', violetLight:'#C9A3F7',
  blue:'#224CF2', blueLight:'#2A6FF0', sky:'#00AEDB',
  orange:'#FE6601', amber:'#FF9500', peach:'#FFDBC2',
  green:'#00A862', emerald:'#0BA372', teal:'#00C4A7',
  yellow:'#FFC400',
  red:'#E5243B', pink:'#E8407F', magenta:'#C92B8E',
  indigo:'#4331C4', black:'#000000', white:'#FFFFFF'
};
/* couleur de chaque accompagnant, accordée à son terrain */
var AGENT_COLORS={
  mia:PAL.violet,          /* co-pilote        violet MAYND */
  naoki:'#1B4AE0',         /* discipline       bleu franc, cadre */
  felix:'#FF7A1A',         /* confiance        orange vif, chaleur */
  atlas:'#7130E8',         /* identité, sens   violet profond */
  ava:PAL.pink,            /* émotions, deuil  rose */
  leo:PAL.red,             /* couple           rouge */
  soren:PAL.amber,         /* parentalité      ambre chaud */
  iris:PAL.green,          /* lien social      vert */
  otis:PAL.yellow,         /* communication    jaune, la voix */
  kael:PAL.teal,           /* sport            turquoise, énergie */
  miro:PAL.indigo,         /* sommeil          indigo nuit */
  sol:PAL.sky,             /* anxiété          bleu ciel, respiration */
  eden:PAL.magenta,        /* intimité         magenta */
  vince:PAL.emerald,       /* argent           émeraude */
  mateo:PAL.blueLight,     /* travail          bleu clair */
  neo:'#8B3FE8'            /* addictions       violet */
};
var LIGHT_AGENTS=['otis'];
function agentInk(id){ return LIGHT_AGENTS.indexOf(id)>=0 ? '#000' : '#fff'; }
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* ═══════════════ CARTES DE L'ACCUEIL — 5 paires toutes différentes ═══════════════ */
var JCARDS=[
  {c:PAL.violet, a:PAL.violetDeep,  lb:'Ton cap',       t:'Où tu vas',      go:"showTab('objectifs')"},
  {c:PAL.blue,   a:PAL.white,       lb:'Humeur',        t:'Comment tu vas', go:"openMoodScreen()"},
  {c:PAL.green,  a:PAL.yellow,      lb:'Profil',        t:'Qui tu es',      go:"startQuiz()"},
  {c:PAL.orange, a:PAL.peach,       lb:'Accompagnants', t:'Avec qui',       go:"openDrawer()"},
  {c:PAL.yellow, a:PAL.green,       lb:'Supervision',   t:'Qui te suit',    go:"showTab('objectifs')", dark:true}
];
/* ═══════════════ FOND DU CHAT SELON L'ACCOMPAGNANT PRÉSENT ═══════════════ */
function chatAgent(){
  try{
    var p=threadParts();
    for(var i=0;i<p.length;i++){ if(p[i]!=='mia') return p[i]; }
    return 'mia';
  }catch(e){ return 'mia'; }
}
function paintChat(){
  try{
    var id=chatAgent(); var a=byId(id)||byId('mia');
    var sc=$('tab-chat'); if(!sc) return;
    sc.style.background=a.color;
    sc.classList.toggle('light-agent', LIGHT_AGENTS.indexOf(id)>=0);
  }catch(e){}
}
/* ═══════════════ INSCRIPTION — couleur sur chaque écran, jamais de fade ═══════════════ */
var OB_SAT={
  'ob-welcome':PAL.violet, 'ob-verify-choice':PAL.blue, 'ob-access':PAL.violetDeep,
  'ob-trust':PAL.blue, 'ob-account-success':PAL.green, 'ob-quiz-invite':PAL.violet,
  'ob-plan':PAL.orange, 'ob-pay-success':PAL.yellow
};
var OB_DARK={'ob-pay-success':true};
/* les écrans de saisie passent en blanc pur, jamais en teinte délavée */
var OB_WHITE=['ob-signup','ob-email','ob-pwd','ob-verify-code','ob-otp','ob-faceid',
              'ob-pin-create','ob-pin-confirm','ob-firstname','ob-payment','ob-login','ob-cgu'];
/* ═══════════════ VERROU ANTI DOUBLE APPUI ═══════════════ */
var _locks={};
function lockFor(el, ms){
  if(!el) return;
  var key=el.id||'x';
  el.style.pointerEvents='none';
  if(_locks[key]) clearTimeout(_locks[key]);
  _locks[key]=setTimeout(function(){ try{ el.style.pointerEvents=''; }catch(e){} _locks[key]=null; }, ms||320);
}
(function(){
  /* inscription : un appui = un écran */
  var f=window.obShow;
  if(typeof f==='function'){
    window.obShow=function(id){
      var r=f.apply(this, arguments);
      try{
        var box=document.getElementById('onboarding');
        if(box){
          if(OB_SAT[id]){ box.style.background=OB_SAT[id]; box.classList.add('sat'); box.classList.toggle('dark', !!OB_DARK[id]); }
          else { box.classList.remove('sat'); box.classList.remove('dark'); box.style.background=PAL.white; }
          lockFor(box, 340);
        }
      }catch(e){}
      return r;
    };
  }
  /* questionnaires : un appui = une réponse */
  ['qzPick','objqPick','objqAdvance'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){
      var r=g.apply(this, arguments);
      try{ lockFor(document.getElementById(n==='qzPick'?'quiz':'orient'), 260); }catch(e){}
      return r;
    };
  });
  /* le chat prend la couleur de l'accompagnant */
  ['openChat','renderChatHeader','addParticipant','togglePart','openThread','newConversation','startWithAgent','showTab'].forEach(function(n){
    var g=window[n];
    if(typeof g!=='function') return;
    window[n]=function(){ var r=g.apply(this, arguments); try{ paintChat(); }catch(e){} return r; };
  });
})();



