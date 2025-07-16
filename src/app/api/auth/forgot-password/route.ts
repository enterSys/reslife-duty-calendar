import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { randomBytes } from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        message: "If an account with that email exists, we've sent a reset link." 
      })
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetTokenExpiry,
      },
    })

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    console.log(`Password reset link for ${email}: ${resetUrl}`)

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ 
      message: "If an account with that email exists, we've sent a reset link.",
      // For development only - remove in production
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}