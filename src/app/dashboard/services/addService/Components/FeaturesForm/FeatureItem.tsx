import { Button } from "@/src/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { X } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; // or your i18n hook

interface FeatureItemProps {
  featureItemIndex: number;
  langCode: string;
  index: number;
  form: any;
  onRemoveFeatureItem: (langCode: string, index: number, featureItemIndex: number) => void;
}

// Fixed Feature Item component with i18n
export const FeatureItem = memo(({
  featureItemIndex,
  langCode,
  index,
  form,
  onRemoveFeatureItem
}: FeatureItemProps) => {
  const { t } = useTranslation(); // i18n hook
  
  // Create a stable reference for the field name
  const fieldName = `${langCode}.${index}.content.features.${featureItemIndex}`;
  const previousFieldNameRef = useRef(fieldName);
  
  // Update the ref when the field name changes
  useEffect(() => {
    previousFieldNameRef.current = fieldName;
  }, [fieldName]);
  
  const handleRemove = () => onRemoveFeatureItem(langCode, index, featureItemIndex);
  
  // Add data attributes for better debugging
  const dataAttributes = {
    'data-feature-item': true,
    'data-lang-code': langCode,
    'data-feature-index': index,
    'data-item-index': featureItemIndex,
  };
  
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex items-center gap-2" {...dataAttributes}>
          <div className="flex-1">
            <FormControl>
              <Input 
                placeholder={t('featuresForm.featureItem.placeholder', { number: featureItemIndex + 1 })} 
                {...field} 
                onChange={(e) => {
                  field.onChange(e);
                  // Force form to register this specific field value
                  const currentValues = form.getValues();
                  if (currentValues[langCode]?.[index]?.content?.features?.length > featureItemIndex) {
                    form.setValue(fieldName, e.target.value, { 
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </FormItem>
      )}
    />
  );
});

FeatureItem.displayName = "FeatureItem";