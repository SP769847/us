import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function main() {
  const password = await bcrypt.hash('Demo1234!', 12);
  const adminPassword = await bcrypt.hash('Admin1234!', 12);

  const alex = await prisma.user.upsert({
    where: { email: 'demo.alex@example.com' },
    update: {},
    create: {
      fullName: 'Alex Demo',
      username: 'demo_alex',
      email: 'demo.alex@example.com',
      passwordHash: password,
      bio: 'Coffee enthusiast. Loves rainy days and good playlists. [Demo account]',
    },
  });

  const sam = await prisma.user.upsert({
    where: { email: 'demo.sam@example.com' },
    update: {},
    create: {
      fullName: 'Sam Demo',
      username: 'demo_sam',
      email: 'demo.sam@example.com',
      passwordHash: password,
      bio: 'Always up for an adventure. Dog person. [Demo account]',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      fullName: 'Platform Admin',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      bio: '[Demo admin account]',
    },
  });

  const [userAId, userBId] = [alex.id, sam.id].sort();
  const connection = await prisma.connection.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });

  let conversation = await prisma.conversation.findUnique({ where: { connectionId: connection.id } });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { connectionId: connection.id } });
    await prisma.conversationMember.createMany({
      data: [
        { conversationId: conversation.id, userId: userAId },
        { conversationId: conversation.id, userId: userBId },
      ],
    });
  }

  const messageCount = await prisma.message.count({ where: { conversationId: conversation.id } });
  if (messageCount === 0) {
    await prisma.message.createMany({
      data: [
        { conversationId: conversation.id, senderId: alex.id, content: 'Hey! Excited to try this out with you 💕', type: 'TEXT' },
        { conversationId: conversation.id, senderId: sam.id, content: 'Me too! This looks really nice ❤️', type: 'TEXT' },
        { conversationId: conversation.id, senderId: alex.id, content: 'Want to play a game later tonight?', type: 'TEXT' },
      ],
    });
  }

  const existingNote = await prisma.loveNote.findFirst({ where: { senderId: alex.id, recipientId: sam.id } });
  if (!existingNote) {
    await prisma.loveNote.create({
      data: {
        senderId: alex.id,
        recipientId: sam.id,
        title: 'Things I love about you',
        message: 'Your laugh, your patience, and the way you make every day feel lighter.',
      },
    });
  }

  const existingMemory = await prisma.memory.findFirst({ where: { userId: alex.id } });
  if (!existingMemory) {
    await prisma.memory.create({
      data: {
        userId: alex.id,
        connectionId: connection.id,
        title: 'Our first coffee date',
        description: 'The little café downtown, we talked for three hours straight.',
        eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        photos: JSON.stringify([]),
      },
    });
  }

  const existingTimeline = await prisma.timelineEvent.findFirst({ where: { userId: alex.id } });
  if (!existingTimeline) {
    await prisma.timelineEvent.create({
      data: {
        userId: alex.id,
        connectionId: connection.id,
        title: 'First conversation',
        description: 'We matched and talked until 2am.',
        eventDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        milestoneType: 'FIRST_CONVERSATION',
      },
    });
  }

  const existingSpecialDate = await prisma.specialDate.findFirst({ where: { userId: alex.id } });
  if (!existingSpecialDate) {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    await prisma.specialDate.create({
      data: {
        userId: alex.id,
        connectionId: connection.id,
        title: 'Our anniversary',
        date: nextMonth,
        isRecurringYearly: true,
      },
    });
  }

  console.log('Seed complete.');
  console.log('Demo accounts:');
  console.log('  demo.alex@example.com / Demo1234!  (username: demo_alex)');
  console.log('  demo.sam@example.com  / Demo1234!  (username: demo_sam)');
  console.log('  admin@example.com     / Admin1234! (admin role)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
