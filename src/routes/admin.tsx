import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LogoMark } from '../components/ui'

const AdminApp = lazy(() => import('../admin/AdminApp'))

// Moderation panel. Client-rendered; every action is checked on the server (ADMIN_EMAILS).
export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin — Persian UX Map' }, { name: 'robots', content: 'noindex' }] }),
  component: () => (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center bg-bg">
          <LogoMark size={40} />
        </div>
      }
    >
      <AdminApp />
    </Suspense>
  ),
})
