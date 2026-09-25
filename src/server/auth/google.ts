import { randomBytes } from 'node:crypto'

/**
 * "Sign in with Google" — OAuth 2.0 authorization-code flow (OpenID Connect).
 * Enabled when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. The redirect URI to register in
 * Google Cloud is `<your site>/api/auth/google/callback`.
 */
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())

const STATE_COOKIE = 'pux_oauth_state'

/** Public origin of the site. APP_URL wins (useful behind proxies); otherwise the request's own origin. */
const origin = (req: Request) => process.env.APP_URL?.trim().replace(/\/$/, '') || new URL(req.url).origin
const redirectUri = (req: Request) => `${origin(req)}/api/auth/google/callback`

function cookie(req: Request, value: string, maxAge: number) {
  const secure = origin(req).startsWith('https:') ? '; Secure' : ''
  return `${STATE_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function readCookie(req: Request, name: string) {
  return req.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(name + '='))
    ?.slice(name.length + 1)
}

/** Back to the app. Results travel in the URL fragment, which browsers never send to servers or logs. */
function backToApp(req: Request, params: Record<string, string>) {
  const hash = new URLSearchParams(params).toString()
  return new Response(null, { status: 302, headers: { location: `${origin(req)}/#${hash}`, 'set-cookie': cookie(req, '', 0) } })
}

export function startGoogleLogin(req: Request) {
  if (!googleEnabled()) return new Response('Google sign-in is not configured', { status: 404 })
  const state = randomBytes(24).toString('base64url')
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString()
  return new Response(null, { status: 302, headers: { location: url.toString(), 'set-cookie': cookie(req, state, 600) } })
}

type GoogleUser = { email: string; email_verified: boolean; name?: string; picture?: string }

export async function finishGoogleLogin(req: Request, openSession: (email: string, provider: 'google') => Promise<{ token: string }>) {
  const params = new URL(req.url).searchParams
  const code = params.get('code')
  const state = params.get('state')
  // CSRF protection: the state we set in a cookie must come back unchanged.
  if (!code || !state || state !== readCookie(req, STATE_COOKIE)) return backToApp(req, { auth_error: 'google' })
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: redirectUri(req),
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}: ${(await tokenRes.text()).slice(0, 200)}`)
    const { access_token } = (await tokenRes.json()) as { access_token: string }
    // Ask Google who this is over TLS (avoids hand-verifying the ID token's signature).
    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${access_token}` } })
    if (!userRes.ok) throw new Error(`userinfo ${userRes.status}`)
    const user = (await userRes.json()) as GoogleUser
    if (!user.email || !user.email_verified) return backToApp(req, { auth_error: 'google_unverified' })
    const { token } = await openSession(user.email.toLowerCase(), 'google')
    return backToApp(req, { auth: 'google', token, email: user.email, name: user.name ?? '', picture: user.picture ?? '' })
  } catch (e) {
    console.error('[google]', e)
    return backToApp(req, { auth_error: 'google' })
  }
}
