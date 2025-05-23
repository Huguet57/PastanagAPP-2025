'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Target, Trophy, Skull } from 'lucide-react';
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

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Game Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">{gameInfo.name}</h1>
          <p className="text-muted-foreground">
            {participantInfo.position} de {participantInfo.totalParticipants} jugadors vius
          </p>
        </div>

        {/* Player Status Card */}
        <Card className={!isAlive ? 'opacity-75' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={participantInfo.photo || undefined} />
                  <AvatarFallback>{participantInfo.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{participantInfo.nickname}</CardTitle>
                  <CardDescription>{participantInfo.group}</CardDescription>
                </div>
              </div>
              <Badge 
                variant={isAlive ? 'default' : hasWon ? 'secondary' : 'destructive'}
                className="text-lg px-4 py-2"
              >
                {isAlive ? 'VIU' : hasWon ? 'GUANYADOR' : 'ELIMINAT'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{participantInfo.eliminations}</p>
                <p className="text-sm text-muted-foreground">Eliminacions</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">#{participantInfo.position}</p>
                <p className="text-sm text-muted-foreground">Posició</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Card - Only show if alive and has target */}
        {isAlive && participantInfo.target && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                La teva víctima
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={participantInfo.target.photo || undefined} />
                    <AvatarFallback>
                      {participantInfo.target.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-2xl font-semibold">{participantInfo.target.nickname}</p>
                    <p className="text-muted-foreground">{participantInfo.target.group}</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => router.push(`/game/elimination?targetId=${participantInfo.target?.id}`)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Skull className="mr-2 h-5 w-5" />
                  Reportar Eliminació
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winner Message */}
        {hasWon && (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-8 w-8" />
                Enhorabona, has guanyat!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Has sobreviscut fins al final i t'has proclamat com l'assassí més letal 
                amb {participantInfo.eliminations} eliminacions!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Eliminated Message */}
        {!isAlive && !hasWon && (
          <Alert>
            <Skull className="h-4 w-4" />
            <AlertTitle>Has estat eliminat</AlertTitle>
            <AlertDescription>
              La teva aventura en aquest joc ha acabat, però pots seguir consultant 
              el rànquing i les estadístiques.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/game/leaderboard')}
            className="w-full"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Veure Rànquing
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/game/cemetery')}
            className="w-full"
          >
            <Skull className="mr-2 h-4 w-4" />
            Veure Cementiri
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/game/rules')}
            className="w-full"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Veure Regles
          </Button>
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