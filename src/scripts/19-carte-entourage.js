/* ══════════════════════════════════════════════════════════════════════════
   LA CARTE DE L'ENTOURAGE — un monde en 900×900, MIA au centre, deux anneaux
   d'accompagnants autour, pincement/déplacement/molette au doigt comme à la
   souris. Rien ici n'appelle l'intelligence artificielle.

   État « réveillé/endormi » : ce chantier n'existait pas avant ce fichier.
   Choix fait ici (aucun dossier séparé ne l'avait posé) : un accompagnant se
   réveille la première fois qu'une vraie conversation démarre avec lui —
   startWithAgent() et addParticipant() sont enveloppés plus bas pour ça,
   donc toute porte d'entrée existante (studio, tiroir, fiche de présentation,
   sortie d'un jeu) réveille déjà correctement. Le bouton « réveil » de la
   fiche d'un accompagnant endormi (fichier tardif) appelle wakeAgent() en
   plus, puisqu'il ouvre lui aussi une conversation. state.awakeAgents n'est
   pas dans defaultState (même logique que state.gameRuns) : absent tant que
   personne ne s'est réveillé. MIA ne dort jamais, elle n'y figure pas.
   ══════════════════════════════════════════════════════════════════════════ */

function agentAwake(id){ return id==='mia' || (state.awakeAgents||[]).indexOf(id)>=0; }
function wakeAgent(id){
  if(!id || id==='mia' || !byId(id)) return;
  state.awakeAgents = state.awakeAgents || [];
  if(state.awakeAgents.indexOf(id)<0){ state.awakeAgents.push(id); persist(); }
}
function entAwakeCount(){ return 1 + (state.awakeAgents||[]).filter(function(id){ return !!byId(id); }).length; }

(function(){
  var base=startWithAgent;
  if(typeof base!=='function') return;
  window.startWithAgent=function(id){
    /* isUnlocked() est exactement la garde utilisée par la base avant d'ouvrir la
       conversation (sinon paywall et retour immédiat) : la reprendre ici évite de
       réveiller quelqu'un qui n'a en réalité jamais eu la conversation. */
    if(typeof isUnlocked!=='function' || isUnlocked(id)) wakeAgent(id);
    return base.apply(this, arguments);
  };
})();
(function(){
  var base=addParticipant;
  if(typeof base!=='function') return;
  window.addParticipant=function(id){
    var r=base.apply(this, arguments);
    if(r) wakeAgent(id);
    return r;
  };
})();

/* Mélange une couleur vers le blanc selon une proportion (0 = inchangée, 1 = blanc).
   Utilisée pour tous les fonds teintés du chantier « écrans du parcours ». */
function lave(hex, part){
  hex=String(hex||'').replace('#','');
  if(hex.length===3) hex=hex.split('').map(function(c){ return c+c; }).join('');
  var num=parseInt(hex,16)||0;
  var r=(num>>16)&255, g=(num>>8)&255, b=num&255;
  r=Math.round(r+(255-r)*part); g=Math.round(g+(255-g)*part); b=Math.round(b+(255-b)*part);
  function h2(v){ return v.toString(16).padStart(2,'0'); }
  return '#'+h2(r)+h2(g)+h2(b);
}

/* ═══════════════ disposition partagée (reprise telle quelle par le récapitulatif) ═══════════════ */
var ENT_RING1=['miro','sol','felix','naoki','mateo','ava'];
var ENT_RING2=['atlas','leo','otis','kael','soren','iris','eden','vince','neo','nora'];
function entRingPos(cx,cy,r,i,n){
  var rad=(i*(360/n))*Math.PI/180;
  return {x:cx+r*Math.sin(rad), y:cy-r*Math.cos(rad)};
}
function entAllPositions(cx,cy,r1,r2){
  var pos={mia:{x:cx,y:cy}};
  ENT_RING1.forEach(function(id,i){ pos[id]=entRingPos(cx,cy,r1,i,ENT_RING1.length); });
  ENT_RING2.forEach(function(id,i){ pos[id]=entRingPos(cx,cy,r2,i,ENT_RING2.length); });
  return pos;
}
function entOrderedIds(){ return ['mia'].concat(ENT_RING1, ENT_RING2); }
function entTerrain(id){ return id==='mia' ? 'Ton co-pilote' : ((byId(id)||{}).domain||''); }
function entInitial(id){ return id==='mia' ? 'M' : (byId(id)||{name:'?'}).name[0]; }

/* Pastille + étiquette, communes à la carte interactive et au récapitulatif. Deux couches :
   .ent-slot centre le point exact de l'anneau (translate -50/-50 statique), .ent-ava anime
   l'éclosion et le flottement sans jamais toucher ce centrage. */
function entAvaHTML(id, pos, size, index, selected){
  var a=byId(id); if(!a) return '';
  var awake=agentAwake(id);
  var cls='ent-ava'+(awake?' awake':' asleep')+(id==='mia'?' ent-mia':'')+(selected?' sel':'');
  var slotStyle='left:'+pos.x+'px;top:'+pos.y+'px;width:'+size+'px;height:'+size+'px;--stagger:'+(index*45)+'ms';
  return '<div class="ent-slot" style="'+slotStyle+'">'
    +'<button type="button" class="'+cls+'" data-id="'+id+'" style="--ac:'+a.color+'" onclick="entTap(\''+id+'\')">'
    +'<span class="ent-ava-init">'+entInitial(id)+'</span>'
    +'<span class="ent-ava-name">'+escapeHtml(a.id==='mia'?'MIA':a.name)+'</span>'
    +'</button></div>';
}
function entLinksHTML(pos){
  var mia=pos.mia;
  return entOrderedIds().filter(function(id){ return id!=='mia'; }).map(function(id,i){
    var p=pos[id], awake=agentAwake(id);
    var stroke=awake ? (byId(id).color) : '#E7DAFF';
    return '<line class="ent-link'+(awake?' awake':'')+'" style="--stagger:'+(i*45)+'ms" '
      +'x1="'+mia.x+'" y1="'+mia.y+'" x2="'+p.x+'" y2="'+p.y+'" stroke="'+stroke+'"/>';
  }).join('');
}

/* ═══════════════ carte interactive ═══════════════ */
var _ent={tx:0, ty:0, scale:1.75};
var _entPointers={};
var _entPointerCount=0;
var _entPan=null, _entPinch=null;
var _entSelected='mia';

function entClampScale(s){ return Math.max(0.62, Math.min(2.6, s)); }
function entClampPan(){
  var card=$('ent-card'); if(!card) return;
  var rect=card.getBoundingClientRect();
  var side=900*_ent.scale;
  if(side>rect.width) _ent.tx=Math.max(rect.width-side, Math.min(0,_ent.tx));
  else _ent.tx=(rect.width-side)/2;
  if(side>rect.height) _ent.ty=Math.max(rect.height-side, Math.min(0,_ent.ty));
  else _ent.ty=(rect.height-side)/2;
}
function entApplyTransform(){
  var w=$('ent-world'); if(!w) return;
  w.style.transform='translate3d('+_ent.tx+'px,'+_ent.ty+'px,0) scale('+_ent.scale+')';
}
function entWorldTransition(on){
  var w=$('ent-world'); if(!w) return;
  w.style.transition = on ? 'transform .42s cubic-bezier(.22,1,.36,1)' : 'none';
}
function entScreenToWorld(localX, localY){
  return {x:(localX-_ent.tx)/_ent.scale, y:(localY-_ent.ty)/_ent.scale};
}
function entZoomAt(localX, localY, targetScale){
  var newScale=entClampScale(targetScale);
  var wp=entScreenToWorld(localX, localY);
  _ent.scale=newScale;
  _ent.tx=localX-wp.x*newScale;
  _ent.ty=localY-wp.y*newScale;
  entClampPan(); entApplyTransform();
}

function entRender(){
  var pos=entAllPositions(450,450,170,320);
  var ids=entOrderedIds();
  $('ent-links').setAttribute('viewBox','0 0 900 900');
  $('ent-links').innerHTML=entLinksHTML(pos);
  $('ent-agents').innerHTML=ids.map(function(id,i){
    return entAvaHTML(id, pos[id], id==='mia'?92:70, i, id===_entSelected);
  }).join('');
  entRenderFiche();
  $('ent-sub').textContent=entAwakeCount()+' accompagnant'+(entAwakeCount()>1?'s':'')+' réveillé'+(entAwakeCount()>1?'s':'')+' sur 17';
}
function entRenderFiche(){
  var a=byId(_entSelected); if(!a) return;
  var awake=agentAwake(_entSelected);
  var box=$('ent-fiche'); if(!box) return;
  var avaStyle = awake ? ('background:'+a.color+';color:#fff') : ('background:#F3ECFF;color:#A79CBC;border:2px solid #E7DAFF');
  var actions = awake
    ? '<button class="btn full" onclick="entParler()">Parler à '+escapeHtml(a.id==='mia'?'MIA':a.name)+'</button>'
      +'<button class="btn ghost full" onclick="entSaFiche()">Sa fiche</button>'
    : '<button class="btn full" onclick="entTap(\''+_entSelected+'\')">Le réveiller</button>'
      +'<button class="btn ghost full" onclick="entSaFiche()">Sa fiche</button>';
  box.innerHTML='<div class="ent-fiche-inner">'
    +'<span class="ent-fiche-ava" style="'+avaStyle+'">'+entInitial(_entSelected)+'</span>'
    +'<span class="ent-fiche-tx"><b>'+escapeHtml(a.id==='mia'?'MIA':a.name)+'</b><span>'+escapeHtml(awake?entTerrain(_entSelected):'Il dort')+'</span></span>'
    +'<div class="ent-fiche-actions">'+actions+'</div>'
    +'</div>';
}
function entSaFiche(){ closeEntourage(); openAgentDeck(_entSelected); }
function entParler(){ closeEntourage(); startWithAgent(_entSelected); }
function entTap(id){
  if(id!=='mia' && !agentAwake(id) && typeof openSleepFiche==='function'){ openSleepFiche(id); return; }
  _entSelected=id;
  var cards=document.querySelectorAll('#ent-agents .ent-ava');
  for(var i=0;i<cards.length;i++) cards[i].classList.toggle('sel', cards[i].getAttribute('data-id')===id);
  entRenderFiche();
}

function openEntourage(){
  var el=$('entourage'); if(!el) return;
  _entSelected='mia';
  el.classList.add('show');
  entRender();
  entWorldTransition(false);
  entRecenter(true);
  entBindGestures();
}
function closeEntourage(){ var el=$('entourage'); if(el) el.classList.remove('show'); }
function entRecenter(noTransition){
  var card=$('ent-card'); if(!card) return;
  if(!noTransition) entWorldTransition(true);
  var rect=card.getBoundingClientRect();
  _ent.scale=1.75;
  _ent.tx=rect.width/2-450*_ent.scale;
  _ent.ty=rect.height/2-450*_ent.scale;
  entClampPan(); entApplyTransform();
  if(!noTransition) setTimeout(function(){ entWorldTransition(false); },420);
}
function entZoomBtn(dir){
  var card=$('ent-card'); if(!card) return;
  var rect=card.getBoundingClientRect();
  entWorldTransition(true);
  entZoomAt(rect.width/2, rect.height/2, _ent.scale*(dir>0?1.35:1/1.35));
  setTimeout(function(){ entWorldTransition(false); },420);
}

var _entGesturesBound=false;
function entBindGestures(){
  if(_entGesturesBound) return; _entGesturesBound=true;
  var card=$('ent-card'); if(!card) return;
  card.addEventListener('pointerdown', entPointerDown);
  card.addEventListener('pointermove', entPointerMove);
  card.addEventListener('pointerup', entPointerUp);
  card.addEventListener('pointercancel', entPointerUp);
  card.addEventListener('pointerleave', entPointerUp);
  card.addEventListener('wheel', entWheel, {passive:false});
  window.addEventListener('resize', function(){ if($('entourage') && $('entourage').classList.contains('show')){ entClampPan(); entApplyTransform(); } });
}
function entLocalXY(card, e){ var r=card.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
function entPointerDown(e){
  var card=$('ent-card'); if(!card) return;
  try{ card.setPointerCapture(e.pointerId); }catch(err){}
  _entPointers[e.pointerId]={x:e.clientX,y:e.clientY};
  _entPointerCount=Object.keys(_entPointers).length;
  if(_entPointerCount===1){
    _entPan={x:e.clientX,y:e.clientY,tx:_ent.tx,ty:_ent.ty};
    _entPinch=null;
  } else if(_entPointerCount===2){
    _entPan=null;
    var pts=Object.keys(_entPointers).map(function(k){ return _entPointers[k]; });
    var dx=pts[0].x-pts[1].x, dy=pts[0].y-pts[1].y;
    var dist=Math.sqrt(dx*dx+dy*dy);
    var midX=(pts[0].x+pts[1].x)/2, midY=(pts[0].y+pts[1].y)/2;
    var local=entLocalXY(card, {clientX:midX, clientY:midY});
    _entPinch={startDist:dist||1, startScale:_ent.scale, anchor:entScreenToWorld(local.x, local.y)};
  }
}
function entPointerMove(e){
  if(!_entPointers[e.pointerId]) return;
  _entPointers[e.pointerId]={x:e.clientX,y:e.clientY};
  var card=$('ent-card'); if(!card) return;
  var pts=Object.keys(_entPointers).map(function(k){ return _entPointers[k]; });
  if(pts.length===2 && _entPinch){
    var dx=pts[0].x-pts[1].x, dy=pts[0].y-pts[1].y;
    var dist=Math.sqrt(dx*dx+dy*dy);
    var midX=(pts[0].x+pts[1].x)/2, midY=(pts[0].y+pts[1].y)/2;
    var local=entLocalXY(card, {clientX:midX, clientY:midY});
    var newScale=entClampScale(_entPinch.startScale*(dist/_entPinch.startDist));
    _ent.scale=newScale;
    _ent.tx=local.x-_entPinch.anchor.x*newScale;
    _ent.ty=local.y-_entPinch.anchor.y*newScale;
    entClampPan(); entApplyTransform();
  } else if(pts.length===1 && _entPan){
    _ent.tx=_entPan.tx+(pts[0].x-_entPan.x);
    _ent.ty=_entPan.ty+(pts[0].y-_entPan.y);
    entClampPan(); entApplyTransform();
  }
}
function entPointerUp(e){
  delete _entPointers[e.pointerId];
  var pts=Object.keys(_entPointers).map(function(k){ return _entPointers[k]; });
  if(pts.length===1){ _entPan={x:pts[0].x,y:pts[0].y,tx:_ent.tx,ty:_ent.ty}; _entPinch=null; }
  else { _entPan=null; _entPinch=null; }
}
function entWheel(e){
  var card=$('ent-card'); if(!card) return;
  e.preventDefault();
  var local=entLocalXY(card, e);
  if(e.ctrlKey || e.metaKey){
    entZoomAt(local.x, local.y, _ent.scale*Math.exp(-e.deltaY*0.01));
  } else {
    _ent.tx-=e.deltaX; _ent.ty-=e.deltaY;
    entClampPan(); entApplyTransform();
  }
}

/* Point d'entrée dans le tiroir, juste après « Présenter les accompagnants ». */
(function(){
  var base=renderAgentList;
  if(typeof base!=='function') return;
  window.renderAgentList=function(mode){
    var r=base.apply(this, arguments);
    if(mode==='browse'){
      var btn='<button class="deck-btn" onclick="openEntourage()">'
        +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="1.6"/><circle cx="19" cy="8" r="1.6"/><circle cx="19" cy="16" r="1.6"/><circle cx="12" cy="20" r="1.6"/><circle cx="5" cy="16" r="1.6"/><circle cx="5" cy="8" r="1.6"/></svg>'
        +'<span>Ton entourage</span>'
        +'<svg class="dk-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
      var idx=r.indexOf('</button>');
      if(idx>=0) r=r.slice(0, idx+9)+btn+r.slice(idx+9);
    }
    return r;
  };
})();
