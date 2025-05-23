import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session in /api/games/active:', session?.user?.id ? `User ${session.user.id}` : 'No session');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all games for debugging
    const allGames = await prisma.game.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    });
    console.log('🎮 All games in database:', allGames);

    // Get the active game
    const game = await prisma.game.findFirst({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🎯 Active game found:', game ? `${game.name} (${game.id})` : 'None');

    if (!game) {
      return NextResponse.json(
        { error: 'No hi ha cap joc actiu' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: game.id,
      name: game.name,
      description: game.description,
      status: game.status,
      startDate: game.startDate?.toISOString() || null,
      endDate: game.endDate?.toISOString() || null
    });

  } catch (error) {
    console.error('❌ Error fetching active game:', error);
    return NextResponse.json(
      { error: 'Error al obtenir el joc actiu' },
      { status: 500 }
    );
  }
} 