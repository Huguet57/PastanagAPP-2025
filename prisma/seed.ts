import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@pastanaga.cat',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        email: 'player1@pastanaga.cat',
        name: 'Joan Puig',
        password: hashedPassword,
        role: 'PLAYER'
      }
    }),
    prisma.user.create({
      data: {
        email: 'player2@pastanaga.cat',
        name: 'Maria García',
        password: hashedPassword,
        role: 'PLAYER'
      }
    }),
    prisma.user.create({
      data: {
        email: 'player3@pastanaga.cat',
        name: 'Pere López',
        password: hashedPassword,
        role: 'PLAYER'
      }
    })
  ])

  // Create a test game
  const game = await prisma.game.create({
    data: {
      name: 'Pastanaga Tardor 2024',
      description: 'El joc de la Pastanaga Assassina de la Facultat de Matemàtiques',
      status: 'ACTIVE',
      startDate: new Date(),
      rules: {
        create: [
          {
            title: 'Regla 1: Objectiu',
            description: 'Elimina la teva víctima assignada per obtenir la seva víctima.',
            order: 1
          },
          {
            title: 'Regla 2: Signatures',
            description: 'Tota eliminació ha de ser confirmada amb la signatura de la víctima.',
            order: 2
          },
          {
            title: 'Regla 3: Zones segures',
            description: 'Les aules durant les classes són zones segures.',
            order: 3
          }
        ]
      }
    }
  })

  // Create participants
  const participants = await Promise.all([
    prisma.participant.create({
      data: {
        gameId: game.id,
        userId: users[1].id,
        nickname: 'Joan',
        group: '3r - MAT',
        status: 'ALIVE'
      }
    }),
    prisma.participant.create({
      data: {
        gameId: game.id,
        userId: users[2].id,
        nickname: 'Maria',
        group: '2n - EST',
        status: 'ALIVE'
      }
    }),
    prisma.participant.create({
      data: {
        gameId: game.id,
        userId: users[3].id,
        nickname: 'Pere',
        group: '4t - MAT',
        status: 'ALIVE'
      }
    })
  ])

  // Create a circular target chain
  await prisma.participant.update({
    where: { id: participants[0].id },
    data: { targetId: participants[1].id }
  })

  await prisma.participant.update({
    where: { id: participants[1].id },
    data: { targetId: participants[2].id }
  })

  await prisma.participant.update({
    where: { id: participants[2].id },
    data: { targetId: participants[0].id }
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Test accounts:')
  console.log('   - admin@pastanaga.cat / password123')
  console.log('   - player1@pastanaga.cat / password123')
  console.log('   - player2@pastanaga.cat / password123')
  console.log('   - player3@pastanaga.cat / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 