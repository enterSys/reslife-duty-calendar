import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDutySchema = z.object({
  dutyDate: z.string().transform((str) => new Date(str)),
  dutyType: z.string(),
  notes: z.string().optional(),
  userId: z.number().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    const where: any = {}
    
    if (userId) {
      where.userId = parseInt(userId)
    }
    
    if (startDate || endDate) {
      where.dutyDate = {}
      if (startDate) {
        where.dutyDate.gte = new Date(startDate)
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate)
        endDateTime.setDate(endDateTime.getDate() + 1)
        where.dutyDate.lt = endDateTime
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.duty.count({ where })
    const totalPages = Math.ceil(totalCount / limit)

    const duties = await prisma.duty.findMany({
      where,
      select: {
        id: true,
        dutyDate: true,
        dutyType: true,
        notes: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        dutyDate: sortOrder === "asc" ? "asc" : "desc",
      },
      skip: offset,
      take: limit,
    })

    // Add duty type based on day of week
    const dutiesWithType = duties.map(duty => ({
      ...duty,
      dutyType: duty.dutyType || (new Date(duty.dutyDate).getDay() === 0 || new Date(duty.dutyDate).getDay() === 6 ? "weekend" : "weekday"),
    }))

    return NextResponse.json({
      duties: dutiesWithType,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    })
  } catch (error) {
    console.error("Error fetching duties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dutyDate, dutyType, notes, userId } = createDutySchema.parse(body)

    const duty = await prisma.duty.create({
      data: {
        userId: userId || parseInt(session.user.id),
        dutyDate,
        dutyType,
        notes,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(duty)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating duty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}