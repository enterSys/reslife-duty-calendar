import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDutySchema = z.object({
  dutyDate: z.string().transform((str) => new Date(str)).optional(),
  dutyType: z.string().optional(),
  notes: z.string().optional(),
  userId: z.number().optional(),
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
    const resolvedParams = await params
    const dutyId = parseInt(resolvedParams.id)
    const body = await request.json()
    const updateData = updateDutySchema.parse(body)

    // Check if duty exists
    const existingDuty = await prisma.duty.findUnique({
      where: { id: dutyId },
    })

    if (!existingDuty) {
      return NextResponse.json({ error: "Duty not found" }, { status: 404 })
    }

    // Update the duty
    const updatedDuty = await prisma.duty.update({
      where: { id: dutyId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedDuty)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating duty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const dutyId = parseInt(resolvedParams.id)

    // Check if duty exists
    const existingDuty = await prisma.duty.findUnique({
      where: { id: dutyId },
    })

    if (!existingDuty) {
      return NextResponse.json({ error: "Duty not found" }, { status: 404 })
    }

    // Delete the duty
    await prisma.duty.delete({
      where: { id: dutyId },
    })

    return NextResponse.json({ message: "Duty deleted successfully" })
  } catch (error) {
    console.error("Error deleting duty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}