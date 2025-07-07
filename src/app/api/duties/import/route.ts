import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { parse, format, isWeekend } from "date-fns"

const importDutiesSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      memberName: z.string(),
    })
  ),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
  })

  if (user?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can import duties" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { data } = importDutiesSchema.parse(body)

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as any[],
    }

    // Process each duty entry
    for (const entry of data) {
      try {
        // Parse the date (expecting DD/MM/YYYY format from the client)
        let dutyDate: Date
        try {
          // Try DD/MM/YYYY format first (which is what our client sends)
          dutyDate = parse(entry.date, "dd/MM/yyyy", new Date())
          
          if (isNaN(dutyDate.getTime())) {
            // Fallback to other common formats
            const formats = ["d/M/yyyy", "dd/MM/yy", "d/M/yy"]
            let parsed = false
            
            for (const formatString of formats) {
              try {
                dutyDate = parse(entry.date, formatString, new Date())
                if (!isNaN(dutyDate.getTime())) {
                  parsed = true
                  break
                }
              } catch {
                continue
              }
            }
            
            if (!parsed) {
              throw new Error("Invalid date format")
            }
          }
        } catch (error) {
          results.errors.push({
            date: entry.date,
            member: entry.memberName,
            error: "Invalid date format - expected DD/MM/YYYY",
          })
          results.skipped++
          continue
        }

        // Find user by name (case insensitive)
        const user = await prisma.user.findFirst({
          where: {
            fullName: {
              equals: entry.memberName.trim(),
              mode: "insensitive",
            },
          },
        })

        if (!user) {
          results.errors.push({
            date: entry.date,
            member: entry.memberName,
            error: "User not found",
          })
          results.skipped++
          continue
        }

        // Check if duty already exists for this date and user
        const existingDuty = await prisma.duty.findFirst({
          where: {
            userId: user.id,
            dutyDate: {
              gte: new Date(format(dutyDate, "yyyy-MM-dd")),
              lt: new Date(format(new Date(dutyDate.getTime() + 86400000), "yyyy-MM-dd")),
            },
          },
        })

        if (existingDuty) {
          results.skipped++
          continue
        }

        // Determine duty type based on day of week
        const dutyType = isWeekend(dutyDate) ? "weekend" : "weekday"

        // Create the duty
        await prisma.duty.create({
          data: {
            userId: user.id,
            dutyDate,
            dutyType,
            notes: "Imported from Google Sheets",
          },
        })

        results.imported++
      } catch (error) {
        results.errors.push({
          date: entry.date,
          member: entry.memberName,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        results.skipped++
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input format", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error importing duties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}