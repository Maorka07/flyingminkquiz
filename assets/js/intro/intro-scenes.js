/*
  Intro scenes for the Flying Mink opening. One is picked at random each time the intro plays.

  Every scene shares one timeline: d goes 0 → 1 while the mink crosses the platform
  (or the car drives it), at a pace that adapts to load speed. A scene draws on the
  full-screen FX canvas each frame and decides how it ends:

    scene.mode            'mink' (the running mink is shown) or 'car' (it is hidden)
    scene.frame(now, d, G) → { kick } — draw the frame; kick 0..1 is passed to the mink
    scene.finale(now, G)   → { jump, curtainIn } — called once when d reaches 1:
                             jump: the mink jumps off the platform; curtainIn: ms until
                             the screen drops (the hero video starts at that moment)

  G (geometry, px relative to the intro): mx, my, mw, mh — the mink's box;
  pL, pR, pTop — the platform; W, H — the intro size.
*/
(function () {
  const WHITE = '#fff';
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // outlined shape: clear what is behind it on the FX layer, then stroke
  function shape(g, build, lw = 2) {
    const P = new Path2D(); build(P);
    g.save(); g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.fill(P); g.restore();
    g.lineWidth = lw; g.stroke(P);
  }
  function glow(g, color = 'rgba(167,139,250,.55)', blur = 8) { g.shadowColor = color; g.shadowBlur = blur; }

  /* ---------------- basketball: dribble the length of the court, fly up and dunk ---------------- */
  class Hoops {
    constructor() { this.mode = 'mink'; this.dunkAt = 0; this.slamAt = 0; this.D = 950; }
    hoop(G) {
      const rimR = Math.max(13, G.mw * 0.1), board = Math.max(16, G.mw * 0.12);
      const rimX = Math.min(G.pR + Math.max(30, G.mw * 0.24), G.W - 34 - board - rimR), rimY = G.pTop - G.mh * 1.25;
      return { rimX, rimY, rimR, boardX: rimX + board };
    }
    // where the ball sits in the mink's front paws, following the jump (translation + rotation)
    held(G) {
      const C = { x: G.mx + G.mw / 2, y: G.my + G.mh / 2 };
      const m = getComputedStyle(G.runner).transform, ang = m && m !== 'none' ? (() => { const v = m.match(/-?[\d.e]+/g).map(Number); return Math.atan2(v[1], v[0]); })() : 0;
      const v = this.v0, c = Math.cos(ang), s = Math.sin(ang);
      return { x: C.x + v.x * c - v.y * s, y: C.y + v.x * s + v.y * c };
    }
    frame(now, d, G) {
      const g = G.g, H = this.hoop(G), r = Math.max(7, G.mw * 0.06);
      const slam = this.slamAt && now >= this.slamAt ? clamp01((now - this.slamAt) / 420) : 0;
      const shake = this.slamAt && now >= this.slamAt ? Math.sin((now - this.slamAt) / 16) * 3.2 * (1 - slam) : 0;
      const rimY = H.rimY + Math.max(0, shake) + (slam > 0 && slam < 1 ? 2 * (1 - slam) : 0);

      // hoop: pole, backboard (wobbles on the slam), rim and net
      g.save(); g.strokeStyle = WHITE; g.lineCap = 'round'; g.lineJoin = 'round'; glow(g);
      g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(H.boardX + 8, G.pTop); g.lineTo(H.boardX + 8, H.rimY - 6); g.lineTo(H.boardX, H.rimY - 6); g.stroke();
      g.save(); g.translate(H.boardX, H.rimY); g.rotate(shake * 0.012);
      shape(g, P => P.rect(-2, -H.rimR * 2.6, 5, H.rimR * 3.2), 2);
      g.lineWidth = 1.2; g.strokeRect(-1, -H.rimR * 1.4, 3, H.rimR * 1.1);
      g.restore();
      const pull = Math.sin(Math.PI * slam) * H.rimR * 0.9;            // net whips down as the ball goes through
      g.lineWidth = 1.1; g.globalAlpha = .8;
      for (let i = 0; i <= 4; i++) {
        const t = i / 4, top = H.rimX - H.rimR + 2 * H.rimR * t, bot = H.rimX - H.rimR * 0.55 + 1.1 * H.rimR * t;
        g.beginPath(); g.moveTo(top, rimY); g.lineTo(bot, rimY + H.rimR * 1.5 + pull); g.stroke();
      }
      for (const k of [0.5, 1]) {
        g.beginPath(); g.ellipse(H.rimX, rimY + H.rimR * 1.5 * k + pull * k, H.rimR * (1 - 0.45 * k), 2.5, 0, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
      g.strokeStyle = '#fb923c'; glow(g, 'rgba(251,146,60,.8)', 12); g.lineWidth = 2.8;
      g.beginPath(); g.ellipse(H.rimX, rimY, H.rimR, 3.5, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(H.rimX + H.rimR, rimY); g.lineTo(H.boardX - 1, H.rimY); g.stroke();
      // slam burst
      if (slam > 0 && slam < 1) {
        g.lineWidth = 2; g.globalAlpha = 1 - slam;
        for (let i = 0; i < 8; i++) {
          const a = -Math.PI / 2 + (i - 3.5) * 0.42, r0 = H.rimR * (1.2 + slam * 1.6), r1 = r0 + H.rimR * 0.7;
          g.beginPath(); g.moveTo(H.rimX + Math.cos(a) * r0, rimY + Math.sin(a) * r0 * .8); g.lineTo(H.rimX + Math.cos(a) * r1, rimY + Math.sin(a) * r1 * .8); g.stroke();
        }
        g.globalAlpha = 1;
      }
      g.restore();

      // ball: dribbled at the front paws, carried up in the jump, slammed through the rim
      let bx, by;
      if (!this.dunkAt) {
        bx = G.mx + G.mw * 0.86; by = G.pTop - r - Math.abs(Math.sin(now / 95)) * G.mh * 0.42;
      } else if (now < this.slamAt) {
        const p = this.held(G); bx = p.x; by = p.y; this.lastHeld = p;
      } else {
        const from = this.slamFrom || (this.slamFrom = this.lastHeld || { x: H.rimX, y: H.rimY - r });
        const u = clamp01((now - this.slamAt) / 340);
        bx = lerp(from.x, H.rimX, clamp01(u * 3)); by = lerp(from.y, G.pTop - r, u * u);
      }
      this.ball(g, bx, by, r, now);
      return { kick: 0 };
    }
    ball(g, x, y, r, now) {
      g.save(); g.translate(x, y); g.rotate(now / 140);
      g.strokeStyle = '#fb923c'; g.lineCap = 'round'; glow(g, 'rgba(251,146,60,.75)', 10);
      shape(g, P => P.arc(0, 0, r, 0, Math.PI * 2), 2.2);
      g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
      g.beginPath(); g.arc(-r * 1.15, 0, r * 0.8, -0.9, 0.9); g.stroke();
      g.beginPath(); g.arc(r * 1.15, 0, r * 0.8, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
      g.restore();
    }
    // take off from the end of the court, rise wings-open, slam, hang on the rim, drop away
    finale(now, G) {
      const H = this.hoop(G), D = this.D, SLAM = 0.58, slamDeg = 20;
      const C0 = { x: G.mx + G.mw / 2, y: G.my + G.mh / 2 };
      const P0 = { x: G.mx + G.mw * 0.9, y: G.my + G.mh * 0.42 };          // paws, holding the ball
      this.v0 = { x: P0.x - C0.x, y: P0.y - C0.y };
      const a = slamDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const target = { x: H.rimX, y: H.rimY - H.rimR * 0.9 };
      const Ct = { x: target.x - (this.v0.x * c - this.v0.y * s), y: target.y - (this.v0.x * s + this.v0.y * c) };
      const dx = Ct.x - C0.x, dy = Ct.y - C0.y;
      this.dunkAt = now; this.slamAt = now + D * SLAM;
      return {
        jump: true, duration: D, easing: 'linear', curtainIn: D * 0.74,
        keyframes: (x, fall) => [
          { transform: `translateX(${x}px) translateY(0px) rotate(0deg)`, easing: 'cubic-bezier(.2,.75,.35,1)' },
          { offset: .40, transform: `translateX(${x + dx * 0.82}px) translateY(${dy - 30}px) rotate(-14deg)`, easing: 'cubic-bezier(.55,0,.9,.5)' },
          { offset: SLAM, transform: `translateX(${x + dx}px) translateY(${dy}px) rotate(${slamDeg}deg)`, easing: 'ease-out' },
          { offset: .78, transform: `translateX(${x + dx}px) translateY(${dy + 6}px) rotate(${slamDeg + 4}deg)`, easing: 'cubic-bezier(.5,0,1,.6)' },
          { offset: 1, transform: `translateX(${x + dx + 30}px) translateY(${fall}px) rotate(48deg)` }
        ]
      };
    }
  }

  /* ---------------- football: run up, kick, top corner, celebrate with a backflip ---------------- */
  class Goal {
    constructor() { this.mode = 'mink'; this.kickAt = 0; this.goalAt = 0; this.from = null; this.confetti = null; }
    goal(G) {
      const h = G.mh * 0.95, w = Math.max(38, G.mw * 0.36);
      return { x: Math.min(G.pR - w * 0.15, G.W - 36 - w * 1.35), w, h };
    }
    frame(now, d, G) {
      const g = G.g, Q = this.goal(G), r = Math.max(7, G.mw * 0.058);
      const top = G.pTop - Q.h, back = Q.x + Q.w;
      const bulge = this.goalAt ? Math.sin(Math.PI * clamp01((now - this.goalAt) / 380)) * Q.w * 0.35 : 0;
      // goal: back of the net, mesh, then the frame on top
      g.save(); g.strokeStyle = WHITE; g.lineCap = 'round'; g.lineJoin = 'round'; glow(g);
      g.globalAlpha = .55; g.lineWidth = 1;
      const netBack = (t) => ({ x: back + bulge * Math.sin(Math.PI * t), y: lerp(top + Q.h * 0.12, G.pTop, t) });
      for (let i = 0; i <= 6; i++) {                       // verticals from the crossbar to the back
        const t = i / 6, a = { x: Q.x + Q.w * t, y: top + Q.h * 0.12 * t };
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + bulge * t * 0.6, G.pTop); g.stroke();
      }
      for (let i = 1; i <= 5; i++) {                       // horizontals
        const t = i / 6; const p = netBack(t);
        g.beginPath(); g.moveTo(Q.x, lerp(top, G.pTop, t)); g.quadraticCurveTo((Q.x + p.x) / 2 + bulge * .3, lerp(top, G.pTop, t), p.x, p.y); g.stroke();
      }
      g.globalAlpha = 1; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(Q.x, G.pTop); g.lineTo(Q.x, top); g.lineTo(back, top + Q.h * 0.12); g.lineTo(back + bulge, G.pTop); g.stroke();
      g.restore();

      // ball waits at 62% of the platform; the mink kicks it on arrival
      const restX = lerp(G.pL, G.pR, 0.62), front = G.mx + G.mw * 0.9;
      if (!this.kickAt && front >= restX - r) { this.kickAt = now; this.goalAt = now + 300; this.from = { x: restX, y: G.pTop - r }; }
      let bx = restX, by = G.pTop - r, spin = 0;
      if (this.kickAt && now < this.goalAt) {
        const u = (now - this.kickAt) / 300, tx = Q.x + Q.w * 0.7, ty = top + Q.h * 0.3;
        bx = lerp(this.from.x, tx, easeOut(u)); by = lerp(this.from.y, ty, u) - Math.sin(Math.PI * u) * G.mh * 0.25; spin = u * 12;
        g.save(); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.2;     // speed lines
        for (const dy of [-r * .5, 0, r * .5]) { g.beginPath(); g.moveTo(bx - r * 1.4, by + dy); g.lineTo(bx - r * 3.4, by + dy + 2); g.stroke(); }
        g.restore();
      } else if (this.goalAt && now >= this.goalAt) {
        const u = clamp01((now - this.goalAt) / 420);
        bx = Q.x + Q.w * 0.7 + bulge * 0.8; by = lerp(top + Q.h * 0.3, G.pTop - r, u * u); spin = 12;
      }
      this.ball(g, bx, by, r, spin);
      // confetti from the goal
      if (this.goalAt && now >= this.goalAt) {
        if (!this.confetti) {
          const cols = ['#a78bfa', '#ffffff', '#fb923c', '#5eead4'];
          this.confetti = Array.from({ length: 28 }, (_, i) => ({
            x: Q.x + Q.w * 0.5, y: top + Q.h * 0.2, vx: (Math.random() - 0.65) * 0.32, vy: -0.25 - Math.random() * 0.3,
            rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02, c: cols[i % 4], s: 3 + Math.random() * 3 }));
        }
        const age = now - this.goalAt;
        g.save();
        for (const c of this.confetti) {
          const px = c.x + c.vx * age, py = c.y + c.vy * age + 0.0005 * age * age;
          g.globalAlpha = Math.max(0, 1 - age / 1100);
          g.save(); g.translate(px, py); g.rotate(c.rot + c.vr * age); g.fillStyle = c.c; g.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); g.restore();
        }
        g.restore();
      }
      const k = this.kickAt ? Math.sin(Math.PI * clamp01((now - this.kickAt + 60) / 200)) : 0;
      return { kick: Math.max(0, k) };
    }
    ball(g, x, y, r, spin) {
      g.save(); g.translate(x, y); g.rotate(spin);
      g.strokeStyle = WHITE; glow(g);
      shape(g, P => P.arc(0, 0, r, 0, Math.PI * 2), 2.2);
      g.fillStyle = WHITE;                                 // classic patches
      const pent = (cx, cy, s) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.closePath(); g.fill(); };
      pent(0, 0, r * 0.32);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; pent(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.18); }
      g.restore();
    }
    // celebrate: a backflip on the spot, tucked in the air, landing on all fours
    finale(now, G) {
      const delay = Math.max(0, (this.goalAt || now) + 60 - now), D = 720, H = G.mh * 1.15;
      const flipAt = now + delay;
      return {
        jump: true, delay, duration: D, easing: 'linear', curtainIn: delay + D * 0.92,
        pose: (t) => {
          const u = (t - flipAt) / D;
          if (u < 0) return { p: 0.5, leap: 0 };                 // stands for a beat after the goal
          if (u > 0.12 && u < 0.88) return { p: 0.9, leap: 0 }; // tucked
          return { p: u < 0.5 ? 0.42 : 0.55, leap: 0 };
        },
        keyframes: (x) => [
          { transform: `translateX(${x}px) translateY(0px) rotate(0deg)`, easing: 'cubic-bezier(.2,.7,.4,1)' },
          { offset: .5, transform: `translateX(${x + 10}px) translateY(${-H}px) rotate(-180deg)`, easing: 'cubic-bezier(.6,0,.8,.4)' },
          { offset: 1, transform: `translateX(${x + 20}px) translateY(0px) rotate(-360deg)` }
        ]
      };
    }
  }

  /* ---------------- race: the mink drives a race car past the chequered flag ---------------- */
  class Race {
    constructor() { this.mode = 'car'; this.exitAt = 0; this.extra = 0; this.last = 0; }
    frame(now, d, G) {
      const g = G.g, W = G.mw * 1.15, wheelR = W * 0.1;
      const dt = this.last ? Math.min(48, now - this.last) : 16; this.last = now;
      if (this.exitAt) this.extra += dt * (G.pR - G.pL) / 260;      // floors it after the line
      const x = lerp(G.pL - W * 0.6, G.pR - W * 0.15, d) + this.extra;
      const y = G.pTop - wheelR;                                   // wheel centres

      // finish line and chequered flag at the end of the platform
      g.save();
      const sq = 4, fx = G.pR - 2;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
        g.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.15)';
        g.fillRect(fx - sq * 2 + i * sq, G.pTop - 1 + (j - 1) * 0, sq, 3);
      }
      g.strokeStyle = WHITE; g.lineWidth = 2.2; glow(g);
      const poleTop = G.pTop - G.mh * 1.05;
      g.beginPath(); g.moveTo(fx + 10, G.pTop); g.lineTo(fx + 10, poleTop); g.stroke();
      const wave = this.exitAt ? 1 : 0.35, fw = Math.max(26, G.mw * 0.2), fh = fw * 0.65, cells = 4, rows = 3;
      for (let i = 0; i < cells; i++) for (let j = 0; j < rows; j++) {
        const px = (u) => fx + 10 + u * fw, py = (u, v) => poleTop + v * fh + Math.sin(now / 70 + u * 5) * 3 * wave * u;
        const u0 = i / cells, u1 = (i + 1) / cells, v0 = j / rows, v1 = (j + 1) / rows;
        g.beginPath(); g.moveTo(px(u0), py(u0, v0)); g.lineTo(px(u1), py(u1, v0)); g.lineTo(px(u1), py(u1, v1)); g.lineTo(px(u0), py(u0, v1)); g.closePath();
        if ((i + j) % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.95)'; g.fill(); }
        g.lineWidth = .8; g.stroke();
      }
      g.restore();

      // speed lines behind the car
      g.save(); g.strokeStyle = 'rgba(167,139,250,.6)'; g.lineCap = 'round'; g.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const ly = y - wheelR * 0.4 - i * wheelR * 0.55, len = W * (0.35 + 0.15 * ((i * 37 + Math.floor(now / 60)) % 3));
        g.beginPath(); g.moveTo(x - W * 0.62, ly); g.lineTo(x - W * 0.62 - len, ly); g.stroke();
      }
      g.restore();
      this.car(g, x, y, W, wheelR, now);
      return { kick: 0 };
    }
    car(g, x, y, W, wr, now) {
      const s = W / 150;
      g.save(); g.translate(x, y); g.scale(s, s);
      g.strokeStyle = WHITE; g.lineCap = 'round'; g.lineJoin = 'round'; glow(g);
      const bounce = Math.sin(now / 45) * 0.8;
      g.translate(0, bounce);
      // rear wing
      shape(g, P => { P.moveTo(-70, -30); P.lineTo(-52, -30); P.lineTo(-52, -25); P.lineTo(-70, -25); P.closePath(); }, 2);
      g.lineWidth = 2; g.beginPath(); g.moveTo(-60, -25); g.lineTo(-56, -10); g.stroke();
      // body: low wedge from the engine cover to the nose
      shape(g, P => {
        P.moveTo(-66, -4); P.bezierCurveTo(-64, -18, -40, -22, -22, -20);
        P.lineTo(-6, -24); P.bezierCurveTo(4, -24, 10, -18, 18, -14);
        P.bezierCurveTo(40, -11, 62, -8, 78, -3); P.lineTo(78, 2); P.lineTo(-62, 4); P.closePath();
      }, 2.3);
      // front wing and side pod line
      g.lineWidth = 2; g.beginPath(); g.moveTo(66, 4); g.lineTo(84, 4); g.stroke();
      g.lineWidth = 1; g.globalAlpha = .6; g.beginPath(); g.moveTo(-40, -6); g.quadraticCurveTo(0, -10, 40, -6); g.stroke(); g.globalAlpha = 1;
      // driver: the mink in a helmet with its ears sticking out
      shape(g, P => { P.arc(2, -30, 11, 0, Math.PI * 2); }, 2);
      shape(g, P => { P.moveTo(-6, -38); P.quadraticCurveTo(-8, -46, -2, -42); P.closePath(); }, 1.6);
      shape(g, P => { P.moveTo(3, -41); P.quadraticCurveTo(4, -49, 9, -42); P.closePath(); }, 1.6);
      shape(g, P => { P.moveTo(4, -34); P.quadraticCurveTo(14, -35, 13, -28); P.quadraticCurveTo(8, -26, 4, -28); P.closePath(); }, 1.4);  // visor
      shape(g, P => { P.moveTo(12, -27); P.quadraticCurveTo(20, -26, 21, -23); P.quadraticCurveTo(16, -21, 11, -23); P.closePath(); }, 1.4); // snout
      g.fillStyle = WHITE; g.beginPath(); g.arc(21, -23.5, 1.4, 0, Math.PI * 2); g.fill();
      // number roundel
      g.lineWidth = 1.2; g.beginPath(); g.arc(-34, -10, 6, 0, Math.PI * 2); g.stroke();
      g.font = '700 8px Heebo, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', -34, -9.5);
      // wheels with spinning spokes
      for (const wx of [-46, 52]) {
        const R = wr / s;
        shape(g, P => P.arc(wx, 0, R, 0, Math.PI * 2), 2.6);
        g.lineWidth = 1.2; g.beginPath(); g.arc(wx, 0, R * 0.45, 0, Math.PI * 2); g.stroke();
        const a = now / 25;
        for (let k = 0; k < 3; k++) { const t = a + k * 2 * Math.PI / 3; g.beginPath(); g.moveTo(wx + Math.cos(t) * R * .45, Math.sin(t) * R * .45); g.lineTo(wx + Math.cos(t) * R * .85, Math.sin(t) * R * .85); g.stroke(); }
      }
      g.restore();
    }
    finale(now) { this.exitAt = now; return { jump: false, curtainIn: 260 }; }
  }

  /* ---------------- drone chase (existing DroneChase, own loop) ---------------- */
  class Chase {
    constructor(intro, runner, plat) { this.mode = 'mink'; this.c = new DroneChase(intro.querySelector('.fm-fx'), intro, runner, plat, [150, 340, 525]); this.own = true; }
    frame() { return { kick: 0 }; }
    finale() { this.c.escape(); return { jump: true, curtainIn: 140 }; }
  }

  window.FMScenes = {
    names: ['chase', 'hoops', 'goal', 'race'],
    make(name, intro, runner, plat) {
      if (name === 'chase') return new Chase(intro, runner, plat);
      if (name === 'hoops') return new Hoops();
      if (name === 'goal') return new Goal();
      return new Race();
    }
  };
})();
