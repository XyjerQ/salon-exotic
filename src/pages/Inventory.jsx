import React from 'react'
import CarCard from '../components/CarCard'
import cars from '../data/cars.json'

export default function Inventory() {
  return (
    <main className="py-12">
      <div className="rounded-lg overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold">Inventory</h1>
            <p className="text-gray-300 mt-1">Premium cars available at the showroom</p>
          </header>

          <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </section>
        </div>
      </div>
    </main>
  )
}