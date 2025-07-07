import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage() {
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

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  // Convert to serializable format
  const serializedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <UserManagement initialUsers={serializedUsers} />
    </div>
  )
}