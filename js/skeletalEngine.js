window.VTTT = window.VTTT || {};

/**
 * Bộ điều khiển hoạt ảnh xương 2D (Skeletal Rigging Engine)
 * Hỗ trợ: Phân cấp xương cha-con, nội suy Ease-In-Out, Blend giữa các trạng thái,
 * Secondary Motion (lò xo/trễ pha), chớp mắt tự động và đổi biểu cảm.
 */
window.VTTT.SkeletalRig = class SkeletalRig {
  constructor(charData) {
    this.charData = charData;
    this.skeleton = charData.skeleton;
    this.animations = charData.animations;
    this.sprites = charData.sprites;

    this.currentAnim = "idle";
    this.prevAnim = null;
    this.time = 0;
    this.blendProgress = 1;
    this.blendDuration = 0.16;

    this.blinkTimer = 2.0 + Math.random() * 2.5;
    this.isBlinking = false;
    this.expression = "normal"; // normal | hurt
    this.facing = 1; // 1: phải, -1: trái
    this.secondaryPhase = 0;
  }

  setAnimation(name, restart = false) {
    if (!this.animations[name]) return;
    if (this.currentAnim === name && !restart) return;
    this.prevAnim = this.currentAnim;
    this.currentAnim = name;
    this.time = 0;
    this.blendProgress = 0;
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  sampleTrack(frames, t) {
    if (!frames || frames.length === 0) return {};
    if (frames.length === 1 || t <= frames[0].t) return frames[0];
    const last = frames[frames.length - 1];
    if (t >= last.t) return last;

    for (let i = 0; i < frames.length - 1; i++) {
      const a = frames[i];
      const b = frames[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = Math.max(b.t - a.t, 0.0001);
        const alpha = this.easeInOut((t - a.t) / span);
        const res = {};
        const props = ["x", "y", "rotation", "scaleX", "scaleY", "alpha"];
        for (const p of props) {
          if (a[p] !== undefined || b[p] !== undefined) {
            const va = a[p] !== undefined ? a[p] : (p.startsWith("scale") || p === "alpha" ? 1 : 0);
            const vb = b[p] !== undefined ? b[p] : (p.startsWith("scale") || p === "alpha" ? 1 : 0);
            res[p] = va + (vb - va) * alpha;
          }
        }
        return res;
      }
    }
    return last;
  }

  update(dt) {
    const anim = this.animations[this.currentAnim];
    if (!anim) return;

    this.time += dt;
    if (anim.loop) {
      this.time = this.time % anim.duration;
    } else if (this.time >= anim.duration) {
      this.time = anim.duration;
      if (this.currentAnim !== "death" && this.currentAnim !== "defeat") {
        this.setAnimation("idle");
      }
    }

    if (this.blendProgress < 1) {
      this.blendProgress = Math.min(1, this.blendProgress + dt / this.blendDuration);
    }

    // Chớp mắt tự nhiên
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      if (this.isBlinking) {
        this.isBlinking = false;
        this.blinkTimer = 2.4 + Math.random() * 2.8;
      } else {
        this.isBlinking = true;
        this.blinkTimer = 0.13;
      }
    }

    this.secondaryPhase += dt * 4.2;
  }

  computePose() {
    const anim = this.animations[this.currentAnim];
    const prev = this.prevAnim ? this.animations[this.prevAnim] : null;
    const blend = this.blendProgress;

    const localTransforms = {};
    for (const bone of this.skeleton.bones) {
      const base = {
        x: bone.x || 0,
        y: bone.y || 0,
        rotation: bone.rotation || 0,
        scaleX: bone.scaleX !== undefined ? bone.scaleX : 1,
        scaleY: bone.scaleY !== undefined ? bone.scaleY : 1,
        alpha: 1
      };

      const curSample = anim && anim.keyframes[bone.id]
        ? this.sampleTrack(anim.keyframes[bone.id], this.time)
        : {};

      const target = {
        x: curSample.x !== undefined ? curSample.x : base.x,
        y: curSample.y !== undefined ? curSample.y : base.y,
        rotation: curSample.rotation !== undefined ? curSample.rotation : base.rotation,
        scaleX: curSample.scaleX !== undefined ? curSample.scaleX : base.scaleX,
        scaleY: curSample.scaleY !== undefined ? curSample.scaleY : base.scaleY,
        alpha: curSample.alpha !== undefined ? curSample.alpha : 1
      };

      // Blend mượt với animation trước
      if (prev && blend < 1 && prev.keyframes[bone.id]) {
        const prevSample = this.sampleTrack(prev.keyframes[bone.id], 0);
        const px = prevSample.x !== undefined ? prevSample.x : base.x;
        const py = prevSample.y !== undefined ? prevSample.y : base.y;
        const pr = prevSample.rotation !== undefined ? prevSample.rotation : base.rotation;
        target.x = px + (target.x - px) * blend;
        target.y = py + (target.y - py) * blend;
        target.rotation = pr + (target.rotation - pr) * blend;
      }

      // Secondary Motion cho phụ kiện (mũ lá, ba lô, quyền trượng, tai nấm)
      if (bone.secondary === "spring") {
        target.rotation += Math.sin(this.secondaryPhase) * 3.5;
      } else if (bone.secondary === "lag") {
        target.rotation += Math.cos(this.secondaryPhase * 1.1) * 2.5;
      }

      localTransforms[bone.id] = target;
    }
    return localTransforms;
  }

  draw(ctx, worldX, worldY) {
    const pose = this.computePose();
    const scale = this.skeleton.scale || 0.6;
    const worldMatrices = {};

    // Tính ma trận thế giới theo thứ tự cây xương (parent luôn đứng trước child)
    ctx.save();
    ctx.translate(worldX, worldY);
    ctx.scale(this.facing * scale, scale);

    // Đổ bóng mềm dưới chân nhân vật
    const hipAlpha = pose.hip ? pose.hip.alpha : 1;
    ctx.save();
    ctx.globalAlpha = 0.28 * hipAlpha;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(0, 6, 78, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const boneMap = {};
    for (const b of this.skeleton.bones) {
      boneMap[b.id] = b;
    }

    const getWorld = (boneId) => {
      if (worldMatrices[boneId]) return worldMatrices[boneId];
      const bone = boneMap[boneId];
      const t = pose[boneId];
      const m = new DOMMatrix();
      m.translateSelf(t.x, t.y);
      m.rotateSelf(t.rotation);
      m.scaleSelf(t.scaleX, t.scaleY);

      let finalM = m;
      let alpha = t.alpha;
      if (bone.parent) {
        const parentRes = getWorld(bone.parent);
        finalM = parentRes.matrix.multiply(m);
        alpha *= parentRes.alpha;
      }
      worldMatrices[boneId] = { matrix: finalM, alpha };
      return worldMatrices[boneId];
    };

    for (const b of this.skeleton.bones) {
      getWorld(b.id);
    }

    // Vẽ theo thứ tự zIndex
    const sorted = [...this.skeleton.bones].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const bone of sorted) {
      let spriteName = bone.sprite;
      if (!spriteName) continue;

      if (bone.id === "eyes") {
        if (this.expression === "hurt" && bone.hurtSprite) {
          spriteName = bone.hurtSprite;
        } else if (this.isBlinking && bone.blinkSprite) {
          spriteName = bone.blinkSprite;
        }
      }

      const img = this.sprites[spriteName];
      if (!img) continue;

      const wm = worldMatrices[bone.id];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, wm.alpha));
      const m = wm.matrix;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      const px = bone.pivotX || img.width / 2;
      const py = bone.pivotY || img.height / 2;
      ctx.drawImage(img, -px, -py);
      ctx.restore();
    }

    ctx.restore();
  }
};

window.VTTT.ParticleSystem = class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  burst(x, y, color = "#fde047", count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 210;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        radius: 4 + Math.random() * 6,
        color,
        life: 0.55 + Math.random() * 0.35,
        maxLife: 0.9
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
};
