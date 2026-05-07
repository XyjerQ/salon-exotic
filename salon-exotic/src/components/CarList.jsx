import React from 'react'

export default function CarList({ cars, isAdmin, onEdit, onDelete, onAdd, loading, onViewHistory }) {
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onAdd}
          className="bg-blackline-accent hover:opacity-90 text-black font-bold px-6 py-3 rounded-lg"
        >
          + Add New Car
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : cars.length === 0 ? (
        <p className="text-gray-600">No cars yet.</p>
      ) : (
        <div className="grid gap-6">
          {cars.map(car => (
            <div key={car.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-4 gap-6">
                {car.primary_image && (
                  <div className="md:col-span-1">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${car.primary_image}`}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/300x200?text=Car'}}
                    />
                  </div>
                )}
                <div className={isAdmin ? 'md:col-span-2' : 'md:col-span-3'}>
                  <h3 className="text-2xl font-bold mb-2">{car.make} {car.model}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{car.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-600">Year:</span> <span className="font-semibold">{car.year}</span></div>
                    <div><span className="text-gray-600">Price:</span> <span className="font-semibold">{car.price}</span></div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="md:col-span-1">
                    <p className="text-sm text-gray-600 mb-2">Advisor ID: <span className="font-semibold">{car.advisor_id}</span></p>
                    {car.featured && <p className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mb-2">Featured</p>}
                  </div>
                )}
                <div className="md:col-span-4 flex gap-3">
                  <button
                    onClick={() => onEdit(car.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(car.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onViewHistory(car.id)}
                    className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded font-medium"
                  >
                    Service History
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
