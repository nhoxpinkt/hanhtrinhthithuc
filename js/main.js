document.addEventListener("DOMContentLoaded", async () => {
  const S = window.VTTT.STATES;
  const config = await window.VTTT.loadConfig();

  const audio = new window.VTTT.AudioManager();
  const assets = new window.VTTT.AssetManager();
  const qm = new window.VTTT.QuestionManager(config.storageKeys.questions);

  await Promise.all([assets.loadAll(), qm.init()]);

  const ui = new window.VTTT.UIManager(qm, audio);
  const canvas = document.getElementById("game-canvas");
  const engine = new window.VTTT.GameEngine(canvas, config, assets, audio, qm, ui);

  // Áp dụng cài đặt âm thanh đã lưu
  audio.setMuted(engine.settings.muted);
  audio.setVolumes(engine.settings.bgmVol, engine.settings.sfxVol);
  ui.updateMuteLabel(engine.settings.muted);

  // Hiển thị Menu ban đầu & bắt đầu vòng lặp render
  ui.showScreen(S.MENU, engine.highScore, engine.settings);
  engine.startLoop();

  // --- Sự kiện nút bấm ---
  document.getElementById("btn-start-game").addEventListener("click", () => {
    audio.init();
    audio.playSfx("click");
    engine.startNewGame();
  });

  document.getElementById("btn-open-guide").addEventListener("click", () => {
    audio.init();
    audio.playSfx("click");
    ui.showScreen(S.GUIDE);
  });

  document.getElementById("btn-guide-back").addEventListener("click", () => {
    audio.playSfx("click");
    ui.showScreen(S.MENU, engine.highScore, engine.settings);
  });

  document.getElementById("btn-open-settings").addEventListener("click", () => {
    audio.init();
    audio.playSfx("click");
    document.getElementById("setting-qcount").value = String(engine.settings.questionCount);
    document.getElementById("setting-time").value = String(engine.settings.questionTime);
    document.getElementById("setting-sound-toggle").checked = !engine.settings.muted;
    document.getElementById("setting-bgm-vol").value = String(engine.settings.bgmVol);
    document.getElementById("setting-sfx-vol").value = String(engine.settings.sfxVol);
    document.getElementById('setting-players').value = String(engine.settings.playerCount || 1);
    ui.showScreen(S.SETTINGS, engine.highScore, engine.settings);
  });

  document.getElementById("btn-settings-save").addEventListener("click", () => {
    audio.playSfx("click");
    engine.saveSettings({
      questionSet: document.getElementById("setting-qset").value,
      questionCount: document.getElementById("setting-qcount").value,
      playerCount: Number(document.getElementById("setting-players").value),
      questionTime: Number(document.getElementById("setting-time").value),
      muted: !document.getElementById("setting-sound-toggle").checked,
      bgmVol: Number(document.getElementById("setting-bgm-vol").value),
      sfxVol: Number(document.getElementById("setting-sfx-vol").value)
    });
    ui.showScreen(S.MENU, engine.highScore, engine.settings);
  });

  document.getElementById("btn-settings-cancel").addEventListener("click", () => {
    audio.playSfx("click");
    ui.showScreen(S.MENU, engine.highScore, engine.settings);
  });

  document.getElementById("btn-mute-hud").addEventListener("click", () => {
    audio.init();
    const nextMuted = !audio.muted;
    engine.saveSettings({ muted: nextMuted });
    if (!nextMuted && engine.state === S.PLAYING) audio.playBgm();
  });

  document.getElementById("btn-jump-action").addEventListener("click", () => {
    engine.playerJump();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && engine.state === S.PLAYING) {
      e.preventDefault();
      engine.playerJump();
    }
  });

  document.getElementById("btn-pause").addEventListener("click", () => {
    audio.playSfx("click");
    engine.pauseGame();
  });

  document.getElementById("btn-resume-game").addEventListener("click", () => {
    audio.playSfx("click");
    engine.resumeGame();
  });

  document.getElementById("btn-restart-from-pause").addEventListener("click", () => {
    audio.playSfx("click");
    engine.startNewGame();
  });

  document.getElementById("btn-quit-to-menu").addEventListener("click", () => {
    audio.playSfx("click");
    engine.quitToMenu();
  });

  document.getElementById("btn-play-again").addEventListener("click", () => {
    audio.playSfx("click");
    engine.startNewGame();
  });

  document.getElementById("btn-result-menu").addEventListener("click", () => {
    audio.playSfx("click");
    engine.quitToMenu();
  });

  // Trả lời câu hỏi
  ui.el.optionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      engine.submitAnswer(idx);
    });
  });

  // --- Quản lý câu hỏi (Giáo viên) ---
  document.getElementById("btn-open-teacher").addEventListener("click", () => {
    audio.init();
    audio.playSfx("click");
    ui.closeQuestionForm();
    ui.showScreen(S.TEACHER);
  });

  document.getElementById("btn-teacher-close").addEventListener("click", () => {
    audio.playSfx("click");
    ui.showScreen(S.MENU, engine.highScore, engine.settings);
  });

  ui.el.teacherSearch.addEventListener("input", () => {
    ui.renderTeacherList();
  });

  document.getElementById("btn-q-add").addEventListener("click", () => {
    ui.openQuestionForm(null);
  });

  document.getElementById("btn-q-cancel").addEventListener("click", () => {
    ui.closeQuestionForm();
  });

  ui.el.teacherList.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-mini-edit");
    const delBtn = e.target.closest(".btn-mini-del");
    if (editBtn) {
      const q = qm.getAll().find((item) => item.id === editBtn.dataset.id);
      if (q) ui.openQuestionForm(q);
    } else if (delBtn) {
      qm.deleteQuestion(delBtn.dataset.id);
      ui.renderTeacherList();
      ui.showTeacherAlert("Đã xóa câu hỏi.");
    }
  });

  ui.el.qForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = ui.el.qEditId.value;
    const payload = {
      category: ui.el.qCat.value,
      question: ui.el.qText.value,
      options: ui.el.qOpts.map((i) => i.value),
      correctIndex: Number(ui.el.qCorrect.value),
      explanation: ui.el.qExp.value
    };
    const res = id ? qm.updateQuestion(id, payload) : qm.addQuestion(payload);
    if (!res.valid) {
      ui.showTeacherAlert(res.error, true);
      return;
    }
    ui.closeQuestionForm();
    ui.renderTeacherList();
    ui.showTeacherAlert(id ? "Đã cập nhật câu hỏi!" : "Đã thêm câu hỏi mới!");
  });

  document.getElementById("btn-restore-default").addEventListener("click", () => {
    qm.restoreDefaults();
    ui.renderTeacherList();
    ui.showTeacherAlert("Đã khôi phục bộ câu hỏi mặc định (30 câu).");
  });

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  document.getElementById("btn-export-json").addEventListener("click", () => {
    downloadFile(qm.exportJSON(), "cau-hoi-ve-than-tri-thuc.json", "application/json;charset=utf-8");
  });

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    downloadFile(qm.exportCSV(), "cau-hoi-ve-than-tri-thuc.csv", "text/csv;charset=utf-8");
  });

  document.getElementById("input-import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const res = qm.importFromText(text, file.name);
    e.target.value = "";
    if (!res.ok) {
      ui.showTeacherAlert(res.error, true);
      return;
    }
    ui.renderTeacherList();
    ui.showTeacherAlert(`Đã nhập thành công ${res.count} câu hỏi!`);
  });
});
