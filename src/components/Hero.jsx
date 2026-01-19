import React, { useState, useMemo } from 'react'

export default function Hero() {
  
  const title = 'Blackline Salon'
  const ctaText = 'See our inventory'
  const ctaHref = '/inventory'
  const image = '/img/hero/gt3rs.png'
  const video = '/vid/bgCars.mp4'

  
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
    <div className="relative overflow-hidden min-h-screen min-h-[100dvh] h-[100dvh] md:h-auto bg-gradient-to-r from-blackline via-blackline-surface to-blackline text-white">
      {/* floating info tile */}
      <div
        className="absolute left-4 bottom-20 md:left-16 lg:left-20 md:bottom-16 z-30 text-left text-white md:translate-x-[15%] md:-translate-y-[25%]"
      >
        <div className="max-w-4xl px-4 md:px-6">
          <p
            className="text-white font-bold leading-tight drop-shadow-lg tracking-wider whitespace-pre-line text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {chosenSubtitle}
          </p>

          <div className="mt-6 md:mt-8">
            <a
              className="inline-block bg-transparent border-2 border-white hover:border-white/75 text-white px-6 py-3 md:px-8 md:py-4 text-base md:text-lg rounded-md hover:bg-white/10 transition font-semibold"
              href={ctaHref}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </div>

      {/* full-bleed image: span entire viewport width while content stays centered */}
      {/* full-screen background (video or image) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        {video && !videoError ? (
          <video
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transform origin-center scale-[1.4]"
            autoPlay
            muted
            loop
            playsInline
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