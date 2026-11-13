/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — L'APPEL AU MODÈLE (13/11/2026)
   Repris de MAYND (37-consignes-v2.js) et du Tunnel. Trois blocs, du plus
   stable au plus changeant : le socle et la fiche (en cache), le dossier de la
   personne (en cache), la consigne du tour (jamais en cache).
   Réponses : claude-sonnet-5-5, effort bas, 2 000 jetons. Lecture des messages :
   claude-haiku-4-5. DeepSeek reste possible en démonstration.
   Prototype : la clé vit sur l'appareil. Le serveur prévu (docs/serveur.md)
   la détiendra, et ce fichier n'appellera plus que lui.
   ══════════════════════════════════════════════════════════════════════════ */

const URL_ANTHROPIC='https://api.anthropic.com/v1/messages';
const URL_DEEPSEEK='https://api.deepseek.com/chat/completions';
const SEP='\n\n';

function ficheDe(qui){
  const perso=etat.consignes && etat.consignes[qui];
  if(perso && perso.trim()) return perso;
  return qui==='mia' ? MIA_GUIDE : FICHES[qui]+SEP+NOTE_ACCOMPAGNANT;
}
function socleActif(){ return (etat.socle && etat.socle.trim()) ? etat.socle : SOCLE; }
function systeme(qui, tour){
  const fixe=socleActif()+SEP+SECURITE+SEP+ficheDe(qui);
  const blocs=[{type:'text', text:fixe, cache_control:{type:'ephemeral'}},
               {type:'text', text:dossierTexte(), cache_control:{type:'ephemeral'}}];
  if(tour) blocs.push({type:'text', text:tour});
  return blocs;
}
function texteSysteme(system){ return Array.isArray(system) ? system.map(function(b){ return b.text; }).join(SEP) : String(system||''); }

/* Le relais en cas de refus (« fallbacks ») est une fonction en test chez Anthropic : refusé une fois, il n'est plus demandé de la session. */
let sansRelais=false;
async function appeler(system, messages, maxTokens, opts){
  opts=opts||{};
  if(etat.fournisseur==='deepseek') return appelerDeepSeek(system, messages, maxTokens, opts);
  const modele=opts.modele||etat.modele||MODELE_REPONSE;
  const corps={model:modele, max_tokens:maxTokens||2000, system:system, messages:messages};
  if(!/haiku/.test(modele)) corps.output_config={effort:opts.effort||'low'};
  const ent={'content-type':'application/json', 'x-api-key':etat.cle, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true'};
  if(!sansRelais && !opts.sansRelais){ corps.fallbacks='default'; ent['anthropic-beta']='server-side-fallback-2026-07-01'; }
  let r=null;
  try{ r=await fetch(URL_ANTHROPIC, {method:'POST', headers:ent, body:JSON.stringify(corps)}); }catch(_){ r=null; }
  if(!r || r.status===400){
    let detail=''; if(r){ try{ detail=JSON.stringify(await r.json()); }catch(_){} }
    if(sansRelais || !corps.fallbacks || (r && !/fallback|beta/i.test(detail))){
      if(!r) throw new Error('réseau');
      const e400=new Error('http 400'); e400.status=400; throw e400;
    }
    sansRelais=true;
    delete corps.fallbacks; delete ent['anthropic-beta'];
    r=await fetch(URL_ANTHROPIC, {method:'POST', headers:ent, body:JSON.stringify(corps)});
  }
  if(!r.ok){ const e=new Error('http '+r.status); e.status=r.status; throw e; }
  const d=await r.json();
  if(d.stop_reason==='refusal') return {refus:true, texte:''};
  return {texte:(d.content||[]).filter(function(c){ return c.type==='text'; }).map(function(c){ return c.text; }).join('\n').trim()};
}
const DS_MODELES=['deepseek-flash','deepseek-v4-pro'];
async function appelerDeepSeek(system, messages, maxTokens, opts){
  const modele=DS_MODELES.indexOf(opts.modele)>=0 ? opts.modele : (DS_MODELES.indexOf(etat.modele)>=0 ? etat.modele : 'deepseek-flash');
  const reflexion=(modele==='deepseek-v4-pro'), tokens=maxTokens||2000;
  const r=await fetch(URL_DEEPSEEK, {method:'POST', headers:{'content-type':'application/json', 'authorization':'Bearer '+etat.cle},
    body:JSON.stringify({model:modele, max_tokens:reflexion?Math.max(tokens, 8000):tokens, thinking:{type:reflexion?'enabled':'disabled'},
      messages:[{role:'system', content:texteSysteme(system)}].concat(messages)})});
  if(!r.ok){ const e=new Error('http '+r.status); e.status=r.status; throw e; }
  const d=await r.json(); const c=(d.choices||[])[0];
  return {texte:((c && c.message && c.message.content)||'').trim()};
}
function messageErreur(err){
  const s=err && err.status;
  if(s===401 || s===403) return "La clé n'est pas reconnue. Vérifie-la dans les réglages.";
  if(s===429) return 'Trop de demandes en même temps. Réessaie dans 1 minute.';
  if(s>=500) return 'Le service est surchargé. Réessaie dans 1 minute.';
  if(s) return "La réponse n'est pas passée. Réessaie.";
  return "Pas de connexion. Vérifie ton accès à internet.";
}

/* ─────────── balises ─────────── */
const NOMS_SIGNAUX={stagnation:'stagnation', blocage:'blocage', desalignement:'désalignement', progression:'progression à consolider'};
function lireBalises(t){
  const res={invite:null, choix:null, actes:[], signaux:[], jeu:null, crise:false};
  let texte=String(t||'').replace(/\[\[\s*([A-Za-z]+)\s*(?::([^\]]*))?\]\]/g, function(_, k, v){
    k=k.toUpperCase(); v=String(v||'').trim();
    if(k==='INVITE' || k==='SUGGEST') res.invite=v.toLowerCase();
    else if(k==='CHOIX') res.choix=v.split('|').map(function(s){ return s.trim().slice(0, 40); }).filter(Boolean).slice(0, 3);
    else if(k==='ACTE'){ const p=v.split('|'); if(p[0].trim()) res.actes.push({quoi:p[0].trim().slice(0, 140), quand:(p[1]||'').trim().slice(0, 40)}); }
    else if(k==='SIGNAL'){
      let s=normaliser(v).replace(/[^a-z ]/g, '').trim();
      if(/^desalign/.test(s)) s='desalignement'; else if(/^progress/.test(s)) s='progression';
      if(NOMS_SIGNAUX[s]) res.signaux.push(s);
    }
    else if(k==='JEU'){ const id=v.toLowerCase(); if(AG[id]) res.jeu=id; }
    else if(k==='CRISE') res.crise=true;
    return '';
  });
  texte=texte.replace(/\[\[[^\]]*$/, '').replace(/^\s*\[[^\]\n]{1,20}\]\s*/, '').replace(/\n{3,}/g, '\n\n').trim();
  res.texte=texte;
  return res;
}
