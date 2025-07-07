import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Calendar, Shield, FileSpreadsheet } from "lucide-react"

export default async function AdminPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
  })

  if (user?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get statistics
  const [userCount, dutyCount, swapCount] = await Promise.all([
    prisma.user.count(),
    prisma.duty.count(),
    prisma.dutySwap.count(),
  ])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, duties, and system settings
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dutyCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swapCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duty Management</CardTitle>
            <CardDescription>
              Import and manage duty assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import from Google Sheets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Admin Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
            <p>
              <strong>Name:</strong> {session.user.name || "Not set"}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              <Badge variant="default">
                <Shield className="mr-1 h-3 w-3" />
                {user.role}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}