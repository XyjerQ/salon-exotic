import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  if (value === undefined || value === null || value === '') return 'On Request'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 'On Request'
  
  const formatted = new Intl.NumberFormat('pl-PL', {
    useGrouping: true,
    maximumFractionDigits: 0
  }).format(numeric)

  return `${formatted} €`
}

const formatMileage = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'number') {
    const formatted = new Intl.NumberFormat('pl-PL', {
      useGrouping: true,
      maximumFractionDigits: 0
    }).format(value)
    return `${formatted} km`
  }
  return String(value)
}

export default function CarDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [employees, setEmployees] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [inquiryState, setInquiryState] = useState({ loading: false, error: '', success: '' })
  const [loading, setLoading] = useState(true)

  const leftContentRef = useScrollAnimation()
  const rightContentRef = useScrollAnimation()

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoading(true)

      try {
        const [carRes, empRes] = await Promise.all([
          fetch(`${API_BASE}/cars/${encodeURIComponent(id)}`),
          fetch(`${API_BASE}/employees/public`)
        ])

        if (carRes.ok) {
          const carData = await carRes.json()
          if (!cancelled) {
            setCar(carData)
            setSelectedImage(0)
          }
        } else {
          if (!cancelled) setCar(null)
        }

        if (empRes.ok) {
          const empData = await empRes.json()
          if (!cancelled) setEmployees(empData)
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

    loadData()

    return () => {
      cancelled = true
    }
  }, [id])

  const isCustomerVehicle = car && (car.vehicle_type || '').toLowerCase() === 'customer'

  const consultantSource = car && car.advisor_id
    ? employees.find((employee) => String(employee.id).trim() === String(car.advisor_id).trim()) || null
    : null

  const imageList = (car?.images || [])
    .map((image) => (typeof image === 'string' ? image : image?.image_path))
    .filter(Boolean)

  const featuresList = car?.features || []

  const recentService = (() => {
    if (car?.recent_service) return car.recent_service;
    if (Array.isArray(car?.service_history) && car.service_history.length > 0) {
      const s = car.service_history[0];
      // Mapowanie pól z bazy SQL na format używany w widoku
      return {
        type: s.type || s.service_type,
        date: s.date || s.service_date,
        mileage: s.mileage || s.mileage_km,
        center: s.center || s.provider,
        description: s.description || s.details
      };
    }
    return null;
  })();

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

  if (!car) {
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

  const handleInquiryChange = (event) => {
    setInquiryForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleInquirySubmit = async (event) => {
    event.preventDefault()
    setInquiryState({ loading: true, error: '', success: '' })

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inquiryForm,
          subject: `Vehicle Inquiry: ${car.make} ${car.model}`,
          vehicle_name: `${car.make} ${car.model}`,
          vehicle_vin: car.vin || ''
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your inquiry')

      setInquiryForm({ name: '', email: '', phone: '', message: '' })
      setInquiryState({ loading: false, error: '', success: 'Your inquiry has been sent successfully.' })
    } catch (error) {
      setInquiryState({ loading: false, error: error.message, success: '' })
    }
  }

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Vehicle Details</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <h1 className="text-4xl md:text-6xl font-extrabold">{car.make} {car.model}</h1>
          </div>
          {!isCustomerVehicle && (
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <p className={`text-3xl md:text-4xl text-blackline-accent font-bold ${car.status === 'sold' ? 'line-through opacity-70' : ''}`}>
                {formatMoney(car.price)}
              </p>
              {car.status === 'sold' && (
                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
                  Sold
                </span>
              )}
            </div>
          )}
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
          <div ref={leftContentRef} className="flex flex-col space-y-6">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="rounded-lg overflow-hidden bg-gray-900 shadow-xl cursor-pointer hover:opacity-95 transition-opacity w-full mb-2"
            >
              <img
                src={resolveImageUrl(selectedImagePath || 'img/ui/fallback.svg')}
                alt={`${car.make} ${car.model}`}
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
                    alt={`${car.make} ${car.model} - view ${index + 1}`}
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
                    alt={`${car.make} ${car.model} - view 4`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
                  />
                </button>
              )}
            </div>

            {car.description && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-extrabold mb-4">About this vehicle</h3>
                <p className="text-gray-700 leading-relaxed">{car.description}</p>
              </div>
            )}

            {recentService && (
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-extrabold flex items-center gap-2">
                    Recent Service History
                  </h3>
                  {recentService.date && (
                    <span className="text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {recentService.date}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-gray-700">
                  {recentService.center && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-medium">Provider:</span>
                      <span className="font-bold text-black">{recentService.center}</span>
                    </div>
                  )}
                  {recentService.mileage && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-medium">Mileage:</span>
                      <span className="font-bold text-black">{formatMileage(recentService.mileage)}</span>
                    </div>
                  )}
                  {recentService.type && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-medium">Type:</span>
                      <span className="font-bold text-black">{formatMileage(recentService.type)}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="text-gray-500 font-medium block mb-1">Description:</span>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100">
                      {typeof recentService === 'string' ? recentService : (recentService.description || recentService.details || 'Regular maintenance inspection and service completed.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={rightContentRef} className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg sticky top-6">
              <h2 className="text-3xl font-extrabold mb-6">Specifications</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Year</p>
                    <p className="text-2xl font-bold text-black mt-1">{car.year || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Mileage</p>
                    <p className="text-2xl font-bold text-black mt-1">{formatMileage(car.mileage_km)}</p>
                  </div>

                  {!isCustomerVehicle && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Transmission</p>
                        <p className="text-xl font-bold text-black mt-1">{car.transmission || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Horsepower</p>
                        <p className="text-2xl font-bold text-black mt-1">{car.horsepower_hp ? `${car.horsepower_hp} HP` : '—'}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Engine</p>
                    <p className="text-lg font-bold text-black mt-1">{car.engine || '—'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Fuel Type</p>
                    <p className="text-lg font-bold text-black mt-1">{car.fuel_type || car.fuel || '—'}</p>
                  </div>

                  {!isCustomerVehicle && (
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Drivetrain</p>
                      <p className="text-lg font-bold text-black mt-1">{car.drivetrain || '—'}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">VIN</p>
                    <p className="text-lg font-bold text-black mt-1">{car.vin || '—'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Exterior Color</p>
                    <p className="text-lg font-bold text-black mt-1">{car.exterior_color || '—'}</p>
                  </div>

                  {!isCustomerVehicle && (
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Interior</p>
                      <p className="text-lg font-bold text-black mt-1">{car.interior_color || '—'}</p>
                    </div>
                  )}
                </div>

                {featuresList.length > 0 && (
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
                )}

                {!isCustomerVehicle && consultantSource && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Your Sales Consultant</h3>
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden flex-shrink-0">
                        {consultantSource.photo_path ? (
                          <img src={resolveImageUrl(consultantSource.photo_path)} alt={consultantSource.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(consultantSource.name || 'E').charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-gray-900 truncate">{consultantSource.name}</p>
                        <p className="text-sm text-gray-700 truncate">
                          <span className="font-semibold text-gray-900">Specialization:</span> {consultantSource.specialization || '—'}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {consultantSource.phone && (
                            <p className="text-sm text-gray-400">
                              <a href={`tel:${consultantSource.phone}`} className="hover:underline">{consultantSource.phone}</a>
                            </p>
                          )}
                          {consultantSource.email && (
                            <p className="text-sm text-gray-400 truncate">
                              <a href={`mailto:${consultantSource.email}`} className="hover:underline">{consultantSource.email}</a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isCustomerVehicle && (
                  <button
                    onClick={() => {
                      setInquiryState({ loading: false, error: '', success: '' })
                      setIsInquiryOpen(true)
                    }}
                    className="w-full bg-gray-300 hover:bg-blackline-accent text-black font-bold py-4 rounded-lg mt-4 transition-colors"
                  >
                    Inquire about this vehicle
                  </button>
                )}
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
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-colors z-20"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-6 left-6 text-white/80 text-sm font-medium z-10">
            {selectedImage + 1} / {imageList.length}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))
            }}
            className="absolute left-6 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            src={resolveImageUrl(imageList[selectedImage])}
            alt={`${car.make} ${car.model}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = withBase('img/ui/fallback.svg') }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))
            }}
            className="absolute right-6 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {isInquiryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsInquiryOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-inquiry-title"
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsInquiryOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
              aria-label="Close inquiry form"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="text-sm uppercase tracking-wider text-gray-500">Vehicle inquiry</p>
            <h2 id="vehicle-inquiry-title" className="mt-1 pr-8 text-2xl font-bold">Ask about {car.make} {car.model}</h2>
            <p className="mt-2 text-sm text-gray-600">Send us your details and our team will get back to you.</p>

            {inquiryState.error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{inquiryState.error}</div>}
            {inquiryState.success && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{inquiryState.success}</div>}

            <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm font-medium text-gray-700">Full name</span>
                  <input required name="name" value={inquiryForm.name} onChange={handleInquiryChange} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
                  <input required type="email" name="email" value={inquiryForm.email} onChange={handleInquiryChange} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </label>
              </div>
              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">Phone</span>
                <input name="phone" value={inquiryForm.phone} onChange={handleInquiryChange} className="w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">Message</span>
                <textarea required minLength="10" rows="5" name="message" value={inquiryForm.message} onChange={handleInquiryChange} placeholder={`I would like to know more about the ${car.make} ${car.model}.`} className="w-full resize-y rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <button disabled={inquiryState.loading} className="w-full rounded-md bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
                {inquiryState.loading ? 'Sending...' : 'Send inquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}