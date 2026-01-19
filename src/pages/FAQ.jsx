import React, { useState } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import faqCategories from '../data/faq.json'

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [openQuestions, setOpenQuestions] = useState(new Set([0]))
  const sectionRef = useScrollAnimation()

  const toggleQuestion = (questionIndex) => {
    const newSet = new Set(openQuestions)
    if (newSet.has(questionIndex)) {
      newSet.delete(questionIndex)
    } else {
      newSet.add(questionIndex)
    }
    setOpenQuestions(newSet)
  }

  const currentCategory = faqCategories[activeCategory]

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      {/* Hero Section */}
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">Frequently Asked Questions</h1>
          <p className="text-gray-300 mt-3 text-lg">Everything you need to know about buying your dream car</p>
        </div>
      </div>

      <section ref={sectionRef} className="opacity-0-init max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-24">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 px-2">Categories</p>
              <nav className="space-y-1">
                {faqCategories.map((cat, idx) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setActiveCategory(idx)
                      setOpenQuestions(new Set([0]))
                    }}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 flex items-center gap-3 ${
                      activeCategory === idx
                        ? 'bg-black text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm">{cat.category}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Questions Section */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-black text-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentCategory.icon}</span>
                  <h2 className="text-2xl font-bold">{currentCategory.category}</h2>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {currentCategory.questions.map((item, idx) => {
                  const isOpen = openQuestions.has(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleQuestion(idx)}
                      className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                                {item.q}
                              </p>
                              {isOpen && (
                                <p className="text-gray-700 mt-3 leading-relaxed">
                                  {item.a}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <span 
                          className={`flex-shrink-0 text-2xl font-bold transition-transform duration-200 ${
                            isOpen ? 'text-blackline-accent rotate-45' : 'text-gray-400'
                          }`}
                        >
                          +
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Still have questions CTA */}
            <div className="mt-8 bg-black text-white rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
              <p className="text-gray-300 mb-6">
                Our team is here to help. Contact us directly for personalized assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-block bg-white text-black px-6 py-3 rounded-md hover:bg-gray-100 transition font-semibold"
                >
                  Contact Us
                </a>
                <a
                  href="tel:+48600000000"
                  className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-md hover:bg-white/10 transition font-semibold"
                >
                  Call: +48 600 000 000
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
