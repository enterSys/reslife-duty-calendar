"use client"

import { useState } from "react"
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

  // Get the first day of the month and create a 4-week view
  const monthStart = startOfMonth(currentDate)
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  // Get 4 weeks (28 days) from the start
  const days = eachDayOfInterval({ 
    start: weekStart, 
    end: new Date(weekStart.getTime() + 27 * 24 * 60 * 60 * 1000) 
  })

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

  const getDutiesForDate = (date: Date) => {
    if (!duties) return []
    const dateStr = format(date, "yyyy-MM-dd")
    return duties.filter(duty => 
      format(new Date(duty.dutyDate), "yyyy-MM-dd") === dateStr
    )
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const getShiftTimes = (date: Date) => {
    if (isWeekend(date)) {
      return "24h"
    }
    return "6pm-8am"
  }

  const handleDutyClick = (duty: Duty) => {
    setSelectedDuty(duty)
    setShowSwapDialog(true)
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Navigation Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.h2 
              className="text-xl font-semibold"
              key={format(currentDate, "MMMM yyyy")}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {format(currentDate, "MMMM yyyy")}
            </motion.h2>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </motion.div>
        </motion.div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <motion.div 
          className="grid grid-cols-7 gap-1 sm:gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {days.map((day, index) => {
            const dayDuties = getDutiesForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)
            
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className={`
                  border rounded-lg p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] relative
                  transition-all duration-200
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
                      dayDuties.map((duty) => (
                        <Tooltip key={duty.id}>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => handleDutyClick(duty)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                                <AvatarImage 
                                  src={`https://avatar.vercel.sh/${duty.user.email}`} 
                                  alt={duty.user.fullName}
                                />
                                <AvatarFallback className="text-[10px] sm:text-xs">
                                  {duty.user.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.button>
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
              </motion.div>
            )
          })}
        </motion.div>

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