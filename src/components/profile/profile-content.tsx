"use client"

import { useState } from "react"
import { Session } from "next-auth"
import { motion } from "framer-motion"
import { ArrowLeft, User, Settings, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { ProfileForm } from "./profile-form"
import { PasswordChangeForm } from "./password-change-form"
import { UnavailableDaysManager } from "./unavailable-days-manager"

interface ProfileContentProps {
  session: Session
}

export function ProfileContent({ session }: ProfileContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  const tabs = [
    {
      value: "profile",
      label: "Profile",
      icon: User,
      description: "Update your personal information",
    },
    {
      value: "security",
      label: "Security",
      icon: Settings,
      description: "Change password and security settings",
    },
    {
      value: "availability",
      label: "Availability",
      icon: Calendar,
      description: "Manage your unavailable days",
    },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={session.user.profileImage || `https://avatar.vercel.sh/${session.user.email}`}
                  alt={session.user.name || session.user.email || "User"}
                />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{session.user.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <div>{session.user.email}</div>
                  {session.user.allocatedBuilding && (
                    <div className="text-xs bg-muted px-2 py-1 rounded inline-block">
                      {session.user.allocatedBuilding}
                    </div>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm user={session.user} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordChangeForm userId={session.user.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Availability Management</CardTitle>
                  <CardDescription>
                    Set your unavailable days and recurring schedule preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnavailableDaysManager userId={session.user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  )
}