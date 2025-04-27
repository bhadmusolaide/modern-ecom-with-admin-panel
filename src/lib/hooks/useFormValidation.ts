import { useState, useCallback, useEffect } from 'react';

type ValidationRule<T> = (value: any, formData: T) => string | null;

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
}

interface FormValidationResult<T> {
  errors: Partial<Record<keyof T, string>>;
  touchedFields: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  validateField: (name: keyof T) => boolean;
  validateAllFields: () => boolean;
  setFieldTouched: (name: keyof T, isTouched?: boolean) => void;
  clearErrors: () => void;
  hasError: (name: keyof T) => boolean;
  getError: (name: keyof T) => string | undefined;
}

/**
 * A hook for form validation
 * 
 * @param formData The form data to validate
 * @param validationRules Rules for validating each field
 * @param options Configuration options
 * @returns Form validation state and functions
 */
export function useFormValidation<T extends Record<string, any>>(
  formData: T,
  validationRules: ValidationRules<T>,
  options: ValidationOptions = {}
): FormValidationResult<T> {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
  } = options;

  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isValid, setIsValid] = useState(true);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T): boolean => {
      const fieldRules = validationRules[name];
      if (!fieldRules) return true;

      for (const rule of fieldRules) {
        const errorMessage = rule(formData[name], formData);
        if (errorMessage) {
          setErrors((prev) => ({ ...prev, [name]: errorMessage }));
          return false;
        }
      }

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    },
    [formData, validationRules]
  );

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    let isFormValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(validationRules).forEach((key) => {
      allTouched[key as keyof T] = true;
    });
    setTouchedFields(allTouched);

    // Validate each field
    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const fieldRules = validationRules[fieldName];
      if (!fieldRules) return;

      for (const rule of fieldRules) {
        const errorMessage = rule(formData[fieldName], formData);
        if (errorMessage) {
          newErrors[fieldName] = errorMessage;
          isFormValid = false;
          break;
        }
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [formData, validationRules]);

  // Set a field as touched
  const setFieldTouched = useCallback(
    (name: keyof T, isTouched: boolean = true) => {
      setTouchedFields((prev) => ({ ...prev, [name]: isTouched }));
      if (validateOnBlur && isTouched) {
        validateField(name);
      }
    },
    [validateField, validateOnBlur]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Check if a field has an error
  const hasError = useCallback(
    (name: keyof T): boolean => {
      return !!errors[name] && !!touchedFields[name];
    },
    [errors, touchedFields]
  );

  // Get the error message for a field
  const getError = useCallback(
    (name: keyof T): string | undefined => {
      return touchedFields[name] ? errors[name] : undefined;
    },
    [errors, touchedFields]
  );

  // Update isValid state when errors change
  useEffect(() => {
    setIsValid(Object.keys(errors).length === 0);
  }, [errors]);

  // Validate fields when form data changes
  useEffect(() => {
    if (validateOnChange) {
      Object.keys(touchedFields).forEach((key) => {
        if (touchedFields[key as keyof T]) {
          validateField(key as keyof T);
        }
      });
    }
  }, [formData, validateField, touchedFields, validateOnChange]);

  return {
    errors,
    touchedFields,
    isValid,
    validateField,
    validateAllFields,
    setFieldTouched,
    clearErrors,
    hasError,
    getError,
  };
}

export default useFormValidation;
