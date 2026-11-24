window.VTTT = window.VTTT || {};

window.VTTT.AssetManager = class AssetManager {
  constructor() {
    this.images = {};
    this.characters = {};
  }

  loadImage(src) {
    if (this.images[src]) return Promise.resolve(this.images[src]);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[src] = img;
        resolve(img);
      };
      img.onerror = () => {
        console.warn("Không thể tải ảnh:", src);
        resolve(null);
      };
      img.src = src;
    });
  }

  async loadJson(src) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      console.warn("Không thể tải JSON:", src, e);
      return null;
    }
  }

  async loadCharacter(id, basePath) {
    const [skeleton, animations] = await Promise.all([
      this.loadJson(`${basePath}/skeleton.json`),
      this.loadJson(`${basePath}/animations.json`)
    ]);
    if (!skeleton || !animations) return null;

    const sprites = {};
    const loadTasks = [];
    for (const bone of skeleton.bones) {
      const keys = ["sprite", "blinkSprite", "hurtSprite"];
      for (const k of keys) {
        if (bone[k]) {
          const fname = bone[k];
          if (!sprites[fname]) {
            loadTasks.push(
              this.loadImage(`${basePath}/parts/${fname}`).then((img) => {
                sprites[fname] = img;
              })
            );
          }
        }
      }
    }
    await Promise.all(loadTasks);
    const charData = { id, skeleton, animations, sprites };
    this.characters[id] = charData;
    return charData;
  }

  async loadAll() {
    const envImages = [
      "./assets/images/bg_forest_3d.png",
      "./assets/images/trophy_cup.png",
      "./assets/images/bg_sky.png",
      "./assets/images/bg_mountains.png",
      "./assets/images/bg_trees_far.png",
      "./assets/images/bg_trees_near.png",
      "./assets/images/ground_tile.png",
      "./assets/images/star_knowledge.png",
      "./assets/images/heart_gem.png",
      "./assets/images/shield_orb.png"
    ];

    await Promise.all([
      ...envImages.map((src) => this.loadImage(src)),
      this.loadCharacter("player", "./assets/characters/player"),
      this.loadCharacter("shroomy", "./assets/characters/enemies/shroomy"),
      this.loadCharacter("mossy", "./assets/characters/enemies/mossy"),
      this.loadCharacter("ember", "./assets/characters/enemies/ember"),
      this.loadCharacter("frosty", "./assets/characters/enemies/frosty")
    ]);
  }
};
