#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_Z5nBMrcOThU9@ep-winter-thunder-adujnkhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function createSampleData() {
  try {
    // First, let's see what users exist
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, isAdmin: true }
    })
    
    console.log('Existing users:', users)
    
    if (users.length === 0) {
      console.log('No users found. Creating sample users first...')
      
      // Create sample users
      const sampleUsers = [
        { fullName: 'Mahzeyar Maroufi', email: 'mahzeyarmaroufi@gmail.com', isAdmin: true, building: 'Main' },
        { fullName: 'Test Admin', email: 'testadmin@reslife.com', isAdmin: true, building: 'Main' },
        { fullName: 'Alice Johnson', email: 'alice@reslife.com', isAdmin: false, building: 'North' },
        { fullName: 'Bob Smith', email: 'bob@reslife.com', isAdmin: false, building: 'South' },
        { fullName: 'Carol Davis', email: 'carol@reslife.com', isAdmin: false, building: 'East' },
        { fullName: 'David Wilson', email: 'david@reslife.com', isAdmin: false, building: 'West' },
        { fullName: 'Emma Brown', email: 'emma@reslife.com', isAdmin: false, building: 'Main' },
        { fullName: 'Frank Miller', email: 'frank@reslife.com', isAdmin: false, building: 'North' }
      ]
      
      for (const userData of sampleUsers) {
        await prisma.user.create({
          data: {
            ...userData,
            passwordHash: '$2b$10$K7L/VxwRnRq0xqY8.QK5XOoqKZOGQHHdQ1mI7eQ9l.jH8J9L.xQq6' // 'password123'
          }
        })
      }
      
      console.log('Sample users created!')
    }
    
    // Get all users for duty assignment
    const allUsers = await prisma.user.findMany()
    
    // Clear existing duties to start fresh
    await prisma.duty.deleteMany({})
    console.log('Cleared existing duties')
    
    // Create duties for the next 60 days
    const startDate = new Date()
    const duties = []
    
    for (let i = 0; i < 60; i++) {
      const dutyDate = new Date(startDate)
      dutyDate.setDate(startDate.getDate() + i)
      
      // Skip if no users available
      if (allUsers.length === 0) continue
      
      // Determine duty type based on day of week
      const dayOfWeek = dutyDate.getDay() // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const dutyType = isWeekend ? 'weekend' : 'weekday'
      
      // Assign user (rotate through available users)
      const assignedUser = allUsers[i % allUsers.length]
      
      duties.push({
        userId: assignedUser.id,
        dutyDate: dutyDate,
        dutyType: dutyType,
        notes: isWeekend ? '24-hour weekend duty' : 'Evening weekday duty'
      })
    }
    
    // Create duties in batches
    const batchSize = 10
    for (let i = 0; i < duties.length; i += batchSize) {
      const batch = duties.slice(i, i + batchSize)
      await prisma.duty.createMany({
        data: batch
      })
    }
    
    console.log(`Created ${duties.length} sample duties`)
    
    // Create some sample swap requests
    const recentDuties = await prisma.duty.findMany({
      where: {
        dutyDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      take: 6,
      orderBy: { dutyDate: 'asc' }
    })
    
    if (recentDuties.length >= 4) {
      // Create a pending swap request
      await prisma.dutySwap.create({
        data: {
          requesterId: recentDuties[0].userId,
          requestedWithId: recentDuties[1].userId,
          requesterDutyId: recentDuties[0].id,
          requestedDutyId: recentDuties[1].id,
          reason: 'Have a family event that day',
          status: 'pending'
        }
      })
      
      // Create an accepted swap request
      await prisma.dutySwap.create({
        data: {
          requesterId: recentDuties[2].userId,
          requestedWithId: recentDuties[3].userId,
          requesterDutyId: recentDuties[2].id,
          requestedDutyId: recentDuties[3].id,
          reason: 'Schedule conflict with work',
          status: 'accepted',
          requestedApproved: true
        }
      })
      
      console.log('Created sample swap requests')
    }
    
    // Display summary
    const totalUsers = await prisma.user.count()
    const totalDuties = await prisma.duty.count()
    const totalSwaps = await prisma.dutySwap.count()
    
    console.log('\n=== Sample Data Created Successfully ===')
    console.log(`Users: ${totalUsers}`)
    console.log(`Duties: ${totalDuties}`)
    console.log(`Swap Requests: ${totalSwaps}`)
    console.log('\nLogin credentials for testing:')
    console.log('Admin: mahzeyarmaroufi@gmail.com / password123')
    console.log('Admin: testadmin@reslife.com / password123')
    console.log('User: alice@reslife.com / password123')
    
  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()