'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Skull, Calendar, MapPin, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Elimination {
  id: string;
  timestamp: string;
  killerSignature: string | null;
  victim: {
    id: string;
    nickname: string;
    group: string;
    photo: string | null;
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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-white to-gray-100">
      <div className="container mx-auto py-6 px-4 max-w-md">
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
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-center">
              <Skull className="h-8 w-8 text-gray-600" />
              Cementiri
            </h1>
            <p className="text-muted-foreground text-center text-sm mt-2">
              {eliminations.length} víctimes descansen en pau
            </p>
          </div>

          {eliminations.length === 0 ? (
            <Alert className="bg-gray-50 border-gray-200">
              <AlertDescription className="text-center">
                Encara no hi ha cap víctima. Que comenci el joc! 🔪
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {eliminations.map((elimination) => (
                <Card 
                  key={elimination.id} 
                  className="overflow-hidden bg-white/90 backdrop-blur hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Victim Avatar */}
                      <Avatar className="h-20 w-20 grayscale opacity-80 border-2 border-gray-300 rounded-lg">
                        <AvatarImage src={elimination.victim.photo || undefined} />
                        <AvatarFallback className="bg-gray-200 text-gray-500 text-xl rounded-lg">
                          {elimination.victim.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Victim Info and Death Time */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{elimination.victim.nickname}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{elimination.victim.group}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(elimination.timestamp).toLocaleDateString('ca-ES', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Killer's Signature */}
                      {elimination.killerSignature && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 w-32 h-20 flex items-center justify-center">
                          <img 
                            src={elimination.killerSignature} 
                            alt="Signatura misteriosa"
                            className="max-h-full max-w-full object-contain opacity-80"
                            title="Qui serà l'assassí?"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Mystery footer message */}
          {eliminations.length > 0 && (
            <Card className="bg-gray-100 border-gray-300">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 italic">
                  "Les signatures revelen pistes... qui serà el pròxim?" 🔍
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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