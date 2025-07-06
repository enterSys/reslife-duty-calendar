"use client"

import { useState } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, addWeeks, subWeeks } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { DutyCard } from "./duty-card"

type ViewMode = "week" | "month"

interface Duty {
  id: number
  dutyDate: string
  dutyType: string
  user: {
    id: number
    fullName: string
    email: string
  }
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("week")

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: duties, isLoading } = useQuery({
    queryKey: ["duties", weekStart, weekEnd],
    queryFn: async () => {
      const response = await fetch(
        `/api/duties?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      )
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json() as Promise<Duty[]>
    },
  })

  const getDutiesForDate = (date: Date) => {
    if (!duties) return []
    const dateStr = format(date, "yyyy-MM-dd")
    return duties.filter(duty => 
      format(new Date(duty.dutyDate), "yyyy-MM-dd") === dateStr
    )
  }

  const navigateWeek = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const getShiftTimes = (date: Date) => {
    if (isWeekend(date)) {
      return "11:00 AM - 11:00 AM (24 hours)"
    }
    return "6:00 PM - 8:00 AM"
  }

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const dayDuties = getDutiesForDate(day)
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
          
          return (
            <div
              key={day.toISOString()}
              className={`border rounded-lg p-4 min-h-[200px] ${
                isToday ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-2xl">
                      {format(day, "d")}
                    </div>
                  </div>
                  {isWeekend(day) && (
                    <Badge variant="secondary">Weekend</Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {getShiftTimes(day)}
                </div>

                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {dayDuties.length > 0 ? (
                      dayDuties.map((duty) => (
                        <DutyCard key={duty.id} duty={duty} />
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No duties assigned
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}