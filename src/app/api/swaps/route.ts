import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSwapSchema = z.object({
  requestedDutyId: z.number(),
  requesterDutyId: z.number(),
  reason: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || session.user.id

    // Get swaps where user is either requester or requested
    const swaps = await prisma.dutySwap.findMany({
      where: {
        OR: [
          { requesterId: parseInt(userId) },
          { requestedWithId: parseInt(userId) },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        requestedWith: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        requesterDuty: {
          include: {
            user: true,
          },
        },
        requestedDuty: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(swaps)
  } catch (error) {
    console.error("Error fetching swaps:", error)
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
    const { requestedDutyId, requesterDutyId, reason } = createSwapSchema.parse(body)

    // Get both duties to find the users involved
    const [requesterDuty, requestedDuty] = await Promise.all([
      prisma.duty.findUnique({ where: { id: requesterDutyId } }),
      prisma.duty.findUnique({ where: { id: requestedDutyId } }),
    ])

    if (!requesterDuty || !requestedDuty) {
      return NextResponse.json(
        { error: "One or both duties not found" },
        { status: 404 }
      )
    }

    // Verify the requester owns the duty they're offering
    if (requesterDuty.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "You can only offer your own duties for swap" },
        { status: 403 }
      )
    }

    // Create the swap request
    const swap = await prisma.dutySwap.create({
      data: {
        requesterId: parseInt(session.user.id),
        requestedWithId: requestedDuty.userId,
        requesterDutyId,
        requestedDutyId,
        reason,
        status: "pending",
      },
      include: {
        requester: true,
        requestedWith: true,
        requesterDuty: true,
        requestedDuty: true,
      },
    })

    return NextResponse.json(swap)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating swap:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}