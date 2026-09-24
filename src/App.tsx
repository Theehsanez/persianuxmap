import { useEffect } from 'react'
import { MapView } from './map/MapView'
import { useStore } from './lib/store'
import { DesktopTopBar, MobileDock, MobileTopBar } from './components/TopBar'
import { ProfileDrawer } from './components/Profile'
import { ExplorePanel } from './components/Explore'
import { FilterSheet } from './components/Filters'
import { Onboarding } from './components/Onboarding'
import { EmptyMapState, LoadingScreen, MapControls, ReportDialog, StatsCard, Toasts, ZoomHint } from './components/Overlays'
import { useIsMobile } from './components/ui'
import { DICTS } from './lib/i18n'

export default function App() {
  const locale = useStore((s) => s.locale)
  const mobile = useIsMobile()
  const init = useStore((s) => s.init)

  // Load designers + the signed-in account (if any) from the API.
  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const html = document.documentElement
    html.lang = locale
    html.dir = locale === 'fa' ? 'rtl' : 'ltr'
    document.title = locale === 'fa' ? `Persian UX Map — ${DICTS.fa.tagline}` : `Persian UX Map — ${DICTS.en.tagline}`
  }, [locale])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <MapView />
      <LoadingScreen />
      <EmptyMapState />
      {mobile ? (
        <>
          <MobileTopBar />
          <MapControls />
          <MobileDock />
          <FilterSheet />
        </>
      ) : (
        <>
          <DesktopTopBar />
          <StatsCard />
          <MapControls />
          <ZoomHint />
        </>
      )}
      <ExplorePanel />
      <ProfileDrawer />
      <ReportDialog />
      <Onboarding />
      <Toasts />
    </div>
  )
}
