import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureCard from './FeatureCard'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const formatMileage = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return `${new Intl.NumberFormat('pl-PL').format(numeric)} km`
}

export default function FeaturedCarousel() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const carouselRef = useScrollAnimation()
  const scrollerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const loadFeaturedCars = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/cars?featured=1`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            const fetchedCars = Array.isArray(data) ? data.slice(0, 6) : []
            setCars(fetchedCars)
          }
        } else {
          if (!cancelled) setError('Nie udało się pobrać wyróżnionych samochodów.')
        }
      } catch (err) {
        if (!cancelled) setError('Wystąpił błąd sieci.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadFeaturedCars()

    return () => {
      cancelled = true
    }
  }, [])

  // Potrójna tablica dla uzyskania płynnego efektu "nieskończoności"
  const extendedCars = [...cars, ...cars, ...cars]

  // Ustawienie scrolla na środkowy zestaw po załadowaniu danych
  useEffect(() => {
    if (cars.length > 0 && scrollerRef.current) {
      const el = scrollerRef.current
      el.scrollLeft = el.scrollWidth / 3
    }
  }, [cars])

  // Obsługa zapętlania przy przewijaniu manualnym (myszką / touchpadem)
  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return

    const thirdWidth = el.scrollWidth / 3

    // Jeśli użytkownik zescrollował za daleko w lewo (w pierwszą replikę)
    if (el.scrollLeft <= 10) {
      el.scrollLeft += thirdWidth
    } 
    // Jeśli użytkownik zescrollował za daleko w prawo (w trzecią replikę)
    else if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
      el.scrollLeft -= thirdWidth
    }
  }

  const scrollByPage = (dir = 1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.9
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-400">Ładowanie wyróżnionych ofert...</div>
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>
  }

  if (cars.length === 0) {
    return null
  }

  return (
    <div ref={carouselRef} className="relative py-6 md:py-8">
      {/* Scrollable track with snap points */}
      <div 
        ref={scrollerRef} 
        onScroll={handleScroll}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory"
      >
        <div className="flex gap-3 px-1">
          {extendedCars.map((car, index) => (
            <div
              key={`${car.id}-${index}`}
              className="flex-shrink-0 w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] snap-start"
            >
              <FeatureCard
                title={`${car.brand || ''} ${car.model || ''}`.trim()}
                desc={car.description}
                image={car.image_path}
                year={car.year}
                horsepower={car.horsepower_hp}
                mileage={formatMileage(car.mileage_km)}
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