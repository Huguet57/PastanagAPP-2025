import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEliminationSchema = z.object({
  targetId: z.string(),
  witnesses: z.array(z.string()).optional(),
  victimSignature: z.string()
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

    // Create the elimination (not confirmed yet)
    const elimination = await prisma.elimination.create({
      data: {
        gameId: participant.gameId,
        eliminatorId: participant.id,
        victimId: validatedData.targetId,
        method: null,
        location: null,
        witnesses: validatedData.witnesses ? JSON.stringify(validatedData.witnesses) : null,
        confirmed: false
      }
    });

    // Update victim's signature
    await prisma.participant.update({
      where: { id: validatedData.targetId },
      data: { signature: validatedData.victimSignature }
    });

    return NextResponse.json({
      success: true,
      eliminationId: elimination.id,
      message: 'Eliminació reportada. Pendent de confirmació pels organitzadors.'
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
        eliminator: {
          select: {
            id: true,
            nickname: true,
            group: true,
            photo: true
          }
        },
        victim: {
          select: {
            id: true,
            nickname: true,
            group: true,
            photo: true,
            signature: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(eliminations.map(e => ({
      ...e,
      witnesses: e.witnesses ? JSON.parse(e.witnesses) : []
    })));

  } catch (error) {
    console.error('Error fetching eliminations:', error);
    return NextResponse.json(
      { error: 'Error al obtenir les eliminacions' },
      { status: 500 }
    );
  }
} 