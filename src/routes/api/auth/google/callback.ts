import { createFileRoute } from '@tanstack/react-router'
import { finishGoogleLogin } from '../../../../server/auth/google'
import { openSession } from '../../../../server/router'

/** GET /api/auth/google/callback — Google sends the person back here after they approve. */
export const Route = createFileRoute('/api/auth/google/callback')({
  server: { handlers: { GET: ({ request }) => finishGoogleLogin(request, openSession) } },
})
