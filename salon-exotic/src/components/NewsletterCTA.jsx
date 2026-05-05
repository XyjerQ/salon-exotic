import React, { useState } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const sectionRef = useScrollAnimation()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus({ type: 'error', msg: 'Please enter a valid email.' })
      return
    }
    setStatus({ type: 'success', msg: 'Subscribed for new arrivals alerts.' })
    setEmail('')
  }

  return (
    <section ref={sectionRef} className="opacity-0-init bg-blackline-surface text-white py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Alerts & newsletter</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2">Be first when a new car lands</h2>
          <p className="text-gray-300 mt-3">No spam—only fresh arrivals, limited builds, and drive events.</p>
        </div>

        <form onSubmit={onSubmit} className="w-full md:max-w-md bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
          <label className="text-sm text-gray-300 space-y-1">
            <span>E-mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="you@example.com"
              type="email"
            />
          </label>
          <button type="submit" className="w-full bg-blackline-accent text-black font-semibold py-3 rounded-md hover:opacity-90 transition">
            Sign me up
          </button>
          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
