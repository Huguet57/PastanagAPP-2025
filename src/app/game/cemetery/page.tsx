'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Skull, Calendar, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Elimination {
  id: string;
  timestamp: string;
  witnesses: string[];
  confirmed: boolean;
  eliminator: {
    id: string;
    nickname: string;
    group: string;
    photo: string | null;
  };
  victim: {
    id: string;
    nickname: string;
    group: string;
    photo: string | null;
    signature: string | null;
  };
}

export default function CemeteryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eliminations, setEliminations] = useState<Elimination[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEliminations = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // First get active game
        const gameResponse = await fetch('/api/games/active');
        if (!gameResponse.ok) {
          throw new Error('No hi ha cap joc actiu');
        }
        const game = await gameResponse.json();
        setGameId(game.id);

        // Then get confirmed eliminations
        const eliminationsResponse = await fetch(`/api/eliminations?gameId=${game.id}&confirmed=true`);
        if (!eliminationsResponse.ok) {
          throw new Error('Error carregant les eliminacions');
        }
        const data = await eliminationsResponse.json();
        setEliminations(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEliminations();
  }, [session]);

  if (status === 'loading' || loading) {
    return <CemeterySkeleton />;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <Skull className="h-10 w-10" />
              Cementiri
            </h1>
            <p className="text-muted-foreground mt-2">
              {eliminations.length} víctimes descansen en pau
            </p>
          </div>
        </div>

        {eliminations.length === 0 ? (
          <Alert>
            <AlertDescription>
              Encara no hi ha cap víctima al cementiri. El joc acaba de començar!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6">
            {eliminations.map((elimination) => (
              <Card key={elimination.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-4 border-red-600">
                        <AvatarImage src={elimination.victim.photo || undefined} />
                        <AvatarFallback className="bg-red-100">
                          {elimination.victim.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">{elimination.victim.nickname}</CardTitle>
                        <CardDescription className="text-lg">{elimination.victim.group}</CardDescription>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(elimination.timestamp).toLocaleDateString('ca-ES', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      R.I.P.
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Elimination Details */}
                    <div className="space-y-4">
                      {elimination.witnesses.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Testimonis:
                          </p>
                          <p className="text-muted-foreground">{elimination.witnesses.join(', ')}</p>
                        </div>
                      )}
                    </div>

                    {/* Victim Signature */}
                    {elimination.victim.signature && (
                      <div>
                        <p className="font-semibold mb-2">Última signatura:</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                          <img 
                            src={elimination.victim.signature} 
                            alt={`Signatura de ${elimination.victim.nickname}`}
                            className="w-full h-32 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CemeterySkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
} 