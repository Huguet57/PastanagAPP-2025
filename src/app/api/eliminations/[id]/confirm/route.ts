import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eliminationId = params.id;

    // Get the elimination with all related data
    const elimination = await prisma.elimination.findUnique({
      where: { id: eliminationId },
      include: {
        eliminator: true,
        victim: {
          include: {
            user: true
          }
        },
        game: true
      }
    });

    if (!elimination) {
      return NextResponse.json(
        { error: 'Eliminació no trobada' },
        { status: 404 }
      );
    }

    if (elimination.confirmed) {
      return NextResponse.json(
        { error: 'Aquesta eliminació ja ha estat confirmada' },
        { status: 400 }
      );
    }

    // Check if user is the victim or an organizer/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isVictim = elimination.victim.userId === session.user.id;
    const isOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

    if (!isVictim && !isOrganizer) {
      return NextResponse.json(
        { error: 'No tens permís per confirmar aquesta eliminació' },
        { status: 403 }
      );
    }

    // Start transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Confirm the elimination
      await tx.elimination.update({
        where: { id: eliminationId },
        data: { confirmed: true }
      });

      // 2. Update victim status to ELIMINATED
      await tx.participant.update({
        where: { id: elimination.victimId },
        data: { 
          status: 'ELIMINATED',
          targetId: null
        }
      });

      // 3. Get the victim's target (who becomes the eliminator's new target)
      const victimsTarget = await tx.participant.findFirst({
        where: {
          id: elimination.victim.targetId
        }
      });

      // 4. Update eliminator's target to victim's target
      if (victimsTarget && elimination.eliminator.status === 'ALIVE') {
        await tx.participant.update({
          where: { id: elimination.eliminatorId },
          data: { targetId: victimsTarget.id }
        });
      }

      // 5. Check if game should end (only one or zero players left)
      const remainingPlayers = await tx.participant.count({
        where: {
          gameId: elimination.gameId,
          status: 'ALIVE'
        }
      });

      if (remainingPlayers === 1) {
        // We have a winner!
        const winner = await tx.participant.findFirst({
          where: {
            gameId: elimination.gameId,
            status: 'ALIVE'
          }
        });

        if (winner) {
          await tx.participant.update({
            where: { id: winner.id },
            data: { status: 'WINNER' }
          });

          await tx.game.update({
            where: { id: elimination.gameId },
            data: {
              status: 'ENDED',
              endDate: new Date()
            }
          });
        }
      } else if (remainingPlayers === 0) {
        // Something went wrong, end the game
        await tx.game.update({
          where: { id: elimination.gameId },
          data: {
            status: 'ENDED',
            endDate: new Date()
          }
        });
      }

      return { remainingPlayers };
    });

    return NextResponse.json({
      success: true,
      message: 'Eliminació confirmada',
      gameEnded: result.remainingPlayers <= 1
    });

  } catch (error) {
    console.error('Error confirming elimination:', error);
    return NextResponse.json(
      { error: 'Error al confirmar l\'eliminació' },
      { status: 500 }
    );
  }
} 