"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface SwapRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duty: {
    id: number
    dutyDate: string
    dutyType: string
    user: {
      id: number
      fullName: string
      email: string
    }
  }
}

export function SwapRequestDialog({ open, onOpenChange, duty }: SwapRequestDialogProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [selectedDutyId, setSelectedDutyId] = useState<string>("")
  const [reason, setReason] = useState("")

  // Fetch user's own duties for swapping
  const { data: myDuties } = useQuery({
    queryKey: ["my-duties", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      const response = await fetch(`/api/duties?userId=${session.user.id}`)
      if (!response.ok) throw new Error("Failed to fetch duties")
      return response.json()
    },
    enabled: open && !!session?.user?.id,
  })

  // Create swap request mutation
  const createSwapRequest = useMutation({
    mutationFn: async (data: {
      requestedDutyId: number
      requesterDutyId: number
      reason: string
    }) => {
      const response = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create swap request")
      return response.json()
    },
    onSuccess: () => {
      toast.success("Swap request sent successfully")
      queryClient.invalidateQueries({ queryKey: ["swaps"] })
      onOpenChange(false)
      setSelectedDutyId("")
      setReason("")
    },
    onError: () => {
      toast.error("Failed to create swap request")
    },
  })

  const handleSubmit = () => {
    if (!selectedDutyId) {
      toast.error("Please select a duty to offer in exchange")
      return
    }

    createSwapRequest.mutate({
      requestedDutyId: duty.id,
      requesterDutyId: parseInt(selectedDutyId),
      reason,
    })
  }

  const isOwnDuty = session?.user?.id === duty.user.id.toString()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Duty Swap</DialogTitle>
          <DialogDescription>
            Request to swap duties with {duty.user.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Requested Duty</Label>
            <div className="text-sm text-muted-foreground">
              {format(new Date(duty.dutyDate), "EEEE, MMMM d, yyyy")} - {duty.dutyType}
            </div>
          </div>

          {isOwnDuty ? (
            <div className="text-sm text-muted-foreground">
              You cannot swap with yourself
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="offer-duty">Offer Your Duty</Label>
                <Select value={selectedDutyId} onValueChange={setSelectedDutyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a duty to offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {myDuties?.map((myDuty: any) => (
                      <SelectItem key={myDuty.id} value={myDuty.id.toString()}>
                        {format(new Date(myDuty.dutyDate), "MMM d, yyyy")} - {myDuty.dutyType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need this swap..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isOwnDuty && (
            <Button 
              onClick={handleSubmit} 
              disabled={createSwapRequest.isPending}
            >
              {createSwapRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}