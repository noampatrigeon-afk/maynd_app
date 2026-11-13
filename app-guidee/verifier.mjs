// Vérification de bout en bout de l'application guidée, dans jsdom, avec un faux modèle.
// Lancer depuis la racine du dépôt : node app-guidee/verifier.mjs (jsdom vient de node_modules).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(path.join(REPO, 'package.json'));
const { JSDOM, VirtualConsole } = require('jsdom');

/* Scripts insérés dans la page, et adresse https : jsdom refuse le stockage local aux fichiers locaux. */
const dossierApp = path.join(REPO, 'app-guidee');
const html = fs.readFileSync(path.join(dossierApp, 'index.html'), 'utf8')
  .replace(/<link[^>]+>/g, '')
  .replace(/<script src="([^"]+)"><\/script>/g, (_, f) => '<script>' + fs.readFileSync(path.join(dossierApp, f), 'utf8') + '</script>');
const url = 'https://maynd.test/app-guidee/index.html?rapide';

let echecs = 0, verifs = 0;
function ok(c, m){ verifs++; if(!c){ echecs++; console.log('  ÉCHEC  ' + m); } }
const pause = ms => new Promise(r => setTimeout(r, ms));

const erreurs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if(!/Not implemented/.test(String(e.message))) erreurs.push(String(e.stack || e.message)); });
vc.on('error', e => erreurs.push(String(e)));

/* faux modèle : les réponses sont servies dans l'ordre du scénario */
const appels = [];
const scenario = [];
let refuserFallbackUneFois = false;
function reponseJSON(obj, status=200){ return { ok: status>=200 && status<300, status, json: async () => obj }; }

const dom = new JSDOM(html, {
  url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w){
    w.fetch = async (u, opts) => {
      const corps = JSON.parse(opts.body);
      appels.push({ u, headers: { ...opts.headers }, corps });
      if(refuserFallbackUneFois && corps.fallbacks){ refuserFallbackUneFois = false; return reponseJSON({type:'error', error:{type:'invalid_request_error', message:'fallbacks: unknown parameter'}}, 400); }
      const texte = scenario.length ? scenario.shift() : 'Réponse par défaut.';
      return reponseJSON({ content: [{ type: 'text', text: texte }], stop_reason: 'end_turn' });
    };
  }
});
const w = dom.window, d = w.document;
await pause(50);

function clic(sel){ const b = typeof sel === 'string' ? d.querySelector(sel) : sel; if(!b) throw new Error('introuvable : ' + sel); b.click(); }
async function etape(){ await pause(15); }
function brut(){ return d.getElementById('ecran').textContent + '\n' + d.getElementById('panneau').textContent; }
function visible(){ return brut().replace(/ /g, ' '); }
const textes = [], espacesOrdinaires = [];
function noter(){ const b = brut(); const m = b.match(/.{0,20} [?!:;»]/g); if(m) espacesOrdinaires.push(...m); textes.push(visible()); }
function saisir(champ, valeur){ champ.value = valeur; champ.dispatchEvent(new w.Event('input', { bubbles: true })); }
function carte(id){ return d.querySelector('.cr-carte[data-section="' + id + '"]'); }
function texteCarte(id){ const c = carte(id); return c ? c.textContent.replace(/ /g, ' ') : ''; }

const MODULES = w.MODULES, TOTAL = MODULES.reduce((n, m) => n + m.questions.length, 0);

/* ── seuil et MIA ── */
noter();
ok(/MAYND/.test(visible()) && d.querySelector('[data-action="commencer"]'), 'le seuil propose « Commencer »');
clic('[data-action="commencer"]'); await etape(); noter();
const duree = visible().match(/(\d+) étapes, (\d+) questions, environ (\d+) minutes/);
ok(duree && +duree[1] === MODULES.length && +duree[2] === TOTAL, 'MIA annonce le bon nombre d\'étapes et de questions : ' + (duree || [''])[0]);
ok(/« Autre » ou « Je ne sais pas » sont là/.test(visible()), 'MIA prévient qu\'on peut répondre « Autre » ou « Je ne sais pas »');
clic('[data-action="suivant"]'); await etape();

/* ── les questions, puis le compte-rendu ── */
let tours = 0, titresSansQuestion = [], retourTeste = false, barreVue = false, compteTeste = false;
const titresVus = new Set();
while(!d.getElementById('fil') && tours++ < 260){
  noter();
  const titreEl = d.querySelector('.q-titre');
  const titre = titreEl ? titreEl.textContent.replace(/ /g, ' ') : '';
  if(titre){
    titresVus.add(titre);
    if(!/\?\s*$/.test(titre)) titresSansQuestion.push(titre);
    if(!barreVue){ barreVue = true; ok(d.querySelector('.barre') && !/pause/i.test(d.querySelector('.barre').textContent), 'la barre du haut n\'affiche plus « Pause »'); }
    if(titresVus.size === 8 && !retourTeste){
      retourTeste = true;
      clic('[data-action="retour"]'); await etape();
      const apres = (d.querySelector('.q-titre') || {}).textContent || '';
      ok(apres && apres.replace(/ /g, ' ') !== titre, 'le bouton retour ramène à la question précédente');
      continue;
    }
  }
  const champ = d.getElementById('champ');
  const q = (d.querySelector('[data-q]') || {}).dataset ? d.querySelector('[data-q]').dataset.q : null;

  if(d.querySelector('.ecran-document .cr-liste') && !compteTeste){
    compteTeste = true;
    ok(d.querySelectorAll('.ecran-document .cr-carte').length === w.SECTIONS_CR.length, 'le compte-rendu a ses ' + w.SECTIONS_CR.length + ' parties');
    const tout = visible();
    ok(/Je change de vie/.test(tout), 'une réponse « Autre » à choix unique entre dans le compte-rendu');
    ok(/Mon déménagement/.test(tout), 'une réponse « Autre » à choix multiples entre dans le compte-rendu');
    ok(/Avoir repris le piano/.test(tout), 'une réponse écrite entre dans le compte-rendu');
    ok(/Tes appuis :/.test(texteCarte('appuis')) && /Tes points de vigilance :/.test(texteCarte('appuis')), 'appuis et points de vigilance');
    ok(/Tu travailles dans un bureau/.test(texteCarte('situation')), 'ce que la personne fait dans la vie');
    ok(/nouveau pour toi/.test(texteCarte('echange')), 'le niveau de connaissance règle la façon de parler');
    ok(!/Tes émotions/.test(texteCarte('fonctionnement')), '« Je ne sais pas » ne fabrique aucune phrase');
    const horsCitations = [...d.querySelectorAll('.ecran-document .cr-texte')].map(e => e.textContent).join(' ').replace(/ /g, ' ').replace(/«[^»]*»/g, '');
    const premiere = horsCitations.match(/(^|[\s(,;:«])(mon|ma|mes|je)(?=[\s,.;:!?)»])|(^|[\s(«])j['’]/gi);
    ok(!premiere, 'le compte-rendu parle à la deuxième personne, hors citations : ' + (premiere || []).slice(0, 5).join(' / '));
    ok(!/\.\s*»\s*\./.test(tout), 'pas de double point après une citation');
    ok(/occupe ta tête : ton sommeil/.test(texteCarte('situation')), 'les choix multiples sont repris à la deuxième personne');
    /* corriger, enregistrer */
    clic('[data-action="cr-corriger"][data-id="reactions"]'); await etape();
    const zone = d.getElementById('cr-champ-reactions');
    ok(zone && zone.value.length > 20, 'la correction part du texte existant');
    saisir(zone, 'Sous pression, je cours avant de réfléchir.');
    clic('[data-action="cr-enregistrer"][data-id="reactions"]'); await etape();
    ok(/Sous pression, je cours avant de réfléchir\./.test(texteCarte('reactions')) && /Corrigé par toi/.test(texteCarte('reactions')), 'la correction s\'affiche, marquée « Corrigé par toi »');
    /* corriger, annuler */
    const avantCap = texteCarte('cap');
    clic('[data-action="cr-corriger"][data-id="cap"]'); await etape();
    saisir(d.getElementById('cr-champ-cap'), 'Rien du tout.');
    clic('[data-action="cr-annuler"][data-id="cap"]'); await etape();
    ok(texteCarte('cap') === avantCap, 'annuler ne change rien');
    clic('[data-action="suivant"]'); await etape();
    continue;
  }

  if(d.querySelector('[data-action="choix"]')){
    if(q === 'periode'){
      clic('[data-action="choix-autre"]'); await etape();
      saisir(d.getElementById('champ-autre'), 'Je change de vie');
      clic('[data-action="valider-autre"]');
    } else {
      const i = q === 'genre' ? 1 : q === 'echec' ? 1 : q === 'activite' ? 2 : 0;
      clic(d.querySelectorAll('[data-action="choix"]')[i]);
    }
  } else if(d.querySelector('[data-action="multi"]')){
    const opts = [...d.querySelectorAll('[data-action="multi"]')].filter(o => o.dataset.i !== '-1');
    const libres = () => opts.filter(o => !o.classList.contains('choisi'));
    if(q === 'sujets' && !d.querySelector('.opt.choisi')){
      clic(opts.find(o => /Mon sommeil/.test(o.textContent)));
      clic('[data-action="multi"][data-i="-1"]'); await etape();
      ok(!d.getElementById('autre').hidden, '« Autre » ouvre un champ libre dans un choix multiple');
      saisir(d.getElementById('champ-autre'), 'Mon déménagement');
    }
    while(d.querySelectorAll('.opt.choisi').length < 3) clic(libres()[0]);
    clic(libres()[0]);  // au-delà du maximum : ignoré
    ok(d.querySelectorAll('.opt.choisi').length === 3, 'le choix multiple s\'arrête à 3');
    clic('[data-action="suivant-multi"]');
  } else if(d.querySelector('[data-action="echelle"]')){
    if(q === 'emotions') clic('[data-action="nsp"]');
    else clic('[data-action="echelle"][data-v="4"]');
  } else if(d.querySelector('[data-action="note"]')){
    clic('[data-action="note"][data-v="7"]');
  } else if(d.querySelector('[data-action="valider-boussole"]')){
    d.querySelector('.curseur input[data-k="sommeil"]').value = '3';
    clic('[data-action="valider-boussole"]');
  } else if(champ){
    const qt = d.querySelector('[data-action="valider-texte"]').dataset.q;
    if(qt === 'prenom'){
      ok(d.querySelector('[data-action="valider-texte"]').disabled, 'le prénom est obligatoire');
      saisir(champ, 'Léa');
      ok(!d.querySelector('[data-action="valider-texte"]').disabled, 'le bouton s\'active dès qu\'un prénom est écrit');
    } else if(qt === 'cap'){
      ok(d.querySelectorAll('[data-action="idee"]').length > 0, 'des idées de cap sont proposées');
      clic('[data-action="idee"]');
    } else if(qt === 'fierte'){
      champ.value = 'Avoir repris le piano.';
    } else {
      clic('[data-action="passer"]'); await etape(); continue;
    }
    clic('[data-action="valider-texte"]');
  } else if(d.querySelector('[data-action="suivant"]')){
    clic('[data-action="suivant"]');
  } else {
    throw new Error('écran inconnu : ' + visible().slice(0, 200));
  }
  await etape();
}
ok(d.getElementById('fil'), 'le tunnel mène à la discussion');
ok(compteTeste, 'le compte-rendu fait partie du tunnel');
const attendus = [];
MODULES.forEach(m => m.questions.forEach(qq => attendus.push(qq.titre)));
const versions = t => [t.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, '$2'), t.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, '$1')];
const manquants = attendus.filter(t => !versions(t).some(v => titresVus.has(v)));
ok(manquants.length === 0, 'les ' + TOTAL + ' questions sont posées, manquantes : ' + manquants.join(' / '));
ok(titresSansQuestion.length === 0, 'chaque question finit par « ? » : ' + titresSansQuestion.join(' / '));

/* chaque question à choix propose assez de réponses, et « Autre » quand c'est utile */
const courts = [];
MODULES.forEach(m => m.questions.forEach(qq => { if(qq.type === 'choix' && qq.id !== 'genre' && qq.options.length < 4) courts.push(qq.id); }));
ok(courts.length === 0, 'au moins 4 réponses par question à choix : ' + courts.join(', '));

const tout = textes.join('\n');
ok(/Ce que je retiens/.test(tout), 'les restitutions « Ce que je retiens » sont affichées');
ok(/Ton profil MAYND/.test(tout), 'le profil est affiché');
ok(/(La |L’|L')(Relieuse|Stratège|Fédératrice|Bâtisseuse|Tacticienne|Médiatrice|Observatrice|Sage|Veilleuse|Ancre)|Le (Moteur|Pilier)/.test(tout), 'le nom du profil est accordé');
ok(/Me sentir seule/.test(tout) && !/Me sentir seul[^e]/.test(tout), 'accord au féminin dans les réponses');
ok(/Je suis nulle/.test(tout), 'accord au féminin entre guillemets');
ok(!/\{[^{}]*\|[^{}]*\}/.test(tout), 'aucune paire {masculin|féminin} non résolue');
ok(/Quelqu'un veille sur ton parcours/.test(tout) && /Aucun rendez-vous à prendre/.test(tout), 'l\'écran du professionnel référent');
ok(/Stagnation/.test(tout) && /Blocage/.test(tout) && /Désalignement/.test(tout) && /Progression à consolider/.test(tout), 'les quatre signaux, et seulement eux');
ok(/Ton équipe/.test(tout) && /Miro/.test(tout), 'l\'équipe pressentie contient Miro (sommeil à 3)');

/* ── la discussion, sans clé ── */
await pause(30);
ok(/j'ai lu tout ton parcours/i.test(d.getElementById('fil').textContent), 'sans clé, MIA accueille quand même');
ok(d.querySelector('.carte-cle'), 'sans clé, la carte des réglages s\'affiche');
ok(appels.length === 0, 'aucun appel réseau sans clé');

clic('[data-action="menu"]'); await etape();
clic('#panneau [data-action="reglages"]'); await etape();
d.getElementById('cle').value = 'sk-ant-test';
clic('[data-action="cle-enregistrer"]'); await etape();

/* message 1 : MIA répond avec des choix ; le relais refusé est abandonné */
scenario.push("Léa, tes nuits pèsent sur tout le reste.\nOn commence par l'heure où tu te réveilles ?\n[[CHOIX:Oui|Plutôt le soir]]");
refuserFallbackUneFois = true;
d.getElementById('message').value = 'Je me réveille à 4 h chaque nuit.';
clic('[data-action="envoyer"]'); await pause(60);
ok(appels.length === 2, 'un refus du relais « fallbacks » relance sans lui : ' + appels.length + ' appels');
const a1 = appels[0].corps, a2 = appels[1].corps;
ok(a1.model === 'claude-sonnet-5-5' && a1.max_tokens === 2000 && a1.output_config && a1.output_config.effort === 'low', 'modèle, longueur, effort');
ok(a1.fallbacks === 'default' && appels[0].headers['anthropic-beta'] === 'server-side-fallback-2026-07-01', 'relais en cas de refus demandé');
ok(!a2.fallbacks && !appels[1].headers['anthropic-beta'], 'relance sans le relais');
const nAvant = appels.length;
ok(Array.isArray(a1.system) && a1.system.length === 3 && a1.system[0].cache_control && a1.system[1].cache_control && !a1.system[2].cache_control, 'trois blocs, les deux premiers en cache');
ok(/SOCLE COMMUN MAYND/.test(a1.system[0].text) && /3114/.test(a1.system[0].text) && /Tu es MIA/.test(a1.system[0].text), 'socle, sécurité et fiche de MIA');
ok(/prénom : Léa/.test(a1.system[1].text) && /la personne est une femme/.test(a1.system[1].text), 'le dossier contient le parcours');
ok(/Sous pression, je cours avant de réfléchir\./.test(a1.system[1].text) && /Comment tu réagis » \(corrigée par la personne\)/.test(a1.system[1].text), 'MIA reçoit la version corrigée, marquée comme telle');
ok(/sa version fait foi/.test(a1.system[1].text), 'la version corrigée fait foi');
ok(/parle simplement, sans jargon/.test(a1.system[1].text), 'MIA sait que la personne découvre ces sujets');
ok(a1.messages[a1.messages.length-1].role === 'user', 'le dernier message envoyé est celui de la personne');
ok(d.querySelectorAll('.choix-b').length === 2, 'les choix s\'affichent en boutons');
ok(!/\[\[/.test(d.getElementById('fil').textContent), 'aucune balise visible');

/* message 2 : MIA fait venir Miro, qui pose un pas et un signal */
scenario.push("Je fais venir Miro.\n[[INVITE:miro]]");
scenario.push("[Miro] Moi c'est Miro. Ce soir, pose ton téléphone hors de la chambre à 22 h.\n[[ACTE:Téléphone hors de la chambre|ce soir]]\n[[SIGNAL:progression]]");
clic('.choix-b'); await pause(80);
const fil = d.getElementById('fil').textContent;
ok(appels.slice(nAvant).every(a => !a.corps.fallbacks), 'le relais refusé n\'est plus redemandé');
ok(/Miro rejoint la discussion/.test(fil), 'Miro rejoint la discussion');
ok(/Moi c'est Miro/.test(fil) && !/\[Miro\]/.test(fil), 'Miro répond, sans préfixe');
const dernier = appels[appels.length-1].corps;
ok(/Tu es Miro/.test(dernier.system[0].text) && /MIA vient de te faire venir/.test(dernier.system[2].text), 'Miro reçoit sa fiche et la consigne d\'arrivée');
ok(dernier.messages.some(m => m.role === 'assistant' && /^\[MIA\]/.test(m.content)), 'Miro voit les messages de MIA, préfixés');
ok(d.querySelector('.carte-pas') && /Téléphone hors de la chambre/.test(d.querySelector('.carte-pas').textContent), 'le pas daté s\'affiche');
ok(d.querySelector('.carte-signal') && /progression à consolider/.test(d.querySelector('.carte-signal').textContent), 'le signal est transmis');
ok(/Écris à Miro/.test(d.getElementById('message').placeholder), 'la saisie s\'adresse à Miro');

/* message 3 : risque */
scenario.push("Je suis là. Appelle le 3114 maintenant. Tu es en sécurité, là ?\n[[CRISE]]");
d.getElementById('message').value = "J'ai envie de mourir.";
clic('[data-action="envoyer"]'); await pause(60);
ok(d.querySelectorAll('.carte-crise').length === 1, 'une seule carte de crise, même si le modèle la demande aussi');
ok(/3114/.test(d.querySelector('.carte-crise').textContent) && /09 72 39 40 50/.test(d.querySelector('.carte-crise').textContent), 'les numéros sont affichés');
ok(/Sécurité/.test(appels[appels.length-1].corps.system[2].text), 'la consigne du tour applique le protocole');

clic('[data-action="pas-fait"]'); await etape();
ok(d.querySelector('.carte-pas.fait'), 'le pas peut être marqué fait');

/* le compte-rendu, réécrit par MIA, sans toucher à la partie corrigée */
scenario.push(w.SECTIONS_CR.filter(s => s.id !== 'reactions').map(s => '[[SECTION:' + s.id + ']]\nPartie ' + s.id + ' écrite par MIA.').join('\n'));
const nCr = appels.length;
clic('[data-action="menu"]'); await etape();
clic('#panneau [data-action="cr-ouvrir"]'); await pause(80);
const appelCr = appels[nCr];
ok(appelCr && appelCr.corps.max_tokens === 4000 && /\[\[SECTION:situation\]\]/.test(appelCr.corps.system[2].text) && !/\[\[SECTION:reactions\]\]/.test(appelCr.corps.system[2].text), 'MIA réécrit le compte-rendu, sauf la partie corrigée');
ok(/Partie situation écrite par MIA\./.test(texteCarte('situation')), 'la version de MIA s\'affiche');
ok(/Sous pression, je cours avant de réfléchir\./.test(texteCarte('reactions')), 'la correction de la personne n\'est jamais écrasée');
clic('[data-action="cr-retablir"][data-id="reactions"]'); await etape();
ok(!/je cours avant de réfléchir/.test(texteCarte('reactions')) && !/Corrigé par toi/.test(texteCarte('reactions')), 'on peut revenir au texte d\'origine');
noter();
clic('#panneau [data-action="fermer"]'); await etape();

/* état gardé */
const garde = JSON.parse(w.localStorage.getItem('maynd.guide.v1'));
ok(garde && garde.fini && garde.rep.prenom === 'Léa' && garde.fil.length > 5 && garde.cr && garde.cr.mia.situation, 'tout est gardé sur l\'appareil, compte-rendu compris');
ok(w.localStorage.getItem('maynd.state.v7') === null, 'la première application n\'est pas touchée');

/* pause dans la discussion */
clic('[data-action="menu"]'); await etape();
clic('#panneau [data-action="pause"]'); await etape();
ok(/À plus tard, Léa/.test(d.getElementById('panneau').textContent), 'la pause invite à revenir');
noter();

/* ── règles d'écriture sur tout ce qui s'est affiché ── */
const affiche = textes.join('\n') + '\n' + visible();
const interdits = affiche.match(/th[ée]rapie|\bpatient|diagnostic|psychologue|sant[ée] mentale|s[ée]ance|d[ée]bloqu|\bvoici\b/gi);
ok(!interdits, 'aucun mot proscrit : ' + (interdits || []).join(', '));
const rdv = affiche.match(/.{0,8}rendez-vous/gi) || [];
ok(rdv.every(s => /sans |Aucun /i.test(s)), 'rendez-vous seulement pour dire qu\'il n\'y en a pas : ' + rdv.join(' / '));
const anglais = affiche.match(/\b(ok|feedback|coach|challenge|scroll|feeling|cash|check|mindset|burn-?out|coaching)\b/gi);
ok(!anglais, 'aucun mot anglais : ' + (anglais || []).join(', '));
ok(espacesOrdinaires.length === 0, 'espace insécable avant ? ! : ; » partout : ' + espacesOrdinaires.slice(0, 5).join(' / '));

/* ── feuille de style ── */
const css = fs.readFileSync(path.join(REPO, 'app-guidee', 'style.css'), 'utf8');
ok(!/gradient/i.test(css), 'aucun dégradé dans la feuille de style');
ok(!/\.ecran[^{]*\{[^}]*display\s*:\s*none/.test(css), 'les écrans ne sont jamais masqués par display:none');

ok(erreurs.length === 0, 'aucune erreur : ' + erreurs.join('\n'));
console.log(`\n${verifs} vérifications, ${echecs} échec${echecs > 1 ? 's' : ''}`);
w.close();
process.exit(echecs ? 1 : 0);
