import React, { useEffect, useState } from 'react'
import FeaturesEditor from './FeaturesEditor'
import ImagesUploader from './ImagesUploader'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function CarForm({ carId, isAdmin, employees = [], token, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(), price: '', description: '', featured: false, advisor_id: '',
    engine: '', mileage_km: '', horsepower_hp: '', exterior_color: '', interior_color: '',
    vin: '', vehicle_type: 'inventory', owner_name: '', owner_contact: ''
  })
  const [features, setFeatures] = useState([])
  const [imagesPayload, setImagesPayload] = useState({ files: [], paths: [] })
  const [formError, setFormError] = useState('')

  const user = JSON.parse(localStorage.getItem('employeeUser') || '{}')

  useEffect(() => {
    if (!carId) {
      if (!isAdmin) setFormData(prev => ({ ...prev, advisor_id: user.id }))
    } else {
      fetchCar()
    }
  }, [carId])

  const fetchCar = async () => {
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`)
      if (!res.ok) return
      const data = await res.json()
      setFormData({
        make: data.make || '', model: data.model || '', year: data.year || new Date().getFullYear(),
        price: data.price || '', description: data.description || '', featured: data.featured === 1, advisor_id: data.advisor_id || '',
        engine: data.engine || '', mileage_km: data.mileage_km || '', horsepower_hp: data.horsepower_hp || '',
        exterior_color: data.exterior_color || '', interior_color: data.interior_color || '',
        vin: data.vin || '', vehicle_type: data.vehicle_type || 'inventory', owner_name: data.owner_name || '', owner_contact: data.owner_contact || ''
      })
      setFeatures(data.features || [])
      setImagesPayload({ files: [], paths: (data.images || []).map(i => i.image_path) })
    } catch (err) {
      // ignore
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImagesChange = ({ files = [], paths = [] }) => setImagesPayload({ files, paths })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      // Send JSON payload (same pattern as EmployeeForm). File uploads selected in ImagesUploader will be ignored —
      // provide image paths instead or use a dedicated upload flow.
      if (imagesPayload.files && imagesPayload.files.length > 0) {
        // warn user that files won't be uploaded with current flow
        setFormError('Files selected will be ignored. Provide image paths or use image upload endpoint.')
      }

      const payload = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        description: formData.description,
        engine: formData.engine,
        mileage_km: formData.mileage_km,
        horsepower_hp: formData.horsepower_hp,
        exterior_color: formData.exterior_color,
        interior_color: formData.interior_color,
        vin: formData.vin,
        vehicle_type: formData.vehicle_type,
        owner_name: formData.owner_name,
        owner_contact: formData.owner_contact,
        features: features || [],
        image_paths: imagesPayload.paths || []
      }

      if (isAdmin) {
        payload.featured = formData.featured
        payload.advisor_id = formData.advisor_id
      }

      const url = carId ? `${API_BASE}/cars/${carId}` : `${API_BASE}/cars`
      const method = carId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      onSave && onSave()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className="max-w-3xl bg-white border border-gray-200 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6">{carId ? 'Edit' : 'Add'} Car</h2>
      {formError && <div className="mb-4 text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <input name="make" value={formData.make} onChange={handleInputChange} placeholder="Make" className="border px-3 py-2 rounded" required />
          <input name="model" value={formData.model} onChange={handleInputChange} placeholder="Model" className="border px-3 py-2 rounded" required />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <select name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} className="border px-3 py-2 rounded">
            <option value="inventory">Inventory (for sale)</option>
            <option value="customer">Customer vehicle</option>
          </select>

          <input name="year" type="number" value={formData.year} onChange={handleInputChange} className="border px-3 py-2 rounded" />
          <input name="vin" value={formData.vin} onChange={handleInputChange} placeholder="VIN" className="border px-3 py-2 rounded" />
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <input name="year" type="number" value={formData.year} onChange={handleInputChange} className="border px-3 py-2 rounded" />
          <input name="price" type="number" value={formData.price} onChange={handleInputChange} className="border px-3 py-2 rounded" />
          <input name="mileage_km" type="number" value={formData.mileage_km} onChange={handleInputChange} className="border px-3 py-2 rounded" placeholder="Mileage (km)" />
          <input name="horsepower_hp" type="number" value={formData.horsepower_hp} onChange={handleInputChange} className="border px-3 py-2 rounded" placeholder="HP" />
        </div>

        {formData.vehicle_type === 'inventory' ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="engine" value={formData.engine} onChange={handleInputChange} placeholder="Engine" className="border px-3 py-2 rounded" />
              <input name="exterior_color" value={formData.exterior_color} onChange={handleInputChange} placeholder="Exterior color" className="border px-3 py-2 rounded" />
            </div>

            <div>
              <input name="interior_color" value={formData.interior_color} onChange={handleInputChange} placeholder="Interior color" className="w-full border px-3 py-2 rounded" />
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <input name="owner_name" value={formData.owner_name} onChange={handleInputChange} placeholder="Owner name" className="border px-3 py-2 rounded" />
            <input name="owner_contact" value={formData.owner_contact} onChange={handleInputChange} placeholder="Owner contact" className="border px-3 py-2 rounded" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <FeaturesEditor value={features} onChange={setFeatures} />
        </div>

        <div>
          <ImagesUploader initial={imagesPayload.paths} onChange={handleImagesChange} />
        </div>

        {isAdmin && (
          <div className="grid md:grid-cols-2 gap-4">
            <select name="advisor_id" value={formData.advisor_id} onChange={handleInputChange} className="border px-3 py-2 rounded">
              <option value="">Assign advisor</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} /> Featured</label>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-blackline-accent text-black py-3 rounded">{loading ? 'Saving...' : carId ? 'Update' : 'Create'}</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 text-black py-3 rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}
