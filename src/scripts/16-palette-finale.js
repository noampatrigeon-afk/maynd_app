/* ═══════════════ COULEURS DES ACCOMPAGNANTS — toute la palette, par thème ═══════════════ */
var AGENT_COLORS={
  mia:'#974AF0',     /* co-pilote            violet MAYND        */
  naoki:'#6F2FC0',   /* discipline           violet profond      */
  felix:'#FFC400',   /* confiance            jaune               */
  atlas:'#8B5CF6',   /* identité et sens     violet clair        */
  ava:'#16389E',     /* émotions et deuil    bleu profond        */
  leo:'#E5484D',     /* couple               rouge corail        */
  otis:'#00A862',    /* communication        vert                */
  kael:'#FE6601',    /* sport                orange              */
  miro:'#3B2FA8',    /* sommeil              indigo              */
  sol:'#0C96C7',     /* anxiété, respiration bleu ciel           */
  mateo:'#224CF2',   /* travail              bleu franc          */
  soren:'#E07C00',   /* parentalité          orange chaud        */
  iris:'#00A862',    /* lien social          vert                */
  eden:'#E8467F',    /* sexualité            rose                */
  vince:'#00875A',   /* argent               émeraude            */
  neo:'#6F2FC0'      /* addictions           violet profond      */
};
var LIGHT_AGENTS=['felix'];
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* la fiche de présentation passe en texte noir sur fond clair */
(function(){
  var f=window.openAgentDeck;
  if(typeof f!=='function') return;
  window.openAgentDeck=function(){
    var r=f.apply(this, arguments);
    try{
      var pages=document.querySelectorAll('#deck-track .deck-page');
      for(var i=0;i<pages.length;i++){
        pages[i].classList.toggle('light', LIGHT_AGENTS.indexOf(pages[i].getAttribute('data-id'))>=0);
      }
    }catch(e){}
    return r;
  };
  var g=window.deckSync;
  if(typeof g==='function'){
    window.deckSync=function(i){
      var r=g.apply(this, arguments);
      try{
        if(i==null) i=deckIndex();
        var d=document.getElementById('deck');
        if(d) d.classList.toggle('light', LIGHT_AGENTS.indexOf(DECK_IDS[i])>=0);
      }catch(e){}
      return r;
    };
  }
})();


if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
