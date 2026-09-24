import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LogoMark } from '../components/ui'

// The map (MapLibre, WebGL) only runs in the browser: this route is client-rendered and the app is code-split.
const App = lazy(() => import('../App'))

function Splash() {
  return (
    <div className="grid h-dvh place-items-center bg-bg">
      <LogoMark size={48} />
    </div>
  )
}

export const Route = createFileRoute('/')({
  ssr: false,
  component: () => (
    <Suspense fallback={<Splash />}>
      <App />
    </Suspense>
  ),
  pendingComponent: Splash,
})
