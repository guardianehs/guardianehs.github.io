
(function(){
  const root=document.createElement('div');root.id='guardianAssistant';
  root.innerHTML=`
    <div class="ga-panel" id="gaPanel" role="dialog" aria-label="Guardian Assistant">
      <div class="ga-head">
        <div class="ga-mark"><img src="./web/components/guardian-mark.svg" alt="Guardian"></div>
        <div class="ga-title"><strong>Guardian Assistant</strong><span>🛡️ EHS reference · available on this page</span></div>
        <button class="ga-close" id="gaClose" aria-label="Close assistant">×</button>
      </div>
      <div class="ga-body" id="gaBody">
        <div class="ga-msg bot"><span class="ga-icon">🛡️</span><b>Hi — I’m Guardian.</b><br>Ask me about permits, risk assessment, incidents, audits, first aid, gas testing or compliance.</div>
      </div>
      <div class="ga-chips">
        <button class="ga-chip" data-q="What should I check before hot work?">🔥 Hot work</button>
        <button class="ga-chip" data-q="How do I score risk?">⚠️ Risk</button>
        <button class="ga-chip" data-q="What should I do after an incident?">🚨 Incident</button>
        <button class="ga-chip" data-q="What should a permit contain?">📋 Permit</button>
      </div>
      <div class="ga-footer">Decision support only — verify against your site procedure and applicable requirements. <a href="./app/">Open full Guardian →</a></div>
      <form class="ga-form" id="gaForm"><input id="gaInput" autocomplete="off" placeholder="Ask Guardian…"><button class="ga-send" aria-label="Send">➤</button></form>
    </div>
    <button class="ga-launch" id="gaLaunch" aria-expanded="false" aria-controls="gaPanel">
      <span class="ga-mark"><img src="./web/components/guardian-mark.svg" alt=""></span>
      <span class="ga-launch-text"><strong>Ask Guardian</strong><span>🟢 ready</span></span>
    </button>`;
  document.body.appendChild(root);

  const panel=root.querySelector('#gaPanel'), input=root.querySelector('#gaInput'), body=root.querySelector('#gaBody');
  const add=(who,html)=>{const el=document.createElement('div');el.className='ga-msg '+who;el.innerHTML=html;body.appendChild(el);body.scrollTop=body.scrollHeight};
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const answers=[
    {k:['hot work','welding','cutting','grinding'],a:'🔥 <b>Before hot work</b><br>Confirm the permit and task risk assessment, isolate the area, test the atmosphere where required, remove/cover combustibles, provide suitable extinguishing equipment and a fire watch, verify PPE and authorisation, then re-check controls if conditions change.'},
    {k:['risk','risk score','5x5','likelihood','severity'],a:'⚠️ <b>5×5 risk scoring</b><br>Score likelihood 1–5 × severity 1–5. Typical bands are 1–4 Low, 5–9 Medium, 10–14 High and 15–25 Critical. Apply controls using the hierarchy of controls and re-score the residual risk.'},
    {k:['incident','accident','injury','near miss'],a:'🚨 <b>Incident response</b><br>Make the area safe, protect people, provide appropriate first aid, preserve evidence, notify the responsible duty holder, record what happened and begin the review. Separate immediate correction from corrective action that prevents recurrence.'},
    {k:['permit','ptw','permit to work'],a:'📋 <b>Permit essentials</b><br>Define the work and location, identify hazards and controls, confirm competency and PPE, check isolations and required tests, record task-specific checks, obtain the required approvals, define validity and close the permit when work ends.'},
    {k:['gas','gas test','lel','oxygen','o2','h2s','co'],a:'🧪 <b>Gas testing</b><br>Use a calibrated and appropriately checked instrument. Record oxygen, flammable-gas/LEL and relevant toxic-gas readings before the work and at the frequency required by the permit/site procedure. Site and client acceptance limits always prevail.'},
    {k:['audit','compliance','iso 45001','standard'],a:'📚 <b>Audit & compliance</b><br>Identify the applicable requirement, record objective evidence, classify the gap, assign an owner and due date, then verify closure. Guardian supports ISO 45001/14001/9001 and other configured frameworks.'},
    {k:['first aid','burn','bleeding','electric shock','heat'],a:'🩹 <b>First aid</b><br>Get a trained first-aider and follow the site emergency procedure. For a serious or life-threatening event, contact local emergency services immediately. Guardian provides preparedness/reference guidance, not a substitute for medical care.'},
  ];
  function reply(q){const n=q.toLowerCase();let hit=answers.find(x=>x.k.some(k=>n.includes(k)));if(hit)return hit.a;return '🧠 <b>I can help with EHS topics.</b><br>Try asking about <b>hot work</b>, <b>permits</b>, <b>risk scoring</b>, <b>incidents</b>, <b>first aid</b>, <b>gas testing</b> or <b>audits</b>.<div class="ga-note">For the full contextual assistant, open Guardian.</div>'}
  function ask(q){q=q.trim();if(!q)return;add('user',esc(q));input.value='';setTimeout(()=>add('bot',reply(q)),120)}
  root.querySelector('#gaLaunch').onclick=()=>{const open=panel.classList.toggle('open');root.querySelector('#gaLaunch').setAttribute('aria-expanded',open);if(open)setTimeout(()=>input.focus(),50)};
  root.querySelector('#gaClose').onclick=()=>{panel.classList.remove('open');root.querySelector('#gaLaunch').setAttribute('aria-expanded','false')};
  root.querySelector('#gaForm').onsubmit=e=>{e.preventDefault();ask(input.value)};
  root.querySelectorAll('.ga-chip').forEach(b=>b.onclick=()=>ask(b.dataset.q));
})();
