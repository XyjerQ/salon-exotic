import React, { useState } from 'react'

export default function CarList({ cars = [], employees = [], userRole, onEdit, onDelete, onAdd, loading, onViewHistory, onViewDetails }) {
  const [deletingId, setDeletingId] = useState(null)

  const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/?api\/?$/, '')
  const frontendBase = import.meta.env.BASE_URL || '/'
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return ''
    if (/^https?:\/\//i.test(imagePath)) return imagePath
    if (imagePath.startsWith('/uploads/')) return `${mediaBase}${imagePath}`
    return `${frontendBase}${imagePath.replace(/^\//, '')}`
  }

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

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId)
      setDeletingId(null)
    }
  }

  // Znajdź auto, które aktualnie chcemy usunąć (dla wyświetlenia nazwy w modalu)
  const carToDelete = safeCars.find(c => c.id === deletingId)
  const carNameDisplay = carToDelete ? `${carToDelete.make} ${carToDelete.model}` : 'this car'

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
                <div className="grid items-stretch gap-0 md:grid-cols-[400px_minmax(0,1fr)]">
                  <div className="relative min-h-[280px] self-stretch overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 md:min-h-0">
                    {car.primary_image ? (
                      <img
                        src={resolveImageUrl(car.primary_image)}
                        alt={`${car.make} ${car.model}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Car' }}
                      />
                    ) : (
                      <div className="flex h-full min-h-[280px] flex-col justify-between p-6 text-white">
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
                          {car.status === 'sold' && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">sold</span>}
                        </div>
                      </div>

                      {!isCustomerVehicle && (
                        <div className="rounded-xl bg-gray-900 hover:bg-black px-4 py-2 text-right text-white shadow-sm">
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
                      {canViewServiceHistory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onViewHistory(car.id)
                          }}
                          className="text-sm font-medium text-white bg-gray-900 hover:bg-black px-3.5 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          Service History
                        </button>
                      )}

                      {allowAction && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onEdit(car.id)
                            }}
                            className="text-md text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeletingId(car.id)
                            }}
                            className="hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-xs font-medium transition"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal potwierdzenia usunięcia z dynamiczną nazwą auta */}
      {deletingId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Delete: "{carNameDisplay}"</h4>
                <p className="text-sm text-gray-500">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete Car
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}