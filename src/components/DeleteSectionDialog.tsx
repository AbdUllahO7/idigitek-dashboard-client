"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface DeleteSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName?: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  title?: string;
  confirmText?: string;
  itemType?: 'section' | 'item' | 'service' | 'project' | 'user' | 'language' | 'website';
}

export default function DeleteSectionDialog({
  open,
  onOpenChange,
  serviceName,
  onConfirm,
  isDeleting,
  title,
  confirmText,
  itemType = 'item'
}: DeleteSectionDialogProps) {
  const { t } = useTranslation();
  
  // Get default title based on item type
  const getDefaultTitle = () => {
    switch (itemType) {
      case 'section':
        return t('deleteDialog.deleteSection', 'Delete Section');
      case 'service':
        return t('deleteDialog.deleteService', 'Delete Service');
      case 'project':
        return t('deleteDialog.deleteProject', 'Delete Project');
      case 'user':
        return t('deleteDialog.deleteUser', 'Delete User');
      case 'language':
        return t('deleteDialog.deleteLanguage', 'Delete Language');
      case 'website':
        return t('deleteDialog.deleteWebsite', 'Delete Website');
      default:
        return t('deleteDialog.deleteItem', 'Delete Item');
    }
  };

  // Get default confirm text
  const getDefaultConfirmText = () => {
    return confirmText || t('deleteDialog.confirmDelete', 'Confirm Delete');
  };

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const dialogTitle = title || getDefaultTitle();
  const buttonText = getDefaultConfirmText();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {t('deleteDialog.areYouSure', 'Are you sure you want to delete')}{' '}
            <span className="font-semibold">{serviceName}</span>
            {t('deleteDialog.actionCannotBeUndone', '? This action cannot be undone.')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="ml-2"
          >
            {t('deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleteDialog.deleting', 'Deleting...')}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}