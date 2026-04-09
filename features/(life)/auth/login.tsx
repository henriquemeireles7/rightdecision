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
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              class="w-full px-md py-sm border border-linen rounded-sm bg-white text-ink"
            />
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
      window.location.href='/course';
    }).catch(function(ex){
      err.textContent=ex.message||'Something went wrong. Please try again.';
      err.classList.remove('hidden');
      loading.classList.add('hidden');
      form.querySelector('button[type=submit]').disabled=false;
    });
  });
})()`,
          }}
        />
      </div>
    </main>
  )
}
