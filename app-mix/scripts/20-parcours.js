/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE PARCOURS D'ENTRÉE (13/11/2026)
   Repris du Tunnel (app-guidee/app.js) : les réponses, le profil MAYND sur
   quatre pôles, l'équipe pressentie, « Ce que je retiens », le compte-rendu en
   neuf parties (corrigeable, la version de la personne fait foi), et les
   écrans : seuil, MIA, intro d'étape, question, retenu, profil (flouté tant
   que le compte n'existe pas : 21-compte.js), compte-rendu, équipe,
   professionnel, prêt.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────── réponses ─────────── */
function opt(q, i){ const o=q.options[i]; return typeof o==='string' ? {t:o} : o; }
function valeurChoix(id){
  const q=QX[id], v=etat.rep[id];
  if(v===-1){ const a=String(etat.autres[id]||'').trim(); return a ? {t:a, autre:true} : null; }
  if(typeof v!=='number' || v<0 || !q.options || !q.options[v]) return null;
  return opt(q, v);
}
function choisi(id){ const o=valeurChoix(id); return o ? (o.autre ? o.t : tx(o.t)) : ''; }
function cle(id){ const o=valeurChoix(id); return o && o.k || ''; }
function choixMulti(id){
  const q=QX[id], L=[];
  (etat.rep[id]||[]).forEach(function(i){
    if(i===-1){ const a=String(etat.autres[id]||'').trim(); if(a) L.push({t:a, autre:true}); }
    else if(q.options[i]) L.push(opt(q, i));
  });
  return L;
}
function choisis(id){ return choixMulti(id).map(function(o){ return o.autre ? o.t : tx(o.t); }); }
/* Les choix multiples tels qu'ils s'écrivent dans une phrase adressée à la personne (« ton sommeil »). */
function libelles(id){ return choixMulti(id).map(function(o){ return o.autre ? '« '+cite(o.t)+' »' : (o.c ? tx(o.c) : minus(tx(o.t))); }); }
function nombre(id){ const v=etat.rep[id]; return (typeof v==='number' && v>=1) ? v : 0; }
function noter(id, v){ etat.rep[id]=v; etat.cr.mia={}; garder(); }

/* La phrase qu'une réponse donne au compte-rendu et à « Ce que je retiens ». */
function phrase(id){
  const q=QX[id], v=etat.rep[id];
  if(q.type==='texte'){ const t=String(v||'').trim(); return t ? remplir(q.cr, '{x}', /«\s*\{x\}/.test(q.cr) ? cite(t) : t) : ''; }
  if(q.type==='choix'){
    const o=valeurChoix(id); if(!o) return '';
    if(o.r) return tx(o.r);
    const cadre=/«\s*\{x\}/.test(q.cr||'');
    const x=o.autre ? (cadre ? cite(o.t) : '« '+cite(o.t)+' »') : (cadre ? tx(o.t) : minus(tx(o.t)));
    return q.cr ? remplir(q.cr, '{x}', x) : '';
  }
  if(q.type==='multi'){ const l=libelles(id); return l.length ? remplir(q.cr, '{x}', liste(l)) : ''; }
  if(q.type==='echelle') return nombre(id) ? tx(q.dits[v-1]) : '';
  if(q.type==='note') return nombre(id) ? remplir(q.cr, '{n}', v) : '';
  return '';
}
function boussoleItems(){
  const b=etat.rep.boussole; if(!b) return [];
  return QX.boussole.items.map(function(it){ return {k:it[0], nom:minus(it[1]), v:typeof b[it[0]]==='number'?b[it[0]]:5}; });
}
function boussoleHaut(){ return boussoleItems().sort(function(x, y){ return y.v-x.v; }).filter(function(x){ return x.v>=7; }).slice(0, 2); }
function boussoleBas(){ return boussoleItems().sort(function(x, y){ return x.v-y.v; }).filter(function(x){ return x.v<=4; }).slice(0, 2); }
function surDix(x){ return x.nom+' ('+x.v+' sur 10)'; }
function phrasesBoussole(){
  const items=boussoleItems(); if(!items.length) return [];
  const L=[], haut=boussoleHaut(), bas=boussoleBas();
  if(haut.length) L.push('Sur ta boussole, ce qui tient le mieux : '+liste(haut.map(surDix))+'.');
  if(bas.length) L.push('Ce qui est le plus bas : '+liste(bas.map(surDix))+'.');
  const moy=items.reduce(function(s, x){ return s+x.v; }, 0)/items.length;
  L.push('En moyenne, ta boussole est à '+moy.toFixed(1).replace('.', ',')+' sur 10.');
  return L;
}

/* ─────────── profil MAYND : quatre pôles ─────────── */
function poles(){
  const s={M:0, R:0, A:0, S:0};
  function ajoute(p, n){ if(!p) return; if(p.length===2){ s[p[0]]+=n/2; s[p[1]]+=n/2; } else s[p]+=n; }
  MODULES.forEach(function(m){ m.questions.forEach(function(q){
    if(q.type==='echelle' && (q.pg || q.pd)){
      const v=nombre(q.id), n=q.poids||2; if(!v) return;
      if(v<=2) ajoute(q.pg, n); else if(v>=4) ajoute(q.pd, n); else { ajoute(q.pg, n/2); ajoute(q.pd, n/2); }
    } else if(q.type==='choix' && q.poids){
      const o=valeurChoix(q.id); if(o && o.p) ajoute(o.p, q.poids);
    }
  }); });
  return s;
}
function profil(){
  const s=poles(), ordre=['M','R','A','S'];
  const tri=ordre.slice().sort(function(a, b){ return s[b]-s[a]; });
  const top=s[tri[0]];
  let c=ordre.filter(function(p){ return s[p]>0 && s[p]>=top-1; }).join('');
  if(!PROFILS[c]) c=ordre.filter(function(p){ return p===tri[0] || p===tri[1]; }).join('');
  if(!PROFILS[c]) c=tri[0];
  const P=PROFILS[c];
  return {cle:c, nom:fem()?P.nomF:P.nom, desc:P.desc, scores:s};
}

/* ─────────── l'équipe pressentie ─────────── */
function equipe(){
  const sc={};
  ACCOMPAGNANTS.forEach(function(a){ if(a.id!=='mia') sc[a.id]=0; });
  function ajoute(ag){ if(ag) Object.keys(ag).forEach(function(id){ if(id in sc) sc[id]+=ag[id]; }); }
  MODULES.forEach(function(m){ m.questions.forEach(function(q){
    if(q.type==='choix'){ const o=valeurChoix(q.id); if(o) ajoute(o.ag); }
    else if(q.type==='multi') choixMulti(q.id).forEach(function(o){ ajoute(o.ag); });
  }); });
  const lien={sommeil:'miro', energie:'miro', moral:'ava', confiance:'felix', travail:'mateo', amour:'leo', amis:'iris', argent:'vince', corps:'nora', sens:'atlas'};
  boussoleItems().forEach(function(x){ if(lien[x.k] && x.v<=4) sc[lien[x.k]]+=(5-x.v); });
  return Object.keys(sc).filter(function(id){ return sc[id]>0; }).sort(function(a, b){ return sc[b]-sc[a]; }).slice(0, 3);
}

/* ─────────── « Ce que je retiens » ─────────── */
function retenu(m){
  const L=[];
  m.questions.forEach(function(q){
    if(q.type==='boussole'){ const hb=boussoleHaut(), bb=boussoleBas();
      if(hb.length) L.push('Ce qui tient le mieux : '+liste(hb.map(surDix))+'.');
      if(bb.length) L.push('Ce qui est le plus bas : '+liste(bb.map(surDix))+'.');
    } else { const p=phrase(q.id); if(p) L.push(p); }
  });
  return L.slice(0, 8);
}

/* ─────────── le compte-rendu ───────────
   Trois versions par partie, par priorité : corrigée par la personne (toi), écrite par MIA (mia), composée ici (locale). */
function paragraphesDe(L, par){
  par=par||4; const P=[];
  for(let i=0;i<L.length;i+=par) P.push(L.slice(i, i+par).join(' '));
  return P.join('\n\n');
}
function croisements(id){
  const r=etat.rep, L=[];
  if(id==='fonctionnement'){
    if(nombre('projet') && nombre('decision') && r.projet<=2 && r.decision<=2) L.push('Tu avances avec méthode : tu prépares, tu analyses, puis tu décides.');
    if(nombre('projet')>=4 && nombre('decision')>=4) L.push("Tu fonctionnes à l'instinct, et tu le sais.");
    if(nombre('exigence')>=4 && nombre('emotions')>=4) L.push('Tu demandes beaucoup à toi-même, souvent sans le montrer.');
  }
  if(id==='reactions'){
    if(cle('echec')==='nul' && nombre('exigence')>=4) L.push('Ton exigence envers toi rend tes échecs lourds à porter.');
    if(cle('desaccord')==='efface' && cle('compliment')==='minimise') L.push(tx('Tu as tendance à te faire {petit|petite}, dans les désaccords comme face aux compliments.'));
  }
  if(id==='energie'){
    if(cle('heures')==='court' && cle('reveil')==='fatigue') L.push('Tes nuits sont courtes et ton réveil est difficile : ton sommeil est sans doute la première chose à regarder.');
    if(cle('ecrans')==='tard' && cle('heures')==='court') L.push('Les écrans du soir prennent sur ton temps de sommeil.');
  }
  return L;
}
function brefLocal(){
  const p=profil(), pr=prenom(), L=[];
  L.push((pr ? pr+', ton' : 'Ton')+" profil MAYND, c'est "+p.nom+'. '+p.desc);
  const per=phrase('periode'); if(per) L.push(per);
  const s=libelles('sujets'); if(s.length) L.push('Ce qui prend le plus de place : '+liste(s)+'.');
  const v=libelles('valeurs'); if(v.length) L.push('Ce qui compte le plus pour toi : '+liste(v)+'.');
  if(etat.rep.cap) L.push('Ton cap : « '+cite(etat.rep.cap)+' ».');
  return paragraphesDe(L, 3);
}
function appuisLocal(){
  const r=etat.rep, A=[], V=[];
  const vals=libelles('valeurs'); if(vals.length) A.push('Tu sais ce qui compte pour toi : '+liste(vals)+". C'est une boussole solide.");
  if(nombre('pret')>=7) A.push(tx("Tu es {prêt|prête} à t'y mettre (")+r.pret+" sur 10) : c'est le meilleur point de départ.");
  if(cle('soutien')==='proche') A.push('Quand ça va mal, tu sais te tourner vers les autres.');
  if(cle('pression')==='froid') A.push('Sous pression, tu gardes la tête froide.');
  if(nombre('imprevu')>=4) A.push("Tu t'adaptes vite à l'imprévu.");
  if(cle('echec')==='tirer') A.push('Tu fais de tes échecs des leçons.');
  const f=cite(r.fierte); if(f) A.push('Tu as des fiertés concrètes : « '+f+' ».');
  const hb=boussoleHaut(); if(hb.length) A.push("Tu peux t'appuyer sur ce qui tient : "+liste(hb.map(function(x){ return x.nom; }))+'.');
  if(!A.length) A.push('Tu as pris le temps de répondre à '+TOTAL_Q+" questions sur toi : c'est déjà un appui.");
  if(nombre('exigence')>=4 && (cle('echec')==='nul' || cle('compliment')==='minimise')) V.push(tx('Tu es très {exigeant|exigeante} avec toi-même, et ton dialogue intérieur peut être dur.'));
  if(cle('soutien')==='seul') V.push(tx("Tu gères souvent {seul|seule} : demander de l'aide pourrait changer beaucoup."));
  if(cle('desaccord')==='efface') V.push("Dans les désaccords, tu as tendance à t'effacer.");
  if(cle('calme')==='long') V.push('Une émotion forte te reste longtemps.');
  if(cle('heures')==='court' || cle('reveil')==='fatigue') V.push('Ton sommeil ne te recharge pas assez.');
  if(cle('ecrans')==='tard') V.push('Les écrans du soir grignotent ton repos.');
  if(cle('pression')==='repousse') V.push('Quand la pression monte, tu repousses.');
  if(nombre('emotions')>=4) V.push('Tu gardes beaucoup pour toi.');
  const bb=boussoleBas(); if(bb.length) V.push('Ce qui est le plus bas en ce moment : '+liste(bb.map(function(x){ return x.nom; }))+'.');
  if(!V.length) V.push('Rien ne ressort nettement. MIA restera attentive à ce que tu lui diras.');
  return 'Tes appuis : '+A.join(' ')+'\n\nTes points de vigilance : '+V.join(' ');
}
function texteLocal(id){
  if(id==='bref') return brefLocal();
  if(id==='appuis') return appuisLocal();
  let L=[];
  SECTION[id].q.forEach(function(qid){
    if(qid==='boussole') L=L.concat(phrasesBoussole());
    else { const p=phrase(qid); if(p) L.push(p); }
  });
  L=L.concat(croisements(id));
  return L.length ? paragraphesDe(L) : "Tu n'as pas encore répondu à cette partie.";
}
function texteSection(id){
  if(etat.cr.toi[id]!=null) return etat.cr.toi[id];
  if(etat.cr.mia[id]) return etat.cr.mia[id];
  return texteLocal(id);
}
function carteCR(id, edition){
  const s=SECTION[id], corrige=etat.cr.toi[id]!=null, t=texteSection(id);
  const corps=edition
    ? '<label class="etiquette" for="cr-champ-'+id+'">Écris-le comme c’est vraiment pour toi.</label>'
      +'<textarea class="champ cr-champ" id="cr-champ-'+id+'" rows="7">'+esc(t)+'</textarea>'
      +'<div class="actions">'+bouton('Enregistrer', 'cr-enregistrer', ' data-id="'+id+'"')+'<button class="lien" data-action="cr-annuler" data-id="'+id+'">Annuler</button></div>'
    : '<div class="cr-texte'+(!corrige && !etat.cr.mia[id] ? ' cr-local' : '')+'">'+paragraphes(t)+'</div>'
      +(corrige ? '<p class="cr-note">Corrigé par toi · <button class="lien-inline" data-action="cr-retablir" data-id="'+id+'">Revenir au texte d’origine</button></p>' : '');
  return '<section class="cr-carte" data-section="'+id+'" style="--c:'+s.fond+';--t:'+s.teinte+'">'
    +'<header><h2>'+esc(s.titre)+'</h2>'+(edition?'':'<button class="lien-inline" data-action="cr-corriger" data-id="'+id+'">Corriger</button>')+'</header>'+corps+'</section>';
}
function cartesCR(){ return SECTIONS_CR.map(function(s){ return carteCR(s.id, false); }).join(''); }
function remplacerCarte(id, edition){
  const el=document.querySelector('.cr-carte[data-section="'+id+'"]'); if(!el) return;
  const tmp=document.createElement('div'); tmp.innerHTML=typo(carteCR(id, edition));
  el.parentNode.replaceChild(tmp.firstChild, el);
  if(edition){
    const c=document.getElementById('cr-champ-'+id);
    const ajuste=function(){ c.style.height='auto'; c.style.height=(c.scrollHeight+4)+'px'; };
    c.addEventListener('input', ajuste); ajuste(); c.focus();
  }
}
function etatCR(texte){ const el=document.getElementById('cr-etat'); if(el) el.textContent=texte||''; }
function decouperSections(t){
  const parts={}, morceaux=String(t||'').split(/\[\[\s*SECTION\s*:\s*([a-z_]+)\s*\]\]/i);
  for(let i=1;i<morceaux.length;i+=2){
    const id=morceaux[i].toLowerCase(), texte=lireBalises(morceaux[i+1]||'').texte;
    if(SECTION[id] && texte) parts[id]=texte;
  }
  return parts;
}
let crEnCours=false;
async function lancerCompteRendu(){
  if(!etat.cle || crEnCours) return;
  const ids=SECTIONS_CR.map(function(s){ return s.id; }).filter(function(id){ return etat.cr.toi[id]==null; });
  if(!ids.length) return;
  crEnCours=true; etatCR('MIA relit tes réponses et affine ton compte-rendu…');
  const GUIDE={bref:"l'essentiel : son profil, sa période, ce qui compte, son cap. 3 à 4 phrases.",
    situation:'ce qu\'elle fait dans la vie, avec qui elle vit, sa période, ce qui pèse, ce qui tient.',
    fonctionnement:'sa façon d\'avancer, de décider, de se recharger, ce qui la fait avancer, son rythme.',
    reactions:'comment elle réagit sous pression, après un échec, dans un désaccord, face à une émotion forte, à un compliment, quand ça va mal, face à l\'imprévu.',
    interets:'ses valeurs, ses points d\'intérêt, ce qui l\'apaise, ses fiertés, ce qu\'elle veut voir changer, ce qu\'elle ne veut plus vivre.',
    energie:'son sommeil, son énergie, son rapport au mouvement et aux écrans.',
    appuis:'deux paragraphes : le premier commence par « Tes appuis : », le second par « Tes points de vigilance : ».',
    echange:'comment MIA va lui parler, d\'après ses choix et son niveau de connaissance de ces sujets.',
    cap:'son cap, pourquoi maintenant, le signe que ça avance, à quel point elle est prête.'};
  const tour="Consigne pour cette réponse :\nTu écris le compte-rendu détaillé que la personne lit à la fin de son parcours d'accueil. Il doit l'aider à se comprendre : comment elle fonctionne, ce qu'elle fait, ce qui l'intéresse, comment elle réagit selon les situations. "
    +'Écris ces parties, dans cet ordre, chacune précédée de sa balise seule sur sa ligne :\n'
    +ids.map(function(id){ return '[[SECTION:'+id+']] '+SECTION[id].titre+' : '+GUIDE[id]; }).join('\n')
    +"\nRègles : deuxième personne ; trois à six phrases par partie ; concret, accroché à ses réponses et à ses mots ; relie entre elles des réponses qu'elle n'aurait pas rapprochées ; une lecture se propose comme une hypothèse, jamais comme un verdict ; aucune étiquette, aucun vocabulaire clinique, aucune flatterie, aucune question, aucune autre balise."
    +(typeof nomLangueModele==='function' && nomLangueModele() ? "\nLangue : écris tout le compte-rendu en "+nomLangueModele()+'.' : '');
  try{
    const res=await appeler(systeme('mia', tour), [{role:'user', content:'(Écris mon compte-rendu.)'}], 4000);
    if(!res.refus){
      const parts=decouperSections(res.texte);
      ids.forEach(function(id){ if(parts[id] && etat.cr.toi[id]==null) etat.cr.mia[id]=parts[id]; });
      garder();
      ids.forEach(function(id){ const el=document.querySelector('.cr-carte[data-section="'+id+'"]'); if(el && !el.querySelector('textarea')) remplacerCarte(id, false); });
    }
    etatCR(res.refus ? '' : 'Compte-rendu affiné par MIA.');
  }catch(_){ etatCR(''); }
  crEnCours=false;
}
ACTIONS['cr-corriger']=function(b){ remplacerCarte(b.dataset.id, true); };
ACTIONS['cr-annuler']=function(b){ remplacerCarte(b.dataset.id, false); };
ACTIONS['cr-enregistrer']=function(b){
  const id=b.dataset.id, c=document.getElementById('cr-champ-'+id);
  const v=String(c && c.value || '').replace(/ /g, ' ').trim();
  if(!v) delete etat.cr.toi[id];
  else if(v!==texteSection(id).replace(/ /g, ' ').trim()) etat.cr.toi[id]=v;
  garder(); remplacerCarte(id, false);
};
ACTIONS['cr-retablir']=function(b){ delete etat.cr.toi[b.dataset.id]; garder(); remplacerCarte(b.dataset.id, false); };

/* ─────────── les écrans du parcours ─────────── */
function barre(){
  const n=numeroAvant(etat.etape), pct=Math.round(100*n/TOTAL_Q);
  return '<header class="barre"><button class="b-retour" data-action="retour" aria-label="Revenir en arrière">←</button>'
    +'<div class="progression" role="progressbar" aria-label="Avancement" aria-valuemin="0" aria-valuemax="'+TOTAL_Q+'" aria-valuenow="'+n+'"><span style="width:'+pct+'%"></span></div></header>';
}
RENDUS.seuil=function(){
  const p=prenom(); let corps;
  if(etat.etape>1){
    const n=numeroAvant(etat.etape);
    corps='<p class="sur">Bon retour'+(p?', '+esc(p):'')+'.</p><h1 class="grand">'+h("On reprend où tu t'étais {arrêté|arrêtée} ?")+'</h1>'
      +'<p class="texte">'+(n ? 'Tu en étais à la question '+n+' sur '+TOTAL_Q+'. Tout est gardé.' : 'Tout est gardé.')+'</p>'
      +bouton('Reprendre', 'reprendre')+'<button class="lien" data-action="recommencer">Tout recommencer</button>';
  } else {
    corps='<h1 class="marque">MAYND</h1><p class="slogan">Pour tous, partout, tout le temps.</p>'
      +'<p class="texte">Un accompagnement guidé, avec MIA, seize accompagnants, et un professionnel référent qui veille.</p>'+bouton('Commencer', 'commencer');
  }
  return {fond:VIOLET, html:'<div class="centre seuil">'+corps+'</div>'
    +'<footer class="pied"><button class="lien-discret" data-action="reglages">Réglages</button><span>'+VERSION_APP+'</span></footer>'};
};
RENDUS.mia=function(){
  return {fond:VIOLET, html:'<div class="centre">'+avatar('mia', 'grand')
    +'<h1 class="grand">Je suis MIA.</h1>'
    +'<p class="texte">Avant qu’on parle, je vais prendre le temps de te connaître. Vraiment.</p>'
    +'<p class="texte">'+MODULES.length+' étapes, '+TOTAL_Q+' questions, environ '+(Math.round(TOTAL_Q*25/60/5)*5)+' minutes. Il n’y a pas de bonne réponse. Si une question ne te parle pas, « Autre » ou « Je ne sais pas » sont là.</p>'
    +'<p class="texte">'+h("Tu peux t'arrêter quand tu veux et fermer la page. Je garde tout, et on reprend exactement là où tu t'es {arrêté|arrêtée}.")+'</p>'
    +bouton('On commence', 'suivant')+'</div>'};
};
RENDUS.intro=function(e){
  const m=MODULES[e.m], n=m.questions.length;
  return {fond:m.fond, encre:m.encre, teinte:m.teinte, html:barre()+'<div class="centre">'
    +'<p class="sur">Étape '+(e.m+1)+' sur '+MODULES.length+'</p><h1 class="grand">'+h(m.titre)+'</h1>'
    +'<p class="texte">'+h(m.sous)+'</p><p class="mesure">'+pluriel(n, 'question', 'questions')+' · '+Math.max(1, Math.round(n*25/60))+' min</p>'
    +bouton("C'est parti", 'suivant')+'</div>'};
};
function champAutre(q, visible){
  return '<div class="autre" id="autre"'+(visible?'':' hidden')+'><input class="champ" id="champ-autre" type="text" maxlength="200" placeholder="Avec tes mots, si tu veux" value="'+esc(etat.autres[q.id]||'')+'">'
    +(q.type==='choix' ? '<button class="btn" data-action="valider-autre" data-q="'+q.id+'">Continuer</button>' : '')+'</div>';
}
const CONTROLES={
  texte:function(q){
    const v=String(etat.rep[q.id]||'');
    const champ=q.ligne
      ? '<input class="champ" id="champ" type="text" autocomplete="given-name" maxlength="40" placeholder="'+h(q.exemple)+'" value="'+esc(v)+'">'
      : '<textarea class="champ" id="champ" rows="3" maxlength="600" placeholder="'+h(q.exemple)+'">'+esc(v)+'</textarea>';
    return (q.idees?ideesCap():'')+champ+'<div class="actions">'
      +'<button class="btn" data-action="valider-texte" data-q="'+q.id+'"'+(q.requis && !v.trim()?' disabled':'')+'>Continuer</button>'
      +(q.requis?'':'<button class="lien" data-action="passer" data-q="'+q.id+'">Passer</button>')+'</div>';
  },
  choix:function(q){
    const cur=etat.rep[q.id];
    let o=q.options.map(function(x, i){
      return '<button class="opt'+(cur===i?' choisi':'')+'" data-action="choix" data-q="'+q.id+'" data-i="'+i+'">'+h(opt(q, i).t)+'</button>';
    }).join('');
    if(q.autre) o+='<button class="opt'+(cur===-1?' choisi':'')+'" data-action="choix-autre" data-q="'+q.id+'">Autre</button>'+champAutre(q, cur===-1);
    return '<div class="options">'+o+'</div>';
  },
  multi:function(q){
    const cur=etat.rep[q.id]||[];
    function pastille(i, texte){
      const on=cur.indexOf(i)>=0;
      return '<button class="opt'+(on?' choisi':'')+'" data-action="multi" data-q="'+q.id+'" data-i="'+i+'" aria-pressed="'+on+'">'+texte+'</button>';
    }
    return '<div class="options multi">'+q.options.map(function(x, i){ return pastille(i, h(opt(q, i).t)); }).join('')+(q.autre?pastille(-1, 'Autre'):'')+'</div>'
      +(q.autre?champAutre(q, cur.indexOf(-1)>=0):'')
      +'<div class="actions"><span class="compte" id="compte">'+cur.length+' sur '+q.max+'</span>'
      +'<button class="btn" data-action="suivant-multi" data-q="'+q.id+'"'+(cur.length?'':' disabled')+'>Continuer</button></div>';
  },
  echelle:function(q){
    const cur=etat.rep[q.id], g=tx(q.gauche), d=tx(q.droite);
    const noms=[g, 'Plutôt : '+g, 'Entre les deux', 'Plutôt : '+d, d]; let pts='';
    for(let i=1;i<=5;i++) pts+='<button class="point'+(cur===i?' choisi':'')+'" data-action="echelle" data-q="'+q.id+'" data-v="'+i+'" aria-label="'+esc(noms[i-1])+'"><i></i></button>';
    return '<div class="echelle"><div class="poles"><span>'+esc(g)+'</span><span>'+esc(d)+'</span></div><div class="points">'+pts+'</div></div>'
      +'<button class="lien" data-action="nsp" data-q="'+q.id+'">Je ne sais pas</button>';
  },
  note:function(q){
    const cur=etat.rep[q.id]; let b='';
    for(let i=1;i<=10;i++) b+='<button class="chiffre'+(cur===i?' choisi':'')+'" data-action="note" data-q="'+q.id+'" data-v="'+i+'">'+i+'</button>';
    return '<div class="note"><div class="chiffres">'+b+'</div><div class="poles"><span>'+h(q.gauche)+'</span><span>'+h(q.droite)+'</span></div></div>'
      +'<button class="lien" data-action="nsp" data-q="'+q.id+'">Je ne sais pas</button>';
  },
  boussole:function(q){
    const cur=etat.rep[q.id]||{};
    return '<div class="boussole">'+q.items.map(function(it){
        const v=typeof cur[it[0]]==='number'?cur[it[0]]:5;
        return '<label class="curseur"><span class="c-nom">'+h(it[1])+'</span><input type="range" min="1" max="10" step="1" value="'+v+'" data-k="'+it[0]+'"><output>'+v+'</output></label>';
      }).join('')+'</div><div class="actions"><button class="btn" data-action="valider-boussole" data-q="'+q.id+'">Continuer</button></div>';
  }
};
function ideesCap(){
  const ids=[];
  choixMulti('sujets').forEach(function(o){
    Object.keys(o.ag||{}).sort(function(a, b){ return o.ag[b]-o.ag[a]; }).forEach(function(id){ if(ids.indexOf(id)<0) ids.push(id); });
  });
  equipe().forEach(function(id){ if(ids.indexOf(id)<0) ids.push(id); });
  const idees=ids.slice(0, 4).map(function(id){ return IDEES_CAP[id]; }).filter(Boolean);
  if(!idees.length) return '';
  return '<div class="idees">'+idees.map(function(t){ return '<button class="idee" data-action="idee" data-texte="'+esc(t)+'">'+esc(t)+'</button>'; }).join('')+'</div>';
}
RENDUS.q=function(e){
  const m=MODULES[e.m], q=m.questions[e.q];
  return {fond:m.fond, encre:m.encre, teinte:m.teinte,
    html:barre()+'<div class="question"><p class="sur">'+h(m.titre)+' · '+e.n+' sur '+TOTAL_Q+'</p>'
      +'<h1 class="q-titre">'+h(q.titre)+'</h1>'+(q.aide?'<p class="aide">'+h(q.aide)+'</p>':'')+CONTROLES[q.type](q)+'</div>',
    apres:function(){ brancherQuestion(q); }};
};
function brancherQuestion(q){
  const champ=document.getElementById('champ');
  if(champ){
    const btn=document.querySelector('[data-action="valider-texte"]');
    champ.addEventListener('input', function(){ if(q.requis) btn.disabled=!champ.value.trim(); });
    champ.addEventListener('keydown', function(ev){ if(ev.key==='Enter' && (q.ligne || ev.ctrlKey || ev.metaKey) && !btn.disabled){ ev.preventDefault(); btn.click(); } });
    if(window.matchMedia && window.matchMedia('(pointer:fine)').matches) champ.focus();
  }
  if(q.type==='boussole'){
    Array.prototype.forEach.call(document.querySelectorAll('.curseur input'), function(r){ r.addEventListener('input', function(){ r.nextElementSibling.textContent=r.value; }); });
  }
  const autre=document.getElementById('champ-autre');
  if(autre && q.type==='choix') autre.addEventListener('keydown', function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); document.querySelector('[data-action="valider-autre"]').click(); } });
}
RENDUS.retenu=function(e){
  const m=MODULES[e.m], lignes=retenu(m), suite=MODULES[e.m+1];
  return {fond:m.fond, encre:m.encre, teinte:m.teinte, html:barre()+'<div class="centre"><p class="sur">Ce que je retiens</p>'
    +'<ul class="retenu">'+(lignes.length ? lignes.map(function(l){ return '<li>'+esc(l)+'</li>'; }).join('') : '<li>Tu as passé cette étape. On y reviendra si tu veux.</li>')+'</ul>'
    +bouton(suite ? 'Étape suivante : '+tx(suite.titre) : 'Continuer', 'suivant')+'</div>'};
};
const NOMS_POLES={M:"L'action", R:'Le lien', A:'Se poser', S:"L'analyse"};
function carteProfilHTML(){
  const p=profil(), max=Math.max(1, p.scores.M, p.scores.R, p.scores.A, p.scores.S);
  return '<p class="sur">Ton profil MAYND</p><h1 class="geant">'+esc(p.nom)+'</h1><p class="texte">'+esc(p.desc)+'</p>'
    +'<div class="jauges">'+['M','R','A','S'].map(function(k){
      return '<div class="jauge"><span>'+NOMS_POLES[k]+'</span><b><i style="width:'+Math.round(100*p.scores[k]/max)+'%"></i></b></div>';
    }).join('')+'</div>';
}
/* Le profil : flouté derrière la création du compte tant qu'il n'existe pas (21-compte.js). */
RENDUS.profil=function(){
  const libre=compteCree();
  return {fond:'#6F2FC0', teinte:'#E6D9FF', html:'<div class="centre profil'+(libre?'':' voile')+'">'
    +'<div class="profil-carte" id="profil-carte" aria-hidden="'+(libre?'false':'true')+'">'+carteProfilHTML()+(libre?bouton('Continuer', 'suivant'):'')+'</div>'
    +(libre?'':compteFormulaireHTML())+'</div>',
    apres:function(){ if(!libre && typeof brancherCompte==='function') brancherCompte(); }};
};
RENDUS.compte=function(){
  const p=prenom();
  return {fond:'#F5EFFE', encre:SOMBRE, teinte:'#E9DDFB', classe:'ecran-document', html:'<div class="document">'
    +'<p class="sur">Ton compte-rendu</p>'
    +'<h1 class="grand">'+(p ? esc(p)+', tout' : 'Tout')+' ce que j’ai compris de toi.</h1>'
    +'<p class="texte">Lis-le tranquillement. Si quelque chose sonne faux, corrige-le : c’est ta version qui compte, et c’est elle que MIA utilisera.</p>'
    +'<p class="cr-etat" id="cr-etat" aria-live="polite"></p>'
    +'<div class="cr-liste">'+cartesCR()+'</div>'
    +bouton("C'est bien moi", 'suivant')+'</div>',
    apres:function(){ if(etat.cle && !Object.keys(etat.cr.mia).length) lancerCompteRendu(); }};
};
RENDUS.equipe=function(){
  const t=equipe();
  const cartes='<div class="carte-ag">'+avatar('mia')+'<div><strong>MIA</strong><span>Co-pilote</span><p>Elle te parle en premier, toujours.</p></div></div>'
    +t.map(function(id){ const a=AG[id];
      return '<div class="carte-ag">'+avatar(id)+'<div><strong>'+esc(a.nom)+'</strong><span>'+esc(a.domaine)+'</span><p>'+h(APPORTS[id])+'</p></div></div>'; }).join('');
  return {fond:'#224CF2', teinte:'#DFE8FF', html:'<div class="centre"><p class="sur">Ton équipe</p>'
    +'<h1 class="grand">Les seize accompagnants sont là pour toi.</h1>'
    +'<p class="texte">'+(t.length ? 'MIA fera venir celui qui t’aidera, au bon moment. D’après ton parcours, les premiers seront sans doute :' : 'MIA fera venir celui qui t’aidera, au bon moment.')+'</p>'
    +'<div class="cartes">'+cartes+'</div>'+bouton('Continuer', 'suivant')+'</div>'};
};
RENDUS.pro=function(){
  return {fond:'#00A862', teinte:'#D8F2E4', html:'<div class="centre"><p class="sur">Ton professionnel référent</p>'
    +'<h1 class="grand">Tu n’es pas seulement entre les mains d’une intelligence artificielle.</h1>'
    +'<p class="texte">Un professionnel référent certifié, humain, suit ton parcours MAYND. Il lit ton compte-rendu, signe ta feuille de route en début de mois et ton bilan en fin de mois.</p>'
    +'<p class="texte">Aucun rendez-vous à prendre. Il intervient, dans ta discussion, quand un signal le justifie :</p>'
    +'<ul class="signaux">'
    +'<li><strong>Stagnation</strong>Rien ne bouge depuis un moment.</li>'
    +'<li><strong>Blocage</strong>'+h('Tu es {coincé|coincée}, ou ce que tu vis demande plus.')+'</li>'
    +'<li><strong>Désalignement</strong>Tes actes s’éloignent de ton cap.</li>'
    +'<li><strong>Progression à consolider</strong>Un vrai progrès, à ancrer.</li></ul>'
    +bouton('Continuer', 'suivant')+'</div>'};
};
RENDUS.pret=function(){
  const p=prenom();
  return {fond:VIOLET, html:'<div class="centre">'+avatar('mia', 'grand')
    +'<h1 class="grand">Tout est prêt'+(p?', '+esc(p):'')+'.</h1>'
    +'<p class="texte">MIA a lu tout ton parcours et ton compte-rendu. Tu n’as rien à répéter.</p>'
    +(etat.rep.cap?'<p class="texte">Ton cap : « '+esc(cite(etat.rep.cap))+' ».</p>':'')
    +bouton('Parler avec MIA', 'terminer')+'</div>'};
};

/* ─────────── actions du parcours ─────────── */
function choisirVisuel(b, selecteur){ Array.prototype.forEach.call(document.querySelectorAll(selecteur), function(o){ o.classList.toggle('choisi', o===b); }); }
ACTIONS.commencer=function(){ aller(1); };
ACTIONS.reprendre=function(){ aller(etat.etape); };
ACTIONS.terminer=terminerParcours;
ACTIONS.recommencer=function(b){
  if(!confirmeRaz){ confirmeRaz=true; b.textContent='Confirmer : tout effacer'; return; }
  reinitialiser(true); confirmeRaz=false; fermer(); aller(1);
};
ACTIONS.choix=function(b){
  noter(b.dataset.q, +b.dataset.i); choisirVisuel(b, '.opt');
  const autre=document.getElementById('autre'); if(autre) autre.hidden=true;
  avancerApres();
};
ACTIONS['choix-autre']=function(b){
  noter(b.dataset.q, -1); choisirVisuel(b, '.opt');
  document.getElementById('autre').hidden=false; document.getElementById('champ-autre').focus();
};
ACTIONS['valider-autre']=function(b){ etat.autres[b.dataset.q]=String(document.getElementById('champ-autre').value||'').trim(); garder(); suivant(); };
ACTIONS.multi=function(b){
  const id=b.dataset.q, i=+b.dataset.i, Q=QX[id], cur=(etat.rep[id]||[]).slice(), k=cur.indexOf(i);
  if(k>=0) cur.splice(k, 1);
  else if(cur.length>=Q.max){ const c=document.getElementById('compte'); c.classList.remove('vibre'); void c.offsetWidth; c.classList.add('vibre'); return; }
  else cur.push(i);
  noter(id, cur);
  const on=cur.indexOf(i)>=0;
  b.classList.toggle('choisi', on); b.setAttribute('aria-pressed', String(on));
  if(i===-1){ const a=document.getElementById('autre'); a.hidden=!on; if(on) document.getElementById('champ-autre').focus(); }
  document.getElementById('compte').textContent=cur.length+' sur '+Q.max;
  document.querySelector('[data-action="suivant-multi"]').disabled=!cur.length;
};
ACTIONS['suivant-multi']=function(b){ const a=document.getElementById('champ-autre'); if(a){ etat.autres[b.dataset.q]=String(a.value||'').trim(); garder(); } suivant(); };
ACTIONS.echelle=function(b){ noter(b.dataset.q, +b.dataset.v); choisirVisuel(b, '.point'); avancerApres(); };
ACTIONS.note=function(b){ noter(b.dataset.q, +b.dataset.v); choisirVisuel(b, '.chiffre'); avancerApres(); };
ACTIONS.nsp=function(b){ noter(b.dataset.q, 0); suivant(); };
ACTIONS['valider-boussole']=function(b){
  const v={}; Array.prototype.forEach.call(document.querySelectorAll('.curseur input'), function(r){ v[r.dataset.k]=+r.value; });
  noter(b.dataset.q, v); suivant();
};
ACTIONS['valider-texte']=function(b){
  const c=document.getElementById('champ'), v=String(c.value||'').trim();
  if(QX[b.dataset.q].requis && !v) return;
  noter(b.dataset.q, v); suivant();
};
ACTIONS.passer=function(b){ noter(b.dataset.q, ''); suivant(); };
ACTIONS.idee=function(b){
  const c=document.getElementById('champ'); c.value=b.dataset.texte;
  const v=document.querySelector('[data-action="valider-texte"]'); if(v) v.disabled=false;
  c.focus();
};

/* ─────────── démonstration : index.html?demo=fin ou ?demo=chat ─────────── */
function remplirDemo(){
  etat.rep={prenom:'Léa', genre:1, age:1, activite:2, foyer:1, periode:2,
    boussole:{sommeil:3, energie:4, moral:5, confiance:4, travail:4, amour:7, famille:8, amis:6, argent:5, corps:5, sens:4},
    sujets:[7, 3, 11], duree:1, phrase:"Je dors mal depuis que j'ai changé de poste, et je doute de tout.",
    recharge:4, projet:2, decision:2, nouveaute:4, exigence:5, emotions:4, moteur:1, moment:1,
    pression:2, echec:1, desaccord:4, calme:3, compliment:3, soutien:2, imprevu:2,
    valeurs:[11, 2, 12], apaise:[0, 1, 4], fierte:"J'ai repris le piano l'an dernier.", six_mois:0, ne_plus:'Me réveiller à 4 h en pensant au travail.',
    heures:1, reveil:3, energie_jour:4, bouger:3, ecrans:1,
    niveau:1, franchise:4, longueur:1, piste:4, humour:1, relance:2, moment_parler:3,
    cap:'Retrouver des nuits qui reposent', pourquoi:"Je ne tiens plus à ce rythme.", signe:"Me réveiller sans le réveil, deux matins par semaine.", pret:8};
  etat.cr={mia:{}, toi:{}};
  etat.compte={courriel:'lea@exemple.fr', empreinte:'demo', cree:Date.now(), acces:'', accesPlusTard:false};
  garder();
}
