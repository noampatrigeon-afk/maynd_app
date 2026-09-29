/* ══════════════════════════════════════════════════════════════════════════
   SUIVI QUOTIDIEN : HUMEUR + BOUSSOLE — demande du 29/09/2026.

   1. Point du jour : l'écran d'humeur existant (émojis, une fois par jour à la
      première ouverture, comme avant) enchaîne maintenant sur la boussole :
      cinq réglettes préremplies avec les dernières valeurs, un radar qui bouge
      en direct, « Rien n'a bougé » pour valider d'une touche. Puis l'étape de
      commentaire / « En parler à MIA », inchangée.
      Choix : une fois par jour, pas à chaque ouverture — ouvrir l'app trois fois
      dans la journée ne doit pas redemander trois fois la même chose (la personne
      finirait par tout passer, et le suivi y perdrait).
   2. Historique de la boussole : state.wheelLog, un relevé par jour (le dernier
      de la journée remplace les précédents). Absent de defaultState, comme
      state.gameRuns : créé au premier relevé.
   3. « Ton suivi », en bas de l'onglet Parcours, redessiné en deux onglets :
      Humeur (la semaine en émojis) et Boussole (radar du jour posé sur la forme
      moyenne des 30 derniers jours, écart de chaque axe à la moyenne). La section « Ta boussole »
      du milieu de l'onglet est retirée : elle ferait doublon.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── historique de la boussole ─────────── */
function wheelSnapshot(){ var w=getWheel(), o={}; WHEEL.forEach(function(a){ o[a.k]=w[a.k]; }); return o; }
function logWheel(){
  state.wheelLog = Array.isArray(state.wheelLog) ? state.wheelLog : [];
  var dk=todayKey();
  state.wheelLog = state.wheelLog.filter(function(e){ return e.day!==dk; });
  state.wheelLog.push({day:dk, v:wheelSnapshot()});
  if(state.wheelLog.length>370) state.wheelLog=state.wheelLog.slice(-370);
  persist();
}
function wheelTodayLogged(){ return (state.wheelLog||[]).some(function(e){ return e.day===todayKey(); }); }
/* Moyenne de la boussole (demande du 29/09) : relevés des 30 derniers jours, aujourd'hui exclu,
   pour que le jour se lise par rapport à l'habitude. null s'il n'y a aucun relevé antérieur. */
var WHEEL_AVG_DAYS=30;
function wheelAverage(){
  var lim=new Date(); lim.setDate(lim.getDate()-WHEEL_AVG_DAYS); var limK=todayKey(lim), tk=todayKey();
  var log=(state.wheelLog||[]).filter(function(e){ return e.day!==tk && e.day>=limK && e.v; });
  if(!log.length) return null;
  var v={};
  WHEEL.forEach(function(a){
    var s=0; log.forEach(function(e){ s+=(+e.v[a.k]||0); });
    v[a.k]=Math.round(s/log.length*10)/10;
  });
  return {v:v, n:log.length};
}
function wheelFmt(x){ return String(x).replace('.',','); }
/* Toute retouche depuis la feuille « Ajuster ma boussole » compte comme le relevé du jour. */
(function(){
  var base=setWheel;
  if(typeof base!=='function') return;
  window.setWheel=function(){ var r=base.apply(this, arguments); logWheel(); return r; };
})();

/* ─────────── radar ─────────── */
/* avg : la moyenne, dessinée en fond en aplat teinté, sous la forme du jour. */
function svRadarSVG(values, prev, size, avg){
  var cx=size/2, cy=size/2, R=size/2-12, n=WHEEL.length;
  function pt(i,rad){ var ang=(-90+i*(360/n))*Math.PI/180; return [cx+rad*Math.cos(ang), cy+rad*Math.sin(ang)]; }
  function poly(vals){ return WHEEL.map(function(a,i){ return pt(i,R*(vals[a.k]/10)).map(function(v){ return v.toFixed(1); }).join(','); }).join(' '); }
  var g='';
  [0.25,0.5,0.75,1].forEach(function(f){ g+='<polygon points="'+WHEEL.map(function(_,i){ return pt(i,R*f).map(function(v){ return v.toFixed(1); }).join(','); }).join(' ')+'" fill="none" stroke="#E7DAFF" stroke-width="1"/>'; });
  WHEEL.forEach(function(a,i){ var p=pt(i,R); g+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="#E7DAFF" stroke-width="1"/>'; });
  if(avg) g+='<polygon class="sv-avg" points="'+poly(avg)+'" fill="#DCC8FF" stroke="#C7ABFA" stroke-width="1.2" stroke-linejoin="round"/>';
  if(prev) g+='<polygon class="sv-prev" points="'+poly(prev)+'" fill="none" stroke="#A79CBC" stroke-width="1.6" stroke-dasharray="4 4" stroke-linejoin="round"/>';
  g+='<polygon class="sv-now" points="'+poly(values)+'" fill="rgba(151,74,240,'+(avg?'.10':'.18')+')" stroke="#974AF0" stroke-width="2.6" stroke-linejoin="round"/>';
  WHEEL.forEach(function(a,i){ var p=pt(i,R*(values[a.k]/10)); g+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.2" fill="'+a.color+'" stroke="#fff" stroke-width="1.5"/>'; });
  return '<svg class="sv-radar" viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+g+'</svg>';
}

/* ─────────── 1. point du jour : l'étape boussole ─────────── */
var _ciWheel=null;
function ciEnsureWheelBox(){
  if($('ms-wheel')) return;
  var arrows=$('ms-arrows'); if(!arrows) return;
  arrows.insertAdjacentHTML('afterend','<div class="ms-wheel" id="ms-wheel" style="display:none"></div>');
}
function ciRenderWheelStep(){
  var box=$('ms-wheel'); if(!box) return;
  var avg=wheelAverage();
  box.innerHTML='<div class="ci-radar" id="ci-radar">'+svRadarSVG(_ciWheel, null, 170, avg&&avg.v)+'</div>'
    +(avg?'<div class="sv-legend ci-legend"><span class="sv-lg now"></span>Aujourd’hui <span class="sv-lg avg"></span>Ta moyenne</div>':'')
    +WHEEL.map(function(a){
      return '<div class="ci-row" style="--ac:'+a.color+'"><span class="ci-dot"></span><span class="ci-n">'+wLabel(a)+'</span>'
        +'<input type="range" min="1" max="10" value="'+_ciWheel[a.k]+'" oninput="ciSet(\''+a.k+'\',this.value)" aria-label="'+wLabel(a)+'">'
        +'<span class="ci-v" id="ci-v-'+a.k+'">'+_ciWheel[a.k]+'</span></div>';
    }).join('');
}
function ciSet(k,v){
  _ciWheel[k]=parseInt(v,10)||1;
  var el=$('ci-v-'+k); if(el) el.textContent=_ciWheel[k];
  var r=$('ci-radar'), avg=wheelAverage(); if(r) r.innerHTML=svRadarSVG(_ciWheel, null, 170, avg&&avg.v);
}
function ciShowWheelStep(){
  ciEnsureWheelBox();
  _ciWheel=wheelSnapshot();
  $('ms-q').textContent='Et ta boussole ?';
  $('ms-date').textContent='De 1 à 10. Tes dernières valeurs sont déjà en place.';
  $('ms-wrap').style.display='none';
  $('ms-arrows').style.display='none';
  $('ms-comment').style.display='none';
  $('mood-screen').classList.add('ci-wheel');
  ciRenderWheelStep();
  $('ms-wheel').style.display='';
  var hadLog=(state.wheelLog||[]).length>0;
  $('ms-bottom').innerHTML='<button class="btn full" onclick="ciValidateWheel()">Valider ma boussole</button>'
    +(hadLog?'<button class="btn ghost full ci-same" onclick="ciValidateWheel(true)">Rien n’a bougé</button>':'');
}
function ciValidateWheel(same){
  if(!same && _ciWheel){ getWheel(); WHEEL.forEach(function(a){ state.wheel[a.k]=_ciWheel[a.k]; }); }
  logWheel();
  ciLeaveWheelStep();
  /* étape suivante : celle d'avant ce chantier (commentaire, « En parler à MIA », « Terminer ») */
  $('ms-q').textContent=t('moodQuestion');
  renderMoodStatic();
  $('ms-wrap').style.display='';
  $('ms-comment').style.display='block';
  renderMoodBottom('comment');
  try{ if(activeScreen()==='tab-objectifs') renderObjectives(); }catch(e){}
}
function ciLeaveWheelStep(){
  var w=$('ms-wheel'); if(w) w.style.display='none';
  var ms=$('mood-screen'); if(ms) ms.classList.remove('ci-wheel');
}
/* La boussole reste réservée aux abonnés (encart « Boussole, défis, jalons et objectifs.
   Réservé aux abonnés » de l'onglet Parcours) : en gratuit, le point du jour s'arrête à
   l'humeur, comme avant. */
function wheelIncluded(){ return state.tier!=='free'; }
(function(){
  var base=validateMood;
  if(typeof base!=='function') return;
  window.validateMood=function(){
    var r=base.apply(this, arguments);
    try{ if(wheelIncluded()) ciShowWheelStep(); }catch(e){}
    return r;
  };
})();
(function(){
  var base=openMoodScreen;
  if(typeof base!=='function') return;
  window.openMoodScreen=function(){
    try{ ciLeaveWheelStep(); var w=$('ms-wrap'); if(w) w.style.display=''; }catch(e){}
    return base.apply(this, arguments);
  };
})();

/* ─────────── 3. « Ton suivi » en deux onglets ─────────── */
var _svTab='humeur';
function svSetTab(tab){
  _svTab=tab;
  var card=document.querySelector('#suivi .sv-card'); if(!card) return;
  card.setAttribute('data-tab', tab);
  var tabs=card.querySelectorAll('.sv-tab');
  for(var i=0;i<tabs.length;i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-t')===tab);
}
function svMoodPanelHTML(){
  var days=[], now=new Date();
  for(var i=6;i>=0;i--){ var d=new Date(now); d.setDate(now.getDate()-i); days.push(todayKey(d)); }
  var count=0, freq={};
  var row=days.map(function(dk){
    var e=moodOfDay(dk), m=e?moodByK(e.k):null, today=dk===todayKey();
    if(m){ count++; freq[m.k]=(freq[m.k]||0)+1; }
    return '<div class="sv-day'+(today?' today':'')+'">'
      +(m ? '<span class="sv-face" style="background:'+m.c+'22">'+m.e+'</span>' : '<span class="sv-face empty"></span>')
      +'<span class="sv-dl">'+dayLabel(dk)+'</span></div>';
  }).join('');
  /* « le plus fréquent » seulement s'il y a une vraie majorité : au moins deux fois, et seul en tête */
  var ks=Object.keys(freq).sort(function(a,b){ return freq[b]-freq[a]; });
  var top=(ks.length && freq[ks[0]]>=2 && (ks.length===1 || freq[ks[0]]>freq[ks[1]])) ? ks[0] : null;
  var sum = count
    ? count+' jour'+(count>1?'s':'')+' noté'+(count>1?'s':'')+' sur 7'+(top?' · le plus fréquent : '+moodByK(top).e:'')
    : 'Aucune humeur notée cette semaine.';
  return '<div class="sv-week">'+row+'</div><div class="sv-sum">'+sum+'</div>'
    +'<button class="cap-edit sv-act" onclick="openMoodScreen(true)">'+(todayMood()?'Changer mon humeur du jour':'Noter mon humeur')+'</button>';
}
function svWheelPanelHTML(){
  /* Demande du 29/09 : la comparaison se fait à la moyenne des 30 derniers jours (forme teintée
     en fond), plus au relevé d'il y a une semaine. Écart sous 0,5 : « = », dans l'habitude. */
  var now=wheelSnapshot(), avgE=wheelAverage(), avg=avgE?avgE.v:null;
  var rows=WHEEL.map(function(a){
    var d = avg ? Math.round((now[a.k]-avg[a.k])*10)/10 : 0;
    var chip = !avg ? '' : (d>=0.5 ? '<span class="sv-delta up">+'+wheelFmt(d)+'</span>' : (d<=-0.5 ? '<span class="sv-delta down">'+wheelFmt(d).replace('-','−')+'</span>' : '<span class="sv-delta eq">=</span>'));
    return '<div class="sv-axe"><span class="sv-ad" style="background:'+a.color+'"></span><span class="sv-an">'+wLabel(a)+'</span><span class="sv-av">'+now[a.k]+'</span>'+chip+'</div>';
  }).join('');
  var foot = avgE
    ? '<div class="sv-legend"><span class="sv-lg now"></span>Aujourd’hui <span class="sv-lg avg"></span>Ta moyenne</div>'
      +'<div class="sv-avg-note">Moyenne de '+avgE.n+' relevé'+(avgE.n>1?'s':'')+' sur les '+WHEEL_AVG_DAYS+' derniers jours</div>'
    : '<div class="sv-sum">Ta moyenne apparaît en fond dès ton deuxième relevé.</div>';
  return '<div class="sv-wheel"><div class="sv-radar-box">'+svRadarSVG(now, null, 190, avg)+'</div><div class="sv-axes">'+rows+'</div></div>'+foot
    +'<button class="cap-edit sv-act" onclick="openWheelSheet()">Ajuster ma boussole</button>';
}
function renderSuivi(){
  var box=$('suivi'); if(!box) return;
  if(!wheelIncluded()){
    box.innerHTML='<div class="sv-card" data-tab="humeur"><div class="sv-panel sv-p-humeur">'+svMoodPanelHTML()+'</div></div>';
    return;
  }
  box.innerHTML='<div class="sv-card" data-tab="'+_svTab+'">'
    +'<div class="sv-tabs"><button class="sv-tab'+(_svTab==='humeur'?' on':'')+'" data-t="humeur" onclick="svSetTab(\'humeur\')">Humeur</button>'
    +'<button class="sv-tab'+(_svTab==='boussole'?' on':'')+'" data-t="boussole" onclick="svSetTab(\'boussole\')">Boussole</button></div>'
    +'<div class="sv-panel sv-p-humeur">'+svMoodPanelHTML()+'</div>'
    +'<div class="sv-panel sv-p-boussole">'+svWheelPanelHTML()+'</div>'
    +'</div>';
}
/* Retire la section « Ta boussole » du milieu de l'onglet (doublon avec l'onglet Boussole
   de « Ton suivi ») et le lien « Noter mon humeur » du titre (le bouton est dans la carte). */
(function(){
  var base=renderObjectives;
  if(typeof base!=='function') return;
  window.renderObjectives=function(){
    var r=base.apply(this, arguments);
    try{
      var pad=$('obj-pad'); if(!pad) return r;
      var heads=pad.querySelectorAll('.section-head h2');
      for(var i=0;i<heads.length;i++){
        var tx=heads[i].textContent.trim(), head=heads[i].parentNode;
        if(tx===t('wheelTitle')){
          var next=head.nextElementSibling;
          if(next && next.classList.contains('wheel-card')) next.parentNode.removeChild(next);
          head.parentNode.removeChild(head);
        } else if(tx==='Ton suivi'){
          var link=head.querySelector('.link'); if(link) link.parentNode.removeChild(link);
        }
      }
    }catch(e){}
    return r;
  };
})();
/* Après la feuille « Ajuster ma boussole », le suivi se met à jour. */
(function(){
  var base=objSheetDone;
  if(typeof base!=='function') return;
  window.objSheetDone=function(){ var r=base.apply(this, arguments); try{ renderSuivi(); }catch(e){} return r; };
})();
