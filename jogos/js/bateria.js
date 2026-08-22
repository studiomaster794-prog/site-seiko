(function (global) {
  const TYPES = [
    { id: "377", name: "377", size: "sm" },
    { id: "2025", name: "2025", size: "md" },
    { id: "2032", name: "2032", size: "lg" },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render(root) {
    const N = 6;
    let watches = [];
    let score = 0;
    let lives = 3;
    let combo = 0;
    let saved = 0;
    let level = 1;
    let running = false;
    let raf = 0;
    let spawnAt = 0;
    let interval = 4200;
    let windowMs = 5000;
    let started = false;
    let held = null;
    let nowStamp = 0;

    function makeWatches() {
      const types = shuffle(["377", "377", "2025", "2025", "2032", "2032"]);
      return types.map((type, i) => ({
        i,
        type,
        state: "idle",
        until: 0,
        rot: Math.random() * 360,
        flash: 0,
      }));
    }

    function reset() {
      watches = makeWatches();
      score = 0;
      lives = 3;
      combo = 0;
      saved = 0;
      level = 1;
      interval = 4200;
      windowMs = 5000;
      running = false;
      started = false;
      spawnAt = 0;
      held = null;
      shell();
      paint("Quando o ponteiro parar: pegue a bateria do mesmo código e encaixe no relógio.");
    }

    function trayHtml() {
      return (
        '<div class="tray" aria-label="Gaveta de baterias">' +
        TYPES.map(
          (t) =>
            '<button class="cell-batt" data-batt="' +
            t.id +
            '" type="button">' +
            '<span class="coin ' +
            t.size +
            " coin-" +
            t.id +
            '"></span>' +
            "<strong>" +
            t.name +
            "</strong>" +
            "<span>bateria</span></button>"
        ).join("") +
        "</div>"
      );
    }

    function shell() {
      const items = watches
        .map(
          (w) =>
            '<button class="watch" data-i="' +
            w.i +
            '" type="button" aria-label="relógio ' +
            (w.i + 1) +
            ", bateria " +
            w.type +
            '">' +
            '<span class="type-tag">' +
            w.type +
            "</span>" +
            '<span class="life"></span>' +
            '<span class="clock">' +
            '<span class="hand hour"></span>' +
            '<span class="hand minute"></span>' +
            '<span class="hand second"></span></span></button>'
        )
        .join("");
      root.innerHTML =
        SS.topbarGame("Salve o Relógio", '<div class="hud-score" data-score>0</div>') +
        '<main class="stage">' +
        '<div class="statbar">' +
        '<div class="stat"><b data-lives>3</b><span>vidas</span></div>' +
        '<div class="stat"><b data-level>1</b><span>nível</span></div>' +
        '<div class="stat"><b data-combo>0x</b><span>combo</span></div>' +
        "</div>" +
        '<div class="bench">' +
        items +
        "</div>" +
        trayHtml() +
        '<p class="status-line" data-msg></p>' +
        '<button class="btn btn-gold btn-block" data-start type="button">Começar atendimento</button>' +
        "</main>";
      root.querySelectorAll(".watch").forEach((btn) => {
        btn.addEventListener("click", () => tapWatch(+btn.dataset.i));
      });
      root.querySelectorAll("[data-batt]").forEach((btn) => {
        btn.addEventListener("click", () => tapBatt(btn.getAttribute("data-batt")));
      });
      const start = root.querySelector("[data-start]");
      if (start) start.addEventListener("click", begin);
    }

    function paint(msg) {
      if (!root.querySelector(".bench")) shell();
      root.querySelector("[data-score]").textContent = SS.formatScore(score);
      root.querySelector("[data-lives]").textContent = lives;
      root.querySelector("[data-level]").textContent = level;
      root.querySelector("[data-combo]").textContent = combo + "x";
      if (msg) root.querySelector("[data-msg]").textContent = msg;
      const startBtn = root.querySelector("[data-start]");
      if (startBtn) startBtn.hidden = started;
      root.querySelectorAll("[data-batt]").forEach((btn) => {
        btn.classList.toggle("held", btn.getAttribute("data-batt") === held);
      });
      watches.forEach((w) => {
        const el = root.querySelector('.watch[data-i="' + w.i + '"]');
        if (!el) return;
        el.classList.toggle("dying", w.state === "dying");
        el.classList.toggle("dead", w.state === "dead");
        el.classList.toggle("saved", w.state === "saved");
        el.classList.toggle("wrong", w.flash > nowStamp);
        const life = el.querySelector(".life");
        if (w.state === "dying" && w.until) {
          const left = Math.max(0, Math.min(1, (w.until - nowStamp) / windowMs));
          life.style.width = left * 100 + "%";
        } else {
          life.style.width = "0";
        }
        const h = el.querySelector(".hour");
        const m = el.querySelector(".minute");
        const s = el.querySelector(".second");
        h.style.transform = "rotate(" + w.rot * 0.08 + "deg)";
        m.style.transform = "rotate(" + w.rot * 0.4 + "deg)";
        s.style.transform = "rotate(" + w.rot + "deg)";
      });
    }

    function begin() {
      if (started) return;
      started = true;
      running = true;
      held = null;
      paint("Pegue a bateria e encaixe no relógio que parar.");
      raf = requestAnimationFrame(loop);
      SS.haptic(10);
    }

    function spawn(now) {
      const idle = watches.filter((w) => w.state === "idle" || w.state === "saved");
      if (!idle.length) return;
      const n = level >= 5 && idle.length > 1 && Math.random() < 0.28 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const pool = watches.filter((w) => w.state === "idle" || w.state === "saved");
        if (!pool.length) break;
        const w = pool[Math.floor(Math.random() * pool.length)];
        w.state = "dying";
        w.until = now + windowMs;
      }
    }

    function loop(now) {
      if (!running) return;
      nowStamp = now;
      if (!spawnAt) spawnAt = now + 1800;
      if (now >= spawnAt) {
        spawn(now);
        spawnAt = now + interval;
      }
      watches.forEach((w) => {
        if (!running) return;
        if (w.state === "idle" || w.state === "saved") w.rot = (w.rot + 6) % 360;
        if (w.state === "dying" && now >= w.until) {
          w.state = "dead";
          lives -= 1;
          combo = 0;
          held = null;
          SS.haptic([30, 40, 30]);
          setTimeout(() => {
            if (w.state === "dead") w.state = "idle";
          }, 480);
          if (lives <= 0) gameOver();
        }
      });
      if (running) {
        paint();
        raf = requestAnimationFrame(loop);
      }
    }

    function tapBatt(id) {
      if (!started) {
        begin();
        held = id;
        paint("Agora encaixe no relógio que parou — código " + id + ".");
        SS.haptic(8);
        return;
      }
      if (!running) return;
      held = held === id ? null : id;
      paint(held ? "Bateria " + held + " na mão. Encaixe no relógio certo." : "Pegue uma bateria na gaveta.");
      SS.haptic(8);
    }

    function tapWatch(i) {
      if (!started) {
        begin();
        return;
      }
      if (!running) return;
      const w = watches[i];
      if (!held) {
        paint("Primeiro pegue a bateria na gaveta. Este relógio usa " + w.type + ".");
        SS.haptic(4);
        return;
      }
      if (w.state !== "dying") {
        combo = 0;
        w.flash = nowStamp + 280;
        paint("Esse ainda está funcionando. Vá no que parou.");
        SS.haptic(4);
        return;
      }
      if (held !== w.type) {
        combo = 0;
        w.flash = nowStamp + 320;
        score = Math.max(0, score - 12);
        paint("Bateria errada. Ele precisa da " + w.type + ".");
        SS.haptic([12, 30, 12]);
        return;
      }
      w.state = "saved";
      saved += 1;
      combo += 1;
      const gain = (12 + level * 5) * Math.min(combo, 8);
      score += gain;
      held = null;
      paint("Trocou a " + w.type + ". +" + gain);
      SS.haptic(14);
      if (saved % 8 === 0) {
        level += 1;
        interval = Math.max(1500, interval * 0.88);
        windowMs = Math.max(1800, windowMs * 0.9);
      }
      setTimeout(() => {
        if (w.state === "saved") w.state = "idle";
      }, 280);
    }

    function gameOver() {
      running = false;
      cancelAnimationFrame(raf);
      paint("As baterias acabaram");
      setTimeout(() => {
        SS.overlay.show({
          gameId: "bateria",
          score,
          kicker: "Fim de jogo",
          title: score ? "Você salvou " + saved + " relógios" : "As baterias venceram",
          extraCta: {
            label: "Meu relógio parou — WhatsApp",
            href: SS.waLink(
              "Olá! Meu relógio precisa de troca de bateria. Posso enviar uma foto para orçamento?",
              SS.CONFIG.whatsapp
            ),
          },
          shopText:
            "Olá! Joguei o Salve o Relógio no site. Meu relógio também parou — podem me orientar na troca de bateria?",
          onAgain: reset,
        });
      }, 500);
    }

    reset();
    return function cleanup() {
      running = false;
      cancelAnimationFrame(raf);
    };
  }

  global.SSBateria = { render };
})(window);
