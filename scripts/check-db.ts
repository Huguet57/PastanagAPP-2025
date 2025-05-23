import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking database state...\n')

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })
  console.log('👥 Users:', users.length)
  users.forEach(user => {
    console.log(`   - ${user.email} (${user.name}) - ${user.role}`)
  })

  // Check games
  const games = await prisma.game.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true
    }
  })
  console.log('\n🎮 Games:', games.length)
  games.forEach(game => {
    console.log(`   - ${game.name} - ${game.status} (${game.id})`)
  })

  // Check participants
  const participants = await prisma.participant.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      },
      target: {
        select: {
          nickname: true
        }
      },
      game: {
        select: {
          name: true
        }
      }
    }
  })
  console.log('\n🎯 Participants:', participants.length)
  participants.forEach(p => {
    console.log(`   - ${p.nickname} (${p.user.email}) in "${p.game.name}"`)
    console.log(`     Status: ${p.status}, Target: ${p.target?.nickname || 'None'}`)
  })

  // Check active game specifically
  const activeGame = await prisma.game.findFirst({
    where: { status: 'ACTIVE' }
  })
  console.log('\n✅ Active game:', activeGame ? activeGame.name : 'None found')
}

checkDatabase()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 