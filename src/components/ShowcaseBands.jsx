import React from 'react'

const bands = [
  {
    title: 'Find your next Blackline',
    body: 'Curated inventory, verified provenance, and concierge-level delivery so you enjoy the drive, not the paperwork.',
    cta: 'Browse inventory',
    href: '/inventory',
    image: '/img/showcase-1.jpg',
  },
  {
    title: 'Choose your delivery hub',
    body: 'Pick the handover spot that suits you best, from studio handoffs to covered transport straight to your door.',
    cta: 'Talk to concierge',
    href: '/contact',
    image: '/img/showcase-2.jpg',
  },
]

export default function ShowcaseBands() {
  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-10">
        {bands.map((band, i) => {
          const reverse = i % 2 === 1
          return (
            <article
              key={band.title}
              className="grid md:grid-cols-2 items-stretch rounded-xl overflow-hidden shadow-2xl bg-black"
            >
              <div className={`bg-black text-white p-8 md:p-10 flex flex-col justify-center gap-4 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight">{band.title}</h3>
                <p className="text-gray-300 text-base md:text-lg max-w-xl">{band.body}</p>
                <div>
                  <a
                    className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 rounded-md font-semibold hover:opacity-90 transition"
                    href={band.href}
                  >
                    {band.cta}
                  </a>
                </div>
              </div>

              <div className={`relative min-h-[240px] md:min-h-[320px] ${reverse ? 'md:order-1' : 'md:order-2'}`}>
                <img
                  src={band.image}
                  alt={band.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/img/ui/fallback.svg'
                  }}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
