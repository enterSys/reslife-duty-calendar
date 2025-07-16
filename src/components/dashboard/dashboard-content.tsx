"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Session } from "next-auth"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Users, FileSpreadsheet, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

// Dynamic imports for better performance
const CalendarView = dynamic(() => import("./calendar-view").then(mod => ({ default: mod.CalendarView })), {
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
})

const MyDuties = dynamic(() => import("./my-duties").then(mod => ({ default: mod.MyDuties })), {
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const SwapRequests = dynamic(() => import("./swap-requests").then(mod => ({ default: mod.SwapRequests })), {
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
})

const TeamMembers = dynamic(() => import("./team-members").then(mod => ({ default: mod.TeamMembers })), {
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const ImportDutiesDialog = dynamic(() => import("./import-duties-dialog").then(mod => ({ default: mod.ImportDutiesDialog })), {
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

interface DashboardContentProps {
  session: Session
}

export function DashboardContent({ session }: DashboardContentProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("my-duties")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) throw new Error("Failed to fetch dashboard stats")
      return response.json()
    },
  })

  const tabs = [
    {
      value: "my-duties",
      label: "My Duties",
      icon: Calendar,
      description: "Your upcoming and past duties",
    },
    {
      value: "calendar",
      label: "Calendar",
      icon: Calendar,
      description: "View and manage duty assignments",
    },
    {
      value: "swaps",
      label: "Swap Requests",
      icon: ArrowLeftRight,
      description: "Manage duty swap requests",
    },
    {
      value: "team",
      label: "Team Members",
      icon: Users,
      description: "View team members and their duties",
    },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Import Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <ImportDutiesDialog />
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalDuties || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                stats?.stats.totalDutiesText || "No change"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.completedDuties || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                stats?.stats.completionText || "0% completion rate"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Swaps</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pendingSwaps || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                stats?.stats.swapsText || "Awaiting approval"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalTeamMembers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                stats?.stats.teamText || "Active staff"
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="mt-6"
            >
              <TabsContent value="my-duties" className="mt-0">
                <MyDuties userId={session.user.id} />
              </TabsContent>
              <TabsContent value="calendar" className="mt-0">
                <CalendarView />
              </TabsContent>
              <TabsContent value="swaps" className="mt-0">
                <SwapRequests userId={session.user.id} />
              </TabsContent>
              <TabsContent value="team" className="mt-0">
                <TeamMembers />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  )
}