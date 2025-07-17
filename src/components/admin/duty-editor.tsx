"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, Calendar, Edit, Check, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Duty {
  id: number
  dutyDate: string
  dutyType: string
  notes?: string
  user: {
    id: number
    fullName: string
  }
}

interface User {
  id: number
  fullName: string
  email: string
}

interface EditingDuty {
  id: number
  dutyDate: string
  userId: number
  notes: string
}

export function DutyEditor() {
  const [editingDuty, setEditingDuty] = useState<EditingDuty | null>(null)
  const [newDuty, setNewDuty] = useState({
    dutyDate: "",
    userId: "",
    notes: ""
  })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const queryClient = useQueryClient()

  // Fetch duties
  const { data: duties = [], isLoading: dutiesLoading } = useQuery({
    queryKey: ["admin-duties"],
    queryFn: async () => {
      const response = await fetch("/api/duties")
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json()
    }
  })

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    }
  })

  // Update duty mutation
  const updateDutyMutation = useMutation({
    mutationFn: async (duty: EditingDuty) => {
      const response = await fetch(`/api/duties/${duty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dutyDate: duty.dutyDate,
          userId: duty.userId,
          notes: duty.notes
        })
      })
      if (!response.ok) throw new Error("Failed to update duty")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
      setEditingDuty(null)
      toast.success("Duty updated successfully")
    },
    onError: () => {
      toast.error("Failed to update duty")
    }
  })

  // Create duty mutation
  const createDutyMutation = useMutation({
    mutationFn: async (duty: typeof newDuty) => {
      const response = await fetch("/api/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dutyDate: duty.dutyDate,
          userId: parseInt(duty.userId),
          notes: duty.notes,
          dutyType: new Date(duty.dutyDate).getDay() === 0 || new Date(duty.dutyDate).getDay() === 6 ? "weekend" : "weekday"
        })
      })
      if (!response.ok) throw new Error("Failed to create duty")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
      setNewDuty({ dutyDate: "", userId: "", notes: "" })
      setIsAddingNew(false)
      toast.success("Duty created successfully")
    },
    onError: () => {
      toast.error("Failed to create duty")
    }
  })

  // Delete duty mutation
  const deleteDutyMutation = useMutation({
    mutationFn: async (dutyId: number) => {
      const response = await fetch(`/api/duties/${dutyId}`, {
        method: "DELETE"
      })
      if (!response.ok) throw new Error("Failed to delete duty")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
      toast.success("Duty deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete duty")
    }
  })

  const handleEdit = (duty: Duty) => {
    setEditingDuty({
      id: duty.id,
      dutyDate: duty.dutyDate,
      userId: duty.user.id,
      notes: duty.notes || ""
    })
  }

  const handleSave = () => {
    if (editingDuty) {
      updateDutyMutation.mutate(editingDuty)
    }
  }

  const handleCancel = () => {
    setEditingDuty(null)
  }

  const handleDelete = (dutyId: number) => {
    if (confirm("Are you sure you want to delete this duty?")) {
      deleteDutyMutation.mutate(dutyId)
    }
  }

  const handleAddNew = () => {
    if (newDuty.dutyDate && newDuty.userId) {
      createDutyMutation.mutate(newDuty)
    }
  }

  const sortedDuties = [...duties].sort((a, b) => new Date(a.dutyDate).getTime() - new Date(b.dutyDate).getTime())

  if (dutiesLoading || usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="duty-editor">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Duty Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Duty */}
          {!isAddingNew ? (
            <Button onClick={() => setIsAddingNew(true)} className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Add New Duty
            </Button>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Input
                      type="date"
                      value={newDuty.dutyDate}
                      onChange={(e) => setNewDuty({ ...newDuty, dutyDate: e.target.value })}
                      placeholder="Date"
                    />
                  </div>
                  <div>
                    <Select value={newDuty.userId} onValueChange={(value) => setNewDuty({ ...newDuty, userId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      value={newDuty.notes}
                      onChange={(e) => setNewDuty({ ...newDuty, notes: e.target.value })}
                      placeholder="Notes (optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddNew}
                      disabled={!newDuty.dutyDate || !newDuty.userId || createDutyMutation.isPending}
                      size="sm"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingNew(false)
                        setNewDuty({ dutyDate: "", userId: "", notes: "" })
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duties Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDuties.map((duty: Duty) => (
                  <TableRow key={duty.id}>
                    <TableCell>
                      {editingDuty?.id === duty.id ? (
                        <Input
                          type="date"
                          value={editingDuty.dutyDate}
                          onChange={(e) => setEditingDuty({ ...editingDuty, dutyDate: e.target.value })}
                        />
                      ) : (
                        format(new Date(duty.dutyDate), "MMM dd, yyyy")
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDuty?.id === duty.id ? (
                        <Select
                          value={editingDuty.userId.toString()}
                          onValueChange={(value) => setEditingDuty({ ...editingDuty, userId: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        duty.user.fullName
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={duty.dutyType === "weekend" ? "secondary" : "default"}>
                        {duty.dutyType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingDuty?.id === duty.id ? (
                        <Input
                          value={editingDuty.notes}
                          onChange={(e) => setEditingDuty({ ...editingDuty, notes: e.target.value })}
                          placeholder="Notes..."
                        />
                      ) : (
                        <span className="truncate">{duty.notes || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingDuty?.id === duty.id ? (
                          <>
                            <Button
                              onClick={handleSave}
                              disabled={updateDutyMutation.isPending}
                              size="sm"
                              variant="default"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleCancel}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEdit(duty)}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(duty.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sortedDuties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No duties found. Add your first duty above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}