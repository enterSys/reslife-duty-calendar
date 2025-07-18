"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRealTimeDuties } from "@/hooks/useRealTimeDuties"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { Trash2, Plus, Save, Calendar, Edit, Check, X, Filter, SortAsc, SortDesc, Search, Users, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedDutyTypes, setSelectedDutyTypes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const queryClient = useQueryClient()
  
  // Duty types for filtering
  const dutyTypes = [
    { value: "weekday", label: "Weekday" },
    { value: "weekend", label: "Weekend" }
  ]
  
  // Initialize real-time updates
  const { isConnected, connectionError } = useRealTimeDuties()

  // Fetch duties with pagination and filtering
  const { data: dutiesData, isLoading: dutiesLoading } = useQuery({
    queryKey: ["admin-duties", currentPage, pageSize, startDate, endDate, sortOrder, selectedUsers, selectedDutyTypes, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortOrder,
      })
      
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (selectedUsers.length > 0) params.append("userIds", selectedUsers.join(","))
      if (selectedDutyTypes.length > 0) params.append("dutyTypes", selectedDutyTypes.join(","))
      if (searchQuery) params.append("search", searchQuery)
      
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
      // Small delay to ensure database changes are committed before refetching
      setTimeout(() => {
        // Always refetch after settled to ensure data consistency across all duty-related queries
        queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
        queryClient.invalidateQueries({ queryKey: ["duties"] })
        queryClient.invalidateQueries({ queryKey: ["my-duties"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      }, 100)
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
      // Small delay to ensure database changes are committed before refetching
      setTimeout(() => {
        // Always refetch after settled to ensure data consistency across all duty-related queries
        queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
        queryClient.invalidateQueries({ queryKey: ["duties"] })
        queryClient.invalidateQueries({ queryKey: ["my-duties"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      }, 100)
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
      // Small delay to ensure database changes are committed before refetching
      setTimeout(() => {
        // Always refetch after settled to ensure data consistency across all duty-related queries
        queryClient.invalidateQueries({ queryKey: ["admin-duties"] })
        queryClient.invalidateQueries({ queryKey: ["duties"] })
        queryClient.invalidateQueries({ queryKey: ["my-duties"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      }, 100)
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
    setSelectedUsers([])
    setSelectedDutyTypes([])
    setSearchQuery("")
    setCurrentPage(1)
  }
  
  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
    setCurrentPage(1)
  }
  
  const handleDutyTypeToggle = (dutyType: string) => {
    setSelectedDutyTypes(prev => 
      prev.includes(dutyType) 
        ? prev.filter(type => type !== dutyType)
        : [...prev, dutyType]
    )
    setCurrentPage(1)
  }
  
  const handleQuickDateFilter = (days: number) => {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + days)
    
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(futureDate.toISOString().split('T')[0])
    setCurrentPage(1)
  }
  
  const getActiveFiltersCount = () => {
    let count = 0
    if (startDate) count++
    if (endDate) count++
    if (selectedUsers.length > 0) count++
    if (selectedDutyTypes.length > 0) count++
    if (searchQuery) count++
    return count
  }

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    setCurrentPage(1)
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, selectedUsers, selectedDutyTypes, searchQuery])

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
          {/* Enhanced Filters and Controls */}
          <div className="flex flex-col gap-4 mb-4">
            {/* Filter Toggle Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {getActiveFiltersCount() > 0 && (
                  <Button
                    onClick={handleClearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
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
                
                {!isAddingNew && (
                  <Button onClick={() => setIsAddingNew(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Duty
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filter Chips */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2">
                {startDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    From: {format(new Date(startDate), "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setStartDate("")}
                    />
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    To: {format(new Date(endDate), "MMM dd, yyyy")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setEndDate("")}
                    />
                  </Badge>
                )}
                {selectedUsers.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Users: {selectedUsers.length}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedUsers([])}
                    />
                  </Badge>
                )}
                {selectedDutyTypes.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    Types: {selectedDutyTypes.length}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedDutyTypes([])}
                    />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search: "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
              </div>
            )}
            
            {/* Expanded Filters Panel */}
            {showFilters && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Quick Date Presets */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quick Date Filters</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter(7)}
                        >
                          Next 7 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter(30)}
                        >
                          Next 30 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter(90)}
                        >
                          Next 90 Days
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Custom Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Start Date</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">End Date</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Advanced Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Search Notes</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search in notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      {/* User Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filter by Users</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Users className="mr-2 h-4 w-4" />
                              {selectedUsers.length === 0
                                ? "Select users..."
                                : `${selectedUsers.length} users selected`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput placeholder="Search users..." />
                              <CommandList>
                                <CommandEmpty>No users found.</CommandEmpty>
                                <CommandGroup>
                                  {users.map((user: User) => (
                                    <CommandItem
                                      key={user.id}
                                      onSelect={() => handleUserToggle(user.id)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedUsers.includes(user.id)}
                                          onChange={() => handleUserToggle(user.id)}
                                        />
                                        <span>{user.fullName}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {/* Duty Type Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filter by Type</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Filter className="mr-2 h-4 w-4" />
                              {selectedDutyTypes.length === 0
                                ? "Select types..."
                                : `${selectedDutyTypes.length} types selected`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60 p-0">
                            <Command>
                              <CommandList>
                                <CommandGroup>
                                  {dutyTypes.map((type) => (
                                    <CommandItem
                                      key={type.value}
                                      onSelect={() => handleDutyTypeToggle(type.value)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedDutyTypes.includes(type.value)}
                                          onChange={() => handleDutyTypeToggle(type.value)}
                                        />
                                        <span>{type.label}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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