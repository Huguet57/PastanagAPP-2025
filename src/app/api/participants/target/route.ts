import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json(
        { error: 'targetId is required' },
        { status: 400 }
      );
    }

    // Get the current participant in any active game
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        status: 'ALIVE',
        game: {
          status: 'ACTIVE'
        }
      },
      include: {
        target: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'No ets un participant actiu' },
        { status: 403 }
      );
    }

    // Verify this is their actual target
    if (participant.targetId !== targetId) {
      return NextResponse.json(
        { error: 'Aquesta no és la teva víctima assignada' },
        { status: 403 }
      );
    }

    // Verify target is still alive
    if (participant.target?.status !== 'ALIVE') {
      return NextResponse.json(
        { error: 'La víctima ja ha estat eliminada' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: participant.target.id,
      nickname: participant.target.nickname,
      group: participant.target.group || '',
      photo: participant.target.photo
    });

  } catch (error) {
    console.error('Error verifying target:', error);
    return NextResponse.json(
      { error: 'Error al verificar la víctima' },
      { status: 500 }
    );
  }
} 