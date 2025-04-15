// src/utils/form.ts
import { useState, FormEvent } from 'react';

// Generic type for form values
type FormValues = Record<string, any>;

// Generic type for form errors
type FormErrors<T> = Partial<Record<keyof T, string>>;

// Validator function type
type Validator<T> = (values: T) => FormErrors<T>;

// Hook for form handling
export function useForm<T extends FormValues>(
  initialValues: T,
  validate?: Validator<T>,
  onSubmit?: (values: T) => Promise<void> | void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setValues({
        ...values,
        [name]: checkbox.checked,
      });
      return;
    }
    
    // Handle normal inputs
    setValues({
      ...values,
      [name]: value,
    });
    
    // Clear error for this field when it changes
    if (errors[name as keyof T]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate if validator function is provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      // If there are errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    // Submit if onSubmit function is provided
    if (onSubmit) {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } catch (err) {
        console.error('Form submission error:', err);
        // You could set a generic form error here if needed
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Reset form to initial values
  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };
  
  // Set a specific value
  const setValue = (name: keyof T, value: any) => {
    setValues({
      ...values,
      [name]: value,
    });
  };
  
  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValue,
    setValues,
  };
}

// Example validator utility function
export function required(value: any, fieldName: string): string | undefined {
  return value ? undefined : `${fieldName} is required`;
}

// Example email validator utility function
export function isEmail(value: string): string | undefined {
  return /\S+@\S+\.\S+/.test(value) ? undefined : 'Invalid email address';
}

// Example minimum length validator utility function
export function minLength(value: string, min: number): string | undefined {
  return value.length >= min ? undefined : `Must be at least ${min} characters`;
}