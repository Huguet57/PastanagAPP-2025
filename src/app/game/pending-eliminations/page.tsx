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
    userId?: string;
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
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);

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

        // Check if user is admin from session
        const isAdmin = session.user.role === 'ADMIN';
        setIsOrganizer(isAdmin);

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
        
        // If admin, show all eliminations
        if (isAdmin) {
          setPendingEliminations(data);
        } else {
          // For regular users, try to get participant info
          try {
            const userResponse = await fetch(`/api/participants/me?gameId=${game.id}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              const isOrganizerRole = userData.user?.role === 'ORGANIZER';
              setIsOrganizer(isOrganizerRole);
              setCurrentParticipantId(userData.id);
              
              // Show eliminations where user is victim or (if organizer) all eliminations
              const filtered = isOrganizerRole ? data : data.filter((e: PendingElimination) => 
                e.victim.id === userData.id
              );
              setPendingEliminations(filtered);
            } else {
              // If user is not a participant, show no eliminations
              setPendingEliminations([]);
            }
          } catch (err) {
            console.error('Error fetching participant info:', err);
            setPendingEliminations([]);
          }
        }
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
  }, [session, toast]);

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
              {isOrganizer ? 'Eliminacions Pendents' : 'Confirmar Eliminació'}
            </h1>
            {isOrganizer && (
              <p className="text-muted-foreground text-center text-sm mt-2">
                {pendingEliminations.length} {pendingEliminations.length === 1 ? 'eliminació pendent' : 'eliminacions pendents'}
              </p>
            )}
          </div>

          {pendingEliminations.length === 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-center">
                No hi ha eliminacions pendents de confirmar ✅
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingEliminations.map((elimination) => {
                const isVictim = elimination.victim.id === currentParticipantId;
                
                return (
                  <Card 
                    key={elimination.id} 
                    className={`overflow-hidden border-2 ${isVictim ? 'border-red-400' : 'border-orange-300'}`}
                  >
                    <CardHeader className={`${isVictim ? 'bg-red-50' : 'bg-orange-50'} pb-4`}>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`${isVictim ? 'border-red-400 text-red-600' : 'border-orange-400 text-orange-600'}`}>
                          {isVictim ? 'T\'han eliminat!' : 'Pendent de confirmació'}
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
                    <CardContent className="pt-6 pb-6 px-6">
                      {isVictim ? (
                        // Victim view - show assassin's identity
                        <div className="space-y-6">
                          <div className="text-center">
                            <p className="text-xl font-bold mb-3">Has estat eliminat!</p>
                            <p className="text-sm text-muted-foreground mb-8">
                              Confirma si aquesta persona t'ha eliminat
                            </p>
                          </div>
                          
                          {/* Assassin's identity */}
                          <div className="mx-auto text-center space-y-4">
                            <p className="text-sm font-medium text-muted-foreground mb-6">Assassí:</p>
                            <div className="relative inline-block mb-6">
                              <Avatar className="h-28 w-28 mx-auto ring-4 ring-red-400 ring-offset-4 rounded-lg">
                                <AvatarImage 
                                  src={elimination.eliminator.photo || undefined} 
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-3xl font-bold rounded-lg">
                                  {elimination.eliminator.nickname.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="space-y-3">
                              <p className="font-bold text-xl">{elimination.eliminator.nickname}</p>
                              <p className="text-sm text-muted-foreground">{elimination.eliminator.group}</p>
                              <div className="pt-2">
                                <Badge variant="destructive" className="px-6 py-2 text-sm font-semibold">
                                  T'ha eliminat
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Organizer view - show both victim and killer
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-6">
                            {/* Only show killer if organizer */}
                            {isOrganizer && (
                              <div className="flex-1 text-center space-y-3">
                                <Avatar className="h-20 w-20 mx-auto ring-2 ring-green-400 ring-offset-2 rounded-lg">
                                  <AvatarImage 
                                    src={elimination.eliminator.photo || undefined} 
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white font-bold rounded-lg">
                                    {elimination.eliminator.nickname.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <p className="font-semibold text-sm">{elimination.eliminator.nickname}</p>
                                  <p className="text-xs text-muted-foreground">{elimination.eliminator.group}</p>
                                </div>
                                <Badge className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 border-0">
                                  Assassí
                                </Badge>
                              </div>
                            )}

                            {/* Arrow or Signature */}
                            <div className="flex flex-col items-center justify-center px-2">
                              <div className="text-2xl text-gray-400 mb-2">→</div>
                              {elimination.killerSignature && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 w-20 h-14 flex items-center justify-center">
                                  <img 
                                    src={elimination.killerSignature} 
                                    alt="Signatura"
                                    className="max-h-full max-w-full object-contain opacity-70"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Victim */}
                            <div className="flex-1 text-center space-y-3">
                              <Avatar className="h-20 w-20 mx-auto ring-2 ring-red-300 ring-offset-2 rounded-lg">
                                <AvatarImage 
                                  src={elimination.victim.photo || undefined} 
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white font-bold rounded-lg">
                                  {elimination.victim.nickname.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">{elimination.victim.nickname}</p>
                                <p className="text-xs text-muted-foreground">{elimination.victim.group}</p>
                              </div>
                              <Badge variant="destructive" className="text-xs px-3 py-1">
                                Víctima
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Confirm button */}
                      <div className="pt-6">
                        <Button
                          onClick={() => confirmElimination(elimination.id)}
                          disabled={processingId === elimination.id}
                          className={`w-full h-14 font-semibold text-base shadow-lg transition-all ${
                            isVictim 
                              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                          } text-white`}
                        >
                          {processingId === elimination.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                              Confirmant...
                            </div>
                          ) : (
                            <>
                              <Check className="mr-3 h-5 w-5" />
                              {isVictim ? 'Confirmar la meva eliminació' : 'Confirmar Eliminació'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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