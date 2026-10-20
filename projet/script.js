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

const accueil = document.getElementById("accueil");
const choixCouleur = document.getElementById("couleur");

choixCouleur.addEventListener("change", function () {
  balle.style.background = choixCouleur.value;
  choixCouleur.blur();
});

// --- Menu paramètres ---
const panneau = document.getElementById("panneau");
const boutonReglages = document.getElementById("reglages");
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

function montrerOnglet(general) {
  ongletGeneral.style.display = general ? "block" : "none";
  ongletApparence.style.display = general ? "none" : "block";
  tabGeneral.classList.toggle("actif", general);
  tabApparence.classList.toggle("actif", !general);
}

tabGeneral.addEventListener("click", function () {
  tabGeneral.blur();
  montrerOnglet(true);
});

tabApparence.addEventListener("click", function () {
  tabApparence.blur();
  montrerOnglet(false);
});

// --- Apparence de la balle ---
const choixApparence = document.getElementById("apparence");

choixApparence.addEventListener("change", function () {
  balle.textContent = choixApparence.value;
  balle.classList.toggle("emoji", choixApparence.value !== "");
  choixApparence.blur();
});

// --- Musique drôle (créée par le navigateur, sans fichier) ---
const notes = [262, 330, 392, 330, 294, 370, 440, 370, 262, 523, 392, 330, 392, 262, 196, 262];
let contexteSon = null;
let minuteurMusique = null;
let numeroNote = 0;

function jouerNote() {
  const oscillateur = contexteSon.createOscillator();
  const volume = contexteSon.createGain();
  oscillateur.type = "square";
  oscillateur.frequency.value = notes[numeroNote];
  volume.gain.setValueAtTime(0.05, contexteSon.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, contexteSon.currentTime + 0.18);
  oscillateur.connect(volume);
  volume.connect(contexteSon.destination);
  oscillateur.start();
  oscillateur.stop(contexteSon.currentTime + 0.2);
  numeroNote = (numeroNote + 1) % notes.length;
}

boutonMusique.addEventListener("click", function () {
  boutonMusique.blur();
  if (minuteurMusique === null) {
    if (contexteSon === null) contexteSon = new AudioContext();
    contexteSon.resume();
    minuteurMusique = setInterval(jouerNote, 220);
    boutonMusique.textContent = "Musique drôle : OUI";
  } else {
    clearInterval(minuteurMusique);
    minuteurMusique = null;
    boutonMusique.textContent = "Musique drôle : NON";
  }
});

document.getElementById("jouer").addEventListener("click", function () {
  this.blur();
  accueil.style.display = "none";
  commence = true;
  jouer();
});

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && commence) {
    toucheAppuyee = true;
    e.preventDefault();
    if (perdu) recommencer();
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    toucheAppuyee = false;
  }
});

function creerObstacle() {
  const element = document.createElement("div");
  element.className = "obstacle";
  // au hasard : obstacle en bas ou en haut
  const enHaut = Math.random() < 0.5;
  // taille au hasard entre 120 et 340 (les grands bloquent le milieu)
  const hauteurObstacle = 120 + Math.random() * 220;
  element.style.height = hauteurObstacle + "px";
  // gris au hasard (clair, moyen ou foncé)
  const couleurs = ["#9e9e9e", "#757575", "#616161", "#bdbdbd"];
  element.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
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

function creerFusee() {
  const element = document.createElement("div");
  element.className = "fusee";
  element.textContent = "🚀";
  // couleur au hasard
  element.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";
  // hauteur au hasard
  const y = 20 + Math.random() * (hauteurJeu - 80);
  element.style.bottom = y + "px";
  jeu.appendChild(element);
  fusees.push({ element: element, x: largeurJeu, y: y });
}

// --- Mouche bonus : l'attraper donne 3 points ---
const tailleMouche = 26;
let mouches = [];

function creerMouche() {
  const element = document.createElement("div");
  element.className = "mouche";
  element.textContent = "🪰";
  jeu.appendChild(element);
  const y = 60 + Math.random() * (hauteurJeu - 160);
  mouches.push({ element: element, x: largeurJeu, y: y, y0: y, t: 0 });
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
}

function remiseAZero() {
  for (const o of obstacles) o.element.remove();
  obstacles = [];
  for (const m of mouches) m.element.remove();
  mouches = [];
  for (const f of fusees) f.element.remove();
  fusees = [];
  hauteur = hauteurDepart;
  compteur = 0;
  distance = 0;
  score = 0;
  affichageScore.textContent = "Score : 0";
  majNuit();
  perdu = false;
  message.textContent = "";
  pleure.style.display = "none";
  balle.style.bottom = hauteur + "px";
}

function recommencer() {
  remiseAZero();
  jouer();
}

// bouton Restart : retour au menu de bienvenue
document.getElementById("restart").addEventListener("click", function () {
  this.blur();
  cancelAnimationFrame(idAnimation);
  remiseAZero();
  toucheAppuyee = false;
  commence = false;
  panneau.style.display = "none";
  boutonReglages.classList.remove("ouvert");
  accueil.style.display = "block";
});

function jouer() {
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
  const vitesse = Math.min(3 + compteur / 600, 8);
  distance = distance + vitesse;
  if (distance >= 270) {
    creerObstacle();
    distance = 0;
  }

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
  if (compteur > 300 && Math.random() < 0.005) creerFusee();

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
  if (compteur > 150 && mouches.length === 0 && Math.random() < 0.004) creerMouche();

  // la mouche zigzague et donne des points si on l'attrape
  mouches = mouches.filter(function (m) {
    m.x = m.x - (vitesse + 1);
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

  // on retire ceux qui sont sortis de l'écran
  obstacles = obstacles.filter(function (o) {
    if (o.x < -tailleObstacle.largeur) {
      o.element.remove();
      return false;
    }
    return true;
  });

  if (perdu) {
    message.textContent = "Perdu ! Appuie sur Espace pour rejouer";
    pleure.style.display = "block";
    return;
  }
  idAnimation = requestAnimationFrame(jouer);
}
