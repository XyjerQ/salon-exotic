import React, { useState } from 'react'

export default function FeaturesEditor({ value = [], onChange }) {
  const [items, setItems] = useState(Array.isArray(value) ? value : [])
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v) return
    const next = [...items, v]
    setItems(next)
    setInput('')
    onChange && onChange(next)
  }

  const remove = (i) => {
    const next = items.filter((_, idx) => idx !== i)
    setItems(next)
    onChange && onChange(next)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border px-3 py-2 rounded" placeholder="Add feature" />
        <button type="button" onClick={add} className="bg-blackline-accent text-black px-4 py-2 rounded">Add</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
            {it}
            <button type="button" onClick={() => remove(i)} className="text-xs text-red-600">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}
