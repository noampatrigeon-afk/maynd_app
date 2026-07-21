/* ═══════════════ TEINTES DE RÉPONSE — une par couleur de fond ═══════════════ */
var QTHEME=[
  {bg:'#974AF0', tint:'#EDE1FF', dark:false},  /* violet MAYND  -> lavande      */
  {bg:'#224CF2', tint:'#DFE8FF', dark:false},  /* bleu          -> bleu clair   */
  {bg:'#00A862', tint:'#D8F2E4', dark:false},  /* vert          -> vert clair   */
  {bg:'#FE6601', tint:'#FFE6D2', dark:false},  /* orange        -> pêche        */
  {bg:'#FFC400', tint:'#FFEBCB', dark:true},   /* jaune         -> crème orangée*/
  {bg:'#6F2FC0', tint:'#E6D9FF', dark:false}   /* violet profond-> violet clair */
];
function qzPaint(el, th){
  if(!el) return;
  el.style.background=th.bg;
  el.style.setProperty('--qopt', th.tint||'#fff');
  el.classList.add('tinted');
  el.classList.toggle('dark', !!th.dark);
}
/* ═══════════════ CARTES DE L'ACCUEIL — paires revues ═══════════════ */
var JCARDS=[
  {c:'#974AF0', a:'#6F2FC0', lb:'Ton cap',       t:'Où tu vas',      go:"showTab('objectifs')"},
  {c:'#224CF2', a:'#8FB4FF', lb:'Humeur',        t:'Comment tu vas', go:"openMoodScreen()"},
  {c:'#00A862', a:'#FFC400', lb:'Profil',        t:'Qui tu es',      go:"startQuiz()"},
  {c:'#FE6601', a:'#FFDBC2', lb:'Accompagnants', t:'Avec qui',       go:"openDrawer()"},
  {c:'#FF9EC4', a:'#974AF0', lb:'Supervision',   t:'Qui te suit',    go:"showTab('objectifs')", dark:true}
];
/* ═══════════════ SUPERVISION : avatar humain ═══════════════ */
function proBadgeSVG(){
  return '<svg viewBox="0 0 48 48" fill="none">'
    +'<circle cx="24" cy="18" r="8.6" fill="#fff"/>'
    +'<path d="M9.5 42.5c0-8 6.5-14.5 14.5-14.5s14.5 6.5 14.5 14.5z" fill="#fff"/>'
    +'<path d="M24 28c-2.2 0-4.2.5-6 1.4l6 5.6 6-5.6c-1.8-.9-3.8-1.4-6-1.4z" fill="currentColor" opacity=".22"/></svg>';
}



