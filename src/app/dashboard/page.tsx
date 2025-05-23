'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Target, Trophy, Skull, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GameInfo {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface ParticipantInfo {
  id: string;
  nickname: string;
  group: string;
  status: string;
  photo: string | null;
  target: {
    id: string;
    nickname: string;
    group: string;
    photo: string | null;
  } | null;
  eliminations: number;
  position: number;
  totalParticipants: number;
  pendingEliminations?: number;
  user?: {
    role: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('📊 Full session object:', JSON.stringify(session, null, 2));
      console.log('👤 Session user:', session?.user);
      console.log('🆔 Session user ID:', session?.user?.id);
      console.log('📧 Session user email:', session?.user?.email);
      
      if (!session?.user?.id) {
        console.log('🚫 No session user ID, skipping fetch');
        return;
      }

      console.log('🔄 Starting dashboard data fetch for user:', session.user.id);

      try {
        setLoading(true);
        setError(null);

        // Fetch active game
        console.log('📡 Fetching active game...');
        const gamesResponse = await fetch('/api/games/active');
        console.log('📡 Active game response status:', gamesResponse.status);
        
        if (!gamesResponse.ok) {
          const errorData = await gamesResponse.json();
          console.error('❌ Active game error:', errorData);
          throw new Error(errorData.error || 'No hi ha cap joc actiu en aquest moment');
        }
        
        const game = await gamesResponse.json();
        console.log('✅ Active game received:', game);
        setGameInfo(game);

        // Fetch participant info
        console.log('📡 Fetching participant info for game:', game.id);
        const participantResponse = await fetch(`/api/participants/me?gameId=${game.id}`);
        console.log('📡 Participant response status:', participantResponse.status);
        
        if (!participantResponse.ok) {
          const errorData = await participantResponse.json();
          console.error('❌ Participant error:', errorData);
          throw new Error(errorData.error || 'No estàs participant en aquest joc');
        }
        
        const participant = await participantResponse.json();
        console.log('✅ Participant info received:', participant);
        setParticipantInfo(participant);
        
        // Check for pending eliminations if user is eliminated
        if (participant.status === 'ELIMINATED') {
          const pendingResponse = await fetch(`/api/eliminations?gameId=${game.id}&confirmed=false`);
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            const userPending = pendingData.filter((e: any) => e.victim.userId === session.user.id);
            if (userPending.length > 0) {
              setParticipantInfo(prev => prev ? {...prev, pendingEliminations: userPending.length} : null);
            }
          }
        }
      } catch (err) {
        console.error('💥 Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error carregant les dades');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  console.log('🎨 Rendering dashboard with state:', {
    sessionStatus: status,
    loading,
    hasError: !!error,
    hasGameInfo: !!gameInfo,
    hasParticipantInfo: !!participantInfo
  });

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!gameInfo || !participantInfo) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sense joc actiu</AlertTitle>
          <AlertDescription>
            No hi ha cap joc actiu en aquest moment. Contacta amb els organitzadors.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAlive = participantInfo.status === 'ALIVE';
  const hasWon = participantInfo.status === 'WINNER';
  const hasPendingEliminations = participantInfo.pendingEliminations && participantInfo.pendingEliminations > 0;
  const isOrganizer = participantInfo.user?.role === 'ADMIN' || participantInfo.user?.role === 'ORGANIZER';

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      <div className="container mx-auto py-6 px-4 max-w-md">
        <div className="space-y-6">
          {/* Simple Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Hola, {participantInfo.nickname}!
            </h1>
          </div>

          {/* Pending Elimination Alert - if user has been eliminated */}
          {hasPendingEliminations && (
            <Card className="border-2 border-orange-400 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold">T'han eliminat!</p>
                      <p className="text-sm text-muted-foreground">
                        Tens {participantInfo.pendingEliminations} eliminació pendent de confirmar
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push('/game/pending-eliminations')}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Card - More visual and fun */}
          {isAlive && participantInfo.target && (
            <Card className="border-2 border-orange-400 overflow-hidden">
              <CardHeader className="bg-orange-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-orange-500" />
                  La teva víctima
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Avatar className="h-32 w-32 mx-auto border-4 border-orange-300 shadow-xl rounded-lg">
                    <AvatarImage src={participantInfo.target.photo || undefined} />
                    <AvatarFallback className="text-4xl bg-orange-100 text-orange-600 rounded-lg">
                      {participantInfo.target.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-2xl font-bold">{participantInfo.target.nickname}</p>
                    <p className="text-muted-foreground">{participantInfo.target.group}</p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => router.push(`/game/elimination?targetId=${participantInfo.target?.id}`)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Skull className="mr-2 h-6 w-6" />
                    L'he eliminat!
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Winner Message - More celebratory */}
          {hasWon && (
            <Card className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white overflow-hidden">
              <div className="p-8 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🎉 ENHORABONA! 🎉</h2>
                <p className="text-lg">
                  Ets l'últim supervivent!
                </p>
                <p className="mt-2">
                  {participantInfo.eliminations} eliminacions
                </p>
              </div>
            </Card>
          )}

          {/* Eliminated Message - Simpler */}
          {!isAlive && !hasWon && (
            <Card className="bg-gray-100 border-gray-300">
              <CardContent className="p-6 text-center">
                <Skull className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-semibold text-gray-600">Has estat eliminat</p>
                <p className="text-sm text-gray-500 mt-2">
                  Però encara pots veure el rànquing!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Simplified */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/game/leaderboard')}
              className="w-full border-orange-300 hover:bg-orange-50"
            >
              <Trophy className="mr-2 h-4 w-4 text-orange-500" />
              Rànquing d'Assassins
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/game/cemetery')}
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              <Skull className="mr-2 h-4 w-4" />
              Cementiri
            </Button>
            
            {/* Organizer Actions */}
            {isOrganizer && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/game/pending-eliminations')}
                className="w-full border-blue-300 hover:bg-blue-50"
              >
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Gestionar Eliminacions Pendents
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center">
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
} 