window.VTTT = window.VTTT || {};

window.VTTT.UIManager = class UIManager {
  constructor(questionManager, audioManager) {
    this.qm = questionManager;
    this.audio = audioManager;
    this.el = {
      hud: document.getElementById("hud-bar"),
      hudSoloStats: document.getElementById("hud-solo-stats"),
      mpBar: document.getElementById("multiplayer-bar"),
      lives: document.getElementById("lives-count"),
      shield: document.getElementById("hud-shield"),
      score: document.getElementById("score-value"),
      combo: document.getElementById("combo-value"),
      levelBadge: document.getElementById("level-badge"),
      progressFill: document.getElementById("progress-fill"),
      progressText: document.getElementById("progress-text"),
      timerWrap: document.getElementById("hud-timer"),
      timerVal: document.getElementById("timer-value"),
      muteBtn: document.getElementById("btn-mute-hud"),

      quizPanel: document.getElementById("quiz-panel"),
      quizCat: document.getElementById("quiz-category"),
      quizTurnTag: document.getElementById("quiz-turn-tag"),
      quizEnemyTag: document.getElementById("quiz-enemy-tag"),
      quizQuestion: document.getElementById("quiz-question-text"),
      optionBtns: Array.from(document.querySelectorAll(".option-btn")),
      quizFeedback: document.getElementById("quiz-feedback"),

      screenMenu: document.getElementById("screen-menu"),
      screenGuide: document.getElementById("screen-guide"),
      screenSettings: document.getElementById("screen-settings"),
      screenPause: document.getElementById("screen-pause"),
      screenResult: document.getElementById("screen-result"),
      screenTeacher: document.getElementById("screen-teacher"),

      menuHighScore: document.getElementById("menu-highscore"),
      menuQCount: document.getElementById("menu-qcount"),
      menuModeLabel: document.getElementById("menu-mode-label"),

      settingQSet: document.getElementById("setting-qset"),

      resultBadge: document.getElementById("result-badge"),
      resultTitle: document.getElementById("result-title"),
      soloResultStats: document.getElementById("solo-result-stats"),
      mpLeaderboard: document.getElementById("multiplayer-leaderboard"),
      resScore: document.getElementById("res-score"),
      resCorrect: document.getElementById("res-correct"),
      resCombo: document.getElementById("res-combo"),
      resLives: document.getElementById("res-lives"),

      teacherList: document.getElementById("teacher-q-list"),
      teacherSearch: document.getElementById("teacher-search"),
      teacherAlert: document.getElementById("teacher-alert"),
      qForm: document.getElementById("teacher-q-form"),
      qFormTitle: document.getElementById("q-form-title"),
      qEditId: document.getElementById("q-edit-id"),
      qCat: document.getElementById("q-input-category"),
      qText: document.getElementById("q-input-question"),
      qOpts: [
        document.getElementById("q-opt-0"),
        document.getElementById("q-opt-1"),
        document.getElementById("q-opt-2"),
        document.getElementById("q-opt-3")
      ],
      qCorrect: document.getElementById("q-input-correct"),
      qExp: document.getElementById("q-input-explanation")
    };
  }

  populateQuestionSets(selectedSet = "all") {
    const sel = this.el.settingQSet;
    if (!sel) return;
    const total = this.qm.getAll().length;
    const cats = this.qm.getCategories();
    sel.innerHTML = `<option value="all">Tất cả bộ câu hỏi (${total} câu)</option>`;
    for (const c of cats) {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = `${c.name} (${c.count} câu)`;
      sel.appendChild(opt);
    }
    sel.value = cats.some((c) => c.name === selectedSet) ? selectedSet : "all";
  }

  hideAllOverlays() {
    [
      this.el.screenMenu,
      this.el.screenGuide,
      this.el.screenSettings,
      this.el.screenPause,
      this.el.screenResult,
      this.el.screenTeacher
    ].forEach((s) => s.classList.add("hidden"));
  }

  showScreen(name, highScore = 0, settings = null) {
    this.hideAllOverlays();
    const S = window.VTTT.STATES;
    if (name === S.MENU) {
      this.el.hud.classList.add("hidden");
      this.el.quizPanel.classList.add("hidden");
      this.el.menuHighScore.textContent = highScore;
      this.el.menuQCount.textContent = this.qm.getAll().length;
      if (settings && this.el.menuModeLabel) {
        const pc = Number(settings.playerCount) || 1;
        this.el.menuModeLabel.textContent = pc > 1 ? `${pc} người/đội` : "1 người";
      }
      this.el.screenMenu.classList.remove("hidden");
    } else if (name === S.GUIDE) {
      this.el.screenGuide.classList.remove("hidden");
    } else if (name === S.SETTINGS) {
      this.populateQuestionSets(settings ? settings.questionSet : "all");
      this.el.screenSettings.classList.remove("hidden");
    } else if (name === S.TEACHER) {
      this.el.screenTeacher.classList.remove("hidden");
      this.renderTeacherList();
    } else if (name === S.PAUSED) {
      this.el.screenPause.classList.remove("hidden");
    } else if (name === S.PLAYING) {
      this.el.hud.classList.remove("hidden");
    }
  }

  updateHUD({ players, activePlayerIdx, levelName, currentIdx, total, timeLeft }) {
    const isMulti = players && players.length > 1;
    this.el.hudSoloStats.classList.toggle("hidden", isMulti);
    this.el.mpBar.classList.toggle("hidden", !isMulti);

    if (isMulti) {
      this.el.mpBar.innerHTML = players
        .map((p, idx) => {
          const activeCls = idx === activePlayerIdx ? "active" : "";
          const elimCls = p.lives <= 0 ? "eliminated" : "";
          const shieldIcon = p.hasShield ? " 🛡️" : "";
          return `
            <div class="mp-card ${activeCls} ${elimCls}">
              <div class="mp-name">${this.escapeHtml(p.name)}${shieldIcon}</div>
              <div class="mp-meta"><span>❤️${p.lives}</span><span>⭐${p.score}</span></div>
            </div>`;
        })
        .join("");
    } else if (players && players[0]) {
      const p = players[0];
      this.el.lives.textContent = p.lives;
      this.el.shield.classList.toggle("hidden", !p.hasShield);
      this.el.score.textContent = p.score;
      this.el.combo.textContent = p.combo;
    }

    this.el.levelBadge.textContent = levelName;
    const pct = total > 0 ? Math.round((currentIdx / total) * 100) : 0;
    this.el.progressFill.style.width = `${pct}%`;
    this.el.progressText.textContent = `${currentIdx} / ${total}`;
    const sec = Math.max(0, Math.ceil(timeLeft));
    this.el.timerVal.textContent = sec;
    this.el.timerWrap.classList.toggle("warning", sec <= 5 && sec > 0);
  }

  updateMuteLabel(muted) {
    this.el.muteBtn.textContent = muted ? "Âm thanh: Tắt" : "Âm thanh: Bật";
  }

  showQuestion(q, enemyName, activePlayerName = null) {
    this.el.quizCat.textContent = q.category || "Tổng hợp";
    if (activePlayerName) {
      this.el.quizTurnTag.textContent = `Lượt: ${activePlayerName}`;
      this.el.quizTurnTag.classList.remove("hidden");
    } else {
      this.el.quizTurnTag.classList.add("hidden");
    }
    this.el.quizEnemyTag.textContent = `Đối đầu: ${enemyName}`;
    this.el.quizQuestion.textContent = q.question;
    this.el.quizFeedback.classList.add("hidden");
    this.el.quizFeedback.className = "quiz-feedback hidden";

    this.el.optionBtns.forEach((btn, idx) => {
      btn.disabled = false;
      btn.classList.remove("correct", "wrong");
      btn.querySelector(".opt-text").textContent = q.options[idx];
    });
    this.el.quizPanel.classList.remove("hidden");
  }

  hideQuestion() {
    this.el.quizPanel.classList.add("hidden");
  }

  showQuestionResult(selectedIndex, correctIndex, isCorrect, isTimeout, explanation) {
    this.el.optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === correctIndex) btn.classList.add("correct");
      else if (idx === selectedIndex && !isCorrect) btn.classList.add("wrong");
    });

    const fb = this.el.quizFeedback;
    fb.classList.remove("hidden", "ok", "err");
    if (isCorrect) {
      fb.classList.add("ok");
      fb.textContent = `Chính xác! ${explanation || ""}`;
    } else if (isTimeout) {
      fb.classList.add("err");
      fb.textContent = `Hết giờ! Đáp án đúng là ${["A", "B", "C", "D"][correctIndex]}. ${explanation || ""}`;
    } else {
      fb.classList.add("err");
      fb.textContent = `Chưa đúng! Đáp án đúng là ${["A", "B", "C", "D"][correctIndex]}. ${explanation || ""}`;
    }
  }

  showResult(isVictory, stats) {
    this.el.hud.classList.add("hidden");
    this.el.quizPanel.classList.add("hidden");
    const isMulti = stats.players && stats.players.length > 1;

    this.el.resultBadge.textContent = isVictory ? "Chiến thắng!" : "Chưa vượt qua!";
    this.el.resultBadge.className = isVictory ? "result-badge" : "result-badge lose";
    this.el.resultTitle.textContent = isVictory
      ? "Khu rừng đã sáng bừng tri thức!"
      : "Bé Mầm cần thêm chút năng lượng để tiếp tục!";

    this.el.soloResultStats.classList.toggle("hidden", isMulti);
    this.el.mpLeaderboard.classList.toggle("hidden", !isMulti);

    if (isMulti) {
      const sorted = [...stats.players].sort((a, b) => b.score - a.score);
      this.el.mpLeaderboard.innerHTML = sorted
        .map((p, i) => `
          <div class="lb-row ${i === 0 ? "winner" : ""}">
            <span>#${i + 1} ${this.escapeHtml(p.name)}</span>
            <span>Đúng ${p.correctCount} câu · ❤️${p.lives} · ⭐ ${p.score} điểm</span>
          </div>`)
        .join("");
    } else {
      const p = stats.players[0];
      this.el.resScore.textContent = p.score;
      this.el.resCorrect.textContent = `${p.correctCount} / ${stats.totalQuestions}`;
      this.el.resCombo.textContent = p.maxCombo;
      this.el.resLives.textContent = p.lives;
    }

    this.el.screenResult.classList.remove("hidden");
  }

  showTeacherAlert(msg, isError = false) {
    const a = this.el.teacherAlert;
    a.textContent = msg;
    a.className = `teacher-alert ${isError ? "err" : "ok"}`;
    a.classList.remove("hidden");
    clearTimeout(this._alertTimer);
    this._alertTimer = setTimeout(() => a.classList.add("hidden"), 4500);
  }

  renderTeacherList() {
    const kw = (this.el.teacherSearch.value || "").trim().toLowerCase();
    const list = this.qm.getAll().filter((q) => {
      if (!kw) return true;
      return (
        q.question.toLowerCase().includes(kw) ||
        (q.category || "").toLowerCase().includes(kw)
      );
    });

    this.el.teacherList.innerHTML = "";
    if (list.length === 0) {
      this.el.teacherList.innerHTML = `<p style="color:#64748b;padding:12px;">Không tìm thấy câu hỏi phù hợp.</p>`;
      return;
    }

    for (const q of list) {
      const div = document.createElement("div");
      div.className = "q-item";
      const letter = ["A", "B", "C", "D"][q.correctIndex] || "A";
      div.innerHTML = `
        <div class="q-item-main">
          <div class="q-item-cat">${this.escapeHtml(q.category || "Chung")}</div>
          <div class="q-item-text">${this.escapeHtml(q.question)}</div>
          <div class="q-item-ans">Đáp án đúng: ${letter}. ${this.escapeHtml(q.options[q.correctIndex] || "")}</div>
        </div>
        <div class="q-item-actions">
          <button class="btn-mini btn-mini-edit" data-id="${q.id}" type="button">Sửa</button>
          <button class="btn-mini btn-mini-del" data-id="${q.id}" type="button">Xóa</button>
        </div>
      `;
      this.el.teacherList.appendChild(div);
    }
  }

  openQuestionForm(q = null) {
    this.el.qForm.classList.remove("hidden");
    if (q) {
      this.el.qFormTitle.textContent = "Chỉnh sửa câu hỏi";
      this.el.qEditId.value = q.id;
      this.el.qCat.value = q.category || "";
      this.el.qText.value = q.question || "";
      q.options.forEach((opt, i) => {
        this.el.qOpts[i].value = opt || "";
      });
      this.el.qCorrect.value = String(q.correctIndex);
      this.el.qExp.value = q.explanation || "";
    } else {
      this.el.qFormTitle.textContent = "Thêm câu hỏi mới";
      this.el.qEditId.value = "";
      this.el.qCat.value = "Tổng hợp";
      this.el.qText.value = "";
      this.el.qOpts.forEach((inp) => (inp.value = ""));
      this.el.qCorrect.value = "0";
      this.el.qExp.value = "";
    }
  }

  closeQuestionForm() {
    this.el.qForm.classList.add("hidden");
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
};
