const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function examineDatabase() {
  try {
    console.log('🔍 Examining database structure and existing data...\n');
    
    // Check existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        allocatedBuilding: true,
        createdAt: true
      }
    });
    
    console.log('📊 Existing Users:');
    console.table(users);
    
    // Check existing duties
    const duties = await prisma.duty.findMany({
      select: {
        id: true,
        userId: true,
        dutyDate: true,
        dutyType: true,
        notes: true,
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        dutyDate: 'asc'
      }
    });
    
    console.log('\n📅 Existing Duties:');
    console.table(duties.map(d => ({
      id: d.id,
      date: d.dutyDate.toISOString().split('T')[0],
      type: d.dutyType,
      user: d.user.fullName,
      notes: d.notes || 'None'
    })));
    
    // Check database connection
    console.log('\n✅ Database connection successful');
    console.log(`📊 Total users: ${users.length}`);
    console.log(`📅 Total duties: ${duties.length}`);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

examineDatabase();