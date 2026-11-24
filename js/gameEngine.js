window.VTTT = window.VTTT || {};

window.VTTT.ENEMY_NAMES = {
  shroomy: "Nấm Mù Mờ",
  ember: "Cáo Lửa Tinh Nghịch",
  mossy: "Golem Rêu Cổ",
  frosty: "Tinh Linh Băng"
};

window.VTTT.GameEngine = class GameEngine {
  constructor(canvas, config, assets, audio, qm, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config;
    this.assets = assets;
    this.audio = audio;
    this.qm = qm;
    this.ui = ui;

    this.state = window.VTTT.STATES.MENU;
    this.settings = this.loadSettings();
    this.highScore = this.loadHighScore();

    this.playerRig = new window.VTTT.SkeletalRig(assets.characters.player);
    this.enemyRig = null;
    this.particles = new window.VTTT.ParticleSystem();

    this.bgScroll = 0;
    this.playerX = 270;
    this.playerY = config.groundY;
    this.playerVy = 0;
    this.isGrounded = true;

    this.enemyX = 1450;
    this.enemyTargetX = 960;
    this.enemyType = "shroomy";

    this.projectiles = [];
    this.collectibles = [];
    this.floatingTexts = [];

    this.sessionQuestions = [];
    this.qIndex = 0;
    this.questionLocked = false;
    this.timeLeft = 20;

    this.players = [];
    this.activePlayerIdx = 0;

    this.phase = "RUN_IN";
    this.phaseTimer = 0;
    this.lastFrame = performance.now();
    this.loopId = null;
  }

  loadSettings() {
    const defaults = {
      questionSet: this.config.defaultQuestionSet || "all",
      questionCount: String(this.config.defaultQuestionCount || "all"),
      playerCount: Number(this.config.defaultPlayerCount) || 1,
      questionTime: this.config.defaultQuestionTimeSec || 20,
      muted: false,
      bgmVol: 0.4,
      sfxVol: 0.8
    };
    try {
      const raw = localStorage.getItem(this.config.storageKeys.settings);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {}
    return defaults;
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(this.config.storageKeys.settings, JSON.stringify(this.settings));
    } catch (e) {}
    this.audio.setMuted(this.settings.muted);
    this.audio.setVolumes(this.settings.bgmVol, this.settings.sfxVol);
    this.ui.updateMuteLabel(this.settings.muted);
  }

  loadHighScore() {
    try {
      return Number(localStorage.getItem(this.config.storageKeys.highScore)) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore(val) {
    if (val > this.highScore) {
      this.highScore = val;
      try {
        localStorage.setItem(this.config.storageKeys.highScore, String(val));
      } catch (e) {}
    }
  }

  startLoop() {
    this.lastFrame = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      this.update(dt);
      this.render();
      this.loopId = requestAnimationFrame(tick);
    };
    this.loopId = requestAnimationFrame(tick);
  }

  initPlayers() {
    const count = Math.max(1, Math.min(this.config.maxPlayers || 4, Number(this.settings.playerCount) || 1));
    this.players = [];
    for (let i = 0; i < count; i++) {
      this.players.push({
        id: i + 1,
        name: count === 1 ? "Bé Mầm" : `Người ${i + 1}`,
        lives: this.config.maxLives,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        hasShield: false
      });
    }
    this.activePlayerIdx = 0;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx] || this.players[0];
  }

  advancePlayerTurn() {
    if (this.players.length <= 1) return;
    const total = this.players.length;
    for (let offset = 1; offset <= total; offset++) {
      const next = (this.activePlayerIdx + offset) % total;
      if (this.players[next].lives > 0) {
        this.activePlayerIdx = next;
        return;
      }
    }
  }

  anyPlayerAlive() {
    return this.players.some((p) => p.lives > 0);
  }

  startNewGame() {
    const pool = this.qm.getSessionQuestions(this.settings.questionSet, this.settings.questionCount);
    if (pool.length === 0) {
      alert("Bộ câu hỏi đã chọn đang trống! Vui lòng kiểm tra lại trong Quản lý câu hỏi.");
      return;
    }

    this.audio.init();
    this.audio.playBgm();

    this.sessionQuestions = pool;
    this.qIndex = 0;
    this.initPlayers();
    this.projectiles = [];
    this.collectibles = [];
    this.floatingTexts = [];

    this.playerY = this.config.groundY;
    this.playerVy = 0;
    this.isGrounded = true;
    this.playerRig.expression = "normal";

    this.state = window.VTTT.STATES.PLAYING;
    this.ui.showScreen(window.VTTT.STATES.PLAYING);
    this.prepareNextEncounter();
  }

  getLevelInfo(questionNumber) {
    const lvls = this.config.levels;
    let current = lvls[0];
    for (const l of lvls) {
      if (questionNumber >= l.minQuestion) current = l;
    }
    return current;
  }

  prepareNextEncounter() {
    if (this.qIndex >= this.sessionQuestions.length) {
      this.triggerVictory();
      return;
    }

    const lvl = this.getLevelInfo(this.qIndex + 1);
    const enemyPool = ["shroomy", "ember", "mossy", "frosty"];
    this.enemyType = this.assets.characters[lvl.enemy] ? lvl.enemy : enemyPool[this.qIndex % enemyPool.length];
    this.enemyRig = new window.VTTT.SkeletalRig(this.assets.characters[this.enemyType]);
    this.enemyRig.facing = -1;
    this.enemyRig.setAnimation("move");
    this.enemyX = 1420;

    this.playerRig.setAnimation("run");
    this.playerRig.expression = "normal";
    this.phase = "RUN_IN";
    this.questionLocked = true;
    this.timeLeft = Number(this.settings.questionTime) || 20;
    this.ui.hideQuestion();

    this.collectibles.push({
      x: 900,
      y: this.config.groundY - 155,
      collected: false,
      bobPhase: 0
    });

    this.syncHUD();
  }

  playerJump() {
    if (this.state !== window.VTTT.STATES.PLAYING) return;
    if (!this.isGrounded) return;
    this.isGrounded = false;
    this.playerVy = -620;
    this.playerRig.setAnimation("jump", true);
    this.audio.playSfx("jump");
    this.particles.burst(this.playerX, this.config.groundY, "#bbf7d0", 8);
  }

  submitAnswer(selectedIndex) {
    if (this.state !== window.VTTT.STATES.PLAYING) return;
    if (this.phase !== "COMBAT" || this.questionLocked) return;

    this.questionLocked = true;
    const q = this.sessionQuestions[this.qIndex];
    const isCorrect = selectedIndex === q.correctIndex;
    this.handleOutcome(isCorrect, false, selectedIndex, q);
  }

  handleTimeout() {
    if (this.phase !== "COMBAT" || this.questionLocked) return;
    this.questionLocked = true;
    const q = this.sessionQuestions[this.qIndex];
    this.handleOutcome(false, true, -1, q);
  }

  handleOutcome(isCorrect, isTimeout, selectedIndex, q) {
    this.phase = "RESOLVING";
    this.phaseTimer = 1.75;
    this.ui.showQuestionResult(selectedIndex, q.correctIndex, isCorrect, isTimeout, q.explanation);

    const ap = this.getActivePlayer();

    if (isCorrect) {
      ap.combo += 1;
      if (ap.combo > ap.maxCombo) ap.maxCombo = ap.combo;
      ap.correctCount += 1;

      const timeBonus = Math.round(this.timeLeft * 5);
      const gained = this.config.baseScore + (ap.combo - 1) * this.config.comboBonus + timeBonus;
      ap.score += gained;

      if (ap.combo >= this.config.shieldComboThreshold && !ap.hasShield) {
        ap.hasShield = true;
        this.floatingTexts.push({ x: this.playerX, y: this.playerY - 170, text: "Khiên Ánh Sáng!", color: "#38bdf8", life: 1.4 });
      }

      this.floatingTexts.push({ x: this.enemyX, y: this.config.groundY - 160, text: `+${gained}`, color: "#fde047", life: 1.2 });

      this.playerRig.setAnimation("attack", true);
      this.audio.playSfx("correct");
      this.audio.playSfx("attack");

      this.projectiles.push({
        x: this.playerX + 55,
        y: this.playerY - 95,
        targetX: this.enemyX,
        speed: 1450
      });
    } else {
      ap.combo = 0;
      this.audio.playSfx("wrong");
      this.enemyRig.setAnimation("attack", true);

      if (ap.hasShield) {
        ap.hasShield = false;
        this.floatingTexts.push({ x: this.playerX, y: this.playerY - 160, text: "Khiên đã đỡ đòn!", color: "#38bdf8", life: 1.4 });
        this.particles.burst(this.playerX + 30, this.playerY - 90, "#38bdf8", 20);
      } else {
        ap.lives = Math.max(0, ap.lives - 1);
        this.playerRig.setAnimation("hurt", true);
        this.playerRig.expression = "hurt";
        this.audio.playSfx("hurt");
        this.particles.burst(this.playerX, this.playerY - 80, "#ef4444", 16);
      }
    }

    this.syncHUD();
  }

  pauseGame() {
    if (this.state !== window.VTTT.STATES.PLAYING) return;
    this.state = window.VTTT.STATES.PAUSED;
    this.audio.pauseBgm();
    this.ui.showScreen(window.VTTT.STATES.PAUSED);
  }

  resumeGame() {
    if (this.state !== window.VTTT.STATES.PAUSED) return;
    this.state = window.VTTT.STATES.PLAYING;
    this.audio.playBgm();
    this.ui.showScreen(window.VTTT.STATES.PLAYING);
  }

  quitToMenu() {
    this.state = window.VTTT.STATES.MENU;
    this.audio.pauseBgm();
    this.ui.showScreen(window.VTTT.STATES.MENU, this.highScore, this.settings);
  }

  triggerVictory() {
    this.state = window.VTTT.STATES.VICTORY;
    this.playerRig.setAnimation("victory");
    this.audio.pauseBgm();
    this.audio.playSfx("victory");
    const topScore = Math.max(...this.players.map((p) => p.score));
    this.saveHighScore(topScore);
    this.ui.showResult(true, {
      players: this.players,
      totalQuestions: this.sessionQuestions.length
    });
  }

  triggerGameOver() {
    this.state = window.VTTT.STATES.GAME_OVER;
    this.playerRig.setAnimation("defeat");
    if (this.enemyRig) this.enemyRig.setAnimation("victory");
    this.audio.pauseBgm();
    this.audio.playSfx("defeat");
    const topScore = Math.max(...this.players.map((p) => p.score));
    this.saveHighScore(topScore);
    this.ui.showResult(false, {
      players: this.players,
      totalQuestions: this.sessionQuestions.length
    });
  }

  syncHUD() {
    const lvl = this.getLevelInfo(this.qIndex + 1);
    this.ui.updateHUD({
      players: this.players,
      activePlayerIdx: this.activePlayerIdx,
      levelName: `Cấp ${lvl.level}: ${lvl.name}`,
      currentIdx: Math.min(this.qIndex, this.sessionQuestions.length),
      total: this.sessionQuestions.length,
      timeLeft: this.timeLeft
    });
  }

  update(dt) {
    if (this.state === window.VTTT.STATES.PAUSED) return;

    if (
      this.state === window.VTTT.STATES.MENU ||
      this.state === window.VTTT.STATES.GUIDE ||
      this.state === window.VTTT.STATES.SETTINGS ||
      this.state === window.VTTT.STATES.TEACHER
    ) {
      this.bgScroll += dt * 35;
      this.playerRig.setAnimation("idle");
      this.playerRig.update(dt);
      return;
    }

    this.playerRig.update(dt);
    if (this.enemyRig) this.enemyRig.update(dt);
    this.particles.update(dt);

    if (!this.isGrounded) {
      this.playerY += this.playerVy * dt;
      this.playerVy += 1750 * dt;
      if (this.playerY >= this.config.groundY) {
        this.playerY = this.config.groundY;
        this.playerVy = 0;
        this.isGrounded = true;
        this.playerRig.setAnimation(this.phase === "RUN_IN" ? "run" : "idle");
      }
    }

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.x -= 360 * dt;
      c.bobPhase += dt * 5;
      const cy = c.y + Math.sin(c.bobPhase) * 10;
      const dx = Math.abs(c.x - this.playerX);
      const dy = Math.abs(cy - (this.playerY - 70));
      if (!c.collected && dx < 65 && dy < 75) {
        c.collected = true;
        const ap = this.getActivePlayer();
        ap.score += 25;
        this.audio.playSfx("correct");
        this.particles.burst(c.x, cy, "#fde047", 14);
        this.floatingTexts.push({ x: c.x, y: cy - 20, text: "+25 Sao!", color: "#fde047", life: 1.0 });
        this.syncHUD();
      }
      if (c.collected || c.x < -80) {
        this.collectibles.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.x += pr.speed * dt;
      if (pr.x >= pr.targetX - 30) {
        this.particles.burst(pr.targetX, this.config.groundY - 80, "#fde047", 26);
        if (this.enemyRig) {
          this.enemyRig.expression = "hurt";
          this.enemyRig.setAnimation("death", true);
        }
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 45 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.state !== window.VTTT.STATES.PLAYING) return;

    if (this.phase === "RUN_IN") {
      this.bgScroll += dt * 260;
      this.enemyX -= 380 * dt;
      if (this.enemyX <= this.enemyTargetX) {
        this.enemyX = this.enemyTargetX;
        this.phase = "COMBAT";
        this.questionLocked = false;
        this.playerRig.setAnimation("idle");
        this.enemyRig.setAnimation("idle");
        const q = this.sessionQuestions[this.qIndex];
        const enemyName = window.VTTT.ENEMY_NAMES[this.enemyType] || "Quái vật";
        const turnName = this.players.length > 1 ? this.getActivePlayer().name : null;
        this.ui.showQuestion(q, enemyName, turnName);
      }
    } else if (this.phase === "COMBAT") {
      this.timeLeft -= dt;
      this.syncHUD();
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.handleTimeout();
      }
    } else if (this.phase === "RESOLVING") {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        if (!this.anyPlayerAlive()) {
          this.triggerGameOver();
          return;
        }
        this.advancePlayerTurn();
        this.qIndex += 1;
        this.prepareNextEncounter();
      }
    }
  }

  drawParallaxLayer(img, factor, yOffset = 0) {
    if (!img) return;
    const W = this.config.canvasWidth;
    const shift = (this.bgScroll * factor) % W;
    this.ctx.drawImage(img, -shift, yOffset, W, this.config.canvasHeight);
    this.ctx.drawImage(img, W - shift, yOffset, W, this.config.canvasHeight);
  }

  render() {
    const ctx = this.ctx;
    const W = this.config.canvasWidth;
    const H = this.config.canvasHeight;
    ctx.clearRect(0, 0, W, H);

    const bg3d = this.assets.images["./assets/images/bg_forest_3d.png"];
    if (bg3d) {
      const period = W * 2;
      const shift = (this.bgScroll * 0.45) % period;
      // Vẽ cuộn liền mạch bằng ghép đối xứng
      ctx.drawImage(bg3d, -shift, 0, W, H);
      ctx.save();
      ctx.translate(W * 2 - shift, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(bg3d, 0, 0, W, H);
      ctx.restore();
      ctx.drawImage(bg3d, W * 2 - shift, 0, W, H);
    } else {
      const sky = this.assets.images["./assets/images/bg_sky.png"];
      if (sky) ctx.drawImage(sky, 0, 0, W, H);
    }

    const starImg = this.assets.images["./assets/images/star_knowledge.png"];
    for (const c of this.collectibles) {
      if (starImg) {
        const cy = c.y + Math.sin(c.bobPhase) * 10;
        ctx.drawImage(starImg, c.x - 28, cy - 28, 56, 56);
      }
    }

    this.playerRig.draw(ctx, this.playerX, this.playerY);
    if (
      this.enemyRig &&
      (this.state === window.VTTT.STATES.PLAYING ||
        this.state === window.VTTT.STATES.PAUSED ||
        this.state === window.VTTT.STATES.GAME_OVER)
    ) {
      this.enemyRig.draw(ctx, this.enemyX, this.config.groundY);
    }

    for (const pr of this.projectiles) {
      ctx.save();
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.particles.draw(ctx);
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = "800 24px Segoe UI, sans-serif";
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x - 24, ft.y);
      ctx.fillText(ft.text, ft.x - 24, ft.y);
      ctx.restore();
    }
  }
};
