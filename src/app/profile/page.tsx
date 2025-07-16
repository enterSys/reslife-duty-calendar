import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ProfileContent } from "@/components/profile/profile-content"

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileContent session={session} />
    </div>
  )
}

export const metadata = {
  title: "Profile | ResLife Duty Calendar",
  description: "Manage your profile settings and preferences",
}