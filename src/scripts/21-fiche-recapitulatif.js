/* ══════════════════════════════════════════════════════════════════════════
   FICHE D'UN ACCOMPAGNANT ENDORMI + RÉCAPITULATIF — dernier fichier du
   chantier « écrans du parcours ». Réutilise telles quelles les fonctions de
   position/rendu de 19-carte-entourage.js (entAllPositions, entAvaHTML,
   entLinksHTML, entOrderedIds, agentAwake, wakeAgent, lave, entAwakeCount).
   ══════════════════════════════════════════════════════════════════════════ */

function gameForAgent(id){
  var keys=Object.keys((typeof GAMES!=='undefined'&&GAMES)||{});
  for(var i=0;i<keys.length;i++){ if(GAMES[keys[i]].agent===id) return keys[i]; }
  return null;
}

/* ─────────── fiche d'un accompagnant endormi (sheet) ─────────── */
function openSleepFiche(id){
  if(!id || id==='mia' || !byId(id) || agentAwake(id)) return;
  renderSleepFiche(id);
  openSheet('sleep-backdrop','sleep-sheet');
}
function closeSleepFiche(){ closeSheet('sleep-backdrop','sleep-sheet'); }
function sleepWake(id){
  /* Pas de wakeAgent() ici : startWithAgent() (enveloppée dans 19-carte-entourage.js) s'en
     charge déjà, et seulement si isUnlocked(id) — sinon un compte gratuit qui tombe sur le
     paywall se retrouverait quand même avec l'accompagnant marqué réveillé pour de bon. */
  closeSleepFiche();
  if(typeof closeEntourage==='function') closeEntourage();
  startWithAgent(id);
}
function sleepPlay(id){
  var key=gameForAgent(id);
  if(!key) return;
  closeSleepFiche();
  openGame(key);
}
function renderSleepFiche(id){
  var a=byId(id); if(!a) return;
  var info=(typeof AGENT_INFO!=='undefined' && AGENT_INFO[id]) ? AGENT_INFO[id] : {tag:''};
  var key=gameForAgent(id);
  var qCount=key ? Object.keys(GAMES[key]).filter(function(k){ return /^q\d+$/.test(k); }).length : 0;
  var h='<div class="sleep-wrap">'
    +'<div class="sleep-circle-box"><span class="sleep-ripple r1"></span><span class="sleep-ripple r2"></span>'
      +'<span class="sleep-circle">'+entInitial(id)+'</span></div>'
    +'<div class="sleep-name">'+escapeHtml(a.name)+'</div>'
    +'<div class="sleep-domain">'+escapeHtml(a.domain||'')+'</div>'
    +'<span class="sleep-badge">Il dort</span>'
    +'<p class="sleep-tag">'+escapeHtml(info.tag||'')+'</p>'
    +'<div class="sleep-actions">'
      +'<button class="btn full" onclick="sleepWake(\''+id+'\')">Le réveiller</button>'
      +(key ? '<button class="btn ghost full sleep-play" style="--ac:'+a.color+';--ac-soft:'+lave(a.color,.85)+'" onclick="sleepPlay(\''+id+'\')">Jouer</button><div class="sleep-qcount">'+qCount+' question'+(qCount>1?'s':'')+'</div>' : '')
    +'</div>'
    +'</div>';
  $('sleep-body').innerHTML=h;
}

/* ─────────── récapitulatif (carte figée, portrait) ─────────── */
function openRecap(){
  var el=$('recap'); if(!el) return;
  el.classList.add('show');
  entRenderRecap();
}
function closeRecap(){ var el=$('recap'); if(el) el.classList.remove('show'); }
function entRenderRecap(){
  var pos=entAllPositions(195,430,95,168);
  var ids=entOrderedIds();
  $('recap-links').setAttribute('viewBox','0 0 390 860');
  $('recap-links').innerHTML=entLinksHTML(pos);
  $('recap-agents').innerHTML=ids.map(function(id,i){
    return entAvaHTML(id, pos[id], id==='mia'?62:50, i, false);
  }).join('');
  var total=entAwakeCount();
  var liens=Math.max(0, total-1);
  $('recap-title').textContent='Ton entourage en un coup d’œil';
  $('recap-sub').textContent=total+' accompagnant'+(total>1?'s':'')+' réveillé'+(total>1?'s':'')+', '+liens+' lien'+(liens>1?'s':'')+' tracé'+(liens>1?'s':'');
}
