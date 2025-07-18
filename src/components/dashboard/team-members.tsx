"use client"

import { useQuery } from "@tanstack/react-query"
import { Mail, User, Building2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamMembers() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch team members")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {["Sheavyn", "Ashburne"].map((building) => (
          <div key={building} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
  }

  const getAvatarColor = (initials: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-yellow-500",
      "bg-cyan-500"
    ]
    
    const charCode = initials.charCodeAt(0) + (initials.length > 1 ? initials.charCodeAt(1) : 0)
    return colors[charCode % colors.length]
  }

  const groupedMembers = members?.reduce((acc: any, member: any) => {
    const building = member.building || "Unassigned"
    if (!acc[building]) {
      acc[building] = []
    }
    acc[building].push(member)
    return acc
  }, {})

  const sortedBuildings = Object.keys(groupedMembers || {}).sort()

  return (
    <div className="space-y-6">
      {sortedBuildings.map((building) => (
        <div key={building} className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{building}</h3>
            <Badge variant="outline" className="text-xs">
              {groupedMembers[building].length} members
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedMembers[building].map((member: any) => {
              const initials = getInitials(member.fullName)
              const colorClass = getAvatarColor(initials)
              
              return (
                <Card key={member.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className={`${colorClass} text-white`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{member.fullName}</h4>
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}