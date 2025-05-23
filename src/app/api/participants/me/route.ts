import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session in /api/participants/me:', session?.user?.id ? `User ${session.user.id}` : 'No session');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    console.log('🎮 Requested gameId:', gameId);

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Check all participants for this user
    const allUserParticipants = await prisma.participant.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        gameId: true,
        nickname: true,
        status: true
      }
    });
    console.log('👥 All participants for user:', allUserParticipants);

    // Get participant info
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        gameId: gameId
      },
      include: {
        target: {
          select: {
            id: true,
            nickname: true,
            group: true,
            photo: true
          }
        },
        eliminations: {
          where: {
            confirmed: true
          }
        },
        user: {
          select: {
            role: true
          }
        }
      }
    });

    console.log('🎯 Participant found:', participant ? {
      id: participant.id,
      nickname: participant.nickname,
      status: participant.status,
      hasTarget: !!participant.target,
      eliminationsCount: participant.eliminations.length
    } : 'None');

    if (!participant) {
      return NextResponse.json(
        { error: 'No ets participant en aquest joc' },
        { status: 404 }
      );
    }

    // Get statistics
    const totalParticipants = await prisma.participant.count({
      where: {
        gameId: gameId
      }
    });

    const aliveParticipants = await prisma.participant.count({
      where: {
        gameId: gameId,
        status: 'ALIVE'
      }
    });

    console.log('📊 Game stats:', { totalParticipants, aliveParticipants });

    // Calculate position (by number of eliminations)
    const participantsWithEliminations = await prisma.participant.findMany({
      where: {
        gameId: gameId,
        status: 'ALIVE'
      },
      include: {
        eliminations: {
          where: {
            confirmed: true
          }
        }
      }
    });

    const sortedByEliminations = participantsWithEliminations
      .map(p => ({
        id: p.id,
        eliminations: p.eliminations.length
      }))
      .sort((a, b) => b.eliminations - a.eliminations);

    const position = sortedByEliminations.findIndex(p => p.id === participant.id) + 1;

    const response = {
      id: participant.id,
      nickname: participant.nickname,
      group: participant.group || '',
      status: participant.status,
      photo: participant.photo,
      target: participant.target,
      eliminations: participant.eliminations.length,
      position: position,
      totalParticipants: aliveParticipants,
      user: {
        role: participant.user.role
      }
    };

    console.log('✅ Returning participant data:', {
      ...response,
      target: response.target ? 'Has target' : 'No target'
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching participant info:', error);
    return NextResponse.json(
      { error: 'Error al obtenir la informació del participant' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session in PUT /api/participants/me:', session?.user?.id ? `User ${session.user.id}` : 'No session');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, photo } = body;
    console.log('🎮 Updating participant in gameId:', gameId);

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Find the participant to update
    const participant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        gameId: gameId
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'No ets participant en aquest joc' },
        { status: 404 }
      );
    }

    // Update only the photo field for now (can be extended for other fields)
    const updatedParticipant = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        photo: photo || null
      },
      select: {
        id: true,
        nickname: true,
        group: true,
        photo: true,
        status: true
      }
    });

    console.log('✅ Updated participant photo:', participant.id);

    return NextResponse.json({
      success: true,
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('❌ Error updating participant:', error);
    return NextResponse.json(
      { error: 'Error al actualitzar el perfil' },
      { status: 500 }
    );
  }
} 