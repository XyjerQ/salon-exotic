import React from 'react'

export default function CarCard({ car }) {
  return (
    <article className="bg-blackline-surface border border-blackline-surface rounded-lg overflow-hidden flex flex-col">
      <div className="h-48 sm:h-56 w-full overflow-hidden bg-blackline-surface">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/fallback.svg' }}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-white">
            {car.make} {car.model}
          </h3>
          <span className="text-sm text-blackline-muted">{car.year}</span>
        </div>
        <p className="text-blackline-accent font-bold text-xl mt-2">{car.price}</p>
        <p className="text-sm text-blackline-muted mt-2 flex-1">{car.description}</p>
        <ul className="text-xs text-gray-400 mt-3 space-y-1">
          <li>Mileage: {car.mileage}</li>
          <li>Transmission: {car.transmission}</li>
        </ul>
        <div className="mt-4">
          <button className="w-full bg-blackline-accent hover:opacity-90 text-black py-2 rounded-md">
            View details
          </button>
        </div>
      </div>
    </article>
  )
}
