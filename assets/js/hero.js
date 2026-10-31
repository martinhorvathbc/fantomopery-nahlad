/* Hero – Zlatá sála v tme, ktorú odhaľuje svetlo (kurzor, na dotyk samo putuje).
   Shader prevzatý z V4_C (_zdroj/shader_C.glsl), fotografia © František Gažík. Čistý WebGL. */
(function () {
  "use strict";
  var w = window, d = document;
  var box = d.querySelector(".hero-media"); if (!box) return;
  var reduced = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = ("ontouchstart" in w) || (w.matchMedia && w.matchMedia("(hover:none)").matches);
  var cv = d.createElement("canvas"); cv.className = "hero-gl"; cv.setAttribute("aria-hidden", "true");
  var gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) return; // ostane statická fotka
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
"precision highp float;",
"uniform vec2 R;uniform float T;uniform vec2 Lp;uniform float uHero;uniform float uDepth;uniform float uWarm;uniform float uPulse;uniform sampler2D uTex;uniform vec2 uTS;uniform float uScroll;",
"float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
"float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
"float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
"float beam(vec2 p,vec2 o,float a,float w){vec2 dir=vec2(sin(a),-cos(a));vec2 r=p-o;float along=dot(r,dir);if(along<0.)return 0.;float perp=abs(r.x*dir.y-r.y*dir.x);float wid=w*(.25+along);return exp(-perp*perp/(wid*wid))*exp(-along*.55)*smoothstep(0.,.08,along);}",
"float dust(vec2 p,float sc,float t,vec2 l){vec2 g=p*sc+vec2(0.,t);vec2 id=floor(g);vec2 f=fract(g)-.5;float r=h(id);if(r<.86)return 0.;vec2 o=vec2(h(id+3.1),h(id+7.7))-.5;float d=length(f-o*.7);float tw=.5+.5*sin(T*(1.+r*3.)+r*40.);return smoothstep(.06,0.,d)*tw*(r-.86)*7.;}",
"void main(){",
" vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;",
" vec2 p=vec2(uv.x*asp,uv.y);vec2 l=vec2(Lp.x*asp,Lp.y);",
" float d=length(p-l);",
" float core=exp(-d*d*16.);float halo=exp(-d*3.4);",
" float t=T*.035;",
" vec2 q=p*1.35+vec2(0.,uScroll*.35);",
" float f=fbm(q+vec2(t,-t*.7)+.8*vec2(fbm(q*1.6+t),fbm(q*1.6-t+3.1)));",
" float ia=uTS.x/uTS.y;vec2 iuv=uv;",
" if(asp>ia){float s=ia/asp;iuv.y=(uv.y-.5)*s+.5;}else{float s=asp/ia;iuv.x=(uv.x-.5)*s+.5;}",
" iuv=(iuv-.5)*(1.0-.05*uScroll)+.5+vec2((Lp.x-.5)*-.015,(Lp.y-.5)*-.015+uScroll*.05);",
" vec3 img=texture2D(uTex,vec2(iuv.x,1.-iuv.y)).rgb;",
" float lum=dot(img,vec3(.299,.587,.114));",
" vec3 imgN=mix(vec3(lum)*vec3(.5,.6,1.),img,.45);",
" vec3 base=(img*(core*1.3+halo*.3)+imgN*.04)*uHero;",
" vec3 cA=vec3(.95,.18,.20);vec3 cB=vec3(.30,.42,1.);vec3 cG=vec3(1.,.78,.45);",
" float dp=uDepth;",
" vec3 b1c=mix(cG,cA,smoothstep(0.,.35,dp+(1.-uHero)*.4));b1c=mix(b1c,cG,uWarm*1.6);",
" vec3 b2c=mix(cA,cB,smoothstep(.2,.8,dp));b2c=mix(b2c,cG,uWarm*1.2);",
" vec3 b3c=mix(cB,cA*.8,smoothstep(.5,1.,dp));b3c=mix(b3c,cG,uWarm);",
" float tt=T*.11;",
" float B1=beam(p,vec2(asp*.08,1.12),.62+.16*sin(tt),.07);",
" float B2=beam(p,vec2(asp*.94,1.12),-.55+.18*sin(tt*.8+2.),.075);",
" float B3=beam(p,vec2(asp*.55,1.15),.12*sin(tt*.6+4.),.05);",
" float vol=.35+1.25*f*f;",
" float bs=(1.-uHero*.55);",
" vec3 beams=(b1c*B1*.55+b2c*B2*.5+b3c*B3*.32*(1.-uHero))*vol*bs;",
" vec3 fc=mix(mix(cA,cB,smoothstep(.1,.7,dp))*.5,cG*.6,uWarm);",
" vec3 fog=fc*f*f*(.05+halo*.35+core*.5)*(1.+uPulse*1.2);",
" float spark=exp(-d*d*900.)*1.1+exp(-d*14.)*.22;",
" vec3 sc=mix(vec3(1.,.86,.62),vec3(1.,.55,.45),smoothstep(.3,.8,dp));",
" vec3 sparkc=sc*spark*(1.-uHero*.65)*(1.+uPulse*1.5);",
" float ds=dust(p,22.,T*.06,l)+dust(p*1.7+3.,30.,T*.04,l)*.7;",
" float lightAt=clamp(B1+B2+B3*.6+halo*1.2,0.,1.6);",
" vec3 dcol=mix(vec3(1.,.85,.65),vec3(.7,.8,1.),step(.5,fract(ds*13.)));",
" vec3 dustc=dcol*ds*(.12+lightAt*.9);",
" vec3 col=base+beams+fog+sparkc+dustc;",
" col=1.-exp(-col*1.3);",
" float v=smoothstep(1.3,.2,length((uv-.5)*vec2(asp*.75,1.)));col*=mix(.3,1.,v);",
" col+=(h(gl_FragCoord.xy+T)-.5)*.016;",
" gl_FragColor=vec4(col,1.);",
"}"].join("\n");
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var lc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ["R", "T", "Lp", "uHero", "uDepth", "uWarm", "uPulse", "uTex", "uTS", "uScroll"].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  var img = new Image(); var small = w.innerWidth <= 760;
  img.src = small ? "assets/img/fg7_1100.webp" : "assets/img/fg7_2200.webp";
  var ready = false;
  img.onload = function () {
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uTex, 0); gl.uniform2f(U.uTS, img.naturalWidth, img.naturalHeight);
    ready = true; box.appendChild(cv); box.classList.add("has-gl"); rs(); requestAnimationFrame(fr);
  };
  var scale = small ? .6 : Math.min(1, (w.devicePixelRatio || 1) * .75);
  function rs() { small = w.innerWidth <= 760; var r = box.getBoundingClientRect(); cv.width = Math.max(2, Math.round(r.width * scale)); cv.height = Math.max(2, Math.round(r.height * scale)); gl.viewport(0, 0, cv.width, cv.height); }
  w.addEventListener("resize", function () { if (ready) rs(); });

  // svetlo: kurzor, inak samo putuje sálou (luster, pódium, diváci)
  var L = { x: .62, y: .62 }, Lt = { x: .62, y: .62 }, mouse = false;
  box.parentNode.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return; mouse = true;
    var r = box.getBoundingClientRect(); Lt.x = (e.clientX - r.left) / r.width; Lt.y = 1 - (e.clientY - r.top) / r.height;
  }, { passive: true });
  box.parentNode.addEventListener("pointerleave", function () { mouse = false; });
  var vis = true;
  if ("IntersectionObserver" in w) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) requestAnimationFrame(fr); }).observe(box);
  var t0 = performance.now(), last = 0;
  function fr(now) {
    if (!vis || !ready) return;
    if (!reduced) requestAnimationFrame(fr);
    if (small && now - last < 30) return; last = now;
    var t = (now - t0) / 1000;
    if (!mouse) { Lt.x = .6 + .26 * Math.sin(t * .23) + .08 * Math.sin(t * .61); Lt.y = .55 + .2 * Math.sin(t * .31 + 1.3); }
    var k = reduced ? 1 : .07; L.x += (Lt.x - L.x) * k; L.y += (Lt.y - L.y) * k;
    var r = box.getBoundingClientRect(); var sc = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, reduced ? 12 : t);
    gl.uniform2f(U.Lp, L.x, L.y); gl.uniform1f(U.uHero, 1); gl.uniform1f(U.uDepth, 0); gl.uniform1f(U.uWarm, 0);
    gl.uniform1f(U.uPulse, 0); gl.uniform1f(U.uScroll, sc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
})();
