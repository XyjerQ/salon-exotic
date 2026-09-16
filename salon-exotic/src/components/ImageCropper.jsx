import React, { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// Helper function to crop the image from canvas
async function getCroppedImg(image, crop) {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY
  
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

export default function ImageCropper({ onCropComplete, onCancel }) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const imgRef = useRef(null)

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // reset
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    // Default aspect ratio set to 668x545 (~1.226)
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 668 / 545, width, height),
      width,
      height
    )
    setCrop(initialCrop)
  }

  const handleSave = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      const croppedFile = new File([croppedBlob], 'cropped-car.jpg', { type: 'image/jpeg' })
      onCropComplete(croppedFile)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full space-y-4">
        <h3 className="text-lg font-bold">Crop Image</h3>
        
        {!imgSrc ? (
          <input type="file" accept="image/*" onChange={handleFileSelect} className="block w-full border p-2 rounded" />
        ) : (
          <div className="flex flex-col items-center max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={668 / 545}
            >
              <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} className="max-h-[50vh]" />
            </ReactCrop>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          {imgSrc && (
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-black text-white rounded">Save Crop</button>
          )}
        </div>
      </div>
    </div>
  )
}