"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isWeekend, 
  addWeeks, 
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isToday
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { SwapRequestDialog } from "./swap-request-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null)
  const [showSwapDialog, setShowSwapDialog] = useState(false)

  // Memoize expensive calculations
  const { monthStart, weekStart, days } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ 
      start: weekStart, 
      end: new Date(weekStart.getTime() + 27 * 24 * 60 * 60 * 1000) 
    })
    return { monthStart, weekStart, days }
  }, [currentDate])

  const { data: duties, isLoading } = useQuery({
    queryKey: ["duties", weekStart, days[days.length - 1]],
    queryFn: async () => {
      const response = await fetch(
        `/api/duties?startDate=${weekStart.toISOString()}&endDate=${days[days.length - 1].toISOString()}`
      )
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json() as Promise<Duty[]>
    },
  })

  // Memoize duties by date for better performance
  const dutiesByDate = useMemo(() => {
    if (!duties) return new Map()
    
    const map = new Map<string, Duty[]>()
    duties.forEach(duty => {
      const dateStr = format(new Date(duty.dutyDate), "yyyy-MM-dd")
      if (!map.has(dateStr)) {
        map.set(dateStr, [])
      }
      map.get(dateStr)!.push(duty)
    })
    return map
  }, [duties])

  const getDutiesForDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return dutiesByDate.get(dateStr) || []
  }, [dutiesByDate])

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }, [currentDate])

  const getShiftTimes = useCallback((date: Date) => {
    if (isWeekend(date)) {
      return "24h"
    }
    return "6pm-8am"
  }, [])

  const handleDutyClick = useCallback((duty: Duty) => {
    setSelectedDuty(duty)
    setShowSwapDialog(true)
  }, [])

  // Memoize day headers
  const dayHeaders = useMemo(() => 
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []
  )

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayHeaders.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const dayDuties = getDutiesForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  border rounded-lg p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] relative
                  transition-all duration-150 hover:scale-[1.005]
                  ${isTodayDate ? "border-primary bg-primary/5" : ""}
                  ${!isCurrentMonth ? "opacity-30 bg-muted/10 text-muted-foreground" : ""}
                  ${isCurrentMonth && isWeekend(day) ? "bg-muted/20" : ""}
                  ${!isCurrentMonth ? "hover:opacity-40" : ""}
                `}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isTodayDate ? "text-primary" : 
                    !isCurrentMonth ? "text-muted-foreground/60" : ""
                  }`}>
                    {format(day, "d")}
                  </span>
                  <span className={`text-xs ${
                    !isCurrentMonth ? "text-muted-foreground/40" : "text-muted-foreground"
                  }`}>
                    {getShiftTimes(day)}
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex justify-center">
                    <div className="animate-pulse bg-muted rounded-full w-8 h-8" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {dayDuties.length > 0 ? (
                      dayDuties.map((duty: Duty) => (
                        <Tooltip key={duty.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDutyClick(duty)}
                              className="transition-transform duration-150 hover:scale-105 active:scale-95"
                            >
                              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                                <AvatarImage 
                                  src={`https://avatar.vercel.sh/${duty.user.email}`} 
                                  alt={duty.user.fullName}
                                />
                                <AvatarFallback className="text-[10px] sm:text-xs">
                                  {duty.user.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{duty.user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{duty.user.email}</p>
                              <p className="text-xs">Click to request swap</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic w-full text-center">
                        Unassigned
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Swap Dialog */}
        {selectedDuty && (
          <SwapRequestDialog
            open={showSwapDialog}
            onOpenChange={setShowSwapDialog}
            duty={selectedDuty}
          />
        )}
      </div>
    </TooltipProvider>
  )
}