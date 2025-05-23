import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New test signature
const NEW_TEST_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function main() {
  console.log('🔍 Testing participant signature update...\n');

  try {
    // Find a participant with confirmed eliminations
    const participantWithEliminations = await prisma.participant.findFirst({
      where: {
        eliminations: {
          some: {
            confirmed: true
          }
        }
      },
      include: {
        eliminations: {
          where: { confirmed: true },
          select: {
            id: true,
            victim: {
              select: {
                nickname: true
              }
            },
            killerSignature: true
          }
        },
        user: true
      }
    });

    if (!participantWithEliminations) {
      console.log('❌ No participant with confirmed eliminations found');
      return;
    }

    console.log(`📋 Found participant: ${participantWithEliminations.nickname} (${participantWithEliminations.user.name})`);
    console.log(`   Current signature: ${participantWithEliminations.signature ? 'Yes' : 'No'}`);
    console.log(`   Confirmed eliminations: ${participantWithEliminations.eliminations.length}`);
    
    console.log('\n🎯 Current eliminations:');
    participantWithEliminations.eliminations.forEach(elim => {
      console.log(`   - Victim: ${elim.victim.nickname}`);
      console.log(`     Signature: ${elim.killerSignature ? elim.killerSignature.substring(0, 50) + '...' : 'None'}`);
    });

    // Update participant signature and all their eliminations
    console.log('\n🔄 Updating participant signature and all eliminations...');
    
    await prisma.$transaction(async (tx) => {
      // Update participant signature
      await tx.participant.update({
        where: { id: participantWithEliminations.id },
        data: { signature: NEW_TEST_SIGNATURE }
      });

      // Update all their confirmed eliminations
      await tx.elimination.updateMany({
        where: {
          eliminatorId: participantWithEliminations.id,
          confirmed: true
        },
        data: { killerSignature: NEW_TEST_SIGNATURE }
      });
    });

    // Verify the updates
    const updatedParticipant = await prisma.participant.findUnique({
      where: { id: participantWithEliminations.id },
      include: {
        eliminations: {
          where: { confirmed: true },
          select: {
            id: true,
            victim: {
              select: {
                nickname: true
              }
            },
            killerSignature: true
          }
        }
      }
    });

    console.log('\n✅ Update complete!');
    console.log(`   Participant signature updated: ${updatedParticipant?.signature === NEW_TEST_SIGNATURE ? 'Yes' : 'No'}`);
    
    console.log('\n🎯 Updated eliminations:');
    updatedParticipant?.eliminations.forEach(elim => {
      console.log(`   - Victim: ${elim.victim.nickname}`);
      console.log(`     Signature updated: ${elim.killerSignature === NEW_TEST_SIGNATURE ? 'Yes ✓' : 'No ✗'}`);
    });

    console.log('\n💡 This demonstrates how a participant\'s signature is persisted and updated across all their eliminations!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 