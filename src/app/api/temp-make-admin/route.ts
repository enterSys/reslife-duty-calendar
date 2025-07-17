import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // This is a temporary endpoint for testing only
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 })
    }

    // Update member@example.com to admin role
    const admin = await prisma.user.update({
      where: { email: "member@example.com" },
      data: { role: "admin" }
    })

    return NextResponse.json({ 
      message: "User updated to admin",
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Failed to update user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}