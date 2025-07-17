import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createUnavailableSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  reason: z.string().optional(),
  recurring: z.boolean().default(false),
  dayOfWeek: z.number().min(0).max(6).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)
    
    // Users can only access their own unavailable days
    if (userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const unavailableDays = await prisma.unavailableDay.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { startDate: "asc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(unavailableDays)
  } catch (error) {
    console.error("Get unavailable days error:", error)
    return NextResponse.json(
      { error: "Failed to fetch unavailable days" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)
    
    // Users can only create unavailable days for themselves
    if (userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = createUnavailableSchema.parse(body)

    // Parse dates and ensure they are in UTC date format (YYYY-MM-DD)
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    
    // Set to midnight UTC to avoid timezone issues with date-only fields
    startDate.setUTCHours(0, 0, 0, 0)
    endDate.setUTCHours(0, 0, 0, 0)

    // Validate dates
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    // Check for overlapping periods (optional: you might want to allow overlaps)
    const overlapping = await prisma.unavailableDay.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: "This period overlaps with an existing unavailable period" },
        { status: 400 }
      )
    }

    const unavailableDay = await prisma.unavailableDay.create({
      data: {
        userId,
        startDate,
        endDate,
        reason: validatedData.reason,
        recurring: validatedData.recurring,
        dayOfWeek: validatedData.dayOfWeek,
      },
    })

    return NextResponse.json({
      message: "Unavailable period created successfully",
      unavailableDay,
    })
  } catch (error) {
    console.error("Create unavailable day error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create unavailable period" },
      { status: 500 }
    )
  }
}