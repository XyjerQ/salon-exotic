import React from 'react'
import employees from '../data/employees.json'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function Contact() {
  const gridRef = useScrollAnimation({ staggerChildren: true })

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      {/* Hero Section */}
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">Contact Us</h1>
          <p className="text-gray-300 mt-3 text-lg">Our team of experts is ready to help you</p>
        </div>
      </div>

      {/* Contact Info Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Visit Us</h3>
            <p className="text-gray-600 text-sm">
              ul. Ekskluzywna 123<br />
              00-001 Warsaw, Poland
            </p>
          </div>

          {/* Phone */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Call Us</h3>
            <p className="text-gray-600 text-sm">
              +48 600 000 000<br />
              Mon-Fri: 9:00 - 18:00
            </p>
          </div>

          {/* Email */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Email Us</h3>
            <p className="text-gray-600 text-sm">
              info@blackline.com<br />
              sales@blackline.com
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Our Team</p>
          <h2 className="text-3xl md:text-4xl font-extrabold">Meet Our Experts</h2>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Our passionate team brings years of experience in luxury and exotic vehicles. 
            We're here to guide you through every step of your journey.
          </p>
        </div>

        {/* Employee Cards */}
        <div ref={gridRef} className="opacity-0-init grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <div 
              key={employee.id} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Photo */}
              <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img 
                  src={employee.photo} 
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x500/1a1a1a/ffffff?text=' + 
                      employee.firstName.charAt(0) + employee.lastName.charAt(0)
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-sm text-blackline-accent font-semibold mb-3">
                  {employee.position}
                </p>
                
                {employee.specialization && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Specialization</p>
                    <p className="text-sm font-medium text-gray-700">{employee.specialization}</p>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-2">
                  <a 
                    href={`tel:${employee.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group/link"
                  >
                    <svg className="w-4 h-4 text-blackline-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="group-hover/link:underline">{employee.phone}</span>
                  </a>
                  
                  <a 
                    href={`mailto:${employee.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group/link"
                  >
                    <svg className="w-4 h-4 text-blackline-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="group-hover/link:underline truncate">{employee.email}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map or Additional Contact Form Section */}
        <div className="mt-16 bg-white border border-gray-200 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Send Us a Message</h3>
          <p className="text-gray-600 mb-6">
            Have a question? Fill out the form below and we'll get back to you as soon as possible.
          </p>
          
          <form className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input 
                type="tel" 
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="+48 600 000 000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent">
                <option>General Inquiry</option>
                <option>Test Drive Request</option>
                <option>Financing Question</option>
                <option>Vehicle Availability</option>
                <option>Trade-In</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea 
                rows="4"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent resize-none"
                placeholder="Tell us more about your needs..."
              ></textarea>
            </div>
            
            <div className="md:col-span-2">
              <button 
                type="submit"
                className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-semibold"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
