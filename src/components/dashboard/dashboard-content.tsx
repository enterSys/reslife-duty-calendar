"use client"

import { useState } from "react"
import { Session } from "next-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarView } from "./calendar-view"
import { MyDuties } from "./my-duties"
import { SwapRequests } from "./swap-requests"
import { TeamMembers } from "./team-members"
import { ImportDutiesDialog } from "./import-duties-dialog"

interface DashboardContentProps {
  session: Session
}

export function DashboardContent({ session }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("calendar")
  const isAdmin = session.user?.role === "admin"

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ResLife Duty Calendar</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name || session.user?.email}!
          </p>
        </div>
        {isAdmin && <ImportDutiesDialog />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="my-duties">My Duties</TabsTrigger>
          <TabsTrigger value="swaps">Swap Requests</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duty Calendar</CardTitle>
              <CardDescription>
                View the team rota schedule. Weekday shifts: 6pm-8am, Weekend shifts: 11am-11am (24hrs)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-duties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Duties</CardTitle>
              <CardDescription>
                View and manage your assigned duties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyDuties userId={session.user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Swap Requests</CardTitle>
              <CardDescription>
                Manage duty swap requests with other team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SwapRequests userId={session.user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View all team members and their contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMembers />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}