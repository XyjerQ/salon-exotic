import React, { useEffect, useState } from 'react'

export default function ImagesUploader({ initial = [], onChange }) {
  const [files, setFiles] = useState([])
  const [paths, setPaths] = useState(Array.isArray(initial) ? initial : [])

  useEffect(() => {
    setPaths(Array.isArray(initial) ? initial : [])
  }, [initial])

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || [])
    setFiles(list)
    onChange && onChange({ files: list, paths })
  }

  const handlePathsChange = (e) => {
    const raw = e.target.value
    const arr = raw.split(',').map(s => s.trim()).filter(Boolean)
    setPaths(arr)
    onChange && onChange({ files, paths: arr })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Car images</label>
      <input type="file" accept="image/*" multiple onChange={handleFiles} className="block w-full text-sm text-gray-500 mb-2" />
      {files.length > 0 && (
        <div className="text-sm text-gray-700 mb-2">Selected: {files.map(f => f.name).join(', ')}</div>
      )}

      {paths.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {paths.map((path) => (
            <span key={path} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{path}</span>
          ))}
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-2">Or provide existing image paths, comma separated</label>
      <input type="text" value={paths.join(', ')} onChange={handlePathsChange} className="w-full border px-3 py-2 rounded" />
    </div>
  )
}
