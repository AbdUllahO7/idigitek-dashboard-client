"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "@/src/components/ui/use-toast"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"

interface DialogCreateSectionItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onServiceCreated: (serviceId: string) => void;
}

export default function DialogCreateSectionItem({ 
  open, 
  onOpenChange, 
  sectionId, 
  onServiceCreated 
}: DialogCreateSectionItemProps) {
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Get create hook from useSectionItems
  const { useCreate: useCreateSectionItem } = useSectionItems()
  const createSectionItem = useCreateSectionItem()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create basic service section item
      const sectionItemPayload = {
        name: name.trim(),
        description: description.trim(),
        isActive: true,
        section: sectionId
      }

      // Create the service
      const result = await createSectionItem.mutateAsync(sectionItemPayload)
      console.log("Created new service:", result)

      toast({
        title: "Service created",
        description: "Now you can add details to your service",
      })

      // Close dialog and pass the new service ID to the callback
      if (onServiceCreated && result.data?._id) {
        onServiceCreated(result.data._id)
      }
    } catch (error: any) {
      console.error("Failed to create service:", error)
      toast({
        title: "Error creating service",
        description: error.message || "An error occurred while creating the service",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("")
      setDescription("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Enter the basic information for your new service. You'll be able to add more details after creating it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter service name"
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}