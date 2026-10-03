// Stage scaler and learning widgets. Optional KaTeX / Mermaid from cdnjs.
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
    s.querySelectorAll('.scene .canvas,.scene .mmd,.calc').forEach(c=>c.onclick=()=>show(s,s._k+1));});
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
    else if(e.key==='Home')go(0);else if(e.key==='End')go(slides.length-1);
    else if(e.key.toLowerCase()==='n')slides[i].querySelector('.sym-toggle')?.click();});
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
  document.querySelectorAll('.sym-toggle').forEach(b=>b.onclick=()=>{
    const open=b.closest('.slide').classList.toggle('sym-open');b.setAttribute('aria-expanded',String(open));});
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
  function need(url){return new Promise(resolve=>{const s=document.createElement('script');
    const timer=setTimeout(()=>{s.remove();resolve(false)},6000);
    s.onload=()=>{clearTimeout(timer);resolve(true)};s.onerror=()=>{clearTimeout(timer);resolve(false)};
    s.src=url;document.head.appendChild(s);});}
  const wanted=(document.body.dataset.need||'').split(' '), libs={};
  window.deckLibs=libs;window.deckReady=!wanted.some(Boolean);
  const tasks=[];
  if(wanted.includes('katex'))tasks.push((async()=>{
    libs.katex=await need('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.18.9/katex.min.js');
    if(libs.katex)document.querySelectorAll('.tex').forEach(el=>{
      const raw=el.textContent, d=el.classList.contains('d'), n=d?2:1;
      try{window.katex.render(raw.slice(n,-n),el,{displayMode:d,throwOnError:false});}
      catch(err){el.textContent=raw;libs.katex=false;}});
  })());
  // mermaid (trial): remove this block to drop branching flows.
  if(wanted.includes('mermaid'))tasks.push((async()=>{
    libs.mermaid=await need('https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js');
    if(!libs.mermaid)return;
    const css=getComputedStyle(document.documentElement), c=n=>css.getPropertyValue(n).trim();
    const blocks=[...document.querySelectorAll('.mermaid')], raw=blocks.map(e=>e.textContent);
    try{window.mermaid.initialize({startOnLoad:false,theme:'base',themeVariables:{
      primaryColor:c('--surf'),primaryBorderColor:c('--line'),primaryTextColor:c('--ink'),
      lineColor:c('--p1'),secondaryColor:c('--surf2'),tertiaryColor:c('--bg2'),
      edgeLabelBackground:c('--surf2'),fontFamily:getComputedStyle(document.body).fontFamily,fontSize:'28px'},
      flowchart:{htmlLabels:false,curve:'basis',useMaxWidth:true,padding:26,nodeSpacing:60,rankSpacing:80}});
      await document.fonts.ready;  // measure labels in the real font, or they get cut off
      await window.mermaid.run({querySelector:'.mermaid'});
      document.querySelectorAll('.mmd').forEach(frame);
      slides.forEach(s=>show(s,s._k));
    }catch(err){libs.mermaid=false;blocks.forEach((e,k)=>{e.textContent=raw[k];e.removeAttribute('data-processed')});}
  })());
  // Card look: a hard offset shadow behind every node. On step slides, one new node per step in the order
  // first written (extras join the last step); an arrow and its label appear with their later end.
  function frame(box){
    box.classList.add('loaded');
    const svg=box.querySelector('svg');if(!svg)return;
    svg.querySelectorAll('marker').forEach(m=>{m.setAttribute('markerWidth',20);m.setAttribute('markerHeight',20);});
    const nodes=[...svg.querySelectorAll('g.node')].map(n=>{const m=n.id.match(/flowchart-(.+)-(\d+)$/);return{n,name:m?m[1]:'',at:m?+m[2]:0};}).sort((a,b)=>a.at-b.at);
    nodes.forEach(({n})=>{const sh=n.querySelector('.label-container');if(!sh)return;
      const c=sh.cloneNode(true);c.removeAttribute('style');c.classList.add('mshadow');
      c.setAttribute('transform',(sh.getAttribute('transform')||'')+' translate(8 8)');n.insertBefore(c,sh);});
    const S=+box.closest('.slide').querySelectorAll('[data-cap]').length;if(!S)return;
    const step={};nodes.forEach((o,i)=>{step[o.name]=Math.min(i+1,S);o.n.dataset.step=step[o.name];});
    svg.querySelectorAll('[data-id^="L_"]').forEach(e=>{
      for(const a in step)for(const b in step)if(e.dataset.id.startsWith(`L_${a}_${b}_`)){
        (e.closest('.edgeLabel')||e).dataset.step=Math.max(step[a],step[b]);return;}});
  }
  Promise.allSettled(tasks).then(()=>{window.deckReady=true});
})();
