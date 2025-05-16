"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Crop, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { getTransformedImageUrl } from "@/lib/cloudinary"

interface ImagePreviewProps {
  imageUrl: string
  fileName: string
  onClose: () => void
  onInsert: (url: string) => void
}

export function ImagePreview({ imageUrl, fileName, onClose, onInsert }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState<"fill" | "scale" | "fit" | "thumb">("fill")
  const [quality, setQuality] = useState(90)
  const [previewUrl, setPreviewUrl] = useState(imageUrl)

  useEffect(() => {
    // Appliquer les transformations à l'URL
    const transformedUrl = getTransformedImageUrl(imageUrl, {
      width: Math.round((zoom / 100) * 800), // Taille max de 800px
      crop,
      quality,
    })
    setPreviewUrl(transformedUrl)
  }, [imageUrl, zoom, crop, quality])

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)

    // Appliquer la rotation à l'URL
    const transformedUrl =
      getTransformedImageUrl(imageUrl, {
        width: Math.round((zoom / 100) * 800),
        crop,
        quality,
      }) + `/a_${newRotation}`

    setPreviewUrl(transformedUrl)
  }

  const handleInsert = () => {
    onInsert(previewUrl)
    onClose()
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = previewUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Prévisualisation de l'image</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
          <img
            src={previewUrl || "/placeholder.svg"}
            alt={fileName}
            className="max-w-full max-h-[60vh] object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>

        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Zoom</label>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[zoom]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Qualité</label>
              <div className="flex items-center gap-2">
                <span className="text-xs">Basse</span>
                <Slider
                  value={[quality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setQuality(value[0])}
                  className="flex-1"
                />
                <span className="text-xs">Haute</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4 mr-2" />
              Rotation
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCrop("fill")}
              className={crop === "fill" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              <Crop className="h-4 w-4 mr-2" />
              Remplir
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCrop("fit")}
              className={crop === "fit" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              <Crop className="h-4 w-4 mr-2" />
              Ajuster
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCrop("scale")}
              className={crop === "scale" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              <Crop className="h-4 w-4 mr-2" />
              Échelle
            </Button>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>

            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleInsert}>Insérer l'image</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
