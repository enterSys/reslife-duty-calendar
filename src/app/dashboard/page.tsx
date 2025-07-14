import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  // Debug: Log session to see what's available
  console.log("Dashboard session:", JSON.stringify(session, null, 2))

  return <DashboardContent session={session} />
}