// src/components/users/DeleteUserDialog.tsx
import { Button } from "@/src/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle
} from "@/src/components/ui/dialog";
import { UserAvatar } from "./UserAvatar";
import { AlertTriangle, Loader2, Mail, Trash2 } from "lucide-react";
import { getAvatarColor, getFullName, getInitials } from "@/src/utils/user-helpers";
import { cn } from "@/src/lib/utils";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/context/LanguageContext";

interface DeleteUserDialogProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteUserDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteUserDialogProps) {
  const { t, ready } = useTranslation();
  const { isLoaded } = useLanguage();

  if (!user) return null;

  // Show loading state if translations aren't ready
  if (!ready || !isLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="ml-4 space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600 dark:text-red-500">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {t('DeleteUserDialog.title', 'Delete User')}
          </DialogTitle>
          <DialogDescription>
            {t('DeleteUserDialog.description', 'Are you sure you want to delete this user? This action cannot be undone.')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <UserAvatar user={user} size="sm" />
            <div className="ml-4">
              <p className="font-medium">{getFullName(user)}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mr-1" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('DeleteUserDialog.buttons.cancel', 'Cancel')}
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('DeleteUserDialog.buttons.deleting', 'Deleting...')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('DeleteUserDialog.buttons.deleteUser', 'Delete User')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}