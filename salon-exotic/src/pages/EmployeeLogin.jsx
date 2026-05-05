import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function EmployeeLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      localStorage.setItem('employeeToken', data.token)
      localStorage.setItem('employeeUser', JSON.stringify(data.user))
      
      // Kieruj na podstawie roli
      if (data.user.role === 'admin' || data.user.role === 'sales') {
        navigate('/admin/dashboard')
      } else {
        navigate(`/employee/profile/${data.user.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-gray-50 text-black min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-extrabold mb-2">Portal</h1>
          <p className="text-gray-600 mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blackline-accent hover:opacity-90 text-black font-bold py-3 rounded-lg transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
