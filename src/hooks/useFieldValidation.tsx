import { useState, useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

export const useFieldValidation = () => {
  const [validationState, setValidationState] = useState<Record<string, ValidationResult>>({});

  const validateField = useCallback((fieldName: string, value: any, rules?: any): ValidationResult => {
    // Simple validation for personal use
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, message: 'This field is required', type: 'error' };
    }
    
    return { isValid: true, type: 'success' };
  }, []);

  const setFieldValidation = useCallback((fieldName: string, result: ValidationResult) => {
    setValidationState(prev => ({
      ...prev,
      [fieldName]: result
    }));
  }, []);

  const getFieldValidation = useCallback((fieldName: string): ValidationResult[] => {
    const validation = validationState[fieldName];
    if (!validation || validation.isValid) {
      return [];
    }
    return [validation];
  }, [validationState]);

  const clearValidation = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  }, []);

  return {
    validateField,
    setFieldValidation,
    getFieldValidation,
    clearValidation,
    validationState
  };
};
