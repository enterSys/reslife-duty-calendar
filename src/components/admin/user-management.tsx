"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Save, X, Users, ShieldCheck } from "lucide-react"

interface User {
  id: number
  email: string
  fullName: string | null
  role: string
  allocatedBuilding: string | null
  createdAt: string
  shiftsCount: number
}

interface UserManagementProps {
  initialUsers?: User[]
}

export function UserManagement({ initialUsers = [] }: UserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addForm, setAddForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "user",
    allocatedBuilding: "",
  })
  const [loading, setLoading] = useState(false)

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      } else {
        toast.error("Failed to fetch users")
      }
    } catch (error) {
      toast.error("Error fetching users")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setEditForm({
      fullName: user.fullName,
      role: user.role,
      allocatedBuilding: user.allocatedBuilding,
    })
  }

  const handleSave = async () => {
    if (!editingId) return
    
    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(user => user.id === editingId ? updatedUser : user))
        setEditingId(null)
        setEditForm({})
        toast.success("User updated successfully")
      } else {
        toast.error("Failed to update user")
      }
    } catch (error) {
      toast.error("Error updating user")
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        toast.success("User deleted successfully")
      } else {
        toast.error("Failed to delete user")
      }
    } catch (error) {
      toast.error("Error deleting user")
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addForm),
      })

      if (response.ok) {
        await fetchUsers() // Refresh the user list
        setShowAddDialog(false)
        setAddForm({
          email: "",
          fullName: "",
          password: "",
          role: "user",
          allocatedBuilding: "",
        })
        toast.success("User created successfully")
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to create user")
      }
    } catch (error) {
      toast.error("Error creating user")
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === "user").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Standard users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Shifts</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border-b"
                      >
                        <TableCell>
                          {editingId === user.id ? (
                            <Input
                              value={editForm.fullName || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, fullName: e.target.value })
                              }
                              placeholder="Full name"
                            />
                          ) : (
                            user.fullName || "Not set"
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {editingId === user.id ? (
                            <Select
                              value={editForm.role}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === user.id ? (
                            <Input
                              value={editForm.allocatedBuilding || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, allocatedBuilding: e.target.value })
                              }
                              placeholder="Building"
                            />
                          ) : (
                            user.allocatedBuilding || "Not assigned"
                          )}
                        </TableCell>
                        <TableCell>{user.shiftsCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {editingId === user.id ? (
                              <>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSave}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingId(null)
                                      setEditForm({})
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </>
                            ) : (
                              <>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(user)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(user.id)}
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
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-fullName">Full Name</Label>
              <Input
                id="add-fullName"
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-building">Building</Label>
              <Input
                id="add-building"
                value={addForm.allocatedBuilding}
                onChange={(e) => setAddForm({ ...addForm, allocatedBuilding: e.target.value })}
                placeholder="Enter building assignment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select
                value={addForm.role}
                onValueChange={(value) => setAddForm({ ...addForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}