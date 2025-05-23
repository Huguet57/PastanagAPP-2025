'use client';

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Target, Trophy, Skull, Clock, LogOut, UserX, Shield } from 'lucide-react';
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
  const [notParticipant, setNotParticipant] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
      console.log('🛡️ Session user role:', session?.user?.role);
      
      if (!session?.user?.id) {
        console.log('🚫 No session user ID, skipping fetch');
        return;
      }

      // Check if user is admin
      if (session.user.role === 'ADMIN') {
        console.log('🛡️ User is admin, showing admin dashboard');
        setIsAdmin(true);
        setLoading(false);
        
        // Still fetch active game info for admin
        try {
          const gamesResponse = await fetch('/api/games/active');
          if (gamesResponse.ok) {
            const game = await gamesResponse.json();
            setGameInfo(game);
          }
        } catch (err) {
          console.error('Error fetching game for admin:', err);
        }
        
        return;
      }

      console.log('🔄 Starting dashboard data fetch for user:', session.user.id);

      try {
        setLoading(true);
        setError(null);
        setNotParticipant(false);

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
          
          // Check if the error is specifically about not being a participant
          if (participantResponse.status === 404 || errorData.error?.includes('participant')) {
            setNotParticipant(true);
            setLoading(false);
            return;
          }
          
          throw new Error(errorData.error || 'Error carregant la informació');
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
    hasParticipantInfo: !!participantInfo,
    isAdmin
  });

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />;
  }

  // Handle admin dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
        <div className="container mx-auto py-6 px-4 max-w-md">
          <div className="space-y-6">
            {/* Header with logout button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sortir
              </Button>
            </div>

            {/* Admin Greeting */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800">
                Panell d'Administració
              </h1>
              <p className="text-muted-foreground mt-2">
                {session?.user?.email}
              </p>
            </div>

            {/* Game Info */}
            {gameInfo && (
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle>Joc Actiu</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="font-semibold">{gameInfo.name}</p>
                  <Badge className="mt-2">{gameInfo.status}</Badge>
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            <div className="space-y-3">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => router.push('/game/pending-eliminations')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="mr-2 h-4 w-4" />
                Gestionar Eliminacions Pendents
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/game/leaderboard')}
                className="w-full border-blue-300 hover:bg-blue-50"
              >
                <Trophy className="mr-2 h-4 w-4 text-blue-500" />
                Veure Rànquing
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/game/cemetery')}
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <Skull className="mr-2 h-4 w-4" />
                Veure Cementiri
              </Button>
            </div>

            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                Com a administrador, pots gestionar les eliminacions pendents i veure tota la informació del joc.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where user is not a participant
  if (notParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-orange-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
              <UserX className="h-10 w-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">No ets participant</CardTitle>
            <CardDescription className="text-base mt-2">
              No estàs inscrit en el joc actiu de Pastanaga Assassina
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Has iniciat sessió com:</p>
              <p className="font-semibold">{session?.user?.email}</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full border-orange-300 hover:bg-orange-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Tancar sessió
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Si creus que això és un error, contacta amb els organitzadors del joc.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          {/* Header with logout button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sortir
            </Button>
          </div>

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