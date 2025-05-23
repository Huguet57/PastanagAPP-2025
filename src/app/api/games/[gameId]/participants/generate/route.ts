import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Funció per generar una contrasenya aleatòria
function generatePassword(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Funció per generar un email únic
function generateEmail(name: string, index: number): string {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove special chars
  return `${cleanName}${index}@pastanaga.local`
}

// Algoritme per assignar objectius en una cadena tancada
function assignTargets(participantIds: string[]): Map<string, string> {
  if (participantIds.length < 3) {
    throw new Error('Es necessiten almenys 3 participants')
  }

  // Barrejar array de forma aleatòria
  const shuffled = [...participantIds].sort(() => Math.random() - 0.5)
  
  // Crear assignacions en cadena circular
  const assignments = new Map<string, string>()
  for (let i = 0; i < shuffled.length; i++) {
    const hunter = shuffled[i]
    const target = shuffled[(i + 1) % shuffled.length]
    assignments.set(hunter, target)
  }

  return assignments
}

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participants } = body

    if (!participants || participants.length < 3) {
      return NextResponse.json(
        { error: 'Es necessiten almenys 3 participants' },
        { status: 400 }
      )
    }

    // Verificar que el joc existeix
    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
    })

    if (!game) {
      return NextResponse.json({ error: 'Joc no trobat' }, { status: 404 })
    }

    const credentials: any[] = []
    const createdParticipantIds: string[] = []

    // Crear usuaris i participants
    for (let i = 0; i < participants.length; i++) {
      const { name, group, photo } = participants[i]
      
      // Generar credencials úniques
      const email = generateEmail(name, i)
      const password = generatePassword()
      const hashedPassword = await bcrypt.hash(password, 10)

      // Verificar si l'usuari ja existeix
      let user = await prisma.user.findUnique({
        where: { email },
      })

      // Si no existeix, crear-lo
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: 'PLAYER',
          },
        })
      }

      // Crear participant
      const participant = await prisma.participant.create({
        data: {
          gameId: params.gameId,
          userId: user.id,
          nickname: name,
          group: group || '',
          photo: photo || null,
          status: 'ALIVE',
        },
      })

      createdParticipantIds.push(participant.id)
      credentials.push({
        name,
        email,
        password, // Contrasenya sense xifrar per al CSV
      })
    }

    // Assignar objectius aleatòriament
    const targetAssignments = assignTargets(createdParticipantIds)
    
    // Actualitzar participants amb els seus objectius
    for (const [hunterId, targetId] of Array.from(targetAssignments.entries())) {
      await prisma.participant.update({
        where: { id: hunterId },
        data: { targetId },
      })
    }

    // Si tot ha anat bé, actualitzar l'estat del joc
    if (game.status === 'SETUP') {
      await prisma.game.update({
        where: { id: params.gameId },
        data: { status: 'ACTIVE' },
      })
    }

    return NextResponse.json({
      success: true,
      created: createdParticipantIds.length,
      credentials, // Retornar credencials per descarregar
    })
  } catch (error) {
    console.error('Error generating participants:', error)
    return NextResponse.json(
      { error: 'Error generant participants' },
      { status: 500 }
    )
  }
} 