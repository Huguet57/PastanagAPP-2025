'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Crown, Medal, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  group: string;
  photo: string | null;
  status: string;
  eliminations: number;
  survivalTime: number; // in hours
  position: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Get active game
        const gameResponse = await fetch('/api/games/active');
        if (!gameResponse.ok) {
          throw new Error('No hi ha cap joc actiu');
        }
        const game = await gameResponse.json();

        // Get leaderboard data
        const leaderboardResponse = await fetch(`/api/game/leaderboard?gameId=${game.id}`);
        if (!leaderboardResponse.ok) {
          throw new Error('Error carregant el rànquing');
        }
        const data = await leaderboardResponse.json();
        setEntries(data.entries);
        setCurrentUserId(data.currentParticipantId);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [session]);

  if (status === 'loading' || loading) {
    return <LeaderboardSkeleton />;
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getPositionStyles = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tornar al dashboard
          </Button>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            Rànquing d'Assassins
          </h1>
          <p className="text-muted-foreground mt-2">
            Els millors assassins de la Pastanaga
          </p>
        </div>

        {entries.length === 0 ? (
          <Alert>
            <AlertDescription>
              Encara no hi ha dades del rànquing disponibles.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card 
                key={entry.id} 
                className={`
                  transition-all hover:shadow-lg
                  ${entry.id === currentUserId ? 'ring-2 ring-primary' : ''}
                  ${getPositionStyles(entry.position)}
                `}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Position */}
                      <div className="flex flex-col items-center justify-center w-16">
                        {getPositionIcon(entry.position)}
                        <span className="text-2xl font-bold">
                          #{entry.position}
                        </span>
                      </div>

                      {/* Player Info */}
                      <Avatar className={`h-16 w-16 ${entry.status === 'ELIMINATED' ? 'opacity-50' : ''}`}>
                        <AvatarImage src={entry.photo || undefined} />
                        <AvatarFallback>
                          {entry.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-semibold">{entry.nickname}</p>
                          {entry.id === currentUserId && (
                            <Badge variant="outline" className="text-xs">TU</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{entry.group}</p>
                        <Badge 
                          variant={entry.status === 'ALIVE' ? 'default' : 
                                  entry.status === 'WINNER' ? 'secondary' : 'destructive'}
                          className="mt-1"
                        >
                          {entry.status === 'ALIVE' ? 'VIU' : 
                           entry.status === 'WINNER' ? 'GUANYADOR' : 'ELIMINAT'}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Target className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{entry.eliminations}</p>
                        <p className="text-xs text-muted-foreground">Eliminacions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{entry.survivalTime}h</p>
                        <p className="text-xs text-muted-foreground">Supervivència</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Com es calcula la puntuació?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Cada eliminació confirmada: +100 punts</li>
              <li>• Cada hora de supervivència: +1 punt</li>
              <li>• Bonus per ser l'últim supervivient: +500 punts</li>
              <li>• Els jugadors eliminats mantenen els seus punts</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
} 