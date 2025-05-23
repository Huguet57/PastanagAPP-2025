import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pastanaga.app' },
    update: {},
    create: {
      email: 'admin@pastanaga.app',
      name: 'Admin',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  })

  // Create organizer user
  const hashedOrganizerPassword = await bcrypt.hash('organizer123', 12)
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@pastanaga.app' },
    update: {},
    create: {
      email: 'organizer@pastanaga.app',
      name: 'Organitzador',
      password: hashedOrganizerPassword,
      role: 'ORGANIZER',
    },
  })

  // Create some test players
  const testPlayers = [
    { name: 'Martina Colás', email: 'martina@student.com', course: '3r - MAT' },
    { name: 'Jordi G. Condom', email: 'jordi@student.com', course: '3r - MAT' },
    { name: 'Bernat Ramis', email: 'bernat@student.com', course: '2n - MAT' },
    { name: 'Oriol Navarro', email: 'oriol@student.com', course: '4t - MAT' },
    { name: 'Jordi Lluch', email: 'jordilluch@student.com', course: '1r - MAT' },
  ]

  const hashedPlayerPassword = await bcrypt.hash('player123', 12)

  for (const player of testPlayers) {
    await prisma.user.upsert({
      where: { email: player.email },
      update: {},
      create: {
        email: player.email,
        name: player.name,
        password: hashedPlayerPassword,
        role: 'PLAYER',
      },
    })
  }

  // Create a test game
  const game = await prisma.game.upsert({
    where: { id: 'test-game-1' },
    update: {},
    create: {
      id: 'test-game-1',
      name: 'Pastanaga Assassina - Tardor 2024',
      description: 'Facultat de Matemàtiques i Estadística - Tardor 2024',
      status: 'SETUP',
      rules: {
        create: [
          {
            title: 'Regla Bàsica',
            description: 'Elimina la teva víctima amb una pastanaga sense ser vist per testimonis.',
            order: 1,
          },
          {
            title: 'Zones Segures',
            description: 'No es pot eliminar a ningú dins de les aules durant les classes.',
            order: 2,
          },
          {
            title: 'Confirmació',
            description: 'Cada eliminació ha de ser confirmada amb la signatura de la víctima.',
            order: 3,
          },
        ],
      },
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📧 Test accounts created:')
  console.log('Admin: admin@pastanaga.app / admin123')
  console.log('Organizer: organizer@pastanaga.app / organizer123')
  console.log('Players: martina@student.com, jordi@student.com, etc. / player123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 