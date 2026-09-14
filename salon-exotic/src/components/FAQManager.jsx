import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function FAQManager({ token }) {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [draft, setDraft] = useState({ question: '', answer: '' })
  const [editingId, setEditingId] = useState(null)
  const [editing, setEditing] = useState({ question: '', answer: '' })
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Bezpieczne pobieranie tokena (z propsa lub localStorage jako fallback)
  const activeToken = token || localStorage.getItem('employeeToken')

  const loadFaq = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/faq`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load FAQ')
      setCategories(data)
      setSelectedCategoryId((current) => current || String(data[0]?.id || ''))
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaq()
  }, [])

  const request = async (url, options) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeToken}` }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'FAQ operation failed')
    return data
  }

  const handleAddQuestion = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await request(`${API_BASE}/faq`, {
        method: 'POST',
        body: JSON.stringify({ category_id: Number(selectedCategoryId), ...draft })
      })
      setDraft({ question: '', answer: '' })
      setSuccess('Question added successfully.')
      await loadFaq()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuestion = async (id) => {
    setSaving(true)
    setError('')
    try {
      await request(`${API_BASE}/faq/${id}`, { method: 'PUT', body: JSON.stringify(editing) })
      setEditingId(null)
      setSuccess('Question updated successfully.')
      await loadFaq()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this FAQ question?')) return
    try {
      await request(`${API_BASE}/faq/${id}`, { method: 'DELETE' })
      setSuccess('Question deleted successfully.')
      await loadFaq()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleAddCategory = async (event) => {
    event.preventDefault()
    try {
      const category = await request(`${API_BASE}/faq/categories`, {
        method: 'POST',
        body: JSON.stringify(newCategory)
      })
      setNewCategory({ name: '', icon: '' })
      setSelectedCategoryId(String(category.id))
      setSuccess('Category added successfully.')
      await loadFaq()
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.category}" and all its questions?`)) return
    try {
      await request(`${API_BASE}/faq/categories/${category.id}`, { method: 'DELETE' })
      setSuccess('Category and its questions deleted successfully.')
      setSelectedCategoryId('')
      await loadFaq()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const selectedCategory = categories.find((category) => String(category.id) === String(selectedCategoryId))

  if (loading) return <p className="text-gray-600">Loading FAQ...</p>

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-gray-500 text-sm">Add, edit, and remove public questions and answers.</p>
        </div>
        <button onClick={loadFaq} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Refresh</button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
        <aside className="border border-gray-200 rounded-lg p-3 h-fit">
          <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-2">Categories</p>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.id} className={`flex items-center gap-1 rounded-md ${String(category.id) === String(selectedCategoryId) ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                <button
                  onClick={() => setSelectedCategoryId(String(category.id))}
                  className="flex-1 text-left px-3 py-2 rounded-md text-sm min-w-0 truncate"
                >
                  {category.icon} {category.category}
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  aria-label={`Delete ${category.category}`}
                  title="Delete category"
                  className="p-2 mr-1 rounded text-red-600 hover:bg-red-100 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5M14 11v5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <input value={newCategory.icon} onChange={(event) => setNewCategory({ ...newCategory, icon: event.target.value })} placeholder="Icon" className="w-full border rounded px-2 py-1.5 text-sm" />
            <input required value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} placeholder="New category" className="w-full border rounded px-2 py-1.5 text-sm" />
            <button className="w-full bg-gray-900 text-white rounded px-3 py-2 text-sm">Add category</button>
          </form>
        </aside>

        <div>
          <form onSubmit={handleAddQuestion} className="border border-gray-200 rounded-lg p-5 mb-6">
            <h3 className="font-bold mb-3">Add question to {selectedCategory?.category || 'category'}</h3>
            <input required minLength="3" value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} placeholder="Question" className="w-full border border-gray-300 rounded px-3 py-2 mb-3" />
            <textarea required minLength="3" rows="4" value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} placeholder="Answer" className="w-full border border-gray-300 rounded px-3 py-2 mb-3 resize-y" />
            <button disabled={saving || !selectedCategoryId} className="bg-blackline-accent text-black px-5 py-2 rounded font-semibold disabled:opacity-50">Add question</button>
          </form>

          <div className="space-y-4">
            {(selectedCategory?.questions || []).map((item, index) => (
              <article key={item.id} className="border border-gray-200 rounded-lg p-5">
                {editingId === item.id ? (
                  <div>
                    <input value={editing.question} onChange={(event) => setEditing({ ...editing, question: event.target.value })} className="w-full border rounded px-3 py-2 mb-3 font-semibold" />
                    <textarea rows="5" value={editing.answer} onChange={(event) => setEditing({ ...editing, answer: event.target.value })} className="w-full border rounded px-3 py-2 mb-3 resize-y" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateQuestion(item.id)} disabled={saving} className="bg-black text-white px-4 py-2 rounded text-sm">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-100 px-4 py-2 rounded text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg">{item.q}</h4>
                      <p className="text-gray-600 mt-2 whitespace-pre-wrap">{item.a}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setEditingId(item.id); setEditing({ question: item.q, answer: item.a }) }} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm">Edit</button>
                        <button onClick={() => handleDeleteQuestion(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}