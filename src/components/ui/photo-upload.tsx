'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  currentPhoto?: string | null
  fallbackText: string
  onPhotoChange: (photo: string | null) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showRemoveButton?: boolean
}

export function PhotoUpload({
  currentPhoto,
  fallbackText,
  onPhotoChange,
  disabled = false,
  size = 'md',
  className,
  showRemoveButton = true
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Selecciona una imatge vàlida')
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imatge no pot ser més gran de 5MB')
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        onPhotoChange(base64)
        setIsUploading(false)
      }
      reader.onerror = () => {
        throw new Error('Error processant la imatge')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading photo:', error)
      setIsUploading(false)
      // You might want to show a toast notification here
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = () => {
    onPhotoChange(null)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], "cursor-pointer border-2 border-gray-200 hover:border-orange-300 transition-colors")}>
          <AvatarImage 
            src={currentPhoto || undefined} 
            onClick={triggerFileInput}
          />
          <AvatarFallback 
            className="bg-orange-100 text-orange-600 text-lg font-semibold cursor-pointer"
            onClick={triggerFileInput}
          >
            {isUploading ? (
              <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            ) : (
              fallbackText.slice(0, 2).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>

        {/* Overlay with camera icon on hover */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={triggerFileInput}
        >
          <Camera className="h-6 w-6 text-white" />
        </div>

        {/* Remove button */}
        {currentPhoto && showRemoveButton && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemovePhoto}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Action buttons below avatar */}
      <div className="mt-3 flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="border-orange-300 hover:bg-orange-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentPhoto ? 'Canviar' : 'Afegir'}
        </Button>
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
    </div>
  )
} 