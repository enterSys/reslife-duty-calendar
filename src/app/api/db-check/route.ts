import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const envCheck = {
    DATABASE_URL: !!process.env?.DATABASE_URL,
    POSTGRES_URL_NON_POOLING: !!process.env?.POSTGRES_URL_NON_POOLING,
    NEXTAUTH_SECRET: !!process.env?.NEXTAUTH_SECRET,
    AUTH_SECRET: !!process.env?.AUTH_SECRET,
    NODE_ENV: process.env?.NODE_ENV,
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Test a simple query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        environment: envCheck,
        error: process.env?.NODE_ENV === "development" ? String(error) : "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}