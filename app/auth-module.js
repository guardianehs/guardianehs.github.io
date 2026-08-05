/* ================================================================
   GUARDIAN — AUTHENTICATION
   Self-signup · email confirmation · TOTP two-factor

   Drop this into app and console. It expects three things to
   already exist in the host page:
       sb        the Supabase client
       $(sel)    querySelector helper
       esc(t)    HTML escaper

   Two-factor uses Supabase's own MFA (TOTP, RFC 6238) — the same
   thing Google Authenticator, 1Password and Authy speak. Codes are
   verified by Supabase, never by this page, so a tampered client
   cannot talk its way past the second factor.
   ================================================================ */

const AUTH = {
  /* where the confirmation email should land people back */
  redirectTo: location.origin + location.pathname,

  /* ---------------------------------------------------------- */
  /* 1. SIGN UP — with email confirmation                        */
  /* ---------------------------------------------------------- */
  async signUp(email, password, fullName){
    email = String(email||'').trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return {ok:false, error:'That does not look like an email address.'};
    if(String(password||'').length < 8)
      return {ok:false, error:'Use at least 8 characters. Longer is better than complicated.'};

    const {data, error} = await sb.auth.signUp({
      email, password,
      options:{
        emailRedirectTo: AUTH.redirectTo,
        data:{ full_name: String(fullName||'').trim() || email.split('@')[0] }
      }
    });
    if(error) return {ok:false, error: AUTH.readable(error)};

    /* Supabase returns a user with no session when confirmation is on.
       That is the signal the email has been sent and nothing else
       should happen until they click it. */
    if(data.user && !data.session)
      return {ok:true, pending:true,
        message:'Check '+email+' and click the link to confirm your account. '
               +'The link expires in 24 hours. Look in spam if it has not arrived in a minute.'};

    return {ok:true, pending:false, message:'Account created.'};
  },

  async resendConfirmation(email){
    const {error} = await sb.auth.resend({
      type:'signup', email:String(email||'').trim().toLowerCase(),
      options:{ emailRedirectTo: AUTH.redirectTo }
    });
    return error ? {ok:false, error:AUTH.readable(error)}
                 : {ok:true, message:'Sent again. Give it a minute, and check spam.'};
  },

  /* ---------------------------------------------------------- */
  /* 2. SIGN IN — and detect when a second factor is required    */
  /* ---------------------------------------------------------- */
  async signIn(email, password){
    const {data, error} = await sb.auth.signInWithPassword({
      email:String(email||'').trim().toLowerCase(), password
    });
    if(error) return {ok:false, error: AUTH.readable(error)};

    const need = await AUTH.mfaRequired();
    if(need.required)
      return {ok:true, mfa:true, factorId:need.factorId,
              message:'Enter the 6-digit code from your authenticator app.'};

    return {ok:true, mfa:false, user:data.user};
  },

  /* Signed in, but only at the first level? Then a factor is enrolled
     and still has to be satisfied. Supabase reports this as
     currentLevel aal1 while nextLevel is aal2. */
  async mfaRequired(){
    try{
      const {data, error} = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if(error || !data) return {required:false};
      if(data.currentLevel === data.nextLevel) return {required:false};

      const {data:list} = await sb.auth.mfa.listFactors();
      const f = (list && list.totp && list.totp.find(x=>x.status==='verified')) || null;
      return f ? {required:true, factorId:f.id} : {required:false};
    }catch(e){ return {required:false}; }
  },

  /* ---------------------------------------------------------- */
  /* 3. SECOND FACTOR — challenge and verify                     */
  /* ---------------------------------------------------------- */
  async verifyCode(factorId, code){
    code = String(code||'').replace(/\D/g,'');
    if(code.length !== 6) return {ok:false, error:'The code is six digits.'};
    try{
      const {data:ch, error:e1} = await sb.auth.mfa.challenge({factorId});
      if(e1) return {ok:false, error:AUTH.readable(e1)};

      const {error:e2} = await sb.auth.mfa.verify({
        factorId, challengeId: ch.id, code
      });
      if(e2) return {ok:false,
        error: /invalid|incorrect/i.test(e2.message)
          ? 'That code was not accepted. Codes last 30 seconds — wait for the next one and try again.'
          : AUTH.readable(e2)};

      return {ok:true};
    }catch(e){ return {ok:false, error:e.message}; }
  },

  /* ---------------------------------------------------------- */
  /* 4. ENROL A NEW AUTHENTICATOR                                */
  /* ---------------------------------------------------------- */
  async enrolStart(friendlyName){
    try{
      /* clear an abandoned half-finished enrolment first, or the
         next attempt fails with "factor already exists" */
      const {data:list} = await sb.auth.mfa.listFactors();
      const stale = (list && list.totp || []).filter(f=>f.status!=='verified');
      for(const f of stale){ try{ await sb.auth.mfa.unenroll({factorId:f.id}); }catch(e){} }

      const {data, error} = await sb.auth.mfa.enroll({
        factorType:'totp',
        friendlyName: String(friendlyName||'Guardian').slice(0,40)
      });
      if(error) return {ok:false, error:AUTH.readable(error)};
      return {ok:true, factorId:data.id, qr:data.totp.qr_code, secret:data.totp.secret};
    }catch(e){ return {ok:false, error:e.message}; }
  },

  /* the same verify call completes an enrolment */
  async enrolFinish(factorId, code){
    const r = await AUTH.verifyCode(factorId, code);
    return r.ok ? {ok:true, message:'Two-factor authentication is on. You will be asked for a code each time you sign in.'} : r;
  },

  async listFactors(){
    try{
      const {data} = await sb.auth.mfa.listFactors();
      return (data && data.totp) || [];
    }catch(e){ return []; }
  },

  async removeFactor(factorId){
    const {error} = await sb.auth.mfa.unenroll({factorId});
    return error ? {ok:false, error:AUTH.readable(error)}
                 : {ok:true, message:'Two-factor authentication removed. Your account is now protected by password alone.'};
  },

  /* ---------------------------------------------------------- */
  /* 5. PASSWORD RESET                                           */
  /* ---------------------------------------------------------- */
  async sendReset(email){
    const {error} = await sb.auth.resetPasswordForEmail(
      String(email||'').trim().toLowerCase(),
      {redirectTo: AUTH.redirectTo + '?reset=1'}
    );
    /* deliberately the same answer whether or not the address exists —
       otherwise this endpoint tells an attacker who has an account */
    return {ok:true, message:'If that address has an account, a reset link is on its way.'};
  },

  async setPassword(newPassword){
    if(String(newPassword||'').length < 8)
      return {ok:false, error:'Use at least 8 characters.'};
    const {error} = await sb.auth.updateUser({password:newPassword});
    return error ? {ok:false, error:AUTH.readable(error)} : {ok:true, message:'Password changed.'};
  },

  /* ---------------------------------------------------------- */
  /* 6. Turn Supabase errors into something a person can act on  */
  /* ---------------------------------------------------------- */
  readable(e){
    const m = String((e && e.message) || e || '');
    if(/email not confirmed/i.test(m))
      return 'That account has not been confirmed yet. Click the link in the email we sent, or ask for a new one.';
    if(/invalid login credentials/i.test(m))
      return 'That email and password do not match an account.';
    if(/user already registered/i.test(m))
      return 'There is already an account with that address. Sign in, or reset the password.';
    if(/rate limit|too many/i.test(m))
      return 'Too many attempts. Wait a minute and try again.';
    if(/weak password/i.test(m))
      return 'That password is too easy to guess. Use a longer one.';
    if(/factor.*already|already.*enrolled/i.test(m))
      return 'An authenticator is already set up on this account. Remove it before adding another.';
    return m || 'Something went wrong.';
  },

  /* handle links arriving from an email (confirm / reset / invite) */
  async handleEmailLink(){
    const qs = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/,''));
    const err = qs.get('error_description') || hash.get('error_description');
    if(err) return {kind:'error', message:decodeURIComponent(err).replace(/\+/g,' ')};

    if(qs.get('code')){
      const {error} = await sb.auth.exchangeCodeForSession(qs.get('code'));
      history.replaceState(null,'',location.pathname);
      if(error) return {kind:'error', message:AUTH.readable(error)};
      return {kind: qs.get('reset') ? 'reset' : 'confirmed'};
    }
    if(hash.get('access_token')){
      history.replaceState(null,'',location.pathname);
      return {kind: hash.get('type')==='recovery' ? 'reset' : 'confirmed'};
    }
    return {kind:'none'};
  }
};

/* ================================================================
   MINIMAL UI HELPERS
   The host page owns its own styling; these only build the markup
   that the flows above need.
   ================================================================ */
const AUTH_UI = {
  /* the 2FA code box — six digits, pasteable, auto-submitting */
  codeBox(onSubmit){
    return {
      html:'<div class="fld"><label for="mfaCode">Authentication code</label>'
        +'<input id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" '
        +'placeholder="000000" style="text-align:center;letter-spacing:.4em;font-size:20px;'
        +'font-family:\'IBM Plex Mono\',monospace"></div>'
        +'<p style="font-size:12px;color:var(--text-3);line-height:1.55">'
        +'From your authenticator app. Codes change every 30 seconds — if one is refused, wait for the next.</p>',
      bind(){
        const el = $('#mfaCode'); if(!el) return;
        el.focus();
        el.addEventListener('input', ()=>{
          el.value = el.value.replace(/\D/g,'').slice(0,6);
          if(el.value.length === 6) onSubmit(el.value);
        });
        el.addEventListener('keydown', e=>{
          if(e.key === 'Enter' && el.value.length === 6) onSubmit(el.value);
        });
      }
    };
  },

  /* the enrolment panel — QR plus the secret for anyone who cannot scan */
  enrolPanel(qr, secret){
    return '<p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:14px">'
      +'Scan this with an authenticator app — Google Authenticator, Authy, 1Password or similar. '
      +'It works offline; no text messages are involved.</p>'
      +'<div style="text-align:center;padding:16px;background:#fff;border:1px solid var(--border);'
      +'border-radius:12px;margin-bottom:14px"><img src="'+qr+'" alt="Two-factor QR code" '
      +'style="width:190px;height:190px"></div>'
      +'<details style="margin-bottom:14px"><summary style="font-size:12.5px;cursor:pointer;color:var(--text-2)">'
      +'Cannot scan it?</summary>'
      +'<p style="font-size:12px;color:var(--text-3);margin:8px 0 6px">Enter this key by hand instead:</p>'
      +'<code style="display:block;padding:10px;background:var(--surface-2);border-radius:7px;'
      +'font-size:12.5px;word-break:break-all;letter-spacing:.05em">'+esc(secret)+'</code></details>';
  },

  /* what to say once an account is waiting on its confirmation email */
  pending(email){
    return '<div style="text-align:center;padding:10px 0">'
      +'<div style="width:52px;height:52px;border-radius:14px;background:var(--accent-soft);'
      +'display:grid;place-items:center;margin:0 auto 16px">'
      +'<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
      +'<rect x="3" y="5" width="18" height="14" rx="2" stroke="#0F766E" stroke-width="1.6"/>'
      +'<path d="m3 7 9 6 9-6" stroke="#0F766E" stroke-width="1.6" stroke-linejoin="round"/></svg></div>'
      +'<h3 style="font-size:17px;margin-bottom:8px">Confirm your email</h3>'
      +'<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">'
      +'We sent a link to <b>'+esc(email)+'</b>. Click it to finish setting up your account.<br><br>'
      +'The link lasts 24 hours. If it has not arrived within a minute, check your spam folder.</p></div>';
  }
};
