import React from 'react'

export default function CarList({ cars = [], employees = [], userRole, onEdit, onDelete, onAdd, loading, onViewHistory, onViewDetails }) {
  const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/?api\/?$/, '')

  const safeCars = Array.isArray(cars) ? cars : []

  const isAdminOrManager = ['admin', 'manager'].includes(userRole)
  const canViewServiceHistory = ['admin', 'manager', 'sales', 'service'].includes(userRole)

  // Rola service oraz admin/manager mogą dodawać nowe auta
  const canAddCar = ['admin', 'manager', 'service'].includes(userRole)

  // Funkcja sprawdzająca czy dany konkretny samochód może być edytowany/usunięty przez tego użytkownika
  const canModifyCar = (car) => {
    if (isAdminOrManager) return true
    if (userRole === 'service') {
      const type = (car.vehicle_type || '').toLowerCase()
      return type === 'customer'
    }
    return false
  }

  const getAdvisorLabel = (advisorId) => {
    if (!advisorId) return 'Unassigned'
    const advisor = employees.find((employee) => String(employee.id) === String(advisorId))
    if (advisor?.name) return advisor.name
    const fallback = advisor?.email?.split('@')?.[0]
    return fallback ? fallback.replace(/[._-]/g, ' ') : `ID ${advisorId}`
  }

  const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') return '—'
    const numeric = Number(price)
    if (!Number.isFinite(numeric)) return String(price)
    
    const formatted = new Intl.NumberFormat('pl-PL', {
      useGrouping: true,
      maximumFractionDigits: 0
    }).format(numeric)

    return `${formatted} €`
  }

  return (
    <div>
      <div className="mb-6">
        {canAddCar && (
          <button
            onClick={onAdd}
            className="bg-blackline-accent hover:opacity-90 text-black font-bold px-6 py-3 rounded-lg"
          >
            + Add New Car
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : safeCars.length === 0 ? (
        <p className="text-gray-600">No cars yet.</p>
      ) : (
        <div className="grid gap-6">
          {safeCars.map(car => {
            const allowAction = canModifyCar(car)
            const isCustomerVehicle = (car.vehicle_type || '').toLowerCase() === 'customer'

            return (
              <div
                key={car.id}
                className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-xl ${onViewDetails ? 'cursor-pointer' : ''}`}
                onClick={() => onViewDetails && onViewDetails(car.id)}
                role={onViewDetails ? 'button' : undefined}
                tabIndex={onViewDetails ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!onViewDetails) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onViewDetails(car.id)
                  }
                }}
              >
                <div className="grid gap-0 md:grid-cols-[400px_minmax(0,1fr)]">
                  <div className="relative min-h-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 md:min-h-full">
                    {car.primary_image ? (
                      <img
                        src={`${mediaBase}${car.primary_image}`}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Car' }}
                      />
                    ) : (
                      <div className="flex h-full min-h-64 flex-col justify-between p-6 text-white">
                        <div className="flex gap-2">
                          {Boolean(car.featured) && <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-black">Featured</span>}
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                            {car.vehicle_type || 'inventory'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Vehicle</p>
                          <h3 className="mt-2 text-3xl font-bold leading-tight">{car.make} {car.model}</h3>
                          <p className="mt-3 text-sm text-white/75">No image uploaded yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {Boolean(car.featured) && <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Featured</span>}
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{car.vehicle_type || 'inventory'}</span>
                        </div>
                      </div>

                      {!isCustomerVehicle && (
                        <div className="rounded-xl bg-black px-4 py-2 text-right text-white shadow-sm">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Price</div>
                          <div className="text-lg font-bold">{formatPrice(car.price)}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-1">
                      <h3 className="text-2xl font-bold text-gray-900">{car.make} {car.model}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 line-clamp-2">{car.description || 'No description provided.'}</p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Year</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">{car.year || '—'}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Mileage</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">{car.mileage_km ? `${new Intl.NumberFormat('pl-PL', { useGrouping: true }).format(car.mileage_km)} km` : '—'}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">VIN</div>
                        <div className="mt-1 break-words font-mono text-sm font-semibold tracking-wide text-gray-900">{car.vin || '—'}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Engine</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">{car.engine || '—'}</div>
                      </div>
                    </div>

                    {isCustomerVehicle && (
                      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">Owner Contact Details</div>
                        <div className="grid gap-1 text-sm text-gray-800">
                          <div><span className="font-medium text-gray-500">Name:</span> {car.owner_name || '—'}</div>
                          <div><span className="font-medium text-gray-500">Phone:</span> {car.owner_contact || '—'}</div>
                          <div><span className="font-medium text-gray-500">Email:</span> {car.owner_email || '—'}</div>
                        </div>
                      </div>
                    )}

                    {userRole && (
                      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                          Advisor: {getAdvisorLabel(car.advisor_id)}
                        </span>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {allowAction && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onEdit(car.id)
                            }}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onDelete(car.id)
                            }}
                            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {canViewServiceHistory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onViewHistory(car.id)
                          }}
                          className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-black transition-colors hover:bg-gray-300"
                        >
                          Service History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}