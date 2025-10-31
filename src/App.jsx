import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import Header from './components/Header'
import Footer from './components/Footer'
// import Contact from './pages/Contact'

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          {/* <Route path="/contact" element={<Contact />} /> */}
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}
