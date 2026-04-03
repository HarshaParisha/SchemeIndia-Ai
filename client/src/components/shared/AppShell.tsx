import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Footer from './Footer'
import Navbar from './Navbar'

export default function AppShell() {
  return (
    <div className="min-h-screen text-brand-dark">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-brand-border focus:bg-white/90 focus:px-4 focus:py-2 focus:text-sm focus:shadow-ambient"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-center" />
    </div>
  )
}
