/* Fantóm opery na Zámku – V4 A „Filmový noir“ */
(function () {
  "use strict";
  var d = document, w = window, root = d.documentElement;
  var reduced = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = function () { return w.innerWidth <= 760; };
  var hasG = typeof w.gsap !== "undefined" && typeof w.ScrollTrigger !== "undefined";
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  try { fetch("/count/hit", { cache: "no-store" }).catch(function () {}); } catch (e) {}

  /* ---------- videá: výber kvality + lenivé načítanie ---------- */
  function srcFor(v) { return small() ? (v.dataset.sd || v.dataset.hd) : (v.dataset.hd || v.dataset.sd); }
  function arm(v) { if (!v.dataset.armed && srcFor(v)) { v.src = srcFor(v); v.dataset.armed = "1"; } }
  function play(v) { arm(v); if (reduced) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var hero = $(".hero-video");
  if (hero) { arm(hero); if (!reduced) play(hero); else hero.removeAttribute("autoplay"); }
  var lazy = $$("video[data-hd]").filter(function (v) { return v !== hero && !v.classList.contains("sv"); });
  if ("IntersectionObserver" in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(e.target); else if (e.target.dataset.armed) e.target.pause(); });
    }, { rootMargin: "200px 0px" });
    lazy.forEach(function (v) { io.observe(v); });
  } else lazy.forEach(play);

  /* ---------- rozdelenie textu na slová ---------- */
  function splitWords(el) {
    var frag = d.createDocumentFragment();
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(" ")); return; }
          var o = d.createElement("span"); o.className = "w";
          var i = d.createElement("span"); i.textContent = t; o.appendChild(i); frag.appendChild(o);
        });
      } else if (n.nodeType === 1) {
        if (n.tagName === "BR") { frag.appendChild(n.cloneNode()); return; }
        var c = n.cloneNode(false); c.innerHTML = n.innerHTML; splitWords(c); frag.appendChild(c);
      }
    });
    el.innerHTML = ""; el.appendChild(frag);
  }
  function splitChars(el) {
    var t = el.textContent; el.textContent = "";
    t.split("").forEach(function (ch) {
      var s = d.createElement("span"); s.className = "ch"; s.textContent = ch === " " ? " " : ch; el.appendChild(s);
    });
  }

  /* ---------- formulár záujemcov: rovnaký endpoint a rovnaké polia ako doterajší web (sender) ---------- */
  (function () {
    var f = $("#wlForm"), m = $("#wlMsg"), b = $("#wlBtn"), ok = $("#wlOk"); if (!f) return;
    var t0 = Date.now();
    var ERR = "Odoslanie sa nepodarilo. Skúste to prosím ešte raz, alebo napíšte na william@brandconsulting.sk.";
    function say(t, err) { m.textContent = t; m.className = "msg" + (err ? " err" : ""); }
    function mark(id, bad) { var el = d.getElementById(id); if (el) { el.setAttribute("aria-invalid", bad ? "true" : "false"); if (bad) el.focus(); } }
    function done(dup) {
      f.hidden = true; say("");
      if (ok) {
        $("#wlOkT", ok).textContent = dup ? "Váš kontakt už máme. Dáme vám vedieť, keď ohlásime ďalší termín." : "Ďakujeme. Keď ohlásime ďalší termín, napíšeme vám ako prvým.";
        ok.hidden = false; ok.setAttribute("tabindex", "-1"); ok.focus();
      }
    }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      function v(id) { return (d.getElementById(id).value || "").trim(); }
      var name = v("wlName"), surname = v("wlSurname"), email = v("wlEmail"), phone = v("wlPhone"), hp = (f.querySelector("input[name=website]").value || "").trim();
      ["wlName", "wlSurname", "wlEmail"].forEach(function (id) { mark(id, false); });
      if (name.length < 2) { mark("wlName", true); return say("Prosím, vyplňte meno.", true); }
      if (surname.length < 2) { mark("wlSurname", true); return say("Prosím, vyplňte priezvisko.", true); }
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { mark("wlEmail", true); return say("Prosím, skontrolujte e-mail.", true); }
      if (!d.getElementById("wlConsent").checked) { d.getElementById("wlConsent").focus(); return say("Prosím, potvrďte súhlas.", true); }
      /* ochrana proti robotom bez otravovania: skryté pole + príliš rýchle odoslanie (robot) – tvárime sa, že prešlo */
      if (hp || Date.now() - t0 < 2500) { done(false); return; }
      b.disabled = true; say("Odosielam…");
      fetch("/waitlist/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, surname: surname, phone: phone, email: email, consent: true, consent_text: ((d.querySelector("label.c span")||{}).textContent||"").trim(), consent_ver: f.getAttribute("data-suhlas") || "", source: "web fantomopery.sk", website: hp, lang: "sk" }) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (dd) { if (dd && dd.ok) done(!!dd.dup); else { say(ERR, true); b.disabled = false; } })
        .catch(function () { say(ERR, true); b.disabled = false; });
    });
    var c = $("#copyLink");
    if (c) c.addEventListener("click", function (e) { e.preventDefault(); try { navigator.clipboard.writeText("https://www.fantomopery.sk/"); c.textContent = "Skopírované"; } catch (x) {} });
  })();

  /* ---------- prehrávač Véronique Leroux ---------- */
  (function () {
    var box = $(".pl-screen"); if (!box) return;
    var v = $("#plVideo"), cap = $(".pl-cap span"), bar = $(".pl-bar"), fill = $(".pl-bar i"), time = $(".pl-time");
    var items = $$(".pl-list button"), cur = 0, cues = [];
    var T = w.TITULKY || {};
    function key(src) { return src.split("/").pop().replace(".mp4", ""); }
    function setCues(src) { cues = T[key(src)] || []; }
    setCues(items[0].dataset.src);
    // natívna stopa ostáva pre čítačky obrazovky, zobrazujeme vlastné titulky
    function hideNative() { for (var i = 0; i < v.textTracks.length; i++) v.textTracks[i].mode = "hidden"; }
    v.addEventListener("loadedmetadata", hideNative); hideNative();
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
    var last = null;
    function tick() {
      var t = v.currentTime, txt = "";
      for (var i = 0; i < cues.length; i++) if (t >= cues[i][0] && t <= cues[i][1]) { txt = cues[i][2]; break; }
      if (txt !== last) { cap.textContent = txt; cap.style.display = txt ? "" : "none"; last = txt; }
      box.classList.toggle("show-name", t > 0.6 && t < 4.8);
      if (v.duration) { fill.style.width = (t / v.duration * 100) + "%"; bar.setAttribute("aria-valuenow", Math.round(t / v.duration * 100)); }
      time.textContent = fmt(t);
      if (!v.paused) requestAnimationFrame(tick);
    }
    cap.style.display = "none";
    v.addEventListener("play", function () { box.classList.add("is-playing"); box.classList.remove("is-paused"); requestAnimationFrame(tick); });
    v.addEventListener("pause", function () { box.classList.remove("is-playing"); box.classList.add("is-paused"); tick(); });
    v.addEventListener("seeked", tick);
    v.addEventListener("ended", function () { if (cur < items.length - 1) load(cur + 1, true); });
    function toggle() { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }
    $(".pl-big").addEventListener("click", toggle);
    $(".pl-pp").addEventListener("click", toggle);
    v.addEventListener("click", toggle);
    function seek(e) { var r = bar.getBoundingClientRect(); var x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width; if (v.duration) v.currentTime = Math.max(0, Math.min(1, x)) * v.duration; }
    bar.addEventListener("click", seek);
    bar.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") v.currentTime += 5; if (e.key === "ArrowLeft") v.currentTime -= 5; });
    var cc = $(".pl-cc");
    cc.addEventListener("click", function () { var on = !cc.classList.contains("is-on"); cc.classList.toggle("is-on", on); cc.setAttribute("aria-pressed", on); box.classList.toggle("no-cc", !on); });
    $(".pl-fs").addEventListener("click", function () {
      var el = box;
      if (d.fullscreenElement) d.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    function load(i, autoplay) {
      cur = i; var b = items[i];
      items.forEach(function (x) { x.classList.toggle("is-on", x === b); });
      v.pause();
      $$("track", v).forEach(function (t) { t.remove(); });
      v.src = b.dataset.src; v.poster = b.dataset.poster;
      var tr = d.createElement("track"); tr.kind = "subtitles"; tr.srclang = "sk"; tr.label = "Slovensky"; tr.src = b.dataset.vtt; tr.default = true; v.appendChild(tr);
      setCues(b.dataset.src); last = null; cap.style.display = "none"; fill.style.width = "0";
      v.load();
      if (autoplay) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    }
    items.forEach(function (b, i) { b.addEventListener("click", function () { load(i, true); }); });
    // zvuková vlna z hlasu (podľa V4_C) – analyzátor sa zapne až po prvom prehratí
    var wc = $(".pl-wave", box), wx = wc && wc.getContext("2d"), AC = null, AN = null, AD = null;
    function initAudio() {
      if (AC || !wc || !(w.AudioContext || w.webkitAudioContext)) return;
      try { AC = new (w.AudioContext || w.webkitAudioContext)(); var src = AC.createMediaElementSource(v); AN = AC.createAnalyser(); AN.fftSize = 256; AN.smoothingTimeConstant = .8; src.connect(AN); AN.connect(AC.destination); AD = new Uint8Array(AN.frequencyBinCount); } catch (e) { AC = null; }
    }
    function drawWave() {
      if (!wx) return;
      var W = wc.clientWidth, H = wc.clientHeight, dpr = Math.min(2, w.devicePixelRatio || 1);
      if (wc.width !== Math.round(W * dpr)) { wc.width = Math.round(W * dpr); wc.height = Math.round(H * dpr); }
      wx.setTransform(dpr, 0, 0, dpr, 0, 0); wx.clearRect(0, 0, W, H);
      var n = 64, bw = W / n;
      for (var i = 0; i < n; i++) {
        var val = AD ? AD[Math.floor(i * AD.length / n * .7)] / 255 : 0;
        var bh = Math.max(1, val * H * .9);
        var g = wx.createLinearGradient(0, H - bh, 0, H);
        g.addColorStop(0, "rgba(255,214,150,.9)"); g.addColorStop(1, "rgba(224,38,60,.15)");
        wx.fillStyle = g; wx.fillRect(i * bw + bw * .3, H - bh, bw * .4, bh);
      }
    }
    (function loop() { requestAnimationFrame(loop); if (!v.paused && AN) { AN.getByteFrequencyData(AD); drawWave(); } })();
    v.addEventListener("play", function () { initAudio(); if (AC && AC.state === "suspended") AC.resume(); });
    box.classList.add("is-paused");
  })();

  /* ---------- bez GSAP alebo so zníženým pohybom ---------- */
  function staticStory() {
    var sv = $$(".sv"), sc = $$(".sc"), dots = $$(".story-dots i");
    sv.forEach(function (v, i) { v.classList.toggle("is-on", i === 0); });
    if (sv[0]) arm(sv[0]);
    // bez animácie: ťuk/klik prepína scény
    var i0 = 0;
    $(".story-pin").addEventListener("click", function () {
      i0 = (i0 + 1) % sc.length;
      sc.forEach(function (s, i) { s.classList.toggle("is-on", i === i0); });
      sv.forEach(function (v, i) { v.classList.toggle("is-on", i === i0); if (i === i0) arm(v); });
      dots.forEach(function (x, i) { x.classList.toggle("is-on", i === i0); });
    });
  }
  if (!hasG || reduced) {
    root.classList.add("static");
    $$(".title .ch, .hero-foot, .kicker").forEach(function (e) { e.style.opacity = 1; });
    var st = $(".strip"); if (st) { st.style.overflowX = "auto"; }
    staticStory();
    return;
  }

  /* ---------- GSAP + Lenis ---------- */
  var gsap = w.gsap, ST = w.ScrollTrigger;
  gsap.registerPlugin(ST);
  var lenis = null;
  if (typeof w.Lenis !== "undefined") {
    lenis = new w.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on("scroll", ST.update); w.__lenis = lenis;
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"); if (id.length < 2) return;
      var t = $(id); if (!t) return; e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); } }); else t.scrollIntoView({ behavior: "smooth" });
    });
  });

  // progres a lišta
  gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: d.body, start: "top top", end: "bottom bottom", scrub: 0.3 } });
  ST.create({ start: 80, end: "max", onToggle: function (s) { $(".bar").classList.toggle("is-solid", s.isActive); } });
  /* HERO – úvodné titulky */
  var t1 = $(".title .t1"), t2 = $(".title .t2 em");
  splitChars(t1); splitChars(t2);
  var intro = gsap.timeline({ delay: 0.25 });
  intro.fromTo(".hero-media", { opacity: 0 }, { opacity: 1, duration: 2.4, ease: "power2.out" }, 0)
    .fromTo(".title .t1 .ch", { opacity: 0, yPercent: 40, filter: "blur(18px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 1.6, ease: "expo.out", stagger: 0.09 }, 0.5)
    .fromTo(".title .t2 .ch", { opacity: 0, yPercent: 30, filter: "blur(10px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 1.1, ease: "expo.out", stagger: 0.025 }, 1.2)
    .fromTo(".kicker", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, 0.3)
    .fromTo(".hero-foot", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.3, ease: "power3.out" }, 1.9);
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero-media", { scale: 1.12, ease: "none" }, 0)
    .to(".title", { yPercent: -18, scale: 1.08, opacity: 0, ease: "none" }, 0)
    .to(".hero-foot, .kicker", { opacity: 0, y: -40, ease: "none" }, 0);

  /* odhalenie nadpisov po slovách */
  $$(".split").forEach(function (el) {
    splitWords(el);
    /* bez orezávajúcej masky: overflow:hidden strihalo diakritiku a pri rýchlom scrolle ostala vidno len polovica písmen.
       Slová sa len rozsvietia a mierne zdvihnú, v každom okamihu sú celé. */
    gsap.fromTo($$(".w > span", el), { autoAlpha: 0, y: "0.3em" }, {
      autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.045, clearProps: "transform",
      scrollTrigger: { trigger: el, start: "top 125%", once: true }
    });
  });

  /* VYPREDANÉ – reflektor */
  (function () {
    var bg = $(".sold-bg"); if (!bg) return;
    var pos = { x: 50, y: 50 }, auto = true;
    gsap.fromTo(".sold-bg img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".sold", start: "top bottom", end: "bottom top", scrub: true } });
    $(".sold").addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return; auto = false;
      var r = bg.getBoundingClientRect();
      gsap.to(pos, { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100, duration: 1.1, ease: "power3.out", overwrite: true });
    });
    var t0 = 0;
    gsap.ticker.add(function (time) {
      if (auto) { pos.x = 50 + 28 * Math.sin(time * 0.35); pos.y = 52 + 14 * Math.sin(time * 0.52); }
      bg.style.setProperty("--mx", pos.x + "%"); bg.style.setProperty("--my", pos.y + "%");
    });
    gsap.from(".sold-sub", { opacity: 0, y: 30, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".sold-sub", start: "top 90%" } });
  })();


  /* PRÍBEH – šesť scén */
  (function () {
    var pin = $(".story-pin"); if (!pin) return;
    var sv = $$(".sv"), sc = $$(".sc"), dots = $$(".story-dots i"), n = sc.length, cur = -1;
    function go(i) {
      if (i === cur) return; var prev = cur; cur = i;
      sv.forEach(function (v, k) {
        v.classList.toggle("is-on", k === i);
      });
      dots.forEach(function (x, k) { x.classList.toggle("is-on", k === i); });
      sc.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      var s = sc[i];
      gsap.fromTo($$(".rn, h3, p", s), { opacity: 0, y: prev < i ? 50 : -50, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true });
    }
    sc.forEach(function (s, k) { if (k) s.classList.remove("is-on"); });
    go(0);
    ST.create({
      trigger: pin, start: "top top", end: "+=" + (n * 85) + "%", pin: true, anticipatePin: 1,
      onUpdate: function (s) { go(Math.min(n - 1, Math.floor(s.progress * n * 0.999))); },
      invalidateOnRefresh: true
    });
    gsap.to(".story-head", { opacity: 0, y: -40, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: "+=55%", scrub: true } });
  })();

  /* KAPITOLY – veľké rímske čísla */
  $$(".ch-card").forEach(function (c) {
    var n = $(".ch-n", c); if (!n) return;
    gsap.fromTo(n, { yPercent: -30, opacity: 0 }, { yPercent: -70, opacity: 1, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } });
    var meta = $(".ch-meta", c);
    if (meta) gsap.from(meta, { opacity: 0, y: 30, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: meta, start: "top 90%" } });
  });

  /* I – pás fotografií */
  if ($(".film-frame")) gsap.fromTo(".film-frame", { clipPath: "inset(18% 14% 18% 14%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".film", start: "top 92%", end: "top 30%", scrub: true } });
  (function () {
    var strip = $("#strip"), track = $(".strip-track"); if (!strip) return;
    function dist() { return Math.max(0, track.scrollWidth - w.innerWidth); }
    var tw = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: strip, start: "center center", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$(".fr img").forEach(function (im) {
      gsap.fromTo(im, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: im.parentNode, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
    });
  })();

  /* II – Véronique */
  gsap.fromTo(".player", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".player", start: "top 85%" } });
  $$(".q, .press, .paris").forEach(function (q) {
    gsap.from(q, { opacity: 0, y: 60, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: q, start: "top 88%" } });
  });

  /* III – epilóg */
  gsap.to(".epi-media img", { opacity: 0.5, ease: "none", scrollTrigger: { trigger: ".epi", start: "top 60%", end: "top top", scrub: true } });
  gsap.fromTo(".epi-media img", { opacity: 0.5 }, { opacity: 0.22, ease: "none", immediateRender: false, scrollTrigger: { trigger: ".epi-lines", start: "top 60%", end: "top 10%", scrub: true } });
  gsap.fromTo(".epi-media img", { opacity: 0.22 }, { opacity: 0.06, ease: "none", immediateRender: false, scrollTrigger: { trigger: ".epi-slots", start: "top 90%", end: "top 30%", scrub: true } });
  $$(".el").forEach(function (el) {
    gsap.fromTo(el, { opacity: 0.04, filter: "blur(10px)", y: 30 }, { opacity: 1, filter: "blur(0px)", y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "top 45%", scrub: true } });
  });
  gsap.from(".epi-slots .slot", { opacity: 0, y: 50, duration: 1.2, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".epi-slots", start: "top 88%" } });

  /* IV – ľudia */
  gsap.fromTo(".team-img img", { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".team-img", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".team-img", { clipPath: "inset(0% 8% 0% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".team-img", start: "top 95%", end: "top 20%", scrub: true } });
  ST.batch(".kr-row", { start: "top 92%", onEnter: function (b) { gsap.fromTo(b, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.08, overwrite: true }); } });
  gsap.set(".kr-row", { opacity: 0 });

  /* pás */
  gsap.fromTo(".band .r1", { xPercent: 0 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".band .r2", { xPercent: -30 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });

  /* objednávka */
  gsap.fromTo(".offer-media", { yPercent: 0 }, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".offer", start: "top bottom", end: "bottom top", scrub: true } });

  $$(".chap a").forEach(function (a) {
    var t = $(a.getAttribute("href")); if (!t) return;
    ST.create({ trigger: t, start: "top 55%", end: "bottom 55%", onToggle: function (s) { a.classList.toggle("is-on", s.isActive); } });
  });

  w.addEventListener("load", function () { ST.refresh(); });
})();
