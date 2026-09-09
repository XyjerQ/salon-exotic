import React, { createContext, useContext, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const defaults = {
  site_name: 'Blackline Salon',
  headline: 'Blackline',
  site_tagline: 'Premium & exotic cars showroom.',
  address: '123 Luxury Ave, Warsaw, PL',
  phone: '+48 600 000 000',
  email: 'info@blackline.com',
  instagram_url: 'https://instagram.com',
  facebook_url: 'https://facebook.com',
  linkedin_url: 'https://linkedin.com',
  tiktok_url: '',
  copyright_text: '© 2026 Blackline Salon. All rights reserved.'
}

const SiteSettingsContext = createContext({ settings: defaults, loading: true })

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/settings`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load site settings')))
      .then((data) => {
        if (active) setSettings((current) => ({ ...current, ...data }))
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, setSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
