import React from 'react'
import { Link } from 'react-router-dom'

export default function Header(){
  return (
    <header className="sticky top-0 z-40 bg-blackline/90 text-white">
      <div className=" mx-auto px-4 py-2 flex justify-center bg-blackline">
        <Link to="/" aria-label="Blackline Salon home">
          <img src="/img/logo-header.png" alt="Blackline Salon" className="h-12 w-auto logo-header" />
        </Link>
      </div>

      {/* thin silver separator placed under the logo to visually separate it from navigation */}
      <div className="w-full">
        <div className="h-px w-full bg-gradient-to-r from-blackline-accent/80 via-blackline-accent/60 to-blackline-accent/80" />
      </div>

      {/* navigation block with subtle translucent background for readability */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-center gap-8  backdrop-blur-sm">
        <Link to="/" className="text-lg text-blackline-muted/85 hover:text-white">Home</Link>
        <Link to="/inventory" className="text-lg text-blackline-muted/85 hover:text-white">Inventory</Link>
        <Link to="/contact" className="text-lg text-blackline-muted/85 hover:text-white">Contact</Link>
      </nav>
    </header>
  )
}
