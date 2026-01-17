import React from 'react'

export default function FeatureCard({ title, desc, image, year, horsepower, mileage }) {
  return (
    // card with image flush to card edges (no inner padding) so image spans full tile width
    <article className="bg-blackline-surface rounded-lg overflow-hidden flex flex-col h-full">
      <div className="w-full bg-blackline-surface flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/img/fallback.svg'}} />
        ) : (
          <span className="text-gray-300 text-sm">No image</span>
        )}
      </div>

      <div className="p-3 mt-3 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-semibold text-white">{title}</h3>
        
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs md:text-sm text-gray-400 border-t border-white/10 pt-3">
          {mileage && <div><span className="block text-white font-semibold">{mileage}</span>Mileage</div>}
          {horsepower && <div><span className="block text-white font-semibold">{horsepower}</span>HP</div>}
          {year && <div><span className="block text-white font-semibold">{year}</span>Year</div>}
        </div>

        {/* <p className="text-sm md:text-base text-gray-300 mt-3 flex-1">{desc}</p> */}
        <div className="mt-3">
          <button className="w-full bg-blackline-accent text-black py-2 rounded-md font-medium hover:opacity-90">
            View details
          </button>
        </div>
      </div>
    </article>
  )
}