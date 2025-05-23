'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface PendingElimination {
  id: string;
  timestamp: string;
  killerSignature: string | null;
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
  };
}

export default function PendingEliminationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingEliminations, setPendingEliminations] = useState<PendingElimination[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPendingEliminations = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Check user role
        const userResponse = await fetch('/api/participants/me');
        const userData = await userResponse.json();
        setIsOrganizer(userData.user?.role === 'ADMIN' || userData.user?.role === 'ORGANIZER');

        // Get active game
        const gameResponse = await fetch('/api/games/active');
        if (!gameResponse.ok) {
          throw new Error('No hi ha cap joc actiu');
        }
        const game = await gameResponse.json();

        // Get pending eliminations
        const eliminationsResponse = await fetch(`/api/eliminations?gameId=${game.id}&confirmed=false`);
        if (!eliminationsResponse.ok) {
          throw new Error('Error carregant les eliminacions pendents');
        }
        const data = await eliminationsResponse.json();
        
        // Filter to show only user's eliminations (if not organizer)
        const filtered = isOrganizer ? data : data.filter((e: PendingElimination) => 
          e.victim.id === userData.id || e.eliminator.id === userData.id
        );
        
        setPendingEliminations(filtered);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'No s\'han pogut carregar les eliminacions pendents',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEliminations();
  }, [session, isOrganizer, toast]);

  const confirmElimination = async (eliminationId: string) => {
    setProcessingId(eliminationId);
    
    try {
      const response = await fetch(`/api/eliminations/${eliminationId}/confirm`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al confirmar l\'eliminació');
      }

      const result = await response.json();
      
      toast({
        title: 'Eliminació confirmada',
        description: result.gameEnded ? 'El joc ha acabat!' : 'L\'eliminació ha estat confirmada correctament'
      });

      // Remove from list
      setPendingEliminations(prev => prev.filter(e => e.id !== eliminationId));

      // If game ended, redirect to leaderboard
      if (result.gameEnded) {
        setTimeout(() => router.push('/game/leaderboard'), 2000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al confirmar l\'eliminació',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return <PendingEliminationsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
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
              <Clock className="h-8 w-8 text-orange-600" />
              Eliminacions Pendents
            </h1>
            <p className="text-muted-foreground text-center text-sm mt-2">
              {pendingEliminations.length} {pendingEliminations.length === 1 ? 'eliminació pendent' : 'eliminacions pendents'}
            </p>
          </div>

          {pendingEliminations.length === 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-center">
                No hi ha eliminacions pendents de confirmar ✅
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingEliminations.map((elimination) => (
                <Card 
                  key={elimination.id} 
                  className="overflow-hidden border-2 border-orange-300"
                >
                  <CardHeader className="bg-orange-50 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-orange-400 text-orange-600">
                        Pendent de confirmació
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(elimination.timestamp).toLocaleDateString('ca-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      {/* Victim */}
                      <div className="flex-1 text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-red-300">
                          <AvatarImage src={elimination.victim.photo || undefined} />
                          <AvatarFallback className="bg-red-100 text-red-600">
                            {elimination.victim.nickname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{elimination.victim.nickname}</p>
                        <p className="text-xs text-muted-foreground">{elimination.victim.group}</p>
                        <Badge variant="destructive" className="mt-1 text-xs">
                          Víctima
                        </Badge>
                      </div>

                      {/* Signature */}
                      {elimination.killerSignature && (
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 w-24 h-16 flex items-center justify-center">
                          <img 
                            src={elimination.killerSignature} 
                            alt="Signatura de l'assassí"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}

                      {/* Only show killer if organizer */}
                      {isOrganizer && (
                        <div className="flex-1 text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-green-300">
                            <AvatarImage src={elimination.eliminator.photo || undefined} />
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {elimination.eliminator.nickname.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-semibold">{elimination.eliminator.nickname}</p>
                          <p className="text-xs text-muted-foreground">{elimination.eliminator.group}</p>
                          <Badge className="mt-1 text-xs bg-green-500 border-0">
                            Assassí
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Confirm button */}
                    <Button
                      onClick={() => confirmElimination(elimination.id)}
                      disabled={processingId === elimination.id}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      {processingId === elimination.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Confirmant...
                        </div>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar Eliminació
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingEliminationsSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-64 mb-2 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
} 