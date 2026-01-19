import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const faqs = [
  {
    q: 'Do cars come with warranty?',
    a: 'We supply cars with active factory warranty or extended coverage. Assistance packages are available.',
  },
  {
    q: 'How do reservations work?',
    a: 'We secure the car after a reservation deposit. We can arrange inspection and remote paperwork.',
  },
  {
    q: 'Can I return the car?',
    a: 'For remote purchases we allow a sensible inspection/collection window. Returns are clarified individually before finalizing.',
  },
  {
    q: 'Do you arrange financing?',
    a: 'Yes, we work with banks and leasing partners. We tailor loan/leasing offers to your profile.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)
  const sectionRef = useScrollAnimation()

  return (
    <section ref={sectionRef} className="opacity-0-init text-black py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2">Most common questions</h2>
          </div>
          <Link 
            to="/faq"
            className="hidden md:inline-flex items-center gap-2 text-blackline-accent hover:text-black font-semibold transition-colors"
          >
            View all questions
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-6 divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden bg-white">
          {faqs.map((item, i) => {
            const open = openIndex === i
            return (
              <button
                key={item.q}
                onClick={() => setOpenIndex(open ? -1 : i)}
                className="w-full text-left bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{item.q}</p>
                    {open && <p className="text-gray-700 mt-2">{item.a}</p>}
                  </div>
                  <span className="text-blackline-accent font-bold">{open ? '−' : '+'}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Mobile "View all" button */}
        <div className="mt-6 text-center md:hidden">
          <Link 
            to="/faq"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            View all questions
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
