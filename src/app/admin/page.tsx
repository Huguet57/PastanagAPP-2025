'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trophy, Calendar, Settings, ArrowLeft } from 'lucide-react'
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

export default function AdminPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games')
      if (response.ok) {
        const data = await response.json()
        setGames(data)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      SETUP: { variant: 'secondary', label: 'Configuració' },
      ACTIVE: { variant: 'default', label: 'Actiu' },
      PAUSED: { variant: 'outline', label: 'Pausat' },
      ENDED: { variant: 'destructive', label: 'Finalitzat' },
    }
    
    const config = variants[status] || variants.SETUP
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregant...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tornar al Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Panel d'Administració</h1>
        <p className="text-muted-foreground">Gestiona els jocs de Pastanaga Assassin</p>
      </div>

      <div className="mb-6">
        <Button onClick={() => router.push('/admin/games/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Nou Joc
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                  {game.description && (
                    <CardDescription className="mt-1">{game.description}</CardDescription>
                  )}
                </div>
                {getStatusBadge(game.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{game._count.participants} participants</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>{game._count.eliminations} eliminacions</span>
                </div>

                {game.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(game.startDate), 'dd MMM yyyy', { locale: ca })}
                      {game.endDate && ` - ${format(new Date(game.endDate), 'dd MMM yyyy', { locale: ca })}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {game.status === 'SETUP' && game._count.participants === 0 && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/games/${game.id}/participants`)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Afegir Participants
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/admin/games/${game.id}`)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Gestionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {games.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hi ha cap joc creat encara
              </p>
              <Button onClick={() => router.push('/admin/games/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear el Primer Joc
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 