/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — LE TEXTE (13/11/2026)
   Échappement, accord, prénom, typographie française, dates, petites listes.
   ══════════════════════════════════════════════════════════════════════════ */

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* {prenom} et les paires {masculin|féminin}. */
function tx(s){
  return String(s==null?'':s).replace(/\{prenom\}/g, prenom())
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function(_, m, f){ return fem() ? f : m; });
}
function h(s){ return esc(tx(s)); }
/* Espace insécable avant ? ! : ; » et après «. */
function typo(s){ return String(s).replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« '); }
function minus(s){ s=String(s||''); return s.charAt(0).toLowerCase()+s.slice(1); }
function majus(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
function liste(a){ return a.length<2 ? a.join('') : a.slice(0,-1).join(', ')+' et '+a[a.length-1]; }
function cite(t){ return String(t||'').trim().replace(/[\s.]+$/, ''); }
function remplir(gabarit, cle, valeur){ return tx(gabarit).replace(cle, function(){ return String(valeur); }); }
function paragraphes(t){
  return String(t||'').split(/\n{2,}/).map(function(p){
    return '<p>'+esc(p.trim()).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')+'</p>';
  }).join('');
}
function normaliser(s){ return String(s||'').toLowerCase().replace(/[’‘`]/g, "'").normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' '); }
function pluriel(n, un, des){ return n+' '+(n>1 ? des : un); }

/* ─────────── dates ─────────── */
const JOURS_FR=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MOIS_FR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function cleJour(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function cleMois(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function dateLib(ts){
  if(!ts) return '';
  const d=new Date(ts), j0=new Date(); j0.setHours(0,0,0,0); const j1=new Date(d); j1.setHours(0,0,0,0);
  const n=Math.round((j1-j0)/86400000);
  if(n===0) return 'aujourd’hui'; if(n===1) return 'demain'; if(n===-1) return 'hier';
  if(n>1 && n<7) return JOURS_FR[d.getDay()];
  return JOURS_FR[d.getDay()]+' '+d.getDate()+' '+MOIS_FR[d.getMonth()];
}
function dateCourte(ts){ const d=new Date(ts); return d.getDate()+' '+MOIS_FR[d.getMonth()]; }
function dureeEnMots(ms){
  const hrs=Math.round(ms/3600000);
  if(hrs<24) return pluriel(hrs, 'heure', 'heures');
  return pluriel(Math.round(hrs/24), 'jour', 'jours');
}
/* « ce soir », « jeudi », « cette semaine »… vers une échéance (repris de MAYND, 38-dossier-et-suivi.js). */
function parseQuand(s, base){
  const t=normaliser(s); if(!t) return null;
  const d=new Date(base||Date.now()); d.setHours(20,0,0,0);
  let m=t.match(/(\d{4})-(\d{2})-(\d{2})/); if(m) return new Date(+m[1], +m[2]-1, +m[3], 20).getTime();
  m=t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if(m){ const x=new Date(d); x.setMonth(+m[2]-1, +m[1]); if(x.getTime()<Date.now()-86400000) x.setFullYear(x.getFullYear()+1); return x.getTime(); }
  if(/apres-demain/.test(t)){ d.setDate(d.getDate()+2); return d.getTime(); }
  if(/demain/.test(t)){ d.setDate(d.getDate()+1); return d.getTime(); }
  if(/aujourd'hui|ce soir|ce matin|cet apres-midi|tout a l'heure|maintenant|tout de suite/.test(t)) return d.getTime();
  m=t.match(/dans (\d+) jours?/); if(m){ d.setDate(d.getDate()+(+m[1])); return d.getTime(); }
  for(let i=0;i<7;i++){ if(new RegExp('\\b'+JOURS_FR[i]+'\\b').test(t)){ const diff=(i-d.getDay()+7)%7; d.setDate(d.getDate()+diff); return d.getTime(); } }
  if(/semaine prochaine/.test(t)){ d.setDate(d.getDate()+7); return d.getTime(); }
  if(/week-?end/.test(t)){ const w=(6-d.getDay()+7)%7; d.setDate(d.getDate()+w); return d.getTime(); }
  if(/cette semaine|dans la semaine|d'ici la fin de la semaine/.test(t)){ const dim=(7-d.getDay())%7; d.setDate(d.getDate()+dim); return d.getTime(); }
  return null;
}

/* ─────────── couleurs ─────────── */
function teinteDe(hex, k){
  k=k==null?0.86:k;
  const n=parseInt(hex.slice(1), 16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function m(c){ return Math.round(c+(255-c)*k); }
  return 'rgb('+m(r)+','+m(g)+','+m(b)+')';
}
