import React from 'react'

export default function Hero({
  title = 'Blackline Salon',
  subtitleLines = [
    'Premium and exotic cars',
    '— Porsche, BMW M, and other rare models.'
  ],
  ctaText = 'See our inventory',
  ctaHref = '/inventory',
  image = '/img/gt3rs.png'
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blackline via-blackline-surface to-blackline text-white">
  <div className="max-w-7xl px-6 py-20 md:py-28 lg:py-32 relative z-30">
        {/* left content panel - semi translucent so image can show under it */}
        {/*
          Adjusted width and horizontal offset so the tile is a bit wider
          and nudged towards the center on medium+ screens.
        */}
  <div className="md:w-1/2 lg:w-2/5 md:ml-12 lg:ml-16 bg-blackline/60 backdrop-blur-sm rounded-md p-8 md:p-10">
          <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          <p className="mt-4 text-lg text-blackline-muted">
            {subtitleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="mt-6">
            <a
              className="inline-block bg-blackline-accent text-black px-6 py-3 rounded-lg font-semibold"
              href={ctaHref}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </div>

      {/* full-bleed image: span entire viewport width while content stays centered */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <img
          src={image}
          alt={`${title} image`}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/70 pointer-events-none" />
      </div>
    </div>
  )
}