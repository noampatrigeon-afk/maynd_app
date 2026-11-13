// APP MIX — vérification de bout en bout dans jsdom, avec un faux modèle.
// Lancer depuis la racine du dépôt : node app-mix/verifier.mjs (jsdom vient de node_modules).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(path.join(REPO, 'package.json'));
const { JSDOM, VirtualConsole } = require('jsdom');
const dossierApp = path.join(REPO, 'app-mix');

/* La page, scripts insérés, à une adresse https : jsdom refuse le stockage local aux fichiers locaux. */
const html = fs.readFileSync(path.join(dossierApp, 'index.html'), 'utf8')
  .replace(/<link[^>]+>/g, '')
  .replace(/<script src="([^"]+)"><\/script>/g, (_, f) => '<script>\n' + fs.readFileSync(path.join(dossierApp, f), 'utf8') + '\n</script>');

let echecs = 0, verifs = 0;
function ok(c, m){ verifs++; if(!c){ echecs++; console.log('  ÉCHEC  ' + m); } }
const pause = ms => new Promise(r => setTimeout(r, ms));

const erreurs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if(!/Not implemented/.test(String(e.message))) erreurs.push(String(e.stack || e.message)); });
vc.on('error', e => erreurs.push(String(e)));

const appels = [], scenario = [];
let refuserFallbackUneFois = false;
function reponseJSON(obj, status=200){ return { ok: status>=200 && status<300, status, json: async () => obj }; }
function faireDom(stockage){
  return new JSDOM(html, {
    url: 'https://maynd.test/app-mix/index.html?rapide', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w){
      if(stockage) Object.keys(stockage).forEach(k => w.localStorage.setItem(k, stockage[k]));
      w.fetch = async (u, opts) => {
        const corps = JSON.parse(opts.body);
        appels.push({ u, headers: { ...opts.headers }, corps });
        if(refuserFallbackUneFois && corps.fallbacks){ refuserFallbackUneFois = false; return reponseJSON({type:'error', error:{type:'invalid_request_error', message:'fallbacks: unknown parameter'}}, 400); }
        const texte = scenario.length ? scenario.shift() : 'Réponse par défaut.';
        return reponseJSON({ content: [{ type: 'text', text: texte }], stop_reason: 'end_turn' });
      };
    }
  });
}
let dom = faireDom(null), w = dom.window, d = w.document;
await pause(60);

function clic(sel){ const b = typeof sel === 'string' ? d.querySelector(sel) : sel; if(!b) throw new Error('introuvable : ' + sel); b.click(); }
async function etape(){ await pause(15); }
/* Ce que la personne voit : l'écran, le panneau s'il est ouvert, le plein écran s'il est ouvert. */
function brut(){
  return d.getElementById('ecran').textContent
    + (d.getElementById('couche').classList.contains('ouverte') ? '\n' + d.getElementById('panneau').textContent : '')
    + (d.getElementById('plein').classList.contains('ouvert') ? '\n' + d.getElementById('plein').textContent : '');
}
function visible(){ return brut().replace(/ /g, ' '); }
const textes = [], espacesOrdinaires = [];
function noter(){ const b = brut(); const m = b.match(/.{0,20} [?!:;»]/g); if(m) espacesOrdinaires.push(...m); textes.push(visible()); }
function saisir(champ, valeur){ champ.value = valeur; champ.dispatchEvent(new w.Event('input', { bubbles: true })); }
function carte(id){ return d.querySelector('.cr-carte[data-section="' + id + '"]'); }
function texteCarte(id){ const c = carte(id); return c ? c.textContent.replace(/ /g, ' ') : ''; }
function fil(){ return (d.getElementById('fil') || {textContent:''}).textContent.replace(/ /g, ' '); }

const MODULES = w.MODULES, TOTAL = MODULES.reduce((n, m) => n + m.questions.length, 0), DUREE_TEST = 0;

/* ── seuil et MIA ── */
noter();
ok(/MAYND/.test(visible()) && d.querySelector('[data-action="commencer"]'), 'le seuil propose « Commencer »');
clic('[data-action="commencer"]'); await etape(); noter();
const duree = visible().match(/(\d+) étapes, (\d+) questions, environ (\d+) minutes/);
ok(duree && +duree[1] === MODULES.length && +duree[2] === TOTAL, 'MIA annonce le bon nombre d\'étapes et de questions : ' + (duree || [''])[0]);
clic('[data-action="suivant"]'); await etape();

/* ── les questions, le profil flouté, le compte, le compte-rendu ── */
let tours = 0, titresSansQuestion = [], retourTeste = false, compteTeste = false, profilTeste = false;
const titresVus = new Set();
while(!d.querySelector('[data-action="terminer"]') && tours++ < 300){
  noter();
  const titreEl = d.querySelector('.q-titre');
  const titre = titreEl ? titreEl.textContent.replace(/ /g, ' ') : '';
  if(titre){
    titresVus.add(titre);
    if(!/\?\s*$/.test(titre)) titresSansQuestion.push(titre);
    if(titresVus.size === 1) ok(!/pause/i.test(d.querySelector('.barre').textContent), 'la barre du haut n\'affiche pas « Pause »');
    if(titresVus.size === 8 && !retourTeste){
      retourTeste = true;
      clic('[data-action="retour"]'); await etape();
      const apres = (d.querySelector('.q-titre') || {}).textContent || '';
      ok(apres && apres.replace(/ /g, ' ') !== titre, 'le bouton retour ramène à la question précédente');
      continue;
    }
  }
  const champ = d.getElementById('champ');
  const q = d.querySelector('[data-q]') ? d.querySelector('[data-q]').dataset.q : null;

  if(d.getElementById('compte-form') && !profilTeste){
    profilTeste = true;
    ok(d.querySelector('.centre.profil.voile') && d.getElementById('profil-carte').getAttribute('aria-hidden') === 'true', 'le profil est flouté derrière le compte');
    ok(/crée ton compte pour voir ton résultat/i.test(visible()), 'l\'invitation à créer son compte');
    ok(!/débloqu/i.test(visible()), 'jamais « débloquer »');
    ok(!d.querySelector('[data-action="suivant"]'), 'impossible de continuer sans compte');
    const b = d.getElementById('c-creer');
    ok(b.disabled, 'le bouton attend un courriel et un mot de passe');
    saisir(d.getElementById('c-courriel'), 'lea@exemple');
    saisir(d.getElementById('c-mdp'), '12345678');
    ok(b.disabled, 'un courriel incomplet ne suffit pas');
    saisir(d.getElementById('c-courriel'), 'lea@exemple.fr');
    ok(!b.disabled, 'courriel et mot de passe valides activent le bouton');
    d.getElementById('compte-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await pause(60);
    const garde = JSON.parse(w.localStorage.getItem('maynd.mix.v1'));
    ok(garde.compte.courriel === 'lea@exemple.fr' && garde.compte.empreinte && garde.compte.empreinte !== '12345678', 'le compte est gardé, le mot de passe jamais en clair');
    ok(!d.querySelector('.centre.profil.voile') && d.querySelector('#profil-carte [data-action="suivant"]'), 'le voile se lève et « Continuer » apparaît');
    ok(/Ton profil MAYND/.test(visible()), 'le profil est affiché');
    clic('#profil-carte [data-action="suivant"]'); await etape();
    continue;
  }
  if(d.querySelector('.ecran-document .cr-liste') && !compteTeste){
    compteTeste = true;
    ok(d.querySelectorAll('.ecran-document .cr-carte').length === w.SECTIONS_CR.length, 'le compte-rendu a ses ' + w.SECTIONS_CR.length + ' parties');
    const tout = visible();
    ok(/Je change de vie/.test(tout) && /Mon déménagement/.test(tout) && /Avoir repris le piano/.test(tout), 'les réponses libres entrent dans le compte-rendu');
    ok(/Tes appuis :/.test(texteCarte('appuis')) && /Tes points de vigilance :/.test(texteCarte('appuis')), 'appuis et points de vigilance');
    const horsCitations = [...d.querySelectorAll('.ecran-document .cr-texte')].map(e => e.textContent).join(' ').replace(/ /g, ' ').replace(/«[^»]*»/g, '');
    const premiere = horsCitations.match(/(^|[\s(,;:«])(mon|ma|mes|je)(?=[\s,.;:!?)»])|(^|[\s(«])j['’]/gi);
    ok(!premiere, 'le compte-rendu parle à la deuxième personne, hors citations : ' + (premiere || []).slice(0, 5).join(' / '));
    clic('[data-action="cr-corriger"][data-id="reactions"]'); await etape();
    saisir(d.getElementById('cr-champ-reactions'), 'Sous pression, je cours avant de réfléchir.');
    clic('[data-action="cr-enregistrer"][data-id="reactions"]'); await etape();
    ok(/je cours avant de réfléchir\./.test(texteCarte('reactions')) && /Corrigé par toi/.test(texteCarte('reactions')), 'la correction s\'affiche, marquée « Corrigé par toi »');
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
      saisir(d.getElementById('champ-autre'), 'Mon déménagement');
    }
    while(d.querySelectorAll('.opt.choisi').length < 3) clic(libres()[0]);
    clic('[data-action="suivant-multi"]');
  } else if(d.querySelector('[data-action="echelle"]')){
    if(q === 'emotions') clic('[data-action="nsp"]'); else clic('[data-action="echelle"][data-v="4"]');
  } else if(d.querySelector('[data-action="note"]')){
    clic('[data-action="note"][data-v="7"]');
  } else if(d.querySelector('[data-action="valider-boussole"]')){
    d.querySelector('.curseur input[data-k="sommeil"]').value = '3';
    clic('[data-action="valider-boussole"]');
  } else if(champ){
    const qt = d.querySelector('[data-action="valider-texte"]').dataset.q;
    if(qt === 'prenom'){ saisir(champ, 'Léa'); }
    else if(qt === 'cap'){ ok(d.querySelectorAll('[data-action="idee"]').length > 0, 'des idées de cap sont proposées'); clic('[data-action="idee"]'); }
    else if(qt === 'fierte'){ champ.value = 'Avoir repris le piano.'; }
    else { clic('[data-action="passer"]'); await etape(); continue; }
    clic('[data-action="valider-texte"]');
  } else if(d.querySelector('[data-action="suivant"]')){
    clic('[data-action="suivant"]');
  } else {
    throw new Error('écran inconnu : ' + visible().slice(0, 200));
  }
  await etape();
}
ok(profilTeste && compteTeste, 'le profil flouté et le compte-rendu font partie du parcours');
const attendus = []; MODULES.forEach(m => m.questions.forEach(qq => attendus.push(qq.titre)));
const versions = t => [t.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, '$2'), t.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, '$1')];
const manquants = attendus.filter(t => !versions(t).some(v => titresVus.has(v)));
ok(manquants.length === 0, 'les ' + TOTAL + ' questions sont posées, manquantes : ' + manquants.join(' / '));
ok(titresSansQuestion.length === 0, 'chaque question finit par « ? » : ' + titresSansQuestion.join(' / '));
ok(/pas seulement entre les mains d’une intelligence artificielle/.test(textes.join('\n')), 'l\'écran du professionnel dit qu\'il est humain');
ok(/Stagnation/.test(textes.join('\n')) && /Progression à consolider/.test(textes.join('\n')), 'les quatre signaux');

/* ── la discussion, en gratuit, sans clé ── */
clic('[data-action="terminer"]'); await pause(60); noter();
ok(d.getElementById('fil') && d.querySelector('.nav-b.actif[data-nom="discussion"]'), 'le parcours mène à l\'onglet Discussion');
ok(/j’ai lu tout ton parcours/i.test(fil()) && d.querySelector('.carte-cle'), 'sans clé, MIA accueille et la carte des réglages s\'affiche');
ok(appels.length === 0, 'aucun appel réseau sans clé');

/* clé */
clic('[data-action="menu-discussion"]'); await etape();
clic('#panneau [data-action="reglages"]'); await etape();
ok(/Formule : gratuite/.test(visible()), 'les réglages montrent la formule gratuite');
d.getElementById('cle').value = 'sk-ant-test';
clic('[data-action="cle-enregistrer"]'); await etape();

/* message 1 : MIA répond ; relais refusé puis abandonné ; puis la lecture différée (30 ms en mode rapide) */
const LECTURE = '{"risque":0,"signal":null,"phase":"comprendre","besoin":"ecoute","energie":"normale","demande_precise":false,"information_manquante":"deja_essaye","terrain":"miro","pas_evoques":[],"faits_nouveaux":["Elle se réveille à 4 h chaque nuit."],"a_venir":[],"hypothese_refusee":null}';
scenario.push("Léa, tes nuits pèsent sur tout le reste.\nOn commence par l'heure où tu te réveilles ?\n[[CHOIX:Oui|Plutôt le soir]]", LECTURE);
refuserFallbackUneFois = true;
d.getElementById('message').value = 'Je me réveille à 4 h chaque nuit.';
clic('[data-action="envoyer"]'); await pause(120);
const sonnet = () => appels.filter(a => a.corps.model === 'claude-sonnet-5-5');
ok(sonnet().length === 2 && sonnet()[0].corps.fallbacks === 'default' && !sonnet()[1].corps.fallbacks, 'le relais refusé est abandonné');
const a1 = sonnet()[0].corps;
ok(a1.model === 'claude-sonnet-5-5' && a1.max_tokens === 2000 && a1.output_config.effort === 'low', 'modèle, longueur, effort');
ok(a1.system.length === 3 && a1.system[0].cache_control && a1.system[1].cache_control && !a1.system[2].cache_control, 'trois blocs, deux en cache');
ok(/SOCLE COMMUN MAYND/.test(a1.system[0].text) && /3114/.test(a1.system[0].text) && /Tu es MIA/.test(a1.system[0].text) && /\[\[JEU:/.test(a1.system[0].text), 'socle, sécurité, fiche de MIA avec les jeux');
ok(/prénom : Léa/.test(a1.system[1].text) && /Comment tu réagis » \(corrigée par la personne\)/.test(a1.system[1].text) && /formule : gratuite/.test(a1.system[1].text), 'le dossier : parcours, correction, formule');
ok(/Moment :/.test(a1.system[2].text) && /Formule gratuite/.test(a1.system[2].text) && /longueur : très courte/.test(a1.system[2].text), 'la consigne du tour : moment, gratuit, longueur choisie');
ok(d.querySelectorAll('.choix-b').length === 2 && !/\[\[/.test(fil()), 'les choix en boutons, aucune balise visible');
const lecture = appels.filter(a => a.corps.model === 'claude-haiku-4-5').pop().corps;
ok(lecture.model === 'claude-haiku-4-5' && /Tu lis, pour l'équipe MAYND/.test(lecture.system) && !lecture.fallbacks, 'la lecture différée part sur Haiku, sans relais');
const g1 = JSON.parse(w.localStorage.getItem('maynd.mix.v1'));
ok(g1.dossier.faits.length === 1 && /4 h/.test(g1.dossier.faits[0]), 'la lecture nourrit le dossier');

/* message 2 : MIA veut faire venir Miro ; en gratuit, c'est la formule */
scenario.push("Sur ça, Miro est très fort. Je le fais venir.\n[[INVITE:miro]]", LECTURE.replace('"signal":null', '"signal":null'));
clic('.choix-b'); await pause(120);
ok(d.querySelector('.carte-formule') && /Miro fait partie de l’abonnement MAYND/.test(fil()), 'en gratuit, l\'accompagnant ouvre la formule');
ok(!d.querySelector('.present[data-id="miro"]'), 'Miro n\'est pas venu');
ok(/Elle écrit court|Question : aucune cette fois/.test(sonnet().pop().corps.system[2].text), 'la consigne du tour règle la question (réponse courte, ou deux questions de suite)');
clic('[data-action="formule-ouvrir"]'); await etape(); noter();
ok(d.getElementById('plein').classList.contains('ouvert') && /60 €/.test(visible()) && /700 messages par mois/.test(visible()) && /professionnel référent certifié, humain/.test(visible()), 'l\'écran de formule : 60 €, 700 messages, professionnel humain');
clic('[data-action="formule-choisir"]'); await etape();
saisir(d.getElementById('p-carte'), '4242 4242 4242 4242');
scenario.push("[Miro] Moi c'est Miro. Ce soir, pose ton téléphone hors de la chambre à 22 h.\n[[ACTE:Téléphone hors de la chambre|ce soir]]\n[[SIGNAL:progression]]");
scenario.push("J'ai lu votre échange avec Miro, Léa. Un vrai pas, concret. Je le note dans votre feuille de route et je vous relis demain.");
/* pas de lecture ici : la personne n'a rien écrit depuis la dernière lecture */
clic('[data-action="formule-payer"]'); await pause(200);
ok(scenario.length === 0, 'aucune réponse prévue ne reste en file après l\'arrivée de Miro');
ok(!d.getElementById('plein').classList.contains('ouvert'), 'la formule se ferme après le paiement simulé');
ok(/Miro rejoint la discussion/.test(fil()) && /Moi c'est Miro/.test(fil()) && !/\[Miro\]/.test(fil()), 'Miro vient dès l\'abonnement, sans préfixe');
const miro = appels.filter(a => /Tu es Miro/.test(a.corps.system[0].text)).pop();
ok(miro && /MIA vient de te faire venir/.test(miro.corps.system[2].text) && miro.corps.messages.some(m => /^\[MIA\]/.test(m.content)), 'Miro reçoit sa fiche, la consigne d\'arrivée et les messages de MIA préfixés');
ok(d.querySelector('.carte-pas') && /Téléphone hors de la chambre/.test(fil()), 'le pas daté s\'affiche');
ok(d.querySelector('.carte-signal') && /progression à consolider/.test(fil()), 'le signal est transmis');
ok(d.querySelector('.msg.pro') && /je vous relis demain/.test(fil()), 'le professionnel référent écrit sur signal, dans la discussion');
const pro = appels.filter(a => /professionnel référent certifié de MAYND/.test(a.corps.system[0].text)).pop();
ok(pro && /Signal : progression/.test(pro.corps.system[2].text) && /ton nom n’est pas encore renseigné/.test(pro.corps.system[2].text), 'sa consigne : le signal, pas de nom inventé');
ok(/Ton professionnel référent/.test(fil()) && !/simul/i.test(fil()), 'il s\'appelle « Ton professionnel référent », jamais « simulé » à l\'écran');
ok(/Écris à Miro/.test(d.getElementById('message').placeholder), 'la saisie s\'adresse à Miro');

/* message 3 : risque */
/* abonné : le signal « blocage » part tout de suite, et le professionnel écrit avant même la réponse de l'accompagnant */
scenario.push("Léa, je viens de lire. Je suis là, et je vous relis dans l'heure. Appelez le 3114 maintenant si c'est trop lourd.",
  "Je suis là. Appelle le 3114 maintenant. Tu es en sécurité, là ?\n[[CRISE]]", LECTURE.replace('"risque":0', '"risque":2'));
d.getElementById('message').value = "J'ai envie de mourir.";
clic('[data-action="envoyer"]'); await pause(160);
ok(d.querySelectorAll('.carte-crise').length === 1 && /3114/.test(fil()) && /09 72 39 40 50/.test(fil()), 'une seule carte de crise, avec les numéros');
ok(/professionnel référent a été prévenu/.test(fil()), 'abonné : le professionnel est prévenu');
ok(/je vous relis dans l'heure/.test(fil()) && JSON.parse(w.localStorage.getItem('maynd.mix.v1')).signaux.some(s => s.type === 'blocage' && s.repondu), 'le signal « blocage » fait écrire le professionnel sans attendre');
ok(/Sécurité/.test(appels.filter(a => a.corps.model === 'claude-sonnet-5-5').pop().corps.system[2].text), 'la consigne du tour applique le protocole');

/* ── Aujourd'hui ── */
clic('.nav-b[data-nom="aujourdhui"]'); await pause(40); noter();
ok(/Bon(jour|soir|ne nuit), Léa/.test(visible()), 'Aujourd\'hui salue par le prénom');
ok(/Ton pas/.test(visible()) && /Téléphone hors de la chambre/.test(visible()), 'Aujourd\'hui montre le pas');
ok(scenario.length === 0, 'aucune réponse prévue ne reste en file après la crise');
ok(/Professionnel référent certifié/.test(visible()) && /je vous relis dans l'heure/.test(visible()), 'Aujourd\'hui montre le professionnel et son dernier mot');
ok(/Parler à MIA/.test(visible()), 'l\'action principale : parler à MIA');
ok(!/série|points|défi/i.test(visible()), 'ni série, ni points, ni défis');
clic('[data-action="humeur"][data-k="bien"]'); await pause(40);
ok(/Noté : plutôt bien/.test(visible()), 'l\'humeur se note en un geste');
clic('[data-action="pas-fait"]'); await pause(40);
ok(!/Ton pas/.test(visible()), 'le pas fait disparaît d\'Aujourd\'hui');

/* ── Toi ── */
clic('.nav-b[data-nom="toi"]'); await pause(40); noter();
ok(/Ton profil MAYND/.test(visible()) && /Ton équipe/.test(visible()) && /Rencontré/.test(visible()) && /Endormi/.test(visible()), 'Toi : profil, équipe, rencontrés et endormis');
ok(!/débloqu/i.test(visible()), 'jamais « débloquer »');
clic('[data-action="fiche"][data-id="ava"]'); await etape(); noter();
ok(/Elle dort/.test(visible()) && /Ce qu’elle fait avec toi/.test(visible()), 'la fiche d\'Ava est au féminin');
clic('#panneau [data-action="fermer"]'); await etape();
clic('[data-action="cr-ouvrir"]'); await etape(); noter();
ok(d.querySelectorAll('#panneau .cr-carte').length === w.SECTIONS_CR.length && /se réveille à 4 h/.test(visible()), 'le compte-rendu et ce que MAYND a appris, depuis Toi');
clic('[data-action="dossier-effacer"]'); await etape();
const g2 = JSON.parse(w.localStorage.getItem('maynd.mix.v1'));
ok(g2.dossier.faits.length === 0 && g2.dossier.effaces.length === 1, 'une ligne effacée ne reviendra pas');
clic('#panneau [data-action="fermer"]'); await etape();
clic('[data-action="pro-ouvrir"]'); await etape(); noter();
ok(/Feuille de route/.test(visible()) && /Garder le cap/.test(visible()) && /Avancer avec Miro/.test(visible()) && /Bilan/.test(visible()), 'la feuille de route et le bilan du professionnel');
clic('#panneau [data-action="fermer"]'); await etape();

/* ── les jeux ── */
const J = w.eval('JEUX');   /* const de script classique : pas une propriété de window */
ok(Object.keys(J).length === 17, '17 jeux chargés : ' + Object.keys(J).length);
const sansPoint = Object.keys(J).flatMap(k => ['q0','q0b','q1','q2','q3','q4','q5','q4First','q2Food'].filter(x => J[k][x] && !/\?$/.test(J[k][x].title)).map(x => k + '.' + x));
ok(sansPoint.length === 0 && Object.keys(J).every(k => !J[k].q3 || /\?$/.test(J[k].q3.titleIrregular)), 'chaque question de jeu finit par « ? » : ' + sansPoint.join(', '));
ok(!JSON.stringify(J.corps).includes('neo') && !/réduire|priv|contrôl|objectif de poids/i.test(JSON.stringify(J.corps)), 'le jeu de Nora : jamais Neo, ni réduction, ni contrôle');
ok(!/dépasse-toi/i.test(JSON.stringify(J.effort)) && !/le père|la mère/i.test(JSON.stringify(J.parentalite)) && !/étape/i.test(JSON.stringify(J.emotions)), 'Kael, Soren, Ava : leurs règles tiennent dans les données');
clic('[data-action="fiche"][data-id="miro"]'); await etape();
ok(/Son jeu/.test(visible()) && /Lui parler/.test(visible()), 'la fiche de Miro, rencontré, propose son jeu et de lui parler');
clic('#panneau [data-action="jeu-ouvrir"]'); await etape(); noter();
ok(d.getElementById('plein').classList.contains('ouvert') && /Question 1/.test(visible()) && /reposé[e]? \?/.test(visible()), 'le jeu de Miro s\'ouvre sur sa première question');
ok(!/pause|Pause/.test(d.querySelector('.jeu .barre').textContent), 'la barre du jeu : nom, avancement, Quitter');
async function jouer(choix){ for(const i of choix){ const b = d.querySelector('.jeu [data-action="jeu-choix"][data-i="' + i + '"]'); if(!b) throw new Error('réponse introuvable : ' + i + ' · ' + visible().slice(0, 120)); b.click(); await etape(); } }
await jouer([1, 1, 0, 1, 0]);
noter();
ok(/Merci d’avoir pris ce temps/.test(visible()) && /Miro a tes 5 réponses/.test(visible()), 'l\'écran de fin : Miro a les réponses');
ok(/En parler avec Miro maintenant/.test(visible()) && /Ce que Miro peut vraiment faire pour toi/.test(visible()), 'les deux boutons de fin de jeu');
ok(/Tu as réveillé la voix de Miro/.test(visible()), 'finir le jeu réveille la voix');
ok(!/nous|conseil|tu devrais/i.test((d.querySelector('.jeu .fin .texte') || {textContent:''}).textContent), 'aucun conseil sur l\'écran de fin');
const g3 = JSON.parse(w.localStorage.getItem('maynd.mix.v1'));
ok(g3.jeux.runs.length === 1 && g3.jeux.runs[0].completed && g3.jeux.runs[0].theme === 'sommeil' && g3.voix.reveillees.includes('miro'), 'la partie est gardée, la voix de Miro est réveillée');
scenario.push("Je lis ce que tu me dis de tes nuits. Ce qui revient, c'est le réveil trop tôt. On commence par là ?\n[[CHOIX:Oui|Autre chose]]", LECTURE);
clic('[data-action="jeu-parler"]'); await pause(DUREE_TEST + 200);
ok(!d.getElementById('plein').classList.contains('ouvert') && d.querySelector('.nav-b.actif[data-nom="discussion"]'), '« En parler » ferme le jeu et ouvre la discussion');
ok(/Je viens de finir ton jeu « Tes nuits »/.test(fil()) && /réveillé vraiment reposé/.test(fil()), 'le récapitulatif est posté au nom de la personne');
ok(/réveil trop tôt/.test(fil()), 'Miro répond au récapitulatif');
const finJeu = sonnet().pop().corps;
ok(/Tu es Miro/.test(finJeu.system[0].text) && /vient de terminer ton jeu « Tes nuits »/.test(finJeu.system[2].text), 'Miro sait qu\'on sort de son jeu');
ok(d.querySelector('.b-voix'), 'la réponse de Miro a son bouton d\'écoute');
/* Nora : arrêt anticipé quand le mal-être est fort et durable */
clic('.nav-b[data-nom="toi"]'); await pause(40);
clic('[data-action="fiche"][data-id="nora"]'); await etape();
ok(/Elle dort/.test(visible()) && /tu la réveilles par son jeu/.test(visible()), 'la fiche de Nora, endormie, au féminin');
clic('#panneau [data-action="jeu-ouvrir"]'); await etape();
ok(/De quoi as-tu envie de parler aujourd’hui \?/.test(visible()), 'le jeu de Nora commence par sa question préalable');
await jouer([0, 4, 4]);
noter();
ok(/On s’arrête là pour ce jeu/.test(visible()) && /professionnel référent te lit, sans rendez-vous/.test(visible()), 'Nora s\'arrête avant la fin et oriente vers l\'humain');
ok(!/Question 3/.test(visible()), 'la question 3 n\'est pas posée');
const g4 = JSON.parse(w.localStorage.getItem('maynd.mix.v1'));
ok(g4.jeux.runs.some(r => r.theme === 'corps' && r.stopped && !r.completed), 'la partie arrêtée est gardée comme telle');
clic('[data-action="jeu-quitter"]'); await etape();
ok(!d.getElementById('plein').classList.contains('ouvert'), 'le jeu se ferme');

/* ── reprise : la page se rouvre sur l'intérieur ── */
const stockage = { 'maynd.mix.v1': w.localStorage.getItem('maynd.mix.v1') };
w.close();
dom = faireDom(stockage); w = dom.window; d = w.document; await pause(60);
ok(d.querySelector('.nav') && /Léa/.test(visible()), 'au retour, l\'application s\'ouvre sur l\'intérieur, avec le prénom');
ok(w.localStorage.getItem('maynd.state.v7') === null && w.localStorage.getItem('maynd.guide.v1') === null, 'MAYND et le Tunnel ne sont pas touchés');

/* ── règles d'écriture ── */
const affiche = textes.join('\n') + '\n' + visible();
const interdits = affiche.match(/th[ée]rapie|\bpatient|diagnostic|psychologue|sant[ée] mentale|s[ée]ance|d[ée]bloqu|\bvoici\b|simul[ée]/gi);
ok(!interdits, 'aucun mot proscrit à l\'écran : ' + (interdits || []).join(', '));
const rdv = affiche.match(/.{0,10}rendez-vous/gi) || [];
ok(rdv.every(s => /sans |Aucun |jamais de /i.test(s)), 'rendez-vous seulement pour dire qu\'il n\'y en a pas : ' + rdv.join(' / '));
const anglais = affiche.match(/\b(ok|feedback|coach|challenge|scroll|feeling|cash|check|mindset|burn-?out|coaching)\b/gi);
ok(!anglais, 'aucun mot anglais : ' + (anglais || []).join(', '));
ok(espacesOrdinaires.length === 0, 'espace insécable avant ? ! : ; » partout : ' + espacesOrdinaires.slice(0, 5).join(' / '));
const css = fs.readdirSync(path.join(dossierApp, 'styles')).map(f => fs.readFileSync(path.join(dossierApp, 'styles', f), 'utf8')).join('\n');
ok(!/gradient/i.test(css), 'aucun dégradé dans les feuilles de style');
ok(!/\.ecran[^{]*\{[^}]*display\s*:\s*none/.test(css), 'les écrans ne sont jamais masqués par display:none');
/* aucune fonction définie deux fois dans les scripts */
const defs = {};
fs.readdirSync(path.join(dossierApp, 'scripts')).forEach(f => {
  const src = fs.readFileSync(path.join(dossierApp, 'scripts', f), 'utf8');
  (src.match(/^(?:async\s+)?function\s+(\w+)/gm) || []).forEach(x => { const n = x.replace(/^(?:async\s+)?function\s+/, ''); (defs[n] = defs[n] || []).push(f); });
});
const doubles = Object.keys(defs).filter(n => defs[n].length > 1);
ok(doubles.length === 0, 'aucune fonction redéfinie : ' + doubles.join(', '));

ok(erreurs.length === 0, 'aucune erreur : ' + erreurs.slice(0, 3).join('\n'));
console.log(`\n${verifs} vérifications, ${echecs} échec${echecs > 1 ? 's' : ''}`);
w.close();
process.exit(echecs ? 1 : 0);
