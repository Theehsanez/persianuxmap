import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import appCss from '../index.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#0a0b0d' },
      { title: 'Persian UX Map — نقشه طراحان فارسی‌زبان در سراسر جهان' },
      { name: 'description', content: 'Persian designers around the world.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: `${import.meta.env.BASE_URL}favicon.svg` },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
})

// Persian (RTL) is the default; the app switches lang/dir on the client when someone picks English.
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
