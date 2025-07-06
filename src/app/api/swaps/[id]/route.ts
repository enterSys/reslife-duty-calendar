import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSwapSchema = z.object({
  status: z.enum(["accepted", "rejected", "cancelled"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const swapId = parseInt(id)
    const body = await request.json()
    const { status } = updateSwapSchema.parse(body)

    // Get the swap request
    const swap = await prisma.dutySwap.findUnique({
      where: { id: swapId },
      include: {
        requesterDuty: true,
        requestedDuty: true,
      },
    })

    if (!swap) {
      return NextResponse.json(
        { error: "Swap request not found" },
        { status: 404 }
      )
    }

    const userId = parseInt(session.user.id)

    // Check permissions
    if (status === "cancelled" && swap.requesterId !== userId) {
      return NextResponse.json(
        { error: "Only the requester can cancel a swap request" },
        { status: 403 }
      )
    }

    if ((status === "accepted" || status === "rejected") && swap.requestedWithId !== userId) {
      return NextResponse.json(
        { error: "Only the requested user can accept or reject a swap" },
        { status: 403 }
      )
    }

    // Update the swap status
    const updatedSwap = await prisma.dutySwap.update({
      where: { id: swapId },
      data: {
        status,
        requestedApproved: status === "accepted",
      },
    })

    // If accepted, swap the duties
    if (status === "accepted") {
      await prisma.$transaction([
        // Update requester's duty to have the requested user
        prisma.duty.update({
          where: { id: swap.requesterDutyId },
          data: { userId: swap.requestedWithId },
        }),
        // Update requested user's duty to have the requester
        prisma.duty.update({
          where: { id: swap.requestedDutyId },
          data: { userId: swap.requesterId },
        }),
      ])
    }

    return NextResponse.json(updatedSwap)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating swap:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}