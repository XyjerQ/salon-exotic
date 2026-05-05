import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureCard from './FeatureCard'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function FeaturedCarousel({ cars = [] }){
  const carouselRef = useScrollAnimation()
  const scrollerRef = useRef(null)
  const navigate = useNavigate()
  const displayedCars = cars.slice(0, 6)

  const scrollByPage = (dir = 1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.9
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div ref={carouselRef} className="opacity-0-init relative py-6 md:py-8">
      {/* Scrollable track with snap points */}
      <div ref={scrollerRef} className="overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-3 px-1">
          {displayedCars.map((car) => (
            <div
              key={car.id}
              className="flex-shrink-0 w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] snap-start"
            >
              <FeatureCard
                title={`${car.make} ${car.model}`}
                desc={car.description}
                image={car.images?.[0]}
                year={car.year}
                horsepower={car.horsepower}
                mileage={car.mileage}
                onViewDetails={() => navigate(`/car/${car.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop arrows */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Previous featured"
        className="hidden md:flex items-center justify-center absolute -left-16 top-1/2 -translate-y-1/2 z-20 bg-blackline-accent/95 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Next featured"
        className="hidden md:flex items-center justify-center absolute -right-16 top-1/2 -translate-y-1/2 z-20 bg-blackline-accent/95 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
