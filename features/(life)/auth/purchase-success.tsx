export function PurchaseSuccessPage({ email }: { email?: string }) {
	return (
		<main class="min-h-screen bg-cream flex items-center justify-center px-md">
			<div class="max-w-[480px] w-full">
				<div class="text-center mb-xl">
					<h1 class="font-display text-3xl text-ink mb-md">Payment confirmed</h1>
					<p class="text-secondary">
						Create your account to access the course.
					</p>
					<p class="text-sm text-muted mt-sm">$197.00/year — Right Decision: The Course</p>
				</div>

				<form id="signup-form" class="space-y-md">
					<div>
						<label for="email" class="block text-sm font-medium text-ink mb-xs">
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							value={email}
							readonly={!!email}
							class={`w-full px-md py-sm border border-linen rounded-sm bg-white text-ink ${email ? 'bg-sand text-secondary' : ''}`}
						/>
					</div>
					<div>
						<label for="name" class="block text-sm font-medium text-ink mb-xs">
							Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							class="w-full px-md py-sm border border-linen rounded-sm bg-white text-ink"
							placeholder="Your name"
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
							placeholder="At least 8 characters"
						/>
					</div>
					<button
						type="submit"
						class="w-full bg-accent text-white py-md rounded-sm font-semibold hover:bg-accent-hover transition-colors text-lg"
					>
						Create Account & Start the Course
					</button>
				</form>

				<div id="signup-error" class="mt-md text-center text-error hidden" />
				<div id="signup-loading" class="mt-md text-center text-secondary hidden">
					Creating your account...
				</div>
			</div>
		</main>
	)
}
