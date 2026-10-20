const emojis = [
  "😂", "🤪", "🤡", "🐵", "🦆", "🥳", "😜", "🐸",
  "🤣", "🥴", "😝", "🙈", "🐧", "🦄", "🐙", "🦖",
  "💩", "👻", "🤠", "🥸", "🐔", "🦒", "🍕", "🧀"
];

// Musiques drôles créées par le navigateur (aucun fichier à télécharger)
// Chaque nombre est une note. 0 veut dire un silence.
// "vitesse" = temps entre deux notes (en millisecondes).
const musiques = [
  {
    nom: "Cirque",
    son: "square",
    vitesse: 200,
    notes: [
      262, 330, 392, 330, 262, 330, 392, 0,
      440, 523, 440, 392, 349, 330, 294, 0,
      262, 0, 262, 0, 392, 523, 392, 0,
      523, 494, 440, 392, 330, 262, 0, 0
    ]
  },
  {
    nom: "Canard",
    son: "sawtooth",
    vitesse: 150,
    notes: [
      392, 392, 0, 392, 330, 0, 392, 0,
      523, 0, 523, 392, 0, 330, 262, 0,
      294, 294, 0, 294, 349, 0, 294, 0,
      196, 262, 330, 392, 330, 262, 0, 0
    ]
  },
  {
    nom: "Dinosaure",
    son: "triangle",
    vitesse: 250,
    notes: [
      131, 0, 131, 165, 196, 0, 196, 0,
      175, 0, 175, 220, 262, 0, 262, 0,
      196, 262, 196, 262, 196, 262, 0, 0,
      131, 0, 0, 0, 98, 0, 0, 0
    ]
  },
  {
    nom: "Robot",
    son: "square",
    vitesse: 120,
    notes: [
      523, 659, 784, 1047, 784, 659, 523, 0,
      440, 554, 659, 880, 659, 554, 440, 0,
      784, 0, 784, 0, 1047, 1047, 0, 0,
      659, 523, 659, 523, 392, 0, 0, 0
    ]
  }
];

const boutonMusique = document.getElementById("musique");
const boutonStop = document.getElementById("stop");
let audio = null;
let minuteur = null;
let musiqueActuelle = null;
let numeroNote = 0;

function jouerNote() {
  const note = musiqueActuelle.notes[numeroNote];
  numeroNote = (numeroNote + 1) % musiqueActuelle.notes.length;
  if (note === 0) {
    return;
  }
  const debut = audio.currentTime;
  const son = audio.createOscillator();
  const volume = audio.createGain();
  son.type = musiqueActuelle.son;
  son.frequency.setValueAtTime(note * 1.5, debut);
  son.frequency.exponentialRampToValueAtTime(note, debut + 0.1);
  volume.gain.setValueAtTime(0.06, debut);
  volume.gain.exponentialRampToValueAtTime(0.001, debut + 0.18);
  son.connect(volume);
  volume.connect(audio.destination);
  son.start(debut);
  son.stop(debut + 0.2);
}

function arreterMusique() {
  if (minuteur !== null) {
    clearInterval(minuteur);
    minuteur = null;
    audio.close();
    audio = null;
  }
}

// À chaque clic, on choisit une musique au hasard (différente de la précédente)
boutonMusique.addEventListener("click", function () {
  let nouvelle;
  do {
    nouvelle = musiques[Math.floor(Math.random() * musiques.length)];
  } while (nouvelle === musiqueActuelle);

  arreterMusique();
  musiqueActuelle = nouvelle;
  audio = new AudioContext();
  numeroNote = 0;
  jouerNote();
  minuteur = setInterval(jouerNote, musiqueActuelle.vitesse);
  boutonMusique.textContent = "🎵 Musique : " + musiqueActuelle.nom;
});

boutonStop.addEventListener("click", function () {
  arreterMusique();
  boutonMusique.textContent = "🎵 Musique";
});

const bouton = document.getElementById("bouton");
const zoneEmoji = document.getElementById("emoji");

bouton.addEventListener("click", function () {
  const numero = Math.floor(Math.random() * emojis.length);
  zoneEmoji.textContent = emojis[numero];
});
