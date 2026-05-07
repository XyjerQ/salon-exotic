import React from 'react'

export default function EmployeesList({ employees, onEdit, onAdd, loading }) {
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
