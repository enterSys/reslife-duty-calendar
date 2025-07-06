import { PrismaClient } from "@prisma/client"
import { neon } from "@neondatabase/serverless"

const prisma = new PrismaClient()
const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log("Starting data migration...")

  try {
    // Check if data already exists
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log("Data already exists, skipping migration")
      return
    }

    // Get existing data from old tables
    const users = await sql`SELECT * FROM users`
    const duties = await sql`SELECT * FROM duties`
    const swaps = await sql`SELECT * FROM duty_swaps`
    const subscriptions = await sql`SELECT * FROM calendar_subscriptions`

    // Migrate users
    console.log(`Migrating ${users.length} users...`)
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash: user.password_hash,
          fullName: user.full_name,
          role: user.role,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
      })
    }

    // Reset sequence
    await sql`ALTER SEQUENCE users_id_seq RESTART WITH ${users.length + 1}`

    // Migrate duties
    console.log(`Migrating ${duties.length} duties...`)
    for (const duty of duties) {
      await prisma.duty.create({
        data: {
          id: duty.id,
          userId: duty.user_id,
          dutyDate: new Date(duty.duty_date),
          dutyType: duty.duty_type,
          notes: duty.notes,
          createdAt: new Date(duty.created_at),
          updatedAt: new Date(duty.updated_at),
        },
      })
    }

    // Reset sequence
    await sql`ALTER SEQUENCE duties_id_seq RESTART WITH ${duties.length + 1}`

    // Migrate duty swaps
    console.log(`Migrating ${swaps.length} duty swaps...`)
    for (const swap of swaps) {
      await prisma.dutySwap.create({
        data: {
          id: swap.id,
          requesterId: swap.requester_id,
          requestedWithId: swap.requested_with_id,
          requesterDutyId: swap.requester_duty_id,
          requestedDutyId: swap.requested_duty_id,
          status: swap.status,
          reason: swap.reason,
          requesterApproved: swap.requester_approved,
          requestedApproved: swap.requested_approved,
          createdAt: new Date(swap.created_at),
          updatedAt: new Date(swap.updated_at),
        },
      })
    }

    // Reset sequence
    await sql`ALTER SEQUENCE duty_swaps_id_seq RESTART WITH ${swaps.length + 1}`

    // Migrate calendar subscriptions
    console.log(`Migrating ${subscriptions.length} calendar subscriptions...`)
    for (const sub of subscriptions) {
      await prisma.calendarSubscription.create({
        data: {
          id: sub.id,
          userId: sub.user_id,
          token: sub.token,
          name: sub.name,
          includeAllDuties: sub.include_all_duties,
          createdAt: new Date(sub.created_at),
          lastAccessed: sub.last_accessed ? new Date(sub.last_accessed) : null,
        },
      })
    }

    // Reset sequence
    await sql`ALTER SEQUENCE calendar_subscriptions_id_seq RESTART WITH ${subscriptions.length + 1}`

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })