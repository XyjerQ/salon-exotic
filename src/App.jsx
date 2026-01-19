import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import CarDetails from './pages/CarDetails'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Header from './components/Header'
import Footer from './components/Footer'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}
