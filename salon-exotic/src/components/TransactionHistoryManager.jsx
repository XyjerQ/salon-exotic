import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const emptyForm = {
  transaction_type: 'vehicle_sale',
  car_id: '',
  customer_first_name: '',
  customer_last_name: '',
  customer_email: '',
  customer_phone: '',
  title: '',
  description: '',
  amount: '',
  payment_method: 'transfer',
  payment_status: 'paid',
  status: 'completed',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: ''
}

const typeLabels = { vehicle_sale: 'Vehicle sale', service: 'Service', detailing: 'Detailing' }
const statusLabels = { planned: 'Planned', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' }
const paymentStatusLabels = { paid: 'Paid', pending: 'Pending', deposit_paid: 'Deposit paid', unpaid: 'Unpaid' }
const paymentLabels = { cash: 'Cash', card: 'Card', transfer: 'Transfer', leasing: 'Leasing', credit: 'Credit' }
const typeDescriptions = {
  vehicle_sale: 'Vehicle sale. When saved as Completed, the selected vehicle will be marked as Sold and hidden from the public inventory.',
  service: 'Service work performed for a customer or a salon vehicle.',
  detailing: 'Detailing service, such as paint correction, ceramic coating, or interior care.'
}

export default function TransactionHistoryManager({ authFetch, userRole, userPermissions = [] }) {
  const [records, setRecords] = useState([])
  const [cars, setCars] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  
  // Filtry i wyszukiwarka
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Paginacja
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Modal szczegółów
  const [selectedDetailsRecord, setSelectedDetailsRecord] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canManageAll = ['admin', 'manager'].includes(userRole) || userPermissions.includes('transactions.manage_all')
  const availableTypes = canManageAll ? ['vehicle_sale', 'service', 'detailing'] : userRole === 'service' ? ['service', 'detailing'] : ['vehicle_sale']

  const request = async (url, options = {}) => {
    const response = await authFetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
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
        authFetch(`${API_BASE}/cars`)
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

  useEffect(() => { loadData() }, [])

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const startEdit = (record) => {
    setEditingId(record.id)
    setForm({
      transaction_type: record.transaction_type,
      car_id: record.car_id || '',
      customer_first_name: record.customer_first_name || '',
      customer_last_name: record.customer_last_name || '',
      customer_email: record.customer_email || '',
      customer_phone: record.customer_phone || '',
      title: record.title || '',
      description: record.description || '',
      amount: record.amount ?? '',
      payment_method: record.payment_method || 'transfer',
      payment_status: record.payment_status || 'paid',
      status: record.status || 'completed',
      transaction_date: record.transaction_date?.slice(0, 10) || '',
      notes: record.notes || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Filtrowanie i wyszukiwanie
  const visibleRecords = records.filter((record) => {
    if (filterType !== 'all' && record.transaction_type !== filterType) return false
    if (filterStatus !== 'all' && record.status !== filterStatus) return false
    if (filterPaymentStatus !== 'all' && (record.payment_status || 'paid') !== filterPaymentStatus) return false
    if (filterPayment !== 'all' && record.payment_method !== filterPayment) return false
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      const matchesFirstName = record.customer_first_name?.toLowerCase().includes(term)
      const matchesLastName = record.customer_last_name?.toLowerCase().includes(term)
      const matchesEmail = record.customer_email?.toLowerCase().includes(term)
      const matchesPhone = record.customer_phone?.toLowerCase().includes(term)
      const matchesTitle = record.title?.toLowerCase().includes(term)
      const matchesDesc = record.description?.toLowerCase().includes(term)
      const matchesNotes = record.notes?.toLowerCase().includes(term)
      const matchesCar = `${record.make || ''} ${record.model || ''} ${record.vin || ''}`.toLowerCase().includes(term)
      if (!matchesFirstName && !matchesLastName && !matchesEmail && !matchesPhone && !matchesTitle && !matchesDesc && !matchesNotes && !matchesCar) {
        return false
      }
    }
    return true
  })

  // Statystyki / KPI podsumowanie
  const totalRevenue = visibleRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const salesRevenue = visibleRecords.filter(r => r.transaction_type === 'vehicle_sale').reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const servicesRevenue = visibleRecords.filter(r => r.transaction_type !== 'vehicle_sale').reduce((sum, r) => sum + Number(r.amount || 0), 0)

  // Paginacja slice
  const totalPages = Math.ceil(visibleRecords.length / itemsPerPage) || 1
  const paginatedRecords = visibleRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Eksport CSV
  const exportToCSV = () => {
    if (visibleRecords.length === 0) return alert('No records to export.')
    const headers = ['ID', 'Type', 'First Name', 'Last Name', 'Email', 'Phone', 'Title', 'Amount (EUR)', 'Payment Method', 'Payment Status', 'Status', 'Date', 'Description', 'Notes']
    const rows = visibleRecords.map(r => [
      r.id,
      r.transaction_type,
      `"${(r.customer_first_name || '').replace(/"/g, '""')}"`,
      `"${(r.customer_last_name || '').replace(/"/g, '""')}"`,
      `"${(r.customer_email || '').replace(/"/g, '""')}"`,
      `"${(r.customer_phone || '').replace(/"/g, '""')}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.amount,
      r.payment_method,
      r.payment_status || 'paid',
      r.status,
      r.transaction_date?.slice(0, 10),
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Formatowanie waluty w EUR (€)
  const money = (value) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
  // Stan dla modala usuwania
  const [deletingId, setDeletingId] = useState(null)

  const confirmDelete = () => {
    if (!deletingId) return
    rawDeleteRecord(deletingId)
    setDeletingId(null)
  }

  // Znajdź transakcję, którą chcemy usunąć (do wyświetlenia w modalu)
  const recordToDelete = visibleRecords.find(r => r.id === deletingId)
  const deleteDisplayInfo = recordToDelete 
    ? `${recordToDelete.title} (${money(recordToDelete.amount)})` 
    : 'this transaction'

  return (
    <div className="space-y-6">
      {/* KAFEL 1: Formularz dodawania / edycji transakcji */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">{editingId ? 'Edit transaction' : 'Add transaction'}</h2>
            <p className="text-gray-500 text-sm">Fill in the details below step by step to record a new transaction or service.</p>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-gray-600 underline hover:text-black">
              Cancel edit
            </button>
          )}
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

        <form onSubmit={saveRecord} className="space-y-6">
          
          {/* ETAP 1: Typ transakcji i dane klienta */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="bg-black text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">1</span>
              <h3 className="font-semibold text-gray-900">Customer & Type</h3>
            </div>

            <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
              {typeDescriptions[form.transaction_type]}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</span>
                <select name="transaction_type" value={form.transaction_type} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm">
                  {availableTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
                </select>
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">First Name</span>
                <input required name="customer_first_name" value={form.customer_first_name} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="First name" />
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Last Name</span>
                <input required name="customer_last_name" value={form.customer_last_name} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Last name" />
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Email Address</span>
                <input type="email" name="customer_email" value={form.customer_email} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="customer@example.com" />
              </label>

              <label className="md:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Phone Number</span>
                <input name="customer_phone" value={form.customer_phone} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="+48..." />
              </label>
            </div>
          </div>

          {/* ETAP 2: Szczegóły zlecenia, pojazd i finanse */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="bg-black text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">2</span>
              <h3 className="font-semibold text-gray-900">Transaction Details & Financials</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <label className="md:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Title / Subject</span>
                <input required name="title" value={form.title} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. BMW E39 Sale or Ceramic Coating Package" />
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Amount (EUR)</span>
                <input required min="0" step="0.01" type="number" name="amount" value={form.amount} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Date</span>
                <input required type="date" name="transaction_date" value={form.transaction_date} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Order Status</span>
                <select name="status" value={form.status} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm">
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Payment Status</span>
                <select name="payment_status" value={form.payment_status} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm">
                  {Object.entries(paymentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label>
                <span className="block text-sm font-medium text-gray-700 mb-1">Payment Method</span>
                <select name="payment_method" value={form.payment_method} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm">
                  {Object.entries(paymentLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-1">Associated Vehicle {form.transaction_type === 'vehicle_sale' ? '(required)' : ''}</span>
                <select required={form.transaction_type === 'vehicle_sale'} name="car_id" value={form.car_id} onChange={updateForm} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm">
                  <option value="">No vehicle selected</option>
                  {cars.map((car) => <option key={car.id} value={car.id} disabled={form.transaction_type === 'vehicle_sale' && car.status === 'sold'}>{car.make} {car.model} {car.vin ? `(${car.vin})` : ''}{form.transaction_type === 'vehicle_sale' && car.status === 'sold' ? ' - Sold' : ''}</option>)}
                </select>
              </label>

              <label className="md:col-span-3">
                <span className="block text-sm font-medium text-gray-700 mb-1">Public Description <span className="text-gray-400 font-normal">(visible scope / invoice description)</span></span>
                <textarea name="description" value={form.description} onChange={updateForm} rows="2" className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y" placeholder="Details about the service or sale..." />
              </label>
            </div>
          </div>

          {/* ETAP 3: Notatki wewnętrzne */}
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40 space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
              <span className="bg-amber-800 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">3</span>
              <h3 className="font-semibold text-amber-900">Internal Staff Notes <span className="text-amber-700 font-normal text-xs">(private, visible only to team)</span></h3>
            </div>

            <textarea 
              name="notes" 
              value={form.notes} 
              onChange={updateForm} 
              rows="2" 
              className="w-full border border-amber-300 bg-white rounded px-3 py-2 resize-y text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none" 
              placeholder="Add internal remarks, payment installments info, special customer requests..."
            />
          </div>

          <button disabled={saving} className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add transaction'}
          </button>
        </form>
      </section>

      {/* KAFEL 2: Historia transakcji, filtry i tabela */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Transactions History</h2>
            <p className="text-gray-500 text-sm">Track vehicle sales, service work, and detailing revenue.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <span>📥</span> Export CSV
            </button>
            <button onClick={() => {}} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Refresh</button>
          </div>
        </div>

        {/* Panel podsumowania finansowego (KPI) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 block">Total Filtered Amount</span>
            <span className="text-xl font-bold text-black">{money(totalRevenue)}</span>
            <span className="text-xs text-gray-400 block mt-1">{visibleRecords.length} transactions total</span>
          </div>
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-700 block">Vehicle Sales Revenue</span>
            <span className="text-xl font-bold text-blue-900">{money(salesRevenue)}</span>
          </div>
          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-purple-700 block">Services & Detailing Revenue</span>
            <span className="text-xl font-bold text-purple-900">{money(servicesRevenue)}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-700 block">Fully Paid Filtered</span>
            <span className="text-xl font-bold text-emerald-900">
              {money(visibleRecords.filter(r => (r.payment_status || 'paid') === 'paid').reduce((s, r) => s + Number(r.amount || 0), 0))}
            </span>
          </div>
        </div>

        {/* Panel wyszukiwania i filtrów */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid md:grid-cols-5 gap-3">
            
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold tracking-wider text-gray-600 mb-1">
                Search
              </label>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                placeholder="Search by first name, last name, email, phone, title, description, internal notes, or car..." 
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm">
                <option value="all">All Types</option>
                {Object.entries(typeLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order Status</label>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm">
                <option value="all">All Statuses</option>
                {Object.entries(statusLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
              <select value={filterPaymentStatus} onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm">
                <option value="all">All Payment Statuses</option>
                {Object.entries(paymentStatusLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
              <select value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }} className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-sm">
                <option value="all">All Methods</option>
                {Object.entries(paymentLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterPaymentStatus('all'); setFilterPayment('all'); setSearchTerm(''); setCurrentPage(1); }} 
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-3 rounded text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-6 text-center">Loading transaction history...</p>
        ) : visibleRecords.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">No transaction records found matching your filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-sm">
                    <th className="py-3 px-3 w-[12%]">Type</th>
                    <th className="py-3 px-3 w-[18%]">Customer</th>
                    <th className="py-3 px-3 w-[18%]">Details</th>
                    <th className="py-3 px-3 w-[11%]">Date</th>
                    <th className="py-3 px-3 w-[11%]">Amount</th>
                    <th className="py-3 px-3 w-[12%]">Status</th>
                    <th className="py-3 px-3 w-[12%]">Payment</th>
                    <th className="py-3 px-3 w-[16%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedRecords.map((record) => {
                    const payStatus = record.payment_status || 'paid'
                    const payStatusColor = payStatus === 'paid' ? 'bg-green-100 text-green-800' : payStatus === 'deposit_paid' ? 'bg-blue-100 text-blue-800' : payStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3"><span className="font-semibold">{typeLabels[record.transaction_type]}</span></td>
                        <td className="py-3 px-3 truncate">
                          <span className="font-semibold block truncate">{record.customer_first_name} {record.customer_last_name}</span>
                          <span className="text-gray-500 block truncate text-xs">{record.customer_email || 'No email'}</span>
                        </td>
                        <td className="py-3 px-3 truncate">
                          <span className="font-medium block truncate">{record.title}</span>
                          <span className="text-gray-500 block truncate">{record.make ? `${record.make} ${record.model}` : record.description || '—'}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{new Date(record.transaction_date).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-semibold whitespace-nowrap">{money(record.amount)}</td>
                        <td className="py-3 px-3"><span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-xs">{statusLabels[record.status] || record.status}</span></td>
                        <td className="py-3 px-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payStatusColor}`}>{paymentStatusLabels[payStatus] || payStatus}</span></td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1 items-center">
                            <button onClick={() => setSelectedDetailsRecord(record)} title="Details" className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold">Details</button>
                            <button onClick={() => startEdit(record)} title="Edit" className="text-gray-700 hover:bg-gray-200 p-1.5 rounded">Edit</button>
                            <button onClick={() => setDeletingId(record.id)} title="Delete" className="text-red-600 hover:bg-red-100 p-1.5 rounded">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v5M14 11v5" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginacja */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, visibleRecords.length)} of {visibleRecords.length} entries
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm font-medium flex items-center">Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                    className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal szczegółów transakcji */}
      {selectedDetailsRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{typeLabels[selectedDetailsRecord.transaction_type]}</span>
                <h3 className="text-xl font-bold">{selectedDetailsRecord.title}</h3>
              </div>
              <button onClick={() => setSelectedDetailsRecord(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Date</span>
                <span className="font-medium">{new Date(selectedDetailsRecord.transaction_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Amount</span>
                <span className="font-bold text-base text-green-700">{money(selectedDetailsRecord.amount)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Order Status</span>
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 font-medium">{statusLabels[selectedDetailsRecord.status] || selectedDetailsRecord.status}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Payment Status</span>
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 font-medium">{paymentStatusLabels[selectedDetailsRecord.payment_status || 'paid'] || selectedDetailsRecord.payment_status}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Payment Method</span>
                <span className="font-medium">{paymentLabels[selectedDetailsRecord.payment_method] || selectedDetailsRecord.payment_method}</span>
              </div>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2">Customer Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500 text-xs block">First Name</span>{selectedDetailsRecord.customer_first_name || '—'}</div>
                <div><span className="text-gray-500 text-xs block">Last Name</span>{selectedDetailsRecord.customer_last_name || '—'}</div>
                <div><span className="text-gray-500 text-xs block">Phone</span>{selectedDetailsRecord.customer_phone || '—'}</div>
                <div><span className="text-gray-500 text-xs block">Email</span>{selectedDetailsRecord.customer_email || '—'}</div>
              </div>
            </div>

            {selectedDetailsRecord.make && (
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">Associated Vehicle</h4>
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold block">{selectedDetailsRecord.make} {selectedDetailsRecord.model} ({selectedDetailsRecord.year || '—'})</span>
                  <span className="text-gray-500 text-xs font-mono">VIN: {selectedDetailsRecord.vin || '—'}</span>
                </div>
              </div>
            )}

            {selectedDetailsRecord.description && (
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-1">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedDetailsRecord.description}</p>
              </div>
            )}

            {selectedDetailsRecord.notes && (
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5 text-amber-900">
                  <span>📝</span> Internal Staff Notes
                </h4>
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-lg whitespace-pre-wrap">{selectedDetailsRecord.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button 
                onClick={() => {
                  const record = selectedDetailsRecord
                  setSelectedDetailsRecord(null)
                  startEdit(record)
                }} 
                className="bg-black text-white px-4 py-2 rounded text-sm font-medium"
              >
                Edit Transaction
              </button>
              <button onClick={() => setSelectedDetailsRecord(null)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm font-medium">Close</button>
            </div>
          </div>
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
                <p className="text-sm text-gray-500">Are you sure you want to remove this transaction record? This action cannot be undone.</p>
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
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}