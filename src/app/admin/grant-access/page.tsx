import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface GrantAccessPageProps {
  searchParams: Promise<{ email?: string; token?: string }>
}

export default async function GrantAccessPage({ searchParams }: GrantAccessPageProps) {
  const params = await searchParams
  const { email, token } = params

  // Simple security check - in production, use proper authentication
  if (token !== "temporary-admin-token") {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>Invalid token provided.</p>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Grant Admin Access</h1>
        <p>No email provided. Use ?email=user@example.com&token=temporary-admin-token</p>
      </div>
    )
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>No user found with email: {email}</p>
        </div>
      )
    }

    // Update user role to admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    })

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Access Granted</h1>
        <p className="mb-4">Successfully granted admin access to:</p>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Email:</strong> {updatedUser.email}</p>
          <p><strong>Name:</strong> {updatedUser.fullName}</p>
          <p><strong>Role:</strong> {updatedUser.role}</p>
        </div>
        <p className="mt-4">
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Go to Dashboard
          </a>
        </p>
      </div>
    )
  } catch (error) {
    console.error("Error granting admin access:", error)
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>An error occurred while granting admin access.</p>
      </div>
    )
  }
}