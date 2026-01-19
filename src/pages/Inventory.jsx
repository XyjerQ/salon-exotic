import React from 'react'
import { useNavigate } from 'react-router-dom'
import CarCard from '../components/CarCard'
import cars from '../data/cars.json'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function Inventory() {
  const gridRef = useScrollAnimation({ staggerChildren: true })
  const navigate = useNavigate()

  const handleViewDetails = (carId) => {
    navigate(`/car/${carId}`)
  }

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      <div  className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">Inventory</h1>
          <p className="text-gray-300 mt-3 text-lg">Premium & exotic vehicles</p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div ref={gridRef} className="opacity-0-init grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <div key={car.id} className="opacity-0-init">
              <CarCard car={car} onViewDetails={() => handleViewDetails(car.id)} />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}