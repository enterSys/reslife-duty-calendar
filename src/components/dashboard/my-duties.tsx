"use client"

import { useQuery } from "@tanstack/react-query"
import { format, isFuture, isPast } from "date-fns"
import { Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface MyDutiesProps {
  userId: string
}

export function MyDuties({ userId }: MyDutiesProps) {
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
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  const upcomingDuties = duties?.duties?.filter((duty: any) => 
    isFuture(new Date(duty.dutyDate))
  ) || []
  
  const pastDuties = duties?.duties?.filter((duty: any) => 
    isPast(new Date(duty.dutyDate))
  ) || []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Upcoming Duties</h3>
        {upcomingDuties.length === 0 ? (
          <p className="text-muted-foreground">No upcoming duties</p>
        ) : (
          <div className="space-y-3">
            {upcomingDuties.map((duty: any) => (
              <Card key={duty.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(duty.dutyDate), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {duty.dutyType === "weekend" ? "11:00 AM - 11:00 AM (24 hours)" : "6:00 PM - 8:00 AM"}
                      </span>
                    </div>
                  </div>
                  <Badge variant={duty.dutyType === "weekend" ? "secondary" : "default"}>
                    {duty.dutyType}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Past Duties</h3>
        {pastDuties.length === 0 ? (
          <p className="text-muted-foreground">No past duties</p>
        ) : (
          <div className="space-y-3">
            {pastDuties.slice(0, 5).map((duty: any) => (
              <Card key={duty.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(duty.dutyDate), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {duty.dutyType}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}