'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Users, Shuffle, Download, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Participant {
  id?: string
  name: string
  group: string
  email?: string
  photo?: string
}

export default function ParticipantsPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  
  const [game, setGame] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchGame()
    fetchParticipants()
  }, [gameId])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGame(data)
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    }
  }

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('nom') ? 1 : 0
        
        const newParticipants: Participant[] = []
        for (let i = startIndex; i < lines.length; i++) {
          const [name, group] = lines[i].split(',').map(field => field.trim())
          if (name && group) {
            newParticipants.push({ name, group })
          }
        }

        setParticipants([...participants, ...newParticipants])
        setMessage(`S'han afegit ${newParticipants.length} participants`)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setMessage('Error processant el fitxer CSV')
      } finally {
        setUploading(false)
      }
    }

    reader.readAsText(file)
  }

  const handlePhotoUpload = async (index: number, file: File) => {
    // Convert file to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const updatedParticipants = [...participants]
      updatedParticipants[index].photo = base64
      setParticipants(updatedParticipants)
    }
    reader.readAsDataURL(file)
  }

  const addParticipant = () => {
    setParticipants([...participants, { name: '', group: '' }])
  }

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updatedParticipants = [...participants]
    updatedParticipants[index] = { ...updatedParticipants[index], [field]: value }
    setParticipants(updatedParticipants)
  }

  const generateUsersAndAssignTargets = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/games/${gameId}/participants/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participants }),
      })

      if (!response.ok) {
        throw new Error('Error generant usuaris')
      }

      const result = await response.json()
      setMessage(`S'han creat ${result.created} usuaris i assignat objectius!`)
      
      // Download credentials CSV
      const csvContent = result.credentials.map((cred: any) => 
        `${cred.name},${cred.email},${cred.password}`
      ).join('\n')
      
      const blob = new Blob([`Nom,Email,Contrasenya\n${csvContent}`], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credencials-${game?.name || 'joc'}.csv`
      a.click()
      
      // Refresh participants list
      await fetchParticipants()
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error generant usuaris i objectius')
    } finally {
      setLoading(false)
    }
  }

  if (!game) return <div>Carregant...</div>

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/games/${gameId}`)}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tornar
        </Button>
        <h1 className="text-3xl font-bold">{game.name}</h1>
        <p className="text-muted-foreground">Gestió de participants</p>
      </div>

      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Participants</CardTitle>
            <CardDescription>
              Carrega un fitxer CSV amb format: Nom,Grup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md border",
                  "hover:bg-accent hover:text-accent-foreground",
                  uploading && "opacity-50 cursor-not-allowed"
                )}>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Carregant...' : 'Carregar CSV'}
                </div>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                  disabled={uploading}
                />
              </Label>
              
              <Button
                variant="outline"
                onClick={addParticipant}
              >
                <Plus className="h-4 w-4 mr-2" />
                Afegir Manual
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({participants.length})</CardTitle>
            <CardDescription>
              Revisa i edita la llista de participants abans de generar usuaris
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {participant.photo ? (
                      <img
                        src={participant.photo}
                        alt={participant.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <Label htmlFor={`photo-${index}`} className="cursor-pointer">
                      <div className="text-xs text-center mt-1 text-blue-600 hover:underline">
                        Canviar
                      </div>
                      <Input
                        id={`photo-${index}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(index, file)
                        }}
                      />
                    </Label>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={participant.name}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        placeholder="Nom del participant"
                      />
                    </div>
                    <div>
                      <Label>Grup</Label>
                      <Input
                        value={participant.group}
                        onChange={(e) => updateParticipant(index, 'group', e.target.value)}
                        placeholder="3r ESO - A"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipant(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {participants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hi ha participants. Carrega un CSV o afegeix-los manualment.
                </div>
              )}
            </div>

            {participants.length > 0 && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/games/${gameId}`)}
                >
                  Cancel·lar
                </Button>
                <Button
                  onClick={generateUsersAndAssignTargets}
                  disabled={loading || participants.length < 3}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {loading ? 'Generant...' : 'Generar Usuaris i Assignar Objectius'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 