import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserManagement } from "@/components/admin/user-management"

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-6">
      <UserManagement />
    </div>
  )
}