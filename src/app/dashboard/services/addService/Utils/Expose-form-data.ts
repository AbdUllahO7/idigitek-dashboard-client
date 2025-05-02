import { useImperativeHandle, RefObject } from 'react';
import { UseFormReturn } from 'react-hook-form';

// Base ref interface that all form refs extend
export interface BaseFormRef {
  form: UseFormReturn<any>;
  hasUnsavedChanges: boolean;
  resetUnsavedChanges: () => void;
  existingSubSectionId: string | null;
  contentElements: any[];
  getFormData: () => Promise<any>;
}

// Options for createFormRef
interface CreateFormRefOptions {
  form: UseFormReturn<any>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  existingSubSectionId: string | null;
  contentElements: any[];
  componentName: string;
  extraMethods?: Record<string, any>;
  extraData?: Record<string, any>;
}

/**
 * Generic function to create form refs with useImperativeHandle
 * 
 * @param ref - The ref object passed to the forwardRef component
 * @param options - Configuration options for the form ref
 */
export const createFormRef = (
  ref: any,
  options: CreateFormRefOptions
): void => {
  const {
    form,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    existingSubSectionId,
    contentElements,
    componentName,
    extraMethods = {},
    extraData = {}
  } = options;

  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger();
      if (!isValid) {
        throw new Error(`${componentName} form has validation errors`);
      }
      
      const formValues = form.getValues();
      return {
        ...formValues,
        ...extraData
      };
    },
    form,
    hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
    existingSubSectionId,
    contentElements,
    ...extraMethods
  }));
};