/* Guardian Ghost integration v2 — Supabase Realtime, no SSE and no JWT in URLs. */
export const GhostEHS = {
  initialized:false, channel:null,
  config:{supabaseUrl:'',supabaseKey:'',adminPanelUrl:'./ghost-monitor.html'},
  async init(cfg={}) {
    if(this.initialized)return; Object.assign(this.config,cfg); this.initialized=true;
    this.injectStyles();
    if(!window.supabase) return;
    const client=window.__guardianSupabase || window.supabase.createClient(this.config.supabaseUrl,this.config.supabaseKey);
    const {data:{session}}=await client.auth.getSession();
    if(!session)return;
    const {data:profile}=await client.from('profiles').select('role').eq('id',session.user.id).single();
    if(profile?.role!=='master')return;
    this.client=client;
    this.channel=client.channel('guardian-ghost-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'ghost_events'},p=>this.onEvent(p.new)).subscribe(s=>this.setState(s==='SUBSCRIBED'));
    this.addButton();
  },
  setState(live){const el=document.querySelector('#ghost-live-dot');if(el){el.textContent=live?'● Ghost live':'○ Ghost offline';el.classList.toggle('live',live)}},
  onEvent(e){if(['high','critical'].includes(e.severity))this.notify(`${e.severity.toUpperCase()}: ${e.event}`,e.severity)},
  addButton(){if(document.querySelector('#ghost-monitor-btn'))return;const b=document.createElement('button');b.id='ghost-monitor-btn';b.textContent='🛡 Ghost monitor';b.onclick=()=>location.href=this.config.adminPanelUrl;document.body.appendChild(b);const d=document.createElement('span');d.id='ghost-live-dot';d.textContent='○ Ghost offline';document.body.appendChild(d);},
  notify(text,severity){const n=document.createElement('div');n.className='ghost-toast '+severity;n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),8000)},
  injectStyles(){if(document.querySelector('#ghost-v2-css'))return;const s=document.createElement('style');s.id='ghost-v2-css';s.textContent='#ghost-monitor-btn{position:fixed;right:18px;bottom:18px;z-index:9998;border:1px solid #334155;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:10px 13px;cursor:pointer}.ghost-toast{position:fixed;right:18px;top:18px;z-index:9999;max-width:420px;padding:13px 15px;border-radius:10px;background:#0f172a;color:#fff;border:1px solid #475569}.ghost-toast.high,.ghost-toast.critical{border-color:#ef4444}#ghost-live-dot{position:fixed;left:18px;bottom:18px;z-index:9998;padding:6px 10px;border-radius:999px;background:#0f172a;color:#94a3b8;font:12px ui-monospace,monospace}#ghost-live-dot.live{color:#34d399}';document.head.appendChild(s)},
  disconnect(){if(this.client&&this.channel)this.client.removeChannel(this.channel);this.channel=null;this.setState(false)}
};
