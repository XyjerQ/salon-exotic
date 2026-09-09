import React from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'

export default function Footer(){
  const { settings } = useSiteSettings()
  return (
    <footer className="mt-12 bg-blackline text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold text-white mb-2">{settings.site_name}</h4>
          <p className="text-sm">{settings.site_tagline}</p>
          <p className="text-sm mt-3">{settings.address}</p>
          <p className="text-sm mt-1">{settings.phone}</p>
          <a className="text-sm hover:underline" href={`mailto:${settings.email}`}>{settings.email}</a>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Navigation</h4>
          <ul className="text-sm space-y-1">
            <li><a className="hover:underline" href="#">Home</a></li>
            <li><a className="hover:underline" href="#inventory">Inventory</a></li>
            <li><a className="hover:underline" href="#contact">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Follow us</h4>
          <div className="flex items-center gap-3">
            {settings.instagram_url && <a className="text-sm hover:underline" href={settings.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
            {settings.facebook_url && <a className="text-sm hover:underline" href={settings.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
            {settings.linkedin_url && <a className="text-sm hover:underline" href={settings.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
            {settings.tiktok_url && <a className="text-sm hover:underline" href={settings.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>}
          </div>
          <p className="text-xs text-gray-400 mt-4">{settings.copyright_text}</p>
        </div>
      </div>
    </footer>
  )
}
