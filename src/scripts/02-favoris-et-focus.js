/* ══════════ FAVORIS (étoile) ══════════ */
function isFav(id){ return (state.favorites||[]).indexOf(id)>=0; }
function starSVG(f){ return f
  ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 5 2-7L2 9h7z"/></svg>'
  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 5 2-7L2 9h7z"/></svg>'; }
function toggleFav(id, ev){
  if(ev){ ev.stopPropagation(); }
  if(id==='mia') return;
  if(!Array.isArray(state.favorites)) state.favorites=[];
  const i=state.favorites.indexOf(id);
  if(i>=0){ state.favorites.splice(i,1); if(state.focus&&state.focus.agent===id){ state.focus=state.favorites.length?{agent:state.favorites[0]}:null; } }
  else { state.favorites.push(id); }
  persist();
  try{ renderStrip(); }catch(e){}
  if(isOpen('drawer')) renderDrawer();
  if(activeScreen()==='tab-objectifs') renderObjectives();
}
/* ══════════ bande de favoris (accueil) ══════════ */
function renderStrip(){
  const box=$('agent-strip'); if(!box) return;
  const favs=(state.favorites||[]).filter(id=>byId(id));
  if(!favs.length){ box.innerHTML='<div class="strip-empty">Ajoute des accompagnants en favori avec l\u2019étoile pour les retrouver ici.</div>'; return; }
  box.innerHTML=favs.map(id=>{ const a=byId(id); const foc=state.focus&&state.focus.agent===id;
    return '<button class="chip-agent'+(foc?' focus':'')+'"'+(foc?' style="--wk:'+a.color+'"':'')+' onclick="startWithAgent(\''+id+'\')">'
      +'<span class="chip-fav on" onclick="toggleFav(\''+id+'\',event)">'+starSVG(true)+'</span>'
      +(id==='mia'?'<span class="chip-ava mia">'+brainSVG()+'</span>':'<span class="chip-ava" style="background:'+a.color+'">'+a.name[0]+'</span>')
      +'<span class="nm">'+a.name+'</span><span class="dm">'+(foc?'cette semaine':a.domain.split(' & ')[0])+'</span></button>'; }).join('');
}
/* ══════════ tiroir : favoris en haut + étoile sur chaque agent ══════════ */
function agentRowHTML(id){
  const a=byId(id); const lock=!isUnlocked(id); const fav=isFav(id); const foc=state.focus&&state.focus.agent===id;
  return '<div class="agent-row'+(foc?' focus':'')+'"'+(foc?' style="--wk:'+a.color+'"':'')+'>'
    +'<button class="agent-open" onclick="startWithAgent(\''+id+'\')">'
    +(id==='mia'?'<span class="conv-ava mia">'+brainSVG()+'</span>':'<span class="conv-ava" style="background:'+a.color+'">'+a.name[0]+'</span>')
    +'<span class="conv-txt"><span class="ct">'+a.name+(lock?' · MAYND+':'')+(foc?' · cette semaine':'')+'</span><span class="cp">'+a.domain+'</span></span></button>'
    +(id==='mia'?'':'<button class="fav-btn'+(fav?' on':'')+'" onclick="toggleFav(\''+id+'\',event)" aria-label="Favori">'+starSVG(fav)+'</button>')
    +'</div>';
}
function renderDrawer(){
  const body=$('drawer-body');
  let h='<button class="new-btn" onclick="newConversation()"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span><span class="nl">'+t('newConversation')+'</span></button>';
  const ths=[...state.threads].sort((a,b)=>b.updated-a.updated);
  h+='<div class="drawer-sec">'+t('conversations')+'</div>';
  if(!ths.length){ h+='<div class="obj-empty">'+t('noConv')+'</div>'; }
  ths.forEach(th=>{ const title=th.parts.map(p=>byId(p).name).join(' & '); const prev=convPreview(th);
    h+='<button class="conv-item'+(th.id===state.current?' on':'')+'" onclick="openThread(\''+th.id+'\')">'+convAvaHTML(th)
      +'<span class="conv-txt"><span class="ct">'+title+'</span><span class="cp">'+escapeHtml(prev.slice(0,54))+'</span></span>'
      +'<span class="conv-del" onclick="deleteThread(\''+th.id+'\',event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></span></button>'; });
  const favs=(state.favorites||[]).filter(id=>byId(id));
  if(favs.length){ h+='<div class="drawer-sec">Tes accompagnants</div>'; h+=favs.map(id=>agentRowHTML(id)).join(''); }
  h+='<div class="drawer-sec">Tous les accompagnants</div>';
  h+=ALL.map(a=>agentRowHTML(a.id)).join('');
  body.innerHTML=h;
}
/* ══════════ focus : choisi parmi les favoris ══════════ */
function openFocusSheet(){
  $('obj-sheet-title').textContent='Objectif de la semaine';
  const favs=(state.favorites||[]).filter(id=>byId(id));
  let b;
  if(!favs.length){ b='<div class="obj-empty">Ajoute d\u2019abord des accompagnants en favori (avec l\u2019étoile). Ton objectif de la semaine se choisit parmi eux.</div>'; }
  else { b=favs.map(id=>{ const a=byId(id); const sel=state.focus&&state.focus.agent===id; return '<button class="focus-pick'+(sel?' sel':'')+'" onclick="setFocus(\''+id+'\')">'+miniAva(id,'fp-a')+'<span><span class="fp-n">'+a.name+'</span><span class="fp-d">'+(a.id==='mia'?t('miaStatus'):a.domain)+'</span></span></button>'; }).join(''); }
  $('obj-sheet-body').innerHTML=b;
  openSheet('obj-backdrop','obj-sheet');
}
