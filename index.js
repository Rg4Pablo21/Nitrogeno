// ============================
// Nito y el Ciclo del Nitrógeno
// ============================

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const state = {
  levelIndex: 0,
  score: 0,
  lives: 3,
  lockedNext: true,
  answered: false
};

// Banco de niveles (para niños): en cada etapa deben elegir el proceso correcto.
// correct: id de opción correcta.
const LEVELS = [
  {
    badge: "Etapa 1",
    title: "¡Comienza la aventura!",
    story: "Nito está en el aire como N₂. ¿Cómo puede entrar al suelo?",
    question: "Elige el proceso correcto para convertir N₂ en NH₃/NH₄⁺.",
    options: [
      { id:"fijacion", text:"Fijación (rayos o bacterias)", emoji:"🌩️🦠" },
      { id:"nitrificacion", text:"Nitrificación", emoji:"🔁🧫" },
      { id:"desnitrificacion", text:"Desnitrificación", emoji:"🌬️" },
      { id:"evaporacion", text:"Evaporación", emoji:"💧" }
    ],
    correct: "fijacion",
    onSuccess: () => toast("¡Bien! Nito llegó al suelo como NH₄⁺.")
  },
  {
    badge: "Etapa 2",
    title: "Cambio en el suelo",
    story: "En el suelo, bacterias transforman el amonio.",
    question: "¿Qué proceso convierte NH₄⁺ → NO₂⁻ → NO₃⁻?",
    options: [
      { id:"nitrificacion", text:"Nitrificación", emoji:"🧫➡️" },
      { id:"amonificacion", text:"Amonificación", emoji:"🪱" },
      { id:"fotosintesis", text:"Fotosíntesis", emoji:"🌿☀️" },
      { id:"fusion", text:"Fusión nuclear", emoji:"☢️" }
    ],
    correct: "nitrificacion",
    onSuccess: () => toast("¡Perfecto! Ahora Nito es NO₃⁻.")
  },
  {
    badge: "Etapa 3",
    title: "Hora de comer",
    story: "Las plantas necesitan nitrógeno para crecer.",
    question: "¿Cómo entra el nitrógeno a la planta?",
    options: [
      { id:"asimilacion", text:"Asimilación (la planta toma NO₃⁻/NH₄⁺)", emoji:"🌱🍽️" },
      { id:"desnitrificacion", text:"Desnitrificación", emoji:"🌬️" },
      { id:"respiracion", text:"Respiración", emoji:"🫁" },
      { id:"destilacion", text:"Destilación", emoji:"⚗️" }
    ],
    correct: "asimilacion",
    onSuccess: () => toast("¡Yupi! Nito ahora está dentro de la planta.")
  },
  {
    badge: "Etapa 4",
    title: "Vuelta al suelo",
    story: "Cuando caen hojas o un animal hace popó, vuelve nitrógeno al suelo.",
    question: "¿Cómo se llama el proceso restos → NH₄⁺?",
    options: [
      { id:"amonificacion", text:"Amonificación", emoji:"🪱🍂" },
      { id:"sublimacion", text:"Sublimación", emoji:"❄️" },
      { id:"filtracion", text:"Filtración", emoji:"🧪" },
      { id:"nitrificacion", text:"Nitrificación", emoji:"🧫" }
    ],
    correct: "amonificacion",
    onSuccess: () => toast("¡Bien! Se generó más NH₄⁺ en el suelo.")
  },
  {
    badge: "Etapa 5",
    title: "De vuelta al aire",
    story: "Algunas bacterias cierran el ciclo devolviendo nitrógeno al aire.",
    question: "¿Qué proceso cambia NO₃⁻ → N₂ (gas)?",
    options: [
      { id:"desnitrificacion", text:"Desnitrificación", emoji:"🌬️" },
      { id:"oxidacion", text:"Oxidación", emoji:"🔥" },
      { id:"asimilacion", text:"Asimilación", emoji:"🌱" },
      { id:"fermentacion", text:"Fermentación", emoji:"🧪" }
    ],
    correct: "desnitrificacion",
    onSuccess: () => toast("¡Ganaste! Nito volvió a la atmósfera como N₂.")
  }
];

// Elementos UI
const elScore = $("#score");
const elLives = $("#lives");
const elLevel = $("#level");
const elBadge = $("#badge");
const elTitle = $("#title");
const elStory = $("#story");
const elQuestion = $("#question");
const elOptions = $("#options");
const elNext = $("#btn-next");
const elRestart = $("#btn-restart");
const elToast = $("#toast");
const elHelpBtn = $("#btn-help");
const elHelpModal = $("#help-modal");
const elHelpClose = $("#help-close");
const elNito = $("#nito");

function init(){
  // reset parcial si venimos de reinicio
  renderHUD();
  loadLevel(state.levelIndex);
  wireEvents();
}

function wireEvents(){
  elNext.addEventListener("click", onNext);
  elRestart.addEventListener("click", onRestart);
  elHelpBtn.addEventListener("click", ()=> elHelpModal.showModal());
  elHelpClose.addEventListener("click", ()=> elHelpModal.close());
}

function renderHUD(){
  elScore.textContent = state.score;
  elLives.textContent = state.lives;
  elLevel.textContent = `${state.levelIndex+1} / ${LEVELS.length}`;
  elNext.disabled = state.lockedNext;
}

function loadLevel(i){
  const L = LEVELS[i];
  if(!L) return winGame();

  state.lockedNext = true;
  state.answered = false;
  renderHUD();

  elBadge.textContent = L.badge;
  elTitle.textContent = L.title;
  elStory.textContent = L.story;
  elQuestion.textContent = L.question;

  // Reposicionar a Nito con animación suave en cada nivel
  moveNito(i);

  // Construir opciones
  elOptions.innerHTML = "";
  const shuffled = shuffle([...L.options]);
  shuffled.forEach(opt=>{
    const btn = document.createElement("button");
    btn.className = "option";
    btn.dataset.id = opt.id;
    btn.innerHTML = `
      <span class="emoji">${opt.emoji}</span>
      <span class="txt">${opt.text}</span>
    `;
    btn.addEventListener("click", ()=> onPick(opt.id));
    elOptions.appendChild(btn);
  });
}

function onPick(id){
  if(state.answered) return; // evitar doble click
  state.answered = true;

  const L = LEVELS[state.levelIndex];
  const correctId = L.correct;

  $$(".option").forEach(o=> o.disabled = true);

  if(id === correctId){
    highlight(id, true);
    addScore(100);
    L.onSuccess && L.onSuccess();
    state.lockedNext = false;
    renderHUD();
  } else {
    highlight(id, false);
    damage();
    toast("Ups, intenta de nuevo. Pista: lee la Enciclopedia 📘");
    // permitir otro intento en el mismo nivel mientras tenga vidas
    state.answered = false;
    $$(".option").forEach(o=> o.disabled = false);
  }
}

function highlight(id, ok){
  $$(".option").forEach(o=>{
    if(o.dataset.id === id){
      o.classList.add(ok ? "correct":"wrong");
    }
  });
  // Resaltar también la correcta si falló
  if(!ok){
    const L = LEVELS[state.levelIndex];
    const correctBtn = $$(".option").find(o=> o.dataset.id === L.correct);
    if(correctBtn) correctBtn.classList.add("correct");
  }
}

function addScore(n){
  state.score += n;
  elScore.textContent = state.score;
  pulse(elScore);
}

function damage(){
  state.lives--;
  elLives.textContent = state.lives;
  shake(elLives);
  if(state.lives <= 0){
    return gameOver();
  }
}

function onNext(){
  if(state.lockedNext) return;
  state.levelIndex++;
  if(state.levelIndex >= LEVELS.length){
    return winGame();
  }
  // pequeñísima pausa para feedback
  setTimeout(()=> loadLevel(state.levelIndex), 250);
}

function onRestart(){
  state.levelIndex = 0;
  state.score = 0;
  state.lives = 3;
  state.lockedNext = true;
  state.answered = false;
  renderHUD();
  loadLevel(0);
  toast("Juego reiniciado. ¡Buena suerte!");
}

function gameOver(){
  elOptions.innerHTML = "";
  elQuestion.textContent = "Se acabaron tus vidas. ¿Quieres intentarlo otra vez?";
  elTitle.textContent = "¡Game Over!";
  elStory.textContent = "Revisa la Enciclopedia para aprender y volver a jugar.";
  state.lockedNext = true;
  renderHUD();
}

function winGame(){
  elOptions.innerHTML = "";
  elTitle.textContent = "¡Ciclo completado! 🎉";
  elStory.textContent = "Nito volvió a la atmósfera como N₂. ¡Has cerrado el ciclo!";
  elQuestion.textContent = `Puntuación final: ${state.score}. Puedes reiniciar para mejorar tu marca.`;
  state.lockedNext = true;
  renderHUD();
}

// ---------- Utilidades UI ----------
function toast(msg){
  elToast.textContent = msg;
  elToast.classList.add("show");
  setTimeout(()=> elToast.classList.remove("show"), 2000);
}

function pulse(el){
  el.animate([
    { transform:"scale(1)" },
    { transform:"scale(1.12)" },
    { transform:"scale(1)" }
  ], { duration:300, easing:"ease-out" });
}

function shake(el){
  el.animate([
    { transform:"translateX(0)" },
    { transform:"translateX(-6px)" },
    { transform:"translateX(6px)" },
    { transform:"translateX(0)" }
  ], { duration:250, easing:"ease-in-out" });
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Mover a Nito según nivel para dar sensación de viaje
function moveNito(i){
  // posiciones predefinidas
  const positions = [
    {top: "15%", left:"10%"},
    {top: "22%", left:"70%"},
    {top: "50%", left:"15%"},
    {top: "58%", left:"70%"},
    {top: "18%", left:"45%"},
  ];
  const p = positions[i % positions.length];
  elNito.animate(
    [
      { transform:"translateY(0)", offset:0},
      { transform:"translateY(-8px)", offset:.5},
      { transform:"translateY(0)", offset:1}
    ],
    { duration: 900, iterations:1 }
  );
  elNito.style.top = p.top;
  elNito.style.left = p.left;
}

// Iniciar
init();
