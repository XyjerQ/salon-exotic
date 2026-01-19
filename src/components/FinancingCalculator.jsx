import React, { useMemo, useState } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function FinancingCalculator() {
  const [price, setPrice] = useState('35000')
  const [down, setDown] = useState('5000')
  const [rate, setRate] = useState('6.5')
  const [term, setTerm] = useState('48')
  const sectionRef = useScrollAnimation()

  const { monthly, totalInterest } = useMemo(() => {
    const p = Math.max(0, Number(price) || 0)
    const d = Math.max(0, Number(down) || 0)
    const r = Math.max(0, Number(rate) || 0)
    const n = Math.max(1, Number(term) || 1)
    const loan = Math.max(0, p - d)
    const monthlyRate = r === 0 ? 0 : r / 100 / 12

    if (monthlyRate === 0) {
      const m = loan / n
      return { monthly: m, totalInterest: 0 }
    }

    const pow = Math.pow(1 + monthlyRate, n)
    const m = (loan * monthlyRate * pow) / (pow - 1)
    return { monthly: m, totalInterest: m * n - loan }
  }, [price, down, rate, term])

  return (
    <section className="text-black py-10 md:py-14">
      <article ref={sectionRef} className="opacity-0-init max-w-7xl mx-auto grid md:grid-cols-[1.2fr,1fr] items-stretch rounded-xl overflow-hidden bg-black border border-gray-200 shadow-xl">
        <div className="p-8 md:p-10 flex flex-col justify-center gap-6 md:order-2 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Financing & leasing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 leading-tight text-white">Estimate your monthly</h2>
            <p className="text-gray-300 mt-3">Quick mock calculator. We will prepare an exact offer once you pick a car and financing profile.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-300 space-y-1">
              <span>Car price (EUR)</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                inputMode="decimal"
              />
            </label>
            <label className="text-sm text-gray-300 space-y-1">
              <span>Down payment (EUR)</span>
              <input
                value={down}
                onChange={(e) => setDown(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-300 space-y-1">
              <span>Interest %</span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                inputMode="decimal"
              />
            </label>
            <label className="text-sm text-gray-300 space-y-1">
              <span>Term (months)</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-gray-300">Per month</p>
            <p className="text-3xl font-extrabold text-white mt-1">€{monthly ? monthly.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}</p>
            <p className="text-sm text-gray-400 mt-2">Estimated total interest: €{totalInterest ? totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}</p>
          </div>

          <p className="text-xs text-gray-400">Illustrative only, not a binding offer.</p>
          </div>
        </div>

         <div className="hidden md:flex md:order-1 items-center justify-center bg-gradient-to-br from-black/40 via-blackline-surface to-black/60 rounded-l-xl overflow-hidden">
          <img src="/img/LEASING.png" alt="Financing visual" className="w-full h-full object-cover" />
        </div>
      </article>
    </section>
  )
}
