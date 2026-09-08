import React, { useState } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const sectionRef = useScrollAnimation()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ type: 'error', msg: 'Please enter a valid email.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch(`${API_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Unable to subscribe right now.')
      }

      setStatus({
        type: 'success',
        msg: data.emailSent
          ? 'Subscribed. Check your inbox for confirmation.'
          : 'Subscribed successfully.'
      })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section ref={sectionRef} className="opacity-0-init bg-blackline-surface text-white py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Alerts & newsletter</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2">Be first when a new car lands</h2>
          <p className="text-gray-300 mt-3">No spam - only fresh arrivals, limited builds, and drive events.</p>
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
          <button type="submit" disabled={loading} className="w-full bg-blackline-accent text-black font-semibold py-3 rounded-md hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Signing up...' : 'Sign me up'}
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
