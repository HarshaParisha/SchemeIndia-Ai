import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppShell from '@/components/shared/AppShell'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import InstallPromptBanner from '@/components/shared/InstallPromptBanner'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ROUTES } from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'

const Landing = lazy(() => import('@/pages/Landing'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Disha = lazy(() => import('@/pages/Disha'))
const Categories = lazy(() => import('@/pages/Categories'))
const CategoryDetail = lazy(() => import('@/pages/CategoryDetail'))
const About = lazy(() => import('@/pages/About'))
const Search = lazy(() => import('@/pages/Search'))
const Schemes = lazy(() => import('@/pages/Schemes'))
const SchemeDetail = lazy(() => import('@/pages/SchemeDetail'))
const States = lazy(() => import('@/pages/States'))
const StateDetail = lazy(() => import('@/pages/StateDetail'))
const Wellness = lazy(() => import('@/pages/Wellness'))
const PeerRooms = lazy(() => import('@/pages/PeerRooms'))
const Journal = lazy(() => import('@/pages/Journal'))
const Profile = lazy(() => import('@/pages/Profile'))
const DocumentHelper = lazy(() => import('@/pages/DocumentHelper'))
const Offline = lazy(() => import('@/pages/Offline'))

function AppRoutes() {
  const { setInstallPromptEvent } = useAppStore()

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [setInstallPromptEvent])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <InstallPromptBanner />
        <Suspense fallback={<LoadingSpinner label="Loading…" />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path={ROUTES.landing} element={<Landing />} />
              <Route path={ROUTES.categories} element={<Categories />} />
              <Route path={ROUTES.categoryDetail} element={<CategoryDetail />} />
              <Route path={ROUTES.about} element={<About />} />
              <Route path={ROUTES.search} element={<Search />} />
              <Route path={ROUTES.schemes} element={<Schemes />} />
              <Route path="/schemes/:id" element={<SchemeDetail />} />
              <Route path={ROUTES.states} element={<States />} />
              <Route path={ROUTES.stateDetail} element={<StateDetail />} />
              <Route path={ROUTES.stateAlias} element={<StateDetail />} />
              <Route path={ROUTES.onboarding} element={<Onboarding />} />

              <Route path={ROUTES.dashboard} element={<Dashboard />} />
              <Route path={ROUTES.disha} element={<Disha />} />
              <Route path={ROUTES.wellness} element={<Wellness />} />
              <Route path={ROUTES.rooms} element={<PeerRooms />} />
              <Route path={ROUTES.journal} element={<Journal />} />
              <Route path={ROUTES.documents} element={<DocumentHelper />} />
              <Route path={ROUTES.profile} element={<Profile />} />
              <Route path={ROUTES.offline} element={<Offline />} />

              <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default function App() {
  return <AppRoutes />
}
