(function (global) {
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const DIFF = {
    facil: { id: "facil", label: "Fácil", blurb: "Para aquecer. O relógio ainda está acordando." },
    medio: { id: "medio", label: "Médio", blurb: "Já pensa duas jogadas à frente." },
    relojoeiro: { id: "relojoeiro", label: "Relojoeiro", blurb: "Quase imbatível. Precisão de bancada." },
  };

  function winner(b) {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: [a, c, d] };
    }
    if (b.every(Boolean)) return { who: "draw", line: [] };
    return null;
  }

  function empties(b) {
    const out = [];
    for (let i = 0; i < 9; i++) if (!b[i]) out.push(i);
    return out;
  }

  function minimax(b, isMax) {
    const w = winner(b);
    if (w) {
      if (w.who === "O") return { s: 10 };
      if (w.who === "X") return { s: -10 };
      return { s: 0 };
    }
    let best = isMax ? { s: -99, i: -1 } : { s: 99, i: -1 };
    for (const i of empties(b)) {
      b[i] = isMax ? "O" : "X";
      const r = minimax(b, !isMax);
      b[i] = null;
      if (isMax ? r.s > best.s : r.s < best.s) best = { s: r.s, i };
    }
    return best;
  }

  function winningMove(b, mark) {
    for (const i of empties(b)) {
      b[i] = mark;
      const w = winner(b);
      b[i] = null;
      if (w && w.who === mark) return i;
    }
    return -1;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function aiMove(b, level) {
    const free = empties(b);
    if (!free.length) return -1;
    const win = winningMove(b, "O");
    const block = winningMove(b, "X");
    if (level === "relojoeiro") {
      if (Math.random() < 0.08) {
        const decent = free.filter((i) => {
          b[i] = "O";
          const opp = winningMove(b, "X");
          b[i] = null;
          return opp < 0;
        });
        return pick(decent.length ? decent : free);
      }
      return minimax(b.slice(), true).i;
    }
    if (level === "medio") {
      if (win >= 0) return win;
      if (block >= 0 && Math.random() < 0.85) return block;
      if (Math.random() < 0.5) return minimax(b.slice(), true).i;
      if (b[4] == null) return 4;
      const corners = [0, 2, 6, 8].filter((i) => !b[i]);
      if (corners.length) return pick(corners);
      return pick(free);
    }
    if (win >= 0 && Math.random() < 0.45) return win;
    if (block >= 0 && Math.random() < 0.3) return block;
    return pick(free);
  }

  function pointsFor(level, result, emptyCount, streak) {
    if (result === "lose") return 0;
    let base = result === "draw" ? 40 : level === "relojoeiro" ? 600 : level === "medio" ? 280 : 120;
    if (result === "win") base += emptyCount * 15;
    if (result === "win" && streak > 1) base = Math.round(base * (1 + Math.min(streak - 1, 5) * 0.1));
    return base;
  }

  function render(root) {
    let level = null;
    let board = Array(9).fill(null);
    let lock = false;
    let session = 0;
    let streak = 0;
    let round = 1;
    let started = 0;

    function paintPicker() {
      root.innerHTML =
        SS.topbarGame("Jogo da Velha") +
        '<main class="stage">' +
        '<p class="kicker">Escolha a dificuldade</p>' +
        "<div class=\"diff\">" +
        Object.values(DIFF)
          .map(
            (d) =>
              '<button class="diff-card" data-lv="' +
              d.id +
              '"><strong>' +
              d.label +
              "</strong>" +
              d.blurb +
              "</button>"
          )
          .join("") +
        "</div></main>";
      root.querySelectorAll("[data-lv]").forEach((btn) => {
        btn.addEventListener("click", () => start(btn.getAttribute("data-lv")));
      });
    }

    function start(lv) {
      level = lv;
      session = 0;
      streak = 0;
      round = 1;
      newRound();
    }

    function newRound() {
      board = Array(9).fill(null);
      lock = false;
      started = Date.now();
      paintBoard("Sua vez · você é o X dourado");
    }

    function paintBoard(status) {
      const cells = board
        .map((v, i) => {
          const cls = v === "X" ? " x" : v === "O" ? " o" : "";
          return (
            '<button class="cell' +
            cls +
            '" data-i="' +
            i +
            '" ' +
            (v || lock ? "disabled" : "") +
            ' aria-label="casa ' +
            (i + 1) +
            '">' +
            (v || "") +
            "</button>"
          );
        })
        .join("");
      root.innerHTML =
        SS.topbarGame("Jogo da Velha", '<div class="hud-score">' + SS.formatScore(session) + " pts</div>") +
        '<main class="stage">' +
        '<div class="statbar">' +
        '<div class="stat"><b>' +
        DIFF[level].label +
        "</b><span>nível</span></div>" +
        '<div class="stat"><b>' +
        round +
        "</b><span>rodada</span></div>" +
        '<div class="stat"><b>' +
        streak +
        "</b><span>sequência</span></div>" +
        "</div>" +
        '<div class="board" role="grid">' +
        cells +
        "</div>" +
        '<p class="status-line">' +
        status +
        "</p></main>";
      root.querySelectorAll(".cell").forEach((btn) => {
        btn.addEventListener("click", () => play(+btn.dataset.i));
      });
    }

    function markWin(line) {
      line.forEach((i) => {
        const c = root.querySelector('.cell[data-i="' + i + '"]');
        if (c) c.classList.add("win");
      });
    }

    function play(i) {
      if (lock || board[i]) return;
      board[i] = "X";
      SS.haptic(8);
      const w = winner(board);
      if (w) return finish(w);
      lock = true;
      paintBoard("O Relojoeiro está pensando…");
      setTimeout(() => {
        const mv = aiMove(board, level);
        if (mv >= 0) board[mv] = "O";
        const w2 = winner(board);
        lock = false;
        if (w2) finish(w2);
        else paintBoard("Sua vez");
      }, 380);
    }

    function finish(w) {
      lock = true;
      paintBoard(w.who === "X" ? "Você ganhou a rodada" : w.who === "draw" ? "Empate" : "O Relojoeiro fechou");
      if (w.line) markWin(w.line);
      const empty = empties(board).length;
      if (w.who === "X") {
        streak += 1;
        session += pointsFor(level, "win", empty, streak);
        round += 1;
        setTimeout(newRound, 900);
        return;
      }
      if (w.who === "draw") {
        session += pointsFor(level, "draw", empty, streak);
        round += 1;
        setTimeout(newRound, 900);
        return;
      }
      setTimeout(() => {
        SS.overlay.show({
          gameId: "velha",
          score: session,
          kicker: "Fim de jogo",
          title: session ? "Boa sequência" : "O Relojoeiro venceu",
          shopText: "Olá! Joguei o Jogo da Velha no site e quero ver os relógios disponíveis.",
          onAgain: paintPicker,
        });
      }, 700);
    }

    paintPicker();
  }

  global.SSVelha = { render };
})(window);
