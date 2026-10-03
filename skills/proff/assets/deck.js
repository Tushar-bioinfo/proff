// Stage scaler, navigation, and learning widgets (predict, flip, sim). No dependencies.
(function(){
  const stage=document.getElementById('stage'), slides=[...stage.querySelectorAll('.slide')];
  let i=Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1));
  const ctr=document.getElementById('ctr');
  const PAGE=document.body.classList.contains('page');
  function fit(){if(PAGE)return;const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`translate(-50%,-50%) scale(${s})`;}
  function go(n){if(PAGE){slides.forEach(s=>s.classList.add('active'));return;}i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,k)=>s.classList.toggle('active',k===i));
    if(ctr)ctr.textContent=`${i+1} / ${slides.length}`;history.replaceState(null,'','#'+(i+1));
    slides[i].querySelectorAll('canvas[data-sim]').forEach(c=>c._run&&c._run());}
  addEventListener('resize',fit);fit();go(i);
  addEventListener('keydown',e=>{if(PAGE||e.target.tagName==='INPUT')return;
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(i+1)}
    else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(i-1)}
    else if(e.key==='Home')go(0);else if(e.key==='End')go(slides.length-1);});
  let tx=null;addEventListener('touchstart',e=>tx=e.touches[0].clientX);
  addEventListener('touchend',e=>{if(PAGE||tx===null)return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)go(i+(d<0?1:-1));tx=null;});
  window.deckGo=d=>go(i+d);window.deckTo=go;

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
