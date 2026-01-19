import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import cars from '../data/cars.json'
import employees from '../data/employees.json'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function CarDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const car = cars.find((c) => c.id === id)
  const employee = car ? employees.find((e) => e.id === car.assignedEmployee) : null
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const leftContentRef = useScrollAnimation()
  const rightContentRef = useScrollAnimation()

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev > 0 ? prev - 1 : car.images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev < car.images.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, car])

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

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      {/* Hero Section - Car Name */}
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Vehicle Details</p>
          <h1 className="text-4xl md:text-6xl font-extrabold mt-2">{car.make} {car.model}</h1>
          <div className="flex items-center gap-6 mt-6">
            <p className="text-3xl md:text-4xl text-blackline-accent font-bold">{car.price}</p>
          </div>
        </div>
      </div>

      {/* Back Button */}
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

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12">
          {/* Left: Image Gallery & Description */}
          <div ref={leftContentRef} className="opacity-0-init flex flex-col">
            {/* Main Image - Gallery with selection */}
            <button 
              onClick={() => setIsLightboxOpen(true)}
              className="rounded-lg overflow-hidden bg-gray-900 shadow-xl cursor-pointer hover:opacity-95 transition-opacity w-full mb-2"
            >
              <img
                src={car.images?.[selectedImage] || car.images?.[0] || '/img/ui/fallback.svg'}
                alt={`${car.make} ${car.model}`}
                className="w-full h-[500px] object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/ui/fallback.svg' }}
              />
            </button>
            
            {/* Thumbnail Gallery - Display first 4 images */}
            <div className="grid grid-cols-4 mb-4">
              {car.images && car.images.slice(0, 3).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden bg-gray-900 border-2 transition-all hover:border-blackline-accent ${
                    selectedImage === index ? 'border-blackline-accent' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${car.make} ${car.model} - view ${index + 1}`}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/ui/fallback.svg' }}
                  />
                </button>
              ))}
              
              {/* More images button */}
              {car.images && car.images.length > 4 && (
                <button
                  onClick={() => {
                    setIsLightboxOpen(true)
                    setSelectedImage(3)
                  }}
                  className="rounded-lg overflow-hidden bg-gray-900 border-2 border-gray-300 hover:border-blackline-accent transition-all relative group"
                >
                  <img
                    src={car.images[3]}
                    alt="View more"
                    className="w-full h-24 object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-bold">+</span>
                    <span className="text-sm font-semibold">{car.images.length - 3} more</span>
                  </div>
                </button>
              )}
              
              {/* If exactly 4 images, show the 4th normally */}
              {car.images && car.images.length === 4 && (
                <button
                  onClick={() => setSelectedImage(3)}
                  className={`rounded-lg overflow-hidden bg-gray-900 border-2 transition-all hover:border-blackline-accent ${
                    selectedImage === 3 ? 'border-blackline-accent' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={car.images[3]}
                    alt={`${car.make} ${car.model} - view 4`}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/ui/fallback.svg' }}
                  />
                </button>
              )}
            </div>

            {/* Full Description */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-extrabold mb-4">About this vehicle</h3>
              <p className="text-gray-700 leading-relaxed">{car.description}</p>
            </div>
          </div>

          {/* Right: Specifications & Contact */}
          <div ref={rightContentRef} className="opacity-0-init space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg sticky top-6">
              <h2 className="text-3xl font-extrabold mb-6">Specifications</h2>

              <div className="space-y-6">
                {/* Spec Grid */}
                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Year</p>
                    <p className="text-2xl font-bold text-black mt-1">{car.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Mileage</p>
                    <p className="text-2xl font-bold text-black mt-1">{car.mileage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Transmission</p>
                    <p className="text-xl font-bold text-black mt-1">{car.transmission}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Horsepower</p>
                    <p className="text-2xl font-bold text-black mt-1">{car.horsepower} HP</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Engine</p>
                    <p className="text-lg font-bold text-black mt-1">{car.engine}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Drivetrain</p>
                    <p className="text-lg font-bold text-black mt-1">{car.drivetrain}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Exterior Color</p>
                    <p className="text-lg font-bold text-black mt-1">{car.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Interior</p>
                    <p className="text-lg font-bold text-black mt-1">{car.interiorColor}</p>
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    {car.features && car.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-blackline-accent mr-3 text-lg">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Your Sales Consultant */}
                {employee && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Your Sales Consultant</h3>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                        {employee.photo ? (
                          <img src={employee.photo} alt={`${employee.firstName} ${employee.lastName}`} className="w-full h-full object-cover" />
                        ) : (
                          <span>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-black">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-600 mb-2">{employee.position}</p>
                        <p className="text-sm text-gray-700"><strong>Specialization:</strong> {employee.specialization}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-700">
                            <a href={`tel:${employee.phone}`} className="text-blackline-accent hover:underline font-semibold">{employee.phone}</a>
                          </p>
                          <p className="text-sm text-gray-700">
                            <a href={`mailto:${employee.email}`} className="text-blackline-accent hover:underline">{employee.email}</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
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

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-blackline-accent transition-colors z-50"
            aria-label="Close lightbox"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage((prev) => (prev > 0 ? prev - 1 : car.images.length - 1))
            }}
            className="absolute left-4 text-white hover:text-blackline-accent transition-colors z-50"
            aria-label="Previous image"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Main Image */}
          <div 
            className="max-w-6xl max-h-[90vh] w-full px-16"
          >
            <img
              src={car.images[selectedImage]}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-contain"
            />
            <p className="text-center text-white mt-4 text-lg">
              {selectedImage + 1} / {car.images.length}
            </p>
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage((prev) => (prev < car.images.length - 1 ? prev + 1 : 0))
            }}
            className="absolute right-4 text-white hover:text-blackline-accent transition-colors z-50"
            aria-label="Next image"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4">
            {car.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-blackline-accent' : 'border-gray-500 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

    </main>
  )
}
