import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; unavailableId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, unavailableId: unavailableIdParam } = await params
    const userId = parseInt(id)
    const unavailableId = parseInt(unavailableIdParam)
    
    // Users can only delete their own unavailable days
    if (userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if the unavailable day exists and belongs to the user
    const unavailableDay = await prisma.unavailableDay.findFirst({
      where: {
        id: unavailableId,
        userId,
      },
    })

    if (!unavailableDay) {
      return NextResponse.json(
        { error: "Unavailable period not found" },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.unavailableDay.update({
      where: { id: unavailableId },
      data: { isActive: false },
    })

    return NextResponse.json({
      message: "Unavailable period removed successfully",
    })
  } catch (error) {
    console.error("Delete unavailable day error:", error)
    return NextResponse.json(
      { error: "Failed to remove unavailable period" },
      { status: 500 }
    )
  }
}