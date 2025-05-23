'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Plus, 
  Play, 
  Pause, 
  StopCircle,
  Download,
  Upload,
  UserCheck,
  UserX,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import { ca } from 'date-fns/locale'

interface Game {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  _count: {
    participants: number
    eliminations: number
  }
}

interface Participant {
  id: string
  name: string
  email: string
  nickname: string
  group: string
  photo: string | null
  status: string
  target: {
    name: string
    nickname: string
  } | null
}

export default function GameManagementPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  
  const [game, setGame] = useState<Game | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
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
    } finally {
      setLoading(false)
    }
  }

  const updateGameStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setMessage(`Estat del joc actualitzat a ${newStatus}`)
        await fetchGame()
      }
    } catch (error) {
      console.error('Error updating game status:', error)
      setMessage('Error actualitzant l\'estat del joc')
    }
  }

  const downloadCredentials = () => {
    const csvContent = participants.map(p => 
      `${p.name},${p.email},${p.group}`
    ).join('\n')
    
    const blob = new Blob([`Nom,Email,Grup\n${csvContent}`], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants-${game?.name || 'joc'}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ALIVE: { variant: 'default', label: 'Viu', icon: UserCheck },
      ELIMINATED: { variant: 'destructive', label: 'Eliminat', icon: UserX },
      WINNER: { variant: 'success', label: 'Guanyador', icon: Target },
    }
    
    const config = variants[status] || variants.ALIVE
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregant...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin')}
        >
          ← Tornar
        </Button>
      </div>

      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{game.name}</CardTitle>
                {game.description && (
                  <CardDescription className="mt-2">{game.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {game.status === 'SETUP' && (
                  <Button
                    size="sm"
                    onClick={() => updateGameStatus('ACTIVE')}
                    disabled={participants.length < 3}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar Joc
                  </Button>
                )}
                {game.status === 'ACTIVE' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGameStatus('PAUSED')}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateGameStatus('ENDED')}
                    >
                      <StopCircle className="h-4 w-4 mr-1" />
                      Finalitzar
                    </Button>
                  </>
                )}
                {game.status === 'PAUSED' && (
                  <Button
                    size="sm"
                    onClick={() => updateGameStatus('ACTIVE')}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Reprendre
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estat</p>
                <p className="font-medium">{game.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-medium">{game._count.participants}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eliminacions</p>
                <p className="font-medium">{game._count.eliminations}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supervivents</p>
                <p className="font-medium">
                  {participants.filter(p => p.status === 'ALIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  Llista de tots els participants del joc
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadCredentials}
                  disabled={participants.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descarregar CSV
                </Button>
                {game.status === 'SETUP' && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/admin/games/${gameId}/participants`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Afegir Participants
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No hi ha participants en aquest joc
                </p>
                <Button onClick={() => router.push(`/admin/games/${gameId}/participants`)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Participants
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Foto</th>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Grup</th>
                      <th className="text-left p-2">Estat</th>
                      <th className="text-left p-2">Objectiu</th>
                      <th className="text-left p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {participant.photo ? (
                            <img
                              src={participant.photo}
                              alt={participant.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-2 font-medium">{participant.name}</td>
                        <td className="p-2">{participant.group}</td>
                        <td className="p-2">{getStatusBadge(participant.status)}</td>
                        <td className="p-2">
                          {participant.target ? (
                            <span className="text-sm">
                              {participant.target.nickname || participant.target.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {participant.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 