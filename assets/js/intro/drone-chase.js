/*
  DroneChase — a white line-art quadcopter that flies above the mink and fires laser
  bolts at it. Every bolt lands just behind the mink's paws; the mink escapes by
  jumping off the platform and the drone pulls up and away.

  const chase = new DroneChase(fxCanvas, intro, runner, platform);
  chase.escape()   — call when the mink jumps
  The loop stops by itself when the intro leaves the page.
*/
class DroneChase {
  constructor(cv, intro, runner, plat, shotsMs = [150, 340, 525]) {
    this.cv = cv; this.intro = intro; this.runner = runner; this.plat = plat;
    this.g = cv.getContext('2d');
    this.t0 = performance.now(); this.last = this.t0;
    this.shotsMs = shotsMs.slice(); this.beams = []; this.sparks = []; this.scorch = [];
    this.drone = null; this.escaping = 0;
    requestAnimationFrame((n) => this.frame(n));
  }
  escape() { this.escaping = performance.now(); this.fire(true); }

  geo() {
    const ir = this.intro.getBoundingClientRect();
    const r = this.runner.getBoundingClientRect(), p = this.plat.getBoundingClientRect();
    return { ir, mx: r.left - ir.left, mw: r.width, my: r.top - ir.top, mh: r.height, pTop: p.top - ir.top };
  }
  fire(miss = false) {
    if (!this.drone) return;
    const G = this.geo();
    const tx = G.mx + G.mw * (miss ? 0.55 : 0.12) - 14;      // just behind the hind paws
    const from = { x: this.drone.x + 12, y: this.drone.y + 15 };
    this.beams.push({ from, to: { x: tx, y: G.pTop }, t: performance.now() });
    this.scorch.push({ x: tx, y: G.pTop, t: performance.now() });
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = (0.12 + Math.random() * 0.22) / 1.25;
      this.sparks.push({ x: tx, y: G.pTop, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: performance.now(), life: (260 + Math.random() * 160) * 1.25 });
    }
  }

  frame(now) {
    if (!this.intro.isConnected) return;
    const dt = Math.min(48, now - this.last); this.last = now;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = this.intro.clientWidth, H = this.intro.clientHeight;
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) {
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    }
    const g = this.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const G = this.geo();

    // drone follows above and a little behind the mink; enters from the left
    const size = Math.max(80, G.mw * 0.66);
    let tx = G.mx + G.mw * 0.12, ty = G.pTop - G.mh * 0.9 - size * 0.42;
    if (this.escaping) { const k = (now - this.escaping) / 625; tx += 260 * k; ty -= 180 * k * k + 40 * k; }
    if (!this.drone) this.drone = { x: tx - 220, y: ty - 30, vx: 0 };
    const f = 1 - Math.exp(-dt / (this.escaping ? 60 : 70));
    const px = this.drone.x;
    this.drone.x += (tx - this.drone.x) * f;
    this.drone.y += (ty + Math.sin(now / 90) * 2.5 - this.drone.y) * f;
    this.drone.vx = (this.drone.x - px) / Math.max(1, dt);

    // scheduled shots
    const el = now - this.t0;
    while (this.shotsMs.length && el >= this.shotsMs[0]) { this.shotsMs.shift(); this.fire(); }

    // scorch marks on the platform
    for (const s of this.scorch) {
      const a = Math.max(0, 1 - (now - s.t) / 875);
      if (!a) continue;
      const rg = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 14);
      rg.addColorStop(0, `rgba(255,120,170,${0.9 * a})`); rg.addColorStop(1, 'rgba(255,60,120,0)');
      g.fillStyle = rg; g.fillRect(s.x - 14, s.y - 14, 28, 28);
    }
    // beams: a short bright pulse with a soft glow
    for (const b of this.beams) {
      const a = Math.max(0, 1 - (now - b.t) / 140);
      if (!a) continue;
      g.lineCap = 'round';
      for (const [w, c] of [[9, `rgba(255,50,120,${0.22 * a})`], [4, `rgba(255,80,150,${0.75 * a})`], [1.4, `rgba(255,255,255,${a})`]]) {
        g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(b.from.x, b.from.y); g.lineTo(b.to.x, b.to.y); g.stroke();
      }
    }
    // sparks
    for (const s of this.sparks) {
      const age = now - s.t; if (age > s.life) continue;
      const a = 1 - age / s.life;
      const x = s.x + s.vx * age, y = s.y + s.vy * age + 0.00038 * age * age;
      g.strokeStyle = `rgba(255,${180 + 60 * a | 0},${200 * a | 0},${a})`; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - s.vx * 18, y - s.vy * 18); g.stroke();
    }
    this.sparks = this.sparks.filter((s) => now - s.t < s.life);

    this.drawDrone(g, this.drone.x, this.drone.y, size, Math.max(-14, Math.min(4, -this.drone.vx * 9)), now);
    requestAnimationFrame((n) => this.frame(n));
  }

  // side-view quadcopter in white outline, nose to the right
  drawDrone(g, cx, cy, size, tiltDeg, now) {
    const s = size / 120;
    g.save(); g.translate(cx, cy); g.rotate(tiltDeg * Math.PI / 180); g.scale(s, s);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff';
    g.shadowColor = 'rgba(167,139,250,.55)'; g.shadowBlur = 8;
    // arms
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(-14, 2); g.lineTo(-46, -6); g.moveTo(14, 2); g.lineTo(46, -6); g.stroke();
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-12, 7); g.lineTo(-38, 4); g.moveTo(12, 7); g.lineTo(38, 4); g.stroke();
    // motors
    for (const mx of [-48, 48]) { g.beginPath(); g.roundRect(mx - 5, -14, 10, 11, 2.5); g.stroke(); }
    // spinning props: a blade whose apparent length changes as it turns
    for (const [mx, ph] of [[-48, 0], [48, 1.7]]) {
      const k = Math.abs(Math.cos(now / 22 + ph));
      g.lineWidth = 2; g.beginPath(); g.moveTo(mx - 24 * k, -16); g.lineTo(mx + 24 * k, -16); g.stroke();
      g.globalAlpha = .35; g.lineWidth = 1;
      g.beginPath(); g.ellipse(mx, -16, 25, 3, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
    // body shell
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-22, 0); g.bezierCurveTo(-20, -9, 18, -11, 26, -3); g.bezierCurveTo(30, 2, 26, 9, 18, 10);
    g.lineTo(-16, 10); g.bezierCurveTo(-22, 9, -24, 4, -22, 0); g.closePath(); g.stroke();
    g.lineWidth = 1; g.globalAlpha = .5; g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(4, -6, 20, -2); g.stroke(); g.globalAlpha = 1;
    // gimbal + lens (the laser port)
    g.lineWidth = 1.8; g.beginPath(); g.moveTo(10, 10); g.lineTo(10, 13); g.stroke();
    g.beginPath(); g.roundRect(4, 13, 14, 9, 3); g.stroke();
    g.shadowBlur = 10; g.shadowColor = 'rgba(255,60,120,.9)';
    g.fillStyle = `rgba(255,70,140,${0.65 + 0.35 * Math.abs(Math.sin(now / 60))})`;
    g.beginPath(); g.arc(14, 17.5, 2.6, 0, Math.PI * 2); g.fill();
    // status LED
    g.fillStyle = '#ff5577'; g.beginPath(); g.arc(-18, 3, 1.5, 0, Math.PI * 2); g.fill();
    this.drawPilot(g, now);
    g.restore();
  }

  // the pilot mink from the album: aviator helmet, goggles, a seat and a remote — facing forward
  drawPilot(g, now) {
    const shape = (build, lw = 2) => {             // knock out what is behind, then outline
      const P = new Path2D(); build(P);
      g.save(); g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.fill(P); g.restore();
      g.lineWidth = lw; g.stroke(P);
    };
    const bob = Math.sin(now / 110) * 0.8;
    g.save(); g.translate(0, bob - 4); g.scale(1.25, 1.25);
    g.strokeStyle = '#fff'; g.shadowColor = 'rgba(167,139,250,.55)'; g.shadowBlur = 6;
    // seat
    shape(P => { P.moveTo(-17, -8); P.lineTo(-15, -36); P.quadraticCurveTo(-13, -40, -9, -38); P.lineTo(-9, -10); P.closePath(); }, 1.8);
    // body in a flight jacket
    shape(P => { P.moveTo(-10, -9); P.bezierCurveTo(-12, -24, -8, -34, 0, -35); P.bezierCurveTo(8, -34, 10, -24, 9, -9); P.closePath(); });
    g.lineWidth = .9; g.globalAlpha = .55;
    g.beginPath(); g.moveTo(0, -33); g.lineTo(0, -12); g.moveTo(-6, -28); g.lineTo(-2, -24); g.stroke();   // zip + collar
    g.globalAlpha = 1;
    // head, looking ahead
    shape(P => {
      P.moveTo(-6, -36); P.bezierCurveTo(-9, -46, -3, -53, 5, -52);
      P.bezierCurveTo(11, -51, 14, -47, 19, -44); P.bezierCurveTo(21, -43, 21, -40, 18, -39);   // snout
      P.bezierCurveTo(13, -37, 8, -36, 4, -35); P.closePath();
    });
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(20, -42.5, 1.6, 1.4, 0, 0, Math.PI * 2); g.fill();   // nose
    g.beginPath(); g.ellipse(9, -44.5, 1.4, 1.2, 0, 0, Math.PI * 2); g.fill();                           // eye
    // leather helmet with ear flap
    shape(P => { P.moveTo(-8, -43); P.bezierCurveTo(-8, -55, 6, -58, 11, -48); P.lineTo(4, -47); P.bezierCurveTo(0, -48, -4, -46, -5, -41); P.closePath(); }, 1.8);
    shape(P => { P.moveTo(-5, -41); P.quadraticCurveTo(-8, -36, -4, -34); P.quadraticCurveTo(-1, -37, -2, -41); P.closePath(); }, 1.4);
    // goggles pushed up on the helmet
    for (const gx of [1, 7]) { g.lineWidth = 1.5; g.beginPath(); g.arc(gx, -53, 2.8, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 1; g.beginPath(); g.moveTo(-7, -52); g.lineTo(-2, -53); g.stroke();
    // arms holding the remote, antennas up
    g.lineWidth = 3.2; g.beginPath(); g.moveTo(-2, -30); g.quadraticCurveTo(2, -24, 9, -24); g.stroke();
    shape(P => { P.roundRect(8, -28, 13, 7, 2); }, 1.5);
    g.lineWidth = 1.1; g.beginPath(); g.moveTo(10, -28); g.lineTo(9, -34); g.moveTo(19, -28); g.lineTo(20, -34); g.stroke();
    g.restore();
  }
}
if (typeof window !== 'undefined') window.DroneChase = DroneChase;
