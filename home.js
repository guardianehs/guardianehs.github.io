/* status rail advances once, then the stamp lands — the page issues itself */
  (function(){
    const steps=[...document.querySelectorAll('#rail .step')],stamp=document.getElementById('stamp');
    if(!steps.length)return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){steps.forEach((s,i)=>{if(i<3)s.classList.add('past');if(i===3)s.classList.add('on');});stamp.classList.add('in');return;}
    let i=0;
    const tick=()=>{
      steps.forEach((s,j)=>{s.classList.toggle('on',j===i);s.classList.toggle('past',j<i);});
      if(i===3)setTimeout(()=>stamp.classList.add('in'),260);
      i++;
      if(i<=3)setTimeout(tick,620);
    };
    setTimeout(tick,500);
  })();

  /* scroll reveals */
  (function(){
    const els=[...document.querySelectorAll('.reveal')];
    if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return;}
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'-40px'});
    els.forEach(e=>io.observe(e));
  })();

  /* clause index follows the reader */
  (function(){
    const links=[...document.querySelectorAll('#index a')];
    const secs=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if(!secs.length||!('IntersectionObserver' in window))return;
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(!e.isIntersecting)return;
        links.forEach(a=>a.classList.toggle('cur',a.getAttribute('href')==='#'+e.target.id));
      });
    },{rootMargin:'-30% 0px -60% 0px'});
    secs.forEach(s=>io.observe(s));
  })();

(function(){
  var t=document.getElementById('navtoggle'),m=document.getElementById('mobilemenu');
  if(!t||!m)return;
  t.addEventListener('click',function(){
    var open=m.classList.toggle('open');
    t.setAttribute('aria-expanded',open?'true':'false');
    t.setAttribute('aria-label',open?'Close menu':'Open menu');
  });
  m.addEventListener('click',function(e){
    if(e.target.tagName==='A'){m.classList.remove('open');t.setAttribute('aria-expanded','false');}
  });
})();

/* if an image file is missing, drop its figure rather than showing a broken icon */
document.querySelectorAll('img').forEach(function(im){
  im.addEventListener('error',function(){
    var fig=im.closest('figure')||im.closest('.post')||im.parentElement;
    if(fig&&fig.tagName==='FIGURE')fig.remove(); else im.style.display='none';
  });
});

/* reading progress + back to top */
(function(){
  var p=document.getElementById('progress'),t=document.getElementById('totop');
  function on(){
    var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
    var pct=max>0?(h.scrollTop/max)*100:0;
    if(p)p.style.width=pct+'%';
    if(t)t.classList.toggle('show',h.scrollTop>700);
  }
  addEventListener('scroll',on,{passive:true});on();
  if(t)t.onclick=function(){scrollTo({top:0,behavior:'smooth'});};
})();

/* counters */
(function(){
  var els=[].slice.call(document.querySelectorAll('.num[data-count]'));
  if(!els.length||!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      io.unobserve(e.target);
      var to=+e.target.dataset.count,t0=performance.now();
      (function f(t){
        var k=Math.min(1,(t-t0)/900);
        e.target.textContent=Math.round(to*(0.5-Math.cos(Math.PI*k)/2));
        if(k<1)requestAnimationFrame(f);
      })(t0);
    });
  },{rootMargin:'-60px'});
  els.forEach(function(e){io.observe(e);});
})();

/* 5x5 risk matrix — same bands as the offline engine */
(function(){
  var m=document.getElementById('matrix'),out=document.getElementById('mout');
  if(!m)return;
  function band(v){
    if(v<=4)return['Low','m-lo','Manage by routine procedures; monitor at the usual inspection frequency.'];
    if(v<=9)return['Medium','m-md','Add controls, name an owner and a date, then re-score the residual risk.'];
    if(v<=14)return['High','m-hi','Do not proceed until controls are in place — supervisor or EHS sign-off, and a permit where the activity is permit-controlled.'];
    return['Critical','m-cr','Stop. Work must not proceed at this score — eliminate or substitute the hazard and escalate to management.'];
  }
  var html='<div class="axis"></div>';
  for(var s=1;s<=5;s++)html+='<div class="axis">S'+s+'</div>';
  for(var l=5;l>=1;l--){
    html+='<div class="axis">L'+l+'</div>';
    for(var s2=1;s2<=5;s2++){
      var v=l*s2,b=band(v);
      html+='<button class="mcell '+b[1]+'" data-v="'+v+'" data-l="'+l+'" data-s="'+s2+'">'+v+'</button>';
    }
  }
  m.innerHTML=html;
  m.addEventListener('click',function(e){
    var c=e.target.closest('.mcell');if(!c)return;
    [].forEach.call(m.querySelectorAll('.mcell'),function(x){x.classList.remove('sel');});
    c.classList.add('sel');
    var v=+c.dataset.v,b=band(v);
    out.innerHTML='<b>'+c.dataset.l+' × '+c.dataset.s+' = '+v+' — '+b[0]+'</b>'+b[2];
  });
})();

/* LTIFR / TRIR */
(function(){
  var h=document.getElementById('c_hours'),l=document.getElementById('c_lti'),
      o=document.getElementById('c_ltifr'),a=document.getElementById('c_trir');
  if(!h)return;
  function calc(){
    var hv=parseFloat(String(h.value).replace(/[^\d.]/g,''))||0,
        lv=parseFloat(String(l.value).replace(/[^\d.]/g,''))||0;
    if(hv<=0){o.textContent='—';a.textContent='Enter the exposure hours to calculate.';return;}
    o.textContent=(lv*1e6/hv).toFixed(2);
    a.textContent='TRIR basis (×200,000): '+(lv*2e5/hv).toFixed(2);
  }
  h.addEventListener('input',calc);l.addEventListener('input',calc);calc();
})();

/* ---------- live permit demo ---------- */
(function(){
  var rail=document.getElementById('dRail');if(!rail)return;
  var STATES=['Draft','Assessed','Approved','Issued','Active','Closed'],cur=2;
  var CHECKS=[
    {t:'Risk assessment / JSA available',v:'Y'},
    {t:'Toolbox talk conducted',v:'Y'},
    {t:'Area barricaded &amp; signage in place',v:'Y'},
    {t:'Emergency &amp; first-aid arrangements',v:'N'},
    {t:'Isolation certificate referenced',v:''}
  ];
  var checksEl=document.getElementById('dChecks'),vEl=document.getElementById('dVerdict'),
      fill=document.getElementById('dMeterFill'),txt=document.getElementById('dMeterTxt'),
      submit=document.getElementById('dSubmit');

  function drawRail(){
    rail.innerHTML=STATES.map(function(s,i){
      return '<button type="button" class="'+(i<cur?'past':(i===cur?'on':''))+'" data-i="'+i+'">'+s+'</button>';
    }).join('');
  }
  function drawChecks(){
    checksEl.innerHTML=CHECKS.map(function(c,i){
      return '<div class="pcheck"><span>'+c.t+'</span><span class="tri">'
        +['Y','N','NA'].map(function(v){
            return '<button type="button" data-i="'+i+'" data-v="'+v+'" class="'+(c.v===v?'on':'')+'">'
              +(v==='Y'?'Yes':v==='N'?'No':'N/A')+'</button>';
          }).join('')
        +'</span></div>';
    }).join('');
  }
  function update(){
    var answered=CHECKS.filter(function(c){return c.v;}).length,
        no=CHECKS.filter(function(c){return c.v==='N';}).length,
        pct=Math.round(answered/CHECKS.length*100);
    fill.style.width=pct+'%';
    txt.textContent=pct+'% complete · '+answered+'/'+CHECKS.length+' checks · '+no+' flagged "No"';
    var cls,head,body;
    if(no){cls='no';head='DO NOT AUTHORISE';
      body='Blocking item'+(no>1?'s':'')+': '+CHECKS.filter(function(c){return c.v==='N';}).map(function(c){return c.t;}).join('; ')+'. Resolve and re-verify before issue.';}
    else if(answered<CHECKS.length){cls='cond';head='AUTHORISE WITH CONDITIONS';
      body=(CHECKS.length-answered)+' check'+(CHECKS.length-answered>1?'s':'')+' unanswered. Complete every item, then re-run the review.';}
    else{cls='ok';head='AUTHORISE';
      body='All controls confirmed and gas readings within acceptance limits. Issue against the named duty holder.';}
    vEl.className='verdict '+cls;
    vEl.innerHTML='<b>'+head+'</b><br>'+body;
    submit.disabled=(cls==='no');
    submit.textContent=cls==='no'?'Blocked — cannot submit':'Submit for approval';
  }
  drawRail();drawChecks();update();
  rail.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    cur=+b.dataset.i;drawRail();
  });
  checksEl.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    CHECKS[+b.dataset.i].v=b.dataset.v;drawChecks();update();
  });
  document.getElementById('dReset').onclick=function(){
    CHECKS[0].v='Y';CHECKS[1].v='Y';CHECKS[2].v='Y';CHECKS[3].v='N';CHECKS[4].v='';
    cur=2;drawRail();drawChecks();update();
  };
  submit.onclick=function(){
    if(submit.disabled)return;
    cur=3;drawRail();
    submit.textContent='Submitted ✓';
    setTimeout(function(){update();},2200);
  };
})();

/* ---------- live dashboard demo ---------- */
(function(){
  var bars=document.getElementById('pBars');if(!bars)return;
  var DAYS=[],base=new Date(2026,6,15);
  var seed=[980,1120,1040,1240,1180,1310,1090,1420,1260,1380,1150,1470,1290,1240];
  for(var i=0;i<14;i++){
    var d=new Date(base);d.setDate(base.getDate()+i);
    DAYS.push({d:d,hours:seed[i],tbt:2+(i%4),insp:1+(i%3),nm:i%5===0?1:0});
  }
  var sel=13;
  var fmt=function(n){return n.toLocaleString('en-IN');};
  function draw(){
    var max=Math.max.apply(null,DAYS.map(function(x){return x.hours;}));
    bars.innerHTML=DAYS.map(function(x,i){
      var h=Math.round(x.hours/max*100);
      return '<button type="button" data-i="'+i+'" class="'+(i===sel?'sel':'')+'" style="height:'+h+'%" aria-label="day '+(i+1)+'"></button>';
    }).join('');
    var s=DAYS[sel];
    document.getElementById('pWhen').textContent=
      s.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+' · Bengaluru Metro';
    document.getElementById('pManhours').textContent=fmt(s.hours);
    document.getElementById('pTbt').textContent=s.tbt;
    document.getElementById('pInsp').textContent=s.insp;
    document.getElementById('pNm').textContent=s.nm;
    var c=DAYS.reduce(function(a,x){a.h+=x.hours;a.t+=x.tbt;a.i+=x.insp;a.n+=x.nm;return a;},{h:0,t:0,i:0,n:0});
    document.getElementById('cHours').textContent=fmt(c.h);
    document.getElementById('cTbt').textContent=c.t;
    document.getElementById('cInsp').textContent=c.i;
    document.getElementById('cNm').textContent=c.n;
  }
  draw();
  bars.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    sel=+b.dataset.i;draw();
  });
  var save=document.getElementById('pSave');
  save.onclick=function(){
    DAYS[sel].hours+=60;DAYS[sel].tbt+=1;draw();
    save.textContent='Saved · totals updated';save.classList.add('done');
    setTimeout(function(){save.textContent='Save day';save.classList.remove('done');},1800);
  };
})();
