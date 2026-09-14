import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function EmployeesList({ token, onEdit, onAdd }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stan dla ładnego modalu usuwania
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [reassignToId, setReassignToId] = useState('0') // Domyślnie 0 lub ID admina

  // Bezpieczne pobieranie tokena (z propsa lub localStorage)
  const activeToken = token || localStorage.getItem('employeeToken')

  const mediaBase = API_BASE.replace(/\/?api\/?$/, '')
  const frontendBase = import.meta.env.BASE_URL || '/'

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return ''
    if (/^https?:\/\//i.test(imagePath)) return imagePath
    if (imagePath.startsWith('/uploads/')) return `${mediaBase}${imagePath}`
    return `${frontendBase}${imagePath.replace(/^\//, '')}`
  }

  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'EP'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  // Pobieranie listy pracowników
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/employees`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch employees')
      }
      const data = await response.json()
      setEmployees(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [activeToken])

  // Otwarcie modalu usuwania
  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp)
    // Domyślnie ustawiamy na pierwszego innego pracownika (np. ID 0 lub admina), o ile istnieje
    const fallbackEmp = employees.find(e => e.id !== emp.id)
    setReassignToId(fallbackEmp ? String(fallbackEmp.id) : '0')
    setDeleteModalOpen(true)
  }

  // Wykonanie usunięcia z uwzględnieniem przekazania aut (reassignment)
  const confirmDelete = async () => {
    if (!employeeToDelete) return

    try {
      // Jeśli backend obsługuje przypisanie aut do kogoś innego przy usuwaniu,
      // przesyłamy w body lub query info o zastępczym ID (np. reassignTo)
      const response = await fetch(`${API_BASE}/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ reassignTo: Number(reassignToId) })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete employee')
      }

      // Natychmiastowa aktualizacja stanu lokalnego
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id))
      setDeleteModalOpen(false)
      setEmployeeToDelete(null)
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  if (error) {
    return <div className="p-4 rounded-lg bg-red-50 text-red-600 font-medium">Error: {error}</div>
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onAdd}
          className="bg-blackline-accent hover:opacity-90 text-black font-bold px-6 py-3 rounded-lg transition-opacity"
        >
          + Add New Employee
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-gray-600">No employees yet.</p>
      ) : (
        <div className="grid gap-5">
          {employees.map(emp => (
            <div key={emp.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-xl">
              <div className="grid gap-0 md:grid-cols-[200px_minmax(0,1fr)_auto]">
                
                {/* SEKCJA ZDJĘCIA / INICJAŁÓW */}
                <div className="relative min-h-[200px] md:min-h-full w-full bg-gradient-to-br from-black via-gray-800 to-gray-700 flex items-center justify-center overflow-hidden">
                  {emp.photo_path ? (
                    <img
                      src={resolveImageUrl(emp.photo_path)}
                      alt={emp.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-white/15 text-white text-2xl font-bold tracking-wide">
                      {getInitials(emp.name)}
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-7">
                  <div className="flex flex-wrap items-start gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          emp.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : emp.role === 'manager'
                            ? 'bg-yellow-100 text-yellow-800'
                            : emp.role === 'service'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {emp.role}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          ID: {emp.id}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900">{emp.name}</h3>

                      <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                        <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start sm:gap-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-5 sm:pt-0.5">Email</span>
                          <span className="font-medium text-gray-900">{emp.email || 'No email provided'}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start sm:gap-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-5 sm:pt-0.5">Phone</span>
                          <span className="font-medium text-gray-900">{emp.phone || '—'}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start sm:gap-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-5 sm:pt-0.5">Bio / Description</span>
                          <span className="font-medium text-gray-900">{emp.description || 'No bio provided'}</span>
                        </div>
                        <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start sm:gap-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-5 sm:pt-0.5">Specialization</span>
                          <span className="font-medium text-gray-900">{emp.specialization || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRZYCISKI AKCJI (Edit i Delete) */}
                <div className="flex items-start gap-2 p-6 md:p-7 md:pl-0">
                  <button
                    onClick={() => onEdit(emp.id)}
                    className="text-md text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(emp)}
                    className="rounded-lg px-4 py-2 font-medium text-red-500 transition-colors hover:bg-red-200"
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
            </div>
          ))}
        </div>
      )}


      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Delete Employee</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{employeeToDelete?.name}</span>? 
              Any cars assigned to this advisor will be reassigned.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Reassign assigned cars to:
              </label>
              <select
                value={reassignToId}
                onChange={(e) => setReassignToId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 bg-white focus:border-black focus:outline-none"
              >
                <option value="0">System / Unassigned (ID: 0)</option>
                {employees
                  .filter(e => e.id !== employeeToDelete?.id)
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role} - ID: {e.id})
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}