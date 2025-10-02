import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ValidationResult {
  field: string;
  type: 'error' | 'warning' | 'success';
  message: string;
  suggestion?: string;
}

export const useFieldValidation = () => {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateField = useCallback(async (
    fieldName: string,
    fieldValue: any,
    formData: Record<string, any>
  ) => {
    if (!fieldValue) {
      setValidationResults(prev => ({ ...prev, [fieldName]: [] }));
      return;
    }

    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-clinical-data', {
        body: { fieldName, fieldValue, formData }
      });

      if (error) throw error;

      if (data.success) {
        setValidationResults(prev => ({
          ...prev,
          [fieldName]: data.validations
        }));

        // Show toast for errors and warnings
        const errors = data.validations.filter((v: ValidationResult) => v.type === 'error');
        const warnings = data.validations.filter((v: ValidationResult) => v.type === 'warning');

        if (errors.length > 0) {
          toast({
            title: "Validation Error",
            description: errors[0].message,
            variant: "destructive",
          });
        } else if (warnings.length > 0) {
          toast({
            title: "Validation Warning",
            description: warnings[0].message,
          });
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const clearValidation = useCallback((fieldName: string) => {
    setValidationResults(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  const getFieldValidation = useCallback((fieldName: string): ValidationResult[] => {
    return validationResults[fieldName] || [];
  }, [validationResults]);

  return {
    validateField,
    clearValidation,
    getFieldValidation,
    isValidating,
    validationResults
  };
};