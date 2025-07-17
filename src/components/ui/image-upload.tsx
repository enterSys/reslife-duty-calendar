"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onRemove: () => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, width, height)

        // Convert to base64
        const dataURL = canvas.toDataURL("image/jpeg", quality)
        resolve(dataURL)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      // Resize image to 200x200 with 0.8 quality
      const resizedImage = await resizeImage(file, 200, 200, 0.8)
      
      // Upload to server
      const formData = new FormData()
      
      // Convert base64 to blob
      const response = await fetch(resizedImage)
      const blob = await response.blob()
      formData.append("image", blob, file.name)

      const uploadResponse = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      const { imageUrl } = await uploadResponse.json()
      onChange(imageUrl)
      toast.success("Profile picture updated successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={value} alt="Profile" />
          <AvatarFallback>
            <Upload className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="image-upload" className="text-sm font-medium">
            Profile Picture
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <Input
        id="image-upload"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Upload a profile picture. Max file size: 5MB. Recommended: 200x200px.
      </p>
    </div>
  )
}