// Stage scaler, navigation, and learning widgets (predict, flip, sim). No dependencies.
(function(){
  const stage=document.getElementById('stage'), slides=[...stage.querySelectorAll('.slide')];
  let i=Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1));
  const ctr=document.getElementById('ctr');
  const PAGE=document.body.classList.contains('page');
  function fit(){if(PAGE)return;const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`translate(-50%,-50%) scale(${s})`;}
  // build steps (1-based, = caption number): data-step="k" shows from step k on, data-only="k" at step k only, data-cap="k" = caption k
  const SEL='[data-step],[data-only],[data-cap]';
  function smax(s){let m=0;s.querySelectorAll(SEL).forEach(e=>{m=Math.max(m,+(e.dataset.step||e.dataset.only||e.dataset.cap)||0)});return m;}
  function lo(s){return smax(s)>0?1:0;}
  function show(s,k){const m=smax(s);k=k<0?m:Math.max(lo(s),Math.min(m,k));s._k=k;
    s.querySelectorAll('[data-step]').forEach(e=>e.classList.toggle('on',+e.dataset.step<=k));
    s.querySelectorAll('[data-only]').forEach(e=>e.classList.toggle('on',+e.dataset.only===k));
    s.querySelectorAll('[data-cap]').forEach(e=>{const j=+e.dataset.cap;e.classList.toggle('on',j<=k);e.classList.toggle('now',j===k);});
    s.querySelectorAll('.stepctr').forEach(c=>c.textContent=`step ${k} / ${m}`);}
  slides.forEach(s=>{show(s,0);s.querySelectorAll('[data-sb]').forEach(b=>b.onclick=e=>{e.stopPropagation();show(s,s._k+(+b.dataset.sb));});
    s.querySelectorAll('.scene .canvas,.calc').forEach(c=>c.onclick=()=>show(s,s._k+1));});
  function go(n,k){if(PAGE){slides.forEach(s=>s.classList.add('active'));return;}i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,j)=>s.classList.toggle('active',j===i));
    show(slides[i],k||0);
    if(ctr)ctr.textContent=`${i+1} / ${slides.length}`;history.replaceState(null,'','#'+(i+1));
    slides[i].querySelectorAll('canvas[data-sim]').forEach(c=>c._run&&c._run());}
  function next(){const s=slides[i];if(s._k<smax(s))show(s,s._k+1);else go(i+1,0);}
  function prev(){const s=slides[i];if(s._k>lo(s))show(s,s._k-1);else if(i>0)go(i-1,-1);}
  addEventListener('resize',fit);fit();go(i);
  addEventListener('keydown',e=>{if(PAGE||e.target.tagName==='INPUT')return;
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();next()}
    else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();prev()}
    else if(e.key==='ArrowDown'){e.preventDefault();go(i+1,0)}else if(e.key==='ArrowUp'){e.preventDefault();go(i-1,0)}
    else if(e.key==='Home')go(0);else if(e.key==='End')go(slides.length-1);});
  let tx=null;addEventListener('touchstart',e=>tx=e.touches[0].clientX);
  addEventListener('touchend',e=>{if(PAGE||tx===null)return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)(d<0?next:prev)();tx=null;});
  window.deckGo=d=>d>0?next():prev();window.deckTo=go;window.deckStep=k=>show(slides[i],k);

  // predict: click an option, then the explanation is revealed
  document.querySelectorAll('[data-predict]').forEach(box=>{
    const ans=+box.dataset.predict, rev=box.parentElement.querySelector('.reveal');
    box.querySelectorAll('.opt').forEach((b,k)=>b.onclick=()=>{
      box.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(j===ans)x.classList.add('right');});
      if(k!==ans)b.classList.add('wrong');rev&&rev.classList.add('show');});});
  // flip cards
  document.querySelectorAll('.flip').forEach(f=>f.onclick=()=>f.classList.toggle('on'));
  // reveal buttons
  document.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.show).classList.add('show');b.remove();});

  // sim: author supplies window.SIMS[id] = function(ctx, p, W, H, rng){...}
  function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  document.querySelectorAll('canvas[data-sim]').forEach(c=>{
    const id=c.dataset.sim, root=c.closest('.sim'), ins=[...root.querySelectorAll('input[type=range]')];
    let seed=1;
    c._run=function(){const W=c.width,H=c.height,ctx=c.getContext('2d'),p={};
      ins.forEach(x=>{p[x.name]=+x.value;const o=root.querySelector(`[data-out="${x.name}"]`);if(o)o.textContent=x.value;});
      ctx.clearRect(0,0,W,H);const T=window.T||{ink:'#222',muted:'#666',grid:'#ddd',c:['#36c']};
      ctx.font='26px '+getComputedStyle(document.body).fontFamily;ctx.fillStyle=T.ink;ctx.strokeStyle=T.ink;ctx.lineWidth=2;
      try{(window.SIMS[id])(ctx,p,W,H,mulberry(seed),T);}catch(err){ctx.fillText('sim error: '+err.message,20,40);}};
    ins.forEach(x=>x.oninput=c._run);
    const rb=root.querySelector('[data-reseed]');if(rb)rb.onclick=()=>{seed++;c._run();};
    c._run();});
})();
