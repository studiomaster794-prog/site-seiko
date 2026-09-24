(function (global) {
  const CONFIG = {
    whatsapp: "5598981867212",
    shop: "https://studioseiko.com.br",
    instagram: "https://instagram.com/studioseikocpu",
    goldenChance: 0.035,
    prefix: "ssgames_v1_",
  };

  const GAMES = {
    velha: { id: "velha", name: "Jogo da Velha", emoji: "❌⭕" },
    memoria: { id: "memoria", name: "Memória dos Relógios", emoji: "🧠" },
    bateria: { id: "bateria", name: "Salve o Relógio", emoji: "🔋" },
    nave: { id: "nave", name: "Nave Seiko", emoji: "🚀" },
  };

  const WATCHES = [
    {
      id: "orient-m",
      name: "Orient",
      tag: "Masculino · Clássico",
      img: "assets/watches/orient.webp",
      wa: "Olá! Tenho interesse no relógio Orient masculino exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "lince",
      name: "Lince",
      tag: "Feminino · Delicado",
      img: "assets/watches/lince.webp",
      wa: "Olá! Tenho interesse no kit Lince exibido no jogo da memória. Está disponível?",
    },
    {
      id: "technos",
      name: "Technos",
      tag: "Masculino · Presença",
      img: "assets/watches/technos.webp",
      wa: "Olá! Tenho interesse no relógio Technos masculino exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "casio",
      name: "Casio",
      tag: "Unissex · Versátil",
      img: "assets/watches/casio.webp",
      wa: "Olá! Tenho interesse no relógio Casio exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "champion",
      name: "Champion",
      tag: "Digital · Ousado",
      img: "assets/watches/champion.webp",
      wa: "Olá! Tenho interesse no Champion Digital exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "orient-f",
      name: "Orient",
      tag: "Feminino · Sofisticado",
      img: "assets/watches/orient-f.webp",
      wa: "Olá! Tenho interesse no Orient feminino exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "technos-c",
      name: "Technos Cerâmica",
      tag: "Feminino · Cerâmica",
      img: "assets/watches/technos-ceramica.webp",
      wa: "Olá! Tenho interesse no Technos Cerâmica exibido no jogo da memória. Ele está disponível?",
    },
    {
      id: "vip",
      name: "VIP Nautilus",
      tag: "Masculino · Imponente",
      img: "assets/watches/vip.webp",
      wa: "Olá! Tenho interesse no VIP Nautilus exibido no jogo da memória. Ele está disponível?",
    },
  ];

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(CONFIG.prefix + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, value) {
    localStorage.setItem(CONFIG.prefix + key, JSON.stringify(value));
  }

  function weekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function formatScore(n) {
    return Math.max(0, Math.round(n)).toLocaleString("pt-BR");
  }

  function haptic(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms || 12);
    } catch {}
  }

  function shareBase() {
    const file = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (file) return "https://studioseiko.com.br/jogos";
    return (location.origin + location.pathname.replace(/index\.html$/, "")).replace(/\/$/, "");
  }

  function waLink(text, phone) {
    const n = phone || "";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(text);
  }

  const player = {
    get() {
      return load("player", { nick: "" });
    },
    setNick(nick) {
      const clean = String(nick || "").trim().slice(0, 18);
      save("player", { nick: clean, at: Date.now() });
      return clean;
    },
  };

  const records = {
    all() {
      return Object.assign({ velha: 0, memoria: 0, bateria: 0, nave: 0 }, load("records", {}));
    },
    best(gameId) {
      return this.all()[gameId] || 0;
    },
    touch(gameId, score) {
      const all = this.all();
      if (score > (all[gameId] || 0)) {
        all[gameId] = score;
        save("records", all);
        return true;
      }
      return false;
    },
  };

  const ranking = {
    _state() {
      const week = weekKey(new Date());
      const empty = { velha: [], memoria: [], bateria: [], nave: [] };
      const state = load("ranking", { week, games: empty });
      if (state.week !== week) {
        const next = { week, games: { velha: [], memoria: [], bateria: [], nave: [] } };
        save("ranking", next);
        return next;
      }
      if (!state.games.nave) state.games.nave = [];
      return state;
    },
    list(gameId) {
      const rows = (this._state().games[gameId] || []).slice();
      rows.sort((a, b) => b.score - a.score || a.at - b.at);
      return rows.slice(0, 10);
    },
    submit(gameId, score) {
      if (!(score > 0)) {
        const rows = this.list(gameId);
        return { rank: 0, total: rows.length, rows };
      }
      const nick = player.get().nick || "Jogador";
      const state = this._state();
      const list = state.games[gameId] || [];
      const key = nick.toLowerCase();
      const i = list.findIndex((r) => r.nick.toLowerCase() === key);
      if (i >= 0) {
        if (score > list[i].score) list[i] = { nick, score, at: Date.now() };
      } else {
        list.push({ nick, score, at: Date.now() });
      }
      state.games[gameId] = list;
      save("ranking", state);
      const ordered = this.list(gameId);
      const rank = ordered.findIndex((r) => r.nick.toLowerCase() === key) + 1;
      return { rank, total: ordered.length, rows: ordered };
    },
  };

  const golden = {
    found() {
      return load("golden", { count: 0, lastCode: "" });
    },
    roll() {
      if (Math.random() > CONFIG.goldenChance) return null;
      const nick = (player.get().nick || "SS").slice(0, 4).toUpperCase();
      const code = "DOURADO-" + nick + "-" + weekKey(new Date()).replace("-", "");
      const prev = this.found();
      save("golden", { count: prev.count + 1, lastCode: code, at: Date.now() });
      return code;
    },
  };

  function challengeText(gameId, score) {
    const g = GAMES[gameId];
    return (
      g.emoji +
      " Fiz " +
      formatScore(score) +
      " pontos no " +
      g.name +
      " do Studio Seiko.\n\nQuero ver você me vencer! 😂\n\n👉 " +
      shareBase() +
      "/#/" +
      gameId
    );
  }

  function shopText(extra) {
    return extra || "Olá! Vim pelos jogos do site do Studio Seiko e gostaria de atendimento.";
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function svgBack() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
  }

  function topbarGame(title, scoreHtml) {
    return (
      '<header class="topbar">' +
      '<button class="back-btn" data-go="#/" aria-label="Voltar aos jogos">' +
      svgBack() +
      "</button>" +
      '<div class="game-title">' +
      title +
      "</div>" +
      (scoreHtml || "") +
      "</header>"
    );
  }

  function overlay() {
    const root = document.getElementById("overlay-root");
    function hide() {
      root.innerHTML = "";
      document.body.style.overflow = "";
    }
    function show(opts) {
      const isNew = records.touch(opts.gameId, opts.score);
      const placed = ranking.submit(opts.gameId, opts.score);
      const gold = golden.roll();
      const best = records.best(opts.gameId);
      const rankLine =
        placed.rank > 0
          ? "Você está em " + placed.rank + "º no ranking da semana neste aparelho."
          : "Faça pontos para entrar no ranking da semana.";
      const extraCta = opts.extraCta
        ? '<a class="btn btn-line btn-block" href="' +
          opts.extraCta.href +
          '" target="_blank" rel="noopener">' +
          opts.extraCta.label +
          "</a>"
        : "";
      const goldBlock = gold
        ? '<div class="golden"><strong>Você encontrou o Relógio Dourado</strong>Código ' +
          gold +
          ". Mostre esta tela no balcão ou chame no WhatsApp falando Relógio Dourado.</div>"
        : "";
      root.innerHTML =
        '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="ov-title">' +
        '<div class="sheet">' +
        '<p class="kicker">' +
        (opts.kicker || "Fim de jogo") +
        "</p>" +
        '<h2 id="ov-title">' +
        opts.title +
        "</h2>" +
        '<div class="score-xl">' +
        formatScore(opts.score) +
        "</div>" +
        "<p>Recorde pessoal: " +
        formatScore(best) +
        (isNew ? " · novo recorde" : "") +
        "</p>" +
        "<p>" +
        rankLine +
        "</p>" +
        goldBlock +
        '<div class="actions">' +
        '<button class="btn btn-gold btn-block" data-again>Jogar novamente</button>' +
        '<a class="btn btn-line btn-block" target="_blank" rel="noopener" href="' +
        waLink(challengeText(opts.gameId, opts.score)) +
        '">Desafiar um amigo</a>' +
        extraCta +
        '<div class="actions-2">' +
        '<a class="btn btn-ghost" href="' +
        CONFIG.shop +
        '#destaques" target="_blank" rel="noopener">Ver relógios</a>' +
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="' +
        waLink(shopText(opts.shopText), CONFIG.whatsapp) +
        '">WhatsApp</a>' +
        "</div></div></div></div>";
      document.body.style.overflow = "hidden";
      root.querySelector("[data-again]").addEventListener("click", function () {
        hide();
        if (opts.onAgain) opts.onAgain();
      });
      haptic(gold ? [20, 40, 20] : 18);
    }
    return { show, hide };
  }

  function askNick(onDone) {
    const root = document.getElementById("modal-root");
    const current = player.get().nick;
    root.innerHTML =
      '<div class="scrim" role="dialog" aria-modal="true">' +
      '<div class="sheet">' +
      '<p class="kicker">Jogos Studio Seiko</p>' +
      "<h2>Como você quer aparecer no ranking?</h2>" +
      "<p>Só um apelido. Sem cadastro.</p>" +
      '<form class="field">' +
      '<label for="nick">Apelido</label>' +
      '<input id="nick" name="nick" maxlength="18" autocomplete="nickname" placeholder="Ex.: Wagner" required>' +
      '<div class="actions">' +
      '<button class="btn btn-gold btn-block" type="submit">Entrar nos jogos</button>' +
      "</div></form></div></div>";
    const input = root.querySelector("#nick");
    input.value = current;
    input.focus();
    root.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      const n = player.setNick(input.value);
      if (!n) return;
      root.innerHTML = "";
      if (onDone) onDone(n);
    });
  }

  global.SS = {
    CONFIG,
    GAMES,
    WATCHES,
    player,
    records,
    ranking,
    golden,
    formatScore,
    haptic,
    waLink,
    shopText,
    el,
    topbarGame,
    overlay: overlay(),
    askNick,
    weekKey,
  };
})(window);
