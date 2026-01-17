import React, { useState } from 'react'

export default function TestDriveCTA() {
  const [form, setForm] = useState({ name: '', phone: '', date: '' })
  const [status, setStatus] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.date) {
      setStatus({ type: 'error', msg: 'Please add name, phone, and date.' })
      return
    }
    setStatus({ type: 'success', msg: 'Request saved. We will call you shortly.' })
    setForm({ name: '', phone: '', date: '' })
  }

  return (
    <section className="bg-white text-black py-10 md:py-14">
      <article className="max-w-7xl mx-auto grid md:grid-cols-[1fr,1.2fr] items-stretch rounded-xl overflow-hidden bg-black border border-gray-200 shadow-xl">
        <div className="p-8 md:p-10 flex flex-col justify-center gap-4 md:order-1 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Book a test drive</p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-white">Experience the car in person</h2>
          <p className="text-gray-300 mt-2">Leave your contact and preferred date. Our concierge will confirm and prep the car.</p>

          <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="+48 600 000 000"
              inputMode="tel"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="date">Preferred date</label>
            <input
              id="date"
              name="date"
              value={form.date}
              onChange={onChange}
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              type="date"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blackline-accent text-black font-semibold py-3 rounded-md hover:opacity-90 transition"
          >
            Book now
          </button>

          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {status.msg}
            </p>
          )}
        </form>
        </div>

        <div className="hidden md:flex md:order-2 items-center justify-center bg-gradient-to-br from-black/40 via-blackline-surface to-black/60 rounded-r-xl overflow-hidden">
          <img src="/img/TESTDRIVE.png" alt="Test drive car" className="w-full h-full object-cover" />
        </div>
      </article>
    </section>
  )
}
