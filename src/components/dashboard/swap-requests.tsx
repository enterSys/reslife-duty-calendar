"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowRightLeft, Check, X, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface SwapRequestsProps {
  userId: string
}

export function SwapRequests({ userId }: SwapRequestsProps) {
  const queryClient = useQueryClient()

  const { data: swaps, isLoading } = useQuery({
    queryKey: ["swaps", userId],
    queryFn: async () => {
      const response = await fetch(`/api/swaps?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch swaps")
      return response.json()
    },
  })

  const updateSwapStatus = useMutation({
    mutationFn: async ({ swapId, status }: { swapId: number; status: "accepted" | "rejected" }) => {
      const response = await fetch(`/api/swaps/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to update swap")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] })
      queryClient.invalidateQueries({ queryKey: ["duties"] })
      toast.success("Swap request updated")
    },
    onError: () => {
      toast.error("Failed to update swap request")
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  const pendingSwaps = swaps?.filter((swap: any) => swap.status === "pending") || []
  const completedSwaps = swaps?.filter((swap: any) => swap.status !== "pending") || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4 text-green-600" />
      case "rejected":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Pending Requests</h3>
        {pendingSwaps.length === 0 ? (
          <p className="text-muted-foreground">No pending swap requests</p>
        ) : (
          <div className="space-y-3">
            {pendingSwaps.map((swap: any) => {
              const isRequester = swap.requesterId === parseInt(userId)
              
              return (
                <Card key={swap.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {isRequester ? "You requested" : "Request from"} {isRequester ? "from" : ""} {isRequester ? swap.requestedWith.fullName : swap.requester.fullName}
                      </span>
                      {getStatusBadge(swap.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Your Duty</p>
                        <p>{format(new Date(isRequester ? swap.requesterDuty.dutyDate : swap.requestedDuty.dutyDate), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Their Duty</p>
                        <p>{format(new Date(isRequester ? swap.requestedDuty.dutyDate : swap.requesterDuty.dutyDate), "MMM d, yyyy")}</p>
                      </div>
                    </div>

                    {swap.reason && (
                      <p className="text-sm text-muted-foreground italic">
                        "{swap.reason}"
                      </p>
                    )}

                    {!isRequester && swap.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateSwapStatus.mutate({ swapId: swap.id, status: "accepted" })}
                          disabled={updateSwapStatus.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSwapStatus.mutate({ swapId: swap.id, status: "rejected" })}
                          disabled={updateSwapStatus.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Completed Requests</h3>
        {completedSwaps.length === 0 ? (
          <p className="text-muted-foreground">No completed swap requests</p>
        ) : (
          <div className="space-y-3">
            {completedSwaps.slice(0, 5).map((swap: any) => (
              <Card key={swap.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(swap.status)}
                    <span className="text-sm">
                      Swap with {swap.requesterId === parseInt(userId) ? swap.requestedWith.fullName : swap.requester.fullName}
                    </span>
                  </div>
                  {getStatusBadge(swap.status)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}