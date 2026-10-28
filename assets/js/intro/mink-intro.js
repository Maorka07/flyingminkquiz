/*
  Mink intro — first visit only (the decision and the random scene pick are made inline
  in _includes/home/loader.html, which loads only the scripts that scene needs).

  Scenes (assets/js/intro/intro-scenes.js):
    chase  a drone with a pilot mink fires lasers; the mink escapes off the platform
    hoops  the mink dribbles the length of the court, flies up and dunks
    goal   the mink kicks the ball into the top corner and celebrates with a backflip
    race   the mink drives a race car past the chequered flag

  Adapts to the visitor's load speed: the run takes ~0.65 s when the page is ready and
  eases down to 35% speed while the hero video is still loading (at most ~1.9 s).
  The scene's ending never waits for loading; the video starts the moment the screen drops.

  Needs: MinkRig (mink-rig.js) and FMScenes (intro-scenes.js); DroneChase for the chase.
*/
(function () {
  var intro = document.getElementById('fmIntro');
  if (!intro || !window.MinkRig || !window.FMScenes) { if (intro) intro.remove(); return release(); }
  window.fmIntroStarted = true;

  var track = intro.querySelector('.fm-track');
  var runner = intro.querySelector('.fm-runner');
  var fill = intro.querySelector('.fm-fill');
  var plat = intro.querySelector('.fm-plat');
  var fx = intro.querySelector('.fm-fx');
  var rig = new MinkRig(intro.querySelector('.fm-cv'));

  var name = window.fmIntroScene;
  if (FMScenes.names.indexOf(name) < 0 || (name === 'chase' && !window.DroneChase)) name = 'hoops';
  var scene = FMScenes.make(name, intro, runner, plat);
  if (scene.mode === 'car') runner.style.visibility = 'hidden';

  var RUN_MS = 650, SLOW = 0.35;
  // speed falls from v0 to 70% of v0 over the run: d(t) = (1 - e^(-0.3·v0·t)) / 0.3, d(RUN_MS) = 1
  var v0 = -Math.log(0.7) / (0.3 * RUN_MS);
  var t0 = performance.now(), last = t0;
  var d = 0, x = 0, stride = 0, pace = 1, kick = 0, done = false, raf = 0;

  function pageReady() {
    var v = document.getElementById('heroVid');
    return (v && (v.readyState >= 3 || v.error)) || document.readyState === 'complete';
  }
  function geo(g) {
    var ir = intro.getBoundingClientRect(), r = runner.getBoundingClientRect(), pr = plat.getBoundingClientRect();
    return { g: g, runner: runner, W: ir.width, H: ir.height, mx: r.left - ir.left, my: r.top - ir.top, mw: r.width, mh: r.height,
             pL: pr.left - ir.left, pR: pr.right - ir.left, pTop: pr.top - ir.top };
  }
  function ends() {
    var w = runner.clientWidth, tw = track.clientWidth;
    return { from: -0.35 * w, to: tw - 0.78 * w, w: w, tw: tw };
  }
  function place() {
    var e = ends();
    x = e.from + d * (e.to - e.from);
    runner.style.transform = 'translateX(' + x + 'px)';
    fill.style.width = Math.max(0, Math.min(100, (x + 0.8 * e.w) / e.tw * 100)).toFixed(1) + '%';
  }

  // one FX loop for the scenes drawn on the shared timeline (the chase runs its own)
  if (!scene.own) {
    var g = fx.getContext('2d');
    var fxLoop = function (now) {
      if (!intro.isConnected) return;
      var dpr = Math.min(3, window.devicePixelRatio || 1), W = intro.clientWidth, H = intro.clientHeight;
      if (fx.width !== Math.round(W * dpr) || fx.height !== Math.round(H * dpr)) { fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      kick = scene.frame(now, d, geo(g)).kick || 0;
      requestAnimationFrame(fxLoop);
    };
    requestAnimationFrame(fxLoop);
  }

  var dropped = false;
  function curtain() {
    if (dropped) return; dropped = true;
    release();
    intro.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
      { duration: 560, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
      .onfinish = function () { intro.remove(); };
  }

  function finish() {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    d = 1; place(); fill.style.width = '100%';
    var fin = scene.finale(performance.now(), geo(fx.getContext('2d')));
    if (!fin.jump) { setTimeout(curtain, fin.curtainIn); return; }
    var leapT0 = performance.now();
    (function leapLoop(now) {                        // the scene's pose, or the logo's flying pose
      var pz = fin.pose ? fin.pose(now) : { p: (stride + 0.03) % 1, leap: Math.min(1, (now - leapT0) / 200) };
      rig.draw(pz.p, pz.leap, pz.kick || 0);
      if (intro.isConnected) requestAnimationFrame(leapLoop);
    })(leapT0);
    var fall = innerHeight;
    var path = fin.keyframes ? fin.keyframes(x, fall) : [
      { transform: 'translateX(' + x + 'px) translateY(0) rotate(0deg)' },
      { transform: 'translateX(' + (x + 40) + 'px) translateY(-38px) rotate(-6deg)', offset: .3 },
      { transform: 'translateX(' + (x + 150) + 'px) translateY(' + fall + 'px) rotate(38deg)' }
    ];
    runner.animate(path, { duration: fin.duration || 750, delay: fin.delay || 0,
      easing: fin.easing || 'cubic-bezier(.45,0,.75,.4)', fill: 'forwards' });
    setTimeout(curtain, fin.curtainIn);
  }

  function tick(now) {
    var dt = Math.min(64, now - last); last = now;
    pace += ((pageReady() ? 1 : SLOW) - pace) * (1 - Math.exp(-dt / 150));   // ease between speeds
    var dd = Math.min(1 - d, v0 * (1 - 0.3 * d) * pace * dt);
    d += dd;
    var e = ends();
    stride = (stride + Math.max(dd * (e.to - e.from) / (e.w * 0.62), dt / 900)) % 1;   // paws track the ground
    rig.draw(stride, 0, kick);
    place();
    if (d >= 1) return finish();
    raf = requestAnimationFrame(tick);
  }

  intro.addEventListener('click', function () { if (!done) finish(); else curtain(); });
  addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (!done) finish(); else curtain(); } });
  place(); rig.draw(0, 0);
  raf = requestAnimationFrame(tick);

  // hand the page back: unlock scrolling and let the hero video play
  function release() {
    if (!window.fmIntroActive) return;
    window.fmIntroActive = false;
    document.documentElement.classList.remove('fm-intro-lock');
    window.dispatchEvent(new Event('fm:intro-done'));
  }
})();
