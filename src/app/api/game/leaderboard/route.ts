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
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Get current user's participant ID
    const currentParticipant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        gameId: gameId
      }
    });

    // Get all participants with their eliminations
    const participants = await prisma.participant.findMany({
      where: {
        gameId: gameId
      },
      include: {
        eliminations: {
          where: {
            confirmed: true
          }
        }
      }
    });

    // Get game start date for survival time calculation
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    const startTime = game?.startDate || new Date();

    // Calculate leaderboard entries
    const entries = participants.map(participant => {
      const survivalTime = participant.status === 'ALIVE' 
        ? Math.floor((Date.now() - startTime.getTime()) / (1000 * 60 * 60)) // hours
        : Math.floor((participant.updatedAt.getTime() - startTime.getTime()) / (1000 * 60 * 60));

      const score = (participant.eliminations.length * 100) + 
                   survivalTime + 
                   (participant.status === 'WINNER' ? 500 : 0);

      return {
        id: participant.id,
        nickname: participant.nickname,
        group: participant.group || '',
        photo: participant.photo,
        status: participant.status,
        eliminations: participant.eliminations.length,
        survivalTime: survivalTime,
        score: score
      };
    });

    // Sort by score (descending)
    entries.sort((a, b) => b.score - a.score);

    // Add positions
    const rankedEntries = entries.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    return NextResponse.json({
      entries: rankedEntries,
      currentParticipantId: currentParticipant?.id || null
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Error al obtenir el rànquing' },
      { status: 500 }
    );
  }
} 