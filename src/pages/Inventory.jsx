import React from 'react'
import { useNavigate } from 'react-router-dom'
import CarCard from '../components/CarCard'
import cars from '../data/cars.json'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function Inventory() {
  const gridRef = useScrollAnimation({ staggerChildren: true })
  const navigate = useNavigate()
  const sentinelRef = React.useRef(null)

  const [filters, setFilters] = React.useState({
    hpMin: '',
    hpMax: '',
    mileageMax: '',
    yearMin: ''
  })

  const [visibleCount, setVisibleCount] = React.useState(6)
  const [showFilters, setShowFilters] = React.useState(false)

  const parseMileage = (mileageStr) => {
    if (!mileageStr) return 0
    return Number(mileageStr.replace(/[^0-9]/g, '')) || 0
  }

  const filteredCars = React.useMemo(() => {
    return cars.filter((car) => {
      const hp = Number(car.horsepower) || 0
      const mileage = parseMileage(car.mileage)
      const year = Number(car.year) || 0

      const hpMinOk = filters.hpMin === '' || hp >= Number(filters.hpMin)
      const hpMaxOk = filters.hpMax === '' || hp <= Number(filters.hpMax)
      const mileageOk = filters.mileageMax === '' || mileage <= Number(filters.mileageMax)
      const yearOk = filters.yearMin === '' || year >= Number(filters.yearMin)

      return hpMinOk && hpMaxOk && mileageOk && yearOk
    })
  }, [filters, cars])

  // Reset visible items whenever the filtered list changes
  React.useEffect(() => {
    setVisibleCount(Math.min(6, filteredCars.length))
  }, [filteredCars.length])

  // Infinite scroll sentinel: load more when reaching the bottom
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (visibleCount >= filteredCars.length) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 6, filteredCars.length))
        }
      })
    }, { rootMargin: '200px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filteredCars.length, visibleCount])

  const handleChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClear = () => {
    setFilters({ hpMin: '', hpMax: '', mileageMax: '', yearMin: '' })
  }

  // Ensure newly filtered items become visible (re-trigger animation or remove initial opacity)
  React.useEffect(() => {
    const nodes = document.querySelectorAll('.inventory-item')
    nodes.forEach((node, i) => {
      if (!node.classList.contains('animate-fade-up')) {
        setTimeout(() => {
          node.classList.add('animate-fade-up')
          node.classList.remove('opacity-0-init')
        }, i * 60)
      } else {
        node.classList.remove('opacity-0-init')
      }
    })
  }, [filteredCars, visibleCount])

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

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 pt-4 md:p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 md:pointer-events-none"
            >
              <span>Filters</span>
              <svg
                className={`w-5 h-5 transition-transform md:hidden ${showFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset filters
            </button>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Horsepower (min)</label>
              <input
                type="number"
                value={filters.hpMin}
                onChange={handleChange('hpMin')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="np. 600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Horsepower (max)</label>
              <input
                type="number"
                value={filters.hpMax}
                onChange={handleChange('hpMax')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="np. 1000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mileage max (km)</label>
              <input
                type="number"
                value={filters.mileageMax}
                onChange={handleChange('mileageMax')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="np. 20000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Year from</label>
              <input
                type="number"
                value={filters.yearMin}
                onChange={handleChange('yearMin')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="np. 2020"
              />
            </div>
          </div>
        </div>

        <div ref={gridRef} className="opacity-0-init grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCars.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">No cars match current filters.</div>
          ) : (
            filteredCars.slice(0, visibleCount).map((car) => (
              <div key={car.id} className="opacity-0-init inventory-item">
                <CarCard car={car} onViewDetails={() => handleViewDetails(car.id)} />
              </div>
            ))
          )}
        </div>
        {filteredCars.length > 0 && visibleCount < filteredCars.length && (
          <div ref={sentinelRef} className="mt-8 h-12 flex items-center justify-center text-sm text-gray-500">
            Loading more cars...
          </div>
        )}
      </section>
    </main>
  )
}