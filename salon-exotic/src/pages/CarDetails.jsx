import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import cars from '../data/cars.json'
import employees from '../data/employees.json'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
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

const formatMoney = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return `€${new Intl.NumberFormat('pl-PL').format(numeric)}`
}

const formatMileage = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'number') return `${new Intl.NumberFormat('pl-PL').format(value)} km`
  return String(value)
}

const formatHorsepower = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'number') return `${value} HP`
  return String(value)
}

export default function CarDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [legacyCar, setLegacyCar] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const leftContentRef = useScrollAnimation()
  const rightContentRef = useScrollAnimation()

  useEffect(() => {
    setLegacyCar(cars.find((entry) => entry.id === id) || cars.find((entry) => entry.vin === id) || null)
  }, [id])

  useEffect(() => {
    let cancelled = false

    const loadCar = async () => {
      setLoading(true)

      try {
        const res = await fetch(`${API_BASE}/cars/${encodeURIComponent(id)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            setCar(data)
            setSelectedImage(0)
            return
          }
        }

        if (!cancelled) {
          setCar(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCar(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCar()

    return () => {
      cancelled = true
    }
  }, [id])

  const displayCar = car || legacyCar
  const consultantSource = car
    ? employees.find((employee) => String(employee.id) === String(car.advisor_id)) || null
    : legacyCar
      ? employees.find((employee) => String(employee.id) === String(legacyCar.assignedEmployee)) || null
      : null
  const imageList = ((car?.images?.length ? car.images : legacyCar?.images) || [])
    .map((image) => (typeof image === 'string' ? image : image?.image_path))
    .filter(Boolean)
  const featuresList = car?.features?.length ? car.features : legacyCar?.features || []

  useEffect(() => {
    if (!isLightboxOpen || imageList.length === 0) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))
      } else if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, imageList.length])

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Loading vehicle details...</div>
      </main>
    )
  }

  if (!displayCar) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-black mb-4">Car not found</h1>
          <button
            onClick={() => navigate('/inventory')}
            className="bg-black text-white px-6 py-2 rounded-md font-semibold hover:bg-blackline-accent hover:text-black transition-colors"
          >
            Back to Inventory
          </button>
        </div>
      </main>
    )
  }

  const selectedImagePath = imageList[selectedImage] || imageList[0]

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Vehicle Details</p>
          <h1 className="text-4xl md:text-6xl font-extrabold mt-2">{displayCar.make} {displayCar.model}</h1>
          <div className="flex items-center gap-6 mt-6">
            <p className="text-3xl md:text-4xl text-blackline-accent font-bold">{formatMoney(displayCar.price)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-black hover:text-blackline-accent font-semibold transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </button>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12">
          <div ref={leftContentRef} className="flex flex-col">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="rounded-lg overflow-hidden bg-gray-900 shadow-xl cursor-pointer hover:opacity-95 transition-opacity w-full mb-2"
            >
              <img
                src={resolveImageUrl(selectedImagePath || 'img/ui/fallback.svg')}
                alt={`${displayCar.make} ${displayCar.model}`}
                className="w-full max-w-full h-[500px] object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
              />
            </button>

            <div className="grid grid-cols-4 mb-4">
              {imageList.slice(0, 3).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden bg-gray-900 border-2 transition-all hover:border-blackline-accent ${
                    selectedImage === index ? 'border-blackline-accent' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`${displayCar.make} ${displayCar.model} - view ${index + 1}`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
                  />
                </button>
              ))}

              {imageList.length > 4 && (
                <button
                  onClick={() => {
                    setIsLightboxOpen(true)
                    setSelectedImage(3)
                  }}
                  className="rounded-lg overflow-hidden bg-gray-900 border-2 border-gray-300 hover:border-blackline-accent transition-all relative group"
                >
                  <img
                    src={resolveImageUrl(imageList[3])}
                    alt="View more"
                    className="w-full h-32 object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-bold">+</span>
                    <span className="text-sm font-semibold">{imageList.length - 3} more</span>
                  </div>
                </button>
              )}

              {imageList.length === 4 && (
                <button
                  onClick={() => setSelectedImage(3)}
                  className={`rounded-lg overflow-hidden bg-gray-900 border-2 transition-all hover:border-blackline-accent ${
                    selectedImage === 3 ? 'border-blackline-accent' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={resolveImageUrl(imageList[3])}
                    alt={`${displayCar.make} ${displayCar.model} - view 4`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
                  />
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-extrabold mb-4">About this vehicle</h3>
              <p className="text-gray-700 leading-relaxed">{displayCar.description}</p>
            </div>
          </div>

          <div ref={rightContentRef} className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg sticky top-6">
              <h2 className="text-3xl font-extrabold mb-6">Specifications</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Year</p>
                    <p className="text-2xl font-bold text-black mt-1">{displayCar.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Mileage</p>
                    <p className="text-2xl font-bold text-black mt-1">{formatMileage(displayCar.mileage_km ?? displayCar.mileage)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Transmission</p>
                    <p className="text-xl font-bold text-black mt-1">{displayCar.transmission}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Horsepower</p>
                    <p className="text-2xl font-bold text-black mt-1">{formatHorsepower(displayCar.horsepower_hp ?? displayCar.horsepower)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Engine</p>
                    <p className="text-lg font-bold text-black mt-1">{displayCar.engine}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Drivetrain</p>
                    <p className="text-lg font-bold text-black mt-1">{displayCar.drivetrain}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Exterior Color</p>
                    <p className="text-lg font-bold text-black mt-1">{displayCar.exterior_color ?? displayCar.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Interior</p>
                    <p className="text-lg font-bold text-black mt-1">{displayCar.interior_color ?? displayCar.interiorColor}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    {featuresList.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-blackline-accent mr-3 text-lg">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {consultantSource && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Your Sales Consultant</h3>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                        {consultantSource.photo_path ? (
                          <img src={resolveImageUrl(consultantSource.photo_path)} alt={consultantSource.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(consultantSource.name || 'E').charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-black">{consultantSource.name}</p>
                        <p className="text-sm text-gray-600 mb-2">{consultantSource.role || consultantSource.position || 'Sales'}</p>
                        <p className="text-sm text-gray-700"><strong>Specialization:</strong> {consultantSource.specialization || '—'}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-700">
                            <a href={`tel:${consultantSource.phone}`} className="text-blackline-accent hover:underline font-semibold">{consultantSource.phone}</a>
                          </p>
                          <p className="text-sm text-gray-700">
                            <a href={`mailto:${consultantSource.email}`} className="text-blackline-accent hover:underline">{consultantSource.email}</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-blackline-accent hover:opacity-90 text-black font-bold py-4 rounded-lg mt-4 transition-opacity"
                >
                  Inquire about this vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLightboxOpen && imageList.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <img
            src={resolveImageUrl(imageList[selectedImage])}
            alt={`${displayCar.make} ${displayCar.model}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
          />
        </div>
      )}
    </main>
  )
}
