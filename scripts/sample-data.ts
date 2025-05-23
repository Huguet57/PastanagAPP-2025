import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample signatures in base64 (small images to simulate signatures)
const SAMPLE_SIGNATURES = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
];

async function main() {
  console.log('🎮 Creating sample game data...');

  // Clear existing data
  await prisma.elimination.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.gameRule.deleteMany();
  await prisma.game.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const players = [
    { name: 'Martina Colás', email: 'martina@pastanaga.cat', nickname: 'Martina', group: '3r - MAT' },
    { name: 'Jordi G. Condom', email: 'jordi@pastanaga.cat', nickname: 'Jordi', group: '3r - MAT' },
    { name: 'Bernat Ramis', email: 'bernat@pastanaga.cat', nickname: 'Bernat', group: '2n - MAT' },
    { name: 'Oriol Navarro', email: 'oriol@pastanaga.cat', nickname: 'Oriol', group: '4t - MAT' },
    { name: 'Jordi Lluch', email: 'jordilluch@pastanaga.cat', nickname: 'Jordi L.', group: '1r - MAT' },
    { name: 'Dani Muñoz', email: 'dani@pastanaga.cat', nickname: 'Dani', group: '2n - MAT' },
    { name: 'Roger Puig', email: 'roger@pastanaga.cat', nickname: 'Roger', group: '4t - MAT' },
    { name: 'Albert Fernández', email: 'albert@pastanaga.cat', nickname: 'Albert', group: '3r - EST' },
    { name: 'Sabina López', email: 'sabina@pastanaga.cat', nickname: 'Sabina', group: '4t - EST' },
    { name: 'Lara García', email: 'lara@pastanaga.cat', nickname: 'Lara', group: '2n - MAT' },
    { name: 'Joan Martí', email: 'joanmarti@pastanaga.cat', nickname: 'Joan', group: '2n - MAT' },
    { name: 'Ernesto Vila', email: 'ernesto@pastanaga.cat', nickname: 'Ernesto', group: '4t - MAT' },
    { name: 'Laia Serra', email: 'laia@pastanaga.cat', nickname: 'Laia', group: '2n - MAT' }
  ];

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pastanaga.cat',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Create player users
  const users = await Promise.all(
    players.map(player => 
      prisma.user.create({
        data: {
          email: player.email,
          name: player.name,
          password: hashedPassword,
          role: 'PLAYER'
        }
      })
    )
  );

  // Create game
  const game = await prisma.game.create({
    data: {
      name: 'Pastanaga Assassina - Tardor 2024',
      description: 'El joc de la Pastanaga Assassina de la Facultat de Matemàtiques i Estadística',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
      rules: {
        create: [
          {
            title: 'Objectiu del joc',
            description: 'Elimina la teva víctima assignada tocant-la amb una pastanaga. Quan l\'eliminis, la seva víctima passa a ser la teva.',
            order: 1
          },
          {
            title: 'Zones segures',
            description: 'No es pot eliminar ningú dins de les aules durant les classes, ni a la biblioteca, ni al lavabo.',
            order: 2
          },
          {
            title: 'Confirmació d\'eliminacions',
            description: 'Tota eliminació ha de ser confirmada amb la signatura de la víctima a l\'app.',
            order: 3
          },
          {
            title: 'Immunitat temporal',
            description: 'Després de fer una eliminació, tens 30 minuts d\'immunitat.',
            order: 4
          },
          {
            title: 'Testimonis',
            description: 'Si hi ha testimonis de l\'eliminació, s\'han d\'apuntar a l\'app.',
            order: 5
          }
        ]
      }
    }
  });

  // Create participants
  const participants = await Promise.all(
    users.map((user, index) => 
      prisma.participant.create({
        data: {
          gameId: game.id,
          userId: user.id,
          nickname: players[index].nickname,
          group: players[index].group,
          status: 'ALIVE' // We'll update some to ELIMINATED later
        }
      })
    )
  );

  // Create a circular chain of targets
  for (let i = 0; i < participants.length; i++) {
    const nextIndex = (i + 1) % participants.length;
    await prisma.participant.update({
      where: { id: participants[i].id },
      data: { targetId: participants[nextIndex].id }
    });
  }

  // Create some eliminations (simulate game progress)
  const eliminations = [
    {
      eliminatorIndex: 0, // Martina kills Jordi
      victimIndex: 1,
      witnesses: ['Pere Sánchez', 'Anna Puig'],
      daysAgo: 5
    },
    {
      eliminatorIndex: 0, // Martina kills Bernat (after getting Jordi's target)
      victimIndex: 2,
      witnesses: [],
      daysAgo: 3
    },
    {
      eliminatorIndex: 6, // Roger kills Laia
      victimIndex: 12,
      witnesses: ['Marc Torres'],
      daysAgo: 4
    },
    {
      eliminatorIndex: 5, // Dani kills Roger
      victimIndex: 6,
      witnesses: ['Laura Martínez', 'Carles Ros'],
      daysAgo: 2
    },
    {
      eliminatorIndex: 10, // Joan kills Ernesto
      victimIndex: 11,
      witnesses: [],
      daysAgo: 1
    }
  ];

  // Apply eliminations
  for (const elim of eliminations) {
    const eliminator = participants[elim.eliminatorIndex];
    const victim = participants[elim.victimIndex];

    // Create elimination
    await prisma.elimination.create({
      data: {
        gameId: game.id,
        eliminatorId: eliminator.id,
        victimId: victim.id,
        method: null,
        location: null,
        witnesses: elim.witnesses.length > 0 ? JSON.stringify(elim.witnesses) : null,
        confirmed: true,
        timestamp: new Date(Date.now() - elim.daysAgo * 24 * 60 * 60 * 1000)
      }
    });

    // Update victim status and signature
    await prisma.participant.update({
      where: { id: victim.id },
      data: { 
        status: 'ELIMINATED',
        signature: SAMPLE_SIGNATURES[Math.floor(Math.random() * SAMPLE_SIGNATURES.length)]
      }
    });

    // Update eliminator's target to victim's target
    const victimData = await prisma.participant.findUnique({
      where: { id: victim.id }
    });
    if (victimData?.targetId) {
      await prisma.participant.update({
        where: { id: eliminator.id },
        data: { targetId: victimData.targetId }
      });
    }
  }

  console.log('✅ Sample game created successfully!');
  console.log('\n📊 Game statistics:');
  console.log(`   - Total players: ${participants.length}`);
  console.log(`   - Alive players: ${participants.length - eliminations.length}`);
  console.log(`   - Eliminations: ${eliminations.length}`);
  console.log('\n📧 Test accounts (all passwords are "password123"):');
  console.log('   - admin@pastanaga.cat (Admin)');
  players.forEach(player => {
    console.log(`   - ${player.email} (${player.nickname} - ${player.group})`);
  });
  console.log('\n🎯 Try logging in as martina@pastanaga.cat - she has 2 eliminations!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating sample data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 