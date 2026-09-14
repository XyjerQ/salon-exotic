import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function TestDrivesManager({ authFetch, userRole }) {
  const canManage = ['admin', 'manager'].includes(userRole)
  const [testDrives, setTestDrives] = useState([])
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Stany edycji zgłoszenia
  const [editingId, setEditingId] = useState(null)
  const [editCustomerName, setEditCustomerName] = useState('')
  const [editCustomerPhone, setEditCustomerPhone] = useState('')
  const [editCustomerEmail, setEditCustomerEmail] = useState('')
  const [editRequestedDate, setEditRequestedDate] = useState('')
  const [selectedCarId, setSelectedCarId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('pending')
  const [notes, setNotes] = useState('')

  // Stan dla modala usuwania
  const [deletingId, setDeletingId] = useState(null)

  const fetchTestData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE}/test-drives`)
      if (!res.ok) throw new Error('Failed to fetch test drives')
      const data = await res.json()

      // Sortowanie domyślne po dacie (rosnąco)
      data.sort((a, b) => new Date(b.requested_date) - new Date(a.requested_date))
      
      setTestDrives(data)

      const carsRes = await authFetch(`${API_BASE}/cars`)
      if (canManage && carsRes.ok) {
        const carsData = await carsRes.json()
        const dealerCars = carsData.filter(car => !car.is_customer_vehicle && car.type !== 'customer' && car.owner_type !== 'customer')
        setCars(dealerCars)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestData()
  }, [])

  const handleStartEdit = (td) => {
    setEditingId(td.id)
    setEditCustomerName(td.customer_name || '')
    setEditCustomerPhone(td.customer_phone || '')
    setEditCustomerEmail(td.customer_email || '')
    setEditRequestedDate(td.requested_date || '')
    setSelectedCarId(td.car_id || '')
    setSelectedStatus(td.status || 'pending')
    setNotes(td.notes || '')
  }

  const handleSave = async (id) => {
    setError('')
    setSuccess('')
    try {
      const res = await authFetch(`${API_BASE}/test-drives/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: editCustomerName,
          customer_phone: editCustomerPhone,
          customer_email: editCustomerEmail,
          requested_date: editRequestedDate,
          status: selectedStatus,
          car_id: selectedCarId ? Number(selectedCarId) : null,
          notes: notes
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update test drive')

      setSuccess('Test drive updated successfully!')
      setEditingId(null)
      fetchTestData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setError('')
    setSuccess('')
    try {
      const res = await authFetch(`${API_BASE}/test-drives/${deletingId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      setTestDrives(testDrives.filter(td => td.id !== deletingId))
      setDeletingId(null)
      setSuccess('Deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
      setDeletingId(null)
    }
  }

  // Znajdź rezerwację, którą chcemy usunąć (dla wyświetlenia danych w modalu)
  const testDriveToDelete = testDrives.find(td => td.id === deletingId)
  const deleteDisplayInfo = testDriveToDelete 
    ? `${testDriveToDelete.customer_name} (${testDriveToDelete.requested_date || ''})` 
    : 'this request'

  const tableInputClass = "w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-black focus:bg-white rounded px-1.5 py-1 text-sm outline-none transition"

  return (
    <div className="bg-white rounded-xl shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Test Drive Requests</h2>
            <p className="text-gray-500 text-sm">{canManage ? 'Manage customer bookings, assign stock cars, and confirm dates.' : 'View customer test drive requests.'}</p>
        </div>
        <button
          onClick={fetchTestData}
          className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading requests...</p>
      ) : testDrives.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No test drive requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 text-sm">
                <th className="py-3 px-3 w-[15%]">Customer</th>
                <th className="py-3 px-3 w-[12%]">Phone</th>
                <th className="py-3 px-3 w-[14%]">Email</th>
                <th className="py-3 px-3 w-[13%]">Date</th>
                <th className="py-3 px-3 w-[20%]">Assigned Car</th>
                <th className="py-3 px-3 w-[11%]">Status</th>
                {canManage && <th className="py-3 px-3 w-[15%] text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {testDrives.map((td) => {
                const isEditing = editingId === td.id
                return (
                  <tr key={td.id} className="hover:bg-gray-50">
                    {/* Customer Name */}
                    <td className="py-3 px-3 truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCustomerName}
                          onChange={(e) => setEditCustomerName(e.target.value)}
                          className={`${tableInputClass} font-semibold`}
                          placeholder="Customer name"
                        />
                      ) : (
                        <span className="font-semibold block truncate">{td.customer_name}</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3 text-gray-600 truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCustomerPhone}
                          onChange={(e) => setEditCustomerPhone(e.target.value)}
                          className={tableInputClass}
                          placeholder="Phone"
                        />
                      ) : (
                        <span className="block truncate">{td.customer_phone}</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3 text-gray-600 truncate">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editCustomerEmail}
                          onChange={(e) => setEditCustomerEmail(e.target.value)}
                          className={tableInputClass}
                          placeholder="Email"
                        />
                      ) : (
                        <span className="block truncate">{td.customer_email || <span className="text-gray-400 italic">No email</span>}</span>
                      )}
                    </td>

                    {/* Requested Date */}
                    <td className="py-3 px-3 font-medium text-black truncate">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editRequestedDate}
                          onChange={(e) => setEditRequestedDate(e.target.value)}
                          className={`${tableInputClass} font-semibold text-black`}
                        />
                      ) : (
                        <span className="block truncate">{td.requested_date}</span>
                      )}
                    </td>
                    
                    {/* Assigned Car */}
                    <td className="py-3 px-3 truncate">
                      {isEditing ? (
                        <select
                          value={selectedCarId}
                          onChange={(e) => setSelectedCarId(e.target.value)}
                          className={tableInputClass}
                        >
                          <option value="">-- Select car --</option>
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.make} {car.model} ({car.year}) - {car.vin?.slice(-6)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`block truncate ${td.car_id ? 'text-black font-medium' : 'text-gray-400 italic'}`}>
                          {td.make ? `${td.make} ${td.model} (${td.year})` : 'Not assigned yet'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 truncate">
                      {isEditing ? (
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className={tableInputClass}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          td.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          td.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          td.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {td.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleSave(td.id)}
                            className="bg-black text-white px-3 py-1 rounded text-xs font-semibold hover:bg-gray-800 transition shadow-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit(td)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1 rounded-md text-xs font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(td.id)}
                            className="hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-xs font-medium transition"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia */}
      {deletingId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Delete: "{deleteDisplayInfo}"</h4>
                <p className="text-sm text-gray-500">Are you sure you want to remove this test drive request? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}