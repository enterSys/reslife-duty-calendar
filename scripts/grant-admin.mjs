import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://neondb_owner:npg_Z5nBMrcOThU9@ep-winter-thunder-adujnkhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function grantAdmin(email) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      console.error(`User with email ${email} not found`)
      return
    }

    // Update user role to admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    })

    console.log(`Successfully granted admin access to ${email}`)
    console.log('Updated user:', {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    })
  } catch (error) {
    console.error('Error granting admin access:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  console.log('Usage: node scripts/grant-admin.mjs <email>')
  process.exit(1)
}

grantAdmin(email)