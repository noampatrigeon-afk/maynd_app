/* ═══════════════ SONS — palette calme, un son par situation ═══════════════ */
var SND={
  tap:      {n:[392],        d:.13, v:.035},
  select:   {n:[523],        d:.14, v:.045},
  next:     {n:[440,587],    d:.16, v:.040},
  back:     {n:[523,392],    d:.16, v:.035},
  open:     {n:[349,523],    d:.20, v:.040},
  close:    {n:[523,349],    d:.18, v:.032},
  toggle:   {n:[659],        d:.10, v:.038},
  success:  {n:[523,659,784],d:.26, v:.050},
  unlock:   {n:[440,554,659],d:.24, v:.048},
  soft:     {n:[294],        d:.18, v:.030}
};
function sfx(kind){
  try{
    if(typeof state==='undefined' || !state || !state.sound) return;
    var cfg=SND[kind]||SND.tap;
    var ac=mCtx(); if(!ac) return;
    if(ac.state==='suspended' && ac.resume) ac.resume();
    var t0=ac.currentTime;
    cfg.n.forEach(function(freq, i){
      var t=t0+i*(cfg.d*0.34);
      var o=ac.createOscillator(), g=ac.createGain(), lp=ac.createBiquadFilter();
      o.type='sine';
      lp.type='lowpass'; lp.frequency.setValueAtTime(1500,t);
      o.frequency.setValueAtTime(freq,t);
      o.frequency.exponentialRampToValueAtTime(freq*0.94,t+cfg.d);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(cfg.v,t+0.014);
      g.gain.exponentialRampToValueAtTime(0.0001,t+cfg.d);
      o.connect(lp); lp.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t+cfg.d+0.02);
    });
  }catch(e){}
}
/* ═══════════════ ICÔNES COLORÉES ═══════════════ */
function joySVG(kind, c){
  var col=c||'#974AF0';
  if(kind==='smile') return '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="'+col+'"/><circle cx="17" cy="20" r="3" fill="#fff"/><circle cx="31" cy="20" r="3" fill="#fff"/><path d="M15 28c3 4 6 6 9 6s6-2 9-6" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>';
  if(kind==='spark') return '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="'+col+'"/><path d="M24 12l3.2 7.4L35 22l-7.8 2.6L24 32l-3.2-7.4L13 22l7.8-2.6z" fill="#fff"/></svg>';
  if(kind==='flag')  return '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="'+col+'"/><path d="M18 14v20M18 15h12l-2.6 4.5L30 24H18" fill="#fff" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/></svg>';
  if(kind==='heart') return '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="'+col+'"/><path d="M24 33s-9-5.4-9-11a5 5 0 019-2.8A5 5 0 0133 22c0 5.6-9 11-9 11z" fill="#fff"/></svg>';
  return '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="'+col+'"/><circle cx="24" cy="24" r="8" fill="#fff"/></svg>';
}
