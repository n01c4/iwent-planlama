import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

// OWASP recommended parameters for Argon2id
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const categories = [
  { name: 'Konser', slug: 'konser', description: 'Canlı müzik konserleri', color: '#FF6B6B', sortOrder: 1 },
  { name: 'Festival', slug: 'festival', description: 'Müzik ve eğlence festivalleri', color: '#4ECDC4', sortOrder: 2 },
  { name: 'Tiyatro', slug: 'tiyatro', description: 'Tiyatro oyunları ve gösteriler', color: '#45B7D1', sortOrder: 3 },
  { name: 'Spor', slug: 'spor', description: 'Spor etkinlikleri ve maçlar', color: '#96CEB4', sortOrder: 4 },
  { name: 'Konferans', slug: 'konferans', description: 'İş ve teknoloji konferansları', color: '#FFEAA7', sortOrder: 5 },
  { name: 'Sergi', slug: 'sergi', description: 'Sanat sergileri ve müze etkinlikleri', color: '#DDA0DD', sortOrder: 6 },
  { name: 'Stand-up', slug: 'stand-up', description: 'Stand-up komedi gösterileri', color: '#FF9F43', sortOrder: 7 },
  { name: 'Sinema', slug: 'sinema', description: 'Film gösterimleri ve özel seanslar', color: '#5F27CD', sortOrder: 8 },
  { name: 'Workshop', slug: 'workshop', description: 'Eğitim ve atölye çalışmaları', color: '#10AC84', sortOrder: 9 },
  { name: 'Parti', slug: 'parti', description: 'Gece kulübü ve parti etkinlikleri', color: '#EE5A24', sortOrder: 10 },
  { name: 'Diğer', slug: 'diger', description: 'Diğer etkinlikler', color: '#636E72', sortOrder: 99 },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Seed categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log(`✅ Seeded ${categories.length} categories`);
}

async function seedTestUsers() {
  // Create test organizer user
  const hashedPassword = await hash('Test123!', ARGON2_OPTIONS);

  const testOrganizer = await prisma.user.upsert({
    where: { email: 'organizer@test.com' },
    update: {},
    create: {
      email: 'organizer@test.com',
      passwordHash: hashedPassword,
      name: 'Test Organizer',
      role: 'organizer',
      emailVerified: true,
    },
  });

  // Create organizer profile
  await prisma.organizer.upsert({
    where: { userId: testOrganizer.id },
    update: {},
    create: {
      userId: testOrganizer.id,
      businessName: 'Test Organizasyon',
      description: 'Test amaçlı organizatör profili',
      email: 'organizer@test.com',
      isVerified: true,
    },
  });

  console.log('✅ Seeded test organizer user');
}

main()
  .then(async () => {
    await seedTestUsers();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
