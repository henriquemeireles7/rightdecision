/**
 * Validate a post-login `?next` redirect target. Returns the path only if it is a
 * SAME-ORIGIN relative path (a single leading '/', no scheme, no host); otherwise
 * falls back to '/course'. This blocks open-redirects: protocol-relative '//evil.com',
 * absolute 'https://evil.com', and backslash tricks ('/\evil.com') are all rejected.
 * The inline login script duplicates this exact logic (it can't import) — keep them in
 * sync; this exported copy is what the tests pin.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return '/course'
  // Must start with exactly one forward slash (relative path), and never '//' or '/\'.
  if (next[0] !== '/' || next[1] === '/' || next[1] === '\\') return '/course'
  // Reject backslashes and any control char (< 0x20) — they could confuse the browser
  // into treating the value as a host/scheme. Checked by code point, not a control-char
  // regex (which Biome flags).
  for (let i = 0; i < next.length; i++) {
    const code = next.charCodeAt(i)
    if (code < 0x20 || code === 0x5c /* backslash */) return '/course'
  }
  return next
}

export function LoginPage() {
  return (
    <main class="min-h-screen bg-cream flex items-center justify-center px-md">
      <div class="max-w-[440px] w-full">
        <h1 class="font-display text-3xl text-ink mb-lg text-center">Log in</h1>
        <p class="text-secondary mb-xl text-center">
          Welcome back. Enter your email and password to continue.
        </p>
        <form id="login-form" class="space-y-md">
          <div>
            <label for="email" class="block text-sm font-medium text-ink mb-xs">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full px-md py-sm border border-linen rounded-sm bg-white text-ink"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-ink mb-xs">
              Password
            </label>
            <div class="relative">
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                class="w-full px-md py-sm border border-linen rounded-sm bg-white text-ink pr-[44px]"
              />
              <button
                type="button"
                id="toggle-password"
                class="absolute right-0 top-0 h-full px-sm flex items-center text-muted hover:text-ink transition-colors"
                aria-label="Show password"
              >
                <svg
                  id="eye-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  role="img"
                >
                  <title>Show password</title>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  id="eye-off-icon"
                  class="hidden"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  role="img"
                >
                  <title>Hide password</title>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>
          <button
            type="submit"
            class="w-full bg-accent text-white py-sm rounded-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Log in
          </button>
        </form>
        <div id="login-error" class="mt-md text-center text-error hidden" />
        <div id="login-loading" class="mt-md text-center text-secondary hidden">
          Signing in...
        </div>
        <div class="mt-lg flex items-center gap-sm">
          <div class="flex-1 border-t border-linen" />
          <span class="text-xs text-muted">or</span>
          <div class="flex-1 border-t border-linen" />
        </div>
        <button
          id="google-btn"
          type="button"
          class="mt-lg w-full flex items-center justify-center gap-sm border border-linen rounded-sm py-sm px-md bg-white hover:bg-sand transition-colors font-medium text-ink"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
          >
            <title>Google</title>
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        <p class="mt-xl text-center text-sm text-muted">
          <a href="/forgot-password" class="text-accent hover:underline">
            Forgot your password?
          </a>
        </p>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var form=document.getElementById('login-form');
  var err=document.getElementById('login-error');
  var loading=document.getElementById('login-loading');
  var toggleBtn=document.getElementById('toggle-password');
  var pwInput=document.getElementById('password');
  var eyeIcon=document.getElementById('eye-icon');
  var eyeOffIcon=document.getElementById('eye-off-icon');

  // Same-origin relative redirect target from ?next (mirror of safeNextPath — keep in sync).
  function safeNext(){
    var next=new URLSearchParams(window.location.search).get('next');
    if(!next) return '/course';
    if(next.charAt(0)!=='/'||next.charAt(1)==='/'||next.charAt(1)==='\\\\') return '/course';
    for(var i=0;i<next.length;i++){var code=next.charCodeAt(i);if(code<32||code===92) return '/course';}
    return next;
  }
  var nextPath=safeNext();

  toggleBtn.addEventListener('click',function(){
    var isPassword=pwInput.type==='password';
    pwInput.type=isPassword?'text':'password';
    toggleBtn.setAttribute('aria-label',isPassword?'Hide password':'Show password');
    eyeIcon.classList.toggle('hidden');
    eyeOffIcon.classList.toggle('hidden');
  });

  form.addEventListener('submit',function(e){
    e.preventDefault();
    err.classList.add('hidden');
    loading.classList.remove('hidden');
    form.querySelector('button[type=submit]').disabled=true;
    fetch('/api/auth/sign-in/email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({
        email:form.email.value.trim().toLowerCase(),
        password:form.password.value
      })
    }).then(function(r){
      if(!r.ok) return r.json().catch(function(){return {}}).then(function(d){throw new Error(d.message||'Invalid email or password')});
      window.location.href=nextPath;
    }).catch(function(ex){
      err.textContent=ex.message||'Something went wrong. Please try again.';
      err.classList.remove('hidden');
      loading.classList.add('hidden');
      form.querySelector('button[type=submit]').disabled=false;
    });
  });

  document.getElementById('google-btn').addEventListener('click',function(){
    window.location.href='/api/auth/sign-in/social?provider=google&callbackURL='+encodeURIComponent(nextPath);
  });
})()`,
          }}
        />
      </div>
    </main>
  )
}
