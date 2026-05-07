import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function EmployeeForm({ empId, token, onSave, onCancel, loading }) {
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
    setFormData(prev => ({ ...prev, [name]: value }))
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

      if (formData.password) payload.password = formData.password

      if (!empId && !formData.password) throw new Error('Password is required for new employee')

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
