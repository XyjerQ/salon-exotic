import React from 'react'

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/?api\/?$/, '')

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return withBase('img/ui/fallback.svg')
  const path = typeof imagePath === 'string' ? imagePath : imagePath?.image_path
  if (!path) return withBase('img/ui/fallback.svg')
  if (path.startsWith('http')) return path
  if (path.startsWith('/uploads/')) return `${mediaBase}${path}`
  return withBase(path)
}

export default function FeatureCard({ 
  car, 
  make, 
  model, 
  title, 
  desc, 
  image, 
  year, 
  horsepower, 
  mileage, 
  onViewDetails 
}) {
  // Wyciąganie danych niezależnie od tego czy przychodzą w obiekcie car, czy osobno
  const vehicleMake = car?.make || car?.brand || make
  const vehicleModel = car?.model || car?.car_model || model

  // Tworzenie tytułu: najpierw make+model, jak brak to stary title, jak brak to 'Vehicle'
  const displayTitle = [vehicleMake, vehicleModel].filter(Boolean).join(' ') || title || 'Vehicle'

  const vehicleImage = car?.image_path || car?.image || image
  const vehicleYear = car?.year || year
  const vehicleHp = car?.horsepower_hp || car?.horsepower || horsepower
  const vehicleMileage = car?.mileage_km || car?.mileage || mileage

  return (
    <article
      className="bg-blackline-surface rounded-lg overflow-hidden flex flex-col h-full group cursor-pointer"
      onClick={onViewDetails}
      role={onViewDetails ? 'button' : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
    >
      <div className="w-full aspect-[16/10] bg-blackline-surface overflow-hidden flex items-center justify-center">
        {vehicleImage ? (
          <img 
            src={resolveImageUrl(vehicleImage)} 
            alt={displayTitle} 
            className="w-full h-full object-cover object-[center_80%]" 
            loading="lazy" 
            decoding="async" 
            onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=withBase('img/ui/fallback.svg')}} 
          />
        ) : (
          <span className="text-gray-300 text-sm">No image</span>
        )}
      </div>

      <div className="p-2 md:p-3 mt-2 md:mt-3 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-semibold text-white">{displayTitle}</h3>
        
        <div className="grid grid-cols-3 gap-1 md:gap-2 mt-2 md:mt-3 text-xs md:text-sm text-gray-400 border-t border-white/10 pt-2 md:pt-3">
          {vehicleMileage && <div><span className="block text-white font-semibold">{vehicleMileage}</span>Mileage</div>}
          {vehicleHp && <div><span className="block text-white font-semibold">{vehicleHp}</span>HP</div>}
          {vehicleYear && <div><span className="block text-white font-semibold">{vehicleYear}</span>Year</div>}
        </div>

        <div className="mt-3">
          <button
            className="w-full bg-blackline-accent text-black py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails() }}
          >
            View details
          </button>
        </div>
      </div>
    </article>
  )
}