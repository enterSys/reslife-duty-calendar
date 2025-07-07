import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This is a temporary endpoint to grant admin access
// In production, this should be properly secured
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update user role to admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    })

    return NextResponse.json({
      message: `Successfully granted admin access to ${email}`,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error granting admin access:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}