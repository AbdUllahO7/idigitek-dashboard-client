"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"

interface ImportDataDialogProps {
  onLoadSampleData: () => void
}

export function ImportDataDialog({ onLoadSampleData }: ImportDataDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Service Data</DialogTitle>
          <DialogDescription>Upload a JSON file or load sample data to populate the form.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Upload JSON File</Label>
            <Input type="file" accept=".json" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">- OR -</p>
            <Button
              onClick={() => {
                onLoadSampleData()
                setOpen(false)
              }}
              variant="secondary"
            >
              Load Sample Data
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
