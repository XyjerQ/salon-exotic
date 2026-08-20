import React, { useEffect, useState } from 'react'
import FeaturesEditor from './FeaturesEditor'
import ImagesUploader from './ImagesUploader'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function CarForm({ carId, isAdmin, employees = [], token, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    description: '',
    featured: false,
    advisor_id: '',
    transmission: '',
    drivetrain: '',
    fuel_type: '',
    engine: '',
    mileage_km: '',
    horsepower_hp: '',
    exterior_color: '',
    interior_color: '',
    vin: '',
    vehicle_type: 'inventory',
    owner_name: '',
    owner_contact: ''
  })
  const [features, setFeatures] = useState([])
  const [imagesPayload, setImagesPayload] = useState({ files: [], paths: [] })
  const [formError, setFormError] = useState('')

  const user = JSON.parse(localStorage.getItem('employeeUser') || '{}')

  useEffect(() => {
    if (!carId) {
      if (!isAdmin) setFormData((prev) => ({ ...prev, advisor_id: user.id }))
      setFeatures([])
      setImagesPayload({ files: [], paths: [] })
      return
    }

    fetchCar()
  }, [carId])

  const fetchCar = async () => {
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`)
      if (!res.ok) return
      const data = await res.json()

      setFormData({
        make: data.make || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        price: data.price || '',
        description: data.description || '',
        featured: data.featured === 1,
        advisor_id: data.advisor_id || '',
        transmission: data.transmission || '',
        drivetrain: data.drivetrain || '',
        fuel_type: data.fuel_type || '',
        engine: data.engine || '',
        mileage_km: data.mileage_km || '',
        horsepower_hp: data.horsepower_hp || '',
        exterior_color: data.exterior_color || '',
        interior_color: data.interior_color || '',
        vin: data.vin || '',
        vehicle_type: data.vehicle_type || 'inventory',
        owner_name: data.owner_name || '',
        owner_contact: data.owner_contact || ''
      })
      setFeatures(data.features || [])
      setImagesPayload({ files: [], paths: (data.images || []).map((image) => image.image_path) })
    } catch (err) {
      // ignore
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImagesChange = ({ files = [], paths = [] }) => setImagesPayload({ files, paths })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      if (imagesPayload.files && imagesPayload.files.length > 0) {
        setFormError('Files selected will be ignored. Provide image paths or use image upload endpoint.')
      }

      const isCustomerVehicle = formData.vehicle_type === 'customer'

      const payload = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        description: formData.description,
        transmission: formData.transmission,
        drivetrain: formData.drivetrain,
        fuel_type: formData.fuel_type,
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
        payload.featured = isCustomerVehicle ? false : formData.featured
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

  const isCustomerVehicle = formData.vehicle_type === 'customer'

  return (
    <div className="max-w-3xl bg-white border border-gray-200 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-2">{carId ? 'Edit' : 'Add'} Car</h2>
      <p className="text-sm text-gray-500 mb-6">Update the car data shown on the details page and inventory.</p>
      {formError && <div className="mb-4 text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Basic information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
              <input name="make" value={formData.make} onChange={handleInputChange} placeholder="Make" className="border px-3 py-2 rounded w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input name="model" value={formData.model} onChange={handleInputChange} placeholder="Model" className="border px-3 py-2 rounded w-full" required />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle type</label>
              <select name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} className="border px-3 py-2 rounded w-full">
                <option value="inventory">Inventory (for sale)</option>
                <option value="customer">Customer vehicle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year of production</label>
              <input name="year" type="number" value={formData.year} onChange={handleInputChange} className="border px-3 py-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">VIN</label>
              <input name="vin" value={formData.vin} onChange={handleInputChange} placeholder="VIN" className="border px-3 py-2 rounded w-full" />
            </div>
          </div>

          {isCustomerVehicle ? (
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exterior color</label>
                <input name="exterior_color" value={formData.exterior_color} onChange={handleInputChange} placeholder="Exterior color" className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                <input name="mileage_km" type="number" value={formData.mileage_km} onChange={handleInputChange} className="border px-3 py-2 rounded w-full" placeholder="Mileage (km)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Engine</label>
                <input name="engine" value={formData.engine} onChange={handleInputChange} placeholder="Engine" className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel type</label>
                <input name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} placeholder="Petrol / Diesel" className="border px-3 py-2 rounded w-full" />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input name="price" type="number" value={formData.price} onChange={handleInputChange} className="border px-3 py-2 rounded w-full" placeholder="Price (€)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                <input name="mileage_km" type="number" value={formData.mileage_km} onChange={handleInputChange} className="border px-3 py-2 rounded w-full" placeholder="Mileage (km)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horsepower</label>
                <input name="horsepower_hp" type="number" value={formData.horsepower_hp} onChange={handleInputChange} className="border px-3 py-2 rounded w-full" placeholder="HP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel type</label>
                <input name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} placeholder="Petrol / Diesel" className="border px-3 py-2 rounded w-full" />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{isCustomerVehicle ? 'Owner Info' : 'Drivetrain and body'}</h3>
          {formData.vehicle_type === 'inventory' ? (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                  <input name="transmission" value={formData.transmission} onChange={handleInputChange} placeholder="Transmission" className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drivetrain</label>
                  <input name="drivetrain" value={formData.drivetrain} onChange={handleInputChange} placeholder="Drivetrain" className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engine</label>
                  <input name="engine" value={formData.engine} onChange={handleInputChange} placeholder="Engine" className="border px-3 py-2 rounded w-full" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exterior color</label>
                  <input name="exterior_color" value={formData.exterior_color} onChange={handleInputChange} placeholder="Exterior color" className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interior color</label>
                  <input name="interior_color" value={formData.interior_color} onChange={handleInputChange} placeholder="Interior color" className="border px-3 py-2 rounded w-full" />
                </div>
              </div>
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner name</label>
                <input name="owner_name" value={formData.owner_name} onChange={handleInputChange} placeholder="Owner name" className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner contact</label>
                <input name="owner_contact" value={formData.owner_contact} onChange={handleInputChange} placeholder="Owner contact" className="border px-3 py-2 rounded w-full" />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="text-sm text-gray-500">This text appears on the car details page and the inventory card preview.</p>
          <textarea name="description" value={formData.description} onChange={handleInputChange} rows="6" className="w-full border px-3 py-2 rounded" />
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Features and media</h3>
          <p className="text-sm text-gray-500">Current features and images are loaded from the database when editing.</p>
          <FeaturesEditor value={features} onChange={setFeatures} />
          <ImagesUploader initial={imagesPayload.paths} onChange={handleImagesChange} />
        </section>

        {isAdmin && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Admin options</h3>
            <div className={`grid ${isCustomerVehicle ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advisor</label>
                <select name="advisor_id" value={formData.advisor_id} onChange={handleInputChange} className="border px-3 py-2 rounded w-full">
                  <option value="">Assign advisor</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
              </div>
              {!isCustomerVehicle && (
                <label className="flex items-center gap-2 pt-8">
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} /> Featured
                </label>
              )}
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-blackline-accent text-black py-3 rounded">{loading ? 'Saving...' : carId ? 'Update' : 'Create'}</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 text-black py-3 rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}