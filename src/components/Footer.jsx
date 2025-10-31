import React from 'react'

export default function Footer(){
  return (
    <footer className="mt-12 bg-blackline text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold text-white mb-2">Blackline Salon</h4>
          <p className="text-sm">Premium & exotic cars showroom.</p>
          <p className="text-sm mt-3">123 Luxury Ave, Warsaw, PL</p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Navigation</h4>
          <ul className="text-sm space-y-1">
            <li><a className="hover:underline" href="#">Home</a></li>
            <li><a className="hover:underline" href="#inventory">Inventory</a></li>
            <li><a className="hover:underline" href="#contact">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Follow us</h4>
          <div className="flex items-center gap-3">
            <a className="text-sm hover:underline" href="#">Instagram</a>
            <a className="text-sm hover:underline" href="#">Facebook</a>
            <a className="text-sm hover:underline" href="#">LinkedIn</a>
          </div>
          <p className="text-xs text-gray-400 mt-4">© {new Date().getFullYear()} Blackline Salon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
