import React, { useEffect, useState } from 'react'
import FeaturesEditor from './FeaturesEditor'
import ImageCropper from './ImageCropper' // Image cropper helper component

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function CarForm({ carId, isAdmin, employees = [], token, onSave, onCancel, loading }) {
  const user = JSON.parse(localStorage.getItem('employeeUser') || '{}')
  const userRole = (user.role || '').toLowerCase()
  const isService = userRole === 'service'

  const activeToken = token || localStorage.getItem('employeeToken')

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    description: '',
    featured: false,
    inventory_visible: true,
    advisor_id: isService ? user.id : '',
    transmission: '',
    drivetrain: '',
    fuel_type: '',
    engine: '',
    mileage_km: '',
    horsepower_hp: '',
    exterior_color: '',
    interior_color: '',
    vin: '',
    vehicle_type: isService && !carId ? 'customer' : 'inventory',
    owner_name: '',
    owner_contact: ''
  })
  
  const [features, setFeatures] = useState([])
  const [formError, setFormError] = useState('')

  // Unified image payload state:
  // - paths: existing paths in the database (strings)
  // - files: new files cropped from the cropper (File objects)
  // - previews: local preview URLs for new files
  const [imagesPayload, setImagesPayload] = useState({ paths: [], files: [], previews: [] })

  // State for the cropping modal
  const [isCropperOpen, setIsCropperOpen] = useState(false)

  useEffect(() => {
    if (!carId) {
      setFormData((prev) => ({
        ...prev,
        advisor_id: !isAdmin || isService ? user.id : prev.advisor_id,
        vehicle_type: isService ? 'customer' : prev.vehicle_type
      }))
      setFeatures([])
      setImagesPayload({ paths: [], files: [], previews: [] })
      return
    }

    fetchCar()
  }, [carId, activeToken])

  const fetchCar = async () => {
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      if (!res.ok) return
      const data = await res.json()

      setFormData({
        make: data.make || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        price: data.price || '',
        description: data.description || '',
        featured: data.featured === 1 || data.featured === '1' || data.featured === true,
        inventory_visible: data.inventory_visible !== 0,
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
      
      // Load existing image paths from database
      setImagesPayload({
        paths: (data.images || []).map((image) => image.image_path || image.url || image),
        files: [],
        previews: []
      })
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Handle approved cropped file from modal
  const handleCroppedImage = (file) => {
    const totalImagesCount = imagesPayload.paths.length + imagesPayload.files.length
    if (totalImagesCount >= 6) {
      alert('You can add a maximum of 6 images.')
      setIsCropperOpen(false)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagesPayload((prev) => ({
      ...prev,
      files: [...prev.files, file],
      previews: [...prev.previews, previewUrl]
    }))
    setIsCropperOpen(false)
  }

  // Remove existing path (from database)
  const removeExistingPath = (indexToRemove) => {
    setImagesPayload((prev) => ({
      ...prev,
      paths: prev.paths.filter((_, idx) => idx !== indexToRemove)
    }))
  }

  // Remove new file (before submit)
  const removeNewFile = (indexToRemove) => {
    setImagesPayload((prev) => {
      URL.revokeObjectURL(prev.previews[indexToRemove])
      return {
        ...prev,
        files: prev.files.filter((_, idx) => idx !== indexToRemove),
        previews: prev.previews.filter((_, idx) => idx !== indexToRemove)
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const currentAdvisorId = isService ? user.id : formData.advisor_id
      const currentVehicleType = isService ? 'customer' : formData.vehicle_type
      const isCustomerVehicle = currentVehicleType === 'customer'

      const data = new FormData()

      data.append('make', formData.make)
      data.append('model', formData.model)
      data.append('year', formData.year)
      data.append('price', formData.price || '')
      data.append('description', formData.description || '')
      data.append('transmission', formData.transmission || '')
      data.append('drivetrain', formData.drivetrain || '')
      data.append('fuel_type', formData.fuel_type || '')
      data.append('engine', formData.engine || '')
      data.append('mileage_km', formData.mileage_km || '')
      data.append('horsepower_hp', formData.horsepower_hp || '')
      data.append('exterior_color', formData.exterior_color || '')
      data.append('interior_color', formData.interior_color || '')
      data.append('vin', formData.vin || '')
      data.append('vehicle_type', currentVehicleType)
      data.append('advisor_id', currentAdvisorId)
      data.append('owner_name', formData.owner_name || '')
      data.append('owner_contact', formData.owner_contact || '')
      data.append('inventory_visible', formData.inventory_visible ? 1 : 0)

      const featuredVal = isAdmin && !isCustomerVehicle ? formData.featured : false
      data.append('featured', featuredVal ? 1 : 0)

      data.append('features', JSON.stringify(features || []))
      data.append('image_paths', JSON.stringify(imagesPayload.paths || []))

      if (imagesPayload.files && imagesPayload.files.length > 0) {
        imagesPayload.files.forEach((file) => {
          data.append('images', file)
        })
      }

      const url = carId ? `${API_BASE}/cars/${carId}` : `${API_BASE}/cars`
      const method = carId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${activeToken}`
        },
        body: data
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
  const totalImagesCount = imagesPayload.paths.length + imagesPayload.files.length

  return (
    <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-lg p-8">
      {/* NAGŁÓWERK POZA UKŁADEM DWUKOLUMNOWYM */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold">{carId ? 'Edit Car' : 'Add Car'}</h2>
        <p className="text-sm text-gray-500 mt-1">Update the car data shown on the details page and inventory.</p>
      </div>

      {formError && <div className="mb-6 text-red-700 bg-red-50 border border-red-200 p-3 rounded">{formError}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEWA STRONA: GŁÓWNY FORMULARZ (2 kolumny na dużych ekranach) */}
        <div className="lg:col-span-2 space-y-6">
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
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  disabled={isService}
                  className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {!isService && <option value="inventory">Inventory (for sale)</option>}
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
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="6" className="w-full border px-3 py-2 rounded" />
          </section>

          {/* Przywrócony edytor cech / wyposażenia */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Features & Equipment</h3>
            <FeaturesEditor value={features} onChange={setFeatures} />
          </section>

          {(isAdmin || userRole === 'sales') && !isService && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Inventory options</h3>
              <div className={`grid ${isAdmin && !isCustomerVehicle ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advisor</label>
                    <select name="advisor_id" value={formData.advisor_id} onChange={handleInputChange} className="border px-3 py-2 rounded w-full">
                      <option value="">Assign advisor</option>
                      {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                    </select>
                  </div>
                )}
                {!isCustomerVehicle && (
                  <div className="space-y-3 pt-8">
                    {isAdmin && (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} /> Featured
                      </label>
                    )}
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="inventory_visible" checked={formData.inventory_visible} onChange={handleInputChange} /> Visible in public inventory
                    </label>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-black text-white font-bold py-3 rounded disabled:opacity-50">
              {loading ? 'Saving...' : carId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded">
              Cancel
            </button>
          </div>
        </div>

        {/* PRAWA STRONA: GALERIA I PODGLĄD ZDJĘĆ W STYLU "CAR DETAILS" */}
        <div className="lg:col-span-1 space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-200 h-fit sticky top-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Vehicle Images</h3>
              <p className="text-xs text-gray-500">{totalImagesCount}/6 photos added</p>
            </div>
            {totalImagesCount < 6 && (
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition shadow-sm"
              >
                + Add & Crop
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* 1. Existing images from DB */}
            {imagesPayload.paths.map((path, index) => {
              const fullImageUrl = path.startsWith('http') 
                ? path 
                : `${API_BASE.replace(/\/api$/, '')}${path}`

              return (
                <div key={`existing-${index}`} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm h-48 flex items-center justify-center">
                  <img src={fullImageUrl} alt={`Car existing ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingPath(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full text-xs opacity-80 group-hover:opacity-100 transition shadow"
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Saved</span>
                </div>
              )
            })}

            {/* 2. New cropped preview images */}
            {imagesPayload.previews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm h-48 flex items-center justify-center">
                <img src={preview} alt={`Car new preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full text-xs opacity-80 group-hover:opacity-100 transition shadow"
                  title="Remove image"
                >
                  ✕
                </button>
                <span className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded">New</span>
              </div>
            ))}

            {totalImagesCount === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 bg-white">
                <p className="text-sm">No photos added yet.</p>
                <p className="text-xs mt-1">Click "Add & Crop" to upload photos.</p>
              </div>
            )}
          </div>
        </div>

      </form>

      {/* Cropper Modal */}
      {isCropperOpen && (
        <ImageCropper
          onCropComplete={handleCroppedImage}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  )
}