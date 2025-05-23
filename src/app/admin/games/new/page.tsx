'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ca } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function NewGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gameData, setGameData] = useState({
    name: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      })

      if (!response.ok) {
        throw new Error('Error creant el joc')
      }

      const game = await response.json()
      router.push(`/admin/games/${game.id}/participants`)
    } catch (error) {
      console.error('Error:', error)
      alert('Error creant el joc')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nou Joc</CardTitle>
          <CardDescription>
            Configura els detalls del nou joc d'assassins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom del Joc</Label>
              <Input
                id="name"
                value={gameData.name}
                onChange={(e) => setGameData({ ...gameData, name: e.target.value })}
                placeholder="Pastanaga Assassin 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripció</Label>
              <Textarea
                id="description"
                value={gameData.description}
                onChange={(e) => setGameData({ ...gameData, description: e.target.value })}
                placeholder="Descripció del joc i regles especials..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data d'Inici</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !gameData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {gameData.startDate ? (
                        format(gameData.startDate, "PPP", { locale: ca })
                      ) : (
                        <span>Selecciona data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={gameData.startDate || undefined}
                      onSelect={(date) => setGameData({ ...gameData, startDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Finalització</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !gameData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {gameData.endDate ? (
                        format(gameData.endDate, "PPP", { locale: ca })
                      ) : (
                        <span>Selecciona data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={gameData.endDate || undefined}
                      onSelect={(date) => setGameData({ ...gameData, endDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin')}
                disabled={loading}
              >
                Cancel·lar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creant...' : 'Crear Joc'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 