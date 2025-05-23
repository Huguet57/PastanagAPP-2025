'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { User, Users, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantInfo {
  id: string
  nickname: string
  group: string
  status: string
  photo: string | null
  eliminations: number
  position: number
  totalParticipants: number
}

interface ParticipantProfileProps {
  participant: ParticipantInfo
  gameId: string
  onProfileUpdate?: (updatedParticipant: Partial<ParticipantInfo>) => void
  showPhotoEdit?: boolean
  className?: string
}

export function ParticipantProfile({
  participant,
  gameId,
  onProfileUpdate,
  showPhotoEdit = true,
  className
}: ParticipantProfileProps) {
  const [updatingPhoto, setUpdatingPhoto] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(participant.photo)

  const handlePhotoChange = async (newPhoto: string | null) => {
    if (!showPhotoEdit) return

    setUpdatingPhoto(true)

    try {
      const response = await fetch('/api/participants/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          photo: newPhoto
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error actualitzant la foto')
      }

      const result = await response.json()
      setCurrentPhoto(newPhoto)
      
      // Notify parent component of update
      if (onProfileUpdate) {
        onProfileUpdate({ photo: newPhoto })
      }

      console.log('✅ Photo updated successfully')
    } catch (error) {
      console.error('❌ Error updating photo:', error)
      // Reset photo to previous value on error
      setCurrentPhoto(participant.photo)
      // You might want to show a toast notification here
    } finally {
      setUpdatingPhoto(false)
    }
  }

  const getStatusBadge = () => {
    switch (participant.status) {
      case 'ALIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Viu</Badge>
      case 'ELIMINATED':
        return <Badge variant="destructive">Eliminat</Badge>
      case 'WINNER':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Guanyador</Badge>
      default:
        return <Badge variant="secondary">{participant.status}</Badge>
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          El teu perfil
        </CardTitle>
        <CardDescription>
          Informació del teu participant en el joc
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Section */}
        <div className="flex flex-col items-center space-y-4">
          <PhotoUpload
            currentPhoto={currentPhoto}
            fallbackText={participant.nickname}
            onPhotoChange={handlePhotoChange}
            disabled={updatingPhoto || !showPhotoEdit}
            size="lg"
            showRemoveButton={showPhotoEdit}
          />
          
          {updatingPhoto && (
            <p className="text-sm text-muted-foreground">
              Actualitzant foto...
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">{participant.nickname}</h3>
            {participant.group && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                {participant.group}
              </p>
            )}
          </div>

          {/* Status and Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estat:</span>
              {getStatusBadge()}
            </div>
          </div>

          {/* Game Statistics */}
          {participant.status === 'ALIVE' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {participant.eliminations}
                </div>
                <div className="text-sm text-muted-foreground">
                  Eliminacions
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {participant.position}
                </div>
                <div className="text-sm text-muted-foreground">
                  Posició
                </div>
              </div>
            </div>
          )}

          {/* Winner Stats */}
          {participant.status === 'WINNER' && (
            <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <span className="text-lg font-bold text-yellow-800">
                  Campió!
                </span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {participant.eliminations}
                </div>
                <div className="text-sm text-yellow-600">
                  Eliminacions totals
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 