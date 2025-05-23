import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ['SETUP', 'ACTIVE', 'PAUSED', 'ENDED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const game = await prisma.game.update({
      where: {
        id: params.gameId,
      },
      data: {
        status,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 