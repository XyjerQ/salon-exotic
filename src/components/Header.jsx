import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

export default function Header(){
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-10 text-white bg-gradient-to-b from-black to-transparent ">
      <div className=" mx-auto px-4 h-16 md:h-20 grid grid-cols-3 items-center relative">
        {/* left: burger aligned to grid start */}
        <div className="flex items-center justify-start">
          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            className="p-2 rounded-md hover:bg-blackline/30 focus:outline-none focus:ring-2 focus:ring-blackline-accent flex items-center text-white"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18" />
                  <path d="M3 6h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
            <span className="ml-2 font-semibold hidden md:inline">Menu</span>
          </button>
        </div>

        {/* center: brand title */}
        <div className="flex justify-center">
          <Link to="/" aria-label="Blackline Salon home">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-widest uppercase" style={{ fontFamily: '\"Playfair Display\", serif' }}>
              Blackline
            </h1>
          </Link>
        </div>

        {/* right spacer to keep title centered */}
        <div className="flex justify-end">
          <div className="w-10 md:w-16" />
        </div>

        {/* thin silver separator placed under the header */}
      </div>

      {/* menu/backdrop rendered in a portal so it can't be covered by transformed stacking contexts */}
      {createPortal(
        <>
          <div
            className={`fixed inset-y-0 left-0 z-50 w-80 md:w-96 transform bg-white p-8 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            aria-hidden={!open}
          >
            <nav className="space-y-6 mt-6">
              <Link to="/" className="block text-2xl md:text-3xl text-black font-semibold" onClick={() => setOpen(false)}>Home</Link>
              <Link to="/inventory" className="block text-2xl md:text-3xl text-black font-semibold" onClick={() => setOpen(false)}>Inventory</Link>
              <Link to="/contact" className="block text-2xl md:text-3xl text-black font-semibold" onClick={() => setOpen(false)}>Contact</Link>
            </nav>

            {/* close button positioned just outside the menu (moves with the menu) */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className={`absolute top-6 right-[-3rem] md:right-[-3.5rem] z-50 p-3 text-white shadow-lg transition-all duration-200 ${open ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-6 pointer-events-none'}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* backdrop when menu is open */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setOpen(false)}
            aria-hidden={!open}
          />
        </>,
        document.body
      )}
    </header>
  )
}
