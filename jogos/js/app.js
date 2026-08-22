(function () {
  const app = document.getElementById("app");
  let cleanup = null;

  const ICO = {
    velha:
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="22" height="22" rx="4"/><path d="M3 12.5h22M3 19h22M12.5 3v22M19 3v22"/></svg>',
    memoria:
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="9" height="12" rx="2"/><rect x="15" y="9" width="9" height="12" rx="2"/><circle cx="8.5" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="19.5" cy="15" r="1.4" fill="currentColor" stroke="none"/></svg>',
    bateria:
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="8" width="14" height="12" rx="2"/><path d="M20 12h2v4h-2"/><path d="M11 12l2 2-2 2 4-4"/></svg>',
    nave:
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4l7 16-7-3-7 3 7-16z"/><circle cx="14" cy="13" r="3"/></svg>',
  };

  function route() {
    const hash = (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    SS.overlay.hide();
    if (hash === "velha") cleanup = SSVelha.render(app) || null;
    else if (hash === "memoria") cleanup = SSMemoria.render(app) || null;
    else if (hash === "bateria") cleanup = SSBateria.render(app) || null;
    else if (hash === "nave") cleanup = SSNave.render(app) || null;
    else renderHub();
  }

  function renderHub() {
    const rec = SS.records.all();
    const nick = SS.player.get().nick;
    app.innerHTML =
      '<header class="topbar">' +
      '<a class="brand" href="https://studioseiko.com.br" target="_blank" rel="noopener">' +
      '<img src="assets/logo.webp" alt="">' +
      '<span class="brand-text"><strong>Studio Seiko</strong><span>Jogos</span></span></a>' +
      '<div class="topbar-actions">' +
      '<button class="nick-chip" type="button" data-nick>' +
      (nick || "Seu apelido") +
      "</button></div></header>" +
      '<div class="wrap">' +
      '<section class="hero">' +
      '<p class="kicker">Cururupu · Maranhão</p>' +
      "<h1>Jogue. Supere. Ganhe.</h1>" +
      "<p>Quatro jogos da loja. Ranking da semana, desafio no WhatsApp e, de vez em quando, o Relógio Dourado.</p>" +
      "</section>" +
      '<section class="games">' +
      card("nave", "Nave Seiko", "Arcade · ondas e chefão", rec.nave, ICO.nave) +
      card("velha", "Jogo da Velha", "Fácil · Médio · Relojoeiro", rec.velha, ICO.velha) +
      card("memoria", "Memória dos Relógios", "Encontre os pares da vitrine", rec.memoria, ICO.memoria) +
      card("bateria", "Salve o Relógio", "Pegue a bateria certa e encaixe", rec.bateria, ICO.bateria) +
      "</section>" +
      '<section class="panel" id="ranking">' +
      "<h3>Melhores da semana</h3>" +
      '<p class="hint">Salvo neste aparelho por enquanto · esta semana</p>' +
      '<div class="rank-tabs" role="tablist">' +
      '<button class="tab" data-tab="nave" aria-selected="true">Nave</button>' +
      '<button class="tab" data-tab="velha" aria-selected="false">Velha</button>' +
      '<button class="tab" data-tab="memoria" aria-selected="false">Memória</button>' +
      '<button class="tab" data-tab="bateria" aria-selected="false">Bateria</button>' +
      "</div>" +
      '<div data-rank></div></section>' +
      '<section class="cta-loja">' +
      "<h3>Enquanto o recorde esquenta</h3>" +
      "<p>Relógios originais, troca de bateria, conserto de óculos e solda de joias no centro de Cururupu.</p>" +
      '<div class="row">' +
      '<a class="btn btn-wa" href="' +
      SS.waLink(SS.shopText(), SS.CONFIG.whatsapp) +
      '" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
      '<a class="btn btn-ghost" href="' +
      SS.CONFIG.shop +
      '" target="_blank" rel="noopener">Ir ao site</a>' +
      "</div></section>" +
      '<footer class="site-foot">Studio Seiko · Rua Dom Pedro 2º, Centro · ' +
      '<a href="' +
      SS.CONFIG.instagram +
      '" target="_blank" rel="noopener">@studioseikocpu</a></footer></div>';

    paintRank("nave");
    app.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        app.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", "false"));
        btn.setAttribute("aria-selected", "true");
        paintRank(btn.dataset.tab);
      });
    });
    app.querySelector("[data-nick]").addEventListener("click", () => {
      SS.askNick(() => renderHub());
    });
  }

  function card(id, title, meta, rec, ico) {
    return (
      '<a class="game-card" href="#/' +
      id +
      '">' +
      '<div class="game-ico">' +
      ico +
      "</div><div>" +
      "<h2>" +
      title +
      "</h2>" +
      '<p class="meta">' +
      meta +
      "</p>" +
      '<div class="foot"><span>Jogar</span><span class="rec">Recorde ' +
      SS.formatScore(rec) +
      "</span></div></div></a>"
    );
  }

  function paintRank(gameId) {
    const box = app.querySelector("[data-rank]");
    if (!box) return;
    const rows = SS.ranking.list(gameId);
    if (!rows.length) {
      box.innerHTML = '<p class="empty">Ninguém pontuou neste jogo ainda. Seja o primeiro da semana.</p>';
      return;
    }
    box.innerHTML =
      '<ol class="rank-list">' +
      rows
        .map(
          (r, i) =>
            "<li><span class=\"pos\">" +
            (i + 1) +
            "</span><span>" +
            r.nick +
            '</span><span class="pts">' +
            SS.formatScore(r.score) +
            "</span></li>"
        )
        .join("") +
      "</ol>";
  }

  document.addEventListener("click", function (e) {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    e.preventDefault();
    location.hash = go.getAttribute("data-go");
  });

  window.addEventListener("hashchange", route);

  function boot() {
    if (!SS.player.get().nick) {
      SS.askNick(() => route());
    } else {
      route();
    }
  }

  boot();
})();
