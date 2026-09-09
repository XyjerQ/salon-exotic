import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const emptyForm = {
  transaction_type: 'vehicle_sale',
  car_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  title: '',
  description: '',
  amount: '',
  payment_method: 'transfer',
  status: 'completed',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: ''
}

const typeLabels = { vehicle_sale: 'Vehicle sale', service: 'Service', detailing: 'Detailing' }
const statusLabels = { planned: 'Planned', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' }
const typeDescriptions = {
  vehicle_sale: 'Vehicle sale. When saved as Completed, the selected vehicle will be marked as Sold and hidden from the public inventory.',
  service: 'Service work performed for a customer or a salon vehicle.',
  detailing: 'Detailing service, such as paint correction, ceramic coating, or interior care.'
}

export default function TransactionHistoryManager({ token, userRole, userPermissions = [] }) {
  const [records, setRecords] = useState([])
  const [cars, setCars] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canManageAll = ['admin', 'manager'].includes(userRole) || userPermissions.includes('transactions.manage_all')
  const availableTypes = canManageAll ? ['vehicle_sale', 'service', 'detailing'] : userRole === 'service' ? ['service', 'detailing'] : ['vehicle_sale']

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Transaction operation failed')
    return data
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [history, carsResponse] = await Promise.all([
        request(`${API_BASE}/transaction-history`),
        fetch(`${API_BASE}/cars`)
      ])
      setRecords(history)
      if (carsResponse.ok) setCars(await carsResponse.json())
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [token])

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const startEdit = (record) => {
    setEditingId(record.id)
    setForm({
      transaction_type: record.transaction_type,
      car_id: record.car_id || '',
      customer_name: record.customer_name || '',
      customer_email: record.customer_email || '',
      customer_phone: record.customer_phone || '',
      title: record.title || '',
      description: record.description || '',
      amount: record.amount ?? '',
      payment_method: record.payment_method || 'transfer',
      status: record.status || 'completed',
      transaction_date: record.transaction_date?.slice(0, 10) || '',
      notes: record.notes || ''
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...emptyForm, transaction_type: availableTypes[0] || 'vehicle_sale' })
  }

  const saveRecord = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await request(editingId ? `${API_BASE}/transaction-history/${editingId}` : `${API_BASE}/transaction-history`, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form)
      })
      setSuccess(editingId ? 'Transaction updated.' : 'Transaction added.')
      resetForm()
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this transaction record?')) return
    try {
      await request(`${API_BASE}/transaction-history/${id}`, { method: 'DELETE' })
      setSuccess('Transaction deleted.')
      await loadData()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const visibleRecords = filter === 'all' ? records : records.filter((record) => record.transaction_type === filter)
  const money = (value) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value || 0))

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Transactions History</h2>
          <p className="text-gray-500 text-sm">Track vehicle sales, service work, and detailing revenue.</p>
        </div>
        <button onClick={loadData} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">Refresh</button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <form onSubmit={saveRecord} className="border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{editingId ? 'Edit transaction' : 'Add transaction'}</h3>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-gray-600 underline">Cancel edit</button>}
        </div>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {typeDescriptions[form.transaction_type]}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Type</span><select name="transaction_type" value={form.transaction_type} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">{availableTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Customer</span><input required name="customer_name" value={form.customer_name} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Customer name" /></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Title</span><input required name="title" value={form.title} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Service or sale title" /></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Amount (PLN)</span><input required min="0" step="0.01" type="number" name="amount" value={form.amount} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2" /></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Date</span><input required type="date" name="transaction_date" value={form.transaction_date} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2" /></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Status</span><select name="status" value={form.status} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Vehicle{form.transaction_type === 'vehicle_sale' ? ' (required)' : ''}</span><select required={form.transaction_type === 'vehicle_sale'} name="car_id" value={form.car_id} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white"><option value="">No vehicle</option>{cars.map((car) => <option key={car.id} value={car.id} disabled={form.transaction_type === 'vehicle_sale' && car.status === 'sold'}>{car.make} {car.model} {car.vin ? `(${car.vin})` : ''}{form.transaction_type === 'vehicle_sale' && car.status === 'sold' ? ' - Sold' : ''}</option>)}</select></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Payment</span><select name="payment_method" value={form.payment_method} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white"><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option><option value="leasing">Leasing</option><option value="credit">Credit</option></select></label>
          <label><span className="block text-sm font-medium text-gray-700 mb-1">Phone</span><input name="customer_phone" value={form.customer_phone} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2" /></label>
          <label className="md:col-span-2"><span className="block text-sm font-medium text-gray-700 mb-1">Description</span><textarea name="description" value={form.description} onChange={updateForm} rows="2" className="w-full border border-gray-300 rounded px-3 py-2 resize-y" /></label>
          <label className="md:col-span-3"><span className="block text-sm font-medium text-gray-700 mb-1">Notes</span><textarea name="notes" value={form.notes} onChange={updateForm} rows="2" className="w-full border border-gray-300 rounded px-3 py-2 resize-y" /></label>
        </div>
        <button disabled={saving} className="mt-4 bg-blackline-accent text-black px-5 py-2 rounded font-semibold disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add transaction'}</button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-semibold mr-2">Filter:</span>
        {['all', 'vehicle_sale', 'service', 'detailing'].map((value) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded text-sm ${filter === value ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{value === 'all' ? 'All' : typeLabels[value]}</button>)}
      </div>

      {loading ? <p className="text-gray-500 py-6 text-center">Loading transaction history...</p> : visibleRecords.length === 0 ? <p className="text-gray-500 py-6 text-center">No transaction records found.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead><tr className="border-b border-gray-200 text-gray-600 text-sm"><th className="py-3 px-3 w-[13%]">Type</th><th className="py-3 px-3 w-[20%]">Customer</th><th className="py-3 px-3 w-[25%]">Details</th><th className="py-3 px-3 w-[13%]">Date</th><th className="py-3 px-3 w-[12%]">Amount</th><th className="py-3 px-3 w-[10%]">Status</th><th className="py-3 px-3 w-[7%]">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100 text-sm">{visibleRecords.map((record) => <tr key={record.id} className="hover:bg-gray-50"><td className="py-3 px-3"><span className="font-semibold">{typeLabels[record.transaction_type]}</span></td><td className="py-3 px-3 truncate"><span className="font-semibold block truncate">{record.customer_name}</span><span className="text-gray-500 block truncate">{record.customer_email || 'No email'}</span></td><td className="py-3 px-3 truncate"><span className="font-medium block truncate">{record.title}</span><span className="text-gray-500 block truncate">{record.make ? `${record.make} ${record.model}` : record.description}</span></td><td className="py-3 px-3 text-gray-600 whitespace-nowrap">{new Date(record.transaction_date).toLocaleDateString()}</td><td className="py-3 px-3 font-semibold whitespace-nowrap">{money(record.amount)}</td><td className="py-3 px-3"><span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-xs">{statusLabels[record.status] || record.status}</span></td><td className="py-3 px-3"><div className="flex gap-1"><button onClick={() => startEdit(record)} title="Edit" className="text-gray-700 hover:bg-gray-200 p-2 rounded">Edit</button><button onClick={() => deleteRecord(record.id)} title="Delete" className="text-red-600 hover:bg-red-100 p-2 rounded">&#128465;</button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}
