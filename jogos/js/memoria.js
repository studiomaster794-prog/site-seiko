(function (global) {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render(root) {
    let cards = [];
    let open = [];
    let lock = false;
    let moves = 0;
    let matches = 0;
    let started = 0;
    let tick = null;
    let elapsed = 0;

    function boot() {
      const deck = shuffle(SS.WATCHES.concat(SS.WATCHES)).map((w, i) => ({
        uid: i + "-" + w.id,
        id: w.id,
        img: w.img,
        name: w.name,
        matched: false,
        flipped: false,
      }));
      cards = deck;
      open = [];
      lock = false;
      moves = 0;
      matches = 0;
      started = Date.now();
      elapsed = 0;
      if (tick) clearInterval(tick);
      tick = setInterval(() => {
        elapsed = Math.floor((Date.now() - started) / 1000);
        const el = root.querySelector("[data-time]");
        if (el) el.textContent = elapsed + "s";
        const s = root.querySelector("[data-score]");
        if (s) s.textContent = SS.formatScore(scoreNow());
      }, 250);
      shell();
      paint();
    }

    function scoreNow() {
      const raw = 10000 - elapsed * 12 - Math.max(0, moves - 8) * 40;
      return Math.max(200, raw);
    }

    function shell() {
      const html = cards
        .map(
          (c, i) =>
            '<button class="card" data-i="' +
            i +
            '" aria-label="carta virada">' +
            '<span class="card-inner">' +
            '<span class="face back">S</span>' +
            '<span class="face front"><img src="' +
            c.img +
            '" alt="' +
            c.name +
            '" draggable="false"></span>' +
            "</span></button>"
        )
        .join("");
      root.innerHTML =
        SS.topbarGame("Memória dos Relógios", '<div class="hud-score" data-score>0</div>') +
        '<main class="stage">' +
        '<div class="statbar">' +
        '<div class="stat"><b data-time>0s</b><span>tempo</span></div>' +
        '<div class="stat"><b data-moves>0</b><span>jogadas</span></div>' +
        '<div class="stat"><b data-pairs>0/8</b><span>pares</span></div>' +
        "</div>" +
        '<div class="mem-grid">' +
        html +
        "</div></main>";
      root.querySelectorAll(".card").forEach((btn) => {
        btn.addEventListener("click", () => flip(+btn.dataset.i));
      });
    }

    function paint() {
      if (!root.querySelector(".mem-grid")) shell();
      const scoreEl = root.querySelector("[data-score]");
      if (scoreEl) scoreEl.textContent = SS.formatScore(scoreNow());
      const t = root.querySelector("[data-time]");
      if (t) t.textContent = elapsed + "s";
      const m = root.querySelector("[data-moves]");
      if (m) m.textContent = String(moves);
      const p = root.querySelector("[data-pairs]");
      if (p) p.textContent = matches + "/8";
      cards.forEach((c, i) => {
        const el = root.querySelector('.card[data-i="' + i + '"]');
        if (!el) return;
        el.classList.toggle("flipped", c.flipped || c.matched);
        el.classList.toggle("matched", c.matched);
        el.setAttribute("aria-label", c.flipped || c.matched ? c.name : "carta virada");
      });
    }

    function flip(i) {
      const c = cards[i];
      if (lock || c.flipped || c.matched) return;
      c.flipped = true;
      open.push(i);
      SS.haptic(8);
      paint();
      if (open.length < 2) return;
      moves += 1;
      const a = cards[open[0]];
      const b = cards[open[1]];
      if (a.id === b.id) {
        a.matched = b.matched = true;
        open = [];
        matches += 1;
        SS.haptic(18);
        paint();
        if (matches === 8) done();
      } else {
        lock = true;
        setTimeout(() => {
          a.flipped = b.flipped = false;
          open = [];
          lock = false;
          paint();
        }, 700);
      }
    }

    function done() {
      if (tick) clearInterval(tick);
      const score = scoreNow();
      const gallery = SS.WATCHES.map(
        (w) =>
          '<a href="' +
          SS.waLink(w.wa, SS.CONFIG.whatsapp) +
          '" target="_blank" rel="noopener">' +
          '<img src="' +
          w.img +
          '" alt="' +
          w.name +
          '"><span><strong>' +
          w.name +
          "</strong><span>" +
          w.tag +
          "</span></span><span>Tenho interesse</span></a>"
      ).join("");
      setTimeout(() => {
        SS.overlay.show({
          gameId: "memoria",
          score,
          kicker: "Memória completa",
          title: "Você encontrou todos os pares",
          extraCta: {
            label: "Ver os relógios do jogo",
            href: "#galeria",
          },
          shopText: "Olá! Terminei o jogo da Memória dos Relógios e quero ver os modelos que apareceram.",
          onAgain: boot,
        });
        const link = document.querySelector('#overlay-root a[href="#galeria"]');
        if (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            SS.overlay.hide();
            showGallery(gallery, score);
          });
        }
      }, 450);
    }

    function showGallery(gallery, score) {
      root.innerHTML =
        SS.topbarGame("Relógios do jogo") +
        '<main class="stage">' +
        '<p class="kicker">Na vitrine do Studio Seiko</p>' +
        "<p>Esses modelos apareceram na sua partida. Chame no WhatsApp se algum te chamou atenção.</p>" +
        '<div class="gallery">' +
        gallery +
        "</div>" +
        '<div class="actions" style="margin-top:16px">' +
        '<button class="btn btn-gold btn-block" data-again>Jogar novamente</button>' +
        '<a class="btn btn-line btn-block" target="_blank" rel="noopener" href="' +
        SS.waLink(
          "🧠 Fiz " +
            SS.formatScore(score) +
            " pontos na Memória dos Relógios do Studio Seiko.\n\nQuero ver você me vencer! 😂\n\n👉 https://studioseiko.com.br/jogos/#/memoria"
        ) +
        '">Desafiar um amigo</a>' +
        "</div></main>";
      root.querySelector("[data-again]").addEventListener("click", boot);
    }

    boot();
    return function cleanup() {
      if (tick) clearInterval(tick);
    };
  }

  global.SSMemoria = { render };
})(window);
