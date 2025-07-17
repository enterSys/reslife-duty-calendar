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
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { Trash2, Plus, Save, Calendar, Edit, Check, X, Filter, SortAsc, SortDesc } from "lucide-react"
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  // Fetch duties with pagination and filtering
  const { data: dutiesData, isLoading: dutiesLoading } = useQuery({
    queryKey: ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortOrder,
      })
      
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const response = await fetch(`/api/duties?${params}`)
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json()
    }
  })

  const duties = dutiesData?.duties || []
  const pagination = dutiesData?.pagination

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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update duty")
      }
      
      return response.json()
    },
    onMutate: async (duty: EditingDuty) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-duties"] })
      
      // Snapshot the previous value
      const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
      const previousDuties = queryClient.getQueryData(queryKey)
      
      // Find the user data for the updated duty
      const selectedUser = users.find((u: User) => u.id === duty.userId)
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.duties) return old
        return {
          ...old,
          duties: old.duties.map((d: any) => 
            d.id === duty.id 
              ? {
                  ...d,
                  dutyDate: duty.dutyDate,
                  notes: duty.notes,
                  user: selectedUser ? { id: selectedUser.id, fullName: selectedUser.fullName } : d.user,
                  dutyType: new Date(duty.dutyDate).getDay() === 0 || new Date(duty.dutyDate).getDay() === 6 ? "weekend" : "weekday"
                }
              : d
          )
        }
      })
      
      return { previousDuties }
    },
    onError: (error, duty, context) => {
      // Rollback on error
      if (context?.previousDuties) {
        const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
        queryClient.setQueryData(queryKey, context.previousDuties)
      }
      
      const errorMessage = error.message || "Failed to update duty"
      toast.error(errorMessage)
    },
    onSuccess: () => {
      setEditingDuty(null)
      toast.success("Duty updated successfully")
    },
    onSettled: () => {
      // Always refetch after settled to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create duty")
      }
      
      return response.json()
    },
    onMutate: async (duty: typeof newDuty) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-duties"] })
      
      // Snapshot the previous value
      const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
      const previousDuties = queryClient.getQueryData(queryKey)
      
      // Find the user data for the new duty
      const selectedUser = users.find((u: User) => u.id === parseInt(duty.userId))
      
      // Create optimistic duty with temporary ID
      const optimisticDuty = {
        id: Date.now(), // Temporary ID
        dutyDate: duty.dutyDate,
        notes: duty.notes,
        dutyType: new Date(duty.dutyDate).getDay() === 0 || new Date(duty.dutyDate).getDay() === 6 ? "weekend" : "weekday",
        user: selectedUser ? { id: selectedUser.id, fullName: selectedUser.fullName } : { id: parseInt(duty.userId), fullName: "Unknown" }
      }
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.duties) return { duties: [optimisticDuty], pagination: old?.pagination }
        return {
          ...old,
          duties: [optimisticDuty, ...old.duties]
        }
      })
      
      return { previousDuties }
    },
    onError: (error, duty, context) => {
      // Rollback on error
      if (context?.previousDuties) {
        const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
        queryClient.setQueryData(queryKey, context.previousDuties)
      }
      
      const errorMessage = error.message || "Failed to create duty"
      toast.error(errorMessage)
    },
    onSuccess: () => {
      setNewDuty({ dutyDate: "", userId: "", notes: "" })
      setIsAddingNew(false)
      toast.success("Duty created successfully")
    },
    onSettled: () => {
      // Always refetch after settled to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
    }
  })

  // Delete duty mutation
  const deleteDutyMutation = useMutation({
    mutationFn: async (dutyId: number) => {
      const response = await fetch(`/api/duties/${dutyId}`, {
        method: "DELETE"
      })
      
      // Handle 404 errors gracefully - duty might already be deleted
      if (response.status === 404) {
        return { message: "Duty was already deleted" }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete duty")
      }
      
      return response.json()
    },
    onMutate: async (dutyId: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-duties"] })
      
      // Snapshot the previous value
      const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
      const previousDuties = queryClient.getQueryData(queryKey)
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.duties) return old
        return {
          ...old,
          duties: old.duties.filter((duty: any) => duty.id !== dutyId)
        }
      })
      
      return { previousDuties }
    },
    onError: (error, dutyId, context) => {
      // Rollback on error
      if (context?.previousDuties) {
        const queryKey = ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder]
        queryClient.setQueryData(queryKey, context.previousDuties)
      }
      
      const errorMessage = error.message || "Failed to delete duty"
      toast.error(errorMessage)
    },
    onSuccess: () => {
      toast.success("Duty deleted successfully")
    },
    onSettled: () => {
      // Always refetch after settled to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    setCurrentPage(1)
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate])

  const sortedDuties = [...duties]

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
          {/* Filters and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="mb-2"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              
              {showFilters && (
                <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      size="sm"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={handleSortToggle}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {sortOrder === "desc" ? (
                        <SortDesc className="h-4 w-4" />
                      ) : (
                        <SortAsc className="h-4 w-4" />
                      )}
                      Sort Date
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-start">
              {!isAddingNew ? (
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Duty
                </Button>
              ) : null}
            </div>
          </div>

          {/* Add New Duty */}
          {isAddingNew && (
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

          {/* Pagination Info */}
          {pagination && (
            <PaginationInfo
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
              className="mb-4"
            />
          )}

          {/* Duties Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Date
                      <Button
                        onClick={handleSortToggle}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        {sortOrder === "desc" ? (
                          <SortDesc className="h-3 w-3" />
                        ) : (
                          <SortAsc className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
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
                              disabled={updateDutyMutation.isPending || deleteDutyMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(duty.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              disabled={deleteDutyMutation.isPending}
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
              {startDate || endDate ? "No duties found for the selected date range." : "No duties found. Add your first duty above."}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(parseInt(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}