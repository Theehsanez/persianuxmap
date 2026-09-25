import { createFileRoute } from '@tanstack/react-router'
import { startGoogleLogin } from '../../../../server/auth/google'

/** GET /api/auth/google — redirects to Google's consent screen. */
export const Route = createFileRoute('/api/auth/google/')({
  server: { handlers: { GET: ({ request }) => startGoogleLogin(request) } },
})
