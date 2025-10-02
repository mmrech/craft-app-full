import ExtractableField from "../ExtractableField";
import { AIExtractionButton } from "../AIExtractionButton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExtraction } from "@/contexts/ExtractionContext";

const Step2PICOT = () => {
  const { formData, updateFormData } = useExtraction();
  const pdfText = formData._pdfFullText || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 2: PICO-T
        </h2>
        <AIExtractionButton 
          extractionType="picot"
          pdfText={pdfText}
          label="AI Extract PICOT"
        />
      </div>

      <ExtractableField
        name="eligibility-population"
        label="Population"
        type="textarea"
      />

      <ExtractableField
        name="eligibility-intervention"
        label="Intervention"
        type="textarea"
      />

      <ExtractableField
        name="eligibility-comparator"
        label="Comparator"
        type="textarea"
      />

      <ExtractableField
        name="eligibility-outcomes"
        label="Outcomes Measured"
        type="textarea"
      />

      <div className="grid grid-cols-2 gap-4">
        <ExtractableField
          name="eligibility-timing"
          label="Timing/Follow-up"
        />
        <ExtractableField
          name="eligibility-type"
          label="Study Type (e.g., RCT, Cohort)"
        />
      </div>

      <div className="space-y-1.5 p-2 rounded">
        <Label htmlFor="inclusion-met" className="font-semibold">
          Inclusion Criteria Met? <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData['inclusion-met'] || ''}
          onValueChange={(value) => updateFormData('inclusion-met', value)}
        >
          <SelectTrigger id="inclusion-met">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No (Stop Extraction)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Step2PICOT;
