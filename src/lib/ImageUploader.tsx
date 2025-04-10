"use client"

import { useState, useRef } from "react"

import { Upload, X, ImageIcon } from 'lucide-react'
import Image from "next/image"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Create a FileReader to read the file as a data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange(event.target.result as string)
      }
      setIsUploading(false)
    }
    reader.onerror = () => {
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      
      <div className="space-y-2">
        {value ? (
          <div className="relative">
            <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
              <Image
                src={value || "/placeholder.svg"}
                alt="Uploaded image"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
          </Button>
        </div>
      </div>
    </div>
  )
}
