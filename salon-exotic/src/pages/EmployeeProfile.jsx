import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    specialization: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const token = localStorage.getItem('employeeToken')
  const currentUser = JSON.parse(localStorage.getItem('employeeUser') || '{}')

  useEffect(() => {
    if (!token) {
      navigate('/employee/login')
      return
    }

    fetchEmployee()
  }, [id, token, navigate])

  const fetchEmployee = async () => {
    try {
      // Debug: sprawdzenie tokenu
      if (!token) {
        throw new Error('No token found. Please login first.')
      }

      const response = await fetch(`${API_BASE}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || response.statusText
        
        if (response.status === 401) {
          throw new Error('Token expired. Please login again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You can only edit your own profile.')
        } else if (response.status === 404) {
          throw new Error('Employee not found.')
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setEmployee(data)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        description: data.description || '',
        specialization: data.specialization || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      })
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return

    setUploadingPhoto(true)
    setError('')
    setSuccess('')

    try {
      const formDataObj = new FormData()
      formDataObj.append('photo', photoFile)

      const response = await fetch(`${API_BASE}/employees/${id}/upload-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const data = await response.json()
      setEmployee(data.employee)
      setPhotoFile(null)
      setSuccess('Photo uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const hasPasswordChange =
        formData.currentPassword || formData.newPassword || formData.confirmNewPassword

      if (hasPasswordChange) {
        if (!formData.currentPassword) {
          throw new Error('Podaj stare hasło')
        }
        if (!formData.newPassword || !formData.confirmNewPassword) {
          throw new Error('Wpisz nowe hasło dwa razy')
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Nowe hasła muszą być takie same')
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        specialization: formData.specialization
      }

      if (hasPasswordChange) {
        payload.currentPassword = formData.currentPassword
        payload.newPassword = formData.newPassword
        payload.confirmNewPassword = formData.confirmNewPassword
      }

      const response = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      setEmployee(data)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    navigate('/employee/login')
  }

  if (loading) {
    return (
      <main className="bg-gray-50 text-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-gray-50 text-black min-h-screen">
      {/* Header */}
      <div className="bg-black text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold">My Profile</h1>
            <p className="text-gray-300 mt-2">Update your information</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Messages */}
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

        <div className="grid md:grid-cols-3 gap-8">
          {/* Photo Section */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>

              {/* Current Photo */}
              <div className="mb-4">
                {employee?.photo_path ? (
                  <img
                    src={`${API_BASE}${employee.photo_path}`}
                    alt={employee.name}
                    className="w-full h-auto rounded-lg object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=' + employee.name.charAt(0) }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-4xl font-bold text-gray-400">
                    {employee?.name?.charAt(0) || 'E'}
                  </div>
                )}
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-sm text-gray-500 mb-2"
                />
                {photoFile && (
                  <p className="text-xs text-gray-600 mb-2">
                    Selected: {photoFile.name}
                  </p>
                )}
                {photoFile && (
                  <button
                    type="button"
                    onClick={uploadPhoto}
                    disabled={uploadingPhoto}
                    className="w-full bg-blackline-accent hover:opacity-90 text-black font-bold py-2 rounded-lg disabled:opacity-50 transition-opacity"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Edit Profile</h3>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+48 600 000 000"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Luxury Sports Cars"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell customers about yourself..."
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blackline-accent hover:opacity-90 text-black font-bold py-3 rounded-lg disabled:opacity-50 transition-opacity"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
