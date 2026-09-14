import React, { useEffect, useState } from 'react'
import ServiceEntryForm from './ServiceEntryForm'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function ServiceHistory({ initialVin = '' }) {
  const [loading, setLoading] = useState(false)
  const [allCars, setAllCars] = useState([])
  const [history, setHistory] = useState([])
  const [car, setCar] = useState(null)
  const [vinLookup, setVinLookup] = useState(initialVin)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)

  // Stan dla ładnego modala usuwania
  const [deletingId, setDeletingId] = useState(null)

  const token = localStorage.getItem('employeeToken')

  useEffect(() => {
    fetchAllCarsAndInit()
  }, [initialVin])

  const fetchAllCarsAndInit = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cars`)
      const arr = await res.json()
      if (Array.isArray(arr)) {
        setAllCars(arr)
        
        if (initialVin) {
          setVinLookup(initialVin)
          const found = arr.find(c => c.vin?.toLowerCase() === initialVin.toLowerCase())
          if (found) {
            await loadCarDetails(found.id)
            setLoading(false)
            return
          }
        }
      }
    } catch (e) {
      console.error('Initialization error:', e)
      setError('Failed to load vehicle list')
    }
    setLoading(false)
  }

  const loadCarDetails = async (carId) => {
    if (!carId) {
      setCar(null)
      setHistory([])
      setVinLookup('')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`)
      const fullCar = await res.json()
      if (res.ok) {
        setCar(fullCar)
        setVinLookup(fullCar.vin || '')
        setHistory(fullCar.service_history || [])
      } else {
        setError(fullCar.error || 'Failed to load car details')
      }
    } catch (e) {
      console.error('loadCarDetails error:', e)
      setError(e.message)
    }
    setLoading(false)
  }

  const lookupByVin = async () => {
    if (!vinLookup) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cars?vin=${encodeURIComponent(vinLookup)}`)
      const arr = await res.json()
      if (arr && arr.length > 0) {
        await loadCarDetails(arr[0].id)
      } else {
        setCar(null)
        setHistory([])
        setError('No car found with this VIN')
      }
    } catch (e) {
      console.error('lookupByVin error:', e)
      setError(e.message)
      setCar(null)
      setHistory([])
    }
    setLoading(false)
  }

  const handleEntryAdded = async () => {
    if (car?.id) {
      await loadCarDetails(car.id)
    }
  }

  const startEdit = (e) => {
    setEditingId(e.id)
    setEditingEntry({ 
      service_date: e.service_date?.split('T')[0] || '', 
      service_type: e.service_type || '', 
      description: e.description || '', 
      mileage_km: e.mileage_km || '', 
      cost: e.cost || '', 
      provider: e.provider || '' 
    })
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
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editingEntry)
      })
      
      if (res.ok) {
        cancelEdit()
        if (car?.id) await loadCarDetails(car.id)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to update entry')
      }
    } catch (e) {
      console.error('submitEdit error:', e)
      setError(e.message)
    }
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/cars/service/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok || res.status === 204) {
        setDeletingId(null)
        if (car?.id) await loadCarDetails(car.id)
      } else {
        setError('Failed to delete entry')
        setDeletingId(null)
      }
    } catch (e) {
      console.error('deleteEntry error:', e)
      setError(e.message)
      setDeletingId(null)
    }
  }

  // Znajdź wpis serwisowy, który aktualnie chcemy usunąć (dla wyświetlenia nazwy w modalu)
  const entryToDelete = history.find(e => e.id === deletingId)
  const entryNameDisplay = entryToDelete 
    ? `${entryToDelete.service_type} (${entryToDelete.service_date?.split('T')[0] || ''})` 
    : 'this record'

  return (
    <div className="space-y-6 relative">
      {/* Vehicle Selection & VIN Lookup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Select or Lookup Vehicle</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Choose from all cars in system</label>
            <select
              value={car?.id || ''}
              onChange={(e) => loadCarDetails(e.target.value)}
              className="border px-3 py-2 rounded w-full bg-white"
            >
              <option value="">-- Select a car --</option>
              {allCars.map(c => (
                <option key={c.id} value={c.id}>
                  {c.make} {c.model} ({c.year}) - {c.vin || 'No VIN'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Or lookup by VIN</label>
            <div className="flex items-center gap-2">
              <input 
                value={vinLookup} 
                onChange={(e) => setVinLookup(e.target.value)} 
                placeholder="Enter VIN" 
                className="border px-3 py-2 rounded flex-1" 
              />
              <button onClick={lookupByVin} className="bg-black text-white px-4 py-2 rounded font-medium">Find</button>
              <button onClick={() => { setVinLookup(''); setCar(null); setHistory([]); setError('') }} className="bg-gray-200 px-3 py-2 rounded font-medium">Clear</button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

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

      {car && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Service History ({history.length})</h3>

          {history.length === 0 ? (
            <p className="text-gray-600">No service history recorded for this vehicle.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {history.map(entry => (
                <div key={entry.id} className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-base">{entry.service_type}</div>
                      <div className="text-sm text-gray-600">{entry.service_date?.split('T')[0]}</div>
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
                        <button onClick={submitEdit} className="bg-black text-white px-3 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {entry.description && <p className="text-sm text-gray-700 mt-1">{entry.description}</p>}

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          Mileage: {entry.mileage_km ?? '—'} km · Cost: {entry.cost ?? '—'}
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => startEdit(entry)} 
                            title="Edit" 
                            className="text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeletingId(entry.id)} 
                            title="Delete"
                            className="text-sm hover:bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {car && !loading && (
        <ServiceEntryForm car={car} onEntryAdded={handleEntryAdded} />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Delete: "{entryNameDisplay}"</h4>
                <p className="text-sm text-gray-500">Are you sure you want to remove this record? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}