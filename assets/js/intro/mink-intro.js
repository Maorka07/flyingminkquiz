/*
  Mink intro — first visit only (the decision is made inline in _includes/home/loader.html).

  The mink runs left to right across the platform while a drone with a pilot mink fires
  lasers at it; at the end of the platform it jumps down, the screen drops with it and
  the hero video starts.

  Adapts to the visitor's load speed:
    page ready early  → one fast run (~0.65 s)
    still loading     → the mink eases off (never below 35% speed) so the jump lands
                        when the hero video is ready; the run never exceeds ~1.9 s and
                        the jump happens even if the video is still loading.

  Needs: MinkRig (mink-rig.js) and DroneChase (drone-chase.js), loaded before this file.
*/
(function () {
  var intro = document.getElementById('fmIntro');
  if (!intro || !window.MinkRig) { if (intro) intro.remove(); return release(); }
  window.fmIntroStarted = true;

  var track = intro.querySelector('.fm-track');
  var runner = intro.querySelector('.fm-runner');
  var fill = intro.querySelector('.fm-fill');
  var plat = intro.querySelector('.fm-plat');
  var rig = new MinkRig(intro.querySelector('.fm-cv'));
  var chase = window.DroneChase ? new DroneChase(intro.querySelector('.fm-fx'), intro, runner, plat, [150, 340, 525]) : null;

  var RUN_MS = 650;                                  // one pass when the page is already ready
  var SLOW = 0.35;                                   // lowest speed while the page is still loading
  // speed falls from v0 to 70% of v0 over the run: d(t) = (1 - e^(-0.3·v0·t)) / 0.3, d(RUN_MS) = 1
  var v0 = -Math.log(0.7) / (0.3 * RUN_MS);
  var t0 = performance.now(), last = t0;
  var d = 0, x = 0, stride = 0, pace = 1, done = false, raf = 0;

  function pageReady() {
    var v = document.getElementById('heroVid');
    return (v && (v.readyState >= 3 || v.error)) || document.readyState === 'complete';
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

  function finish() {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    d = 1; place(); fill.style.width = '100%';
    if (chase) chase.escape();                       // last bolt misses as the mink jumps
    var leapT0 = performance.now();
    (function leapLoop(now) {                        // blend into the logo's flying pose
      rig.draw((stride + 0.03) % 1, Math.min(1, (now - leapT0) / 200));
      if (intro.isConnected) requestAnimationFrame(leapLoop);
    })(leapT0);
    runner.animate([
      { transform: 'translateX(' + x + 'px) translateY(0) rotate(0deg)' },
      { transform: 'translateX(' + (x + 40) + 'px) translateY(-38px) rotate(-6deg)', offset: .3 },
      { transform: 'translateX(' + (x + 150) + 'px) translateY(' + innerHeight + 'px) rotate(38deg)' }
    ], { duration: 750, easing: 'cubic-bezier(.45,0,.75,.4)', fill: 'forwards' });
    setTimeout(function () {
      release();
      intro.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
        { duration: 560, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
        .onfinish = function () { intro.remove(); };
    }, 140);
  }

  function tick(now) {
    var dt = Math.min(64, now - last); last = now;
    pace += ((pageReady() ? 1 : SLOW) - pace) * (1 - Math.exp(-dt / 150));   // ease between speeds
    var dd = Math.min(1 - d, v0 * (1 - 0.3 * d) * pace * dt);
    d += dd;
    var e = ends();
    stride = (stride + Math.max(dd * (e.to - e.from) / (e.w * 0.62), dt / 900)) % 1;   // paws track the ground
    rig.draw(stride, 0);
    place();
    if (d >= 1) return finish();
    raf = requestAnimationFrame(tick);
  }

  intro.addEventListener('click', finish);
  addEventListener('keydown', function (ev) { if (ev.key === 'Escape') finish(); }, { once: true });
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
