/* ══════════ participants (chat) : favoris en haut ══════════ */
function partRowHTML(id, parts){
  const a=byId(id); const on=parts.includes(id); const lock=!isUnlocked(id);
  return '<button class="part-row" onclick="togglePart(\''+id+'\')">'
    +(id==='mia'?'<span class="pa mia">'+brainSVG()+'</span>':'<span class="pa" style="background:'+a.color+'">'+a.name[0]+'</span>')
    +'<span class="ptx"><span class="pn">'+a.name+'</span><span class="pd">'+(id==='mia'?t('miaStatus'):a.domain)+'</span></span>'
    +(lock&&!on?'<span class="lockmini">MAYND+</span>':'<span class="tgl'+(on?' on':'')+'"><span class="knob"></span></span>')
    +'</button>';
}
function renderParts(){
  const parts=threadParts();
  $('parts-sub').textContent=t('partsSub');
  let h='<div class="part-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><span>'+t('partsNote')+'</span></div>';
  const favs=(state.favorites||[]).filter(id=>byId(id));
  if(favs.length){
    h+='<div class="parts-sec">Tes accompagnants</div>';
    h+=favs.map(id=>partRowHTML(id, parts)).join('');
    h+='<div class="parts-sec">Tous les accompagnants</div>';
    h+=ALL.filter(a=>favs.indexOf(a.id)<0).map(a=>partRowHTML(a.id, parts)).join('');
  } else {
    h+=ALL.map(a=>partRowHTML(a.id, parts)).join('');
  }
  $('parts-body').innerHTML=h;
}



/* ══════════════════ COMPOSANT AGENTS UNIFIÉ ══════════════════ */
var PLUS_IDS=['soren','iris','eden','vince','neo'];
function agentRowHTML(id, mode){
  var a=byId(id); var plus=!!a.plus; var fav=isFav(id); var lock=!isUnlocked(id);
  var inConv = mode==='chat' && typeof threadParts==='function' && threadParts().indexOf(id)>=0;
  var ava = id==='mia' ? '<span class="agx-ava mia">'+brainSVG()+'</span>' : '<span class="agx-ava" style="background:'+a.color+'">'+a.name[0]+'</span>';
  var badge = plus ? '<span class="agx-badge">MAYND+</span>' : '';
  var star = id==='mia' ? '' : '<button class="agx-star'+(fav?' on':'')+'" onclick="toggleFav(\''+id+'\',event)" aria-label="Favori">'+starSVG(fav)+'</button>';
  var right='';
  if(mode==='chat'){
    if(id==='mia'){ right='<span class="agx-lock" style="color:var(--mist);background:var(--paper-2)">Toujours là</span>'; }
    else if(lock && !inConv){ right='<span class="agx-lock">MAYND+</span>'; }
    else { right='<span class="agx-tgl'+(inConv?' on':'')+'" onclick="togglePartRow(\''+id+'\',event)"><span class="agx-knob"></span></span>'; }
  }
  var rowClick = mode==='chat' ? ' onclick="togglePartRow(\''+id+'\',event)"' : ' onclick="startWithAgent(\''+id+'\')"';
  return '<div class="agx-row'+(plus?' plus':'')+'">'
    +'<button class="agx-open"'+rowClick+'>'+ava
    +'<span class="agx-tx"><span class="agx-nm">'+a.name+badge+'</span><span class="agx-dm">'+(id==='mia'?t('miaStatus'):a.domain)+'</span></span></button>'
    +star+right+'</div>';
}
function togglePartRow(id, ev){ if(ev) ev.stopPropagation(); if(id==='mia') return; togglePart(id); renderParts(); }
function renderAgentList(mode){
  var favs=(state.favorites||[]).filter(function(id){return byId(id);});
  var base=ALL.filter(function(a){return a.id!=='mia' && !a.plus;}).map(function(a){return a.id;});
  var plusA=ALL.filter(function(a){return !!a.plus;}).map(function(a){return a.id;});
  var h='';
  if(favs.length){ h+='<div class="agx-sec">Tes accompagnants</div>'+favs.map(function(id){return agentRowHTML(id,mode);}).join(''); }
  var baseShown=['mia'].concat(base).filter(function(id){return favs.indexOf(id)<0;});
  h+='<div class="agx-sec">Tous les accompagnants</div>'+baseShown.map(function(id){return agentRowHTML(id,mode);}).join('');
  var plusShown=plusA.filter(function(id){return favs.indexOf(id)<0;});
  if(plusShown.length){ h+='<div class="agx-sec plus">Exclusifs MAYND+</div>'+plusShown.map(function(id){return agentRowHTML(id,mode);}).join(''); }
  return h;
}
/* accueil : favoris en rangées unifiées + tout voir */
function renderStrip(){
  var box=$('agent-strip'); if(!box) return;
  var favs=(state.favorites||[]).filter(function(id){return byId(id);});
  if(!favs.length){ box.innerHTML='<div class="strip-empty">Ajoute des accompagnants en favori avec l\u2019étoile.</div><button class="agx-all" onclick="openDrawer()">Voir les accompagnants</button>'; return; }
  box.innerHTML=favs.map(function(id){return agentRowHTML(id,'browse');}).join('')+'<button class="agx-all" onclick="openDrawer()">Tout voir</button>';
}
/* tiroir : conversations + liste unifiée */
function renderDrawer(){
  var body=$('drawer-body');
  var h='<button class="new-btn" onclick="newConversation()"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span><span class="nl">'+t('newConversation')+'</span></button>';
  var ths=[].concat(state.threads).sort(function(a,b){return b.updated-a.updated;});
  h+='<div class="agx-sec">'+t('conversations')+'</div>';
  if(!ths.length){ h+='<div class="obj-empty">'+t('noConv')+'</div>'; }
  ths.forEach(function(th){ var title=th.parts.map(function(p){return byId(p).name;}).join(' & '); var prev=convPreview(th);
    h+='<button class="conv-item'+(th.id===state.current?' on':'')+'" onclick="openThread(\''+th.id+'\')">'+convAvaHTML(th)
      +'<span class="conv-txt"><span class="ct">'+title+'</span><span class="cp">'+escapeHtml(prev.slice(0,54))+'</span></span>'
      +'<span class="conv-del" onclick="deleteThread(\''+th.id+'\',event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></span></button>'; });
  h+=renderAgentList('browse');
  body.innerHTML=h;
}
/* chat : panneau participants avec liste unifiée */
function renderParts(){
  var parts=threadParts();
  $('parts-sub').textContent=t('partsSub');
  var h='<div class="part-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><span>'+t('partsNote')+'</span></div>';
  h+=renderAgentList('chat');
  $('parts-body').innerHTML=h;
}
