import React, { useState } from 'react'

export default function ImagesUploader({ initial = [], onChange }) {
  const [files, setFiles] = useState([])
  const [paths, setPaths] = useState(Array.isArray(initial) ? initial : [])

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
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
      <input type="file" accept="image/*" multiple onChange={handleFiles} className="block w-full text-sm text-gray-500 mb-2" />
      {files.length > 0 && (
        <div className="text-sm text-gray-700 mb-2">Selected: {files.map(f => f.name).join(', ')}</div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-2">Or provide existing image paths (comma separated)</label>
      <input type="text" defaultValue={paths.join(', ')} onBlur={handlePathsChange} className="w-full border px-3 py-2 rounded" />
    </div>
  )
}
