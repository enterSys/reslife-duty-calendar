import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: process.env.NODE_ENV === "development" ? String(error) : "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}