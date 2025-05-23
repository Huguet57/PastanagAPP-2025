'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Save, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const [formData, setFormData] = useState({
    method: '',
    location: '',
    witnesses: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSignature) {
      toast({
        title: 'Signatura requerida',
        description: 'La víctima ha de signar per confirmar l\'eliminació',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.method.trim()) {
      toast({
        title: 'Mètode requerit',
        description: 'Has d\'especificar com has eliminat la víctima',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const signatureData = getSignatureData();
      const witnessesArray = formData.witnesses
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      const response = await fetch('/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId,
          method: formData.method,
          location: formData.location,
          witnesses: witnessesArray,
          victimSignature: signatureData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al reportar l\'eliminació');
      }

      toast({
        title: 'Eliminació reportada!',
        description: 'L\'eliminació s\'ha enviat per revisar als organitzadors'
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Victim Info */}
      <Card>
        <CardHeader>
          <CardTitle>Víctima a eliminar</CardTitle>
          <CardDescription>Assegura't que és la teva víctima assignada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {targetPhoto && (
              <img 
                src={targetPhoto} 
                alt={targetName}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-xl font-semibold">{targetName}</p>
              <p className="text-muted-foreground">{targetGroup}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Elimination Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalls de l'eliminació</CardTitle>
          <CardDescription>Proporciona informació sobre com has eliminat la víctima</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="method">Mètode d'eliminació *</Label>
            <Textarea
              id="method"
              placeholder="Descriu com has eliminat la víctima..."
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localització (opcional)</Label>
            <Input
              id="location"
              placeholder="On ha passat l'eliminació?"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="witnesses">Testimonis (opcional)</Label>
            <Input
              id="witnesses"
              placeholder="Noms dels testimonis, separats per comes"
              value={formData.witnesses}
              onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Exemple: Joan Garcia, Maria López, Pere Puig
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Victim Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Signatura de la víctima *</CardTitle>
          <CardDescription>
            La víctima ha de signar per confirmar l'eliminació. 
            Aquesta signatura apareixerà al cementiri.
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
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                disabled={!hasSignature || loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Esborrar signatura
              </Button>
              {hasSignature && (
                <span className="text-sm text-green-600 flex items-center">
                  <Save className="mr-1 h-4 w-4" />
                  Signatura guardada
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert>
        <AlertDescription>
          Un cop enviïs l'eliminació, els organitzadors la revisaran. 
          Si s'aprova, se t'assignarà automàticament la següent víctima.
          Les eliminacions falses poden comportar la teva eliminació del joc.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button 
        type="submit" 
        size="lg" 
        className="w-full"
        disabled={loading || !hasSignature || !formData.method}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviant eliminació...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Reportar Eliminació
          </>
        )}
      </Button>
    </form>
  );
} 