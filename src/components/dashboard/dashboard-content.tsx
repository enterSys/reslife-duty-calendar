"use client"

import { useState } from "react"
import { Session } from "next-auth"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users } from "lucide-react"
import { CalendarView } from "./calendar-view"
import { MyDuties } from "./my-duties"
import { SwapRequests } from "./swap-requests"
import { TeamMembers } from "./team-members"
import { ImportDutiesDialog } from "./import-duties-dialog"
import { ModeToggle } from "@/components/ui/mode-toggle"

interface DashboardContentProps {
  session: Session
}

export function DashboardContent({ session }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("calendar")
  const isAdmin = session.user?.role === "admin"

  // Debug: Log session details
  console.log("Client session:", {
    user: session.user,
    role: session.user?.role,
    isAdmin
  })

  return (
    <motion.div 
      className="container mx-auto py-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold">ResLife Duty Calendar</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name || session.user?.email}!
            {session.user?.role && (
              <span className="ml-2 text-sm">({session.user.role})</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          {isAdmin && <ImportDutiesDialog />}
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="my-duties">My Duties</TabsTrigger>
            <TabsTrigger value="swaps">Swap Requests</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>
        </motion.div>

        <TabsContent value="calendar" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </TabsContent>

        <TabsContent value="my-duties" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </TabsContent>

        <TabsContent value="swaps" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>
                    Quick access to administrative functions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.a 
                      href="/admin" 
                      className="block"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </motion.a>
                    <motion.a 
                      href="/admin/users" 
                      className="block"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </Button>
                    </motion.a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  )
}