"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { Calendar, CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const unavailableSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().optional(),
  recurring: z.boolean(),
  dayOfWeek: z.number().optional(),
})

type UnavailableFormData = z.infer<typeof unavailableSchema>

interface UnavailableDay {
  id: number
  startDate: string
  endDate: string
  reason?: string
  recurring: boolean
  dayOfWeek?: number
  isActive: boolean
}

interface UnavailableDaysManagerProps {
  userId: string
}

export function UnavailableDaysManager({ userId }: UnavailableDaysManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UnavailableFormData>({
    resolver: zodResolver(unavailableSchema),
    defaultValues: {
      recurring: false,
    },
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const recurring = watch("recurring")

  // Fetch unavailable days
  const { data: unavailableDays, isLoading } = useQuery({
    queryKey: ["unavailable-days", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/unavailable-days`)
      if (!response.ok) throw new Error("Failed to fetch unavailable days")
      return response.json() as Promise<UnavailableDay[]>
    },
  })

  // Create unavailable day
  const createMutation = useMutation({
    mutationFn: async (data: UnavailableFormData) => {
      const response = await fetch(`/api/users/${userId}/unavailable-days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          reason: data.reason,
          recurring: data.recurring,
          dayOfWeek: data.recurring ? data.startDate.getDay() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create unavailable day")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Unavailable day added successfully")
      queryClient.invalidateQueries({ queryKey: ["unavailable-days", userId] })
      reset()
      setShowForm(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete unavailable day
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/users/${userId}/unavailable-days/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete unavailable day")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Unavailable day removed successfully")
      queryClient.invalidateQueries({ queryKey: ["unavailable-days", userId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: UnavailableFormData) => {
    if (data.startDate > data.endDate) {
      toast.error("End date must be after start date")
      return
    }
    createMutation.mutate(data)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this unavailable period?")) {
      deleteMutation.mutate(id)
    }
  }

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Set your unavailable days to prevent automatic duty assignments. You can set specific date ranges or recurring weekly patterns.
        </AlertDescription>
      </Alert>

      {/* Add New Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Unavailable Days</h3>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Unavailable Day
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Unavailable Period</CardTitle>
            <CardDescription>
              Set dates when you're not available for duty assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setValue("startDate", date!)
                          setStartDateOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setValue("endDate", date!)
                          setEndDateOpen(false)
                        }}
                        disabled={(date) => date < (startDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  {...register("reason")}
                  placeholder="Vacation, family visit, etc."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={recurring}
                  onCheckedChange={(checked) => setValue("recurring", checked)}
                />
                <Label htmlFor="recurring">
                  Recurring weekly (same day every week)
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Period
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of Unavailable Days */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : unavailableDays && unavailableDays.length > 0 ? (
          unavailableDays.map((period) => (
            <Card key={period.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {format(parseISO(period.startDate), "MMM d, yyyy")}
                        {period.startDate !== period.endDate && (
                          <> - {format(parseISO(period.endDate), "MMM d, yyyy")}</>
                        )}
                      </span>
                      {period.recurring && (
                        <Badge variant="secondary">
                          Recurring {daysOfWeek[period.dayOfWeek!]}s
                        </Badge>
                      )}
                    </div>
                    {period.reason && (
                      <p className="text-sm text-muted-foreground">{period.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(period.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No unavailable days set. You're available for all duty assignments.
          </div>
        )}
      </div>
    </div>
  )
}