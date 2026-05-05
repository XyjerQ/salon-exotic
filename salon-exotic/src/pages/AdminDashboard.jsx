import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// ============= Car Components =============
function CarsList({ cars, isAdmin, onEdit, onDelete, onAdd, loading }) {
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onAdd}
          className="bg-blackline-accent hover:opacity-90 text-black font-bold px-6 py-3 rounded-lg"
        >
          + Add New Car
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : cars.length === 0 ? (
        <p className="text-gray-600">No cars yet.</p>
      ) : (
        <div className="grid gap-6">
          {cars.map(car => (
            <div key={car.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-4 gap-6">
                {car.image_path && (
                  <div className="md:col-span-1">
                    <img
                      src={`http://localhost:4000${car.image_path}`}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/300x200?text=Car'}}
                    />
                  </div>
                )}
                <div className={isAdmin ? 'md:col-span-2' : 'md:col-span-3'}>
                  <h3 className="text-2xl font-bold mb-2">{car.make} {car.model}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{car.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-600">Year:</span> <span className="font-semibold">{car.year}</span></div>
                    <div><span className="text-gray-600">Price:</span> <span className="font-semibold">${car.price?.toLocaleString()}</span></div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="md:col-span-1">
                    <p className="text-sm text-gray-600 mb-2">Advisor ID: <span className="font-semibold">{car.advisor_id}</span></p>
                    {car.featured && <p className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mb-2">Featured</p>}
                  </div>
                )}
                <div className="md:col-span-4 flex gap-3">
                  <button
                    onClick={() => onEdit(car.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(car.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CarForm({ carId, isAdmin, employees, token, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    description: '',
    featured: false,
    advisor_id: ''
  })
  const [image, setImage] = useState(null)
  const [formError, setFormError] = useState('')
  const user = JSON.parse(localStorage.getItem('employeeUser') || '{}')

  useEffect(() => {
    if (!carId) {
      if (!isAdmin) {
        setFormData(prev => ({ ...prev, advisor_id: user.id }))
      }
    } else {
      fetchCar()
    }
  }, [carId, isAdmin, user.id])

  const fetchCar = async () => {
    try {
      const response = await fetch(`${API_BASE}/cars/${carId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          make: data.make,
          model: data.model,
          year: data.year,
          price: data.price,
          description: data.description,
          featured: data.featured === 1,
          advisor_id: data.advisor_id
        })
      }
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'price' ? parseFloat(value) : value)
    }))
  }

  const handleImageChange = (e) => {
    setImage(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const formDataObj = new FormData()
      formDataObj.append('make', formData.make)
      formDataObj.append('model', formData.model)
      formDataObj.append('year', formData.year)
      formDataObj.append('price', formData.price)
      formDataObj.append('description', formData.description)

      if (isAdmin) {
        formDataObj.append('featured', formData.featured)
        formDataObj.append('advisor_id', formData.advisor_id)
      }

      if (image) {
        formDataObj.append('image', image)
      }

      const url = carId ? `${API_BASE}/cars/${carId}` : `${API_BASE}/cars`
      const method = carId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save car')
      }

      onSave()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6">{carId ? 'Edit' : 'Add'} Car</h2>

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="BMW, Ferrari, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="M4, F8 Tributo, etc."
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="100000"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
            placeholder="Describe this car..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Car Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500"
          />
          {image && <p className="text-xs text-gray-600 mt-2">Selected: {image.name}</p>}
        </div>

        {isAdmin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Advisor (Sales Person)</label>
              <select
                name="advisor_id"
                value={formData.advisor_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                required
              >
                <option value="">Select an employee...</option>
                {employees.filter(e => e.role === 'sales').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                id="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700">
                Featured Car
              </label>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blackline-accent hover:opacity-90 text-black font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : carId ? 'Update Car' : 'Add Car'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function EmployeesList({ employees, onEdit, onAdd, loading }) {
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onAdd}
          className="bg-blackline-accent hover:opacity-90 text-black font-bold px-6 py-3 rounded-lg"
        >
          + Add New Employee
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-gray-600">No employees yet.</p>
      ) : (
        <div className="grid gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{emp.name}</h3>
                  <p className="text-sm text-gray-600">{emp.email}</p>
                  <p className="text-sm text-gray-600">{emp.phone}</p>
                  {emp.specialization && <p className="text-sm text-gray-600 mt-1">{emp.specialization}</p>}
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    emp.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {emp.role}
                  </span>
                </div>
                <button
                  onClick={() => onEdit(emp.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmployeeForm({ empId, token, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    specialization: '',
    password: ''
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (empId) {
      fetchEmployee()
    }
  }, [empId, token])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees/${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          description: data.description || '',
          specialization: data.specialization || '',
          password: ''
        })
      }
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        specialization: formData.specialization
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (!empId && !formData.password) {
        throw new Error('Password is required for new employee')
      }

      const url = empId ? `${API_BASE}/employees/${empId}` : `${API_BASE}/employees`
      const method = empId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save employee')
      }

      onSave()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6">{empId ? 'Edit' : 'Add'} Employee</h2>

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="+48 600 000 000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
            placeholder="e.g., Luxury Sports Cars"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
            placeholder="Tell about this employee..."
          />
        </div>

        {!empId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password (required for new)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="••••••••"
              required
            />
          </div>
        )}

        {empId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password (leave empty to keep current)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder="••••••••"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blackline-accent hover:opacity-90 text-black font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : empId ? 'Update Employee' : 'Add Employee'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ============= Main Dashboard =============
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [view, setView] = useState('cars-list')
  const [editingCarId, setEditingCarId] = useState(null)
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  
  const [cars, setCars] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem('employeeToken')
  const user = JSON.parse(localStorage.getItem('employeeUser') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    if (!token) {
      navigate('/employee/login')
      return
    }
    if (user.role !== 'admin' && user.role !== 'sales') {
      navigate('/employee/login')
      return
    }
    fetchData()
  }, [token, navigate, user.role])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const carsRes = await fetch(`${API_BASE}/cars`)
      const carsData = await carsRes.json()
      
      if (!isAdmin) {
        setCars(carsData.filter(car => car.advisor_id === user.id))
      } else {
        setCars(carsData)
      }

      if (isAdmin) {
        const empRes = await fetch(`${API_BASE}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (empRes.ok) {
          setEmployees(await empRes.json())
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCar = async (id) => {
    if (!window.confirm('Delete this car?')) return

    try {
      const response = await fetch(`${API_BASE}/cars/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setCars(cars.filter(car => car.id !== id))
        setSuccess('Car deleted successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    navigate('/employee/login')
  }

  const handleSaveCar = () => {
    setView('cars-list')
    setEditingCarId(null)
    setSuccess(`Car ${editingCarId ? 'updated' : 'created'} successfully!`)
    setTimeout(() => setSuccess(''), 3000)
    fetchData()
  }

  const handleSaveEmployee = () => {
    setView('employees-list')
    setEditingEmployeeId(null)
    setSuccess(`Employee ${editingEmployeeId ? 'updated' : 'created'} successfully!`)
    setTimeout(() => setSuccess(''), 3000)
    fetchData()
  }

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      {/* Header */}
      <div className="bg-black text-white py-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">{isAdmin ? 'Admin' : 'Sales'} Dashboard</h1>
            <p className="text-gray-400 text-sm">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/employee/profile/${user.id}`)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        {(view === 'cars-list' || view === 'employees-list') && (
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setView('cars-list')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                view === 'cars-list'
                  ? 'border-blackline-accent text-black'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              Cars ({cars.length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setView('employees-list')}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                  view === 'employees-list'
                    ? 'border-blackline-accent text-black'
                    : 'border-transparent text-gray-600 hover:text-black'
                }`}
              >
                Employees ({employees.length})
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Views */}
        {view === 'cars-list' && (
          <CarsList
            cars={cars}
            isAdmin={isAdmin}
            onEdit={(id) => {
              setEditingCarId(id)
              setView('car-form')
            }}
            onDelete={handleDeleteCar}
            onAdd={() => {
              setEditingCarId(null)
              setView('car-form')
            }}
            loading={loading}
          />
        )}

        {view === 'car-form' && (
          <CarForm
            carId={editingCarId}
            isAdmin={isAdmin}
            employees={employees}
            token={token}
            onSave={handleSaveCar}
            onCancel={() => {
              setView('cars-list')
              setEditingCarId(null)
            }}
            loading={loading}
          />
        )}

        {view === 'employees-list' && isAdmin && (
          <EmployeesList
            employees={employees}
            onEdit={(id) => {
              setEditingEmployeeId(id)
              setView('employee-form')
            }}
            onAdd={() => {
              setEditingEmployeeId(null)
              setView('employee-form')
            }}
            loading={loading}
          />
        )}

        {view === 'employee-form' && isAdmin && (
          <EmployeeForm
            empId={editingEmployeeId}
            token={token}
            onSave={handleSaveEmployee}
            onCancel={() => {
              setView('employees-list')
              setEditingEmployeeId(null)
            }}
            loading={loading}
          />
        )}
      </div>
    </main>
  )
}
