/* ═══════════════ PRÉSENTATION DÉTAILLÉE DES ACCOMPAGNANTS ═══════════════ */
var AGENT_INFO={
mia:{tag:"Elle répond toujours en premier, comprend ta situation, et n'appelle un accompagnant que si ça t'apporte vraiment quelque chose.",
 does:["Comprendre ce que tu vis avant de proposer quoi que ce soit","Te répondre directement quand ta question ne demande pas de spécialiste","Faire venir le bon accompagnant au bon moment","Garder le fil de ton parcours d'une fois sur l'autre"],
 when:["Tu ne sais pas par où commencer","Ta situation touche plusieurs sujets à la fois","Tu veux simplement parler à quelqu'un"]},
naoki:{tag:"Il tient le cadre quand la motivation retombe. Direct, jamais complaisant.",
 does:["Poser un cadre simple et tenable","Démonter les excuses sans te juger","Découper un objectif flou en gestes concrets","Te tenir sur la durée, pas seulement les premiers jours"],
 when:["Tu commences puis tu abandonnes","Tu repousses toujours la même chose","Tu veux installer une habitude qui tient"]},
felix:{tag:"Il s'occupe de ce que tu te racontes quand personne n'écoute.",
 does:["Repérer les phrases dures que tu te répètes","Distinguer un fait d'une interprétation","Reconstruire une estime qui ne dépend pas des résultats","Préparer les moments où tu doutes"],
 when:["Tu es plus dur avec toi qu'avec les autres","Tu doutes avant chaque décision","Une critique te démonte"]},
atlas:{tag:"Il travaille la question du dessous : qui tu es, et vers quoi tu vas.",
 does:["Clarifier ce qui compte vraiment pour toi","Relier tes choix à tes valeurs","Nommer ce que tu cherches quand tout est flou","T'aider à trancher quand deux directions se valent"],
 when:["Tu avances sans savoir pourquoi","Tu as réussi et ça sonne creux","Tu es à un tournant"]},
ava:{tag:"Elle accueille ce qui te traverse, sans étape à suivre ni calendrier à respecter.",
 does:["Mettre des mots sur ce que tu ressens","Faire de la place à la peine sans la précipiter","Traverser une perte à ton rythme","Reconnaître une émotion avant qu'elle déborde"],
 when:["Tu as perdu quelqu'un ou quelque chose","Tu ne comprends pas ce que tu ressens","Tu gardes tout à l'intérieur"]},
leo:{tag:"Il travaille avec toi, sur ta part du lien. Jamais sur le dos de l'autre.",
 does:["Comprendre ta façon de t'attacher","Repérer les schémas qui reviennent","Préparer une conversation difficile","Distinguer ce qui t'appartient de ce qui ne t'appartient pas"],
 when:["La même dispute revient sans cesse","Tu ne sais plus quoi dire","Tu veux comprendre ta place dans le lien"]},
otis:{tag:"Il t'aide à dire les choses clairement, sans t'écraser ni écraser l'autre.",
 does:["Formuler une demande claire","Poser une limite sans agressivité","Préparer un échange qui te stresse","Dire non sans te justifier pendant dix minutes"],
 when:["Tu n'oses pas demander","Tu dis oui puis tu regrettes","Tu prépares une conversation tendue"]},
kael:{tag:"Il construit une pratique qui tient dans le temps. Jamais de dépassement à tout prix.",
 does:["Installer une régularité réaliste","Préparer la tête autant que le corps","Gérer la baisse de motivation et les coups d'arrêt","Revenir après une pause sans culpabilité"],
 when:["Tu repars de zéro tous les mois","La performance tourne à l'obsession","Tu veux progresser sans te cramer"]},
miro:{tag:"Il s'occupe de tes nuits, et de tout ce qui les empêche.",
 does:["Comprendre ce qui coupe ton sommeil","Poser un rituel de fin de journée","Calmer le mental qui tourne au coucher","Retrouver un rythme sur plusieurs semaines"],
 when:["Tu mets une heure à t'endormir","Tu te réveilles la nuit","Tu es fatigué dès le réveil"]},
sol:{tag:"Il fait redescendre la pression, sur le moment comme sur la durée.",
 does:["Des exercices de respiration guidés","Comprendre ce qui déclenche la montée","Préparer les situations qui t'angoissent","Reprendre pied quand ça monte"],
 when:["Ton coeur s'emballe","Tu anticipes le pire","Tu as un moment stressant devant toi"]},
mateo:{tag:"Il t'aide à avancer sur ce qui compte, sans y laisser ta santé.",
 does:["Trier l'essentiel de l'urgent","Préparer une décision de carrière","Repérer les signes d'épuisement","Poser des limites au travail"],
 when:["Tu cours sans avancer","Tu hésites à changer de poste","Tu n'arrives plus à décrocher"]},
soren:{tag:"Il accompagne le fait de devenir parent, et de le rester au quotidien.",
 does:["Traverser les périodes qui usent","Garder un lien avec l'autre parent, même quand c'est tendu","Poser un cadre sans crier","Faire de la place à ce que tu ressens, sans culpabilité"],
 when:["Tu deviens parent","Le quotidien t'épuise","Tu ne t'entends plus avec l'autre parent"]},
iris:{tag:"Elle travaille la place que tu occupes parmi les autres, et celle que tu voudrais.",
 does:["Comprendre ce qui t'isole","Reprendre contact sans que ce soit un effort énorme","Construire des liens plus vrais","Traverser une période seule sans t'enfoncer"],
 when:["Tu te sens seul même entouré","Tu as coupé les ponts","Tu arrives dans un nouvel endroit"]},
eden:{tag:"Elle parle d'intimité sans jugement. Le consentement n'est jamais négociable.",
 does:["Mettre des mots sur ce que tu veux et ne veux pas","Aborder ce qui te gêne, à ton rythme","Comprendre ce qui bloque dans l'intimité","Retrouver du désir sans te forcer"],
 when:["Le sujet est difficile à aborder","Quelque chose a changé","Tu veux comprendre ce que tu ressens"]},
vince:{tag:"Il travaille ton rapport à l'argent, pas ton relevé de compte.",
 does:["Comprendre d'où vient la peur d'en manquer","Sortir des décisions prises dans la panique","Parler d'argent dans le couple ou la famille","Séparer ta valeur de ce que tu gagnes"],
 when:["L'argent te stresse en permanence","Tu dépenses pour aller mieux","Le sujet crée des tensions"]},
neo:{tag:"Il travaille les habitudes qui prennent trop de place. Aucune étiquette, jamais.",
 does:["Comprendre à quoi sert l'habitude","Repérer les moments de bascule","Réduire sans tout casser d'un coup","Tenir après un écart, sans repartir de zéro"],
 when:["Une habitude prend trop de place","Tu as arrêté puis repris","Tu veux comprendre avant de décider"]}
};
var DECK_IDS=['mia'].concat(AG_ORDER);
function deckArrow(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+(d==='l'?'M15 18l-6-6 6-6':'M9 18l6-6-6-6')+'"/></svg>'; }
function deckDotSVG(){ return ''; }
function openAgentDeck(startId){
  var box=$('deck-track'); if(!box) return;
  box.innerHTML=DECK_IDS.map(function(id){
    var a=byId(id); if(!a) return '';
    var info=AGENT_INFO[id]||{tag:'',does:[],when:[]};
    var lock=!isUnlocked(id);
    var fav=isFav(id);
    var acc = id==='mia' ? 'Toujours disponible' : (a.plus ? 'Exclusif MAYND+' : 'Inclus dans MAYND');
    var ava = id==='mia' ? '<span class="deck-ava mia">'+brainSVG()+'</span>' : '<span class="deck-ava">'+a.name[0]+'</span>';
    return '<section class="deck-page" data-id="'+id+'" style="--dc:'+a.color+'">'
      +'<div class="deck-inner">'
      +'<div class="deck-top">'+ava
      +(id==='mia'?'':'<button class="deck-star'+(fav?' on':'')+'" onclick="deckFav(\''+id+'\',event)" aria-label="Favori">'+starSVG(fav)+'</button>')
      +'</div>'
      +'<div class="deck-name">'+a.name+'</div>'
      +'<div class="deck-dom">'+(id==='mia'?t('miaStatus'):a.domain)+'</div>'
      +'<div class="deck-acc'+(a.plus?' plus':'')+'">'+acc+'</div>'
      +'<div class="deck-tag">'+escapeHtml(info.tag)+'</div>'
      +'<div class="deck-sec">Ce qu\u2019il fait avec toi</div>'
      +'<ul class="deck-list">'+info.does.map(function(x){return '<li>'+escapeHtml(x)+'</li>';}).join('')+'</ul>'
      +'<div class="deck-sec">Quand l\u2019appeler</div>'
      +'<ul class="deck-list dot">'+info.when.map(function(x){return '<li>'+escapeHtml(x)+'</li>';}).join('')+'</ul>'
      +'<button class="deck-cta" onclick="deckStart(\''+id+'\')">'+(lock?'Débloquer '+a.name:'Parler à '+a.name)+'</button>'
      +'</div></section>';
  }).join('');
  $('deck-dots').innerHTML=DECK_IDS.map(function(id,i){ return '<span class="deck-dot'+(i===0?' on':'')+'" onclick="deckGo('+i+')"></span>'; }).join('');
  $('deck').classList.add('show');
  var idx=startId?DECK_IDS.indexOf(startId):0;
  setTimeout(function(){ deckGo(idx>=0?idx:0, true); },30);
}
function closeDeck(){ $('deck').classList.remove('show'); }
function deckIndex(){
  var tr=$('deck-track'); if(!tr) return 0;
  var w=tr.clientWidth||1;
  return Math.round(tr.scrollLeft/w);
}
function deckGo(i, instant){
  var tr=$('deck-track'); if(!tr) return;
  i=Math.max(0, Math.min(DECK_IDS.length-1, i));
  var x=i*(tr.clientWidth||0);
  if(tr.scrollTo){ try{ tr.scrollTo({left:x, behavior:instant?'auto':'smooth'}); }catch(e){ tr.scrollLeft=x; } }
  else { tr.scrollLeft=x; }
  deckSync(i);
}
function deckSync(i){
  if(i==null) i=deckIndex();
  var dots=document.querySelectorAll('#deck-dots .deck-dot');
  for(var k=0;k<dots.length;k++) dots[k].classList.toggle('on', k===i);
  var a=byId(DECK_IDS[i]);
  if(a && $('deck')) $('deck').style.background=a.color;
}
function deckPrev(){ deckGo(deckIndex()-1); }
function deckNext(){ deckGo(deckIndex()+1); }
function deckFav(id, ev){ toggleFav(id, ev); var i=deckIndex(); openAgentDeck(); setTimeout(function(){ deckGo(i, true); },20); }
function deckStart(id){
  if(!isUnlocked(id)){ closeDeck(); openUpsell('agent', id); return; }
  closeDeck(); startWithAgent(id);
}



/* ═══════════════ COULEURS DES ACCOMPAGNANTS — palette resserrée, par thème ═══════════════
   Rose pour l'intimité, orange pour le sport, violet pour le cadre et le sens,
   la famille des bleus pour tout le reste, en intensités différentes. */
var AGENT_COLORS={
  mia:'#974AF0',     /* co-pilote            violet MAYND      */
  naoki:'#6F2FC0',   /* discipline           violet, le cadre  */
  felix:'#0C96C7',   /* confiance            bleu clair        */
  atlas:'#6F2FC0',   /* identité et sens     violet, la profondeur */
  ava:'#16389E',     /* émotions et deuil    bleu profond      */
  leo:'#224CF2',     /* couple               bleu              */
  otis:'#0C96C7',    /* communication        bleu clair        */
  kael:'#FE6601',    /* sport                orange, l'énergie */
  miro:'#3B2FA8',    /* sommeil              indigo, la nuit   */
  sol:'#0C96C7',     /* anxiété, respiration bleu clair        */
  mateo:'#224CF2',   /* travail              bleu              */
  soren:'#16389E',   /* parentalité          bleu profond      */
  iris:'#0C96C7',    /* lien social          bleu clair        */
  eden:'#E8467F',    /* sexualité            rose              */
  vince:'#224CF2',   /* argent               bleu              */
  neo:'#3B2FA8'      /* addictions           indigo            */
};
var LIGHT_AGENTS=[];
(function(){ try{ ALL.forEach(function(a){ if(AGENT_COLORS[a.id]) a.color=AGENT_COLORS[a.id]; }); }catch(e){} })();
/* ═══════════════ INSCRIPTION — aucun vert, écran du prénom en blanc ═══════════════ */
var OB_SAT={
  'ob-welcome':'#974AF0', 'ob-verify-choice':'#224CF2', 'ob-access':'#6F2FC0',
  'ob-trust':'#0C96C7', 'ob-firstname':'#FFFFFF', 'ob-account-success':'#974AF0',
  'ob-quiz-invite':'#6F2FC0', 'ob-plan':'#FE6601', 'ob-pay-success':'#FFC400'
};
var OB_DARK={'ob-pay-success':true, 'ob-firstname':true};
var OB_TINTS={'#974AF0':'#EDE1FF','#224CF2':'#DFE8FF','#0C96C7':'#DDF0F8','#6F2FC0':'#E6D9FF',
              '#FE6601':'#FFE6D2','#FFC400':'#FFEBCB','#E8467F':'#FFE0EC','#000000':'#1C1C24',
              '#FFFFFF':'#F6F1FF'};
var OB_SOFT={
  'ob-signup':'#EDE1FF','ob-email':'#DFE8FF','ob-pwd':'#DFE8FF','ob-cgu':'#EDE1FF',
  'ob-verify-code':'#DFE8FF','ob-otp':'#DFE8FF','ob-faceid':'#E6D9FF',
  'ob-pin-create':'#EDE1FF','ob-pin-confirm':'#E6D9FF','ob-payment':'#FFE6D2','ob-login':'#DFE8FF'
};
(function(){
  var f=window.obShow;
  if(typeof f!=='function') return;
  window.obShow=function(id){
    var r=f.apply(this, arguments);
    try{
      var box=document.getElementById('onboarding');
      if(box){
        var c=OB_SAT[id];
        box.classList.toggle('noir', c==='#000000');
        if(c){
          box.style.background=c; box.classList.add('sat'); box.classList.toggle('dark', !!OB_DARK[id]);
          box.style.setProperty('--obt', OB_TINTS[c]||'#FFFFFF');
        } else {
          box.classList.remove('sat'); box.classList.remove('dark');
          box.style.background=OB_SOFT[id]||'#EDE1FF';
          box.style.setProperty('--obt', '#FFFFFF');
        }
      }
    }catch(e){}
    return r;
  };
})();
/* ═══════════════ BOUTON DE PRÉSENTATION DANS LA LISTE ═══════════════ */
function renderAgentList(mode){
  var favs=(state.favorites||[]).filter(function(id){return byId(id);});
  var base=ALL.filter(function(a){return a.id!=='mia' && !a.plus;}).map(function(a){return a.id;});
  var plusA=ALL.filter(function(a){return !!a.plus;}).map(function(a){return a.id;});
  var h='<button class="deck-btn" onclick="openAgentDeck()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>'
    +'<span>Présenter les accompagnants</span>'
    +'<svg class="dk-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
  if(favs.length){ h+='<div class="agx-sec">Tes accompagnants</div>'+favs.map(function(id){return agentRowHTML(id,mode);}).join(''); }
  var baseShown=['mia'].concat(base).filter(function(id){return favs.indexOf(id)<0;});
  h+='<div class="agx-sec">Tous les accompagnants</div>'+baseShown.map(function(id){return agentRowHTML(id,mode);}).join('');
  var plusShown=plusA.filter(function(id){return favs.indexOf(id)<0;});
  if(plusShown.length){ h+='<div class="agx-sec plus">Exclusifs MAYND+</div>'+plusShown.map(function(id){return agentRowHTML(id,mode);}).join(''); }
  return h;
}



