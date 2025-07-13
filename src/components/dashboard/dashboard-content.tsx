"use client"

import { useState } from "react"
import { Session } from "next-auth"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Users, FileSpreadsheet, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
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
  const [activeTab, setActiveTab] = useState("calendar")

  const tabs = [
    {
      value: "calendar",
      label: "Calendar",
      icon: Calendar,
      description: "View and manage duty assignments",
    },
    {
      value: "my-duties",
      label: "My Duties",
      icon: Calendar,
      description: "Your upcoming and past duties",
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duty Calendar</h1>
          <p className="text-muted-foreground">
            Manage your residential life duties efficiently
          </p>
        </div>
        <ImportDutiesDialog />
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Swaps</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Duties scheduled
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key={activeTab} value={activeTab} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                                 {activeTab === "calendar" && <CalendarView />}
                 {activeTab === "my-duties" && <MyDuties userId={session.user.id} />}
                 {activeTab === "swaps" && <SwapRequests userId={session.user.id} />}
                 {activeTab === "team" && <TeamMembers />}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  )
}