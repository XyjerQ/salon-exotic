import React from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const items = [
  {
    image: `${import.meta.env.BASE_URL}img/ui/History.png`,
    title: 'Verified history',
    desc: 'Full service records, paint-depth checks, and mileage verification on every car.',
  },
  {
    image: `${import.meta.env.BASE_URL}img/ui/Delivery.png`,
    title: 'Concierge delivery',
    desc: 'Door to door delivery, registration, and insurance handled for you end-to-end.',
  },
  {
    image: `${import.meta.env.BASE_URL}img/ui/Detailing.png`,
    title: 'Tailored detailing',
    desc: 'Ceramic, PPF, or satin conversions - prepped to match your style.',
  },
  {
    image: `${import.meta.env.BASE_URL}img/ui/Peace.png`,
    title: '30-day peace of mind',
    desc: 'Assistance and starter coverage so you focus purely on driving.',
  },
]

export default function WhyBlackline() {
  const sectionRef = useScrollAnimation({ staggerChildren: true })
  
  return (
    <section ref={sectionRef} className="opacity-0-init bg-blackline-surface text-white py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 text-center">Why Blackline</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mt-2 leading-tight text-center">Verified. Delivered. Dialed-in.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <div key={item.title} className="border border-white/10 rounded-lg p-6 bg-white/5 text-center flex flex-col items-center gap-4 opacity-0-init">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-white/20 bg-black/40">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = `${import.meta.env.BASE_URL}img/ui/fallback.svg`
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-300 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
