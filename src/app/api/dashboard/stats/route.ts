import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch statistics in parallel
    const [
      totalDuties,
      completedDuties,
      lastMonthDuties,
      lastMonthCompleted,
      pendingSwaps,
      totalTeamMembers
    ] = await Promise.all([
      // Current user's total duties for this month
      prisma.duty.count({
        where: {
          userId: userId,
          dutyDate: {
            gte: startOfMonth
          }
        }
      }),
      // Current user's completed duties (past dates)
      prisma.duty.count({
        where: {
          userId: userId,
          dutyDate: {
            gte: startOfMonth,
            lt: now
          }
        }
      }),
      // Last month's duties for comparison
      prisma.duty.count({
        where: {
          userId: userId,
          dutyDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      // Last month's completed duties
      prisma.duty.count({
        where: {
          userId: userId,
          dutyDate: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          }
        }
      }),
      // Pending swap requests involving this user
      prisma.dutySwap.count({
        where: {
          OR: [
            { requesterId: userId },
            { requestedWithId: userId }
          ],
          status: "pending"
        }
      }),
      // Total active team members
      prisma.user.count({
        where: {
          role: {
            in: ["admin", "member"]
          }
        }
      })
    ])

    // Calculate changes from last month
    const dutiesChange = totalDuties - lastMonthDuties
    const completionRate = totalDuties > 0 ? Math.round((completedDuties / totalDuties) * 100) : 0
    const lastMonthCompletionRate = lastMonthDuties > 0 ? Math.round((lastMonthCompleted / lastMonthDuties) * 100) : 0

    return NextResponse.json({
      totalDuties,
      completedDuties,
      completionRate,
      dutiesChange,
      pendingSwaps,
      totalTeamMembers,
      stats: {
        totalDutiesText: dutiesChange >= 0 ? `+${dutiesChange} from last month` : `${dutiesChange} from last month`,
        completionText: `${completionRate}% completion rate`,
        swapsText: "Awaiting approval",
        teamText: "Active staff"
      }
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}