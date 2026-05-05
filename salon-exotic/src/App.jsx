import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import CarDetails from './pages/CarDetails'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import EmployeeLogin from './pages/EmployeeLogin'
import EmployeeProfile from './pages/EmployeeProfile'
import AdminDashboard from './pages/AdminDashboard'
import Header from './components/Header'
import Footer from './components/Footer'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function AppContent() {
  const { pathname } = useLocation()
  
  // Ukryj header i footer dla admin panel i login
  const hideHeaderFooter = pathname.includes('/employee/login') || pathname.includes('/admin/') || pathname.includes('/employee/profile/')

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/profile/:id" element={<EmployeeProfile />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  )
}
