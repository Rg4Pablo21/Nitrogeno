/* Nitrógeno Quest — Juego educativo del ciclo del nitrógeno
   Controles: Flechas o WASD para moverse, ESPACIO para reaccionar,
   P para Pausa, R para Reinicio.
*/

(() => {
    // ===== Utilidades =====
    const $ = sel => document.querySelector(sel);
    const rand = (min, max) => Math.random() * (max - min) + min;
  
    // ===== HUD / UI =====
    const hud = {
      step: $("#hud-step"),
      score: $("#hud-score"),
      lives: $("#hud-lives"),
      time: $("#hud-time"),
    };
  
    const modal = $("#modal");
    const modalTitle = $("#modal-title");
    const modalText = $("#modal-text");
    const modalQuiz = $("#modal-quiz");
    const btnStart = $("#btn-start");
    const btnPause = $("#btn-pause");
    const btnReset = $("#btn-reset");
    const btnClose = $("#modal-close");
  
    // ===== Canvas =====
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
  
    // ===== Datos de etapas del ciclo =====
    const STAGES = [
      {
        key: "fijacion",
        name: "Fijación",
        emoji: "🌧️",
        color: "#4ED4F5",
        desc:
          "El N₂ de la atmósfera se convierte en amonio (NH₄⁺) gracias a relámpagos o bacterias fijadoras.",
        area: "atm",
      },
      {
        key: "nitrificacion",
        name: "Nitrificación",
        emoji: "🦠",
        color: "#A0F5CD",
        desc:
          "Bacterias del suelo oxidan NH₄⁺ a nitritos (NO₂⁻) y luego a nitratos (NO₃⁻).",
        area: "soil",
      },
      {
        key: "asimilacion",
        name: "Asimilación",
        emoji: "🌱",
        color: "#79F55E",
        desc:
          "Las plantas absorben NO₃⁻/NH₄⁺ desde el suelo e incorporan nitrógeno a proteínas.",
        area: "plant",
      },
      {
        key: "amonificacion",
        name: "Amonificación",
        emoji: "🦠",
        color: "#4EF5A7",
        desc:
          "Descomponedores transforman el nitrógeno orgánico de desechos en NH₄⁺.",
        area: "soil",
      },
      {
        key: "desnitrificacion",
        name: "Desnitrificación",
        emoji: "☁️",
        color: "#4EF5DF",
        desc:
          "Bacterias anaerobias reducen NO₃⁻ a N₂, devolviéndolo a la atmósfera.",
        area: "atm",
      },
    ];
  
    // ===== Banco de preguntas rápidas =====
    const QUIZ = [
      {
        q: "¿Qué proceso convierte N₂ en NH₄⁺?",
        options: [
          "Fijación",
          "Nitrificación",
          "Desnitrificación",
          "Amonificación",
          "Asimilación",
          "Fotosíntesis",
        ],
        correct: 0,
      },
      {
        q: "¿En qué proceso las plantas incorporan nitrógeno a biomoléculas?",
        options: [
          "Fijación",
          "Asimilación",
          "Amonificación",
          "Respiración",
          "Desnitrificación",
          "Fermentación",
        ],
        correct: 1,
      },
      {
        q: "¿Qué proceso devuelve N₂ a la atmósfera?",
        options: [
          "Amonificación",
          "Fijación",
          "Nitrificación",
          "Desnitrificación",
          "Asimilación",
          "Evaporación",
        ],
        correct: 3,
      },
      {
        q: "¿Quién oxida NH₄⁺ a NO₃⁻?",
        options: [
          "Hongos",
          "Bacterias nitrificantes",
          "Plantas",
          "Relámpagos",
          "Herbívoros",
          "Fitoplancton",
        ],
        correct: 1,
      },
      {
        q: "¿A qué se refiere la amonificación?",
        options: [
          "NH₄⁺ → NO₃⁻",
          "Materia orgánica → NH₄⁺",
          "N₂ → NH₄⁺",
          "NO₃⁻ → N₂",
          "NH₄⁺ → N₂",
          "NO₂⁻ → NH₄⁺",
        ],
        correct: 1,
      },
    ];
  
    // ===== Estados de juego =====
    const STATE = {
      INTRO: "intro",
      PLAY: "play",
      QUIZ: "quiz",
      PAUSE: "pause",
      WIN: "win",
      GAMEOVER: "gameover",
    };
  
    // ===== Mundo / Entidades =====
    const world = {
      gridPadding: 40,
      soilY: canvas.height - 120, // zona suelo
      plantX: canvas.width * 0.75,
      cloudY: 80,
    };
  
    class Player {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = canvas.width * 0.2;
        this.y = canvas.height * 0.5;
        this.r = 16;
        this.speed = 3.2;
        this.vx = 0;
        this.vy = 0;
        this.color = "#f5f5f5";
        this.shadow = "rgba(78,245,223,.35)";
      }
      move(input) {
        const accel = this.speed;
        this.vx = (input.right - input.left) * accel;
        this.vy = (input.down - input.up) * accel;
  
        this.x += this.vx;
        this.y += this.vy;
  
        // límites
        this.x = Math.max(this.r + 8, Math.min(canvas.width - this.r - 8, this.x));
        this.y = Math.max(this.r + 8, Math.min(canvas.height - this.r - 8, this.y));
      }
      draw(ctx) {
        // brillo
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, this.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = this.shadow;
        ctx.fill();
  
        // partícula central
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
  
        // etiqueta N₂
        ctx.fillStyle = "#0b1220";
        ctx.font = "bold 12px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N₂", this.x, this.y);
      }
      collides(station) {
        const dx = this.x - station.x;
        const dy = this.y - station.y;
        const dist = Math.hypot(dx, dy);
        return dist < this.r + station.r;
      }
    }
  
    class Station {
      constructor(x, y, stage) {
        this.x = x;
        this.y = y;
        this.r = 26;
        this.stage = stage; // objeto de STAGES
      }
      draw(ctx) {
        // anillo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = this.stage.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
  
        // punto
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = "#0b1a2c";
        ctx.fill();
        ctx.strokeStyle = this.stage.color;
        ctx.lineWidth = 2;
        ctx.stroke();
  
        // emoji
        ctx.font = "20px system-ui, emoji";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.stage.emoji, this.x, this.y - 2);
  
        // nombre
        ctx.font = "bold 12px ui-monospace, monospace";
        ctx.fillStyle = "#a7b5c6";
        ctx.fillText(this.stage.name, this.x, this.y + 26);
      }
    }
  
    // Crea estaciones con disposición significativa: atmósfera (arriba), suelo (abajo), planta (derecha)
    function buildStations() {
      const margin = 80;
      const centers = {
        atmLeft: { x: margin + 60, y: world.cloudY },
        atmRight: { x: canvas.width - margin - 60, y: world.cloudY },
        soilLeft: { x: margin + 80, y: world.soilY },
        soilRight: { x: canvas.width - margin - 120, y: world.soilY },
        plant: { x: world.plantX, y: canvas.height * 0.5 },
      };
  
      return [
        new Station(centers.atmLeft.x, centers.atmLeft.y, STAGES[0]), // Fijación (atm)
        new Station(centers.soilLeft.x, centers.soilLeft.y, STAGES[1]), // Nitrificación (suelo)
        new Station(centers.plant.x, centers.plant.y, STAGES[2]), // Asimilación (planta)
        new Station(centers.soilRight.x, centers.soilRight.y, STAGES[3]), // Amonificación (suelo)
        new Station(centers.atmRight.x, centers.atmRight.y, STAGES[4]), // Desnitrificación (atm)
      ];
    }
  
    // ===== Juego =====
    const Game = {
      state: STATE.INTRO,
      score: 0,
      lives: 3,
      time: 60,
      player: new Player(),
      stations: buildStations(),
      input: { up: 0, down: 0, left: 0, right: 0, space: false },
      stageIndex: 0,
      tick: 0,
      lastTime: 0,
      quizQueue: [],
  
      reset() {
        this.state = STATE.INTRO;
        this.score = 0;
        this.lives = 3;
        this.time = 60;
        this.player.reset();
        this.stations = buildStations();
        this.stageIndex = 0;
        this.tick = 0;
        this.quizQueue = shuffle(QUIZ).slice(0, 3); // 3 preguntas por partida
        updateHUD();
        showIntro();
      },
  
      start() {
        if (this.state === STATE.INTRO || this.state === STATE.GAMEOVER || this.state === STATE.WIN) {
          closeModal();
          this.state = STATE.PLAY;
        }
      },
  
      pauseToggle() {
        if (this.state === STATE.PLAY) this.state = STATE.PAUSE;
        else if (this.state === STATE.PAUSE) this.state = STATE.PLAY;
      },
  
      handleCollision() {
        const currentStation = this.stations[this.stageIndex];
        if (!currentStation) return;
  
        if (this.player.collides(currentStation)) {
          // requiere presionar espacio para confirmar reacción
          if (this.input.space) {
            // éxito en orden
            this.score += 100;
            toast(
              `✅ ${currentStation.stage.name}`,
              currentStation.stage.desc,
              currentStation.stage.color
            );
            this.stageIndex++;
  
            // cada dos etapas, dispara una pregunta si hay
            if (this.stageIndex < STAGES.length && this.quizQueue.length) {
              this.state = STATE.QUIZ;
              openQuiz(this.quizQueue.shift(), () => {
                this.state = STATE.PLAY;
              });
            }
  
            // victoria
            if (this.stageIndex >= STAGES.length) {
              this.win();
            }
          }
        } else {
          // si presiona espacio en lugar incorrecto: penaliza
          if (this.input.space) {
            this.fail("Reacción fuera de estación correcta");
          }
        }
      },
  
      fail(reason = "Acción incorrecta") {
        this.lives -= 1;
        shake();
        toast("❌ Fallo", `${reason}. -1 vida`, "#ef4444");
        if (this.lives <= 0) this.gameOver();
      },
  
      gameOver() {
        this.state = STATE.GAMEOVER;
        openModal(
          "🛑 Fin del juego",
          `Te quedaste sin vidas. Puntuación: ${this.score}. ¿Intentas de nuevo?`
        );
      },
  
      win() {
        this.state = STATE.WIN;
        this.score += Math.max(0, Math.floor(this.time) * 5);
        openModal(
          "🏆 ¡Completaste el ciclo!",
          `Excelente. Completaste todas las etapas del ciclo del nitrógeno.\nPuntuación final: ${this.score}`
        );
      },
  
      update(dt) {
        if (this.state !== STATE.PLAY) return;
  
        this.tick += dt;
  
        // cuenta regresiva
        this.time -= dt;
        if (this.time <= 0) {
          this.gameOver();
        }
  
        // mover jugador
        this.player.move(this.input);
  
        // pequeñas corrientes de viento arriba (atmósfera) que empujan
        if (this.player.y < world.cloudY + 60) {
          this.player.x += Math.sin(this.tick * 0.8) * 0.8;
        }
        // fricción en suelo
        if (this.player.y > world.soilY - 20) {
          this.player.x *= 0.999;
          this.player.y *= 0.999;
        }
  
        // colisiones / acciones
        this.handleCollision();
  
        // actualizar HUD
        updateHUD();
      },
  
      render() {
        // fondo
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        // capas ambientales
        drawAtmosphere();
        drawSoil();
        drawPlant();
  
        // camino guía hacia la estación actual
        const curr = this.stations[this.stageIndex];
        if (curr) drawGuide(this.player, curr);
  
        // estaciones
        for (const st of this.stations) st.draw(ctx);
  
        // jugador
        this.player.draw(ctx);
  
        // texto de ayuda
        if (curr) {
          ctx.fillStyle = "#a7b5c6";
          ctx.font = "bold 14px ui-monospace, monospace";
          ctx.textAlign = "left";
          ctx.fillText(
            `Siguiente: ${curr.stage.name} (${curr.stage.emoji}) — pulsa ESPACIO cuando estés sobre el punto`,
            16,
            28
          );
        }
  
        // estados
        if (this.state === STATE.PAUSE) {
          overlay("Pausa");
        } else if (this.state === STATE.INTRO) {
          overlay("Listo para empezar");
        }
      },
    };
  
    // ===== Dibujo de ambiente =====
    function drawAtmosphere() {
      // nube
      ctx.save();
      ctx.globalAlpha = 0.9;
      const gradient = ctx.createLinearGradient(0, 0, 0, world.cloudY + 60);
      gradient.addColorStop(0, "rgba(161, 239, 255, .18)");
      gradient.addColorStop(1, "rgba(161, 239, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, world.cloudY + 60);
      ctx.restore();
  
      // etiqueta
      ctx.fillStyle = "#9dcfe0";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("☁️ Atmósfera", 12, 18);
    }
  
    function drawSoil() {
      // franja suelo
      ctx.save();
      ctx.fillStyle = "rgba(112, 72, 40, .35)";
      ctx.fillRect(0, world.soilY - 24, canvas.width, canvas.height - (world.soilY - 24));
      ctx.restore();
  
      // etiqueta
      ctx.fillStyle = "#c9b29c";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("🟫 Suelo", 12, world.soilY - 32);
    }
  
    function drawPlant() {
      // planta estilizada a la derecha
      const baseX = world.plantX + 40;
      ctx.save();
      ctx.strokeStyle = "#79F55E";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(baseX, canvas.height - 80);
      ctx.quadraticCurveTo(baseX - 40, canvas.height - 180, baseX, canvas.height - 260);
      ctx.stroke();
  
      // hojas
      ctx.fillStyle = "#79F55E";
      ctx.beginPath();
      ctx.ellipse(baseX - 18, canvas.height - 210, 28, 14, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(baseX + 16, canvas.height - 250, 26, 12, 0.6, 0, Math.PI * 2);
      ctx.fill();
  
      // etiqueta
      ctx.fillStyle = "#a7d3ad";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("🌱 Planta", baseX + 8, canvas.height - 270);
      ctx.restore();
    }
  
    function drawGuide(player, target) {
      ctx.save();
      ctx.strokeStyle = "rgba(78,245,223,.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  
    function overlay(text) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 28px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  
    // ===== UI helpers =====
    function updateHUD() {
      hud.score.textContent = Game.score;
      hud.lives.textContent = Game.lives;
      hud.time.textContent = Math.max(0, Game.time | 0);
      hud.step.textContent =
        Game.stageIndex < STAGES.length ? STAGES[Game.stageIndex].name : "Completado";
    }
  
    function openModal(title, text) {
      modalTitle.textContent = title;
      modalText.textContent = text;
      modalQuiz.classList.add("hidden");
      if (!modal.open) modal.showModal();
    }
    function closeModal() {
      if (modal.open) modal.close();
    }
  
    function showIntro() {
      openModal(
        "🎮 Bienvenido",
        "Eres una molécula de N₂. Recorre el ciclo del nitrógeno en el orden correcto. " +
          "Muévete con WASD/flechas y presiona ESPACIO sobre cada estación."
      );
    }
  
    function toast(title, body, color = "#4ED4F5") {
      openModal(title, body);
      modal.querySelector(".modal-card").style.boxShadow =
        `0 25px 80px rgba(0,0,0,.5), 0 0 0 2px ${hexToRgba(color,.45)} inset`;
      // autocerrar tras breve tiempo si el usuario no interactúa
      setTimeout(() => closeModal(), 1200);
    }
  
    function hexToRgba(hex, a = 1) {
      const c = hex.replace("#", "");
      const bigint = parseInt(c, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r},${g},${b},${a})`;
    }
  
    function openQuiz(item, onClose) {
      modalTitle.textContent = "🧠 Pregunta rápida";
      modalText.textContent = item.q;
      modalQuiz.innerHTML = "";
      modalQuiz.classList.remove("hidden");
  
      const h4 = document.createElement("h4");
      h4.textContent = "Elige una opción:";
      modalQuiz.appendChild(h4);
  
      item.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (idx === item.correct) {
            btn.classList.add("correct");
            Game.score += 150;
            modalText.textContent = "¡Correcto! +150 puntos";
          } else {
            btn.classList.add("wrong");
            Game.fail("Respuesta incorrecta");
            modalText.textContent = "Respuesta incorrecta. -1 vida";
          }
          setTimeout(() => {
            closeModal();
            onClose && onClose();
          }, 650);
        });
        modalQuiz.appendChild(btn);
      });
  
      if (!modal.open) modal.showModal();
    }
  
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  
    // efecto de sacudida breve al fallar
    let shakeTime = 0;
    function shake() {
      shakeTime = 300; // ms
    }
  
    // ===== Entrada =====
    const KEYS = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
    };
    window.addEventListener("keydown", (e) => {
      if (KEYS[e.key]) Game.input[KEYS[e.key]] = 1;
      if (e.key === " ") Game.input.space = true;
      if (e.key === "p" || e.key === "P") Game.pauseToggle();
      if (e.key === "r" || e.key === "R") { Game.reset(); Game.start(); }
    });
    window.addEventListener("keyup", (e) => {
      if (KEYS[e.key]) Game.input[KEYS[e.key]] = 0;
      if (e.key === " ") Game.input.space = false;
    });
  
    // Botones UI
    btnStart.addEventListener("click", () => { Game.start(); });
    btnPause.addEventListener("click", () => { Game.pauseToggle(); });
    btnReset.addEventListener("click", () => { Game.reset(); Game.start(); });
    btnClose.addEventListener("click", () => closeModal());
  
    // ===== Bucle principal =====
    function loop(ts) {
      const dt = Game.lastTime ? (ts - Game.lastTime) / 1000 : 0;
      Game.lastTime = ts;
  
      Game.update(dt);
  
      // sacudida
      if (shakeTime > 0) {
        shakeTime -= dt * 1000;
        const dx = rand(-4, 4), dy = rand(-4, 4);
        ctx.save();
        ctx.translate(dx, dy);
        Game.render();
        ctx.restore();
      } else {
        Game.render();
      }
  
      requestAnimationFrame(loop);
    }
  
    // ===== Inicio =====
    Game.reset();
    requestAnimationFrame(loop);
  })();
  