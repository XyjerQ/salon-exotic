import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CarList from '../components/CarList'
import ServiceHistory from '../components/ServiceHistory'
import CarForm from '../components/CarForm'
import EmployeesList from '../components/EmployeesList'
import EmployeeForm from '../components/EmployeeForm'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

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
  const [serviceVin, setServiceVin] = useState('')

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

  const fetchData = async (vin) => {
    setLoading(true)
    setError('')
    try {
      const q = vin ? `?vin=${encodeURIComponent(vin)}` : ''
      const carsRes = await fetch(`${API_BASE}/cars${q}`)
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
            <button
              onClick={() => setView('service-history')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                view === 'service-history'
                  ? 'border-blackline-accent text-black'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              Service History
            </button>
        </div>

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
          <div>
            <div className="mb-4 flex items-center gap-2">
              <input placeholder="Search VIN" className="border px-3 py-2 rounded flex-1" onChange={(e) => fetchData(e.target.value)} />
            </div>
            <CarList
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
              onViewHistory={(id) => {
                // open Service History tab for this car's VIN
                const c = cars.find(ca => ca.id === id)
                setServiceVin(c?.vin || '')
                setView('service-history')
              }}
            />
          </div>
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
      {view === 'service-history' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <ServiceHistory initialVin={serviceVin} />
        </div>
      )}
    </main>
  )
}
