import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEliminationSchema = z.object({
  targetId: z.string(),
  killerSignature: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEliminationSchema.parse(body);

    // Get the current participant
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        status: 'ALIVE',
        game: {
          status: 'ACTIVE'
        }
      },
      include: {
        game: true,
        target: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'No ets un participant actiu en cap joc' },
        { status: 400 }
      );
    }

    // Verify the target is correct
    if (participant.targetId !== validatedData.targetId) {
      return NextResponse.json(
        { error: 'Aquesta no és la teva víctima assignada' },
        { status: 400 }
      );
    }

    // Verify target is still alive
    const targetParticipant = await prisma.participant.findUnique({
      where: { id: validatedData.targetId }
    });

    if (!targetParticipant || targetParticipant.status !== 'ALIVE') {
      return NextResponse.json(
        { error: 'La víctima ja ha estat eliminada' },
        { status: 400 }
      );
    }

    // Check if target already has a pending elimination
    const existingPendingElimination = await prisma.elimination.findFirst({
      where: {
        victimId: validatedData.targetId,
        gameId: participant.gameId,
        confirmed: false
      }
    });

    if (existingPendingElimination) {
      return NextResponse.json(
        { error: 'Aquesta víctima ja té una eliminació pendent de confirmar' },
        { status: 400 }
      );
    }

    // Create the elimination and update participant signature in a transaction
    const [elimination] = await prisma.$transaction(async (tx) => {
      // Update participant's signature if it's not set or different
      if (participant.signature !== validatedData.killerSignature) {
        await tx.participant.update({
          where: { id: participant.id },
          data: { signature: validatedData.killerSignature }
        });

        // Update all previous eliminations by this participant with the new signature
        await tx.elimination.updateMany({
          where: { 
            eliminatorId: participant.id,
            confirmed: true
          },
          data: { killerSignature: validatedData.killerSignature }
        });
      }

      // Create the elimination
      const newElimination = await tx.elimination.create({
        data: {
          gameId: participant.gameId,
          eliminatorId: participant.id,
          victimId: validatedData.targetId,
          method: 'Eliminació estàndard', // Default method
          killerSignature: validatedData.killerSignature,
          confirmed: false // Pending confirmation
        }
      });

      return [newElimination];
    });

    return NextResponse.json({
      success: true,
      eliminationId: elimination.id,
      message: 'Eliminació reportada. Pendent de confirmació per la víctima o un organitzador.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating elimination:', error);
    return NextResponse.json(
      { error: 'Error al crear l\'eliminació' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const confirmed = searchParams.get('confirmed');

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Check if user is admin/organizer or participant in this game
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        gameId: gameId
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!participant && user?.role !== 'ADMIN' && user?.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'No tens accés a aquest joc' },
        { status: 403 }
      );
    }

    const eliminations = await prisma.elimination.findMany({
      where: {
        gameId: gameId,
        ...(confirmed !== null ? { confirmed: confirmed === 'true' } : {})
      },
      include: {
        victim: {
          select: {
            id: true,
            nickname: true,
            group: true,
            photo: true,
            userId: true
          }
        },
        // Include eliminator info only for pending eliminations and if user is organizer
        ...(confirmed === 'false' && (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') ? {
          eliminator: {
            select: {
              id: true,
              nickname: true,
              group: true,
              photo: true
            }
          }
        } : {})
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Return simplified format for cemetery or full format for pending
    if (confirmed === 'true') {
      return NextResponse.json(eliminations.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        killerSignature: e.killerSignature,
        victim: e.victim
      })));
    } else {
      return NextResponse.json(eliminations.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        killerSignature: e.killerSignature,
        victim: e.victim,
        ...(e.eliminator ? { eliminator: e.eliminator } : {})
      })));
    }

  } catch (error) {
    console.error('Error fetching eliminations:', error);
    return NextResponse.json(
      { error: 'Error al obtenir les eliminacions' },
      { status: 500 }
    );
  }
} 