"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Shield, User, Mail, Calendar, Edit2, Trash2, Plus, Save, X, Hash } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface User {
  id: number
  email: string
  fullName: string | null
  role: string
  createdAt: string
  shiftsCount: number
  allocatedBuilding: string | null
}

interface UserManagementProps {
  initialUsers: User[]
}

interface EditingUser {
  fullName: string
  email: string
  role: string
  allocatedBuilding: string
}

interface NewUser {
  fullName: string
  email: string
  role: string
  password: string
  allocatedBuilding: string
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<NewUser>({
    fullName: "",
    email: "",
    role: "user",
    password: "",
    allocatedBuilding: "",
  })
  const queryClient = useQueryClient()

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<EditingUser> }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      return response.json()
    },
    onSuccess: (updatedUser) => {
      setUsers(users.map(u => u.id === updatedUser.id ? {
        ...u,
        ...updatedUser,
        createdAt: updatedUser.createdAt || u.createdAt
      } : u))
      setEditingId(null)
      setEditingUser(null)
      toast.success("User updated successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      return response.json()
    },
    onSuccess: () => {
      setUsers(users.filter(u => u.id !== userToDelete?.id))
      setShowDeleteDialog(false)
      setUserToDelete(null)
      toast.success("User deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      return response.json()
    },
    onSuccess: (createdUser) => {
      setUsers([{ ...createdUser, shiftsCount: 0 }, ...users])
      setShowAddDialog(false)
      setNewUser({ fullName: "", email: "", role: "user", password: "", allocatedBuilding: "" })
      toast.success("User created successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setEditingUser({
      fullName: user.fullName || "",
      email: user.email,
      role: user.role,
      allocatedBuilding: user.allocatedBuilding || "",
    })
  }

  const handleSave = () => {
    if (editingId && editingUser) {
      updateUserMutation.mutate({ userId: editingId, data: editingUser })
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingUser(null)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  const handleAddUser = () => {
    createUserMutation.mutate(newUser)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Users</h2>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </motion.div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Shifts</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">
                      {editingId === user.id ? (
                        <Input
                          value={editingUser?.fullName || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                          className="h-8"
                        />
                      ) : (
                        user.fullName || "Not set"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === user.id ? (
                        <Input
                          type="email"
                          value={editingUser?.email || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                          className="h-8"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === user.id ? (
                        <Select
                          value={editingUser?.role}
                          onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                        >
                          <SelectTrigger className="w-32 h-8">
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
                      {editingId === user.id ? (
                        <Input
                          value={editingUser?.allocatedBuilding || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, allocatedBuilding: e.target.value } : null)}
                          className="h-8"
                          placeholder="Building name"
                        />
                      ) : (
                        <span className="text-sm">
                          {user.allocatedBuilding || "Not set"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{user.shiftsCount} shifts</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === user.id ? (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                disabled={updateUserMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will receive their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Name
              </Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                className="col-span-3"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="col-span-3"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="col-span-3">
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="building" className="text-right">
                Building
              </Label>
              <Input
                id="building"
                value={newUser.allocatedBuilding}
                onChange={(e) => setNewUser(prev => ({ ...prev, allocatedBuilding: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Ashburne & Sheavyn"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={createUserMutation.isPending || !newUser.email || !newUser.fullName || !newUser.password}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <strong>{userToDelete?.fullName || userToDelete?.email}</strong> and remove all their data.
              {userToDelete?.shiftsCount && userToDelete.shiftsCount > 0 && (
                <span className="text-destructive font-medium">
                  <br />
                  Warning: This user has {userToDelete.shiftsCount} assigned shift(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}