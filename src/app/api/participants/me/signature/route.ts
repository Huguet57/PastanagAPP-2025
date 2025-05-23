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

    // Get the current participant in the active game
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        status: 'ALIVE',
        game: {
          status: 'ACTIVE'
        }
      },
      select: {
        id: true,
        signature: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'No ets un participant actiu' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      signature: participant.signature || null
    });

  } catch (error) {
    console.error('Error fetching participant signature:', error);
    return NextResponse.json(
      { error: 'Error al obtenir la signatura' },
      { status: 500 }
    );
  }
} 