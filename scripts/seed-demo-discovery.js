const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const currentUserId = 'cmn9su1kk0002btgl3g3on50w'

async function ensureUser(data) {
  const user = await prisma.user.upsert({
    where: { username: data.username },
    update: {
      displayName: data.displayName,
      personalCode: data.personalCode,
      status: 'active',
      onboardingStep: 'completed',
      emailVerified: true,
    },
    create: {
      username: data.username,
      displayName: data.displayName,
      personalCode: data.personalCode,
      status: 'active',
      onboardingStep: 'completed',
      emailVerified: true,
    },
    select: { id: true, username: true },
  })

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      age: data.age,
      city: data.city,
      state: data.state,
      country: data.country,
      location: data.location,
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      bio: data.bio,
      interests: data.interests,
      lookingFor: data.lookingFor,
      avatarUrl: data.avatarUrl,
      photoUrls: data.avatarUrl ? [data.avatarUrl] : [],
      isPublic: true,
    },
    create: {
      userId: user.id,
      age: data.age,
      city: data.city,
      state: data.state,
      country: data.country,
      location: data.location,
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      bio: data.bio,
      interests: data.interests,
      lookingFor: data.lookingFor,
      avatarUrl: data.avatarUrl,
      photoUrls: data.avatarUrl ? [data.avatarUrl] : [],
      isPublic: true,
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  })

  return user
}

async function ensureFriendship(requesterId, recipientId, status) {
  return prisma.friendship.upsert({
    where: {
      requesterId_recipientId: {
        requesterId,
        recipientId,
      },
    },
    update: { status },
    create: { requesterId, recipientId, status },
  })
}

async function ensureMessage(senderId, recipientId, body) {
  const existing = await prisma.message.findFirst({
    where: { senderId, recipientId, body },
    select: { id: true },
  })

  if (!existing) {
    await prisma.message.create({
      data: {
        senderId,
        recipientId,
        kind: 'text',
        body,
      },
    })
  }
}

async function main() {
  const raven = await ensureUser({
    username: 'ravenluxe',
    displayName: 'Raven Luxe',
    personalCode: 'RAVENLUX',
    city: 'Harbor District',
    state: 'BC',
    country: 'Canada',
    location: 'Harbor District',
    age: 29,
    gender: 'Female',
    sexualOrientation: 'Bisexual',
    bio: 'Late nights, direct chemistry, and a soft spot for smart banter.',
    interests: ['Open-minded', 'Roleplay'],
    lookingFor: ['Dating', 'Friends'],
    avatarUrl: '',
  })

  const milo = await ensureUser({
    username: 'milonoir',
    displayName: 'Milo Noir',
    personalCode: 'MILONOIR',
    city: 'Old Town',
    state: 'BC',
    country: 'Canada',
    location: 'Old Town',
    age: 34,
    gender: 'Male',
    sexualOrientation: 'Gay',
    bio: 'Designer, flirt, and always down for a strong drink with stronger eye contact.',
    interests: ['Adventurous', 'Sensual'],
    lookingFor: ['Chat only', 'Long-term connection'],
    avatarUrl: '',
  })

  const sienna = await ensureUser({
    username: 'siennavale',
    displayName: 'Sienna Vale',
    personalCode: 'SIENNAVL',
    city: 'Riverfront',
    state: 'BC',
    country: 'Canada',
    location: 'Riverfront',
    age: 27,
    gender: 'Female',
    sexualOrientation: 'Queer',
    bio: 'Creative energy, honest conversation, and zero patience for small talk.',
    interests: ['Aftercare-focused', 'Voyeur'],
    lookingFor: ['Kink exploration', 'Open to anything'],
    avatarUrl: '',
  })

  await ensureFriendship(raven.id, currentUserId, 'pending')
  await ensureFriendship(currentUserId, milo.id, 'pending')

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: currentUserId, recipientId: sienna.id },
        { requesterId: sienna.id, recipientId: currentUserId },
      ],
    },
  })

  await ensureMessage(milo.id, currentUserId, 'You still up? I can host near Old Town.')
  await ensureMessage(currentUserId, milo.id, 'Maybe. Send me the details.')

  console.log(JSON.stringify({
    currentUserId,
    seededUsers: ['ravenluxe', 'milonoir', 'siennavale'],
    incomingPendingFrom: 'ravenluxe',
    outgoingPendingTo: 'milonoir',
    openSearchProfile: 'siennavale',
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
