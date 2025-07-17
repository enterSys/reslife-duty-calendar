import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DutyEditor } from "@/components/admin/duty-editor"

// Force dynamic rendering to prevent build-time database queries
export const dynamic = 'force-dynamic'

export default async function AdminDutiesPage() {
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

  return (
    <div className="container mx-auto py-6">
      <DutyEditor />
    </div>
  )
}