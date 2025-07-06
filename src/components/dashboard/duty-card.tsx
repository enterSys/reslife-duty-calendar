"use client"

import { useState } from "react"
import { ArrowRightLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SwapRequestDialog } from "./swap-request-dialog"

interface DutyCardProps {
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

export function DutyCard({ duty }: DutyCardProps) {
  const [showSwapDialog, setShowSwapDialog] = useState(false)

  return (
    <>
      <div className="bg-card border rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{duty.user.fullName}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {duty.dutyType}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {duty.user.email}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setShowSwapDialog(true)}
          >
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Swap
          </Button>
        </div>
      </div>

      <SwapRequestDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        duty={duty}
      />
    </>
  )
}