/*
  MinkRig — a white line-art mink on <canvas>, running a rotary (cheetah-style) gallop.

  Footfall order in one stride, p in [0,1) (four beats, two airborne moments):
    0.00  far hind lands        0.08  near hind lands      (hind stance until ~0.36)
    0.36–0.48  extended flight: back straight, front legs reach, hind legs trail
    0.48  far fore lands        0.55  near fore lands      (fore stance until ~0.80)
    0.80–1.00  gathered flight: back arched, all four legs folded under the belly
  A paw on the ground stays put while the body passes over it, then lifts, folds and
  swings forward. Joints are solved from the paw position: elbows bend back, hind knees
  bend forward with the hock behind. The head stays level, as a cheetah's does.

  draw(p, leap, kick) — leap 0..1 blends into the logo's flying pose with wings open;
  kick 0..1 swings the near front paw forward and up (the goal scene).
*/
class MinkRig {
  constructor(canvas) {
    this.cv = canvas;
    this.W = 340; this.H = 170;            // logical drawing size
    this.off = document.createElement('canvas');
    this.resize();
  }
  resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    for (const c of [this.cv, this.off]) { c.width = this.W * dpr; c.height = this.H * dpr; }
    this.dpr = dpr;
  }

  // ---------- geometry helpers ----------
  static polar(o, len, deg) {           // deg: 0 = straight down, + = toward the head
    const r = deg * Math.PI / 180;
    return { x: o.x + Math.sin(r) * len, y: o.y + Math.cos(r) * len };
  }
  // two-bone IK: joint between root R and target T; bendBack puts the joint behind the line
  static ik(R, T, a, b, bendBack) {
    let dx = T.x - R.x, dy = T.y - R.y;
    let d = Math.hypot(dx, dy);
    const dmax = a + b - 0.5, dmin = Math.abs(a - b) + 0.5;
    if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
    if (d < dmin) { dx *= dmin / d; dy *= dmin / d; d = dmin; }
    const base = Math.atan2(dy, dx);
    const al = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d))));
    const j1 = { x: R.x + a * Math.cos(base + al), y: R.y + a * Math.sin(base + al) };
    const j2 = { x: R.x + a * Math.cos(base - al), y: R.y + a * Math.sin(base - al) };
    const joint = bendBack ? (j1.x < j2.x ? j1 : j2) : (j1.x > j2.x ? j1 : j2);
    return { joint, end: { x: R.x + dx, y: R.y + dy } };
  }

  pose(p, leap, kick = 0) {
    const TAU = Math.PI * 2, c = Math.cos, s = Math.sin;
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => t * t * (3 - 2 * t);
    const E = 0.5 + 0.5 * c(TAU * (p - 0.42));               // 1 = stretched, 0 = arched
    const bob = -5 * c(2 * TAU * (p - 0.42));                 // high in both airborne moments
    const ext = lerp(E, 1, leap);

    const cx = 168, len = lerp(116 * (0.80 + 0.20 * ext), 128, leap);
    const y0 = lerp(84 + bob, 70, leap);
    const pitch = lerp(3 * s(TAU * (p - 0.42)), -6, leap) * Math.PI / 180;
    const hip = { x: cx - len / 2 * c(pitch), y: y0 + len / 2 * s(pitch) };
    const sho = { x: cx + len / 2 * c(pitch), y: y0 - len / 2 * s(pitch) };
    const arch = (1 - ext) * 24;

    const G = 150;                       // ground line
    const STRIDE = 211;                  // logical units the body covers per stride
    // paw (toe) path relative to the leg root: planted during stance, folded arc in swing
    const paw = (root, start, duty, centre, lift) => {
      const u = ((p - start) % 1 + 1) % 1;
      const A = duty * STRIDE / 2;
      if (u < duty) {                                        // stance: body passes over the paw
        const k = u / duty;
        return { x: root.x + centre + A - 2 * A * k, y: G, fold: 0 };
      }
      const k = (u - duty) / (1 - duty);                     // swing: lift, fold, reach
      return { x: root.x + centre - A + 2 * A * smooth(k), y: G - lift * Math.pow(s(Math.PI * k), 0.8),
               fold: s(Math.PI * Math.min(1, k * 1.15)) };
    };
    const fRoot = { x: sho.x - 4, y: sho.y + 12 };
    const hRoot = { x: hip.x + 6, y: hip.y + 8 };
    const front = (start, near) => {
      const t = paw(fRoot, start, 0.25, 10, 20);
      let toe = { x: t.x, y: t.y };
      let ang = lerp(18, -125, t.fold);                      // paw flips back as it folds
      // leap: reach forward like the logo
      toe = { x: lerp(toe.x, fRoot.x + 40, leap), y: lerp(toe.y, fRoot.y + 38, leap) };
      ang = lerp(ang, 70, leap);
      if (near && kick) {
        toe = { x: lerp(toe.x, fRoot.x + 46, kick), y: lerp(toe.y, fRoot.y + 22, kick) };
        ang = lerp(ang, 85, kick);
      }
      const wrist = MinkRig.polar(toe, -9, ang);
      const { joint } = MinkRig.ik(fRoot, wrist, 23, 24, true);
      return { root: fRoot, elbow: joint, wrist, toe };
    };
    const hind = (start) => {
      const t = paw(hRoot, start, 0.28, -4, 20);
      let toe = { x: t.x, y: t.y };
      let ang = lerp(28, -35, t.fold);
      toe = { x: lerp(toe.x, hRoot.x - 54, leap), y: lerp(toe.y, hRoot.y + 28, leap) };
      ang = lerp(ang, -75, leap);
      const hock = MinkRig.polar(toe, -14, ang);
      const { joint } = MinkRig.ik(hRoot, hock, 21, 23, false);
      return { root: hRoot, knee: joint, hock, toe };
    };
    return {
      E: ext, hip, sho, arch, pitch,
      fFar: front(0.48, false), fNear: front(0.55, true),
      hFar: hind(0.00), hNear: hind(0.08),
      wing: lerp(6 + 7 * ext, 18, leap)                       // wing lift in degrees
    };
  }

  draw(p, leap = 0, kick = 0) {
    const g = this.off.getContext('2d');
    const d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, this.W, this.H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const P = this.pose(p, leap, kick);
    const LW = 2.1;                                           // outline weight
    const W = '#ffffff';

    const knock = (fn) => { g.globalCompositeOperation = 'destination-out'; fn(); g.globalCompositeOperation = 'source-over'; };
    const strokePath = (path, w, color = W) => { g.strokeStyle = color; g.lineWidth = w; g.stroke(path); };
    const fillPath = (path, color = W) => { g.fillStyle = color; g.fill(path); };

    // a limb drawn as an outlined tube with a paw at the end
    const tube = (pts, w, alpha = 1) => {
      const path = new Path2D();
      path.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
      g.globalAlpha = alpha;
      strokePath(path, w + LW * 2);
      g.globalAlpha = 1;
      knock(() => strokePath(path, w));
    };
    const frontLeg = (L, side) => {
      tube([L.root, L.elbow, L.wrist, L.toe], 8.5, side === 'far' ? 0.55 : 1);
    };
    const hindLeg = (L, side) => {
      tube([L.root, L.knee, L.hock, L.toe], 9.5, side === 'far' ? 0.55 : 1);
    };

    // far legs first: the body is knocked out over them
    frontLeg(P.fFar, 'far');
    hindLeg(P.hFar, 'far');

    // body: long weasel torso between hip and shoulder, back arches when gathered
    const body = new Path2D();
    {
      const { hip, sho, arch } = P;
      const mid = { x: (hip.x + sho.x) / 2, y: (hip.y + sho.y) / 2 };
      body.moveTo(hip.x - 22, hip.y + 4);                                 // rump
      body.bezierCurveTo(hip.x - 24, hip.y - 20, hip.x - 2, hip.y - 22, hip.x + 10, hip.y - 20);
      body.quadraticCurveTo(mid.x, mid.y - 22 - arch, sho.x - 8, sho.y - 18);  // back line
      body.bezierCurveTo(sho.x + 10, sho.y - 22, sho.x + 24, sho.y - 10, sho.x + 20, sho.y + 6);  // shoulder/chest
      body.bezierCurveTo(sho.x + 16, sho.y + 20, sho.x - 4, sho.y + 22, sho.x - 14, sho.y + 18);
      body.quadraticCurveTo(mid.x, mid.y + 16 - arch * 0.9, hip.x + 12, hip.y + 18); // belly
      body.bezierCurveTo(hip.x - 4, hip.y + 22, hip.x - 20, hip.y + 18, hip.x - 22, hip.y + 4);
      body.closePath();
    }
    knock(() => fillPath(body));
    strokePath(body, LW);
    // fur/muscle hints
    {
      const { hip, sho, arch } = P;
      const mid = { x: (hip.x + sho.x) / 2, y: (hip.y + sho.y) / 2 };
      const a = new Path2D(); a.moveTo(hip.x + 8, hip.y + 2); a.quadraticCurveTo(mid.x, mid.y - 4 - arch * .8, sho.x - 10, sho.y + 2);
      const b = new Path2D(); b.moveTo(hip.x - 12, hip.y - 6); b.quadraticCurveTo(hip.x, hip.y + 4, hip.x + 4, hip.y + 14);
      g.globalAlpha = .45; strokePath(a, 1); strokePath(b, 1); g.globalAlpha = 1;
    }

    // wings: folded along the back, opening in the leap
    const wing = (lift, side) => {
      const root = { x: P.sho.x - 6, y: P.sho.y - 17 };
      const far = side === 'far';
      const feathers = 5;
      for (let i = feathers - 1; i >= 0; i--) {             // longest (primaries) underneath
        const ang = (lift + i * (3.2 + lift * 0.28)) * Math.PI / 180;  // above horizontal, pointing back
        const len = 112 - i * 15;
        const w = 15 - i * 1.6;
        const ux = -Math.cos(ang), uy = -Math.sin(ang);       // along the feather
        const nx = -uy, ny = ux;                              // across it
        const tip = { x: root.x + ux * len, y: root.y + uy * len };
        const m1 = { x: root.x + ux * len * .55 + nx * w, y: root.y + uy * len * .55 + ny * w };
        const m2 = { x: root.x + ux * len * .5 - nx * w * .35, y: root.y + uy * len * .5 - ny * w * .35 };
        const f = new Path2D();
        f.moveTo(root.x, root.y);
        f.quadraticCurveTo(m1.x, m1.y, tip.x, tip.y);
        f.quadraticCurveTo(m2.x, m2.y, root.x + nx * 2, root.y + ny * 2);
        f.closePath();
        knock(() => fillPath(f));
        g.globalAlpha = far ? .55 : 1;
        strokePath(f, i === 0 ? LW : 1.4);
        const vane = new Path2D();                            // shaft line
        vane.moveTo(root.x + ux * 10, root.y + uy * 10);
        vane.lineTo(root.x + ux * len * .82, root.y + uy * len * .82);
        g.globalAlpha = far ? .3 : .55; strokePath(vane, .8);
        g.globalAlpha = 1;
      }
      // covert: the rounded top of the wing over the shoulder
      const cv = new Path2D();
      cv.moveTo(root.x + 10, root.y + 3);
      cv.bezierCurveTo(root.x - 6, root.y - 14 - lift * .25, root.x - 34, root.y - 10 - lift * .35, root.x - 40, root.y - 2 - lift * .3);
      cv.quadraticCurveTo(root.x - 18, root.y + 6, root.x + 10, root.y + 3);
      knock(() => fillPath(cv));
      g.globalAlpha = far ? .55 : 1; strokePath(cv, LW); g.globalAlpha = 1;
    };
    if (leap > 0.15) wing(P.wing + 10, 'far');

    // head + neck: kept level and steady
    {
      const n = { x: P.sho.x + 14, y: P.sho.y - 10 };
      const hx = n.x + 30, hy = Math.min(n.y - 6, 74 + (P.sho.y - 84) * 0.25);   // damped bob
      const head = new Path2D();
      head.moveTo(n.x - 6, n.y - 10);
      head.bezierCurveTo(hx - 22, hy - 18, hx - 2, hy - 20, hx + 12, hy - 10);   // crown
      head.bezierCurveTo(hx + 22, hy - 6, hx + 30, hy - 2, hx + 31, hy + 2);     // muzzle top
      head.bezierCurveTo(hx + 30, hy + 7, hx + 20, hy + 10, hx + 8, hy + 10);    // chin
      head.bezierCurveTo(hx - 6, hy + 12, n.x + 4, n.y + 14, n.x - 2, n.y + 18); // throat
      knock(() => { const fillP = new Path2D(head); fillP.lineTo(n.x - 14, n.y + 6); fillP.closePath(); fillPath(fillP); });
      strokePath(head, LW);
      // ear
      const ear = new Path2D(); ear.moveTo(hx - 10, hy - 15); ear.bezierCurveTo(hx - 16, hy - 28, hx - 2, hy - 30, hx - 1, hy - 16);
      knock(() => fillPath(ear)); strokePath(ear, LW);
      const earIn = new Path2D(); earIn.moveTo(hx - 8, hy - 16); earIn.quadraticCurveTo(hx - 9, hy - 24, hx - 4, hy - 17);
      strokePath(earIn, 1);
      // eye
      const eye = new Path2D(); eye.ellipse(hx + 8, hy - 4, 3.6, 2.4, -0.2, 0, Math.PI * 2);
      fillPath(eye); knock(() => { const pu = new Path2D(); pu.arc(hx + 9, hy - 4, 1.4, 0, Math.PI * 2); fillPath(pu); });
      // nose + mouth + whiskers
      const nose = new Path2D(); nose.ellipse(hx + 30, hy + 1, 2.6, 2.2, 0, 0, Math.PI * 2); fillPath(nose);
      const mouth = new Path2D(); mouth.moveTo(hx + 28, hy + 5); mouth.quadraticCurveTo(hx + 22, hy + 7, hx + 16, hy + 5); strokePath(mouth, 1);
      g.globalAlpha = .5;
      for (const [dx, dy] of [[14, -2], [16, 3]]) { const w = new Path2D(); w.moveTo(hx + 22, hy + 3); w.lineTo(hx + 22 + dx, hy + 3 + dy); strokePath(w, .8); }
      g.globalAlpha = 1;
    }

    // near legs in front of the body
    hindLeg(P.hNear, 'near');
    frontLeg(P.fNear, 'near');
    wing(P.wing, 'near');

    // present
    const out = this.cv.getContext('2d');
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.clearRect(0, 0, this.cv.width, this.cv.height);
    out.drawImage(this.off, 0, 0);
  }
}
if (typeof window !== 'undefined') window.MinkRig = MinkRig;
