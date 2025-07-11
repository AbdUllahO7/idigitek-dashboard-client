"use client"

import { memo, useState } from "react"
import { Trash2, ChevronDown, ChevronUp } from "lucide-react"
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
import { IconComponent, type IconNames } from "@/src/utils/MainSectionComponents"
import type { ClientCommentsCardCardProps } from "@/src/api/types/sections/clientComments/clientComments.type"
import { cn } from "@/src/lib/utils"
import { useTranslation } from "react-i18next"

/**
 * ClientCommentsCard - Component for a single client comment within a language
 */
export const ClientCommentsCard = memo(
  ({ langCode, index, form, isFirstLanguage, syncIcons, availableIcons, onDelete }: ClientCommentsCardCardProps) => {
    const { t } = useTranslation() // Use clientCommentsCard namespace
    const [isCollapsed, setIsCollapsed] = useState(true)

    const handleDelete = () => onDelete(langCode, index)

    const toggleCollapse = () => {
      setIsCollapsed(!isCollapsed)
    }

    return (
      <Card className="border border-muted">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t('clientCommentsCard.commentTitle', 'Comment {{number}}', { number: index + 1 })}
          </CardTitle>
          <div className="flex items-center space-x-1">
            {/* Collapse/Expand Button */}
            <Button type="button" variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Collapsible Content */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "max-h-0" : "max-h-[1000px]",
          )}
        >
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Icon selector for primary language only */}
            {isFirstLanguage ? (
              <FormField
                control={form.control}
                name={`${langCode}.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientCommentsCard.iconLabel', 'Icon')}</FormLabel>
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
                          <SelectValue placeholder={t('clientCommentsCard.iconPlaceholder', 'Select an icon')}>
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
                <FormLabel className="block mb-2">{t('clientCommentsCard.iconLabel', 'Icon')}</FormLabel>
                <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                  <span className="mr-2">
                    <IconComponent iconName={form.watch(`${langCode}.${index}.icon`) || "Clock"} />
                  </span>
                  {form.watch(`${langCode}.${index}.icon`) || "Clock"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t('clientCommentsCard.iconControlledByPrimary', '(Controlled by primary language)')}
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
                  <FormLabel>{t('clientCommentsCard.titleLabel', 'Title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('clientCommentsCard.titlePlaceholder', 'Enter title')} {...field} />
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
                  <FormLabel>{t('clientCommentsCard.descriptionLabel', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('clientCommentsCard.descriptionPlaceholder', 'Enter description')}
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </div>
      </Card>
    )
  },
)

ClientCommentsCard.displayName = "ClientCommentsCard"
