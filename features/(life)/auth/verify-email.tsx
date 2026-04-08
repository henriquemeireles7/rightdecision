export function VerifyEmailPage({ success }: { success: boolean }) {
  if (success) {
    return (
      <main class="min-h-screen bg-cream flex items-center justify-center px-md">
        <div class="max-w-[440px] w-full text-center">
          <h1 class="font-display text-3xl text-ink mb-lg">Email verified</h1>
          <p class="text-secondary mb-xl">
            Your account is ready. Redirecting to your dashboard...
          </p>
          <a href="/course" class="text-accent hover:underline">
            Go to course
          </a>
        </div>
      </main>
    )
  }

  return (
    <main class="min-h-screen bg-cream flex items-center justify-center px-md">
      <div class="max-w-[440px] w-full text-center">
        <h1 class="font-display text-3xl text-ink mb-lg">Verification failed</h1>
        <p class="text-secondary mb-xl">
          This link may have expired. Request a new verification email from your account settings.
        </p>
        <a href="/login" class="text-accent hover:underline">
          Back to login
        </a>
      </div>
    </main>
  )
}
