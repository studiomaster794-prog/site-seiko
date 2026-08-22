(function (global) {
  const SRC = {
    player: "assets/nave/player.png",
    gear: "assets/nave/gear.png",
    watch: "assets/nave/watch.png",
    battery: "assets/nave/battery.png",
    boss: "assets/nave/boss.png",
    power: "assets/nave/power.png",
  };
  const W = 360;
  const H = 640;

  function loadImages() {
    const keys = Object.keys(SRC);
    return Promise.all(
      keys.map(
        (k) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve([k, img]);
            img.onerror = reject;
            img.src = SRC[k];
          })
      )
    ).then((pairs) => Object.fromEntries(pairs));
  }

  function hit(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.r + b.r;
    return dx * dx + dy * dy < r * r;
  }

  function render(root) {
    let imgs = null;
    let raf = 0;
    let running = true;
    let canvas;
    let ctx;
    let dpr = 1;
    let mode = "boot";
    let last = 0;
    let score = 0;
    let lives = 3;
    let wave = 0;
    let combo = 0;
    let comboAt = 0;
    let poweredUntil = 0;
    let invulnUntil = 0;
    let fireAcc = 0;
    let toast = "";
    let toastUntil = 0;
    let killed = 0;
    let player;
    let bullets = [];
    let ebullets = [];
    let enemies = [];
    let particles = [];
    let drops = [];
    let stars = [];
    let pointer = null;
    let keys = {};
    let waitingWave = 0;
    let bossAlive = false;

    function shell() {
      root.innerHTML =
        SS.topbarGame("Nave Seiko", '<div class="hud-score" data-hud-score>0 pts</div>') +
        '<main class="stage nave-stage">' +
        '<div class="nave-frame">' +
        '<canvas id="nave-cv" width="360" height="640" aria-label="Nave Seiko"></canvas>' +
        '<p class="nave-hint">Arraste para mover · a nave atira sozinha</p>' +
        "</div></main>";
      canvas = root.querySelector("#nave-cv");
      ctx = canvas.getContext("2d", { alpha: false });
      fit();
    }

    function fit() {
      if (!canvas) return;
      const frame = canvas.parentElement;
      const maxW = Math.min(frame.clientWidth || 360, 420);
      const maxH = Math.min(window.innerHeight - 150, 680);
      let cssW = maxW;
      let cssH = cssW * (H / W);
      if (cssH > maxH) {
        cssH = maxH;
        cssW = cssH * (W / H);
      }
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function toGame(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * W,
        y: ((e.clientY - r.top) / r.height) * H,
      };
    }

    function makeStars() {
      stars = [];
      for (let i = 0; i < 70; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          s: 0.4 + Math.random() * 1.8,
          v: 18 + Math.random() * 90,
          gold: Math.random() < 0.22,
        });
      }
    }

    function resetPlay() {
      score = 0;
      lives = 3;
      wave = 0;
      combo = 0;
      comboAt = 0;
      poweredUntil = 0;
      invulnUntil = 0;
      fireAcc = 0;
      killed = 0;
      bullets = [];
      ebullets = [];
      enemies = [];
      particles = [];
      drops = [];
      bossAlive = false;
      waitingWave = 0.4;
      player = { x: W / 2, y: H - 88, r: 14, vx: 0, tilt: 0 };
      makeStars();
      mode = "play";
      toast = "ONDA 1";
      toastUntil = performance.now() + 1400;
      hud();
    }

    function hud() {
      const el = root.querySelector("[data-hud-score]");
      if (el) el.textContent = SS.formatScore(score) + " pts";
    }

    function spawnBurst(x, y, color, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0.35 + Math.random() * 0.4,
          t: 0,
          color,
          s: 1.5 + Math.random() * 2.5,
        });
      }
    }

    function spawnWave() {
      wave += 1;
      bossAlive = false;
      const n = wave;
      if (n % 5 === 0) {
        enemies.push({
          kind: "boss",
          x: W / 2,
          y: -80,
          r: 42,
          hp: 28 + n * 6,
          max: 28 + n * 6,
          vx: 70,
          t: 0,
          shoot: 0,
          rot: 0,
        });
        bossAlive = true;
        toast = "CHEFÃO";
        toastUntil = performance.now() + 1600;
        return;
      }
      toast = "ONDA " + n;
      toastUntil = performance.now() + 1200;
      const gears = 3 + Math.min(6, n);
      for (let i = 0; i < gears; i++) {
        enemies.push({
          kind: "gear",
          x: 36 + ((W - 72) * (i + 0.5)) / gears,
          y: -30 - i * 28,
          r: 16,
          hp: 1,
          t: i * 0.4,
          vy: 55 + n * 6,
          amp: 40 + n * 4,
        });
      }
      if (n >= 2) {
        const bats = 2 + Math.min(4, n - 1);
        for (let i = 0; i < bats; i++) {
          enemies.push({
            kind: "battery",
            x: 40 + Math.random() * (W - 80),
            y: -90 - i * 50,
            r: 12,
            hp: 1,
            vy: 130 + n * 10,
            t: Math.random() * 6,
          });
        }
      }
      if (n >= 3) {
        const ws = 1 + Math.floor((n - 3) / 2);
        for (let i = 0; i < ws; i++) {
          enemies.push({
            kind: "watch",
            x: 70 + Math.random() * (W - 140),
            y: -50 - i * 70,
            r: 22,
            hp: 3 + Math.floor(n / 4),
            vy: 38 + n * 3,
            shoot: 0.6 + i * 0.4,
            t: 0,
          });
        }
      }
    }

    function firePlayer(now) {
      const spread = now < poweredUntil;
      const shots = spread ? [-10, 0, 10] : [0];
      shots.forEach((ox) => {
        bullets.push({
          x: player.x + ox,
          y: player.y - 26,
          vy: -520,
          vx: ox * 4,
          r: 4,
        });
      });
    }

    function enemyShoot(e, nowSec) {
      if (e.kind === "watch") {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const len = Math.hypot(dx, dy) || 1;
        ebullets.push({
          x: e.x,
          y: e.y + 10,
          vx: (dx / len) * 160,
          vy: (dy / len) * 160,
          r: 4,
        });
      } else if (e.kind === "boss") {
        const pattern = Math.floor(e.t * 0.55) % 2;
        if (pattern === 0) {
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + e.t;
            ebullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 90,
              vy: Math.sin(a) * 90,
              r: 4,
            });
          }
        } else {
          const dx = player.x - e.x;
          const dy = player.y - e.y;
          const len = Math.hypot(dx, dy) || 1;
          for (let k = -1; k <= 1; k++) {
            const ang = Math.atan2(dy, dx) + k * 0.22;
            ebullets.push({
              x: e.x,
              y: e.y + 16,
              vx: Math.cos(ang) * 180,
              vy: Math.sin(ang) * 180,
              r: 4,
            });
          }
        }
      }
    }

    function killEnemy(e, now) {
      const table = { gear: 50, battery: 80, watch: 140, boss: 2200 };
      combo = now - comboAt < 900 ? combo + 1 : 1;
      comboAt = now;
      const gain = Math.round((table[e.kind] || 40) * (1 + Math.min(combo - 1, 8) * 0.08));
      score += gain;
      killed += 1;
      hud();
      const color = e.kind === "boss" ? "#e35d5d" : e.kind === "battery" ? "#ff6a4a" : "#dfc06a";
      spawnBurst(e.x, e.y, color, e.kind === "boss" ? 28 : 12, e.kind === "boss" ? 180 : 110);
      SS.haptic(e.kind === "boss" ? [12, 30, 18] : 8);
      if (e.kind === "boss") {
        bossAlive = false;
        drops.push({ x: e.x, y: e.y, r: 16, vy: 70, kind: "power" });
      } else if (e.kind === "watch" && Math.random() < 0.22) {
        drops.push({ x: e.x, y: e.y, r: 14, vy: 80, kind: "power" });
      }
    }

    function hurtPlayer(now) {
      if (now < invulnUntil) return;
      lives -= 1;
      invulnUntil = now + 1400;
      poweredUntil = 0;
      combo = 0;
      spawnBurst(player.x, player.y, "#e35d5d", 16, 140);
      SS.haptic([20, 40, 20]);
      if (lives <= 0) {
        mode = "over";
        setTimeout(showOver, 420);
      }
    }

    function showOver() {
      if (!running) return;
      SS.overlay.show({
        gameId: "nave",
        score,
        kicker: "Fim de jogo",
        title: killed ? "A nave fez " + killed + " alvos" : "A nave caiu cedo",
        extraCta: {
          label: "Ver relógios da vitrine",
          href: SS.CONFIG.shop + "#destaques",
        },
        shopText:
          "Olá! Joguei a Nave Seiko no site e fiz " +
          SS.formatScore(score) +
          " pontos. Quero conhecer os relógios da loja.",
        onAgain: function () {
          resetPlay();
        },
      });
    }

    function step(dt, now) {
      const nowMs = now;
      stars.forEach((s) => {
        s.y += s.v * dt;
        if (s.y > H) {
          s.y = -4;
          s.x = Math.random() * W;
        }
      });

      if (mode !== "play") return;

      let tx = player.x;
      let ty = player.y;
      if (pointer) {
        tx = pointer.x;
        ty = Math.max(H * 0.42, Math.min(H - 48, pointer.y));
      }
      if (keys.ArrowLeft || keys.a || keys.A) tx -= 260 * dt;
      if (keys.ArrowRight || keys.d || keys.D) tx += 260 * dt;
      if (keys.ArrowUp || keys.w || keys.W) ty -= 220 * dt;
      if (keys.ArrowDown || keys.s || keys.S) ty += 220 * dt;

      const prevX = player.x;
      player.x += (tx - player.x) * Math.min(1, dt * 14);
      player.y += (ty - player.y) * Math.min(1, dt * 12);
      player.x = Math.max(22, Math.min(W - 22, player.x));
      player.y = Math.max(80, Math.min(H - 36, player.y));
      player.tilt += ((player.x - prevX) * 8 - player.tilt) * Math.min(1, dt * 10);

      fireAcc += dt;
      const rate = nowMs < poweredUntil ? 0.11 : 0.18;
      if (fireAcc >= rate) {
        fireAcc = 0;
        firePlayer(nowMs);
      }

      bullets.forEach((b) => {
        b.x += (b.vx || 0) * dt;
        b.y += b.vy * dt;
      });
      bullets = bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);

      ebullets.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      ebullets = ebullets.filter((b) => b.y > -30 && b.y < H + 30 && b.x > -30 && b.x < W + 30);

      enemies.forEach((e) => {
        e.t += dt;
        if (e.kind === "gear") {
          e.y += e.vy * dt;
          e.x += Math.sin(e.t * 2.2) * e.amp * dt;
          e.rot = (e.rot || 0) + dt * 1.8;
        } else if (e.kind === "battery") {
          e.y += e.vy * dt;
          e.x += Math.sin(e.t * 6) * 70 * dt;
          e.rot = (e.rot || 0) + dt * 3;
        } else if (e.kind === "watch") {
          e.y += e.vy * dt;
          e.x += Math.sin(e.t * 1.1) * 50 * dt;
          e.shoot -= dt;
          if (e.shoot <= 0 && e.y > 20 && e.y < H * 0.7) {
            e.shoot = Math.max(0.7, 1.5 - wave * 0.06);
            enemyShoot(e);
          }
        } else if (e.kind === "boss") {
          if (e.y < 118) e.y += 70 * dt;
          else {
            e.x += e.vx * dt;
            if (e.x < 70 || e.x > W - 70) e.vx *= -1;
          }
          e.rot = Math.sin(e.t * 1.4) * 0.12;
          e.shoot -= dt;
          if (e.shoot <= 0 && e.y > 80) {
            e.shoot = Math.max(0.7, 1.35 - wave * 0.04);
            enemyShoot(e);
          }
        }
      });

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.y > H + 50) {
          enemies.splice(i, 1);
          continue;
        }
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (hit(e, bullets[j])) {
            bullets.splice(j, 1);
            e.hp -= 1;
            spawnBurst(e.x, e.y, "#fff4c2", 4, 60);
            if (e.hp <= 0) {
              killEnemy(e, nowMs);
              enemies.splice(i, 1);
            }
            break;
          }
        }
      }

      drops.forEach((d) => {
        d.y += d.vy * dt;
      });
      drops = drops.filter((d) => d.y < H + 30);
      for (let i = drops.length - 1; i >= 0; i--) {
        if (hit(drops[i], player)) {
          poweredUntil = nowMs + 8000;
          spawnBurst(player.x, player.y, "#dfc06a", 14, 90);
          SS.haptic(16);
          drops.splice(i, 1);
        }
      }

      if (nowMs > invulnUntil) {
        ebullets.forEach((b) => {
          if (hit(b, player)) hurtPlayer(nowMs);
        });
        enemies.forEach((e) => {
          if (hit(e, { x: player.x, y: player.y, r: player.r * 0.85 })) hurtPlayer(nowMs);
        });
      }

      particles.forEach((p) => {
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
      });
      particles = particles.filter((p) => p.t < p.life);

      if (!enemies.length && !bossAlive) {
        waitingWave -= dt;
        if (waitingWave <= 0) {
          spawnWave();
          waitingWave = 1.1;
        }
      } else {
        waitingWave = 0.9;
      }
    }

    function drawImg(img, x, y, size, rot, alpha) {
      if (!img) return;
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#07070a");
      g.addColorStop(0.55, "#0c0c10");
      g.addColorStop(1, "#14110a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      stars.forEach((s) => {
        ctx.fillStyle = s.gold ? "rgba(223,192,106,0.85)" : "rgba(255,255,255,0.55)";
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });

      if (mode === "boot") {
        ctx.fillStyle = "#c9a84c";
        ctx.font = "700 11px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CARREGANDO A NAVE…", W / 2, H / 2);
        return;
      }

      if (mode === "title") {
        if (imgs.player) drawImg(imgs.player, W / 2, H * 0.38, 150, 0, 1);
        ctx.fillStyle = "#c9a84c";
        ctx.font = "700 11px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "0.22em";
        ctx.fillText("STUDIO SEIKO", W / 2, 86);
        ctx.fillStyle = "#fff";
        ctx.font = "700 36px 'Playfair Display', Georgia, serif";
        ctx.fillText("Nave Seiko", W / 2, 128);
        ctx.fillStyle = "#a0a0a0";
        ctx.font = "500 14px Manrope, sans-serif";
        ctx.fillText("Desvie, atire, derrube o relógio-chefão.", W / 2, H * 0.58);
        ctx.fillText("Toque ou clique para decolar.", W / 2, H * 0.58 + 22);
        const pulse = 0.72 + Math.sin(performance.now() / 280) * 0.08;
        roundBtn(W / 2, H * 0.78, 200, 48, pulse);
        ctx.fillStyle = "#090909";
        ctx.font = "700 15px Manrope, sans-serif";
        ctx.fillText("JOGAR", W / 2, H * 0.78 + 5);
        return;
      }

      drops.forEach((d) => {
        ctx.save();
        ctx.shadowColor = "#dfc06a";
        ctx.shadowBlur = 16;
        drawImg(imgs.power, d.x, d.y, 36, 0, 1);
        ctx.restore();
      });

      enemies.forEach((e) => {
        if (e.kind === "gear") drawImg(imgs.gear, e.x, e.y, 40, e.rot, 1);
        else if (e.kind === "battery") drawImg(imgs.battery, e.x, e.y, 30, e.rot, 1);
        else if (e.kind === "watch") drawImg(imgs.watch, e.x, e.y, 54, 0.2, 1);
        else if (e.kind === "boss") {
          drawImg(imgs.boss, e.x, e.y, 118, e.rot, 1);
          const ratio = Math.max(0, e.hp / e.max);
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(e.x - 44, e.y - 68, 88, 5);
          ctx.fillStyle = "#e35d5d";
          ctx.fillRect(e.x - 44, e.y - 68, 88 * ratio, 5);
        }
      });

      bullets.forEach((b) => {
        ctx.fillStyle = "#f1d987";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 2.2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ebullets.forEach((b) => {
        ctx.fillStyle = "#e35d5d";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        ctx.globalAlpha = 1 - p.t / p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.s, p.s);
        ctx.globalAlpha = 1;
      });

      if (player && (mode === "play" || mode === "over")) {
        const blink = performance.now() < invulnUntil && Math.floor(performance.now() / 80) % 2 === 0;
        const flame = 8 + Math.sin(performance.now() / 70) * 4;
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.tilt * 0.04);
        ctx.fillStyle = "rgba(241,217,135,0.75)";
        ctx.beginPath();
        ctx.ellipse(-11, 28, 4, flame, 0, 0, Math.PI * 2);
        ctx.ellipse(11, 28, 4, flame, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (!blink) drawImg(imgs.player, player.x, player.y, 64, player.tilt * 0.04, 1);
      }

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = "#dfc06a";
      ctx.font = "700 13px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(SS.formatScore(score), 12, 22);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText("Onda " + Math.max(1, wave), W / 2, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = "#dfc06a";
      ctx.fillText("♥".repeat(Math.max(0, lives)) || "—", W - 12, 22);

      if (performance.now() < poweredUntil) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#f1d987";
        ctx.font = "700 11px Manrope, sans-serif";
        ctx.fillText("TIRO TRIPLO", W / 2, H - 14);
      }

      if (performance.now() < toastUntil && toast) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "rgba(12,12,12,0.72)";
        ctx.fillRect(W / 2 - 70, 72, 140, 36);
        ctx.fillStyle = "#dfc06a";
        ctx.font = "700 16px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(toast, W / 2, 96);
        ctx.restore();
      }
    }

    function roundBtn(x, y, w, h, pulse) {
      ctx.fillStyle = "rgba(201,168,76," + pulse + ")";
      const r = 8;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.beginPath();
      ctx.moveTo(left + r, top);
      ctx.arcTo(left + w, top, left + w, top + h, r);
      ctx.arcTo(left + w, top + h, left, top + h, r);
      ctx.arcTo(left, top + h, left, top, r);
      ctx.arcTo(left, top, left + w, top, r);
      ctx.closePath();
      ctx.fill();
    }

    function loop(t) {
      if (!running) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
      last = t;
      step(dt, t);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onPointerDown(e) {
      e.preventDefault();
      pointer = toGame(e);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      if (mode === "title") resetPlay();
    }
    function onPointerMove(e) {
      if (pointer) pointer = toGame(e);
    }
    function onPointerUp(e) {
      pointer = null;
    }
    function onKey(e) {
      keys[e.key] = e.type === "keydown";
      if (e.type === "keydown" && (e.key === " " || e.key === "Enter") && mode === "title") {
        e.preventDefault();
        resetPlay();
      }
    }

    function bind() {
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      window.addEventListener("resize", fit);
    }

    shell();
    makeStars();
    bind();
    last = performance.now();
    raf = requestAnimationFrame(loop);

    loadImages()
      .then((map) => {
        imgs = map;
        if (mode === "boot") mode = "title";
      })
      .catch(() => {
        imgs = {};
        if (mode === "boot") mode = "title";
      });

    return function cleanup() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("resize", fit);
    };
  }

  global.SSNave = { render };
})(window);
