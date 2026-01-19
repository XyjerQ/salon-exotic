import React from 'react'

export default function CarCard({ car, onViewDetails }) {

  return (
    <article 
      onClick={onViewDetails}
      className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-lg hover:shadow-2xl transition-shadow h-full"
    >
      <div className="w-full overflow-hidden bg-gray-900 relative">
        <img
          src={car.images?.[0] || '/img/fallback.svg'}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/fallback.svg' }}
        />
        <div className="absolute top-3 right-3 bg-black text-blackline-accent px-3 py-1 rounded-full text-sm font-semibold">
          {car.year}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-extrabold text-black">
          {car.make} {car.model}
        </h3>
        <p className="text-blackline-accent font-bold text-2xl mt-3">{car.price}</p>
        
        <ul className="text-sm text-gray-700 mt-4 space-y-2 border-t border-gray-200 pt-4">
          <li className="flex justify-between"><span className="text-gray-500">Mileage:</span> <strong>{car.mileage}</strong></li>
          <li className="flex justify-between"><span className="text-gray-500">Engine:</span> <strong>{car.engine}</strong></li>
          <li className="flex justify-between"><span className="text-gray-500">Horsepower:</span> <strong>{car.horsepower} HP</strong></li>
        </ul>
        
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          className="w-full bg-black hover:bg-blackline-accent text-white hover:text-black py-3 rounded-md font-semibold mt-6 transition-colors"
        >
          View details
        </button>
      </div>
    </article>
  )
}
