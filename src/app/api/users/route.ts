import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcrypt"

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(["user", "admin"]).default("user"),
  password: z.string().min(6),
  allocatedBuilding: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        allocatedBuilding: true,
        createdAt: true,
        _count: {
          select: {
            duties: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
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
    // Check if the current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    })

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create users" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        passwordHash: hashedPassword,
        allocatedBuilding: data.allocatedBuilding,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        allocatedBuilding: true,
        createdAt: true,
        _count: {
          select: {
            duties: true,
          },
        },
      },
    })

    return NextResponse.json(newUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}