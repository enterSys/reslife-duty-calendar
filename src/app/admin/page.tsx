import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminWrapper } from "@/components/admin/admin-wrapper"

// Force dynamic rendering to prevent build-time database queries
export const dynamic = 'force-dynamic'

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
    <AdminWrapper
      userCount={userCount}
      dutyCount={dutyCount}
      swapCount={swapCount}
    />
  )
}