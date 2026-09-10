const ICONS = {
  guardian: '<span class="reply-icon guardian-icon" aria-hidden="true">🛡️</span>',
  safety: '<span class="reply-icon" aria-hidden="true">⚠️</span>',
  evidence: '<span class="reply-icon" aria-hidden="true">📋</span>',
  realtime: '<span class="reply-icon" aria-hidden="true">⚡</span>'
};

class GuardianChatDemo extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="chat-demo" aria-label="Guardian assistant reply example">
        <div class="chat-head"><span class="live-dot"></span><strong>Guardian AI</strong><span>domain-aware reply</span></div>
        <div class="chat-msg user-msg">What should I check before hot work starts?</div>
        <div class="chat-msg assistant-msg">
          ${ICONS.guardian}
          <div><strong>Before authorisation</strong><p>${ICONS.safety} Confirm the permit, gas test, isolation and fire controls. ${ICONS.evidence} Attach the JSA and toolbox-talk evidence. ${ICONS.realtime} If a control changes, re-verify before issue.</p></div>
        </div>
      </div>`;
  }
}
customElements.define('guardian-chat-demo', GuardianChatDemo);
