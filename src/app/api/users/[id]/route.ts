import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
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
    const userId = parseInt(id)
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Check if the current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    })

    if (currentUser?.role !== "admin" && parseInt(session.user.id) !== userId) {
      return NextResponse.json(
        { error: "Only admins can update other users" },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating user:", error)
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
    const { id } = await params
    const userId = parseInt(id)

    // Check if the current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    })

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete users" },
        { status: 403 }
      )
    }

    // Prevent admin from deleting themselves
    if (parseInt(session.user.id) === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user has any duties assigned
    const userDuties = await prisma.duty.findMany({
      where: { userId },
    })

    if (userDuties.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with assigned duties. Please reassign duties first." },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}