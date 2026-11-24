window.VTTT = window.VTTT || {};

window.VTTT.STATES = {
  MENU: "MENU",
  GUIDE: "GUIDE",
  SETTINGS: "SETTINGS",
  TEACHER: "TEACHER",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  TRANSITION: "TRANSITION",
  VICTORY: "VICTORY",
  GAME_OVER: "GAME_OVER"
};

window.VTTT.DEFAULT_CONFIG = {
  gameTitle: "Hành Trình Vệ Thần Tri Thức",
  canvasWidth: 1280,
  canvasHeight: 720,
  groundY: 428,
  defaultQuestionTimeSec: 20,
  defaultQuestionCount: "all",
  defaultQuestionSet: "all",
  defaultPlayerCount: 1,
  maxPlayers: 4,
  maxLives: 3,
  baseScore: 100,
  comboBonus: 25,
  shieldComboThreshold: 3,
  levels: [
    { level: 1, name: "Rừng Sáng Sớm", enemy: "shroomy", minQuestion: 1 },
    { level: 2, name: "Đồi Nắng Đỏ", enemy: "ember", minQuestion: 3 },
    { level: 3, name: "Đền Cổ Tri Thức", enemy: "mossy", minQuestion: 6 },
    { level: 4, name: "Đỉnh Pha Lê Băng", enemy: "frosty", minQuestion: 9 }
  ],
  storageKeys: {
    questions: "vttt_questions_v1",
    settings: "vttt_settings_v1",
    highScore: "vttt_highscore_v1"
  }
};

window.VTTT.loadConfig = async function () {
  try {
    const res = await fetch("./data/config.json");
    if (!res.ok) return window.VTTT.DEFAULT_CONFIG;
    const data = await res.json();
    return Object.assign({}, window.VTTT.DEFAULT_CONFIG, data);
  } catch (e) {
    return window.VTTT.DEFAULT_CONFIG;
  }
};
