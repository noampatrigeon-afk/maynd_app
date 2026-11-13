/* ══════════════════════════════════════════════════════════════════════════
   APP MIX — L'ÉTAT (13/11/2026)
   Un seul objet, en portée lexicale (let, jamais sur window), gardé dans
   localStorage sous la clé maynd.mix.v1. Rien n'est lu des deux autres
   applications, sauf la clé d'API de MAYND, et seulement si la personne le
   demande dans les réglages (clePremiereApp, 51-toi.js).
   Prototype : tout vit sur l'appareil. Le serveur prévu est décrit dans
   docs/serveur.md ; chaque champ marqué « serveur » y migrera tel quel.
   ══════════════════════════════════════════════════════════════════════════ */

const CLE_ETAT='maynd.mix.v1';
const VERSION_APP='Version 13/11 15:15';
const MODELE_REPONSE='claude-sonnet-5-5';
const MODELE_LECTURE='claude-haiku-4-5';
const QUOTA_GRATUIT_JOUR=5;
const QUOTA_MAYND_MOIS=700;
const PRIX_MAYND=60;

function etatVide(){
  return {
    v:1,
    /* le parcours d'entrée */
    etape:0, rep:{}, autres:{}, cr:{mia:{}, toi:{}}, fini:false,
    /* le compte (serveur) */
    compte:{courriel:'', empreinte:'', cree:0, acces:'', accesPlusTard:false},
    formule:'gratuit', paye:0,
    quota:{jour:'', n:0, mois:'', nMois:0},
    /* l'intérieur */
    onglet:'aujourdhui', lancements:0, vu:0,
    /* les discussions (serveur) : une avec MIA, les accompagnants la rejoignent */
    fil:[], presents:['mia'], actif:'mia',
    /* le dossier commun (serveur) : nourri par la lecture des messages */
    dossier:{situation:'', faits:[], personnes:[], aide:[], marchePas:[], facon:[], refusees:[], aVenir:[], pas:[], effaces:[], hypothese:null},
    signaux:[], alertes:[], humeurs:[],
    /* les jeux et la voix */
    jeux:{runs:[]}, voix:{reveillees:[], auto:false, usage:null},
    /* le professionnel référent (serveur) */
    pro:{nom:'', messages:[], feuilles:[], bilans:[], lu:0},
    /* réglages de l'appareil */
    cle:'', fournisseur:'anthropic', modele:MODELE_REPONSE, langue:'fr', socle:'', consignes:{}
  };
}
function chargerEtat(){
  const e=etatVide();
  try{
    const s=JSON.parse(localStorage.getItem(CLE_ETAT)||'null');
    if(s && s.v===1){
      Object.keys(s).forEach(function(k){
        if(e[k] && typeof e[k]==='object' && !Array.isArray(e[k]) && s[k] && typeof s[k]==='object') Object.assign(e[k], s[k]);
        else e[k]=s[k];
      });
    }
  }catch(_){}
  if(!e.presents.length) e.presents=['mia'];
  return e;
}
let etat=chargerEtat();
function garder(){ etat.vu=Date.now(); try{ localStorage.setItem(CLE_ETAT, JSON.stringify(etat)); }catch(_){} }
function reinitialiser(gardeCle){
  const cle=etat.cle, fournisseur=etat.fournisseur, modele=etat.modele;
  etat=etatVide();
  if(gardeCle){ etat.cle=cle; etat.fournisseur=fournisseur; etat.modele=modele; }
  garder();
}

/* ─────────── lectures courantes ─────────── */
function abonne(){ return etat.formule==='maynd'; }
function prenom(){ return String(etat.rep.prenom||'').trim(); }
function fem(){ return etat.rep.genre===1; }
function compteCree(){ return !!(etat.compte && etat.compte.courriel); }
