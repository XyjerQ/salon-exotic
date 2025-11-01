import React, { useState, useMemo } from 'react'

export default function Hero() {
  // Hardcoded defaults (no props required)
  const title = 'Blackline Salon'
  const ctaText = 'See our inventory'
  const ctaHref = '/inventory'
  const image = '/img/gt3rs.png'
  const video = '/vid/bgCars.mp4'

  // default subtitle list (two-line strings using \n)
  const defaultSubtitles = [
    'Exotic Performance,\nPremium Quality.',
    'Not Just Cars,\nIcons of Passion.',
    'Pure Power,\nElegant Design.',
    'Sculpted For Speed,\nBuilt For Comfort.',
    'Feel the Drive,\nLive the Power.'
  ]

  const options = defaultSubtitles

  const [videoError, setVideoError] = useState(false)
  const chosenSubtitle = useMemo(() => {
    return options[Math.floor(Math.random() * options.length)]
  }, [options])

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-r from-blackline via-blackline-surface to-blackline text-white">
      {/* floating info tile - positioned relative to the hero (no background) */}
      <div
        className="absolute left-10 bottom-12 md:left-16 lg:left-20 md:bottom-16 z-30 text-left text-white"
        style={{ transform: 'translateX(15%) translateY(-25%)' }}
      >
        <div className="max-w-4xl px-6">
          <p
            className="text-white font-bold leading-tight drop-shadow-lg tracking-wider whitespace-pre-line"
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 4.5rem)' }}
          >
            {chosenSubtitle}
          </p>

          <div className="mt-6">
            <a
              className="inline-block bg-transparent border-2 border-white hover:border-white/75 text-white px-6 py-3 rounded-md hover:bg-white/10 transition"
              href={ctaHref}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </div>

      {/* full-bleed image: span entire viewport width while content stays centered */}
      {/* full-screen background (video or image) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {video && !videoError ? (
          <video
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transform origin-center scale-125"
            autoPlay
            muted
            loop
            playsInline
            poster={image}
            aria-hidden="true"
            onError={() => setVideoError(true)}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <img
            src={image}
            alt={`${title} image`}
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
        )}
        {/* vertical darkening gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/70 pointer-events-none" />
      </div>
    </div>
  )
}