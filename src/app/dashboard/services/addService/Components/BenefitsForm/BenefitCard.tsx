"use client"

import { memo, useState } from "react"
import { useTranslation } from "react-i18next" // or your i18n hook
import { X, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog"
import { IconComponent, IconNames } from "@/src/utils/MainSectionComponents"

interface BenefitCardProps {
  langCode: string
  index: number
  form: any
  isFirstLanguage: boolean
  syncIcons: (index: number, value: IconNames) => void
  availableIcons: readonly IconNames[]
  onDelete: (langCode: string, index: number) => void
}

/**
 * BenefitCard - Component for a single benefit within a language
 */
export const BenefitCard = memo(
  ({ langCode, index, form, isFirstLanguage, syncIcons, availableIcons, onDelete }: BenefitCardProps) => {
    const { t } = useTranslation() // i18n hook
    const [isCollapsed, setIsCollapsed] = useState(true)
    const handleDelete = () => onDelete(langCode, index)

    return (
      <Card className="border border-muted transition-all duration-200">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {t('benefitsForm.benefitCard.title', { number: index + 1 })}
            </CardTitle>
            {/* Collapse/Expand button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {/* Close button with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('benefitsForm.benefitCard.deleteDialog.title')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('benefitsForm.benefitCard.deleteDialog.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t('benefitsForm.benefitCard.deleteDialog.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('benefitsForm.benefitCard.deleteDialog.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        {/* Collapsible content */}
        {!isCollapsed && (
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Icon selector for primary language only */}
            {isFirstLanguage ? (
              <FormField
                control={form.control}
                name={`${langCode}.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('benefitsForm.benefitCard.fields.icon.label')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Sync this icon value to all other languages
                        syncIcons(index, value as IconNames)
                      }}
                      defaultValue={field.value || "Clock"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('benefitsForm.benefitCard.fields.icon.placeholder')}>
                            <div className="flex items-center">
                              <span className="mr-2">
                                <IconComponent iconName={field.value || "Clock"} />
                              </span>
                              {field.value || "Clock"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableIcons.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center">
                              <span className="mr-2">
                                <IconComponent iconName={icon} />
                              </span>
                              {icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="mb-4">
                <FormLabel className="block mb-2">
                  {t('benefitsForm.benefitCard.fields.icon.label')}
                </FormLabel>
                <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                  <span className="mr-2">
                    <IconComponent iconName={form.watch(`${langCode}.${index}.icon`) || "Clock"} />
                  </span>
                  {form.watch(`${langCode}.${index}.icon`) || "Clock"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t('benefitsForm.benefitCard.fields.icon.controlledHint')}
                  </span>
                </div>
              </div>
            )}

            {/* Title Field */}
            <FormField
              control={form.control}
              name={`${langCode}.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('benefitsForm.benefitCard.fields.title.label')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('benefitsForm.benefitCard.fields.title.placeholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name={`${langCode}.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('benefitsForm.benefitCard.fields.description.label')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('benefitsForm.benefitCard.fields.description.placeholder')} 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        )}
      </Card>
    )
  },
)

BenefitCard.displayName = "BenefitCard"

export default BenefitCard