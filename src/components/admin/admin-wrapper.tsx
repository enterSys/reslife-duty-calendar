"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Calendar, Shield, FileSpreadsheet, Edit3 } from "lucide-react"

interface AdminWrapperProps {
  userCount: number
  dutyCount: number
  swapCount: number
}

export function AdminWrapper({ userCount, dutyCount, swapCount }: AdminWrapperProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dutyCount}</div>
            <p className="text-xs text-muted-foreground">
              Assigned duties
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swapCount}</div>
            <p className="text-xs text-muted-foreground">
              Total requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage team members, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Duty Assignment
            </CardTitle>
            <CardDescription>
              Assign duties and manage schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/duties">
                Edit Duties
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Grant Access
            </CardTitle>
            <CardDescription>
              Grant admin access to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/grant-access">
                Grant Admin Access
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription>
              View analytics and generate reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure application settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Current system status and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database Status</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Authentication</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">User Sessions</span>
            <Badge variant="outline">
              Active Users: {userCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}