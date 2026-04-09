export function Footer() {
  return (
    <footer class="bg-sand py-12 border-t border-linen">
      <div class="max-w-[800px] mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <p class="font-display text-lg text-ink">The Right Decision</p>
            <p class="text-muted text-sm mt-1">
              Life transformation through action, not introspection.
            </p>
          </div>

          <div class="flex items-center gap-6 text-sm">
            <a href="/login" class="text-body hover:text-ink transition-colors">
              Already a student? Log in
            </a>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-linen text-center text-muted text-xs">
          <p>&copy; {new Date().getFullYear()} The Right Decision. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
