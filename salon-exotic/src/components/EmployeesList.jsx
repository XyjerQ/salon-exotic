import React from 'react'

export default function EmployeesList({ employees, onEdit, onAdd, loading }) {
  const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/?api\/?$/, '')

  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'EP'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

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
        <div className="grid gap-5">
          {employees.map(emp => (
            <div key={emp.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-xl">
              {/* Zmieniono grid na poziomie kafelka: lewa kolumna ma teraz np. 160px na desktopie lub pełną szerokość na mobile */}
              <div className="grid gap-0 md:grid-cols-[200px_minmax(0,1fr)_auto]">
                
                {/* SEKCJA ZDJĘCIA / INICJAŁÓW NA CAŁĄ WYSOKOŚĆ I SZEROKOŚĆ KAFELKA */}
                <div className="relative min-h-[200px] md:min-h-full w-full bg-gradient-to-br from-black via-gray-800 to-gray-700 flex items-center justify-center overflow-hidden">
                  {emp.photo_path ? (
                    <img
                      src={`${mediaBase}${emp.photo_path}`}
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
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {emp.role || 'employee'}
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

                <div className="flex items-start p-6 md:p-7 md:pl-0">
                  <button
                    onClick={() => onEdit(emp.id)}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Edit
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