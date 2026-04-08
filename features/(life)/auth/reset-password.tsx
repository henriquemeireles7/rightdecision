export function ResetPasswordPage() {
  return (
    <main class="min-h-screen bg-cream flex items-center justify-center px-md">
      <div class="max-w-[440px] w-full">
        <h1 class="font-display text-3xl text-ink mb-lg text-center">Set a new password</h1>
        <form id="reset-form" class="space-y-md">
          <div>
            <label for="password" class="block text-sm font-medium text-ink mb-xs">
              New password
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
          <div>
            <label for="confirm" class="block text-sm font-medium text-ink mb-xs">
              Confirm password
            </label>
            <input
              type="password"
              id="confirm"
              name="confirm"
              required
              minLength={8}
              class="w-full px-md py-sm border border-linen rounded-sm bg-white text-ink"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-accent text-white py-sm rounded-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Update Password
          </button>
        </form>
        <div id="reset-success" class="mt-md text-center text-success hidden">
          Password updated. Redirecting to login...
        </div>
        <div id="reset-error" class="mt-md text-center text-error hidden">
          This link has expired.{' '}
          <a href="/forgot-password" class="text-accent hover:underline">
            Request a new one.
          </a>
        </div>
      </div>
    </main>
  )
}
