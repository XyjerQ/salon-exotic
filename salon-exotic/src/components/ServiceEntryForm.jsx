import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function ServiceEntryForm({ car, onEntryAdded }) {
  const [entry, setEntry] = useState({ service_date: '', service_type: '', description: '', mileage_km: '', cost: '', provider: '' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('employeeToken')

  const handleEntryChange = (e) => {
    const { name, value } = e.target
    setEntry(prev => ({ ...prev, [name]: value }))
  }

  const submitEntry = async (e) => {
    e.preventDefault()
    setError('')
    if (!car || !car.id) {
      setError('No car selected')
      return
    }
    if (!entry.service_date || !entry.service_type) {
      setError('Service date and type are required')
      return
    }
    
    setAdding(true)
    try {
      const res = await fetch(`${API_BASE}/cars/${car.id}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(entry)
      })
      if (res.ok) {
        const created = await res.json()
        onEntryAdded && onEntryAdded(created)
        setEntry({ service_date: '', service_type: '', description: '', mileage_km: '', cost: '', provider: '' })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to add service entry')
      }
    } catch (e) {
      console.error('submitEntry error:', e)
      setError(e.message)
    }
    setAdding(false)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold mb-4">Add Service Entry</h4>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={submitEntry} className="space-y-4">
        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Date *</label>
            <input 
              type="date"
              name="service_date" 
              value={entry.service_date} 
              onChange={handleEntryChange} 
              className="w-full border px-2 py-2 rounded" 
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Type *</label>
            <input 
              type="text"
              name="service_type" 
              value={entry.service_type} 
              onChange={handleEntryChange} 
              placeholder="Oil change, repair, etc." 
              className="w-full border px-2 py-2 rounded" 
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
            <input 
              type="text"
              name="provider" 
              value={entry.provider} 
              onChange={handleEntryChange} 
              placeholder="Service shop name" 
              className="w-full border px-2 py-2 rounded" 
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mileage (km)</label>
            <input 
              type="number"
              name="mileage_km" 
              value={entry.mileage_km} 
              onChange={handleEntryChange} 
              placeholder="0" 
              className="w-full border px-2 py-2 rounded" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
            <input 
              type="number"
              name="cost" 
              value={entry.cost} 
              onChange={handleEntryChange} 
              placeholder="0" 
              className="w-full border px-2 py-2 rounded" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            name="description" 
            value={entry.description} 
            onChange={handleEntryChange} 
            placeholder="Service details..." 
            rows="3"
            className="w-full border px-2 py-2 rounded" 
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            type="submit" 
            disabled={adding || !car} 
            className="bg-blackline-accent text-black px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}
