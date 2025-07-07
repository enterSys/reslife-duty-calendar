"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parse, isValid } from "date-fns"
import { Upload, AlertCircle, CheckCircle2, Clipboard, FileSpreadsheet } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  { date: "02/01/2024", memberName: "John Doe" },
  { date: "03/01/2024", memberName: "Jane Smith" },
  { date: "04/01/2024", memberName: "Robert Johnson" },
  { date: "05/01/2024", memberName: "Emily Davis" },
  { date: "06/01/2024", memberName: "Michael Brown" },
  { date: "07/01/2024", memberName: "Sarah Wilson" },
  { date: "08/01/2024", memberName: "David Martinez" },
  { date: "09/01/2024", memberName: "Lisa Anderson" },
  { date: "10/01/2024", memberName: "James Taylor" },
  { date: "11/01/2024", memberName: "Mary Thomas" },
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
  const [pastedData, setPastedData] = useState("")
  const [importMethod, setImportMethod] = useState<"sheets" | "paste">("paste")
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

  const parseDate = (dateString: string): string => {
    // Remove day names (Mon, Tue, etc.) if present
    let cleanDate = dateString.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/i, '').trim()
    
    // Try different date formats
    const formats = [
      'dd/MM/yyyy',      // DD/MM/YYYY
      'dd/MM/yy',        // DD/MM/YY  
      'MM/dd/yyyy',      // MM/DD/YYYY (US format)
      'MM/dd/yy',        // MM/DD/YY
      'd/M/yyyy',        // D/M/YYYY
      'd/M/yy',          // D/M/YY
      'yyyy-MM-dd',      // ISO format
    ]
    
    for (const formatString of formats) {
      try {
        const parsedDate = parse(cleanDate, formatString, new Date())
        if (isValid(parsedDate)) {
          // Return in DD/MM/YYYY format
          return format(parsedDate, 'dd/MM/yyyy')
        }
      } catch {
        continue
      }
    }
    
    // If no format worked, try to parse as natural date
    try {
      const parsedDate = new Date(cleanDate)
      if (isValid(parsedDate)) {
        return format(parsedDate, 'dd/MM/yyyy')
      }
    } catch {
      // Fall through
    }
    
    throw new Error(`Invalid date format: ${dateString}`)
  }

  const parsePastedData = (data: string) => {
    try {
      const lines = data.trim().split('\n')
      const parsed = lines.map((line, index) => {
        // Split by tab or comma (common copy/paste formats)
        const columns = line.split(/\t|,/)
        if (columns.length >= 2) {
          const rawDate = columns[0].trim()
          const memberName = columns[1].trim()
          
          try {
            const formattedDate = parseDate(rawDate)
            return {
              date: formattedDate,
              memberName: memberName
            }
          } catch (error) {
            throw new Error(`Line ${index + 1}: ${error instanceof Error ? error.message : 'Invalid date'}`)
          }
        }
        return null
      }).filter(Boolean) as { date: string; memberName: string }[]
      
      if (parsed.length === 0) {
        throw new Error("No valid data found")
      }
      
      return parsed
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Invalid data format. Please ensure data is in two columns: Date and Member Name")
    }
  }

  const handlePastedDataPreview = () => {
    try {
      const parsed = parsePastedData(pastedData)
      setPreviewData(parsed)
      setImportResult(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse data")
    }
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
    setPastedData("")
    setImportMethod("paste")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Duties
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Duties</DialogTitle>
          <DialogDescription>
            Import duty assignments from Google Sheets or by pasting data directly.
          </DialogDescription>
        </DialogHeader>

        {!previewData && !importResult && (
          <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as "sheets" | "paste")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste">
                <Clipboard className="h-4 w-4 mr-2" />
                Paste Data
              </TabsTrigger>
              <TabsTrigger value="sheets">
                <Upload className="h-4 w-4 mr-2" />
                Google Sheets
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="paste" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Copy data from your spreadsheet and paste it below. Format:
                  <ul className="list-disc list-inside mt-2">
                    <li>Two columns: Date and Member Name</li>
                    <li>Dates can include day names: "Mon 07/01/2025" or just "07/01/2025"</li>
                    <li>Accepts DD/MM/YYYY, MM/DD/YYYY, or various other formats</li>
                    <li>All dates will be converted to DD/MM/YYYY format</li>
                    <li>Member names must match registered users exactly</li>
                    <li>Separate columns with tabs or commas</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="paste-data">Paste your data here:</Label>
                <Textarea
                  id="paste-data"
                  placeholder="Mon 07/01/2025	John Doe
Tue 08/01/2025	Jane Smith
Wed 09/01/2025	Robert Johnson"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handlePastedDataPreview}
                  disabled={!pastedData.trim()}
                >
                  Preview Pasted Data
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="sheets" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your Google Sheet has:
                  <ul className="list-disc list-inside mt-2">
                    <li>Dates in column A (accepts various formats, will convert to DD/MM/YYYY)</li>
                    <li>Can include day names: "Mon 07/01/2025" or just "07/01/2025"</li>
                    <li>Member names in column B</li>
                    <li>Member names match exactly with registered users</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button onClick={handleFetchData}>
                  <Upload className="h-4 w-4 mr-2" />
                  Fetch Data from Google Sheets
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
                onClick={() => {
                  setPreviewData(null)
                  setPastedData("")
                }}
              >
                Back
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