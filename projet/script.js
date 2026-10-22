const jeu = document.getElementById("jeu");
const balle = document.getElementById("balle");
const message = document.getElementById("message");
const pleure = document.getElementById("pleure");

const largeurJeu = 700;
const hauteurJeu = 500;
const tailleBalle = 30;
const balleX = 50;
const tailleObstacle = { largeur: 44, hauteur: 130 };

const hauteurMax = hauteurJeu - tailleBalle;
const hauteurDepart = (hauteurJeu - tailleBalle) / 2; // au milieu
let hauteur = hauteurDepart;
let toucheAppuyee = false;
let obstacles = [];
let compteur = 0;
let distance = 0;
let score = 0;
const affichageScore = document.getElementById("score");
let perdu = false;
let commence = false;
let idAnimation = null;

// paillettes qui brillent dans le menu d'accueil
for (let i = 0; i < 30; i++) {
  const paillette = document.createElement("div");
  paillette.className = "paillette";
  const taille = 8 + Math.floor(Math.random() * 16);
  paillette.style.width = taille + "px";
  paillette.style.height = taille + "px";
  paillette.style.left = Math.random() * 95 + "%";
  paillette.style.top = Math.random() * 95 + "%";
  paillette.style.animationDelay = "-" + Math.random() * 1.5 + "s";
  paillette.style.animationDuration = 1 + Math.random() * 1.5 + "s";
  document.getElementById("accueil").appendChild(paillette);
}

// meilleur score gardé dans le navigateur (même après avoir quitté la page)
const affichageMeilleur = document.getElementById("meilleur");
let meilleur = Number(localStorage.getItem("meilleurScore")) || 0;
affichageMeilleur.textContent = "Meilleur : " + meilleur;

// bouton pour remettre le meilleur score à 0 (on demande avant)
document.getElementById("resetMeilleur").addEventListener("click", function () {
  this.blur();
  if (!confirm("Remettre le meilleur score à 0 ?")) return;
  meilleur = 0;
  localStorage.setItem("meilleurScore", 0);
  affichageMeilleur.textContent = "Meilleur : 0";
});

const accueil = document.getElementById("accueil");
const choixCouleur = document.getElementById("couleur");

choixCouleur.addEventListener("change", function () {
  balle.style.background = choixCouleur.value;
  choixCouleur.blur();
});

// --- Menu paramètres ---
const panneau = document.getElementById("panneau");
const boutonReglages = document.getElementById("boutonParametres");
const boutonMusique = document.getElementById("musique");

boutonReglages.addEventListener("click", function () {
  boutonReglages.blur();
  const ouvert = panneau.style.display === "block";
  panneau.style.display = ouvert ? "none" : "block";
  boutonReglages.classList.toggle("ouvert", !ouvert);
});

document.getElementById("fermer").addEventListener("click", function () {
  panneau.style.display = "none";
  boutonReglages.classList.remove("ouvert");
});

// --- Onglets ---
const ongletGeneral = document.getElementById("ongletGeneral");
const ongletApparence = document.getElementById("ongletApparence");
const tabGeneral = document.getElementById("tabGeneral");
const tabApparence = document.getElementById("tabApparence");

const ongletTouches = document.getElementById("ongletTouches");
const tabTouches = document.getElementById("tabTouches");

const onglets = {
  general: [tabGeneral, ongletGeneral],
  apparence: [tabApparence, ongletApparence],
  touches: [tabTouches, ongletTouches],
  regles: [document.getElementById("tabRegles"), document.getElementById("ongletRegles")],
};

function montrerOnglet(nom) {
  for (const cle in onglets) {
    const actif = cle === nom;
    onglets[cle][0].classList.toggle("actif", actif);
    onglets[cle][1].style.display = actif ? "block" : "none";
  }
}

for (const cle in onglets) {
  onglets[cle][0].addEventListener("click", function () {
    this.blur();
    montrerOnglet(cle);
  });
}

// --- Touches du clavier (on peut les changer dans l'onglet Touches) ---
const touchesParDefaut = { monter: " ", pause: "a", pleinEcran: "f", tirer: "z", restart: "r" };
let touches = Object.assign({}, touchesParDefaut, JSON.parse(localStorage.getItem("touches") || "{}"));
let actionEnAttente = null; // l'action dont on change la touche

function nomTouche(touche) {
  return touche === " " ? "Espace" : touche.toUpperCase();
}

function majNomsTouches() {
  for (const bouton of document.querySelectorAll(".changerTouche")) {
    const action = bouton.dataset.action;
    bouton.textContent = action === actionEnAttente ? "Appuie..." : nomTouche(touches[action]);
  }
  // les touches écrites dans les règles
  for (const nom of document.querySelectorAll(".nomAction")) {
    nom.textContent = nomTouche(touches[nom.dataset.action]);
  }
}

for (const bouton of document.querySelectorAll(".changerTouche")) {
  bouton.addEventListener("click", function () {
    this.blur();
    actionEnAttente = this.dataset.action;
    majNomsTouches();
  });
}

// la nouvelle touche est choisie : si une autre action l'avait, on échange
function choisirTouche(touche) {
  if (touche !== "escape") {
    for (const action in touches) {
      if (touches[action] === touche) touches[action] = touches[actionEnAttente];
    }
    touches[actionEnAttente] = touche;
    localStorage.setItem("touches", JSON.stringify(touches));
  }
  actionEnAttente = null;
  majNomsTouches();
}

majNomsTouches();

// --- Apparence de la balle ---
const choixApparence = document.getElementById("apparence");

choixApparence.addEventListener("change", function () {
  appliquerSkin(choixApparence.value);
  skinChoisi = choixApparence.value;
  localStorage.setItem("skin", skinChoisi);
  choixApparence.blur();
});

// --- Boutique : les skins se débloquent avec le meilleur score ---
const skins = [
  { emoji: "", nom: "Balle", score: 0 },
  { emoji: "🦆", nom: "Canard", score: 0 },
  { emoji: "🐱", nom: "Chat", score: 5 },
  { emoji: "🐸", nom: "Grenouille", score: 10 },
  { emoji: "🦊", nom: "Renard", score: 20 },
  { emoji: "🐼", nom: "Panda", score: 30 },
  { emoji: "🦄", nom: "Licorne", score: 40 },
  { emoji: "👻", nom: "Fantôme", score: 50 },
  { emoji: "🤖", nom: "Robot", score: 60 },
  { emoji: "👽", nom: "Alien", score: 75 },
  { emoji: "🐲", nom: "Dragon", score: 90 },
  { emoji: "👑", nom: "Couronne", score: 100 },
  { emoji: "🐧", nom: "Pingouin", score: 150 },
  { emoji: "🦁", nom: "Lion", score: 200 },
  { emoji: "🦖", nom: "T-Rex", score: 250 },
  { emoji: "🐙", nom: "Pieuvre", score: 300 },
  { emoji: "💎", nom: "Diamant", score: 400 },
  { emoji: "🏆", nom: "Trophée", score: 500 },
];
let skinChoisi = localStorage.getItem("skin") || "";
appliquerSkin(skinChoisi); // on remet le skin choisi la dernière fois

function appliquerSkin(emoji) {
  balle.textContent = "";
  if (emoji === "🐲") {
    // le dragon regarde vers la gauche : on le retourne pour qu'il regarde vers l'avant
    const retourne = document.createElement("span");
    retourne.className = "retourne";
    retourne.textContent = emoji;
    balle.appendChild(retourne);
  } else {
    balle.textContent = emoji;
  }
  balle.classList.toggle("emoji", emoji !== "");
}

// styles d'ailes (comme les skins, ils se débloquent avec le meilleur score)
const ailes = [
  { classe: "", emoji: "🪽", nom: "Blanches", score: 0 },
  { classe: "ailes-or", emoji: "🌟", nom: "Dorées", score: 15 },
  { classe: "ailes-papillon", emoji: "🦋", nom: "Papillon", score: 25 },
  { classe: "ailes-noires", emoji: "🦇", nom: "Noires", score: 35 },
  { classe: "ailes-dragon", emoji: "🐉", nom: "Dragon", score: 50 },
  { classe: "ailes-ange", emoji: "😇", nom: "Ange", score: 60 },
  { classe: "ailes-arc", emoji: "🌈", nom: "Arc-en-ciel", score: 70 },
  { classe: "ailes-jetpack", emoji: "🚀", nom: "Jet pack", score: 80 },
  { classe: "ailes-aucune", emoji: "🚫", nom: "Sans ailes", score: 0 },
];
let ailesChoisies = localStorage.getItem("ailes") || "";

function appliquerAiles(classe) {
  for (const a of ailes) {
    if (a.classe !== "") balle.classList.remove(a.classe);
  }
  if (classe !== "") balle.classList.add(classe);
}
appliquerAiles(ailesChoisies);

function dessinerAiles() {
  const liste = document.getElementById("listeAiles");
  liste.textContent = "";
  for (const style of ailes) {
    const bouton = document.createElement("button");
    bouton.className = "skin";
    const debloque = meilleur >= style.score;
    bouton.textContent = style.emoji;
    const petit = document.createElement("span");
    petit.textContent = debloque ? style.nom : "🔒 " + style.score + " points";
    if (debloque && style.classe === ailesChoisies) petit.textContent = "✅ Équipé";
    bouton.appendChild(petit);
    if (!debloque) bouton.classList.add("bloque");
    if (style.classe === ailesChoisies) bouton.classList.add("choisi");
    bouton.addEventListener("click", function () {
      this.blur();
      if (!debloque) return;
      ailesChoisies = style.classe;
      localStorage.setItem("ailes", ailesChoisies);
      appliquerAiles(ailesChoisies);
      dessinerAiles();
    });
    liste.appendChild(bouton);
  }
}

// couleurs de la traînée ("" = la couleur de la balle, "arc" = multicolore)
const couleursTrainee = [
  { valeur: "", nom: "Comme la balle", score: 0 },
  { valeur: "red", nom: "Rouge", score: 0 },
  { valeur: "orange", nom: "Orange", score: 0 },
  { valeur: "gold", nom: "Doré", score: 0 },
  { valeur: "limegreen", nom: "Vert", score: 0 },
  { valeur: "dodgerblue", nom: "Bleu", score: 0 },
  { valeur: "deeppink", nom: "Rose", score: 0 },
  { valeur: "purple", nom: "Violet", score: 0 },
  { valeur: "white", nom: "Blanc", score: 0 },
  { valeur: "arc", nom: "Multicolore", score: 30 },
];
let couleurTraineeChoisie = localStorage.getItem("trainee") || "";

function dessinerTrainee() {
  const liste = document.getElementById("listeTrainee");
  liste.textContent = "";
  for (const c of couleursTrainee) {
    const bouton = document.createElement("button");
    bouton.className = "skin";
    const debloque = meilleur >= c.score;
    bouton.textContent = c.valeur === "arc" ? "🌈" : c.valeur === "" ? "⚽" : "⬤";
    if (c.valeur !== "" && c.valeur !== "arc") bouton.style.color = c.valeur;
    const petit = document.createElement("span");
    petit.textContent = debloque ? c.nom : "🔒 " + c.score + " points";
    if (debloque && c.valeur === couleurTraineeChoisie) petit.textContent = "✅ Équipé";
    bouton.appendChild(petit);
    if (!debloque) bouton.classList.add("bloque");
    if (c.valeur === couleurTraineeChoisie) bouton.classList.add("choisi");
    bouton.addEventListener("click", function () {
      this.blur();
      if (!debloque) return;
      couleurTraineeChoisie = c.valeur;
      localStorage.setItem("trainee", couleurTraineeChoisie);
      dessinerTrainee();
    });
    liste.appendChild(bouton);
  }
}

// les onglets de la boutique : Skins, Ailes ou Traînée
const ongletsBoutique = {
  skins: [document.getElementById("tabSkins"), document.getElementById("listeSkins"), "grid"],
  ailes: [document.getElementById("tabAiles"), document.getElementById("listeAiles"), "flex"],
  trainee: [document.getElementById("tabTrainee"), document.getElementById("listeTrainee"), "grid"],
};

function montrerOngletBoutique(nom) {
  for (const cle in ongletsBoutique) {
    const actif = cle === nom;
    ongletsBoutique[cle][0].classList.toggle("actif", actif);
    ongletsBoutique[cle][1].style.display = actif ? ongletsBoutique[cle][2] : "none";
  }
}

for (const cle in ongletsBoutique) {
  ongletsBoutique[cle][0].addEventListener("click", function () {
    this.blur();
    montrerOngletBoutique(cle);
  });
}

function dessinerBoutique() {
  dessinerAiles();
  dessinerTrainee();
  const liste = document.getElementById("listeSkins");
  liste.textContent = "";
  document.getElementById("infoBoutique").textContent = "Ton meilleur score : " + meilleur;
  for (const skin of skins) {
    const bouton = document.createElement("button");
    bouton.className = "skin";
    const debloque = meilleur >= skin.score;
    bouton.textContent = skin.emoji === "" ? "⚽" : skin.emoji;
    const petit = document.createElement("span");
    petit.textContent = debloque ? skin.nom : "🔒 " + skin.score + " points";
    if (debloque && skin.emoji === skinChoisi) petit.textContent = "✅ Équipé";
    bouton.appendChild(petit);
    if (!debloque) bouton.classList.add("bloque");
    if (skin.emoji === skinChoisi) bouton.classList.add("choisi");
    bouton.addEventListener("click", function () {
      this.blur();
      if (!debloque) return;
      skinChoisi = skin.emoji;
      localStorage.setItem("skin", skinChoisi);
      appliquerSkin(skinChoisi);
      choixApparence.value = "";
      dessinerBoutique();
    });
    liste.appendChild(bouton);
  }
}

document.getElementById("boutonBoutique").addEventListener("click", function () {
  this.blur();
  menuPrincipal.style.display = "none";
  document.getElementById("boutique").style.display = "block";
  montrerOngletBoutique("skins");
  dessinerBoutique();
});

document.getElementById("retourBoutique").addEventListener("click", function () {
  this.blur();
  document.getElementById("boutique").style.display = "none";
  menuPrincipal.style.display = "block";
});

// --- Musique drôle (créée par le navigateur, sans fichier) ---
const notes = [262, 330, 392, 330, 294, 370, 440, 370, 262, 523, 392, 330, 392, 262, 196, 262];
let contexteSon = null;
let minuteurMusique = null;
let numeroNote = 0;

// volume réglé avec la barre dans les paramètres (de 0 à 0.2)
const choixVolume = document.getElementById("volume");
let volumeMusique = Number(choixVolume.value) / 100 * 0.2;

choixVolume.addEventListener("input", function () {
  volumeMusique = Number(choixVolume.value) / 100 * 0.2;
});

// après avoir réglé le volume, la barre espace ne doit pas rester sélectionnée
choixVolume.addEventListener("change", function () {
  choixVolume.blur();
});

function jouerNote() {
  if (volumeMusique === 0) {
    numeroNote = (numeroNote + 1) % notes.length;
    return;
  }
  const oscillateur = contexteSon.createOscillator();
  const volume = contexteSon.createGain();
  oscillateur.type = "square";
  oscillateur.frequency.value = notes[numeroNote];
  volume.gain.setValueAtTime(volumeMusique, contexteSon.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, contexteSon.currentTime + 0.18);
  oscillateur.connect(volume);
  volume.connect(contexteSon.destination);
  oscillateur.start();
  oscillateur.stop(contexteSon.currentTime + 0.2);
  numeroNote = (numeroNote + 1) % notes.length;
}

function arreterMusiqueDrole() {
  clearInterval(minuteurMusique);
  minuteurMusique = null;
  boutonMusique.textContent = "Musique drôle : NON";
}

boutonMusique.addEventListener("click", function () {
  boutonMusique.blur();
  if (minuteurMusique === null) {
    arreterMusiqueAction(); // une seule musique à la fois
    if (contexteSon === null) contexteSon = new AudioContext();
    contexteSon.resume();
    minuteurMusique = setInterval(jouerNote, 220);
    boutonMusique.textContent = "Musique drôle : OUI";
  } else {
    arreterMusiqueDrole();
  }
});

// --- Musique action : rapide, avec basse, mélodie et grosse caisse ---
const basseAction = [110, 110, 131, 110, 147, 110, 165, 147, 110, 110, 131, 110, 98, 98, 123, 131];
const melodieAction = [440, 523, 659, 523, 440, 523, 784, 659, 440, 523, 659, 523, 392, 494, 587, 494];
const boutonAction = document.getElementById("musiqueAction");
let minuteurAction = null;
let pasAction = 0;

function jouerSon(type, frequence, duree, force) {
  const oscillateur = contexteSon.createOscillator();
  const volume = contexteSon.createGain();
  oscillateur.type = type;
  oscillateur.frequency.value = frequence;
  volume.gain.setValueAtTime(force, contexteSon.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, contexteSon.currentTime + duree);
  oscillateur.connect(volume);
  volume.connect(contexteSon.destination);
  oscillateur.start();
  oscillateur.stop(contexteSon.currentTime + duree + 0.02);
}

function jouerPasAction() {
  if (volumeMusique > 0) {
    jouerSon("sawtooth", basseAction[pasAction], 0.13, volumeMusique * 1.2);
    jouerSon("square", melodieAction[pasAction], 0.1, volumeMusique * 0.6);
    // grosse caisse : un son grave qui descend, sur chaque temps
    if (pasAction % 4 === 0) {
      const oscillateur = contexteSon.createOscillator();
      const volume = contexteSon.createGain();
      oscillateur.frequency.setValueAtTime(150, contexteSon.currentTime);
      oscillateur.frequency.exponentialRampToValueAtTime(40, contexteSon.currentTime + 0.12);
      volume.gain.setValueAtTime(volumeMusique * 2, contexteSon.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contexteSon.currentTime + 0.15);
      oscillateur.connect(volume);
      volume.connect(contexteSon.destination);
      oscillateur.start();
      oscillateur.stop(contexteSon.currentTime + 0.17);
    }
  }
  pasAction = (pasAction + 1) % basseAction.length;
}

function arreterMusiqueAction() {
  clearInterval(minuteurAction);
  minuteurAction = null;
  boutonAction.textContent = "Musique action : NON";
}

boutonAction.addEventListener("click", function () {
  boutonAction.blur();
  if (minuteurAction === null) {
    arreterMusiqueDrole(); // une seule musique à la fois
    if (contexteSon === null) contexteSon = new AudioContext();
    contexteSon.resume();
    minuteurAction = setInterval(jouerPasAction, 120);
    boutonAction.textContent = "Musique action : OUI";
  } else {
    arreterMusiqueAction();
  }
});

// --- Niveaux et vies ---
const menuPrincipal = document.getElementById("menuPrincipal");
const menuNiveaux = document.getElementById("niveaux");
const affichageVies = document.getElementById("vies");
let facteurVitesse = 1; // le niveau change la vitesse (1 = la plus rapide)
let facteurPiques = 1; // en facile, les piques sont plus bas (plus petits)
let viesMax = 3;
let vies = 3;
let invincible = 0; // images pendant lesquelles on ne peut pas perdre

function majVies() {
  affichageVies.textContent = "❤️".repeat(vies) + "🖤".repeat(Math.max(0, viesMax - vies));
}

// l'accueil montre d'abord « Jouer », puis le choix du niveau
function montrerAccueil() {
  menuPrincipal.style.display = "block";
  menuNiveaux.style.display = "none";
  document.getElementById("boutique").style.display = "none";
  accueil.style.display = "block";
}

document.getElementById("jouer").addEventListener("click", function () {
  this.blur();
  menuPrincipal.style.display = "none";
  menuNiveaux.style.display = "block";
});

for (const bouton of document.querySelectorAll(".niveau")) {
  bouton.addEventListener("click", function () {
    this.blur();
    viesMax = Number(this.dataset.vies);
    facteurVitesse = Number(this.dataset.vitesse);
    facteurPiques = Number(this.dataset.piques);
    accueil.style.display = "none";
    remiseAZero();
    montrerAide();
  });
}

// pendant 5 secondes, on voit les touches, puis la partie commence
const aide = document.getElementById("aide");
let minuteurAide = null;

function montrerAide() {
  aide.textContent = "";
  const titre = document.createElement("h2");
  titre.textContent = "Les touches";
  aide.appendChild(titre);
  const lignes = [
    ["Monter", touches.monter],
    ["Bulles (à 20 points)", touches.tirer],
    ["Pause", touches.pause],
    ["Plein écran", touches.pleinEcran],
    ["Restart", touches.restart],
  ];
  for (const ligne of lignes) {
    const p = document.createElement("p");
    p.textContent = ligne[0] + " : " + nomTouche(ligne[1]);
    aide.appendChild(p);
  }
  const compte = document.createElement("p");
  compte.className = "compte";
  aide.appendChild(compte);
  let reste = 5;
  compte.textContent = "Début dans " + reste;
  aide.style.display = "block";
  minuteurAide = setInterval(function () {
    reste = reste - 1;
    if (reste > 0) {
      compte.textContent = "Début dans " + reste;
      return;
    }
    arreterAide();
    commence = true;
    jouer();
  }, 1000);
}

function arreterAide() {
  clearInterval(minuteurAide);
  minuteurAide = null;
  aide.style.display = "none";
}

// --- Pause avec la touche A ---
let enPause = false;

let minuteurReprise = null;

function basculerPause() {
  if (!commence || perdu) return;
  // pendant le compte à rebours, on ne fait rien
  if (minuteurReprise !== null) return;
  if (!enPause) {
    enPause = true;
    jeu.classList.add("pause");
    cancelAnimationFrame(idAnimation);
    message.textContent = "Pause (appuie sur " + nomTouche(touches.pause) + " pour reprendre)";
  } else {
    // on reprend après 3 secondes : 3, 2, 1
    let reste = 3;
    message.textContent = "Reprise dans " + reste;
    minuteurReprise = setInterval(function () {
      reste = reste - 1;
      if (reste > 0) {
        message.textContent = "Reprise dans " + reste;
        return;
      }
      clearInterval(minuteurReprise);
      minuteurReprise = null;
      enPause = false;
      jeu.classList.remove("pause");
      message.textContent = "";
      jouer();
    }, 1000);
  }
}

// --- Plein écran avec la touche F ---
function majPleinEcran() {
  const plein = document.fullscreenElement !== null;
  document.body.classList.toggle("plein", plein);
  // on agrandit le jeu pour remplir l'écran
  const echelle = Math.min(window.innerWidth / largeurJeu, window.innerHeight / hauteurJeu);
  document.body.style.setProperty("--echelle", echelle);
}

function basculerPleinEcran() {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", majPleinEcran);
window.addEventListener("resize", majPleinEcran);

document.addEventListener("keydown", function (e) {
  // e.key suit la lettre écrite sur la touche (marche en AZERTY)
  const touche = e.key.toLowerCase();
  // on est en train de choisir une nouvelle touche
  if (actionEnAttente !== null) {
    e.preventDefault();
    if (touche !== "shift" && touche !== "control" && touche !== "alt") choisirTouche(touche);
    return;
  }
  if (touche === touches.pleinEcran && !e.repeat) basculerPleinEcran();
  if (touche === touches.tirer && !e.repeat) tirer();
  if (touche === touches.pause && !e.repeat) basculerPause();
  if (touche === touches.restart && !e.repeat && (commence || minuteurAide !== null)) retourAccueil();
  if (touche === touches.monter && commence) {
    toucheAppuyee = true;
    e.preventDefault();
    if (perdu) recommencer();
  }
});

document.addEventListener("keyup", function (e) {
  if (e.key.toLowerCase() === touches.monter) {
    toucheAppuyee = false;
  }
});

function creerObstacle() {
  const element = document.createElement("div");
  element.className = "obstacle";
  // au hasard : obstacle en bas ou en haut
  const enHaut = Math.random() < 0.5;
  // taille au hasard entre 120 et 340 (les grands bloquent le milieu)
  const hauteurObstacle = (120 + Math.random() * 220) * facteurPiques;
  element.style.height = hauteurObstacle + "px";
  if (score >= 50) {
    // à partir de 50 points, ce sont des piques futuristes (néons)
    element.classList.add("neon");
  } else if (score >= 20) {
    // à partir de 20 points, les piques deviennent des serpents
    element.classList.add("serpent");
    element.textContent = "🐍";
  } else {
    // gris au hasard (clair, moyen ou foncé)
    const couleurs = ["#9e9e9e", "#757575", "#616161", "#bdbdbd"];
    element.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
  }
  if (enHaut) {
    element.classList.add("haut"); // pique qui pointe vers le bas
    element.style.top = "0px";
  } else {
    element.style.bottom = "0px";
  }
  jeu.appendChild(element);
  obstacles.push({
    element: element,
    x: largeurJeu,
    enHaut: enHaut,
    hauteur: hauteurObstacle,
  });
}

// --- Fusées mortelles ---
const tailleFusee = { largeur: 40, hauteur: 24 };
let fusees = [];

function creerFusee(yImpose, xImpose) {
  const element = document.createElement("div");
  element.className = "fusee";
  if (score >= 50) {
    // à partir de 50 points, ce sont des missiles futuristes (dessinés en CSS)
    element.classList.add("missile");
  } else if (score >= 20) {
    // à partir de 20 points, les fusées deviennent des abeilles
    element.textContent = "🐝";
    element.classList.add("abeille");
  } else {
    element.textContent = "🚀";
    // couleur au hasard
    element.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";
  }
  // hauteur au hasard
  // hauteur au hasard, sauf si c'est le boss qui tire
  const y = yImpose !== undefined ? yImpose : 20 + Math.random() * (hauteurJeu - 80);
  const x = xImpose !== undefined ? xImpose : largeurJeu;
  element.style.bottom = y + "px";
  jeu.appendChild(element);
  fusees.push({ element: element, x: x, y: y });
}

// --- Le boss : arrive à 200 points, 500 points de vie, une bulle lui enlève 20 ---
const tailleBoss = 90;
const pvBossMax = 500;
const degatBulle = 20;
let boss = null;
let bossVaincu = false;

function creerBoss() {
  const element = document.createElement("div");
  element.className = "boss";
  element.textContent = "👾";
  const barre = document.createElement("div");
  barre.className = "barreBoss";
  const rempli = document.createElement("div");
  barre.appendChild(rempli);
  element.appendChild(barre);
  jeu.appendChild(element);
  boss = { element: element, rempli: rempli, x: largeurJeu, y: 205, t: 0, pv: pvBossMax, tir: 0 };
  munitions = munitionsDepart;
  majMunitions();
  message.textContent = "BOSS ! Tire avec " + nomTouche(touches.tirer);
  setTimeout(function () {
    if (boss !== null && !perdu) message.textContent = "";
  }, 2500);
}

function majBoss() {
  // il arrive de la droite, puis monte et descend en tirant des missiles
  if (boss.x > 580) boss.x = boss.x - 2;
  boss.t = boss.t + 0.03;
  boss.y = 205 + Math.sin(boss.t) * 150;
  boss.tir = boss.tir + 1;
  if (boss.tir % 110 === 0) creerFusee(boss.y + 33, boss.x);
  boss.element.style.left = boss.x + "px";
  boss.element.style.bottom = boss.y + "px";
  // toucher le boss fait perdre
  const touche =
    balleX < boss.x + tailleBoss &&
    balleX + tailleBalle > boss.x &&
    hauteur < boss.y + tailleBoss &&
    hauteur + tailleBalle > boss.y;
  if (touche) perdu = true;
}

function bossVaincuFin() {
  boss.element.remove();
  boss = null;
  bossVaincu = true;
  munitions = munitionsDepart;
  score = score + 10;
  affichageScore.textContent = "Score : " + score;
  majNuit();
  message.textContent = "Boss vaincu ! +10 points";
  setTimeout(function () {
    if (!perdu) message.textContent = "";
  }, 2500);
}

// --- Pièce bonus (ancienne mouche) : l'attraper donne 3 points ---
const tailleMouche = 26;
let mouches = [];

function creerMouche() {
  const element = document.createElement("div");
  element.className = "mouche";
  element.textContent = "🪙";
  jeu.appendChild(element);
  const y = 60 + Math.random() * (hauteurJeu - 160);
  mouches.push({ element: element, x: largeurJeu, y: y, y0: y, t: 0 });
}

// --- Cœur bonus (dans le désert) : l'attraper donne une vie en plus ---
let coeurs = [];

function creerCoeur() {
  const element = document.createElement("div");
  element.className = "coeur";
  element.textContent = "❤️";
  jeu.appendChild(element);
  const y = 60 + Math.random() * (hauteurJeu - 160);
  coeurs.push({ element: element, x: largeurJeu, y: y, y0: y, t: 0 });
}

function fuseeTouche(fusee) {
  return (
    balleX < fusee.x + tailleFusee.largeur &&
    balleX + tailleBalle > fusee.x &&
    hauteur < fusee.y + tailleFusee.hauteur &&
    hauteur + tailleBalle > fusee.y
  );
}

function touche(obstacle) {
  // la balle et l'obstacle se chevauchent-ils ?
  // la zone qui touche est un peu plus étroite que le dessin (la pointe est fine)
  const marge = 10;
  const memeX =
    balleX < obstacle.x + tailleObstacle.largeur - marge &&
    balleX + tailleBalle > obstacle.x + marge;
  let memeY;
  if (obstacle.enHaut) {
    memeY = hauteur + tailleBalle > hauteurJeu - obstacle.hauteur;
  } else {
    memeY = hauteur < obstacle.hauteur;
  }
  return memeX && memeY;
}

// ville dans le fond : des immeubles de tailles différentes
const couleursImmeubles = ["#37474f", "#455a64", "#546e7a", "#3e2723", "#4a148c", "#263238"];
// la ville est copiée deux fois côte à côte pour défiler sans coupure
const ville = document.createElement("div");
ville.className = "ville";
jeu.insertBefore(ville, balle);
let positionImmeuble = 0;
while (positionImmeuble < largeurJeu) {
  const largeur = Math.min(40 + Math.floor(Math.random() * 35), largeurJeu - positionImmeuble);
  const immeuble = document.createElement("div");
  immeuble.className = "immeuble";
  immeuble.style.left = positionImmeuble + "px";
  immeuble.style.width = largeur + "px";
  immeuble.style.height = 80 + Math.floor(Math.random() * 140) + "px";
  immeuble.style.setProperty("--mur", couleursImmeubles[Math.floor(Math.random() * couleursImmeubles.length)]);
  ville.appendChild(immeuble);
  positionImmeuble = positionImmeuble + largeur + 4;
}
for (const immeuble of Array.from(ville.children)) {
  const copie = immeuble.cloneNode(true);
  copie.style.left = parseFloat(immeuble.style.left) + largeurJeu + "px";
  ville.appendChild(copie);
}

// la route, devant les immeubles et derrière les voitures
const route = document.createElement("div");
route.className = "route";
jeu.insertBefore(route, balle);

// voitures qui roulent dans la ville (devant les immeubles)
const modelesVoitures = ["🚗", "🚕", "🚙", "🚌", "🚓"];
for (let i = 0; i < 5; i++) {
  const voiture = document.createElement("div");
  voiture.className = "voiture";
  voiture.textContent = modelesVoitures[i];
  voiture.style.bottom = (i % 2) * 14 + "px";
  voiture.style.animationDuration = 8 + Math.floor(Math.random() * 8) + "s";
  voiture.style.animationDelay = "-" + i * 3 + "s";
  jeu.insertBefore(voiture, balle);
}

// cactus du désert (cachés tant qu'on n'a pas 20 points)
for (let i = 0; i < 4; i++) {
  const cactus = document.createElement("div");
  cactus.className = "cactus";
  cactus.textContent = "🌵";
  cactus.style.animationDelay = "-" + i * 5 + "s";
  jeu.insertBefore(cactus, balle);
}

// étoiles (visibles seulement la nuit), placées au hasard derrière la balle
for (let i = 0; i < 40; i++) {
  const etoile = document.createElement("div");
  etoile.className = "etoile";
  etoile.style.left = Math.random() * (largeurJeu - 6) + "px";
  etoile.style.top = Math.random() * (hauteurJeu - 6) + "px";
  const taille = 2 + Math.floor(Math.random() * 3);
  etoile.style.width = taille + "px";
  etoile.style.height = taille + "px";
  jeu.insertBefore(etoile, balle);
}

// tous les 10 points, on change entre le jour et la nuit
function majNuit() {
  const nuit = Math.floor(score / 10) % 2 === 1;
  jeu.classList.toggle("nuit", nuit);
  // de 20 à 49 points, la ville devient le désert
  jeu.classList.toggle("desert", score >= 20 && score < 50);
  // à partir de 50 points, c'est une ville futuriste
  jeu.classList.toggle("futur", score >= 50);
  majMunitions();
}

function remiseAZero() {
  for (const o of obstacles) o.element.remove();
  obstacles = [];
  for (const m of mouches) m.element.remove();
  mouches = [];
  for (const c of coeurs) c.element.remove();
  coeurs = [];
  for (const f of fusees) f.element.remove();
  fusees = [];
  if (boss !== null) boss.element.remove();
  boss = null;
  bossVaincu = false;
  if (trou !== null) trou.element.remove();
  trou = null;
  tombe = false;
  for (const b of bulles) b.element.remove();
  bulles = [];
  munitions = munitionsDepart;
  vies = viesMax;
  invincible = 0;
  balle.classList.remove("clignote");
  majVies();
  hauteur = hauteurDepart;
  compteur = 0;
  distance = 0;
  score = 0;
  affichageScore.textContent = "Score : 0";
  majNuit();
  perdu = false;
  enPause = false;
  clearInterval(minuteurReprise);
  minuteurReprise = null;
  jeu.classList.remove("pause");
  message.textContent = "";
  pleure.style.display = "none";
  boutonRejouer.style.display = "none";
  boutonMenu.style.display = "none";
  balle.style.bottom = hauteur + "px";
}

function recommencer() {
  remiseAZero();
  jouer();
}

// bouton Restart affiché quand on a perdu : on rejoue tout de suite
const boutonRejouer = document.getElementById("boutonRejouer");
boutonRejouer.addEventListener("click", function () {
  this.blur();
  recommencer();
});

// bouton Menu affiché quand on a perdu : retour au menu de bienvenue
const boutonMenu = document.getElementById("boutonMenu");
boutonMenu.addEventListener("click", function () {
  this.blur();
  retourAccueil();
});

// retour au menu de bienvenue (touche Restart)
function retourAccueil() {
  arreterAide();
  cancelAnimationFrame(idAnimation);
  remiseAZero();
  toucheAppuyee = false;
  commence = false;
  panneau.style.display = "none";
  boutonReglages.classList.remove("ouvert");
  montrerAccueil();
}

// --- Pistolet à bulles : à partir de 20 points, Z lance une bulle qui fait éclater un pique ---
const tailleBulle = 16;
const munitionsDepart = 5;
const affichageMunitions = document.getElementById("munitions");
let munitions = munitionsDepart;
let bulles = [];

function majMunitions() {
  // pendant le boss, les bulles sont infinies
  affichageMunitions.textContent = "🫧 Z : " + (boss !== null ? "∞" : munitions);
  affichageMunitions.style.display = score >= 20 ? "block" : "none";
}

function tirer() {
  if (!commence || perdu || enPause || trou !== null) return;
  if (score < 20) return;
  if (boss === null) {
    if (munitions <= 0) return;
    munitions = munitions - 1;
  }
  majMunitions();
  const element = document.createElement("div");
  element.className = "bulle";
  element.textContent = "🫧";
  const y = hauteur + tailleBalle / 2 - tailleBulle / 2;
  element.style.bottom = y + "px";
  jeu.appendChild(element);
  bulles.push({ element: element, x: balleX + tailleBalle, y: y });
}

function bulleTouche(bulle, o) {
  const memeX = bulle.x + tailleBulle > o.x && bulle.x < o.x + tailleObstacle.largeur;
  // hauteur occupée par l'obstacle (en bas ou en haut)
  const bas = o.enHaut ? hauteurJeu - o.hauteur : 0;
  const haut = o.enHaut ? hauteurJeu : o.hauteur;
  const memeY = bulle.y + tailleBulle > bas && bulle.y < haut;
  return memeX && memeY;
}

function majBulles() {
  bulles = bulles.filter(function (b) {
    b.x = b.x + 10;
    b.element.style.left = b.x + "px";
    let touchee = false;
    // la bulle touche le boss : -20 points de vie
    if (boss !== null &&
        b.x + tailleBulle > boss.x && b.x < boss.x + tailleBoss &&
        b.y + tailleBulle > boss.y && b.y < boss.y + tailleBoss) {
      boss.pv = boss.pv - degatBulle;
      boss.rempli.style.width = Math.max(0, boss.pv) / pvBossMax * 100 + "%";
      touchee = true;
      if (boss.pv <= 0) bossVaincuFin();
    }
    for (const o of obstacles) {
      if (touchee) break;
      if (!o.detruit && bulleTouche(b, o)) {
        // l'obstacle éclate : +1 point
        o.detruit = true;
        o.element.remove();
        touchee = true;
        score = score + 1;
        affichageScore.textContent = "Score : " + score;
        majNuit();
        break;
      }
    }
    if (touchee || b.x > largeurJeu) {
      b.element.remove();
      return false;
    }
    return true;
  });
  obstacles = obstacles.filter(function (o) {
    return !o.detruit;
  });
}

// --- Traînée derrière la balle ---
function creerTrainee() {
  const element = document.createElement("div");
  element.className = "trainee";
  if (couleurTraineeChoisie === "arc") {
    // multicolore : la couleur change à chaque rond
    element.style.background = "hsl(" + ((compteur * 12) % 360) + ", 100%, 55%)";
  } else {
    element.style.background = couleurTraineeChoisie || choixCouleur.value;
  }
  // avec le jet pack, la traînée sort de la flamme (derrière la balle)
  const decalage = balle.classList.contains("ailes-jetpack") ? -30 : 0;
  element.style.left = balleX + tailleBalle / 2 - 7 + decalage + "px";
  element.style.bottom = hauteur + tailleBalle / 2 - 7 + "px";
  // quand l'animation est finie, on enlève le rond
  element.addEventListener("animationend", function () {
    element.remove();
  });
  jeu.insertBefore(element, balle);
}

// --- La fin du jeu : à 500 points, un trou arrive et la balle tombe dedans ---
const largeurTrou = 90;
let trou = null;
let tombe = false;

function lancerFinale() {
  // on enlève tout ce qui pourrait gêner
  for (const o of obstacles) o.element.remove();
  obstacles = [];
  for (const m of mouches) m.element.remove();
  mouches = [];
  for (const f of fusees) f.element.remove();
  fusees = [];
  message.textContent = "";
  const element = document.createElement("div");
  element.className = "trou";
  jeu.appendChild(element);
  trou = { element: element, x: largeurJeu };
}

function jouerFinale() {
  trou.x = trou.x - 3;
  trou.element.style.left = trou.x + "px";
  if (!tombe) {
    // la balle descend toute seule vers le sol
    hauteur = Math.max(0, hauteur - 3);
    if (trou.x <= balleX - 5) tombe = true;
  } else {
    // la balle tombe dans le trou
    hauteur = hauteur - 5;
  }
  balle.style.bottom = hauteur + "px";

  if (hauteur < -tailleBalle) {
    perdu = true; // pour pouvoir rejouer avec Espace
    message.textContent = "Bravo, tu as fini le jeu ! " + nomTouche(touches.monter) + " pour rejouer";
    return;
  }
  idAnimation = requestAnimationFrame(jouer);
}

function jouer() {
  if (score >= 500 && trou === null) lancerFinale();
  if (trou !== null) {
    jouerFinale();
    return;
  }

  if (toucheAppuyee) {
    hauteur = hauteur + 4; // la balle monte
  } else {
    hauteur = hauteur - 3; // la balle descend
  }

  // toucher le sol ou le plafond fait perdre
  if (hauteur <= 0) {
    hauteur = 0;
    perdu = true;
  }
  if (hauteur >= hauteurMax) {
    hauteur = hauteurMax;
    perdu = true;
  }

  balle.style.bottom = hauteur + "px";

  // un nouvel obstacle de temps en temps
  // la vitesse augmente peu à peu (maximum 8)
  compteur = compteur + 1;
  if (compteur % 2 === 0) creerTrainee();
  const vitesse = Math.min(3 + compteur / 600, 8) * facteurVitesse;
  distance = distance + vitesse;
  if (distance >= 270) {
    // pendant le boss, il n'y a plus de nouveaux piques
    if (boss === null) creerObstacle();
    distance = 0;
  }

  // à 200 points, le boss arrive (une seule fois par partie)
  if (score >= 200 && boss === null && !bossVaincu) creerBoss();
  if (boss !== null) majBoss();

  majBulles();

  // les obstacles avancent vers la gauche
  for (const o of obstacles) {
    o.x = o.x - vitesse;
    o.element.style.left = o.x + "px";
    if (touche(o)) perdu = true;

    // obstacle esquivé : il est passé derrière la balle
    if (!o.esquive && o.x + tailleObstacle.largeur < balleX) {
      o.esquive = true;
      score = score + 1;
      affichageScore.textContent = "Score : " + score;
      majNuit();
    }
  }

  // de temps en temps, une fusée apparaît (après un petit moment)
  if (compteur > 300 && boss === null && Math.random() < 0.005) creerFusee();

  // les fusées vont plus vite que les obstacles
  for (const f of fusees) {
    f.x = f.x - (vitesse + 3);
    f.element.style.left = f.x + "px";
    if (fuseeTouche(f)) perdu = true;
  }
  fusees = fusees.filter(function (f) {
    if (f.x < -tailleFusee.largeur) {
      f.element.remove();
      return false;
    }
    return true;
  });

  // une mouche apparaît de temps en temps (une seule à la fois)
  // (seulement quand on est loin des piques, pour ne pas apparaître dedans)
  if (compteur > 150 && mouches.length === 0 && distance > 90 && distance < 180 && Math.random() < 0.01) creerMouche();

  // la mouche zigzague et donne des points si on l'attrape
  mouches = mouches.filter(function (m) {
    m.x = m.x - vitesse; // même vitesse que les piques : elle reste entre deux piques
    m.t = m.t + 0.1;
    m.y = m.y0 + Math.sin(m.t) * 30;
    m.element.style.left = m.x + "px";
    m.element.style.bottom = m.y + "px";
    const attrapee =
      balleX < m.x + tailleMouche &&
      balleX + tailleBalle > m.x &&
      hauteur < m.y + tailleMouche &&
      hauteur + tailleBalle > m.y;
    if (attrapee) {
      score = score + 3;
      affichageScore.textContent = "Score : " + score;
      majNuit();
    }
    if (attrapee || m.x < -tailleMouche) {
      m.element.remove();
      return false;
    }
    return true;
  });

  // dans le désert, un cœur apparaît de temps en temps (un seul à la fois)
  if (score >= 20 && score < 50 && coeurs.length === 0 && distance > 90 && distance < 180 && Math.random() < 0.004) creerCoeur();

  // le cœur zigzague et donne une vie si on l'attrape
  coeurs = coeurs.filter(function (c) {
    c.x = c.x - vitesse;
    c.t = c.t + 0.1;
    c.y = c.y0 + Math.sin(c.t) * 30;
    c.element.style.left = c.x + "px";
    c.element.style.bottom = c.y + "px";
    const attrape =
      balleX < c.x + tailleMouche &&
      balleX + tailleBalle > c.x &&
      hauteur < c.y + tailleMouche &&
      hauteur + tailleBalle > c.y;
    if (attrape) {
      vies = vies + 1;
      majVies();
    }
    if (attrape || c.x < -tailleMouche) {
      c.element.remove();
      return false;
    }
    return true;
  });

  // on retire ceux qui sont sortis de l'écran
  obstacles = obstacles.filter(function (o) {
    if (o.x < -tailleObstacle.largeur) {
      o.element.remove();
      return false;
    }
    return true;
  });

  // nouveau record : on le montre et on le garde
  if (score > meilleur) {
    meilleur = score;
    affichageMeilleur.textContent = "Meilleur : " + meilleur;
    localStorage.setItem("meilleurScore", meilleur);
  }

  // juste après une vie perdue, on est protégé un moment
  if (invincible > 0) {
    invincible = invincible - 1;
    perdu = false;
    if (invincible === 0) balle.classList.remove("clignote");
  } else if (perdu && vies > 1) {
    // il reste des vies : on en perd une et on continue au milieu
    vies = vies - 1;
    majVies();
    perdu = false;
    hauteur = hauteurDepart;
    balle.style.bottom = hauteur + "px";
    invincible = 90;
    balle.classList.add("clignote");
  } else if (perdu) {
    vies = 0;
    majVies();
  }

  if (perdu) {
    message.textContent = "Perdu ! Appuie sur " + nomTouche(touches.monter) + " pour rejouer";
    pleure.style.display = "block";
    boutonRejouer.style.display = "block";
    boutonMenu.style.display = "block";
    return;
  }
  idAnimation = requestAnimationFrame(jouer);
}
