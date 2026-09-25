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
import { focusDesignerOnMap } from './components/SearchBox'

export default function App() {
  const locale = useStore((s) => s.locale)
  const mobile = useIsMobile()
  const init = useStore((s) => s.init)

  // Load designers + the signed-in account (if any) from the API.
  useEffect(() => {
    void init()
  }, [init])

  // Shared profile link (?d=<id>): once the map and data are ready, fly to that person and open them.
  const ready = useStore((s) => s.mapReady && s.designersLoaded)
  useEffect(() => {
    if (!ready) return
    const id = new URLSearchParams(window.location.search).get('d')
    const s = useStore.getState()
    if (id && (s.designers.some((d) => d.id === id) || s.account?.profile.id === id)) setTimeout(() => focusDesignerOnMap(id), 600)
  }, [ready])

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
