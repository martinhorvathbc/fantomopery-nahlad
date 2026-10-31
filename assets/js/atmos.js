/* Atmosféra – objemové svetlo, hmla a prach (čistý WebGL, bez knižnice).
   Vrstva leží nad obsahom v režime „screen“: čierna = bez zmeny, svetlo sa pripočíta.
   Paletu a silu prepína sekcia v strede obrazovky cez data-atmo. */
(function () {
  "use strict";
  var w = window, d = document;
  var reduced = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = d.createElement("canvas");
  cv.className = "atmos"; cv.setAttribute("aria-hidden", "true");
  var gl = cv.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return;
  d.body.appendChild(cv);

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision mediump float;",
    "uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 A;uniform vec3 B;uniform float I;uniform float BM;uniform float DU;uniform float FG;uniform vec4 O;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
    // kužeľ svetla z bodu o smerom dir, šírka k
    "float beam(vec2 uv,vec2 o,vec2 dir,float k){vec2 v=uv-o;float l=length(v);float c=dot(v/l,dir);float a=smoothstep(1.-k,1.,c);return a*smoothstep(1.15,.0,l)*smoothstep(0.,.2,l);}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;vec2 q=vec2(uv.x*asp,uv.y);",
    " float t=T*.04;",
    " float f=fbm(q*2.2+vec2(t,-t*.6));float f2=fbm(q*4.5-vec2(t*1.3,t*.4)+f);",
    " float fog=pow(f*.6+f2*.4,2.2);",
    // dva objemové lúče zhora, jemne sa hýbu, myš ich naklápa
    " vec2 o1=vec2(asp*(O.x+.025*sin(T*.11))+M.x*.06,1.12);vec2 d1=normalize(vec2((.5-O.x)*.35+.06*sin(T*.07)+M.x*.08,-1.));",
    " vec2 o2=vec2(asp*(O.y+.025*cos(T*.09))+M.x*.06,1.14);vec2 d2=normalize(vec2((.5-O.y)*.35+.05*cos(T*.08)+M.x*.08,-1.));",
    " float vy=smoothstep(.05,.75,uv.y);float b1=beam(q,o1,d1,O.z)*(.45+1.1*f2)*vy;float b2=beam(q,o2,d2,O.w)*(.45+1.1*f)*vy;",
    " vec3 col=A*b1*BM+B*b2*BM*.85;",
    " col+=mix(A,B,uv.x)*fog*FG*(.2+.8*uv.y);",
    // prach: bunková mriežka, body pomaly stúpajú, v lúčoch jasnejšie
    " vec2 g=q*vec2(26.,26.)+vec2(0.,T*.35);vec2 id=floor(g);vec2 fr=fract(g)-.5;float r=h(id);",
    " vec2 off=vec2(h(id+3.1)-.5,h(id+7.7)-.5)*.6;float dd=length(fr-off);",
    " float sp=smoothstep(.06,.0,dd)*step(.86,r)*(.5+.5*sin(T*1.7+r*40.));",
    " col+=mix(vec3(1.,.86,.62),B,step(.95,r))*sp*DU*(.25+2.5*(b1+b2));",
    " col*=I;",
    " gl_FragColor=vec4(col,1.);",
    "}"].join("\n");

  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ["R", "T", "M", "A", "B", "I", "BM", "DU", "FG", "O"].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  // palety: A = hlavné svetlo, B = protisvetlo; i = sila, bm = lúče, du = prach, fg = hmla
  var P = {
    gold:   { A: [1.0, .74, .42], B: [.95, .16, .22], i: 1.0, bm: .34, du: 1.0, fg: .16, o: [.52, .86, .035, .022] },
    red:    { A: [1.0, .18, .24], B: [1.0, .7, .4],   i: 1.0, bm: .3,  du: .8,  fg: .2,  o: [.84, .16, .03, .022] },
    blue:   { A: [.42, .52, 1.0], B: [1.0, .2, .26],  i: .9,  bm: .25, du: .7,  fg: .2,  o: [.2, .8, .03, .02] },
    candle: { A: [1.0, .62, .3],  B: [.6, .1, .12],   i: .85, bm: 0,   du: 1.3, fg: .14, o: [.5, .5, .03, .02] },
    quiet:  { A: [.9, .7, .45],   B: [.7, .15, .2],   i: .7,  bm: 0,   du: .55, fg: .1,  o: [.5, .5, .03, .02] },
    off:    { A: [0, 0, 0],       B: [0, 0, 0],       i: 0,   bm: 0,   du: 0,   fg: 0,   o: [.5, .5, .03, .02] }
  };
  var cur = JSON.parse(JSON.stringify(P.gold)), target = P.gold;
  var mouse = [0, 0], mt = [0, 0];
  w.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") { mt[0] = e.clientX / w.innerWidth - .5; mt[1] = e.clientY / w.innerHeight - .5; } }, { passive: true });

  var small = w.innerWidth <= 760, scale = small ? .42 : .5;
  function rs() { small = w.innerWidth <= 760; scale = small ? .42 : .5; cv.width = Math.max(2, Math.round(w.innerWidth * scale)); cv.height = Math.max(2, Math.round(w.innerHeight * scale)); gl.viewport(0, 0, cv.width, cv.height); }
  rs(); w.addEventListener("resize", rs);

  // výber palety podľa sekcie v strede obrazovky
  var secs = [].slice.call(d.querySelectorAll("[data-atmo]"));
  function pick() {
    var y = w.innerHeight * .5, best = null;
    for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.top <= y && r.bottom >= y) { best = secs[i]; break; } }
    target = P[best ? best.getAttribute("data-atmo") : "quiet"] || P.quiet;
    var bs = best && best.getAttribute("data-atmo-beam"), el = bs && d.querySelector(bs);
    if (el) { var r2 = el.getBoundingClientRect(); var t2 = JSON.parse(JSON.stringify(target)); t2.o[0] = (r2.left + r2.width * .5) / w.innerWidth; target = t2; }
  }
  w.addEventListener("scroll", pick, { passive: true }); pick();

  function lerp(a, b, k) { return a + (b - a) * k; }
  var t0 = performance.now(), last = 0, vis = true;
  d.addEventListener("visibilitychange", function () { vis = !d.hidden; if (vis) requestAnimationFrame(frame); });
  function frame(now) {
    if (!vis) return;
    if (!reduced) requestAnimationFrame(frame);
    if (small && now - last < 32) return; // mobil ~30 fps
    last = now;
    var k = reduced ? 1 : .045;
    ["i", "bm", "du", "fg"].forEach(function (p) { cur[p] = lerp(cur[p], target[p], k); });
    for (var j = 0; j < 3; j++) { cur.A[j] = lerp(cur.A[j], target.A[j], k); cur.B[j] = lerp(cur.B[j], target.B[j], k); }
    for (var m = 0; m < 4; m++) cur.o[m] = lerp(cur.o[m], target.o[m], k * .6);
    mouse[0] = lerp(mouse[0], mt[0], .04); mouse[1] = lerp(mouse[1], mt[1], .04);
    gl.uniform2f(U.R, cv.width, cv.height);
    gl.uniform1f(U.T, reduced ? 20 : (now - t0) / 1000);
    gl.uniform2f(U.M, mouse[0], mouse[1]);
    gl.uniform3fv(U.A, cur.A); gl.uniform3fv(U.B, cur.B);
    gl.uniform4fv(U.O, cur.o); gl.uniform1f(U.I, cur.i); gl.uniform1f(U.BM, cur.bm * (small ? .55 : 1)); gl.uniform1f(U.DU, cur.du); gl.uniform1f(U.FG, cur.fg);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
  if (reduced) w.addEventListener("scroll", function () { requestAnimationFrame(frame); }, { passive: true });
})();
