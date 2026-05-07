import React, { useEffect, useState } from 'react'
import ServiceEntryForm from './ServiceEntryForm'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function ServiceHistory({ initialVin = '' }) {
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [car, setCar] = useState(null)
  const [vinLookup, setVinLookup] = useState(initialVin)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)

  useEffect(() => {
    if (initialVin) lookupByVin(initialVin)
  }, [initialVin])

  const token = localStorage.getItem('employeeToken')

  const lookupByVin = async (value) => {
    const vin = value ?? vinLookup
    if (!vin) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cars?vin=${encodeURIComponent(vin)}`)
      const arr = await res.json()
      if (arr && arr.length > 0) {
        const c = arr[0]
        setCar(c)
        setHistory(c.service_history || [])
      } else {
        setCar(null)
        setHistory([])
        setError('No car found with this VIN')
      }
    } catch (e) {
      console.error('lookupByVin error:', e)
      setCar(null)
      setHistory([])
      setError(e.message)
    }
    setLoading(false)
  }

  const handleEntryAdded = (newEntry) => {
    setHistory(prev => [newEntry, ...prev])
  }

  const startEdit = (e) => {
    setEditingId(e.id)
    setEditingEntry({ service_date: e.service_date, service_type: e.service_type, description: e.description || '', mileage_km: e.mileage_km || '', cost: e.cost || '', provider: e.provider || '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingEntry(null)
  }

  const submitEdit = async () => {
    if (!editingId) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/cars/service/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingEntry)
      })
      if (res.ok) {
        const updated = await res.json()
        setHistory(prev => prev.map(h => (h.id === updated.id ? updated : h)))
        cancelEdit()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to update')
      }
    } catch (e) {
      console.error('submitEdit error:', e)
      setError(e.message)
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this service entry?')) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/cars/service/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 204) {
        setHistory(prev => prev.filter(h => h.id !== id))
      } else {
        setError('Failed to delete')
      }
    } catch (e) {
      console.error('deleteEntry error:', e)
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* VIN Lookup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Lookup Vehicle by VIN</h3>
        <div className="flex items-center gap-2">
          <input 
            value={vinLookup} 
            onChange={(e) => setVinLookup(e.target.value)} 
            placeholder="Enter VIN" 
            className="border px-3 py-2 rounded flex-1" 
          />
          <button onClick={() => lookupByVin()} className="bg-blackline-accent text-black px-4 py-2 rounded font-medium">Find</button>
          <button onClick={() => { setVinLookup(''); setCar(null); setHistory([]); setError('') }} className="bg-gray-200 px-4 py-2 rounded font-medium">Clear</button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {/* Car Details */}
      {car && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">{car.make} {car.model}</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
            <div>
              <span className="text-gray-600 text-sm">Year</span>
              <p className="text-lg font-semibold">{car.year}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">VIN</span>
              <p className="text-lg font-semibold font-mono">{car.vin || '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Engine</span>
              <p className="text-lg font-semibold">{car.engine || '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Horsepower</span>
              <p className="text-lg font-semibold">{car.horsepower_hp ? `${car.horsepower_hp} HP` : '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Mileage</span>
              <p className="text-lg font-semibold">{car.mileage_km ? `${car.mileage_km} km` : '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Price</span>
              <p className="text-lg font-semibold">{car.price || '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Exterior Color</span>
              <p className="text-lg font-semibold">{car.exterior_color || '—'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Interior Color</span>
              <p className="text-lg font-semibold">{car.interior_color || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Service History */}
      {car && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Service History ({history.length})</h3>

          {history.length === 0 ? (
            <p className="text-gray-600">No service history recorded.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {history.map(entry => (
                <div key={entry.id} className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-base">{entry.service_type}</div>
                      <div className="text-sm text-gray-600">{entry.service_date}</div>
                    </div>
                    <div className="text-sm text-gray-600">{entry.provider || '—'}</div>
                  </div>

                  {editingId === entry.id ? (
                    <div className="space-y-3 mt-3 p-3 bg-white border rounded">
                      <div className="grid md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Date</label>
                          <input 
                            type="date"
                            value={editingEntry?.service_date || ''} 
                            onChange={(e) => setEditingEntry(prev => ({ ...prev, service_date: e.target.value }))} 
                            className="w-full border px-2 py-1 rounded" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Type</label>
                          <input 
                            value={editingEntry?.service_type || ''} 
                            onChange={(e) => setEditingEntry(prev => ({ ...prev, service_type: e.target.value }))} 
                            className="w-full border px-2 py-1 rounded" 
                          />
                        </div>
                      </div>
                      <textarea 
                        value={editingEntry?.description || ''} 
                        onChange={(e) => setEditingEntry(prev => ({ ...prev, description: e.target.value }))} 
                        className="w-full border px-2 py-1 rounded" 
                        rows="2"
                      />
                      <div className="grid md:grid-cols-3 gap-2">
                        <input 
                          type="number"
                          value={editingEntry?.mileage_km || ''} 
                          onChange={(e) => setEditingEntry(prev => ({ ...prev, mileage_km: e.target.value }))} 
                          placeholder="Mileage" 
                          className="border px-2 py-1 rounded" 
                        />
                        <input 
                          type="number"
                          value={editingEntry?.cost || ''} 
                          onChange={(e) => setEditingEntry(prev => ({ ...prev, cost: e.target.value }))} 
                          placeholder="Cost" 
                          className="border px-2 py-1 rounded" 
                        />
                        <input 
                          value={editingEntry?.provider || ''} 
                          onChange={(e) => setEditingEntry(prev => ({ ...prev, provider: e.target.value }))} 
                          placeholder="Provider" 
                          className="border px-2 py-1 rounded" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={submitEdit} className="bg-blackline-accent text-black px-3 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {entry.description && <p className="text-sm text-gray-700 mt-2">{entry.description}</p>}
                      <div className="text-xs text-gray-500 mt-2">Mileage: {entry.mileage_km ?? '—'} km · Cost: {entry.cost ?? '—'}</div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => startEdit(entry)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Edit</button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Service Entry Form */}
      {car && !loading && (
        <ServiceEntryForm car={car} onEntryAdded={handleEntryAdded} />
      )}
    </div>
  )
}
