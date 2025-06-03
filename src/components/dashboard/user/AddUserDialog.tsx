"use client"

// src/components/users/AddUserDialog.tsx
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { getRoleIcon } from "@/src/utils/user-helpers"
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  Plus,
  UserIcon,
  Shield,
  CheckCircle2,
} from "lucide-react"
import type React from "react"
import { UserStatus } from "@/src/api/user.types"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/src/context/LanguageContext"

interface UserFormData {
  id?: string
  firstName?: string
  lastName?: string
  email: string
  password?: string
  confirmPassword?: string
  role?: string
  status: UserStatus
}

interface AddUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  formData: UserFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRoleChange: (value: string) => void
  onStatusChange: (value: UserStatus) => void
  passwordError: string
  formError: string | null
  isCreating: boolean
  superOwnerExists: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  toggleShowPassword: () => void
  toggleShowConfirmPassword: () => void
}

export function AddUserDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  onRoleChange,
  onStatusChange,
  passwordError,
  formError,
  isCreating,
  superOwnerExists,
  showPassword,
  showConfirmPassword,
  toggleShowPassword,
  toggleShowConfirmPassword,
}: AddUserDialogProps) {
  const { t, ready } = useTranslation();
  const { isLoaded, language } = useLanguage();
  const isRTL = language === 'ar';

  // Function to get status icon and color
  const getStatusInfo = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, color: "text-emerald-500" }
      case UserStatus.INACTIVE:
        return { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, color: "text-amber-500" }
      case UserStatus.SUSPENDED:
        return { icon: <Shield className="h-4 w-4 text-red-500" />, color: "text-red-500" }
      case UserStatus.PENDING:
        return { icon: <Info className="h-4 w-4 text-blue-500" />, color: "text-blue-500" }
      default:
        return { icon: <Info className="h-4 w-4" />, color: "" }
    }
  }

  const statusInfo = getStatusInfo(formData.status)

  // Show loading state if translations aren't ready
  if (!ready || !isLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg border shadow-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </DialogHeader>
          <ScrollArea className="p-6 pt-4 max-h-[calc(80vh-220px)]">
            <div className="grid gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg border shadow-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <DialogTitle className={`text-xl font-semibold flex items-center ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={`bg-blue-100 dark:bg-blue-900 p-2 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}>
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            {t('AddUserDialog.title', 'Add New User')}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1.5">
            {t('AddUserDialog.description', 'Create a new user account by filling out the form below.')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="p-6 pt-4 max-h-[calc(80vh-220px)]">
          {formError && (
            <Alert
              variant="destructive"
              className="mb-5 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-firstName" className="text-sm font-medium">
                  {t('AddUserDialog.fields.firstName', 'First Name')}
                </Label>
                <div className="relative">
                  <Input
                    id="new-firstName"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={onChange}
                    placeholder={t('AddUserDialog.placeholders.firstName', 'First name')}
                    className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                  <UserIcon className={`absolute top-3 h-4 w-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-lastName" className="text-sm font-medium">
                  {t('AddUserDialog.fields.lastName', 'Last Name')}
                </Label>
                <div className="relative">
                  <Input
                    id="new-lastName"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={onChange}
                    placeholder={t('AddUserDialog.placeholders.lastName', 'Last name')}
                    className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                  <UserIcon className={`absolute top-3 h-4 w-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email" className="text-sm font-medium">
                {t('AddUserDialog.fields.email', 'Email Address')}
              </Label>
              <div className="relative">
                <Input
                  id="new-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder={t('AddUserDialog.placeholders.email', 'user@example.com')}
                  className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                />
                <Mail className={`absolute top-3 h-4 w-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                {t('AddUserDialog.fields.password', 'Password')}
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={onChange}
                  placeholder={t('AddUserDialog.placeholders.password', 'Enter password')}
                  className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9 pl-10' : 'pl-9 pr-10'}`}
                />
                <Lock className={`absolute top-3 h-4 w-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ${isRTL ? 'left-0' : 'right-0'}`}
                  onClick={toggleShowPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">
                    {showPassword ? 
                      t('AddUserDialog.accessibility.hidePassword', 'Hide password') : 
                      t('AddUserDialog.accessibility.showPassword', 'Show password')
                    }
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-confirm-password" className="text-sm font-medium">
                {t('AddUserDialog.fields.confirmPassword', 'Confirm Password')}
              </Label>
              <div className="relative">
                <Input
                  id="new-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword || ""}
                  onChange={onChange}
                  placeholder={t('AddUserDialog.placeholders.confirmPassword', 'Confirm password')}
                  className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9 pl-10' : 'pl-9 pr-10'}`}
                />
                <Lock className={`absolute top-3 h-4 w-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute top-0 h-full px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ${isRTL ? 'left-0' : 'right-0'}`}
                  onClick={toggleShowConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">
                    {showConfirmPassword ? 
                      t('AddUserDialog.accessibility.hidePassword', 'Hide password') : 
                      t('AddUserDialog.accessibility.showPassword', 'Show password')
                    }
                  </span>
                </Button>
              </div>
              {passwordError && (
                <p className={`text-sm text-red-500 mt-1 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AlertTriangle className={`h-3 w-3 flex-shrink-0 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="space-y-2 pb-5">
                <Label htmlFor="new-role" className="text-sm font-medium">
                  {t('AddUserDialog.fields.role', 'User Role')}
                </Label>
                <Select value={formData.role || "user"} onValueChange={onRoleChange}>
                  <SelectTrigger
                    id="new-role"
                    className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9' : 'pl-9'}`}
                  >
                    <SelectValue placeholder={t('AddUserDialog.placeholders.role', 'Select a role')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
                    <SelectItem value="user" className="py-2.5">
                      {t('AddUserDialog.roles.user', 'User')}
                    </SelectItem>
                    <SelectItem value="admin" className="py-2.5">
                      {t('AddUserDialog.roles.admin', 'Admin')}
                    </SelectItem>
                    <SelectItem value="superAdmin" className="py-2.5">
                      {t('AddUserDialog.roles.superAdmin', 'Super Admin')}
                    </SelectItem>
                    <SelectItem value="owner" className="py-2.5">
                      {t('AddUserDialog.roles.owner', 'Owner')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {superOwnerExists && formData.role?.toLowerCase() === "owner" && (
                  <div className={`text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Info className={`h-3 w-3 flex-shrink-0 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('AddUserDialog.ownerWarning', 'An owner already exists in the system')}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status" className="text-sm font-medium">
                  {t('AddUserDialog.fields.status', 'Account Status')}
                </Label>
                <Select value={formData.status} onValueChange={onStatusChange}>
                  <SelectTrigger
                    id="new-status"
                    className={`h-10 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 ${isRTL ? 'pr-9' : 'pl-9'}`}
                  >
                    <SelectValue placeholder={t('AddUserDialog.placeholders.status', 'Select status')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
                    <SelectItem value={UserStatus.ACTIVE} className="py-2.5">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle2 className={`h-4 w-4 text-emerald-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span>{t('AddUserDialog.statuses.active', 'Active')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={UserStatus.INACTIVE} className="py-2.5">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <AlertTriangle className={`h-4 w-4 text-amber-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span>{t('AddUserDialog.statuses.inactive', 'Inactive')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED} className="py-2.5">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Shield className={`h-4 w-4 text-red-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span>{t('AddUserDialog.statuses.suspended', 'Suspended')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={UserStatus.PENDING} className="py-2.5">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Info className={`h-4 w-4 text-blue-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span>{t('AddUserDialog.statuses.pending', 'Pending')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className={`p-6 bg-slate-50 dark:bg-slate-900 border-t flex-col sm:flex-row gap-3 sm:gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {t('AddUserDialog.buttons.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isCreating || !!formError}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 transition-all duration-200"
          >
            {isCreating ? (
              <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('AddUserDialog.buttons.creating', 'Creating...')}
              </div>
            ) : (
              <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('AddUserDialog.buttons.createUser', 'Create User')}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}