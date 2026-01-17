import React, { useEffect, useState, useRef } from 'react'
import FeatureCard from './FeatureCard'

export default function FeaturedCarousel({ cars = [] }){
  const [index, setIndex] = useState(0)
  const [perPage, setPerPage] = useState(1)
  const trackRef = useRef(null)
  const [cardWidth, setCardWidth] = useState(0)
  const [cardStride, setCardStride] = useState(0) // width plus gap for accurate slide distance

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      // show 3 cards on wide screens, 2 on medium, 1 on small
      if (w >= 1200) setPerPage(3)
      else if (w >= 768) setPerPage(2)
      else setPerPage(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const next = () => {
     setIndex((prev) => Math.min(prev + 1, Math.max(0, cars.length - perPage)))
  }
  const prev = () => {
     setIndex((prev) => Math.max(prev - 1, 0))
  }

  // compute maximum index for one-by-one sliding
  const maxIndex = Math.max(0, cars.length - perPage)

  // measure card width (including gap) in pixels so translateX uses exact px values
  useEffect(() => {
    function measure() {
      const track = trackRef.current
      if (!track) return
      const children = Array.from(track.children)
      if (children.length === 0) return
      const childWidth = children[0].getBoundingClientRect().width
      const gapPx = parseFloat(getComputedStyle(track).columnGap || '0')
      setCardWidth(childWidth)
      setCardStride(childWidth + gapPx)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [perPage, cars.length])

  // ensure index stays valid when perPage or cars change
  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex)
  }, [perPage, cars.length])

  return (
    <div className="relative py-6 md:py-8">
      {/* arrows */}
      <button
        onClick={prev}
        aria-label="Previous featured"
        disabled={index === 0}
        className={`absolute -left-16 top-1/2 -translate-y-1/2 z-20 bg-blackline-accent/95 text-black p-3 rounded-full shadow-lg transition-transform ${index === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* track wrapper (clips the sliding track) */}
      <div className="overflow-hidden">
        {/* track - translate using measured px width so gaps are accounted for */}
        <div
          ref={trackRef}
          className="flex gap-3 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * (cardStride || cardWidth)}px)` }}
        >
          {cars.map((car) => (
            <div
              key={car.id}
              className="min-w-0"
              style={{ flex: `0 0 calc((100% - ${(perPage - 1) * 0.75}rem) / ${perPage})` }}
            >
              <FeatureCard title={`${car.make} ${car.model}`} desc={car.description} image={car.image} year={car.year} horsepower={car.horsepower} mileage={car.mileage} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={next}
        aria-label="Next featured"
        disabled={index === maxIndex}
        className={`absolute -right-16 top-1/2 -translate-y-1/2 z-20 bg-blackline-accent/95 text-black p-3 rounded-full shadow-lg transition-transform ${index === maxIndex ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
