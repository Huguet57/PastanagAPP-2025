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
        return <Crown className="h-8 w-8 text-yellow-500 absolute -top-3 -right-3 rotate-12" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400 absolute -top-2 -right-2" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600 absolute -top-2 -right-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      <div className="container mx-auto py-6 px-4 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="mb-4 text-orange-600 hover:text-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tornar al dashboard
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-center">
              <Trophy className="h-8 w-8 text-orange-500" />
              Rànquing d'Assassins
            </h1>
            <p className="text-muted-foreground text-center text-sm mt-2">
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
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className={`
                    transition-all hover:shadow-lg overflow-hidden
                    ${entry.id === currentUserId ? 'ring-2 ring-orange-400' : ''}
                    ${entry.position <= 3 ? 'bg-gradient-to-r ' + 
                      (entry.position === 1 ? 'from-yellow-50 to-orange-50' : 
                       entry.position === 2 ? 'from-gray-50 to-slate-50' : 
                       'from-orange-50 to-amber-50') : ''}
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Position Number */}
                        <div className={`
                          text-2xl font-bold w-8 text-center
                          ${entry.position === 1 ? 'text-yellow-600' : 
                            entry.position === 2 ? 'text-gray-500' : 
                            entry.position === 3 ? 'text-orange-600' : 'text-gray-400'}
                        `}>
                          {entry.position}
                        </div>

                        {/* Player Avatar and Info */}
                        <div className="relative">
                          <Avatar className={`h-16 w-16 border-2 rounded-lg ${
                            entry.status === 'ELIMINATED' ? 'opacity-50 grayscale border-gray-300' : 
                            entry.position === 1 ? 'border-yellow-400' :
                            entry.position === 2 ? 'border-gray-400' :
                            entry.position === 3 ? 'border-orange-400' : 'border-gray-200'
                          }`}>
                            <AvatarImage src={entry.photo || undefined} />
                            <AvatarFallback className={`text-xl rounded-lg ${
                              entry.status === 'ELIMINATED' ? 'bg-gray-100 text-gray-400' : 
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {entry.nickname.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {getPositionIcon(entry.position)}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{entry.nickname}</p>
                            {entry.id === currentUserId && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">TU</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.group}</p>
                          <Badge 
                            variant={entry.status === 'ALIVE' ? 'default' : 
                                    entry.status === 'WINNER' ? 'secondary' : 'destructive'}
                            className={`mt-1 text-xs ${
                              entry.status === 'ALIVE' ? 'bg-green-500 border-0' : 
                              entry.status === 'WINNER' ? 'bg-yellow-500 text-black border-0' : 
                              'bg-red-500 border-0'
                            }`}
                          >
                            {entry.status === 'ALIVE' ? 'VIU' : 
                             entry.status === 'WINNER' ? '👑' : 'ELIMINAT'}
                          </Badge>
                        </div>
                      </div>

                      {/* Eliminations Count - Simplified */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-orange-400" />
                          <p className="text-2xl font-bold text-orange-600">{entry.eliminations}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Eliminacions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Simplified Legend */}
          <Card className="mt-8 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <p className="text-sm text-center text-orange-700">
                👑 El primer en eliminar i l'últim en morir guanya!
              </p>
            </CardContent>
          </Card>
        </div>
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