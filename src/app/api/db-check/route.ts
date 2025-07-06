import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check if tables exist by trying to count records
    const checks = {
      users: false,
      duties: false,
      dutySwaps: false,
      passwordResets: false,
      calendarSubscriptions: false,
    }

    try {
      await prisma.user.count()
      checks.users = true
    } catch (e) {
      console.error("Users table error:", e)
    }

    try {
      await prisma.duty.count()
      checks.duties = true
    } catch (e) {
      console.error("Duties table error:", e)
    }

    try {
      await prisma.dutySwap.count()
      checks.dutySwaps = true
    } catch (e) {
      console.error("DutySwaps table error:", e)
    }

    try {
      await prisma.passwordReset.count()
      checks.passwordResets = true
    } catch (e) {
      console.error("PasswordResets table error:", e)
    }

    try {
      await prisma.calendarSubscription.count()
      checks.calendarSubscriptions = true
    } catch (e) {
      console.error("CalendarSubscriptions table error:", e)
    }

    return NextResponse.json({
      status: "success",
      tables: checks,
      allTablesExist: Object.values(checks).every(v => v === true),
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: String(error),
      },
      { status: 500 }
    )
  }
}