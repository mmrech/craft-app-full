import { useExtraction } from "@/contexts/ExtractionContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ExtractableFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
  step?: string;
}

const ExtractableField = ({
  name,
  label,
  type = 'text',
  required = false,
  placeholder = "Click here then highlight in PDF",
  step
}: ExtractableFieldProps) => {
  const { activeField, setActiveField, setActiveFieldElement, formData, updateFormData } = useExtraction();
  
  const isActive = activeField === name;
  const hasValue = formData[name];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActiveField(name);
    setActiveFieldElement(e.target);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData(name, e.target.value);
  };

  const commonProps = {
    id: name,
    name,
    value: formData[name] || '',
    onFocus: handleFocus,
    onChange: handleChange,
    placeholder,
    required,
    className: cn(
      "transition-all",
      isActive && "ring-2 ring-primary bg-orange-50 dark:bg-orange-950/20",
      hasValue && "bg-green-50 dark:bg-green-950/20 border-green-500"
    )
  };

  return (
    <div className={cn(
      "space-y-1.5 p-2 rounded transition-all",
      isActive && "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500"
    )}>
      <Label htmlFor={name} className="font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {type === 'textarea' ? (
        <Textarea {...commonProps} rows={3} />
      ) : (
        <Input
          {...commonProps}
          type={type}
          step={step}
        />
      )}
    </div>
  );
};

export default ExtractableField;
