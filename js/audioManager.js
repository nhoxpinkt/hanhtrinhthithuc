window.VTTT = window.VTTT || {};

window.VTTT.AudioManager = class AudioManager {
  constructor() {
    this.muted = false;
    this.bgmVolume = 0.4;
    this.sfxVolume = 0.8;
    this.sfxMap = {};
    this.lastPlayed = {};
    this.bgm = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const sfxFiles = {
      click: "./assets/audio/click.wav",
      jump: "./assets/audio/jump.wav",
      correct: "./assets/audio/correct.wav",
      wrong: "./assets/audio/wrong.wav",
      attack: "./assets/audio/attack.wav",
      hurt: "./assets/audio/hurt.wav",
      victory: "./assets/audio/victory.wav",
      defeat: "./assets/audio/defeat.wav"
    };

    for (const [key, src] of Object.entries(sfxFiles)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      this.sfxMap[key] = audio;
    }

    this.bgm = new Audio("./assets/audio/bgm_forest.wav");
    this.bgm.loop = true;
    this.bgm.volume = this.muted ? 0 : this.bgmVolume;
  }

  playBgm() {
    if (!this.bgm || this.muted) return;
    this.bgm.volume = this.bgmVolume;
    const p = this.bgm.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  }

  pauseBgm() {
    if (this.bgm) this.bgm.pause();
  }

  playSfx(name) {
    if (this.muted || !this.sfxMap[name]) return;
    const now = performance.now();
    // Chống chồng âm thanh liên tục trong lớp học
    if (this.lastPlayed[name] && now - this.lastPlayed[name] < 90) return;
    this.lastPlayed[name] = now;

    try {
      const sound = this.sfxMap[name].cloneNode();
      sound.volume = this.sfxVolume;
      const p = sound.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } catch (e) {
      // Bỏ qua lỗi trình duyệt chặn autoplay
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.bgm) {
      if (this.muted) this.bgm.pause();
      else this.bgm.volume = this.bgmVolume;
    }
  }

  setVolumes(bgmVol, sfxVol) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(bgmVol)));
    this.sfxVolume = Math.max(0, Math.min(1, Number(sfxVol)));
    if (this.bgm) {
      this.bgm.volume = this.muted ? 0 : this.bgmVolume;
    }
  }
};
