/* ══════════════════════════════════════════════════════════════════════════
   REFONTE DES DEUX ÉCRANS D'UN JEU — écran de réflexion (bloc qui monte,
   trente secondes, rien de cliquable) puis écran des réponses (fond teinté).

   gameRenderQuestion est redéfinie en entier (dernière définition, ce fichier
   étant plus tardif que 18-moteur-des-jeux.js) : c'est le gabarit visuel qui
   change du tout au tout, mais #game-opts garde exactement le même id et la
   même mécanique display:none → '' qu'avant ce chantier, pour ne rien casser
   de tests/30-moteur-des-jeux.mjs qui vérifie cet id directement. gameOrder,
   gameQuestionDef, gameOptionsHTML, gamePick, gameAdvance, gameAbandon,
   gameRenderRestitution et gameRenderSortie restent ceux de 18 : seules les
   DEUX écrans visés par ce chantier changent, pas la restitution ni la sortie.

   gameShowOptions n'est pas redéfinie, seulement enveloppée : la bascule
   réflexion → réponses reste synchrone (aucun délai ajouté), pour ne pas
   décaler les tests qui cliquent puis n'attendent que 10 ms.
   ══════════════════════════════════════════════════════════════════════════ */

function gameClockSVG(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>';
}
/* Une vague sans couture : 640 de large (deux fois la largeur affichée), période qui divise 320,
   pour qu'un défilement de -50 % retombe exactement sur le même dessin. */
function gameWaveHTML(cls, period, amp){
  var base=amp+2, h=base+amp+30, d='M0 '+base+' Q '+(period/4)+' '+(base-amp)+' '+(period/2)+' '+base;
  for(var x=period; x<=640; x+=period/2) d+=' T '+x+' '+base;
  d+=' L 640 '+h+' L 0 '+h+' Z';
  return '<div class="gw '+cls+'"><svg viewBox="0 0 640 '+h+'" preserveAspectRatio="none"><path d="'+d+'"/></svg></div>';
}
function gameRenderQuestion(step){
  clearTimeout(_gameRevealTimer);
  var g=GAMES[_game.theme];
  var a=byId(g.agent);
  var q=gameQuestionDef(step);
  var qKeys=gameOrder().filter(function(s){ return s!=='restitution' && s!=='sortie'; });
  var qIdx=qKeys.indexOf(step);
  var dots=qKeys.map(function(k,i){ return '<span class="game-dot'+(i===qIdx?' on':'')+'"></span>'; }).join('');
  /* 30/09/2026 : mer plus agitée. Trois couches de vagues (défilement sans couture, vitesses et
     sens différents, houle verticale décalée) et des bulles de tailles variées qui remontent en
     ondulant, découpées par la surface. */
  var bubbles='';
  for(var bi=0; bi<14; bi++){
    var sz=(4+((bi*7)%9)).toFixed(0), left=((bi*37)%92+4), dur=(3.6+((bi*13)%40)/10).toFixed(1), del=(-((bi*1.7)%6)).toFixed(1);
    bubbles+='<span class="gbub" style="left:'+left+'%;width:'+sz+'px;height:'+sz+'px;animation-duration:'+dur+'s,'+(dur/3).toFixed(1)+'s;animation-delay:'+del+'s,'+del+'s"></span>';
  }
  var pearls='<div class="gbubs">'+bubbles+'</div>';
  var optsHtml=gameOptionsHTML(step,q).replace('<div class="game-opts-dropout">', '<div class="game-opts-dropout" style="border-top-color:'+lave(a.color,.5)+'">');
  var h='<div class="game-top"><span class="game-tag" style="color:'+a.color+'">'+escapeHtml(a.name)+'</span>'
    +'<button class="game-exit" onclick="gameAbandon()">Sortir</button></div>'
    +'<div class="game-qn">Question '+gameQuestionNumber(step)+'</div>'
    +'<div class="game-q">'+escapeHtml(q.title)+'</div>'
    +'<div class="game-reflect"><span class="game-clock" style="color:'+a.color+'">'+gameClockSVG()+'</span><span class="game-reflect-note">Réponses dans '+Math.round((g.reflectionMs||0)/1000)+' secondes</span></div>'
    +'<div class="game-fill-wrap" id="game-fill-wrap">'
      +gameWaveHTML('gw1', 320, 20)+gameWaveHTML('gw2', 160, 14)+gameWaveHTML('gw3', 80, 9)
      +pearls
    +'</div>'
    +'<div class="game-opts" id="game-opts" style="display:none">'+optsHtml+'</div>'
    +'<div class="game-dots">'+dots+'</div>';
  var inner=$('game-inner');
  inner.innerHTML=h;
  inner.classList.remove('revealed');
  inner.style.setProperty('--ac', a.color);
  inner.style.setProperty('--ac-91', lave(a.color,.91));
  inner.style.setProperty('--ac-74', lave(a.color,.74));
  inner.style.setProperty('--ac-94', lave(a.color,.94));
  inner.style.setProperty('--ac-78', lave(a.color,.78));
  var ms=g.reflectionMs;
  if(!ms){ gameShowOptions(); return; }
  var fill=$('game-fill-wrap');
  /* Montée linéaire jusqu'à 100 % pile, sur exactement la durée de réflexion : l'écran est
     plein à l'instant où les réponses apparaissent, jamais avant (29/09/2026 — avant : courbe
     ease-in-out jusqu'à 104 %, l'écran restait plein près d'une seconde). */
  requestAnimationFrame(function(){
    if(!fill) return;
    fill.style.transition='height '+(ms/1000)+'s linear';
    fill.style.height='100%';
  });
  _gameRevealTimer=setTimeout(gameShowOptions, ms);
}
(function(){
  var base=gameShowOptions;
  if(typeof base!=='function') return;
  window.gameShowOptions=function(){
    base.apply(this, arguments);
    var inner=$('game-inner');
    if(inner) inner.classList.add('revealed');
  };
})();
/* La teinte de fond ne concerne que les deux écrans de ce chantier : on l'enlève en
   quittant vers la restitution ou la sortie, pour ne pas la laisser traîner dessus. */
(function(){
  var baseR=gameRenderRestitution, baseS=gameRenderSortie;
  if(typeof baseR==='function'){
    window.gameRenderRestitution=function(){
      var r=baseR.apply(this, arguments);
      var inner=$('game-inner'); if(inner) inner.classList.remove('revealed');
      return r;
    };
  }
  if(typeof baseS==='function'){
    window.gameRenderSortie=function(){
      var r=baseS.apply(this, arguments);
      var inner=$('game-inner'); if(inner) inner.classList.remove('revealed');
      return r;
    };
  }
})();
