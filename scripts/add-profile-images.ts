import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Servei per generar avatars únics
function getAvatarUrl(name: string, group: string): string {
  // Utilitzem diferents serveis d'avatars per varietat
  const services = [
    // DiceBear Avatars - estil "lorelei"
    (name: string) => `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffdfba,ffd5dc,d1d4f9,c0aede,b6e3f4`,
    // DiceBear Avatars - estil "adventurer"
    (name: string) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffdfba,ffd5dc,d1d4f9`,
    // DiceBear Avatars - estil "fun-emoji"
    (name: string) => `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(name)}`,
    // DiceBear Avatars - estil "avataaars"
    (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffdfba,ffd5dc`,
    // UI Avatars - amb les inicials
    (name: string) => {
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      const colors = ['f59e32', 'e66b06', '22c55e', '3b82f6', 'a855f7', 'ef4444'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200&bold=true`;
    }
  ];

  // Seleccionar un servei basat en el grup per mantenir consistència
  const groupIndex = group.charCodeAt(0) % services.length;
  return services[groupIndex](name);
}

async function main() {
  console.log('🖼️  Afegint imatges de perfil als participants...\n');

  try {
    // Obtenir tots els participants amb la informació de l'usuari
    const participants = await prisma.participant.findMany({
      include: {
        user: true
      }
    });

    console.log(`📋 Trobats ${participants.length} participants\n`);

    // Actualitzar cada participant amb una imatge de perfil
    for (const participant of participants) {
      const avatarUrl = getAvatarUrl(participant.user.name, participant.group || '');
      
      await prisma.participant.update({
        where: { id: participant.id },
        data: { photo: avatarUrl }
      });

      console.log(`✅ ${participant.nickname} (${participant.group}) - Imatge afegida`);
    }

    console.log('\n🎉 Totes les imatges s\'han afegit correctament!');
    
    // Mostrar alguns exemples
    console.log('\n📸 Exemples d\'URLs d\'imatges generades:');
    const examples = participants.slice(0, 3);
    for (const participant of examples) {
      const avatarUrl = getAvatarUrl(participant.user.name, participant.group || '');
      console.log(`   - ${participant.nickname}: ${avatarUrl}`);
    }

    console.log('\n💡 Consell: Refresca la pàgina del dashboard per veure les noves imatges!');

  } catch (error) {
    console.error('❌ Error afegint imatges:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  }); 