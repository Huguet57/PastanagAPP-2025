'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Send, Skull } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EliminationFormProps {
  targetId: string;
  targetName: string;
  targetGroup: string;
  targetPhoto?: string;
}

export function EliminationForm({ targetId, targetName, targetGroup, targetPhoto }: EliminationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureData = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return canvas.toDataURL('image/png');
  };

  const handleSubmit = async () => {
    if (!hasSignature) {
      toast({
        title: 'Signatura requerida',
        description: 'Has de signar per confirmar l\'eliminació',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const signatureData = getSignatureData();

      const response = await fetch('/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId,
          killerSignature: signatureData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Error al reportar l\'eliminació');
      }

      toast({
        title: 'Eliminació reportada!',
        description: 'Pendent de confirmació per la víctima o un organitzador'
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al reportar l\'eliminació',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Victim Card */}
      <Card className="border-2 border-red-400 overflow-hidden">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-500" />
            Confirmar Eliminació
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 border-4 border-red-300 shadow-xl rounded-lg">
              <AvatarImage src={targetPhoto || undefined} />
              <AvatarFallback className="text-4xl bg-red-100 text-red-600 rounded-lg">
                {targetName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-2xl font-bold">{targetName}</p>
              <p className="text-muted-foreground">{targetGroup}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Killer Signature */}
      <Card>
        <CardHeader>
          <CardTitle>La teva signatura</CardTitle>
          <CardDescription>
            Signa per confirmar l'eliminació. La teva signatura apareixerà al cementiri com a pista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-48 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={!hasSignature || loading}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Esborrar signatura
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          Un cop reportis l'eliminació, la víctima o un organitzador hauran de confirmar-la. 
          Si s'aprova, se t'assignarà automàticament la següent víctima.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button 
        size="lg" 
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
        disabled={loading || !hasSignature}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reportant eliminació...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Reportar Eliminació
          </>
        )}
      </Button>
    </div>
  );
} 