import React, { useEffect, useState } from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const fields = [
  ['site_name', 'Salon name'],
  ['headline', 'Header headline'],
  ['site_tagline', 'Tagline'],
  ['address', 'Address'],
  ['phone', 'Phone'],
  ['email', 'Contact email'],
  ['instagram_url', 'Instagram URL'],
  ['facebook_url', 'Facebook URL'],
  ['linkedin_url', 'LinkedIn URL'],
  ['tiktok_url', 'TikTok URL'],
  ['copyright_text', 'Copyright text']
]

export default function SiteSettingsManager({ token }) {
  const { settings, setSettings } = useSiteSettings()
  const [form, setForm] = useState(settings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save settings')
      setSettings(data)
      setForm(data)
      setSuccess('Site settings saved successfully.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <p className="text-gray-500 text-sm">Update the salon identity and contact links shown across the website.</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
        {fields.map(([name, label]) => (
          <label key={name} className={name === 'copyright_text' ? 'md:col-span-2' : ''}>
            <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
            <input
              name={name}
              type={name.includes('url') ? 'url' : name === 'email' ? 'email' : 'text'}
              value={form[name] || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blackline-accent"
              placeholder={name.includes('url') ? 'https://...' : label}
            />
          </label>
        ))}

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blackline-accent text-black px-6 py-3 rounded-md font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  )
}
