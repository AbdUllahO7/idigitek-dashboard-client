"use client"

import type React from "react"

import { useState } from "react"

import { Upload, X } from "lucide-react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { useToast } from "../hooks/use-toast"

interface ImageUploaderProps {
  value: string
  onChange: (value: string) => void
  onFileChange: (file: File | null) => void
}

export function ImageUploader({ value, onChange, onFileChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    // Read file as data URL for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange(event.target.result as string)
        onFileChange(file)
        setIsUploading(false)
      }
    }
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the selected file",
        variant: "destructive",
      })
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    onChange("")
    onFileChange(null)
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {value ? (
          <div className="relative">
            <img
              src={value || "/placeholder.svg"}
              alt="Image preview"
              className="w-full h-48 object-cover rounded-md"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
            {isUploading && <p className="text-xs text-primary mt-2">Processing image...</p>}
          </div>
        )}
        <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </Card>
  )
}
