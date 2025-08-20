import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      statusOnline: false,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create CS users
  const csUsers = [
    {
      name: 'Customer Service 1',
      email: 'cs1@helpdesk.com',
      password: 'cs123',
      role: 'CS' as const,
    },
    {
      name: 'Customer Service 2', 
      email: 'cs2@helpdesk.com',
      password: 'cs123',
      role: 'CS' as const,
    },
    {
      name: 'Customer Service 3',
      email: 'cs3@helpdesk.com', 
      password: 'cs123',
      role: 'CS' as const,
    },
  ];

  for (const csUser of csUsers) {
    const hashedPassword = await bcrypt.hash(csUser.password, 12);
    const cs = await prisma.user.upsert({
      where: { email: csUser.email },
      update: {},
      create: {
        name: csUser.name,
        email: csUser.email,
        passwordHash: hashedPassword,
        role: csUser.role,
        statusOnline: false,
      },
    });
    console.log('✅ CS user created:', cs.email);
  }

  // Create sample clients (for testing)
  const sampleClients = [
    {
      telegramId: '123456789',
      name: 'John Doe',
      username: 'johndoe',
    },
    {
      telegramId: '987654321',
      name: 'Jane Smith',
      username: 'janesmith',
    },
    {
      telegramId: '456789123',
      name: 'Bob Wilson',
      username: 'bobwilson',
    },
  ];

  for (const clientData of sampleClients) {
    const client = await prisma.client.upsert({
      where: { telegramId: clientData.telegramId },
      update: {},
      create: clientData,
    });
    console.log('✅ Sample client created:', client.name);
  }

  // Create sample sessions and chats (for demo purposes)
  const cs1 = await prisma.user.findUnique({ where: { email: 'cs1@helpdesk.com' } });
  const client1 = await prisma.client.findUnique({ where: { telegramId: '123456789' } });

  if (cs1 && client1) {
    const session = await prisma.session.upsert({
      where: { id: 'demo-session-1' },
      update: {},
      create: {
        id: 'demo-session-1',
        clientId: client1.id,
        csId: cs1.id,
        status: 'ACTIVE',
      },
    });

    // Add sample chat messages
    const sampleMessages = [
      {
        sessionId: session.id,
        senderType: 'CLIENT' as const,
        messageType: 'TEXT' as const,
        message: 'Hello, I need help with my order',
        isRead: true,
      },
      {
        sessionId: session.id,
        senderType: 'CS' as const,
        messageType: 'TEXT' as const,
        message: 'Hi! I\'d be happy to help you with your order. Could you please provide your order number?',
        isRead: true,
      },
      {
        sessionId: session.id,
        senderType: 'CLIENT' as const,
        messageType: 'TEXT' as const,
        message: 'My order number is #12345',
        isRead: false,
      },
    ];

    for (const messageData of sampleMessages) {
      await prisma.chat.create({
        data: messageData,
      });
    }

    console.log('✅ Sample session and messages created');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });