export function ForgotPasswordPage() {
	return (
		<main class="min-h-screen bg-cream flex items-center justify-center px-md">
			<div class="max-w-[440px] w-full">
				<h1 class="font-display text-3xl text-ink mb-lg text-center">Reset your password</h1>
				<p class="text-secondary mb-xl text-center">
					Enter your email and we'll send you a link to reset your password.
				</p>
				<form id="forgot-form" class="space-y-md">
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
					<button
						type="submit"
						class="w-full bg-accent text-white py-sm rounded-sm font-semibold hover:bg-accent-hover transition-colors"
					>
						Send Reset Link
					</button>
				</form>
				<div id="forgot-message" class="mt-md text-center text-secondary hidden">
					If an account exists with that email, we sent a reset link. Check your inbox.
				</div>
				<p class="mt-xl text-center text-sm text-muted">
					<a href="/login" class="text-accent hover:underline">
						Back to login
					</a>
				</p>
			</div>
		</main>
	)
}
