"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

// Sample data structure - in production, this would come from Google Sheets API
const SAMPLE_DATA = [
  { date: "1/2/2024", memberName: "John Doe" },
  { date: "1/3/2024", memberName: "Jane Smith" },
  { date: "1/4/2024", memberName: "Robert Johnson" },
  { date: "1/5/2024", memberName: "Emily Davis" },
  { date: "1/6/2024", memberName: "Michael Brown" },
  { date: "1/7/2024", memberName: "Sarah Wilson" },
  { date: "1/8/2024", memberName: "David Martinez" },
  { date: "1/9/2024", memberName: "Lisa Anderson" },
  { date: "1/10/2024", memberName: "James Taylor" },
  { date: "1/11/2024", memberName: "Mary Thomas" },
]

interface ImportResult {
  message: string
  imported: number
  skipped: number
  errors: Array<{
    date: string
    member: string
    error: string
  }>
}

export function ImportDutiesDialog() {
  const [open, setOpen] = useState(false)
  const [previewData, setPreviewData] = useState<typeof SAMPLE_DATA | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: async (data: typeof SAMPLE_DATA) => {
      const response = await fetch("/api/duties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import duties")
      }

      return response.json()
    },
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ["duties"] })
      toast.success(`Successfully imported ${result.imported} duties`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleFetchData = () => {
    // In production, this would fetch from Google Sheets API
    // For now, we'll use sample data
    setPreviewData(SAMPLE_DATA)
    setImportResult(null)
  }

  const handleImport = () => {
    if (previewData) {
      importMutation.mutate(previewData)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setPreviewData(null)
    setImportResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import from Sheets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Duties from Google Sheets</DialogTitle>
          <DialogDescription>
            Import duty assignments from your Google Sheets document. 
            Dates should be in column A and member names in column B.
          </DialogDescription>
        </DialogHeader>

        {!previewData && !importResult && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your Google Sheet has:
                <ul className="list-disc list-inside mt-2">
                  <li>Dates in column A (format: M/D/YYYY)</li>
                  <li>Member names in column B</li>
                  <li>Member names match exactly with registered users</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleFetchData}>
                Fetch Data from Google Sheets
              </Button>
            </div>
          </div>
        )}

        {previewData && !importResult && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Preview of duties to import. Please review before proceeding.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Shift Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((item, index) => {
                    const date = new Date(item.date)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.memberName}</TableCell>
                        <TableCell>
                          {isWeekend ? "Weekend (24h)" : "Weekday (6pm-8am)"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {importResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>
            
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Import Errors:</h4>
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      {error.date} - {error.member}: {error.error}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!importResult && previewData && (
            <>
              <Button
                variant="outline"
                onClick={() => setPreviewData(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importing..." : "Import Duties"}
              </Button>
            </>
          )}
          {importResult && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}