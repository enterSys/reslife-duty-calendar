"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Shield, User, Mail, Calendar, Edit2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface User {
  id: number
  email: string
  fullName: string | null
  role: string
  createdAt: string
}

interface UserManagementProps {
  initialUsers: User[]
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingId, setEditingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      return response.json()
    },
    onSuccess: (updatedUser) => {
      setUsers(users.map(u => u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u))
      setEditingId(null)
      toast.success("User role updated successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleRoleChange = (userId: number, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.fullName || "Not set"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                {editingId === user.id ? (
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? (
                      <Shield className="mr-1 h-3 w-3" />
                    ) : (
                      <User className="mr-1 h-3 w-3" />
                    )}
                    {user.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                  disabled={updateRoleMutation.isPending}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}