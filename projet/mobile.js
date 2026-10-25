// ===== Version mobile (ajout de l'animateur) =====
// Les boutons tactiles font comme si on appuyait sur les touches du clavier :
// le jeu reçoit les mêmes événements (keydown / keyup sur document, avec e.key),
// donc il réagit exactement pareil, même si on a changé les touches.

const ecranTactile = matchMedia("(any-pointer: coarse)");
const enPaysage = matchMedia("(orientation: landscape)");
const titre = document.querySelector("h1");
const largeurCadre = largeurJeu + 6; // le jeu + sa bordure de 3px de chaque côté
const hauteurCadre = hauteurJeu + 6;
const placeCommandes = 130; // la bande gardée pour les boutons (doit suivre mobile.css)

function envoyerTouche(type, action) {
  document.dispatchEvent(new KeyboardEvent(type, { key: touches[action], bubbles: true, cancelable: true }));
}

// --- Le jeu est réduit pour tenir dans l'écran (sans jamais changer ses calculs) ---
function adapterTaille() {
  const plein = document.body.classList.contains("plein");
  // on rapetisse d'abord le jeu : sinon le téléphone élargit la page pour le montrer en entier
  // et on mesurerait une fausse largeur d'écran
  document.body.style.setProperty("--echelleMobile", 0.2);
  let largeur = window.innerWidth;
  let hauteur = window.innerHeight;
  if (ecranTactile.matches) {
    if (enPaysage.matches) largeur = largeur - 2 * placeCommandes;
    else hauteur = hauteur - placeCommandes;
  }
  if (!plein) {
    // on enlève la place du titre et les marges de la page
    hauteur = hauteur - (titre.getBoundingClientRect().bottom + window.scrollY) - 16;
    largeur = largeur - 16;
  }
  let echelle = Math.min(largeur / largeurCadre, hauteur / hauteurCadre);
  // hors plein écran, le jeu ne devient jamais plus grand que sa vraie taille
  if (!plein) echelle = Math.min(echelle, 1);
  document.body.style.setProperty("--echelleMobile", Math.max(echelle, 0.2));
}

adapterTaille();
window.addEventListener("resize", adapterTaille);
document.addEventListener("fullscreenchange", adapterTaille);
ecranTactile.addEventListener("change", adapterTaille);

// --- Bouton Monter : appuyé tant qu'au moins un doigt est dessus ---
const boutonMonter = document.querySelector('.commande[data-action="monter"]');
const doigtsSurMonter = new Set();

function doigtEnleve(e) {
  if (!doigtsSurMonter.delete(e.pointerId)) return;
  if (doigtsSurMonter.size === 0) {
    boutonMonter.classList.remove("appuye");
    envoyerTouche("keyup", "monter");
  }
}

// si le système coupe tout (appel, changement d'appli...), on relâche quoi qu'il arrive
function toutRelacher() {
  if (doigtsSurMonter.size === 0) return;
  doigtsSurMonter.clear();
  boutonMonter.classList.remove("appuye");
  envoyerTouche("keyup", "monter");
}

boutonMonter.addEventListener("pointerdown", function (e) {
  e.preventDefault();
  // sans ça, le navigateur "attache" le doigt au bouton et on ne saurait pas qu'il a glissé dehors
  if (boutonMonter.hasPointerCapture(e.pointerId)) boutonMonter.releasePointerCapture(e.pointerId);
  if (actionEnAttente !== null) return; // on est en train de choisir une touche dans les paramètres
  doigtsSurMonter.add(e.pointerId);
  boutonMonter.classList.add("appuye");
  envoyerTouche("keydown", "monter");
});

boutonMonter.addEventListener("pointerleave", doigtEnleve);
document.addEventListener("pointerup", doigtEnleve);
document.addEventListener("pointercancel", doigtEnleve);
window.addEventListener("blur", toutRelacher);
window.addEventListener("pagehide", toutRelacher);
document.addEventListener("visibilitychange", toutRelacher);

// --- Les autres boutons : un appui = une touche tapée ---
for (const bouton of document.querySelectorAll(".commande")) {
  if (bouton === boutonMonter) continue;
  const action = bouton.dataset.action;
  // le navigateur n'autorise le plein écran qu'au moment où on lève le doigt
  const moment = action === "pleinEcran" ? "pointerup" : "pointerdown";
  bouton.addEventListener("pointerdown", function (e) {
    e.preventDefault();
  });
  bouton.addEventListener(moment, function () {
    if (actionEnAttente !== null) return;
    envoyerTouche("keydown", action);
    envoyerTouche("keyup", action);
  });
}

// sur iPhone, le plein écran n'existe pas : on cache ce bouton
if (!document.fullscreenEnabled) {
  document.querySelector('.commande[data-action="pleinEcran"]').style.display = "none";
}

// pas de menu "copier / enregistrer" quand on garde le doigt appuyé
document.getElementById("commandesTactiles").addEventListener("contextmenu", function (e) {
  e.preventDefault();
});
