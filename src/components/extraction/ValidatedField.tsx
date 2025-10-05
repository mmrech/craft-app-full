import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { useFieldValidation } from "@/hooks/useFieldValidation";
import { cn } from "@/lib/utils";

interface ValidatedFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
}

export const ValidatedField = ({ 
  name, 
  label, 
  type = "text",
  placeholder,
  step 
}: ValidatedFieldProps) => {
  const { formData, updateFormData } = useExtraction();
  const { validateField, getFieldValidation } = useFieldValidation();
  const validations = getFieldValidation(name);

  useEffect(() => {
    if (formData[name]) {
      const timer = setTimeout(() => {
        validateField(name, formData[name], formData);
      }, 1000); // Debounce validation by 1 second

      return () => clearTimeout(timer);
    }
  }, [formData[name], name, formData, validateField]);

  const hasError = validations?.some?.(v => v.type === 'error') || false;
  const hasWarning = validations?.some?.(v => v.type === 'warning') || false;
  const hasSuccess = validations?.some?.(v => v.type === 'success') && !hasError && !hasWarning;

  const getIcon = () => {
    if (hasError) return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (hasWarning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (hasSuccess) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return null;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={name}>{label}</Label>
        {getIcon()}
      </div>
      <Input
        id={name}
        type={type}
        step={step}
        value={formData[name] || ''}
        onChange={(e) => updateFormData(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          hasError && "border-destructive focus-visible:ring-destructive",
          hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
          hasSuccess && "border-green-500 focus-visible:ring-green-500"
        )}
      />
      {validations && validations.length > 0 && (
        <div className="space-y-1">
          {validations.map((validation, idx) => (
            <div key={idx} className="text-xs space-y-0.5">
              <p className={cn(
                validation.type === 'error' && "text-destructive",
                validation.type === 'warning' && "text-yellow-600",
                validation.type === 'success' && "text-green-600"
              )}>
                {validation.message}
              </p>
              {validation.suggestion && (
                <p className="text-muted-foreground italic">
                  💡 {validation.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};