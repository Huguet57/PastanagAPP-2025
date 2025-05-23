import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const participants = await prisma.participant.findMany({
      where: {
        gameId: params.gameId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        target: {
          select: {
            nickname: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform data for frontend
    const transformedParticipants = participants.map(p => ({
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      nickname: p.nickname,
      group: p.group,
      photo: p.photo,
      status: p.status,
      target: p.target ? {
        name: p.target.user.name,
        nickname: p.target.nickname,
      } : null,
    }))

    return NextResponse.json(transformedParticipants)
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 