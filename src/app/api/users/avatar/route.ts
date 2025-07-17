import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `${session.user.id}-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user profile in database
    const imageUrl = `/uploads/avatars/${filename}`
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { profileImage: imageUrl },
    })

    return NextResponse.json({ 
      imageUrl,
      message: "Profile picture updated successfully" 
    })

  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove profile image from database
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { profileImage: null },
    })

    return NextResponse.json({ 
      message: "Profile picture removed successfully" 
    })

  } catch (error) {
    console.error("Avatar removal error:", error)
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    )
  }
}