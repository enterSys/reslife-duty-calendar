"use client"

import { useQuery } from "@tanstack/react-query"
import { useRealTimeDuties } from "@/hooks/useRealTimeDuties"
import { format, isFuture, isPast, isToday, differenceInDays } from "date-fns"
import { Calendar, Clock, AlertCircle, CheckCircle2, Wifi, WifiOff, Filter, SortAsc, SortDesc, ArrowLeftRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MyDutiesProps {
  userId: string
}

export function MyDuties({ userId }: MyDutiesProps) {
  // Initialize real-time updates
  const { isConnected, connectionError } = useRealTimeDuties()
  
  // State for filters and sorting
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showPastDuties, setShowPastDuties] = useState(false)
  const [viewMode, setViewMode] = useState<"upcoming" | "past" | "all">("upcoming")
  
  const { data: duties, isLoading } = useQuery({
    queryKey: ["my-duties", userId],
    queryFn: async () => {
      const response = await fetch(`/api/duties?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  const allDuties = duties?.duties || []
  const upcomingDuties = allDuties.filter((duty: any) => 
    isFuture(new Date(duty.dutyDate))
  ).sort((a: any, b: any) => {
    const dateA = new Date(a.dutyDate)
    const dateB = new Date(b.dutyDate)
    return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
  })
  
  const pastDuties = allDuties.filter((duty: any) => 
    isPast(new Date(duty.dutyDate))
  ).sort((a: any, b: any) => {
    const dateA = new Date(a.dutyDate)
    const dateB = new Date(b.dutyDate)
    return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
  })

  const todayDuties = allDuties.filter((duty: any) => 
    isToday(new Date(duty.dutyDate))
  )

  const getDutyStatus = (duty: any) => {
    const dutyDate = new Date(duty.dutyDate)
    if (isToday(dutyDate)) return { status: "today", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" }
    if (isFuture(dutyDate)) {
      const daysUntil = differenceInDays(dutyDate, new Date())
      if (daysUntil <= 3) return { status: "upcoming-soon", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" }
      return { status: "upcoming", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" }
    }
    return { status: "past", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" }
  }

  const getTimeUntilDuty = (duty: any) => {
    const dutyDate = new Date(duty.dutyDate)
    const days = differenceInDays(dutyDate, new Date())
    if (days === 0) return "Today"
    if (days === 1) return "Tomorrow"
    if (days > 1) return `In ${days} days`
    return ""
  }

  const DutyCard = ({ duty, index }: { duty: any; index: number }) => {
    const dutyStatus = getDutyStatus(duty)
    const timeUntil = getTimeUntilDuty(duty)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.1 }}
        key={duty.id}
      >
        <Card className={`transition-all duration-200 hover:shadow-md ${dutyStatus.bg} border-2`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${dutyStatus.color}`} />
                  <span className="font-medium">
                    {format(new Date(duty.dutyDate), "EEEE, MMMM d, yyyy")}
                  </span>
                  {timeUntil && (
                    <Badge variant="outline" className={`text-xs ${dutyStatus.color}`}>
                      {timeUntil}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {duty.dutyType === "weekend" ? "11:00 AM - 11:00 AM (24 hours)" : "6:00 PM - 8:00 AM"}
                  </span>
                </div>
                {duty.notes && (
                  <div className="flex items-start gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-muted-foreground">{duty.notes}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={duty.dutyType === "weekend" ? "secondary" : "default"}>
                  {duty.dutyType}
                </Badge>
                {dutyStatus.status === "today" && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Today
                  </Badge>
                )}
                {dutyStatus.status === "upcoming-soon" && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Soon
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {connectionError && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Connection lost. Some updates may not appear in real-time.
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">My Duties</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "upcoming" ? "all" : "upcoming")}
          >
            <Filter className="h-4 w-4 mr-1" />
            {viewMode === "upcoming" ? "Show All" : "Upcoming Only"}
          </Button>
        </div>
      </div>

      {/* Today's Duties */}
      {todayDuties.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-600">Today's Duties</h3>
          </div>
          <div className="space-y-3">
            {todayDuties.map((duty: any, index: number) => (
              <DutyCard key={duty.id} duty={duty} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Duties */}
      {(viewMode === "upcoming" || viewMode === "all") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Upcoming Duties</h3>
            <Badge variant="outline" className="text-xs">
              {upcomingDuties.length}
            </Badge>
          </div>
          {upcomingDuties.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="space-y-2">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-muted-foreground">No upcoming duties</p>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {upcomingDuties.map((duty: any, index: number) => (
                  <DutyCard key={duty.id} duty={duty} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Past Duties */}
      {(viewMode === "past" || viewMode === "all") && pastDuties.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Past Duties</h3>
            <Badge variant="outline" className="text-xs">
              {pastDuties.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {pastDuties.slice(0, showPastDuties ? pastDuties.length : 5).map((duty: any, index: number) => (
              <DutyCard key={duty.id} duty={duty} index={index} />
            ))}
            {pastDuties.length > 5 && (
              <Button
                variant="outline"
                onClick={() => setShowPastDuties(!showPastDuties)}
                className="w-full"
              >
                {showPastDuties ? "Show Less" : `Show ${pastDuties.length - 5} More`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allDuties.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-3">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No duties assigned</h3>
              <p className="text-muted-foreground">You don't have any duties assigned yet.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}