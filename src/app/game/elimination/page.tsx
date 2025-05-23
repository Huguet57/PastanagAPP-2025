'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EliminationForm } from '@/components/forms/elimination-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TargetInfo {
  id: string;
  nickname: string;
  group: string;
  photo: string | null;
}

export default function EliminationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('targetId');
  
  const [loading, setLoading] = useState(true);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTargetInfo = async () => {
      if (!session?.user?.id || !targetId) {
        setError('Informació de víctima no vàlida');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Verify this is the user's actual target
        const response = await fetch(`/api/participants/target?targetId=${targetId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Error verificant la víctima');
        }

        const target = await response.json();
        setTargetInfo(target);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error carregant la informació');
      } finally {
        setLoading(false);
      }
    };

    fetchTargetInfo();
  }, [session, targetId]);

  if (status === 'loading' || loading) {
    return <EliminationPageSkeleton />;
  }

  if (error || !targetInfo) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tornar al dashboard
            </Button>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No es pot processar l'eliminació</AlertTitle>
              <AlertDescription>
                {error || 'Aquesta no és la teva víctima assignada o ja ha estat eliminada.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tornar al dashboard
          </Button>
          <CardTitle className="text-2xl">Reportar Eliminació</CardTitle>
        </CardHeader>
        <CardContent>
          <EliminationForm
            targetId={targetInfo.id}
            targetName={targetInfo.nickname}
            targetGroup={targetInfo.group}
            targetPhoto={targetInfo.photo || undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EliminationPageSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
} 