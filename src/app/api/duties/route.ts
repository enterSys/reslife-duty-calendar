import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDutySchema = z.object({
  dutyDate: z.string().transform((str) => new Date(str)),
  dutyType: z.string(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: any = {}
  
  if (userId) {
    where.userId = parseInt(userId)
  }
  
  if (startDate && endDate) {
    where.dutyDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const duties = await prisma.duty.findMany({
    where,
    include: {
      user: true,
    },
    orderBy: {
      dutyDate: "asc",
    },
  })

  return NextResponse.json(duties)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dutyDate, dutyType, notes } = createDutySchema.parse(body)

    const duty = await prisma.duty.create({
      data: {
        userId: parseInt(session.user.id),
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