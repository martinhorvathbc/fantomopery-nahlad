/* LEROUX100 – „Comment c’est fait / Ako je to urobené“ (7. 11. 2026, 5 minút podľa Martina 20.44 – 20.51; predtým 60 s)
   Celé predstavenie 1:19:52 za 300 s: hlava prechádza osou, bloky sa rozsvecujú, nad osou časť, časomiera a popisok.
   Kruh priestorového zvuku: 12 reproduktorov, žiara s nábehom a pomalým dozvukom, zdroj zvuku sa plynulo presúva
   po kruhu a ťahá za sebou stopu; režimy sa prelínajú. Spustí sa samo po dorolovaní, pri odrolovaní sa pozastaví.
   prefers-reduced-motion a bez JS: statická os. Test: ?tla=12 nastaví 12. sekundu animácie a zastaví. */
(function(){
  var RM=false;try{RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  var PI2=Math.PI*2;
  function pad(n){return (n<10?"0":"")+n}
  function tc(s){s=Math.max(0,Math.round(s));return Math.floor(s/3600)+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60)}
  function tcH(s){return tc(s).replace(/:/g,"<i>:</i>")}
  function q(r,s){return r.querySelector(s)}
  function qa(r,s){return [].slice.call(r.querySelectorAll(s))}
  // farby režimov zvuku (RGB)
  var COL={voix:[255,110,124],pic:[255,138,150],narr:[239,204,138],direct:[241,223,182],special:[255,244,220],music:[224,169,78]};
  var MODES=["voix","pic","narr","direct","special","music"];

  function Ring(svg){
    var C=120,RS=104,n=12,i;
    var halos=qa(svg,".r-halo"),spl=qa(svg,".r-spl"),rays=qa(svg,".r-ray"),gh=qa(svg,".r-gh"),src=q(svg,".r-src"),
        pul=qa(svg,".r-pul"),cv=qa(svg,".r-cv"),acts=qa(svg,".r-act"),stops=qa(svg,".r-c0,.r-c1,.r-c2");
    var I=[],ang=[];for(i=0;i<n;i++){I.push(0);ang.push(PI2*i/n-Math.PI/2)}
    var w={};MODES.forEach(function(m){w[m]=0});
    var ph=-Math.PI/2,clock=0,trail=[],tAcc=0,lastCol="";
    function bump(d,k){var c=.5+.5*Math.cos(d);return Math.pow(c,k)}
    function tick(dt,mode){
      clock+=dt;
      var kw=1-Math.exp(-dt/420);
      MODES.forEach(function(m){w[m]+=((m===mode?1:0)-w[m])*kw});
      // zdroj zvuku obieha kruh: rýchlejšie pri rozprávaní, pomaly pri hudbe
      ph+=dt/1000*(PI2/5.2*w.narr+PI2/11*w.music+PI2/14*(w.voix+w.pic));
      var br=.5+.5*Math.sin(clock/1000*PI2/1.8),cyc=(clock%1600)/1600;
      for(i=0;i<n;i++){
        var a=ang[i],d=a-ph;
        var front=bump(a+Math.PI/2,2);
        var t=w.voix*(.62+.2*br+.16*front)+w.pic*.95+w.narr*(.12+.8*bump(d,6))+w.music*(.06+.42*bump(d,4))+w.direct*.07+w.special*(.95-.75*cyc);
        var k=t>I[i]?1-Math.exp(-dt/110):1-Math.exp(-dt/900); // rýchly nábeh, pomalý dozvuk
        I[i]+=(t-I[i])*k;
        halos[i].style.opacity=Math.min(1,I[i]).toFixed(3);
        spl[i].style.opacity=Math.min(1,I[i]*1.1).toFixed(3);
        rays[i].style.opacity=(I[i]*.42*(1-w.direct*.8)).toFixed(3);
      }
      // farba žiary: prelínanie režimov
      var r=0,g=0,b=0,s=0;MODES.forEach(function(m){r+=COL[m][0]*w[m];g+=COL[m][1]*w[m];b+=COL[m][2]*w[m];s+=w[m]});
      if(s>.001){var col="rgb("+Math.round(r/s)+","+Math.round(g/s)+","+Math.round(b/s)+")";if(col!==lastCol){lastCol=col;stops.forEach(function(st){st.setAttribute("stop-color",col)})}}
      // zdroj a dozvuková stopa
      var sx=C+RS*Math.cos(ph),sy=C+RS*Math.sin(ph),sa=Math.min(1,w.narr+.55*w.music+.35*(w.voix+w.pic));
      src.setAttribute("cx",sx.toFixed(1));src.setAttribute("cy",sy.toFixed(1));src.style.opacity=(sa*.9).toFixed(3);
      tAcc+=dt;if(tAcc>45){tAcc=0;trail.unshift([sx,sy]);if(trail.length>gh.length)trail.pop()}
      for(i=0;i<gh.length;i++){var p=trail[i];if(!p){gh[i].style.opacity=0;continue}
        gh[i].setAttribute("cx",p[0].toFixed(1));gh[i].setAttribute("cy",p[1].toFixed(1));gh[i].style.opacity=(sa*.55*Math.pow(1-i/gh.length,1.6)).toFixed(3)}
      // herci naživo: zvuk vychádza zo stredu
      for(i=0;i<pul.length;i++){var c=((clock/2400)+i*.5)%1;pul[i].setAttribute("r",(34+34*c).toFixed(1));pul[i].style.opacity=(w.direct*.6*(1-c)).toFixed(3)}
      acts.forEach(function(a){a.style.opacity=(.5+.5*w.direct).toFixed(3)});
      // špeciál: zvuk padne zhora a zbehne sa v strede sály
      for(i=0;i<cv.length;i++){var e=((clock/1600)+i/3)%1;cv[i].setAttribute("r",(104*(1-e)+3).toFixed(1));cv[i].style.opacity=(w.special*.85*Math.sin(Math.PI*e)).toFixed(3)}
    }
    return {tick:tick};
  }

  function setup(root){
    if(root.__tla)return root.__tla;
    var TOT=parseFloat(root.getAttribute("data-total"))||4792,DUR=(parseFloat(root.getAttribute("data-dur"))||300)*1000;
    var MAP=null;try{MAP=JSON.parse(root.getAttribute("data-map")||"null")}catch(e){}
    function sm(u){return u*u*(3-2*u)}
    function perf(ms){var t=ms/1000;if(!MAP)return Math.min(1,ms/DUR)*TOT;var L=MAP[MAP.length-1];if(t>=L[0])return L[1];
      for(var i=1;i<MAP.length;i++){var a=MAP[i-1],b=MAP[i];if(b[0]>a[0]&&t>=a[0]&&t<b[0]){var u=(t-a[0])/(b[0]-a[0]);if(b[2])u=sm(u);return a[1]+(b[1]-a[1])*u}}return 0}
    function inv(T){if(!MAP)return T/TOT*DUR;var lo=0,hi=DUR;for(var k=0;k<28;k++){var m=(lo+hi)/2;if(perf(m)<T)lo=m;else hi=m}return hi}
    var o={root:root,t:0,playing:false,started:false,ended:false,auto:false,last:0,raf:0};
    root.__tla=o;
    if(RM)return o;
    root.classList.remove("is-static");root.classList.add("is-anim");
    var els=qa(root,".tla-grid [data-a]").map(function(el){return{el:el,a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),s:-1}});
    var parts=qa(root,".tla-pseg");
    var snd=qa(root,".tla-son [data-mode]").map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),m:el.getAttribute("data-mode")}});
    var mus=qa(root,".tla-mus [data-a]").map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b")}});
    var lum=qa(root,"[data-light]").map(function(el){return{a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),m:el.getAttribute("data-light")}});
    var caps=qa(root,".tla-steps li").map(function(li){var c=li.cloneNode(true);var sp=c.querySelector("span");if(sp)c.removeChild(sp);return{t:+li.getAttribute("data-t"),x:c.textContent.trim()}});
    var ph=q(root,".tla-ph"),tcEl=q(root,".tla-tc"),partEl=q(root,".tla-part"),capEl=q(root,".tla-cap"),bar=q(root,".tla-bar span"),axis=q(root,".tla-axis"),
        stS=q(root,".tla-st-s span"),stL=q(root,".tla-st-l span"),pp=q(root,".tla-pp"),grid=q(root,".tla-track"),totEl=q(root,".tla-tot");
    var ring=Ring(q(root,".tla-ring"));
    // pás „kam patrí hudba“: zoznam miest sa rozsvieti podľa hlavy; zvuk (ak je súbor) len po kliknutí
    var mli=qa(root,".tla-mlist li").map(function(el){return{el:el,a:+el.getAttribute("data-a"),b:+el.getAttribute("data-b"),s:-1}});
    var aud=q(root,".tla-aud"),sndBtn=q(root,".tla-snd"),wantSnd=false;
    function audSync(force){if(!aud||!wantSnd)return;var want=o.t/1000;
      if(aud.duration&&want>=aud.duration-.05){if(!aud.paused)aud.pause();return}
      if(o.playing&&!o.ended){if(force||Math.abs(aud.currentTime-want)>.7){try{aud.currentTime=want}catch(e){}}if(aud.paused){var pr=aud.play();if(pr&&pr.catch)pr.catch(function(){})}}
      else if(!aud.paused)aud.pause()}
    if(sndBtn&&aud)sndBtn.addEventListener("click",function(){wantSnd=!wantSnd;sndBtn.setAttribute("aria-pressed",wantSnd?"true":"false");
      sndBtn.textContent=sndBtn.getAttribute(wantSnd?"data-off":"data-on");if(wantSnd)audSync(true);else aud.pause()});
    if(totEl)totEl.innerHTML=totEl.textContent.replace(/(\d+:\d\d:\d\d)/,function(x){return tcH(TOT)});
    var curCap=-1,curSnd="",curLum="",curPart="",curSec=-1,capTo=0;
    function find(arr,T){for(var i=0;i<arr.length;i++){if(T>=arr[i].a&&T<arr[i].b)return arr[i]}return null}
    function render(dt){
      var p=Math.min(1,o.t/DUR),T=MAP?perf(o.t):p*TOT,pf=T/TOT;
      ph.style.left=(pf*100)+"%";bar.style.width=(p*100)+"%";root.style.setProperty("--p",(pf*100).toFixed(3)+"%");
      for(var mi=0;mi<mli.length;mi++){var ml=mli[mi],ms=T>=ml.a?(T<ml.b?2:1):0;if(p>=1)ms=1;if(ms!==ml.s){ml.s=ms;ml.el.classList.toggle("is-on",ms>0);ml.el.classList.toggle("is-now",ms===2)}}
      var sec=Math.round(T);if(sec!==curSec){curSec=sec;tcEl.innerHTML=tcH(T);axis.setAttribute("aria-valuenow",sec);axis.setAttribute("aria-valuetext",tc(T))}
      for(var i=0;i<els.length;i++){var e=els[i],s=T>=e.a?(T<e.b||(e.b-e.a<40&&T<e.a+40)?2:1):0;
        if(p>=1)s=1;
        if(s!==e.s){e.s=s;e.el.classList.toggle("is-on",s>0);e.el.classList.toggle("is-now",s===2)}}
      for(var j=0;j<parts.length;j++){var pa=parts[j];if(T>=+pa.getAttribute("data-a")&&(T<+pa.getAttribute("data-b")||j===parts.length-1)){if(curPart!==j){curPart=j;partEl.textContent=pa.getAttribute("data-n")}break}}
      var ci=0;for(var k=0;k<caps.length;k++){if(T>=caps[k].t)ci=k}
      if(ci!==curCap){var first=curCap<0;curCap=ci;clearTimeout(capTo);
        if(first){capEl.textContent=caps[ci].x}else{capEl.classList.add("is-out");capTo=setTimeout(function(){capEl.textContent=caps[curCap].x;capEl.classList.remove("is-out")},420)}}
      var sm=find(snd,T),m=sm?sm.m:(find(mus,T)?"music":(curSnd||"direct"));
      if(m!==curSnd){curSnd=m;root.setAttribute("data-snd",m);stS.textContent=m?(root.getAttribute("data-m-"+m)||""):"–"}
      var lm=find(lum,T),l=lm?lm.m:(lum.length?lum[lum.length-1].m:"");
      if(l!==curLum){curLum=l;root.setAttribute("data-lum",l);stL.textContent=root.getAttribute("data-l-"+l)||""}
      ring.tick(dt||16,p>=1?"":m);
      audSync(false);
      root.classList.toggle("is-end",p>=1);
    }
    // kruh dobieha (dozvuk) aj počas pauzy a po konci, kým nestíchne
    var idle=0,idleRaf=0;
    function settle(now){idleRaf=0;if(o.playing)return;var dt=Math.min(100,now-(idle||now));idle=now;ring.tick(dt,o.ended?"":curSnd);settleN-=dt;if(settleN>0)idleRaf=requestAnimationFrame(settle)}
    var settleN=0;function settleStart(){settleN=2500;idle=0;if(!idleRaf)idleRaf=requestAnimationFrame(settle)}
    function frame(now){
      o.raf=0;if(!o.playing)return;
      var dt=Math.min(100,now-(o.last||now));o.last=now;o.t+=dt;
      if(o.t>=DUR){o.t=DUR;o.ended=true;stop()}
      render(dt);
      if(o.playing)o.raf=requestAnimationFrame(frame);
    }
    function label(){var on=o.playing;pp.setAttribute("aria-label",root.getAttribute(on?"data-pause":"data-play"));root.classList.toggle("is-playing",on)}
    function play(){if(o.ended||o.t>=DUR){o.t=0;o.ended=false}o.started=true;o.playing=true;o.last=0;label();audSync(true);if(!o.raf)o.raf=requestAnimationFrame(frame)}
    function stop(){o.playing=false;label();audSync(false);settleStart()}
    o.play=play;o.pause=stop;o.render=render;
    o.seek=function(sec){o.t=Math.max(0,Math.min(DUR,sec*1000));o.ended=o.t>=DUR;for(var n=0;n<60;n++)render(50)};
    pp.addEventListener("click",function(){o.auto=false;if(o.playing)stop();else play()});
    function restart(){o.auto=false;o.t=0;o.ended=false;render(16);play()}
    q(root,".tla-re").addEventListener("click",restart);
    q(root,".tla-again").addEventListener("click",restart);
    // posúvanie osou
    var drag=false,was=false;
    function at(ev){var r=grid.getBoundingClientRect();var x=(ev.clientX-r.left)/r.width;o.t=MAP?inv(Math.max(0,Math.min(1,x))*TOT):Math.max(0,Math.min(1,x))*DUR;o.ended=o.t>=DUR;o.started=true;render(16)}
    axis.addEventListener("pointerdown",function(ev){if(ev.button)return;drag=true;was=o.playing;stop();try{axis.setPointerCapture(ev.pointerId)}catch(e){}at(ev)});
    axis.addEventListener("pointermove",function(ev){if(drag)at(ev)});
    function up(){if(!drag)return;drag=false;if(was&&o.t<DUR)play()}
    axis.addEventListener("pointerup",up);axis.addEventListener("pointercancel",up);
    axis.addEventListener("keydown",function(ev){var k=ev.key,d=k==="ArrowRight"?2000:k==="ArrowLeft"?-2000:k==="End"?DUR:k==="Home"?-DUR:0;
      if(k===" "||k==="Enter"){ev.preventDefault();pp.click();return}
      if(d){ev.preventDefault();stop();o.t=Math.max(0,Math.min(DUR,o.t+d));o.ended=o.t>=DUR;o.started=true;render(16)}});
    var mm=/[?&]tla=([\d.]+)/.exec(location.search);
    if(mm){o.started=true;o.seek(parseFloat(mm[1]));label();return o}
    render(16);label();
    if("IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.isIntersecting&&e.intersectionRatio>=.35){if(!o.started||o.auto){o.auto=false;if(!o.ended)play()}}
        else if(o.playing&&e.intersectionRatio<.1){stop();o.auto=true}
      })},{threshold:[0,.1,.35,.6]});
      io.observe(q(root,".tla-stage"));
    }else play();
    return o;
  }
  function init(){[].forEach.call(document.querySelectorAll(".tla"),setup)}
  window.__tlainit=init;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
