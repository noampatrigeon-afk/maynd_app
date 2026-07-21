/* ══════════════════ ROULETTE ANNÉE DE NAISSANCE ══════════════════ */
var YW_MIN, YW_MAX;
function buildYearWheel(){
  var wheel=$('year-wheel'); if(!wheel) return;
  var now=new Date().getFullYear(); YW_MAX=now-16; YW_MIN=now-100;
  var def=state.birthYear||(now-29);
  var h='<div class="yw-pad"></div>';
  for(var y=YW_MAX; y>=YW_MIN; y--){ h+='<div class="yw-item'+(y===def?' on':'')+'" data-y="'+y+'" onclick="pickYear('+y+')">'+y+'</div>'; }
  h+='<div class="yw-pad"></div>';
  wheel.innerHTML=h;
  state.birthYear=def;
  wheel.onscroll=ywOnScroll;
  setTimeout(function(){ ywScrollTo(def,false); },30);
}
function ywItemFor(y){ return $('year-wheel')?$('year-wheel').querySelector('.yw-item[data-y="'+y+'"]'):null; }
function ywScrollTo(y, smooth){
  var wheel=$('year-wheel'); var it=ywItemFor(y); if(!wheel||!it) return;
  var v=it.offsetTop - (wheel.clientHeight/2 - it.clientHeight/2);
  if(wheel.scrollTo){ try{ wheel.scrollTo({top:v, behavior: smooth?'smooth':'auto'}); return; }catch(e){} }
  wheel.scrollTop=v;
}
var _ywT=null;
function ywOnScroll(){
  var wheel=$('year-wheel'); if(!wheel) return;
  if(_ywT) clearTimeout(_ywT);
  var mid=wheel.scrollTop + wheel.clientHeight/2;
  var items=wheel.querySelectorAll('.yw-item'); var best=null, bd=1e9;
  items.forEach(function(it){ var c=it.offsetTop+it.clientHeight/2; var d=Math.abs(c-mid); if(d<bd){bd=d; best=it;} });
  if(best){ items.forEach(function(it){it.classList.remove('on');}); best.classList.add('on'); state.birthYear=parseInt(best.getAttribute('data-y'),10); }
}
function pickYear(y){ state.birthYear=y; var wheel=$('year-wheel'); if(wheel){ wheel.querySelectorAll('.yw-item').forEach(function(it){ it.classList.toggle('on', parseInt(it.getAttribute('data-y'),10)===y); }); } ywScrollTo(y,true); }

/* construit la roulette au chargement */
try{ buildYearWheel(); }catch(e){}



/* ═══════════════ RÉVÉLATION AU DÉFILEMENT ═══════════════ */
var _mIO=null;
function mReduced(){ try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } }
function mObserver(){
  if(_mIO) return _mIO;
  if(typeof IntersectionObserver==='undefined') return null;
  _mIO=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      en.target.classList.add('in');
      _mIO.unobserve(en.target);
      setTimeout(function(){ try{ en.target.style.transitionDelay=''; }catch(e){} },800);
    });
  },{threshold:.05});
  return _mIO;
}
function revealIn(root){
  if(!root || mReduced()) return;
  var io=mObserver();
  var kids=Array.prototype.slice.call(root.children);
  kids.forEach(function(el,i){
    if(el.__rv) return;
    el.__rv=true;
    el.classList.add('rv');
    el.style.transitionDelay=(Math.min(i,8)*45)+'ms';
    if(io){ io.observe(el); }
    else { el.classList.add('in'); }
  });
}
function revealActivePad(){
  var s=document.querySelector('.screen.active');
  if(!s) return;
  var pads=s.querySelectorAll('.pad');
  for(var i=0;i<pads.length;i++) revealIn(pads[i]);
}
/* ═══════════════ BRUITAGES (synthèse navigateur, aucun fichier) ═══════════════ */
var _mAC=null;
function mCtx(){
  if(_mAC) return _mAC;
  try{
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C) return null;
    _mAC=new C();
  }catch(e){ _mAC=null; }
  return _mAC;
}
function sfx(kind){
  try{
    if(typeof state==='undefined' || !state || !state.sound) return;
    var ac=mCtx(); if(!ac) return;
    if(ac.state==='suspended' && ac.resume) ac.resume();
    var t=ac.currentTime;
    var f = kind==='ok' ? 620 : (kind==='up' ? 500 : 390);
    var o=ac.createOscillator(), g=ac.createGain(), lp=ac.createBiquadFilter();
    o.type='sine';
    lp.type='lowpass'; lp.frequency.setValueAtTime(1600,t);
    o.frequency.setValueAtTime(f,t);
    o.frequency.exponentialRampToValueAtTime(f*0.8,t+0.10);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(kind==='ok'?0.06:0.045,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.14);
    o.connect(lp); lp.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t+0.16);
  }catch(e){}
}
function toggleSound(ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  state.sound=!state.sound;
  try{ persist(); }catch(e){}
  if(state.sound) sfx('unlock');
  try{ renderProfile(); }catch(e){}
}
/* écouteur de son remplacé par le routage par situation */
/* ═══════════════ BRANCHEMENT (sans toucher aux fonctions d'origine) ═══════════════ */
(function(){
  function wrap(name, after){
    var f=window[name];
    if(typeof f!=='function') return;
    window[name]=function(){
      var r=f.apply(this, arguments);
      try{ after.apply(null, arguments); }catch(e){}
      return r;
    };
  }
  wrap('renderObjectives', function(){ revealIn(document.getElementById('obj-pad')); });
  wrap('renderStrip',      function(){ revealIn(document.getElementById('agent-strip')); });
  wrap('renderDrawer',     function(){ revealIn(document.getElementById('drawer-body')); });
  wrap('renderParts',      function(){ revealIn(document.getElementById('parts-body')); });
  wrap('renderProfile',    function(){ revealIn(document.getElementById('profile-body')); });
  wrap('showTab',          function(){ revealActivePad(); });
  wrap('enterApp',         function(){ setTimeout(revealActivePad, 40); });
})();



