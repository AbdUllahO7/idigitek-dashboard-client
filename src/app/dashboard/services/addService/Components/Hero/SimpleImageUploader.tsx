"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/context/LanguageContext";
import { ImageIcon } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";

/**
 * SimpleImageUploader - Reusable image upload component with translations
 */
interface SimpleImageUploaderProps {
  imageValue?: string;
  inputId: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  altText?: string;
  acceptedTypes?: string;
}

export const SimpleImageUploader = memo(({
  imageValue,
  inputId,
  onUpload,
  onRemove,
  altText,
  acceptedTypes = "image/jpeg,image/png,image/gif,image/svg+xml"
}: SimpleImageUploaderProps) => {
  const { t } = useTranslation();
  const defaultAltText = altText || t('imageUploader.imagePreview', 'Image preview');
  const {language} = useLanguage()

  return (
    <div className="relative"  dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-primary transition-colors">
        {imageValue ? (
          <div className="relative w-full">
            <div className="w-full aspect-video relative rounded-md overflow-hidden">
              <img 
                src={imageValue} 
                alt={defaultAltText} 
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex justify-center mt-2 space-x-2">
              <label 
                htmlFor={inputId}
                className="inline-flex items-center px-3 py-1.5 border border-primary text-xs rounded-md font-medium bg-white text-primary cursor-pointer hover:bg-primary/10 transition-colors"
              >
                {t('imageUploader.replaceImage', 'Replace Image')}
              </label>
              <button 
                type="button"
                onClick={onRemove}
                className="inline-flex items-center px-3 py-1.5 border border-destructive text-xs rounded-md font-medium bg-white text-destructive cursor-pointer hover:bg-destructive/10 transition-colors"
              >
                {t('imageUploader.remove', 'Remove')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('imageUploader.dragAndDrop', 'Drag and drop or click to upload')}
            </p>
            <label 
              htmlFor={inputId}
              className="inline-flex items-center px-4 py-2 border border-primary text-sm rounded-md font-medium bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
            >
              {t('imageUploader.uploadImage', 'Upload Image')}
            </label>
          </div>
        )}
        <input
          id={inputId}
          type="file"
          accept={acceptedTypes}
          onChange={onUpload}
          className="hidden"
        />
      </div>
    </div>
  );
});

SimpleImageUploader.displayName = "SimpleImageUploader";

/**
 * BackgroundImageSection - Component for managing the hero background image with translations
 */
interface BackgroundImageSectionProps {
  imagePreview?: string;
  imageValue?: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  imageType?: string;
}

export const BackgroundImageSection = memo(({
  imagePreview,
  imageValue,
  onUpload,
  onRemove,
  imageType
}: BackgroundImageSectionProps) => {
  const { t } = useTranslation();

  const isLogo = imageType === "logo";
  const {language} = useLanguage()

  const getTitle = () => {
    return isLogo 
      ? t('imageUploader.logoImageUploading', 'Logo Image Uploading')
      : t('imageUploader.sectionImage', 'Section Image');
  };

  const getDescription = () => {
    return isLogo
      ? t('imageUploader.logoImageUploadingForHeader', 'Logo Image Uploading for header')
      : t('imageUploader.uploadImageForSection', 'Upload an image for the section (applies to all languages)');
  };

  const getLabelText = () => {
    return isLogo
      ? t('imageUploader.logo', 'Logo')
      : t('imageUploader.backgroundImage', 'Background Image');
  };

  const getAltText = () => {
    return isLogo
      ? t('imageUploader.imagePreview', 'Image preview')
      : t('imageUploader.backgroundImagePreview', 'Background image preview');
  };

  return (
    <div className="mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4" />
                {getLabelText()}
                <span className="text-xs text-muted-foreground">
                  {t('imageUploader.appliesToAllLanguages', '(applies to all languages)')}
                </span>
              </Label>
              <SimpleImageUploader
                imageValue={imagePreview || imageValue}
                inputId="file-upload-background-image"
                onUpload={onUpload}
                onRemove={onRemove}
                altText={getAltText()}
                acceptedTypes="image/jpeg,image/png,image/gif,image/svg+xml"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

BackgroundImageSection.displayName = "BackgroundImageSection";